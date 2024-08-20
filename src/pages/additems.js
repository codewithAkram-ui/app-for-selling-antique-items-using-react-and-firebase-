import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, Modal, Animated, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { storage, firestore, auth } from '../firebase/firebaseconfig'; // Adjust import path as needed
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import ImageResizer from 'react-native-image-resizer';
import { useNavigation } from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import { Picker } from "@react-native-picker/picker";
import Icon from 'react-native-vector-icons/MaterialIcons';
const Additems = () => {
  const { t } = useTranslation();
  const [productName, setProductName] = useState('');
  const [address, setAddress] = useState('');
  const [contacts, setContacts] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productAge, setProductAge] = useState('');
  const [price, setPrice] = useState('');
  const [imgUrls, setImgUrls] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalAnim] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Coins');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [croppingImage, setCroppingImage] = useState(null);
  const navigation = useNavigation();
  const [aiGeneratedDetails, setAiGeneratedDetails] = useState({ name: '', description: '', age: '' });

  const statesAndDistricts = {
    'State1': ['District1-1', 'District1-2'],
    'State2': ['District2-1', 'District2-2'],
  };

  const districtsAndCities = {
    'District1-1': ['City1-1-1', 'City1-1-2'],
    'District1-2': ['City1-2-1', 'City1-2-2'],
    'District2-1': ['City2-1-1', 'City2-1-2'],
    'District2-2': ['City2-2-1', 'City2-2-2'],
  };

  useEffect(() => {
    setSelectedDistrict('');
    setSelectedCity('');
  }, [selectedState]);

  useEffect(() => {
    setSelectedCity('');
  }, [selectedDistrict]);

  const handleImageUpload = async (source) => {
    const options = {
      mediaType: 'photo',
      cropping: true,
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 1,
      includeBase64: false,
      multiple: true,
    };
  
    try {
      let images;
      if (source === 'camera') {
        const image = await ImagePicker.openCamera(options);
        images = [image]; // Wrap the single image object in an array
      } else {
        images = await ImagePicker.openPicker(options);
        if (!Array.isArray(images)) {
          images = [images]; // Ensure images is an array
        }
      }
  
      if (images.length > 4) {
        Alert.alert(t('error'), 'You can only upload a maximum of 4 images.');
      } else {
        cropImages(images);
      }
    } catch (error) {
      console.error('ImagePicker Error: ', error);
      Alert.alert(t('error'), `${t('imagePickerError')}: ${error.message}`);
    }
  
    setModalVisible(false);
  };
  
  const cropImages = async (images) => {
    for (const image of images) {
      setCroppingImage(image);
      const croppedImage = await ImagePicker.openCropper({
        path: image.path,
        width: 1024,
        height: 1024,
      });
      const resizedImageUri = await resizeImage(croppedImage.path);
      setImgUrls((prevUrls) => [...prevUrls, resizedImageUri]);

      const aiDetails = await getAiDetails(resizedImageUri);
      setAiGeneratedDetails((prevDetails) => ({ ...prevDetails, ...aiDetails }));
    }
  };


  const resizeImage = async (imageUri) => {
    try {
      const resizedImage = await ImageResizer.createResizedImage(
        imageUri,
        1024,
        1024,
        'JPEG',
        80
      );
      return resizedImage.uri;
    } catch (error) {
      console.error('Error resizing image: ', error);
      Alert.alert(t('error'), `${t('imageResizingError')}: ${error.message}`);
      return imageUri;
    }
  };

  const getAiDetails = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      const visionRequest = {
        requests: [
          {
            image: {
              content: base64,
            },
            features: [{ type: 'LABEL_DETECTION', maxResults: 10 }],
          },
        ],
      };

      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=your api key `,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(visionRequest),
        }
      );

      if (!visionResponse.ok) {
        throw new Error(`Vision API request failed with status ${visionResponse.status}`);
      }

      const visionData = await visionResponse.json();
      console.log('Vision Data:', visionData); // Debug log for visionData

      let name = 'Unknown';
      let description = 'No description available';
      let age = 'Unknown';

      if (visionData.responses && visionData.responses.length > 0) {
        const labelAnnotations = visionData.responses[0].labelAnnotations;
        if (labelAnnotations && labelAnnotations.length > 0) {
          name = labelAnnotations[0].description;
          description = labelAnnotations.map((annotation) => annotation.description).join(', ');
          // Logic to estimate the age can be added here
        }
      }

      return { name, description, age };
    } catch (error) {
      console.error('Error getting AI details: ', error);
      Alert.alert('Error', `Error getting AI details: ${error.message}`);
      return { name: 'Error', description: 'Error in AI detection', age: 'Error' };
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };




  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert(t('error'), t('noUser'));
      return;
    }

    const userId = user.uid;
    const descriptionWordCount = productDescription.trim().split(/\s+/).length;
    if (!productName || !address || !contacts || !productDescription || !productAge || !price || imgUrls.length !== 4 || !selectedState || !selectedDistrict || !selectedCity) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    } else if (descriptionWordCount < 20) {
      Alert.alert(t('error'), t('descriptionWordCountError'));
      return;
    } else if (contacts.length !== 10) {
      Alert.alert(t('error'), t('contactError'));
      return;
    } else if (productAge.length > 4) {
      Alert.alert(t('error'), t('productAgeError'));
      return;
    }

    setIsLoading(true);

    try {
      let imageUrls = [];
      for (let i = 0; i < imgUrls.length; i++) {
        const imageUri = imgUrls[i];
        let blob;
        try {
          const response = await fetch(imageUri);
          blob = await response.blob();
        } catch (error) {
          console.error('Error fetching image: ', error);
          Alert.alert(t('error'), `Error fetching image: ${error.message}`);
          return;
        }

        const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
        const storageRef = ref(storage, `images/${filename}`);
        const snapshot = await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(snapshot.ref);
        imageUrls.push(downloadURL);
      }

      await addDoc(collection(firestore, selectedCategory), {
        userId,
        productName,
        address,
        contacts,
        productDescription,
        productAge,
        price,
        imgUrls: imageUrls,
        state: selectedState,
        district: selectedDistrict,
        city: selectedCity,
        productName1: aiGeneratedDetails.name,
        productDescription1: aiGeneratedDetails.description,
        productAge1: aiGeneratedDetails.age 
      });

      Alert.alert(t('success'), 'Product details submitted successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]);

      setProductName('');
      setAddress('');
      setContacts('');
      setProductDescription('');
      setProductAge('');
      setPrice('');
      setImgUrls([]);
      setSelectedState('');
      setSelectedDistrict('');
      setSelectedCity('');
      setAiGeneratedDetails(null);
    } catch (error) {
      console.error('Error submitting product details: ', error);
      Alert.alert(t('error'), `${t('uploadingError')}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const removeImage = (index) => {
    setImgUrls((prevUrls) => prevUrls.filter((_, i) => i !== index));
  };

  const modalSlideUp = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.headerText}>{t('addYourProductDetails')}</Text>
        
        <Text style={styles.label}>{t('selectCategory')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            mode="dropdown"
            prompt={t('selectCategory')}
            dropdownIconColor="#004d40"
            icon={() => <Icon name="arrow-drop-down" size={20} color="#004d40" />}
          >
            <Picker.Item label="Coins" value="Coins" />
            <Picker.Item label="Toy" value="Toy" />
            <Picker.Item label="Vehicle" value="Vehicle" />
            <Picker.Item label="Tool" value="Tool" />
            <Picker.Item label="Scientificitem" value="Scientificitem" />
            <Picker.Item label="Music" value="Music" />
            <Picker.Item label="Gewels" value="Gewels" />
            <Picker.Item label="Fashion" value="Fashion" />
            <Picker.Item label="Book" value="Book" />
            <Picker.Item label="Arts" value="Arts" />
            <Picker.Item label="Antique" value="Antique" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>

        <Text style={styles.label}>{t('selectState')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedState}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedState(itemValue)}
            mode="dropdown"
            prompt={t('selectState')}
            dropdownIconColor="#004d40"
            icon={() => <Icon name="arrow-drop-down" size={20} color="#004d40" />}
          >
            <Picker.Item label={t('selectState')} value="" />
            {Object.keys(statesAndDistricts).map((state) => (
              <Picker.Item key={state} label={state} value={state} />
            ))}
          </Picker>
        </View>

        {selectedState && (
          <>
            <Text style={styles.label}>{t('selectDistrict')}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedDistrict}
                style={styles.picker}
                onValueChange={(itemValue) => setSelectedDistrict(itemValue)}
                mode="dropdown"
                prompt={t('selectDistrict')}
                dropdownIconColor="#004d40"
                 icon={() => <Icon name="arrow-drop-down" size={20} color="#004d40" />}
              >
                <Picker.Item label={t('selectDistrict')} value="" />
                {statesAndDistricts[selectedState].map((district) => (
                  <Picker.Item key={district} label={district} value={district} />
                ))}
              </Picker>
            </View>
          </>
        )}

        {selectedDistrict && (
          <>
            <Text style={styles.label}>{t('selectCity')}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCity}
                style={styles.picker}
                onValueChange={(itemValue) => setSelectedCity(itemValue)}
              >
                <Picker.Item label={t('selectCity')} value="" />
                {districtsAndCities[selectedDistrict].map((city) => (
                  <Picker.Item key={city} label={city} value={city} />
                ))}
              </Picker>
            </View>
          </>
        )}

        <Text style={styles.label}>{t('productName')}</Text>
        <TextInput
          style={styles.input}
          value={productName}
          onChangeText={setProductName}
        />

        <Text style={styles.label}>{t('address')}</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.label}>{t('contacts')}</Text>
        <TextInput
          style={styles.input}
          value={contacts}
          onChangeText={setContacts}
          keyboardType="numeric"
        />

        <Text style={styles.label}>{t('productDescription')}</Text>
        <TextInput
          style={styles.textArea}
          value={productDescription}
          onChangeText={setProductDescription}
          multiline
        />

        <Text style={styles.label}>{t('productAge')}</Text>
        <TextInput
          style={styles.input}
          value={productAge}
          onChangeText={setProductAge}
          keyboardType="numeric"
        />

        <Text style={styles.label}>{t('price')}</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <Text style={styles.label}>{t('uploadImages')}</Text>
        <View style={styles.imageContainer}>
          {imgUrls.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity onPress={() => removeImage(index)} style={styles.removeImageButton}>
                <Text style={styles.removeImageButtonText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
          {imgUrls.length < 4 && (
            <TouchableOpacity style={styles.uploadButton} onPress={openModal}>
              <Text style={styles.uploadButtonText}>{t('upload')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('submit')}</Text>}
        </TouchableOpacity>

        <Modal visible={isModalVisible} transparent animationType="slide">
  <View style={styles.modalContainer}>
    <Animated.View style={[styles.modalContent, { transform: [{ translateY: modalSlideUp }] }]}>
      <TouchableOpacity style={styles.modalOption} onPress={() => handleImageUpload('camera')}>
        <Text style={styles.modalOptionText}>{t('camera')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.modalOption} onPress={() => handleImageUpload('gallery')}>
        <Text style={styles.modalOptionText}>{t('gallery')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.modalCancel} onPress={closeModal}>
        <Text style={styles.modalCancelText}>{t('cancel')}</Text>
      </TouchableOpacity>
    </Animated.View>
  </View>
</Modal>
      </View>
    </ScrollView>
  );
};





const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#e0f7fa',
    padding: 10,
  },
  innerContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginVertical: 10,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#00796b',
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#00796b',
    paddingBottom: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004d40',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#004d40',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#004d40',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#004d40',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#ffffff',
    height: 120,
    fontSize: 16,
    color: '#004d40',
    textAlignVertical: 'top',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#004d40',
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  picker: {
    height: 50,
    color: '#004d40',
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  uploadButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#ff5722',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  modalOptionText: {
    fontSize: 18,
    color: '#00796b',
    fontWeight: 'bold',
  },
  modalCancel: {
    padding: 15,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 18,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'red',
    borderRadius: 50,
    padding: 5,
  },
  removeImageButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default Additems;

