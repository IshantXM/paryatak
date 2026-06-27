import { Platform } from 'react-native';
import axios from 'axios';
import { getToken, getRefreshToken, setTokens, removeTokens } from './storage';

// Automatically handle Web vs Mobile local API URL
const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
    if (Platform.OS === 'web') return 'http://localhost:5000/api';
    if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api'; // Android Emulator
    return 'http://192.168.1.33:5000/api'; // Physical device fallback
};

export const BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 Unauthorized globally
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await getRefreshToken();
                if (refreshToken) {
                    const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
                    if (res.data?.success && res.data.data?.accessToken) {
                        const newAccessToken = res.data.data.accessToken;
                        const newRefreshToken = res.data.data.refreshToken;
                        await setTokens(newAccessToken, newRefreshToken);
                        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                        return api(originalRequest);
                    }
                }
            } catch (refreshError) {
                // Remove tokens if refresh fails to force logout
                await removeTokens();
            }
        }
        return Promise.reject(error);
    }
);

export default api;
