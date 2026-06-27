import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'paryatak_auth_token';
const REFRESH_TOKEN_KEY = 'paryatak_refresh_token';

export const setTokens = async (token: string, refreshToken?: string) => {
    try {
        if (Platform.OS === 'web') {
            localStorage.setItem(TOKEN_KEY, token);
            if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        } else {
            await SecureStore.setItemAsync(TOKEN_KEY, token);
            if (refreshToken) {
                await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
            }
        }
    } catch (e) {
        console.error('Failed to save tokens', e);
    }
};

export const getToken = async () => {
    try {
        if (Platform.OS === 'web') {
            return localStorage.getItem(TOKEN_KEY);
        }
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
        console.error('Failed to get token', e);
        return null;
    }
};

export const getRefreshToken = async () => {
    try {
        if (Platform.OS === 'web') {
            return localStorage.getItem(REFRESH_TOKEN_KEY);
        }
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (e) {
        console.error('Failed to get refresh token', e);
        return null;
    }
};

export const removeTokens = async () => {
    try {
        if (Platform.OS === 'web') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        } else {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        }
    } catch (e) {
        console.error('Failed to remove tokens', e);
    }
};
