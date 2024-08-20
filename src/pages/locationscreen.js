import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Location from '../component/location'; // Ensure the path is correct

const LocationScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Location</Text>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for a location..."
      />
      <TouchableOpacity
        style={styles.currentLocation}
        onPress={() => navigation.navigate(Location)}
      >
        <View style={styles.currentLocationIcon}>
          <Text style={styles.currentLocationIconText}>📍</Text>
        </View>
        <View>
          <Text style={styles.currentLocationText}>Use Current Location</Text>
          
        </View>
      </TouchableOpacity>
     
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Location</Text>
        {['chennai', 'Bihar', 'Uttar pradesh'].map(location => (
          <TouchableOpacity key={location} style={styles.locationButton}>
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>📍</Text>
            </View>
            <Text style={styles.locationButtonText}>{location}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f0f4f7',
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    backgroundColor: 'black',
  },
  currentLocation: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  currentLocationIcon: {
    marginRight: 15,
  },
  currentLocationIconText: {
    fontSize: 26,
  },
  currentLocationText: {
    fontSize: 18,
    fontWeight: '600',
    color:"black"
  },
  currentLocationSubText: {
    color: '#888',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    color: '#333',
  },
  locationButton: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  locationIcon: {
    marginRight: 15,
  },
  locationIconText: {
    fontSize: 26,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color:"black"
  },
});

export default LocationScreen;
