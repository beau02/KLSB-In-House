import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export const timesheetService = {
  getAll: async (params) => {
    const response = await api.get('/timesheets', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/timesheets/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/timesheets', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/timesheets/${id}`, data);
    return response.data;
  },

  submit: async (id) => {
    const response = await api.patch(`/timesheets/${id}/submit`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/timesheets/${id}`);
    return response.data;
  }
};

export const projectService = {
  getAll: async (params) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  }
};

export const reportService = {
  getMonthly: async (month, year) => {
    const response = await api.get('/reports/monthly', { params: { month, year } });
    return response.data;
  },

  getByProject: async (projectId, startDate, endDate) => {
    const response = await api.get('/reports/by-project', { 
      params: { projectId, startDate, endDate } 
    });
    return response.data;
  },

  getByUser: async (userId, startDate, endDate) => {
    const response = await api.get('/reports/by-user', { 
      params: { userId, startDate, endDate } 
    });
    return response.data;
  }
};
