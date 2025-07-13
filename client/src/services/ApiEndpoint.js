import axios from 'axios'

const instance = axios.create({
    baseURL:'http://localhost:5000',
    headers:{
        'Content-Type': 'application/json'
    },
    withCredentials: false  // Changed from true to false since we're using Bearer tokens
})
export const verifyUser = () => get('/api/verify');
export const get = (url, params) => instance.get(url, { params });
export const post = (url, data) => instance.post(url, data);
export const put = (url, data) => instance.put(url, data);
export const deleteUser = (url) => instance.delete(url);
export const deleteReq = (url) => instance.delete(url);


  instance.interceptors.request.use(function (config) {
    // Add authorization token to all requests
    const token = localStorage.getItem('authToken');
    console.log('Request interceptor - Token:', token ? 'Token exists' : 'No token found');
    console.log('Request URL:', config.baseURL + config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers.Authorization);
    } else {
      console.warn('No authentication token found in localStorage');
    }
    return config;
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
  });

// Add a response interceptor
instance.interceptors.response.use(function (response) {
    console.log('Response interceptor - Success:', response.status, response.config.url);
    return response;
  }, function (error) {
    console.log('Response interceptor - Error:', error.response?.status, error.config?.url);
    console.log('Error details:', error.response?.data);
    
    // Handle 401 Unauthorized responses
    if (error.response && error.response.status === 401) {
      console.warn('401 Unauthorized - Clearing token and redirecting to login');
      // Clear token from localStorage
      localStorage.removeItem('authToken');
      // Redirect to login page
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  });