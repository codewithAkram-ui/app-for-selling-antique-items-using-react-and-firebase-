import React, { useEffect, useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView ,ActivityIndicator} from 'react-native';

import { collection, getDocs, doc, setDoc,getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebaseconfig'; 
import { useNavigation } from '@react-navigation/native';
import Notifications from './notifications';
import Additems from './additems';

import Coin1 from './categorieslist/coin1'; 
import Gewels1 from './categorieslist/gewels1'; 
import Art1 from './categorieslist/art1'; 
import Toy1 from './categorieslist/toy'; 
import Fashion1 from './categorieslist/fashion1'; 
import { getAuth } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Antique1 from './categorieslist/antique1';
import Book1 from './categorieslist/book1';
import Music1 from './categorieslist/music1';
import Vehicle1 from './categorieslist/vehicle1';
import Tool1 from './categorieslist/tool1';
import Scientificitem1 from './categorieslist/scientificitem1';
import Other1 from './categorieslist/other1';
import SeparatorWithText from "../component/separatorwithtext"
import Geocoder from 'react-native-geocoding';
import Location from '../component/location';
import LocationScreen from './locationscreen';


Geocoder.init('AIzaSyCAlIe8YFlMZGVrlmgO4LxuE6VaK4Fl2ww');

const Home1 = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true); 
  const [likedProducts, setLikedProducts] = useState([]); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [searchResults, setSearchResults] = useState([]); 
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [products, setProducts] = useState({
    Art: [],
    Toy: [],
    Fashion: [],
    Gewels: [],
    Coins: [],
    Antique: [],
    Book: [],
    Music: [],
    Vehicle: [],
    Tool: [],
    Scientificitem: [],
    Other: []
  });
  const [firstSearchResult, setFirstSearchResult] = useState(null);

  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('Fetching your location...');

  const categories = [
    { name: 'Coins', component: Coin1 },
    { name: 'Gewels', component: Gewels1 },
    { name: 'Art', component: Art1 },
    { name: 'Toy', component: Toy1 },
    { name: 'Fashion', component: Fashion1 },
    { name: 'Antique', component: Antique1 },
    { name: 'Book', component: Book1 },
    { name: 'Music', component: Music1 },
    { name: 'Vehicle', component: Vehicle1 },
    { name: 'Tool', component: Tool1 },
    { name: 'Scientificitem', component: Scientificitem1 },
    { name: 'Other', component: Other1 }
  ];


  useEffect(() => {
    if (location) {
      getAddressFromCoordinates(location.latitude, location.longitude);
    }
  }, [location]);

  const getAddressFromCoordinates = (latitude, longitude) => {
    Geocoder.from(latitude, longitude)
      .then(json => {
        const addressComponents = json.results[0].address_components;
        const state = addressComponents.find(component => component.types.includes('administrative_area_level_1'))?.long_name || '';
        const city = addressComponents.find(component => component.types.includes('locality'))?.long_name || '';
        const pincode = addressComponents.find(component => component.types.includes('postal_code'))?.long_name || '';

        setAddress(`${city}, ${state}, ${pincode}`);
      })
      .catch(error => console.warn(error));
  };

  const fetchProducts = async () => {
    const productCollections = ['Arts', 'Toy', 'Fashion', 'Gewels', 'Coins', 'Antique', 'Book', 'Music', 'Vehicle', 'Tool', 'Scientificitem', 'Other'];
    const fetchCollection = async (category) => {
      const collectionRef = collection(firestore, category);
      const querySnapshot = await getDocs(collectionRef);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        imgUrls: [],
        ...doc.data(),
      }));
    };

    try {
      const fetchedProducts = await Promise.all(
        productCollections.map(category => fetchCollection(category))
      );
      const newProducts = {
        Art: fetchedProducts[0],
        Toy: fetchedProducts[1],
        Fashion: fetchedProducts[2],
        Gewels: fetchedProducts[3],
        Coins: fetchedProducts[4],
        Antique: fetchedProducts[5],
        Book: fetchedProducts[6],
        Music: fetchedProducts[7],
        Vehicle: fetchedProducts[8],
        Tool: fetchedProducts[9],
        Scientificitem: fetchedProducts[10],
        Other: fetchedProducts[11],
      };
      setProducts(newProducts);
      await AsyncStorage.setItem('products', JSON.stringify(newProducts));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const loadCachedProducts = async () => {
    try {
      const cachedProducts = await AsyncStorage.getItem('products');
      if (cachedProducts) {
        setProducts(JSON.parse(cachedProducts));
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading cached products:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadCachedProducts();
      fetchProducts();
      fetchLikedProducts();
    };
    initialize();
  }, []);

  const fetchLikedProducts = async () => {
    try {
      const auth = getAuth();
      const userUid = auth.currentUser.uid;
      const userDoc = await getDoc(doc(firestore, 'Liked', userUid)); 
      const userData = userDoc.data();
  
      if (userData && userData.likedProducts) {
        setLikedProducts(userData.likedProducts);
      }
    } catch (error) {
      console.error('Error fetching liked products:', error);
    }
  };

  const toggleLike = async (product) => {
    try {
      const alreadyLiked = likedProducts.some(p => p.id === product.id);

      if (alreadyLiked) {
        const updatedLikedProducts = likedProducts.filter(p => p.id !== product.id);
        setLikedProducts(updatedLikedProducts);
        await updateLikedProductsInFirestore(updatedLikedProducts);
      } else {
        const updatedLikedProducts = [...likedProducts, product];
        setLikedProducts(updatedLikedProducts);
        await updateLikedProductsInFirestore(updatedLikedProducts);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const updateLikedProductsInFirestore = async (updatedLikedProducts) => {
    try {
      const auth = getAuth();
      const userUid = auth.currentUser.uid; 
      const likedRef = doc(firestore, 'Liked', userUid); 
      await setDoc(likedRef, { likedProducts: updatedLikedProducts }, { merge: true }); 
    } catch (error) {
      console.error('Error updating liked products in Firestore:', error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const results = categories.filter(category =>
        category.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setIsSearchActive(true);
      setFirstSearchResult(results.length > 0 ? results[0] : null); 
    } else {
      setSearchResults([]);
      setIsSearchActive(false);
      setFirstSearchResult(null); 
    }
  };

  const handleCategoryPress = (category) => {
    navigation.navigate(category.component);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchActive(false);
  };

  const handleSubmitEditing = () => {
    if (firstSearchResult) {
      handleCategoryPress(firstSearchResult);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <View style={styles.locationContainer}>
      <Image source={require('../assets/navigation.png')} style={styles.locationIcon} />
          <TouchableOpacity onPress={() => navigation.navigate(LocationScreen)} >
          
            <Text style={styles.locationText}>{address.split(',')[0]}</Text>
            <Text style={styles.locationText}>{address.split(',')[1]}</Text>
            <Text style={styles.pincodeText}>{address.split(',')[2]}</Text>
          </TouchableOpacity>
        </View>
        <Location setLocation={setLocation} />


        <TouchableOpacity style={styles.bellIconContainer} onPress={() => navigation.navigate(Notifications)}>
          <Image source={require('../assets/bell.png')} style={styles.bellIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t("findTreasure")}
          placeholderTextColor="#000"
          value={searchQuery}
          onChangeText={handleSearch}
          onSubmitEditing={handleSubmitEditing}
        />
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate(Additems)}>
          <Image source={require('../assets/plus.png')} style={styles.iconImage2} />
        </TouchableOpacity>
      </View>
      {searchResults.length > 0 && (
        <View style={styles.searchResults}>
          {searchResults.map((result, index) => (
            <TouchableOpacity key={index} style={styles.searchResultItem} onPress={() => handleCategoryPress(result)}>
              <Text style={styles.searchResultText}>{result.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
        <ScrollView>
          <SeparatorWithText style={styles.sectionTitle} text={t('categories')}/>
          <ScrollView horizontal={true} style={styles.horizontalScrollView}>
            <View style={styles.categoriesContainer}>
              <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate(Coin1)} >
                <Image source={require('../assets/dollar.png')} style={styles.iconImage1} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate(Gewels1)}>
                <Image source={require('../assets/earrings.png')} style={styles.iconImage1} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate(Art1)}>
                <Image source={require('../assets/canvas.png')} style={styles.iconImage1} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate(Toy1)}>
                <Image source={require('../assets/toys.png')} style={styles.iconImage1} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate(Fashion1)}>
                <Image source={require('../assets/wardrobe.png')} style={styles.iconImage1} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate(Antique1)}>
                <Image source={require('../assets/antique.png')} style={styles.iconImage1} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate(Book1)}>
                <Image source={require('../assets/book.png')} style={styles.iconImage1} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate(Music1)}>
                <Image source={require('../assets/music.png')} style={styles.iconImage1} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate(Vehicle1)}>
                <Image source={require('../assets/car.png')} style={styles.iconImage1} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate(Tool1)}>
                <Image source={require('../assets/tool.png')} style={styles.iconImage1} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate(Scientificitem1)}>
                <Image source={require('../assets/medical.png')} style={styles.iconImage1} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate(Other1)}>
                <Image source={require('../assets/others.png')} style={styles.iconImage1} />
              </TouchableOpacity>
            </View>
          </ScrollView>

        
          <SeparatorWithText style={styles.sectionTitle} text={t('recommendations')}/>
          <View style={styles.recommendationsContainer}>
           
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              Object.keys(products).map(category => 
                products[category].map(product => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.recommendationItem}
                    onPress={() => navigation.navigate('ProductDetails', { product })}
                  >
                    <Image source={{ uri: product.imgUrls[0] || '../assets/b.png' }} style={styles.recommendationImage} />
                    <View style={styles.recommendationDetails}>
                      <Text style={styles.recommendationText}>{product.productName}</Text>
                      <Text style={styles.recommendationDescription}>Old: {product.productAge} yr</Text>
                      <Text style={styles.productPrice}>{`${t('price')}: ${product.price}`}</Text>
                      <View style={styles.locationContainer}>
                       <Text style={styles.location}>{product.city}, {product.district}, {product.state}</Text>
                       <Image source={require('../assets/navigation.png')} style={styles.navigationIcon} />
                       </View>
                      <TouchableOpacity onPress={() => toggleLike(product)}>
                        <Image
                          source={require('../assets/heart.png')}
                          style={[
                            styles.likeIcon,
                            likedProducts.some(p => p.id === product.id) && { tintColor: 'red' }
                          ]}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )
            )}
          </View>
        </ScrollView>
      </View>
   
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#6200EE',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#E1BEE7',
  },
  bellIconContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  bellIcon: {
    width: 24,
    height: 24,

  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    
    
  },
  locationIcon: {
    width: 24,
    height: 24,
  
   
    
  },
  locationText: {
    fontSize: 16,
    fontWeight: 'bold',
    
  },
  pincodeText: {
    fontSize: 14,
    color: 'white',
  },


  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 25,
    fontSize: 16,
    color: '#6200EE',
  },
  addButton: {
    backgroundColor: '#6200EE',
    borderRadius: 25,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconImage2: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  searchResults: {
    position: 'absolute',
    top:170,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchResultText: {
    fontSize: 16,
    color: '#6200EE',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginVertical: 10,
    color: '#6200EE',
  },
  subSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 10,
    color: '#6200EE',
  },
  horizontalScrollView: {
    marginHorizontal: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  iconImage1: {
    width: 44,
    height: 44,
    
  },

  recommendationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  recommendationItem: {
    width: '47%', // 2 items per row
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  recommendationImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  recommendationDetails: {
    padding: 10,
  },
  recommendationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  navigationIcon: {
    width: 16,
    height: 16,
    marginLeft: 5,
  },
  likeIcon: {
    width: 20,
    height: 20,
    tintColor: '#ccc',
    marginTop: 10,
    alignSelf: 'flex-end',
  },
});


export default Home1;
