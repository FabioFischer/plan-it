import React from 'react';
import { AppRegistry } from 'react-native';
import { createDrawerNavigator } from 'react-navigation';

import Screens from './screens';

const PlnIt = createDrawerNavigator({
  Login: { screen: Screens.Login },
  NewUser: { screen: Screens.NewUser }
});

const M = () => {
  return (
    <PlnIt></PlnIt>
  );
};

AppRegistry.registerComponent('plan-it', () => M);
