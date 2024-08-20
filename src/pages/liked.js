import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase/firebaseconfig';
import { getAuth } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

const Liked = () => {
  const { t } = useTranslation();
  const [likedProducts, setLikedProducts] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeFromAuth = auth.onAuthStateChanged(user => {
      if (user) {
        const userUid = user.uid;
        const userDocRef = doc(firestore, 'Liked', userUid); 

        const unsubscribeFromSnapshot = onSnapshot(userDocRef, (userDoc) => {
          const userData = userDoc.data();
          if (userData && userData.likedProducts) {
            setLikedProducts(userData.likedProducts);
          }
        }, (error) => {
          console.error('Error fetching liked products:', error);
        });

        // Clean up the snapshot listener
        return () => unsubscribeFromSnapshot();
      } 
    });

    // Clean up the auth listener
    return () => unsubscribeFromAuth();
  }, []);

  const confirmDelete = (productId) => {
    Alert.alert(
      t('confirmDeleteTitle'),
      t('confirmDeleteMessage'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('ok'),
          onPress: () => removeLikedProduct(productId),
        },
      ],
      { cancelable: false }
    );
  };

  const removeLikedProduct = async (productId) => {
    try {
      const updatedLikedProducts = likedProducts.filter(product => product.id !== productId);
      setLikedProducts(updatedLikedProducts);
      
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const userUid = user.uid;
        const likedRef = doc(firestore, 'Liked', userUid); 
        await setDoc(likedRef, { likedProducts: updatedLikedProducts }, { merge: true }); 
      } else {
        console.error('No authenticated user.');
      }
    } catch (error) {
      console.error('Error removing liked product:', error);
    }
  };

  return (
    <View style={styles.viewContainer}>
      <Text style={styles.title}>{t('wishListTitle')}</Text>
      <ScrollView style={styles.container}>
        {likedProducts.length > 0 ? (
          likedProducts.map(product => (
            <TouchableOpacity key={product.id} style={styles.productItem} onPress={() => navigation.navigate('ProductDetails', { product })}>
              <Image source={{ uri: product.imgUrls[0] || '../assets/b.png' }} style={styles.productImage} />
              <View style={styles.productDetails}>
                <Text style={styles.productName}>{product.productName}</Text>
                <Text style={styles.productDescription}>{t('productAge', { age: product.productAge })}</Text>
                <Text style={styles.productPrice}>{t('productPrice', { price: product.price })}</Text>
              </View>
              <TouchableOpacity onPress={() => confirmDelete(product.id)}>
                <Image source={require('../assets/trash.png')} style={styles.removeIcon} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <Text>{t('noWishlist')}</Text>
        )}
      </ScrollView></View>
    
  );
};




const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    backgroundColor: '#f0f4f8', // Light background for better readability
    padding: 20,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff', // White background for the scroll view container
    borderRadius: 15, // Adding a rounded corner to the container
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4a4a4a', // Darker color for the title
    textAlign: 'center',
    fontFamily: 'Montserrat', // Modern, clean font
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff', // White background for the product item
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0', // Light grey border for better separation
    transform: [{ scale: 1 }],
    transition: 'transform 0.3s ease-in-out',
  },
  productItemHover: {
    transform: [{ scale: 1.05 }],
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#dddddd',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333', // Dark color for the product name
    marginBottom: 4,
    fontFamily: 'Montserrat', // Consistent font for a modern look
  },
  productDescription: {
    fontSize: 16,
    color: '#666666', // Grey color for the description
    marginBottom: 6,
    fontFamily: 'Montserrat',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff7043', // Accent color for the price
    fontFamily: 'Montserrat',
  },
  removeIcon: {
    width: 28,
    height: 28,
    tintColor: '#ff5252', // Red color for the remove icon to indicate danger
  },
  noWishlist: {
    fontSize: 20,
    color: '#999999',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Montserrat',
  },
});

export default Liked;

