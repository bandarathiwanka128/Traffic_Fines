import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const finesAPI = {
  getAll: (params) => api.get('/fines', { params }),
  getById: (id) => api.get(`/fines/${id}`),
  create: (data) => api.post('/fines', data),
  update: (id, data) => api.put(`/fines/${id}`, data),
  delete: (id) => api.delete(`/fines/${id}`),
  getStats: () => api.get('/fines/stats'),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => authAPI.register(data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const paymentsAPI = {
  confirm: (data) => api.post('/payments/confirm', data),
  getByFine: (fineId) => api.get(`/payments/fine/${fineId}`),
};

export const publicAPI = {
  categories: () => api.get('/public/categories'),
  lookup: (data) => api.post('/public/fines/lookup', data),
  checkout: (data) => api.post('/public/payments/checkout', data),
  session: (id) => api.get(`/public/payments/session/${id}`),
};

export default api;
