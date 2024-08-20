import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image,Alert } from 'react-native';
import { firestore, auth } from '../src/firebase/firebaseconfig';
import { collection, getDoc, doc, onSnapshot, updateDoc, arrayRemove, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Chatlist = ({ setHasUnreadMessages }) => {
  const [friends, setFriends] = useState([]);
  const [unreadRequests, setUnreadRequests] = useState(false);
  const navigation = useNavigation();
  const currentUser = auth.currentUser;
  const isFocused = useIsFocused();

  const fetchFriendsFromStorage = async () => {
    try {
      const cachedFriends = await AsyncStorage.getItem('friends');
      if (cachedFriends) {
        setFriends(JSON.parse(cachedFriends));
      }
    } catch (error) {
      console.error('Error fetching friends from storage:', error);
    }
  };

  const fetchFriendsFromFirestore = useCallback(async () => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const friendsArray = userData.friends || [];

        const friendsData = await Promise.all(
          friendsArray.map(async (friendId) => {
            const friendDoc = await getDoc(doc(firestore, 'users', friendId));
            const friendData = friendDoc.data();
            const unreadCount = await fetchUnreadMessagesCount(friendId);
            return { id: friendId, ...friendData, unreadCount };
          })
        );

        setFriends(friendsData);
        await AsyncStorage.setItem('friends', JSON.stringify(friendsData));
      }
    } catch (error) {
      console.error('Error fetching friends from Firestore:', error);
    }
  }, [currentUser.uid]);

  const fetchUnreadMessagesCount = useCallback(async (friendId) => {
    const chatId = currentUser.uid < friendId ? `${currentUser.uid}_${friendId}` : `${friendId}_${currentUser.uid}`;
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('isRead', '==', false), where('senderId', '==', friendId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  }, [currentUser.uid]);

  useEffect(() => {
    const initializeFriends = async () => {
      await fetchFriendsFromStorage();
      await fetchFriendsFromFirestore();
    };

    initializeFriends();
  }, [fetchFriendsFromFirestore]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFriendsFromFirestore();
    });

    return unsubscribe;
  }, [navigation, fetchFriendsFromFirestore]);

  useEffect(() => {
    const requestsRef = collection(firestore, 'friend_requests');
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      const newRequests = snapshot.docs.some(doc => doc.data().recipientId === currentUser.uid && doc.data().status === 'pending');
      setUnreadRequests(newRequests);
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  useEffect(() => {
    const hasUnread = friends.some(friend => friend.unreadCount > 0) || unreadRequests;
    setHasUnreadMessages(hasUnread);
  }, [friends, unreadRequests, setHasUnreadMessages]);

  const openChat = (user) => {
    const chatId = currentUser.uid < user.id ? `${currentUser.uid}_${user.id}` : `${user.id}_${currentUser.uid}`;
    resetUnreadMessages(chatId, user.id);
    navigation.navigate('Chat', { chatId, recipientUid: user.id });
  };

  const resetUnreadMessages = async (chatId, friendId) => {
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('isRead', '==', false), where('recipientId', '==', currentUser.uid));
    const snapshot = await getDocs(q);

    const batch = writeBatch(firestore);
    snapshot.forEach(doc => {
      const messageRef = doc.ref;
      batch.update(messageRef, { isRead: true });
    });

    await batch.commit();
  };

  const removeFriend = async (friendId) => {
    try {
      const currentUserRef = doc(firestore, 'users', currentUser.uid);
      const friendRef = doc(firestore, 'users', friendId);

      await updateDoc(currentUserRef, {
        friends: arrayRemove(friendId)
      });

      await updateDoc(friendRef, {
        friends: arrayRemove(currentUser.uid)
      });

      
      const chatId = currentUser.uid < friendId ? `${currentUser.uid}_${friendId}` : `${friendId}_${currentUser.uid}`;
      const messagesRef = collection(firestore, 'chats', chatId, 'messages');
      const snapshot = await getDocs(messagesRef);
      const batch = writeBatch(firestore);

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      const updatedFriends = friends.filter(friend => friend.id !== friendId);
      setFriends(updatedFriends);

      await AsyncStorage.setItem('friends', JSON.stringify(updatedFriends));

      console.log('Friend and messages removed successfully');
    } catch (error) {
      console.error('Error removing friend and messages:', error);
    }
  };

  const confirmRemoveFriend = (friendId) => {
    Alert.alert(
      'Remove Friend',
      'Do you really want to delete this user?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => removeFriend(friendId),
        },
      ],
      { cancelable: false }
    );
  };


  const FriendItem = ({ friend }) => {
    return (
      <TouchableOpacity style={styles.userContainer} onPress={() => openChat(friend)}>
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: friend.photoURL || 'https://example.com/default-avatar.png' }}
          style={styles.profilePhoto}
        />
        {friend.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{friend.unreadCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{friend.name}</Text>
      </View>
      <TouchableOpacity onPress={() => confirmRemoveFriend(friend.id)} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

  return (
    <View style={styles.container}>
     
        <View style={styles.header}>
          <Text style={styles.headerText}>Chat</Text>
          <TouchableOpacity style={styles.iconContainer} onPress={() => {
            navigation.navigate('Friends');
            setUnreadRequests(false);
          }}>
            <Image source={require('./assets/freind.png')} style={styles.iconImage1} />
            {unreadRequests && <View style={styles.redDot} />}
          </TouchableOpacity>
        </View>
        {friends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Add friends</Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.chatList}
            data={friends}
            renderItem={({ item }) => <FriendItem friend={item} />}
            keyExtractor={(item) => item.id}
          />
        )}
     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  iconContainer: {
    position: 'relative',
  },
  iconImage1: {
    width: 30,
    height: 30,
    tintColor: '#ff69b4',
  },
  redDot: {
    width: 10,
    height: 10,
    backgroundColor: '#ff4d4d',
    borderRadius: 5,
    position: 'absolute',
    top: -2,
    right: 0,
  },
  chatList: {
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 105, 180, 0.3)',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 5,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  profileContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#ff69b4',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    shadowColor: '#ff4d4d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 2,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
  unreadBadge: {
    backgroundColor: '#ff4d4d',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 6,
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});



export default Chatlist;
