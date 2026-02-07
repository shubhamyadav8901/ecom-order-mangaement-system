import axios from 'axios';

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Important for sending cookies
});

export const setAccessToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !requestUrl.includes('/auth/refresh-token')
    ) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt refresh via HttpOnly cookie
        const { data } = await api.post('/auth/refresh-token');
        setAccessToken(data.accessToken);

        processQueue(null, data.accessToken);
        originalRequest.headers['Authorization'] = 'Bearer ' + data.accessToken;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        setAccessToken(null);
        // Do not redirect immediately, let the app handle auth state
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
