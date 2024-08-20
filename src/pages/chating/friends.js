import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { firestore, auth } from '../../firebase/firebaseconfig';
import { collection, onSnapshot, updateDoc, doc, arrayUnion, getDoc } from 'firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const Friends = () => {
  const [friendRequests, setFriendRequests] = useState([]);
  const currentUser = auth.currentUser;
  const navigation = useNavigation();

  useEffect(() => {
    const requestsRef = collection(firestore, 'friend_requests');

    const unsubscribe = onSnapshot(requestsRef, async (snapshot) => {
      const requests = await Promise.all(snapshot.docs
        .filter(doc => doc.data().recipientId === currentUser.uid && doc.data().status === 'pending')
        .map(async (requestDoc) => {
          const data = requestDoc.data();
          const userDocRef = doc(firestore, 'users', data.requesterId);
          const userDoc = await getDoc(userDocRef);
          return {
            id: requestDoc.id,
            ...data,
            requesterName: userDoc.exists() ? userDoc.data().displayName : 'Unknown',
            requesterPhoto: userDoc.exists() ? userDoc.data().photoURL : 'https://example.com/default-avatar.png',
          };
        }));
      setFriendRequests(requests);
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  const acceptFriendRequest = async (request) => {
    try {
      // Update friend request status to 'accepted'
      await updateDoc(doc(firestore, 'friend_requests', request.id), {
        status: 'accepted'
      });
  
      // Add friend to current user's friends list
      const currentUserRef = doc(firestore, 'users', currentUser.uid);
      const requesterRef = doc(firestore, 'users', request.requesterId);
  
      await updateDoc(currentUserRef, {
        friends: arrayUnion(request.requesterId)
      });
  
      await updateDoc(requesterRef, {
        friends: arrayUnion(currentUser.uid)
      });
  
      console.log('Friend request accepted');
  
      // Notify Chatlist to refresh
      navigation.navigate('Chats');
    } catch (error) {
      console.error('Error accepting friend request: ', error);
    }
  };
  

  return (
    <View style={styles.container}>
      <LinearGradient colors={['black', 'pink']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Friend Requests</Text>
        </View>
        {friendRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No requests</Text>
          </View>
        ) : (
          <FlatList
            data={friendRequests}
            renderItem={({ item }) => (
              <View style={styles.requestContainer}>
                <Image
                  source={{ uri: item.requesterPhoto }}
                  style={styles.profilePhoto}
                />
                <Text style={styles.requestText}>{item.requesterName}</Text>
                <TouchableOpacity onPress={() => acceptFriendRequest(item)} style={styles.acceptButton}>
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
          />
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  requestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  requestText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  acceptButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    color: 'gray',
  },
});

export default Friends;
