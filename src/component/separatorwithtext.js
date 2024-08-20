import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SeparatorWithText = ({ text }) => {
  return (
    <View style={styles.separatorContainer}>
      <View style={styles.line} />
      <Text style={styles.separatorText}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#C4C4C4',
  },
  separatorText: {
    marginHorizontal: 10,
    fontSize: 18,
    color: '#6200EE',
  },
});

export default SeparatorWithText;
