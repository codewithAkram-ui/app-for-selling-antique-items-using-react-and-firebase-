import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../language json/i18n'; // Ensure this is the correct path to your i18n configuration file
import 'intl-pluralrules'; 
import { useNavigation } from '@react-navigation/native'; 

const Selectlanguage = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, bounceAnim]);

  const changeLanguage = (language) => {
    i18n.changeLanguage(language).then(() => {
      navigation.goBack(); // Navigate back after language change
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.text}>{t('welcome')}</Text>
      {['en', 'hi', 'ta'].map((lang, index) => (
        <Animated.View
          key={index}
          style={[
            styles.languageCard,
            { transform: [{ scale: bounceAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => changeLanguage(lang)}
            activeOpacity={0.8}
          >
            <Text style={styles.languageButtonText}>
              {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'தமிழ்'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #72EDF2 10%, #5151E5 100%)',
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  languageCard: {
    width: '80%',
    marginVertical: 10,
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  languageButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonText: {
    fontSize: 20,
    color: '#0072ff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
});

export default Selectlanguage;
