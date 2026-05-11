import axios from 'axios';
import { API_URL } from '../config';

export const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error));

let isRefreshing = false;
let failedQueue: { resolve: (v: any) => void; reject: (e: any) => void }[] = [];

const processQueue = (error: any, token: string | null) => {
    failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        const isAuthEndpoint = original?.url?.includes('/auth/login') ||
            original?.url?.includes('/auth/register') ||
            original?.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && !isAuthEndpoint && !original._retry) {
            const storedRefresh = localStorage.getItem('refreshToken');

            if (!storedRefresh) {
                localStorage.removeItem('token');
                if (window.location.pathname !== '/auth') window.location.href = '/auth';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    original.headers.Authorization = `Bearer ${token}`;
                    return api(original);
                });
            }

            original._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: storedRefresh });
                const { accessToken, refreshToken: newRefresh } = data;
                localStorage.setItem('token', accessToken);
                if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                processQueue(null, accessToken);
                original.headers.Authorization = `Bearer ${accessToken}`;
                return api(original);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/auth') window.location.href = '/auth';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
