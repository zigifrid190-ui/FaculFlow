import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Offline-first cache helper
const fetchWithCache = async (cacheKey, apiCall) => {
  try {
    const response = await apiCall();
    await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
    return response; // Return original response object { data, status, ... }
  } catch (error) {
    if (!error.response) {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          return { data: JSON.parse(cached), fromCache: true };
        }
      } catch (cacheError) {
        console.warn('Cache read error', cacheError);
      }
    }
    throw error;
  }
};

// Posts/Feed endpoints
export const postsAPI = {
  getAll: (cursor = '') => fetchWithCache(`cache_feed${cursor ? '_' + cursor : ''}`, () => 
    apiClient.get(`${API_CONFIG.ENDPOINTS.POSTS}${cursor ? `?cursor=${cursor}` : ''}`)
  ),
  create: (postData) => apiClient.post(API_CONFIG.ENDPOINTS.POSTS, postData),
  toggleLike: (id) => apiClient.post(API_CONFIG.ENDPOINTS.POST_LIKE(id)),
  toggleBookmark: (id) => apiClient.post(API_CONFIG.ENDPOINTS.POST_BOOKMARK(id)),
  getComments: (postId) => apiClient.get(API_CONFIG.ENDPOINTS.POST_COMMENTS(postId)),
  addComment: (postId, content, parent = null) => 
    apiClient.post(API_CONFIG.ENDPOINTS.POST_COMMENTS(postId), { content, parent }),
};

// Users endpoints
export const usersAPI = {
  getAll: (search = '') =>
    apiClient.get(`${API_CONFIG.ENDPOINTS.USERS}?search=${search}`),
  getProfile: () => fetchWithCache('cache_profile', () => apiClient.get(API_CONFIG.ENDPOINTS.PROFILE)),
  updateProfile: (data) => {
    const isFormData = data instanceof FormData;
    return apiClient.patch(API_CONFIG.ENDPOINTS.PROFILE, data, {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
      }
    });
  },
};

// Tags endpoints
export const tagsAPI = {
  getAll: () => apiClient.get(API_CONFIG.ENDPOINTS.TAGS),
};

// Communities endpoints
export const communitiesAPI = {
  getAll: (category = '', ordering = 'hot', page = 1) => fetchWithCache(`cache_communities_${category}_${ordering}_page_${page}`, () =>
    apiClient.get(`${API_CONFIG.ENDPOINTS.COMMUNITIES}?category=${category}&ordering=${ordering}&page=${page}`)
  ),
  create: (data) =>
    apiClient.post(API_CONFIG.ENDPOINTS.COMMUNITIES, data),
  getDetail: (id) =>
    apiClient.get(API_CONFIG.ENDPOINTS.COMMUNITY_DETAIL(id)),
  join: (id) =>
    apiClient.post(API_CONFIG.ENDPOINTS.COMMUNITY_JOIN(id)),
  getMessages: (id) =>
    apiClient.get(API_CONFIG.ENDPOINTS.COMMUNITY_MESSAGES(id)),
  sendMessage: (id, content) =>
    apiClient.post(API_CONFIG.ENDPOINTS.COMMUNITY_MESSAGES(id), { content }),
  report: (id, reason, details = '') =>
    apiClient.post(API_CONFIG.ENDPOINTS.COMMUNITY_REPORT(id), { reason, details }),
};

// Match endpoints
export const matchAPI = {
  getFeed: () => apiClient.get(API_CONFIG.ENDPOINTS.MATCH_FEED),
  getRequests: () => apiClient.get(API_CONFIG.ENDPOINTS.MATCH_REQUESTS),
  sendAction: (targetUserId, action) => 
    apiClient.post(API_CONFIG.ENDPOINTS.MATCH_ACTION, {
      target_user_id: targetUserId,
      action: action, // 'connect' or 'skip'
    }),
};

// Chat / DMs endpoints
export const chatAPI = {
  getConversations: () => apiClient.get(API_CONFIG.ENDPOINTS.CHAT_CONVERSATIONS),
  getMessages: (receiverId) => apiClient.get(`${API_CONFIG.ENDPOINTS.CHAT_MESSAGES}?receiver_id=${receiverId}`),
  sendMessage: (receiverId, content) => 
    apiClient.post(API_CONFIG.ENDPOINTS.CHAT_MESSAGES, { receiver: receiverId, content }),
};

// Notifications endpoints
export const notificationsAPI = {
  getAll: () => apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS),
  getUnreadCount: () => apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS_UNREAD),
  markAsRead: (id) => apiClient.post(API_CONFIG.ENDPOINTS.NOTIFICATION_READ(id)),
};

// Battle Pass endpoints
export const battlePassAPI = {
  getBattlePass: () => apiClient.get(API_CONFIG.ENDPOINTS.BATTLE_PASS),
  claimReward: (rewardId) => apiClient.post(API_CONFIG.ENDPOINTS.BATTLE_PASS_CLAIM, { reward_id: rewardId }),
};

export default apiClient;
