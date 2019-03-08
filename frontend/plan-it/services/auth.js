import _ from 'lodash';
import FetchApi from './fetchApi';
import repositories from './repositories';

const signUp = async (url, attributes) => {
  const fetchApi = FetchApi.create(url.trim());
  let { status, data, errors } = await fetchApi.post('/authentication', attributes);

  if (_.has(errors, 'full_messages')) {
    errors = errors.full_messages;
  }

  if (status === 'error') {
    throw new Error(_(errors).uniq().join('\n'));
  }

  return _.assign({ currentUser: data }, _.mapValues(
    _.mapKeys(repositories, _.rearg(_.camelCase, 1)),
    repository => repository.create(fetchApi)
  ));
};

const signIn = async (url, attributes) => {
  const fetchApi = FetchApi.create(url.trim());
  let { status, data, errors } = await fetchApi.post('/authentication/login', {data: attributes});

  if (_.has(errors, 'full_messages')) {
    errors = errors.full_messages;
  }

  if (status === 'error' || _.some(errors)) {
    throw new Error(_(errors).uniq().join('\n'));
  }

  return _.assign({ currentUser: data }, _.mapValues(
    _.mapKeys(repositories, _.rearg(_.camelCase, 1)),
    repository => repository.create(fetchApi)
  ));
}

export default { signUp, signIn };
