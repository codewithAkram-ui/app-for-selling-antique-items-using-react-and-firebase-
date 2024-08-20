import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Platform, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Geocoder from 'react-native-geocoding';
import { useNavigation } from '@react-navigation/native';

Geocoder.init(''); // Replace 'YOUR_API_KEY' with your actual API key

const Location = ({ setLocation }) => {
  const navigation = useNavigation();
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestLocationPermission();
    } else {
      getLocation();
    }
  }, []);

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need your location to show it on the login screen.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getLocation();
      } else {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const getLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setLocation({ latitude, longitude });

        Geocoder.from(latitude, longitude)
          .then((json) => {
            const addressComponent = json.results[0].formatted_address;
            console.log(addressComponent);
            navigation.navigate('MainTabs', { location: { latitude, longitude, address: addressComponent } });
          })
          .catch((error) => {
            Alert.alert('Error', 'Could not fetch address. Please try again later.');
            console.log(error);
          });
      },
      (error) => {
        Alert.alert('Error', 'Could not fetch location. Please try again later.');
        console.log(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  return (
    <View style={styles.container}>
      <Text>Fetching your location...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Location;
