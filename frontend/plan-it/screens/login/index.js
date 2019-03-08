import React, { Component } from 'react';
import { Alert, Image, View, Button, StyleSheet } from 'react-native';
import AuthService from './../../services/auth';
import Components from './../../components';
import env from './../../env';

const logo = require('./../../assets/images/logo.png');

const styles = StyleSheet.create({
  header: {
    paddingTop: `10%`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    transform: [
      { scaleX: 1.25 },
      { scaleY: 1.25 }
    ]
  },
  login: {
    marginTop: 15,
    marginLeft: 40,
    marginRight: 40
  }
});

class LoginScreen extends Components.PyxisComponent {
  static navigationOptions = {
    title: 'Login'
  };

  constructor(props) {
    super(props);

    console.log('teste')
    this.state = { password: '', email: '' };
  }

  onFieldChange(event) {
    const changeObject = {};
    changeObject[event.fieldName] = event.fieldValue;

    this.setState(changeObject);
  }

  async onLogin() {
    try {
      const services = await AuthService.signIn(env.API_URL, {
        email: this.state.email,
        password: this.state.password
      });

      //this.navigate('Home', { services });
    } catch (err) {
      Alert.alert('Oops!', err.message);
    }
  }

  onRegister() {
    this.navigate('NewUser');
  }
  
  render() {
    return (
      <View>
        <View style={styles.header}>
          <Image style={styles.logo} source={logo} />
        </View>
        <View style={styles.login}>
          <Components.TextField value={this.state.email} name="email" placeholder="Email" onChange={e => this.onFieldChange(e)}></Components.TextField>
          <Components.TextField value={this.state.password} name="password" placeholder="Password" secure={true} onChange={e => this.onFieldChange(e)}></Components.TextField>
          <View style={styles.login_actions}>
            <View style={{ marginBottom: 8 }}>
              <Button title="Login" onPress={() => this.onLogin()}></Button>
            </View>
            <View style={{ marginBottom: 8 }}>
              <Button title="Nova Conta" onPress={() => this.onRegister()}></Button>
            </View>
            {/*<View style={{ marginBottom: 8 }}>
              <Button title="Esqueci a senha" onPress={() => this.onForgetPassword()}></Button>
            </View>*/}
          </View>
        </View>
      </View>
    );
  }
}

export default LoginScreen;