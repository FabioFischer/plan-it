import React from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';

import _ from 'lodash';

export default ({ onChange, name, secure, placeholder, value }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{_.capitalize(placeholder)}:</Text>
      <TextInput style={styles.field} value={value ? value : ''} autoCorrect={false} placeholder={placeholder ? placeholder : ''} secureTextEntry={secure} onChangeText={value => onChange({ fieldValue: value, fieldName: name })}></TextInput>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10
  },
  label: {
    fontSize: 26,
    marginBottom: 7.5
  },
  field: {
    height: 40
  }
});