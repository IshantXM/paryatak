import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import api from '../src/utils/api';
import { setTokens } from '../src/utils/storage';
import { ShieldCheck } from 'lucide-react-native';

export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const { refreshProfile } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!phone || !password) {
            setError('Please enter both phone and password.');
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            const res = await api.post('/auth/login', { phone_number: phone, password });
            if (res.data?.success) {
                const { accessToken, refreshToken } = res.data.data;
                await setTokens(accessToken, refreshToken);
                await refreshProfile();
                router.replace('/(tabs)');
            } else {
                setError(res.data?.message || 'Login failed');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Network error: Cannot reach server (Check IP address)';
            setError(msg);
            console.error("Login Error:", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <ShieldCheck color="#ffffff" size={48} strokeWidth={2} />
                    </View>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to Paryatak</Text>
                </View>

                <View style={styles.card}>
                    {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}
                    
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., 9876543210"
                        placeholderTextColor="#9ca3af"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />
                    
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#9ca3af"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    
                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                    
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/signup')}>
                            <Text style={styles.linkText}>Create one</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc', // Light modern background
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 32,
        shadowColor: '#94a3b8',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        color: '#0f172a',
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#3b82f6', 
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    errorContainer: {
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
        fontWeight: '500',
        fontSize: 14,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#64748b',
        fontSize: 15,
    },
    linkText: {
        color: '#3b82f6',
        fontWeight: '700',
        fontSize: 15,
    }
});
