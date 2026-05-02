// API configuration
// In production, this points to the Railway deployment.
// In development, change DEV_IP to your local machine IP.

const DEV_IP = '192.168.1.103';

// Set your Railway URL here after deploying
const PRODUCTION_URL = 'https://faculflow-production.up.railway.app';

export const API_CONFIG = {
  BASE_URL: __DEV__ ? `http://${DEV_IP}:8000` : PRODUCTION_URL,
  ENDPOINTS: {
    LOGIN: '/api/auth/login/',
    REGISTER: '/api/auth/register/',
    POSTS: '/api/posts/',
    USERS: '/api/users/',
    PROFILE: '/api/users/me/',
    COMMUNITIES: '/api/communities/',
  },
  TIMEOUT: 15000,
};
