import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore, auth } from '../../firebase/firebaseconfig'; 
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';


const Myads = () => {
  const { t } = useTranslation();
  const [myAds, setMyAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchMyAds = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.log("User not authenticated");
        setLoading(false);
        return;
      }
      const userId = user.uid;
      console.log("Fetching ads for user:", userId);

      const categories = ['Arts', 'Toy', 'Fashion', 'Gewels', 'Coins'];
      let ads = [];

      try {
        for (let category of categories) {
          console.log(`Fetching ads from category: ${category}`);
          const categoryQuery = query(collection(firestore, category), where('userId', '==', userId));
          const querySnapshot = await getDocs(categoryQuery);
          querySnapshot.forEach((doc) => {
            console.log(`Fetched ad from ${category}:`, doc.data());
            ads.push({ id: doc.id, ...doc.data(), category }); // Include category in the ad data
          });
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
      }

      console.log("Fetched ads:", ads);
      setMyAds(ads);
      setLoading(false);
    };

    fetchMyAds();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0072ff" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (myAds.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noAdsText}>{t('noAdsFound')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../../assets/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.header}>{t('myAds')}</Text>
      </View>
      <FlatList
        data={myAds}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.adContainer}>
            <Image source={{ uri: item.imgUrls[0] }} style={styles.adImage} />
            <View style={styles.adDetails}>
              <Text style={styles.adTitle}>{item.productName}</Text>
              <Text style={styles.adPrice}>${item.price}</Text>
              <Text style={styles.adCategory}>{t('category')}: {item.category}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  noAdsText: {
    color: '#fff',
    fontSize: 18,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1c1c1c',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 10,
    top: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'black',
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
  header: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0072ff',
    textAlign: 'center',
  },
  adContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#1e1e1e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginHorizontal: 20,
  },
  adImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  adDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  adPrice: {
    fontSize: 16,
    color: '#4caf50',
  },
  adCategory: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
});


export default Myads;
