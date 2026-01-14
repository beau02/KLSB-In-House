import api, { cachedGet, clearCacheEntry, clearApiCache } from './api';

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
    // Staff data should always be fresh; skip cache to avoid stale lists after edits
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await api.get(`/users${queryString}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData) => {
    const response = await api.post('/users', userData);
    clearCacheEntry('/users');
    clearCacheEntry(`/users/${response.data?.user?._id || ''}`);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    clearCacheEntry('/users');
    clearCacheEntry(`/users/${id}`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    clearCacheEntry('/users');
    clearCacheEntry(`/users/${id}`);
    return response.data;
  },

  permanentDelete: async (id) => {
    const response = await api.delete(`/users/${id}/permanent`);
    clearCacheEntry('/users');
    clearCacheEntry(`/users/${id}`);
    return response.data;
  }
};

export const departmentService = {
  getAll: async () => {
    const { data } = await cachedGet('/departments', { ttl: 600 });
    return data;
  }
};

export const projectService = {
  getAll: async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const { data } = await cachedGet(`/projects${queryString}`, { ttl: 300 });
    return data;
  },

  getById: async (id) => {
    const { data } = await cachedGet(`/projects/${id}`, { ttl: 300 });
    return data;
  },

  create: async (projectData) => {
    const response = await api.post('/projects', projectData);
    clearCacheEntry('/projects');
    return response.data;
  },

  update: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    clearCacheEntry('/projects');
    clearCacheEntry(`/projects/${id}`);
    return response.data;
  },

  addArea: async (id, area) => {
    const response = await api.post(`/projects/${id}/areas`, { area });
    clearCacheEntry(`/projects/${id}`);
    return response.data;
  },

  addPlatform: async (id, platform) => {
    const response = await api.post(`/projects/${id}/platforms`, { platform });
    clearCacheEntry(`/projects/${id}`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    clearCacheEntry('/projects');
    clearCacheEntry(`/projects/${id}`);
    return response.data;
  }
};

export const timesheetService = {
  getAll: async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const { data } = await cachedGet(`/timesheets${queryString}`, { ttl: 180 });
    return data;
  },

  getById: async (id) => {
    const { data } = await cachedGet(`/timesheets/${id}`, { ttl: 180 });
    return data;
  },

  getByUser: async (userId, params, options = {}) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const url = `/timesheets/user/${userId}${queryString}`;
    
    // If bypassCache is true, clear cache first and fetch fresh
    if (options.bypassCache) {
      clearCacheEntry(url);
      console.log('BYPASSING CACHE for:', url);
      const response = await api.get(url);
      return response.data;
    }
    
    const { data } = await cachedGet(url, { ttl: 180 });
    return data;
  },

  getByProject: async (projectId) => {
    const { data } = await cachedGet(`/timesheets/project/${projectId}`, { ttl: 180 });
    return data;
  },

  create: async (timesheetData) => {
    const response = await api.post('/timesheets', timesheetData);
    clearCacheEntry('/timesheets');
    return response.data;
  },

  update: async (id, timesheetData) => {
    console.log('Sending PUT request to /timesheets/' + id);
    console.log('Data:', timesheetData);
    const response = await api.put(`/timesheets/${id}`, timesheetData);
    console.log('Update response:', response.data);
    
    // Clear all caches
    clearCacheEntry('/timesheets');
    clearCacheEntry(`/timesheets/${id}`);
    clearCacheEntry('/timesheets/user');
    
    return response.data;
  },

  submit: async (id) => {
    const response = await api.patch(`/timesheets/${id}/submit`);
    clearCacheEntry('/timesheets');
    clearCacheEntry(`/timesheets/${id}`);
    return response.data;
  },

  approve: async (id, comments) => {
    if (!id) {
      throw new Error('Invalid timesheet id');
    }
    const response = await api.patch(`/timesheets/${id}/approve`, { comments });
    clearCacheEntry('/timesheets');
    clearCacheEntry(`/timesheets/${id}`);
    return response.data;
  },

  reject: async (id, rejectionReason, comments = '') => {
    const response = await api.patch(`/timesheets/${id}/reject`, { rejectionReason, comments });
    clearCacheEntry('/timesheets');
    clearCacheEntry(`/timesheets/${id}`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/timesheets/${id}`);
    clearCacheEntry('/timesheets');
    clearCacheEntry(`/timesheets/${id}`);
    return response.data;
  },

  checkConflicts: async (month, year, entries, timesheetId = null) => {
    const response = await api.post('/timesheets/check-conflicts', {
      month,
      year,
      entries,
      timesheetId
    });
    return response.data;
  },

  getConflictDetails: async (month, year, date, timesheetId = null) => {
    const response = await api.post('/timesheets/conflicts-details', {
      month,
      year,
      date,
      timesheetId
    });
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
