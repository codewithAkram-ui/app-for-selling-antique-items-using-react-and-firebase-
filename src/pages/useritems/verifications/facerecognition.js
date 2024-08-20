import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const FacialRecognition = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const captureAndCropImage = async () => {
    try {
      const image = await ImagePicker.openCamera({
        cropping: true,
        width: 300,
        height: 400,
        includeBase64: true,
        useFrontCamera: true,
      });
      return image.path;
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  };

  const uploadImageToFirebase = async (uri) => {
    const filename = `facial_proofs/${new Date().toISOString()}.jpg`;
    const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
    const storageRef = storage().ref(filename);
    await storageRef.putFile(uploadUri);
    return await storageRef.getDownloadURL();
  };

  const submitFacialToFirebase = async (uri) => {
    setLoading(true);
    try {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().facialProofSubmitted) {
          setSubmissionResult('Facial proof already submitted!');
        } else {
          const imageUrl = await uploadImageToFirebase(uri);
          await firestore()
            .collection('users')
            .doc(user.uid)
            .set(
              {
                facialImage: imageUrl,
                
              },
              { merge: true }
            );
          setSubmissionResult('Facial proof submitted successfully!');
          setTimeout(() => navigation.goBack(), 1000); // Navigate back after 1 seconds
        }
      } else {
        setSubmissionResult('User not authenticated!');
      }
    } catch (error) {
      console.error(error);
      setSubmissionResult('Error submitting facial proof!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleCaptureAndSubmit = async () => {
      const uri = await captureAndCropImage();
      if (uri) {
        await submitFacialToFirebase(uri);
      }
    };

    handleCaptureAndSubmit();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        submissionResult && <Text style={styles.resultText}>{submissionResult}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    marginTop: 10,
    fontSize: 16,
    color: 'black',
  },
});

export default FacialRecognition;
