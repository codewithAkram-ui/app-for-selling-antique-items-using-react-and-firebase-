import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';

import ImagePicker from 'react-native-image-crop-picker';
import { useNavigation } from '@react-navigation/native';
import { updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../../firebase/firebaseconfig';
import ImageResizer from 'react-native-image-resizer';
import { useTranslation } from 'react-i18next';

const Viewandedit = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userId, currentProfile } = route.params ?? {};
  const [profileImage, setProfileImage] = useState(currentProfile.photoURL || '');
  const [username, setUsername] = useState(currentProfile.displayName || '');
  const [name, setName] = useState(currentProfile.name || '');
  const [contactNumber, setContactNumber] = useState(currentProfile.contactNumber || '');
  const [address, setAddress] = useState(currentProfile.address || '');
  const [bio, setBio] = useState(currentProfile.bio || '');

  const handleChoosePhoto = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
    }).then(image => {
      setProfileImage(image.path);
    }).catch(error => {
      console.error('Error selecting image: ', error);
    });
  };

  const resizeImage = async (uri) => {
    try {
      const response = await ImageResizer.createResizedImage(uri, 300, 300, 'JPEG', 80);
      return response.uri;
    } catch (error) {
      console.error('Error resizing image:', error);
      return uri; // Return original URI in case of error
    }
  };

  const uploadImageToStorage = async (imageUri) => {
    if (!imageUri) return null;

    const resizedUri = await resizeImage(imageUri);
    const response = await fetch(resizedUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profile_images/${userId}`);
    await uploadBytes(storageRef, blob);

    return await getDownloadURL(storageRef);
  };

  const handleSaveProfile = async () => {
    try {
      let updatedProfileImageUrl = profileImage;

      if (profileImage && !profileImage.startsWith('http')) {
        updatedProfileImageUrl = await uploadImageToStorage(profileImage);
      }

      const updatedProfile = {
        photoURL: updatedProfileImageUrl || '',
        displayName: username || '',
        name: name || '',
        contactNumber: contactNumber || '',
        address: address || '',
        bio: bio || '',
      };

      await updateDoc(doc(firestore, 'users', userId), updatedProfile);

      navigation.navigate('User', { updatedProfile });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
   
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{t('viewAndEditProfile')}</Text>
        <TouchableOpacity style={styles.imageContainer} onPress={handleChoosePhoto}>
          {profileImage ? (
            <Image source={{ uri: profileImage || "https://via.placeholder.com/100"}} style={styles.profileImage} />
          ) : (
            <Text style={styles.uploadText}>{t('uploadProfileImage')}</Text>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder={t('enterUsername')}
          placeholderTextColor={"grey"}
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder={t('enterName')}
          placeholderTextColor={"grey"}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder={t('enterContactNumber')}
          placeholderTextColor={"grey"}
          value={contactNumber}
          onChangeText={setContactNumber}
        />
        <TextInput
          style={styles.input}
          placeholder={t('enterAddress')}
          placeholderTextColor={"grey"}
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          style={styles.input}
          placeholder={t('enterBio')}
          placeholderTextColor={"grey"}
          value={bio}
          onChangeText={setBio}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
          <Text style={styles.saveButtonText}>{t('save')}</Text>
        </TouchableOpacity>
      </ScrollView>
   
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: 'linear-gradient(120deg, #f6d365, #fda085)', // Soft gradient background
  },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Light glass effect
    borderTopLeftRadius: 20, // Slightly rounded corners
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 28, // Smaller font size
    fontWeight: '600',
    color: '#2d3436', // Darker, subtle color for readability
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'capitalize', // Capitalize for a modern look
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.05)', // Very light border
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  profileImage: {
    width: 120, // Smaller profile image
    height: 120,
    borderRadius: 60,
    borderColor: '#ffffff',
    borderWidth: 2,
    backgroundColor: '#dcdcdc',
  },
  uploadText: {
    fontSize: 18,
    color: '#3498db', // Blue for interactive elements
    marginTop: 10,
    textDecorationLine: 'underline',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  input: {
    height: 50, // Smaller input fields
    borderColor: '#bdc3c7',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f1f1f1', // Light background for inputs
    shadowColor: '#bdc3c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
    color: '#34495e',
    fontSize: 15,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#2ecc71', // Fresh green for the save button
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.3,
    shadowRadius: 7,
    elevation: 7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});







export default Viewandedit;
