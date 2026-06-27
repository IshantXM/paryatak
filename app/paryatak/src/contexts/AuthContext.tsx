import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { getToken, removeTokens } from '../utils/storage';

export type User = {
    _id: string;
    id?: string;
    name: string;
    phone_number: string;
    email: string;
    role: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    login: (userData: User) => void;
    logout: () => void;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: () => {},
    logout: () => {},
    refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshProfile = async () => {
        try {
            const token = await getToken();
            if (token) {
                const res = await api.get('/auth/profile');
                if (res.data?.success) {
                    setUser(res.data.data);
                } else {
                    setUser(null);
                }
            }
        } catch (e) {
            console.error('Failed to fetch profile', e);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshProfile();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // Ignore error if it fails
        }
        await removeTokens();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
