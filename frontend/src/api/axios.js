import axios from 'axios';

// Updated to use port 5001 to match the backend server port
const instance = axios.create({
    baseURL: 'http://localhost:5001/api',
});

// Intercepts every request and adds the Authorization header if a token exists
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepts responses and handles 401 errors globally
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // For 401 errors, remove the token but don't automatically redirect
            // Let the component handle the redirect as needed
            console.log('401 Unauthorized - Removing token from localStorage');
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            // Instead of forcing a redirect, we'll let the app handle it
            // The AuthContext will update and components can respond accordingly
        }
        return Promise.reject(error);
    }
);

export default instance;