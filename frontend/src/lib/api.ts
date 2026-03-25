import axios from 'axios';
import { API_URL } from '../config';

export const api = axios.create({
    baseURL: API_URL,
});

// Interceptor to add the JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
