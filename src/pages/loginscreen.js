import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, firestore } from '../firebase/firebaseconfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const Loginscreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.params?.location) {
      setLocation(route.params.location);
    }
  }, [route.params]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('allFieldsRequired'));
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.emailVerified) {
        await prefetchData(user.uid);
        navigation.reset({
          index: 0,
          routes: [{ name: 'LocationScreen', params: { userId: user.uid } }],
        });
      } else {
        Alert.alert(
          t('emailNotVerified'),
          t('checkYourEmailForVerification'),
          [
            {
              text: "Resend Email",
              onPress: async () => {
                await user.sendEmailVerification();
                Alert.alert(t('verificationEmailSent'), t('checkYourEmail'));
              }
            },
            { text: "OK", onPress: () => {} }
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      setError(error.message);
      console.error('Error during sign-in:', error);
    } finally {
      setLoading(false);
    }
  };

  const prefetchData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const friendsArray = userData.friends || [];

        const friendsData = await Promise.all(
          friendsArray.map(async (friendId) => {
            const friendDoc = await getDoc(doc(firestore, 'users', friendId));
            const friendData = friendDoc.data();
            return { id: friendId, ...friendData };
          })
        );

        await AsyncStorage.setItem('friends', JSON.stringify(friendsData));
      }
    } catch (error) {
      console.error('Error prefetching data:', error);
    }
  };

  return (
    <LinearGradient colors={['#141E30', '#243B55']} style={styles.gradient}>
      <View style={styles.container}>
        <Image style={styles.image} source={require('../assets/actiq1.png')} />
        {location && (
          <Text style={styles.locationText}>
            {t('currentLocation')}: {location.city}, {location.state}
          </Text>
        )}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('emailPlaceholder')}
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('passwordPlaceholder')}
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.eyeIcon}
            >
              <Image
                source={
                  passwordVisible
                    ? require('../assets/eye1.png')
                    : require('../assets/eye.png')
                }
                style={styles.eyeImage}
              />
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('loginButton')}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.newUserText}>{t('newUserQuestion')}</Text>
          <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Emailverify')}>
            <Text style={styles.registerButtonText}>{t('registerHere')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  
  gradient: {
    flex: 1,
  },
  image: {
    alignSelf: 'center',
    width: "100%",
    height: "40%",
    resizeMode: 'contain',
    marginBottom: 20,
  },
  locationText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 5,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    fontSize: 16,
    color: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    fontSize: 16,
    color: '#fff',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
  },
  eyeImage: {
    width: 24,
    height: 24,
    tintColor: 'gold',
  },
  button: {
    backgroundColor: '#0072ff',
    borderRadius: 5,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  newUserText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  registerButton: {
    backgroundColor: '#0072ff',
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
    width: '80%',
    marginBottom: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 12,
    fontSize: 14,
  },
});

export default Loginscreen;
