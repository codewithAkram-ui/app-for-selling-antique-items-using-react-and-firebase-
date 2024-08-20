import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useTranslation } from 'react-i18next';
import PhoneInput from 'react-native-phone-input';

const Emailverify = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const phoneInputRef = useRef(null);

  const sendOtp = async () => {
    try {
      const phoneNumberWithCountryCode = phoneInputRef.current?.getValue();
      if (!phoneNumberWithCountryCode || !phoneInputRef.current?.isValidNumber()) {
        Alert.alert(t('error'), t('invalidPhoneNumber'));
        return;
      }
      const confirmation = await auth().signInWithPhoneNumber(phoneNumberWithCountryCode);
      setVerificationId(confirmation.verificationId);
      setOtpSent(true);
      Alert.alert(t('otpSent'), t('otpSentMessage'));
    } catch (error) {
      console.error('Phone sign-in error:', error);
      Alert.alert(t('error'), error.message);
    }
  };

  const verifyOtp = async () => {
    try {
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      await auth().signInWithCredential(credential);
      setOtpVerified(true);
      Alert.alert(t('otpVerified'), t('otpVerifiedMessage'));
    } catch (error) {
      setError(t('invalidOtp'));
      console.error('Error during OTP verification:', error);
      Alert.alert(t('error'), error.message);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password || !confirmPassword || !phoneNumber) {
      Alert.alert(t('error'), t('allFieldsRequired'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      await user.sendEmailVerification();

      Alert.alert(
        t('verificationEmailSent'),
        t('checkYourEmail'),
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate('Loginscreen');
            }
          }
        ],
        { cancelable: false }
      );

      await firestore().collection('users').doc(user.uid).set({
        uid: user.uid,
        email: email,
        phoneNumber: phoneNumber,
        displayName: '',
        photoURL: '',
      });

      // Wait for email verification
      const unsubscribe = auth().onAuthStateChanged(async (user) => {
        if (user && user.emailVerified) {
          unsubscribe();
        }
      });
    } catch (error) {
      setError(error.message);
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#141E30', '#243B55']} style={styles.gradient}>
      <View style={styles.container}>
        <Image style={styles.image} source={require('../assets/actiq1.png')} />
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('email')}
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.phoneContainer}>
            <PhoneInput
              ref={phoneInputRef}
              style={styles.phoneInput}
              initialCountry="in"
              onChangePhoneNumber={setPhoneNumber}
              textStyle={{ color: '#fff' }}
              pickerBackgroundColor="#333"
              pickerItemStyle={{ backgroundColor: '#333', color: '#fff' }}
            />
            <TouchableOpacity style={styles.getOtpButton} onPress={sendOtp}>
              <Text style={styles.getOtpButtonText}>{t('getOtp')}</Text>
            </TouchableOpacity>
          </View>
          {otpSent && (
            <View style={styles.otpContainer}>
              <TextInput
                style={styles.otpInput}
                placeholder={t('enterOtp')}
                placeholderTextColor="#999"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.verifyOtpButton} onPress={verifyOtp}>
                <Text style={styles.verifyOtpButtonText}>{t('verify')}</Text>
              </TouchableOpacity>
            </View>
          )}
          {otpVerified && (
            <>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('password')}
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
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('confirmPassword')}
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!confirmPasswordVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  style={styles.eyeIcon}
                >
                  <Image
                    source={
                      confirmPasswordVisible
                        ? require('../assets/eye1.png')
                        : require('../assets/eye.png')
                    }
                    style={styles.eyeImage}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {otpVerified && (
            <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('register')}</Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Loginscreen')}>
            <Text style={styles.loginButtonText}>{t('alreadyHaveAccount')}</Text>
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
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  getOtpButton: {
    backgroundColor: '#0072ff',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
  },
  getOtpButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  otpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  otpInput: {
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
  verifyOtpButton: {
    backgroundColor: '#0072ff',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
  },
  verifyOtpButtonText: {
    color: '#fff',
    fontSize: 16,
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
  loginButton: {
    marginTop: 10,
  },
  loginButtonText: {
    color: '#0072ff',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 12,
    fontSize: 14,
  },
});

export default Emailverify;
