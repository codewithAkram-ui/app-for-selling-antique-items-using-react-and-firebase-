import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import ChangePassword from './settings/changepassword';

const Setting = ({ navigation }) => {
  const { t } = useTranslation();
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.closeButton}>⬅</Text>
        </TouchableOpacity>
        <Text style={styles.header}>{t('settings')}</Text>
      </View>
      <TouchableOpacity style={styles.option} >
        <Text style={styles.optionText}>{t('privacy')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={() => handlePress(ChangePassword)}>
        <Text style={styles.optionText}>{t('changePassword')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} >
        <Text style={styles.optionText}>{t('inviteFriends')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
    color: 'black',
  },
  closeButton: {
    fontSize: 40,
    color: 'black',
    bottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#0072ff',
  },
  optionText: {
    fontSize: 18,
    marginLeft: 10,
    color: 'black',
  },
  backButton: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    padding: 5,
  },
});

export default Setting;
