import { isNumber } from 'lodash';

const create = (route) => ({
  create(apiBase) {
    const api = apiBase.withRoute(route);

    const getAll = async (filters = {}) => await api.get('/', filters);
    const get = async id => await api.get(`/${id}`);
    const save = async model => {
      if (isNumber(model.id)) {
        return await api.put(`/${model.id}`, {
          data: model
        });
      }

      return await api.post('/', {
        data: model
      });
    };

    const destroy = async model => await api.destroy(`/${model.id}`);

    return { getAll, get, save, destroy };
  }
});

export default { create };
