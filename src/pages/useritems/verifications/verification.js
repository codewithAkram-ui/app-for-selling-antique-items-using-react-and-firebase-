import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const Card = ({ title, description, imageSource, onPress, disabled }) => (
  <TouchableOpacity style={[styles.card, disabled && styles.cardDisabled]} onPress={onPress} disabled={disabled}>
    <View style={styles.cardContent}>
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <Image source={imageSource} style={styles.cardImage} />
    </View>
  </TouchableOpacity>
);

const Verification = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [idProofSubmitted, setIdProofSubmitted] = useState(false);
  const [facialProofSubmitted, setFacialProofSubmitted] = useState(false);

  useEffect(() => {
    const checkProofSubmissions = async () => {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          setIdProofSubmitted(userDoc.data().idProofSubmitted || false);
          setFacialProofSubmitted(userDoc.data().facialProofSubmitted || false);
        }
      }
      setLoading(false);
    };

    checkProofSubmissions();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  const handlePress = (type) => {
    if (type === 'ID') {
      navigation.navigate('Idproof');
    } else if (type === 'Facial') {
      navigation.navigate('FacialRecognition');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Image source={require('../../../assets/back.png')} style={styles.backImage} />
      </TouchableOpacity>
      <Card
        title="ID Proof"
        description="Verify your identity with your ID card."
        imageSource={require('../../../assets/id.png')}
        onPress={() => handlePress('ID')}
        disabled={idProofSubmitted}
      />
      <Card
        title="Facial Proof"
        description="Verify your identity with a facial scan."
        imageSource={require('../../../assets/facial.png')}
        onPress={() => handlePress('Facial')}
        disabled={!idProofSubmitted || facialProofSubmitted}
      />
    </View>
  );
};

const { width } = Dimensions.get('window');
const CARD_HEIGHT = 150;
const CARD_WIDTH = width * 0.9;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  backImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginVertical: 15,
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderLeftWidth: 5,
    borderLeftColor: '#3b82f6',
  },
  cardDisabled: {
    backgroundColor: '#d3d3d3',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e293b',
  },
  cardDescription: {
    fontSize: 16,
    color: '#64748b',
  },
  cardImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
});

export default Verification;
