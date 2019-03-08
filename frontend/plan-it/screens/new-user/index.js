import React, { Component } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import Components from './../../components';
import env from './../../env';

import AuthService from './../../services/auth';

const styles = StyleSheet.create({
  header: {
    paddingTop: `20%`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newuser: {
    marginTop: 15,
    marginLeft: 40,
    marginRight: 40
  }
});

class NewUserScreen extends Components.PlnItComponent {
  static navigationOptions = {
    title: 'Novo usuário'
  };

  constructor() {
    super();

    this.state = {
      name: '',
      email: '',
      password: '',
    };
  }

  onFieldChange(event) {
    const changeObject = {};
    changeObject[event.fieldName] = event.fieldValue;

    this.setState(changeObject);
  }

  async onConfirm() {
    try {
      const services = await AuthService.signUp(env.API_URL, {
        name: this.state.name,
        email: this.state.email,
        password: this.state.password
      });   

      console.log('teste')

      //this.navigate('Home', { services });
    } catch (err) {
      Alert.alert('Oops!', err.message);
    }
  }

  onCancel() {
    this.navigate('Login');
  }

  render() {
    return (
      <View>
        <View style={styles.header}>
        </View>
        <View style={styles.newuser}>
          <Components.TextField value={this.state.name} name="name" placeholder="Nome" onChange={e => this.onFieldChange(e)}></Components.TextField>
          <Components.TextField value={this.state.email} name="email" placeholder="Email" onChange={e => this.onFieldChange(e)}></Components.TextField>
          <Components.TextField value={this.state.password} name="password" placeholder="Senha" secure={true} onChange={e => this.onFieldChange(e)}></Components.TextField>
        </View>
        <View>
          <Components.PButton title="Cadastrar" onPress={e => this.onConfirm()} />
          <Components.PButton title="Cancelar" onPress={e => this.onCancel()} />
        </View>
      </View>
    );
  }
}

export default NewUserScreen;