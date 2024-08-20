import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const { width, height } = Dimensions.get('window');

const data = [
  {
    id: '1',
    title: 'Contact us',
    description: 'Lorem ipsum dolor sit dim amet, mea regione diamet principes at. Cum no movi lorem ipsum dolor sit dim.',
    image: require('../../assets/b.png'), // replace with your image path
  },
  {
    id: '2',
    title: 'Describe issue',
    description: 'Lorem ipsum dolor sit dim amet, mea regione diamet principes at. Cum no movi lorem ipsum dolor sit dim.',
    image: require('../../assets/b.png'), // replace with your image path
  },
  {
    id: '3',
    title: 'Get help',
    description: 'Lorem ipsum dolor sit dim amet, mea regione diamet principes at. Cum no movi lorem ipsum dolor sit dim.',
    image: require('../../assets/b.png'), // replace with your image path
  },
  {
    id: '4',
    title: 'Done! Issue is resolved',
    description: 'Lorem ipsum dolor sit dim amet, mea regione diamet principes at.',
    image: require('../../assets/b.png'), // replace with your image path
  },
];

const CarouselItem = ({ item }) => (
  <View style={styles.item}>
    <Image source={item.image} style={styles.image} />
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.description}>{item.description}</Text>
    {item.title === 'Done! Issue is resolved' && (
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Learn more</Text>
      </TouchableOpacity>
    )}
  </View>
);

const Help = () => {
  const navigation = useNavigation();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event) => {
    const slideIndex = Math.floor(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(slideIndex);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.closeButton} >⬅</Text>
        </TouchableOpacity>
      <FlatList
        data={data}
        renderItem={({ item }) => <CarouselItem item={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        style={styles.flatList}
      />
      <View style={styles.pagination}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === activeIndex ? '#007bff' : '#ccc' },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  item: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  closeButton: {
    fontSize: 40,
    color:'black',
  bottom:10,
  
},
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    bottom:90
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
});

export default Help;
