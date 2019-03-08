import { createDrawerNavigator, createStackNavigator, createAppContainer } from 'react-navigation';

import Screens from './screens';

const RootStack = createDrawerNavigator(
  {
    Login: Screens.Login,
    NewUser: Screens.NewUser,
  },
  {
    intialRouteName: 'Login',
    navigationOptions: { },
  }
);

const AppNavigator = createStackNavigator({
  Home: {
    screen: RootStack
  }
});

export default createAppContainer(AppNavigator);