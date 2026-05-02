import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../constants/api';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Automatically inject JWT token into every authenticated request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to read token from SecureStore:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses globally (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired – try to refresh or force logout
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(
            `${API_CONFIG.BASE_URL}/api/auth/token/refresh/`,
            { refresh: refreshToken }
          );
          await SecureStore.setItemAsync('accessToken', data.access);
          // Retry the original request with new token
          error.config.headers.Authorization = `Bearer ${data.access}`;
          return apiClient.request(error.config);
        }
      } catch (refreshError) {
        // Refresh also failed - user needs to re-login
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email, password) =>
    apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, { email, password }),

  register: (userData) =>
    apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, userData),
};

// Posts/Feed endpoints
export const postsAPI = {
  getAll: () => apiClient.get(API_CONFIG.ENDPOINTS.POSTS),
  create: (postData) => apiClient.post(API_CONFIG.ENDPOINTS.POSTS, postData),
};

// Users endpoints
export const usersAPI = {
  getAll: (search = '') =>
    apiClient.get(`${API_CONFIG.ENDPOINTS.USERS}?search=${search}`),
  getProfile: () => apiClient.get(API_CONFIG.ENDPOINTS.PROFILE),
  updateProfile: (data) => apiClient.patch(API_CONFIG.ENDPOINTS.PROFILE, data),
};

// Communities endpoints
export const communitiesAPI = {
  getAll: () => apiClient.get(API_CONFIG.ENDPOINTS.COMMUNITIES),
};

export default apiClient;
