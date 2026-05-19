import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const finesAPI = {
  getAll: (params) => api.get('/fines', { params }),
  getById: (id) => api.get(`/fines/${id}`),
  create: (data) => api.post('/fines', data),
  update: (id, data) => api.put(`/fines/${id}`, data),
  pay: (id) => api.patch(`/fines/${id}/pay`),
  delete: (id) => api.delete(`/fines/${id}`),
  getStats: () => api.get('/fines/stats'),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
