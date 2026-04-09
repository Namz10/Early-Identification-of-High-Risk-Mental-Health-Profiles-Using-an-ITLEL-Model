import axios from 'axios';

let serviceErrorBannerShown = false;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    serviceErrorBannerShown = false;
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/';
      } else if (error.response.status === 403) {
        // Dispatch custom event for toast
        window.dispatchEvent(new CustomEvent('api:forbidden', {
          detail: 'Access restricted: You do not have permission to perform this action.'
        }));
      } else if (error.response.status >= 500) {
        if (!serviceErrorBannerShown) {
          serviceErrorBannerShown = true;
          window.dispatchEvent(new CustomEvent('api:server-error', {
            detail: 'Service temporarily unavailable. Please try again later.'
          }));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
