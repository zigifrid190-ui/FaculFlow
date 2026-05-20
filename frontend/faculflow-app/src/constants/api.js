// API configuration
// In production, this points to the Railway deployment.
// In development, change DEV_IP to your local machine IP.

const DEV_IP = '192.168.1.103';

// Set your Railway URL here after deploying
const PRODUCTION_URL = 'https://faculflow-production.up.railway.app';

export const API_CONFIG = {
  BASE_URL: PRODUCTION_URL, // Forçado para apresentação
  ENDPOINTS: {
    LOGIN: '/api/auth/login/',
    REGISTER: '/api/auth/register/',
    POSTS: '/api/posts/',
    USERS: '/api/users/',
    PROFILE: '/api/users/me/',
    TAGS: '/api/tags/',
    COMMUNITIES: '/api/communities/',
    COMMUNITY_DETAIL: (id) => `/api/communities/${id}/`,
    COMMUNITY_JOIN: (id) => `/api/communities/${id}/join/`,
    COMMUNITY_MESSAGES: (id) => `/api/communities/${id}/messages/`,
    COMMUNITY_REPORT: (id) => `/api/communities/${id}/report/`,
    MATCH_FEED: '/api/match/feed/',
    MATCH_ACTION: '/api/match/action/',
    MATCH_REQUESTS: '/api/match/requests/',
    POST_LIKE: (id) => `/api/posts/${id}/like/`,
    POST_BOOKMARK: (id) => `/api/posts/${id}/bookmark/`,
    POST_COMMENTS: (id) => `/api/posts/${id}/comments/`,
    CHAT_CONVERSATIONS: '/api/chat/conversations/',
    CHAT_MESSAGES: '/api/chat/messages/',
    NOTIFICATIONS: '/api/notifications/',
    NOTIFICATIONS_UNREAD: '/api/notifications/unread-count/',
    NOTIFICATION_READ: (id) => `/api/notifications/${id}/read/`,
    BATTLE_PASS: '/api/user/battle-pass/',
    BATTLE_PASS_CLAIM: '/api/user/battle-pass/claim/',
  },
  TIMEOUT: 15000,
};
