import axios from 'axios';
import { safeLocalStorage } from './storage';

// Create a function to get the API instance
const createApiInstance = () => {
    const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    api.interceptors.request.use((config) => {
        const token = safeLocalStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    return api;
};

// Export a singleton instance
const api = createApiInstance();

export default api;

