import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const UploaderDetails = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const { uploader } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('uploaderDetailsTitle')}</Text>
      <Image source={{ uri: uploader.userPhotoURL }} style={styles.userImage} />
      <Text style={styles.detail}>{`${t('name')}: ${uploader.userName}`}</Text>
      <Text style={styles.detail}>{`${t('email')}: ${uploader.userEmail}`}</Text>
      {/* Add more user details as needed */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  userImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  detail: {
    fontSize: 18,
    marginBottom: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default UploaderDetails;
