import _ from 'lodash';
import { Component } from 'react';

export default class PlnItComponent extends Component {
  get services() {
    return _.get(this.props.navigation, 'state.params.services');
  }

  navigate(routeName, params = {}) {
    const navigateOldParams = _.get(this.props.navigation, 'state.params.navigateParams');
    const newParams = {};

    this.props.navigation.navigate(routeName, _.assign(newParams, {
      services: this.services,
      navigateParams: [routeName, newParams],
      navigateOldParams
    }, params));
  }

  goBack() {
    const navigateOldParams = _.get(this.props.navigation, 'state.params.navigateOldParams');
    this.props.navigation.navigate(...navigateOldParams);
  }

  isMaintainer() {
    return true;
  }
}