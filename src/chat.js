import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, StyleSheet, Image, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { firestore, auth, storage } from './firebase/firebaseconfig';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, deleteDoc, writeBatch, updateDoc, arrayRemove, increment, where, getDocs, limit, startAfter} from 'firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ImageResizer from 'react-native-image-resizer';
import Video from 'react-native-video';


const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lastVisibleMessage, setLastVisibleMessage] = useState(null);
  const route = useRoute();
  const navigation = useNavigation(); 
  const { chatId, recipientUid } = route.params;
  const flatListRef = useRef(null);
  const currentUser = auth.currentUser;
  const messageLimit = 20;

  useEffect(() => {
    const fetchUserProfiles = async () => {
      const userIds = [currentUser.uid, recipientUid];

      const profiles = await Promise.all(userIds.map(async (uid) => {
        const userDoc = await getDoc(doc(firestore, 'users', uid));
        return { uid, ...userDoc.data() };
      }));

      const profilesMap = profiles.reduce((acc, profile) => {
        acc[profile.uid] = profile;
        return acc;
      }, {});

      setUserProfiles(profilesMap);
    };

    fetchUserProfiles();
  }, [recipientUid, currentUser.uid]);

  useEffect(() => {
    loadMessages();
  }, [chatId]);

  const loadMessages = async (loadMore = false) => {
    let messagesRef = collection(firestore, `chats/${chatId}/messages`);
    let q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));

    if (loadMore && lastVisibleMessage) {
      q = query(messagesRef, orderBy('timestamp', 'desc'), startAfter(lastVisibleMessage), limit(messageLimit));
    }

    const snapshot = await getDocs(q);
    const newMessages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setLastVisibleMessage(snapshot.docs[snapshot.docs.length - 1]);

    if (loadMore) {
      setMessages(prevMessages => [...newMessages.reverse(), ...prevMessages]);
    } else {
      setMessages(newMessages.reverse());
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  

  useEffect(() => {
    const messagesRef = collection(firestore, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesList);
      flatListRef.current?.scrollToEnd({ animated: true });

      // Reset unread message count for the sender
      const user = auth.currentUser;
      if (user.uid === recipientUid) {
        const unreadMessages = messagesList.filter(msg => !msg.isRead && msg.recipientId === user.uid);
        const batch = writeBatch(firestore);
        unreadMessages.forEach(msg => {
          const messageRef = doc(firestore, `chats/${chatId}/messages`, msg.id);
          batch.update(messageRef, { isRead: true });
        });
        await batch.commit();

        const senderRef = doc(firestore, 'users', recipientUid);
        await updateDoc(senderRef, {
          messageCount: 0,
        });
      }
    });

    return () => unsubscribe();
  }, [chatId, recipientUid]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const sendMessage = async (type = 'text', content) => {
    if (content.trim() || type !== 'text') {
      const user = auth.currentUser;
      const messagesRef = collection(firestore, `chats/${chatId}/messages`);
      const userRef = doc(firestore, 'users', user.uid);
      const recipientRef = doc(firestore, 'users', recipientUid);

      setMessage(''); 

      await addDoc(messagesRef, {
        senderId: user.uid,
        recipientId: recipientUid,
        message: type === 'text' ? content.trim() : '',
        fileUrl: type !== 'text' ? content : '',
        fileType: type !== 'text' ? type : '',
        timestamp: new Date(),
        isRead: false,
      });

      await updateDoc(userRef, {
        messageCount: increment(1),
      });

      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const selectFile = async () => {
    const result = await launchImageLibrary({
      mediaType: 'mixed',
      includeBase64: false,
    });

    if (result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      let fileUrl = '';
      let fileType = '';

      if (file.type.startsWith('image')) {
        const resizedImage = await ImageResizer.createResizedImage(file.uri, 800, 800, 'JPEG', 80);
        const fileName = file.fileName || `${Date.now()}.jpg`;
        const fileRef = ref(storage, `chats/${chatId}/${fileName}`);
        const response = await fetch(resizedImage.uri);
        const blob = await response.blob();
        await uploadBytes(fileRef, blob);
        fileUrl = await getDownloadURL(fileRef);
        fileType = 'image';
      } else if (file.type.startsWith('video')) {
        const fileName = file.fileName || `${Date.now()}.mp4`;
        const fileRef = ref(storage, `chats/${chatId}/${fileName}`);
        const response = await fetch(file.uri);
        const blob = await response.blob();
        await uploadBytes(fileRef, blob);
        fileUrl = await getDownloadURL(fileRef);
        fileType = 'video';
      }

      sendMessage(fileType, fileUrl);
    }
  };

  const deleteMessage = async (messageId) => {
    await deleteDoc(doc(firestore, `chats/${chatId}/messages`, messageId));
  };

  const toggleSelection = (messageId) => {
    const updatedSelectedMessages = new Set(selectedMessages);
    if (updatedSelectedMessages.has(messageId)) {
      updatedSelectedMessages.delete(messageId);
    } else {
      updatedSelectedMessages.add(messageId);
    }
    setSelectedMessages(updatedSelectedMessages);
  };

  const handleLongPress = (messageId) => {
    toggleSelection(messageId);
  };

  const handleDeleteSelected = async () => {
    try {
      const batch = writeBatch(firestore);
      selectedMessages.forEach(messageId => {
        const messageRef = doc(firestore, `chats/${chatId}/messages`, messageId);
        batch.delete(messageRef);
      });
      await batch.commit();
      setSelectedMessages(new Set());
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  };

  const renderDeleteButton = () => {
    if (selectedMessages.size > 0) {
      return (
        <TouchableOpacity onPress={handleDeleteSelected} style={styles.deleteButton1}>
          <Image source={require('../src/assets/delete.gif')} style={styles.deleteButtonIcon1} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  const openImageViewer = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    Keyboard.dismiss();
    setIsImageViewerVisible(false);
    setSelectedImage(null);
  };
  const renderItem = ({ item }) => {
    return (
      <TouchableWithoutFeedback
        onLongPress={() => handleLongPress(item.id)}
        onPress={() => {
          if (selectedMessages.size > 0) {
            toggleSelection(item.id);
          }
        }}
      >
        <View style={[styles.messageContainer, item.senderId === auth.currentUser.uid ? styles.myMessage : styles.otherMessage, selectedMessages.has(item.id) && styles.selectedMessage]}>
          <View style={styles.messageHeader}>
            <Image
              source={{ uri: userProfiles[item.senderId]?.photoURL || 'https://example.com/default-avatar.png' }}
              style={styles.profilePhoto}
            />
            <Text style={[styles.userName, { color: 'black' }]}>{userProfiles[item.senderId]?.name}</Text>
            {selectedMessages.has(item.id) && (
              <TouchableOpacity onPress={() => deleteMessage(item.id)} style={styles.deleteButton}>
                <Image source={require('../src/assets/trash.png')} style={styles.deleteButtonIcon} />
              </TouchableOpacity>
            )}
          </View>
          {item.fileType === 'image' ? (
            <TouchableOpacity onPress={() => openImageViewer(item.fileUrl)}>
              <Image source={{ uri: item.fileUrl }} style={styles.messageImage} />
            </TouchableOpacity>
          ) : item.fileType === 'video' ? (
            <Video
              source={{ uri: item.fileUrl }}
              style={styles.messageVideo}
              resizeMode="cover"
              controls
            />
          ) : (
            <Text style={[styles.messageText, { color: 'black' }]}>{item.message}</Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 30 })}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../src/assets/back.png')} style={styles.backButtonIcon} />
        </TouchableOpacity>
        <Image
          source={{ uri: userProfiles[recipientUid]?.photoURL || 'https://example.com/default-avatar.png' }}
          style={styles.profilePhotoHeader}
        />
        <Text style={styles.headerTitle}>{userProfiles[recipientUid]?.name}</Text>
        {renderDeleteButton()}
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingBottom: 20 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        
        <TextInput
          style={[styles.input, { color: 'black' }]}
          placeholder="Type a message"
          placeholderTextColor="#888"
          value={message}
          onChangeText={setMessage}
          onFocus={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        <TouchableOpacity onPress={() => sendMessage('text', message)} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={selectFile} style={styles.attachmentButton}>
        <Image source={require('../src/assets/clip.png')} style={styles.deleteButtonIcon} />
        </TouchableOpacity>
      </View>
      <Modal visible={isImageViewerVisible} transparent={true} onRequestClose={closeImageViewer}>
        <TouchableOpacity style={styles.imageViewerBackground} onPress={closeImageViewer}>
          <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    marginRight: 10,
  },
  backButtonIcon: {
    width: 24,
    height: 24,
  },
  profilePhotoHeader: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
  },
  attachmentButton: {
    padding: 10,
    marginLeft: 10,
  },
  attachmentButtonText: {
    fontSize: 24,
    color: '#007bff',
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  selectedMessage: {
    backgroundColor: '#e0e0e0',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  profilePhoto: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  userName: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  messageText: {
    fontSize: 16,
  },
  messageImage: {
    width: 200, 
    height: 200,
    borderRadius: 10,
  },
  messageVideo: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  deleteButton: {
    marginLeft: 'auto',
    padding: 5,
  },
  deleteButtonIcon: {
    width: 20,
    height: 20,
  },
  deleteButton1: {
    marginLeft: 'auto',
    padding: 5,
  },
  deleteButtonIcon1: {
    width: 40,
    height: 30,
  },
  imageViewerBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
});

export default Chat;
