import React, { useEffect } from 'react';
import { Image, View, StyleSheet, Text } from 'react-native';

const SplashScreen = () => {
  useEffect(() => {
    // Simulate a 2-second delay before navigating away from the splash screen
    const timer = setTimeout(() => {
      // Navigate to the Home screen after 2 seconds
      // You can replace this with navigation logic if needed
      console.log('Splash screen timeout, navigate to Home screen');
    }, 2000);

    // Clean up the timeout when the component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/Logo.png')}
        style={styles.image}
        resizeMode="cover" 
      /> 
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', 
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;
