import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { auth } from '../../../firebase/firebaseconfig';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmNewPasswordVisible, setConfirmNewPasswordVisible] = useState(false);

  const reauthenticate = async (currentPassword) => {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    return reauthenticateWithCredential(user, credential);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    try {
      await reauthenticate(currentPassword);
      const user = auth.currentUser;
      await updatePassword(user, newPassword);
      Alert.alert('Password changed', 'Your password has been changed successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <LinearGradient colors={['#141E30', '#243B55']} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.title}>Change Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Current Password"
            placeholderTextColor="#999"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!currentPasswordVisible}
          />
          <TouchableOpacity
            onPress={() => setCurrentPasswordVisible(!currentPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Image
              source={
                currentPasswordVisible
                  ? require('../../../assets/eye1.png')
                  : require('../../../assets/eye.png')
              }
              style={styles.eyeImage}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#999"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!newPasswordVisible}
          />
          <TouchableOpacity
            onPress={() => setNewPasswordVisible(!newPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Image
              source={
                newPasswordVisible
                  ? require('../../../assets/eye1.png')
                  : require('../../../assets/eye.png')
              }
              style={styles.eyeImage}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            placeholderTextColor="#999"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            secureTextEntry={!confirmNewPasswordVisible}
          />
          <TouchableOpacity
            onPress={() => setConfirmNewPasswordVisible(!confirmNewPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Image
              source={
                confirmNewPasswordVisible
                  ? require('../../../assets/eye1.png')
                  : require('../../../assets/eye.png')
              }
              style={styles.eyeImage}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
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
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ChangePassword;
