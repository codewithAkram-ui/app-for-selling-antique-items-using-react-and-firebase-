import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Linking, Animated, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { firestore, auth } from '../firebase/firebaseconfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const ProductDetails = ({ route }) => {
  const { t } = useTranslation();
  const { product } = route.params;
  const navigation = useNavigation();

  const imgUrls = Array.isArray(product.imgUrls) ? product.imgUrls : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userDetails, setUserDetails] = useState({ displayName: '', photoURL: '' });
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', product.userId));
        if (userDoc.exists()) {
          setUserDetails(userDoc.data());
        } else {
          console.log('User document not found');
        }
      } catch (error) {
        console.error('Error fetching user details: ', error);
      }
    };

    fetchUserDetails();
  }, [product.userId]);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const handleDialPress = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const sendFriendRequest = async () => {
    const currentUser = auth.currentUser;
    if (currentUser.uid === product.userId) {
      Alert.alert('Error', 'You cannot send a friend request to yourself.');
      return;
    }

    setIsSendingRequest(true);
    const requestId = `${currentUser.uid}_${product.userId}`;
    try {
      await setDoc(doc(firestore, 'friend_requests', requestId), {
        requesterId: currentUser.uid,
        recipientId: product.userId,
        status: 'pending',
        requesterName: currentUser.displayName,
        requesterPhoto: currentUser.photoURL,
      });
      setIsRequestSent(true);
      Alert.alert('Success', 'Friend request sent successfully.');
    } catch (error) {
      console.error('Error sending friend request: ', error);
      Alert.alert('Error', 'Failed to send friend request.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../assets/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('imageDetails')}</Text>
      </View>

      <Animated.View style={[styles.userProfile, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        <Image source={{ uri: userDetails.photoURL || 'https://example.com/default_profile_photo.png' }} style={styles.profilePhoto} />
        <View style={styles.userDetailsTextContainer}>
          <Text style={styles.username}>{userDetails.displayName}</Text>
          <TouchableOpacity onPress={sendFriendRequest} style={[styles.friendRequestButton, isRequestSent && styles.friendRequestButtonDisabled]} disabled={isSendingRequest || isRequestSent}>
            {isSendingRequest ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Image source={require('../assets/profile.png')} style={styles.friendRequestIcon} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        <ScrollView
          horizontal
          pagingEnabled
          contentContainerStyle={styles.imageScrollContainer}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          {imgUrls.map((url, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: url }} style={styles.productImage} />
            </View>
          ))}
        </ScrollView>
        <View style={styles.pagination}>
          {imgUrls.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { opacity: currentIndex === index ? 1 : 0.3 }
              ]}
            />
          ))}
        </View>
      </Animated.View>

      <View style={styles.detailsContainer}>
        <Animated.View style={[styles.detailBox, styles.detailBoxLeft, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          <Text style={styles.detailTitle}>{t('imageDetails')}</Text>
          <Text style={styles.detailText}>{t('productName')}: {product.productName}</Text>
          <Text style={styles.detailText}>{t('cost')}: ₹{product.price}</Text>
          <Text style={styles.detailText}>{t('year')}: {product.productAge}</Text>
          <Text style={styles.detailText}>{t('description')}: {product.productDescription}</Text>
          <Text style={styles.detailText}>{t('address')}: {product.address}</Text>
        </Animated.View>
        <Animated.View style={[styles.detailBox, styles.detailBoxRight, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          <Text style={styles.detailTitle}>{t('aiDetails')}</Text>
          <Text style={styles.detailText}>{t('productName')}: {product.productName1}</Text>
          <Text style={styles.detailText}>{t('year')}: {product.productAge1}</Text>
          <Text style={styles.detailText}>{t('description')}: {product.productDescription1}</Text>
        </Animated.View>
      </View>

      <TouchableOpacity onPress={() => handleDialPress(product.contacts)} style={styles.contactButton}>
        <Text style={styles.contactButtonText}>{t('contact')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#e6ebf1', // Lighter background color for a fresh look
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#333',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24, // Slightly larger font size for prominence
    fontWeight: 'bold',
    color: '#333',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20, // More rounded corners
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    transition: 'all 0.3s ease-in-out',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userDetailsTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  username: {
    fontSize: 22, // Slightly larger font size
    fontWeight: '700',
    color: '#333',
  },
  friendRequestButton: {
    marginTop: 10,
    backgroundColor: '#007bff',
    paddingVertical: 12, // Increased padding for a better touch target
    paddingHorizontal: 20, // Increased padding for a better touch target
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  friendRequestButtonDisabled: {
    backgroundColor: '#bbb',
  },
  friendRequestIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    marginBottom: 20,
    borderRadius: 20, // More rounded corners
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  imageWrapper: {
    width: width - 60,
    marginHorizontal: 10,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    transition: 'transform 0.3s ease-in-out',
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 10, // Slightly larger dots
    height: 10, // Slightly larger dots
    borderRadius: 5,
    backgroundColor: '#007bff',
    marginHorizontal: 5,
    transition: 'opacity 0.3s ease-in-out',
  },
  detailsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailBox: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20, // More rounded corners
    borderWidth: 0.5,
    borderColor: '#ddd',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  detailBoxLeft: {
    alignItems: 'flex-start',
  },
  detailBoxRight: {
    alignItems: 'flex-end',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#444',
  },
  imageScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 5,
    lineHeight: 24, // Increased line height for better readability
  },
  contactButton: {
    width: '100%',
    padding: 18, // Increased padding for a better touch target
    borderRadius: 20, // More rounded corners
    backgroundColor: '#007bff',
    alignItems: 'center',
    marginVertical: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});





export default ProductDetails;
