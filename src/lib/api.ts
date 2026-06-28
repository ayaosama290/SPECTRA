import axios from 'axios';

const isProd = (import.meta as any).env?.PROD;
const VITE_API_URL = (import.meta as any).env?.VITE_API_BASE_URL;

// The backend URL for the API
const NGROK_URL = 'https://graduation-test-production.up.railway.app';

// Determine the best base URL
// We use an empty string for BASE_URL to allows us to specify full paths like /api/... in our calls
// This is more reliable for the Vite proxy to catch the requests.
let BASE_URL = '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  async (response) => {
    // If we receive HTML when we expect JSON (like AI Studio warmup page), we treat it as an error
    // but only if it looks like the specific warmup page/ngrok warning
    if (response.data && typeof response.data === 'string' && 
        (response.data.includes('<!doctype html>') || response.data.includes('<html')) &&
        (response.data.includes('Starting Server') || response.data.includes('ngrok') || response.data.includes('Starting up'))) {
      
      const config = response.config as any;
      config._warmupRetryCount = config._warmupRetryCount || 0;
      
      if (config._warmupRetryCount < 3) {
        config._warmupRetryCount++;
        const delay = config._warmupRetryCount * 2000;
        console.warn(`[API] Warmup/HTML response detected. Retrying in ${delay}ms (Attempt ${config._warmupRetryCount})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }

      const error = new Error('HTML response received from API');
      (error as any).response = response;
      return Promise.reject(error);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Don't intercept 401s for login/token paths
    const isLoginPath = originalRequest.url?.includes('/api/users/login/') || 
                       originalRequest.url?.includes('/api/users/token/refresh/');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginPath) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        
        const response = await api.post('/api/users/token/refresh/', {
          refresh: refreshToken,
        });
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Only redirect if not already on login page to avoid refresh loops
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Check for specific network failure or proxy errors to redirect to Server Down page
    const serverDownPhrases = [
      "Client network socket disconnected",
      "secure TLS connection was established",
      "ECONNRESET",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "Network Error"
    ];
    
    const errorMessage = (error.message || "").toString();
    const errorCode = (error.code || "").toString();
    const isNetworkError = !error.response && (errorCode || errorMessage);
    const isProxyError = error.response?.status >= 502 && error.response?.status <= 504;
    
    const matchesPhrase = serverDownPhrases.some(phrase => errorMessage.includes(phrase));

    if (matchesPhrase || isNetworkError || isProxyError) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/server-down') {
        const isAuthCheck = originalRequest.url?.includes('/api/users/');
        // Don't redirect for specific background check failures, only key UI parts
        const isBackgroundRequest = originalRequest.url?.includes('/api/reports/') || 
                                   originalRequest.url?.includes('/api/reports/tasks/');

        if (!isAuthCheck && !isBackgroundRequest) {
          console.error('[API] Server Connectivity Issue detected:', {
            message: errorMessage,
            code: errorCode,
            status: error.response?.status
          });
          window.location.href = '/server-down';
        } else {
          console.warn('[API] Connectivity issue on background/auth request (ignored redirect):', errorMessage);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
