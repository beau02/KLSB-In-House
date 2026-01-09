import api from './api';

export const authService = {
  login: async (email, password, captchaToken = null) => {
    const payload = { email, password };
    if (captchaToken) {
      payload.captchaToken = captchaToken;
    }
    const response = await api.post('/auth/login', payload);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    }

    // If server responded but no token was provided, throw so UI can handle it
    throw new Error(response.data?.message || 'Authentication succeeded but no token returned');
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const userService = {
  getAll: async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  permanentDelete: async (id) => {
    const response = await api.delete(`/users/${id}/permanent`);
    return response.data;
  }
};

export const departmentService = {
  getAll: async () => {
    const response = await api.get('/departments');
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
  },

  create: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  update: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  addArea: async (id, area) => {
    const response = await api.post(`/projects/${id}/areas`, { area });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
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

  getByUser: async (userId, params) => {
    const response = await api.get(`/timesheets/user/${userId}`, { params });
    return response.data;
  },

  getByProject: async (projectId) => {
    const response = await api.get(`/timesheets/project/${projectId}`);
    return response.data;
  },

  create: async (timesheetData) => {
    const response = await api.post('/timesheets', timesheetData);
    return response.data;
  },

  update: async (id, timesheetData) => {
    const response = await api.put(`/timesheets/${id}`, timesheetData);
    return response.data;
  },

  submit: async (id) => {
    const response = await api.patch(`/timesheets/${id}/submit`);
    return response.data;
  },

  approve: async (id, comments) => {
    if (!id) {
      throw new Error('Invalid timesheet id');
    }
    const response = await api.patch(`/timesheets/${id}/approve`, { comments });
    return response.data;
  },

  reject: async (id, rejectionReason, comments = '') => {
    const response = await api.patch(`/timesheets/${id}/reject`, { rejectionReason, comments });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/timesheets/${id}`);
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

export const statsService = {
  getDashboard: async () => {
    const response = await api.get('/stats/dashboard');
    return response.data;
  }
};

export const overtimeRequestService = {
  getMyRequests: async () => {
    const response = await api.get('/overtime-requests/my-requests');
    return response.data;
  },

  getAll: async (params) => {
    const response = await api.get('/overtime-requests', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/overtime-requests/${id}`);
    return response.data;
  },

  create: async (requestData) => {
    const response = await api.post('/overtime-requests', requestData);
    return response.data;
  },

  update: async (id, requestData) => {
    const response = await api.put(`/overtime-requests/${id}`, requestData);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.put(`/overtime-requests/${id}/approve`);
    return response.data;
  },

  reject: async (id, rejectionReason) => {
    const response = await api.put(`/overtime-requests/${id}/reject`, { rejectionReason });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/overtime-requests/${id}`);
    return response.data;
  }
};

// Re-export the axios instance so modules can import { api } from './services'
export { default as api } from './api';
