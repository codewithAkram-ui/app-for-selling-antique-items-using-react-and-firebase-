import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Animated, Easing } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore, auth } from '../firebase/firebaseconfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import Myads from './useritems/myads';
import { useTranslation } from 'react-i18next';
import Selectlanguage from './useritems/selectlanguage';
import LinearGradient from 'react-native-linear-gradient';
import Verification from './useritems/verifications/verification';

const User = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, updatedProfile } = route.params ?? {};
  const [profile, setProfile] = useState({
    displayName: '',
    photoURL: '',
  });
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile({
            displayName: userData.displayName || '',
            photoURL: userData.photoURL || '',
          });
          setIsNewUser(!userData.displayName || !userData.photoURL);
          await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
        } else {
          const defaultProfile = {
            displayName: 'Dummy User',
            photoURL: 'https://via.placeholder.com/100',
          };
          await setDoc(doc(firestore, 'users', userId), defaultProfile);
          setProfile(defaultProfile);
          await AsyncStorage.setItem('userProfile', JSON.stringify(defaultProfile));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const getCachedProfile = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem('userProfile');
        if (cachedProfile) {
          setProfile(JSON.parse(cachedProfile));
          setLoading(false);
        } else {
          fetchUserProfile();
        }
      } catch (error) {
        console.error('Error retrieving cached profile:', error);
        fetchUserProfile();
      }
    };

    if (userId) {
      getCachedProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (updatedProfile) {
      setProfile(updatedProfile);
      setIsNewUser(!updatedProfile.displayName || !updatedProfile.photoURL);
      AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    }
  }, [updatedProfile]);

  useEffect(() => {
    if (isNewUser) {
      Alert.alert(
        t("updateProfileTitle"),
        t("updateProfileMessage"),
        [{ text: t("ok"), onPress: handleViewAndEditProfile }],
        { cancelable: false }
      );
    }
  }, [isNewUser]);

  useEffect(() => {
    const authStateChanged = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await user.reload();
        setEmailVerified(user.emailVerified);
      }
    });

    return () => authStateChanged();
  }, []);

  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotate.start();
    return () => rotate.stop();
  }, [rotation]);

  const handleViewAndEditProfile = () => {
    navigation.navigate('Viewandedit', { userId, currentProfile: profile });
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userProfile');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Loginscreen' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      t("confirmLogoutTitle"),
      t("confirmLogoutMessage"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        { text: t("ok"), onPress: handleLogOut }
      ],
      { cancelable: false }
    );
  };

  const rotationInterpolation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const progressBarWidth = emailVerified ? '35%' : '0%';

  let stepsLeftText = 'Three steps left';
  if (progressBarWidth === '35%') {
    stepsLeftText = 'Two steps left';
  } else if (progressBarWidth === '100%') {
    stepsLeftText = 'Completely verified';
  }


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          {loading ? (
            <Text style={styles.loadingText}>{t("loading")}</Text>
          ) : (
            <>
              <View style={styles.profileContainer}>
                <Animated.View style={[styles.gradientContainer, { transform: [{ rotate: rotationInterpolation }] }]}>
                  <LinearGradient
                    colors={['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8B00FF']}
                    style={styles.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                </Animated.View>
                <Image
                  source={{ uri: profile.photoURL || "https://via.placeholder.com/100" }}
                  style={styles.profileImage}
                />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {profile.displayName}
                </Text>
                <Image
                  source={require('../assets/rating.png')}
                  style={styles.ratingImage}
                />
              </View>
              <Image source={require('../assets/tick.png')} style={styles.tickIcon}/>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.editProfileButton} onPress={handleViewAndEditProfile}>
          <Text style={styles.editProfileText}>{t("editProfile")}</Text>
        </TouchableOpacity>
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsText}>{stepsLeftText}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: progressBarWidth }]} />
          </View>
        </View>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate(Verification)}>
          <Text style={styles.menuItemText}>{t("verification")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate(Myads)}>
          <Text style={styles.menuItemText}>{t("myAds")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>{t("reward")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate(Selectlanguage)}>
          <Text style={styles.menuItemText}>{t("selectLanguage")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Help')}>
          <Text style={styles.menuItemText}>{t("helpSupport")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Setting')}>
          <Text style={styles.menuItemText}>{t("settings")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.logoutButtonText}>{t("logOut")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContainer: {
    padding: 15,
    paddingTop: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 20,
    backgroundColor: '#4B9CD3',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginTop: 0,
    paddingTop: 40,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  profileContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContainer: {
    position: 'absolute',
    width: 90, // Thinner frame
    height: 90, // Thinner frame
    borderRadius: 45,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 45,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2, // Thinner border
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  ratingImage: {
    width: 100,
    height: 20,
    marginTop: 5,
  },
  tickIcon: {
    width: 25,
    height: 25,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  editProfileButton: {
    marginVertical: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4B9CD3',
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepsContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  stepsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progress: {
    height: 10,
    backgroundColor: '#4B9CD3',
  },
  helpText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    marginVertical: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#FF3B30',
    borderRadius: 25,
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default User;
