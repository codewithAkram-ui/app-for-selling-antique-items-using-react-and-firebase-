import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { firestore } from '../../firebase/firebaseconfig';
import LinearGradient from 'react-native-linear-gradient';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next'; 
const Vehicle1 = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const { width } = Dimensions.get('window');
  const itemSize = width / 2 - 20;
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = collection(firestore, 'Vehicle');
        const snapshot = await getDocs(productsRef);
        if (snapshot.empty) {
          console.log('No matching documents.');
          return;
        }
        let fetchedProducts = [];
        snapshot.forEach((doc) => {
          fetchedProducts.push({ id: doc.id, ...doc.data() });
        });
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts); // Initially show all products
      } catch (error) {
        console.error('Error fetching products: ', error);
      }
    };

    fetchProducts();
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);
    const filtered = products.filter((product) => {
      const productName = product.productName ? product.productName.toLowerCase() : '';
      const productPrice = product.price ? product.price.toString() : '';
      const productLocation = product.location ? product.location.toLowerCase() : '';
      return (
        productName.includes(text.toLowerCase()) ||
        productPrice.includes(text.toLowerCase()) ||
        productLocation.includes(text.toLowerCase())
      );
    });
    setFilteredProducts(filtered);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.productContainer, { width: itemSize, height: itemSize }]}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      <Image source={{ uri: item.imgUrls[0] }} style={styles.productImage} />
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{item.productName}</Text>
        
        <Text style={styles.productPrice}>{t('productPricePrefix')}{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['gold', 'white']} style={styles.gradient}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchPlaceholder')}
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        numColumns={2}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 10,
    paddingVertical: 20,
    
  },
  searchInput: {
    backgroundColor: 'black',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    
  },
  listContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  productContainer: {
    backgroundColor: '#fff',
    margin: 5,
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '70%',
    borderRadius: 5,
    marginBottom: 10,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color:'black'
  },
  productDescription: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'green',
    textAlign: 'center',
  },
});

export default Vehicle1;
