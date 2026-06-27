import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import api from '../src/utils/api';
import { setTokens } from '../src/utils/storage';
import { UserPlus, Mail } from 'lucide-react-native';

export default function SignupScreen() {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const { refreshProfile } = useAuth();
    const router = useRouter();

    const handleInitiate = async () => {
        if (!name || !phone || !email || !password) {
            setError('Please complete all fields.');
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            const res = await api.post('/auth/signup/initiate', { name, phone_number: phone, email, password });
            if (res.data?.success) {
                setStep(2);
            } else {
                setError(res.data?.message || 'Initiation failed');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Network error: Cannot reach server (Check IP address)';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!otp) {
            setError('Please enter the OTP sent to your email.');
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            const res = await api.post('/auth/signup/verify', { email, otp });
            if (res.data?.success) {
                const { accessToken, refreshToken } = res.data.data;
                await setTokens(accessToken, refreshToken);
                await refreshProfile();
                router.replace('/(tabs)');
            } else {
                setError(res.data?.message || 'Verification failed');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Network error: Cannot reach server';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        {step === 1 ? (
                            <UserPlus color="#ffffff" size={40} strokeWidth={2} />
                        ) : (
                            <Mail color="#ffffff" size={40} strokeWidth={2} />
                        )}
                    </View>
                    <Text style={styles.title}>{step === 1 ? "Create Account" : "Verify Email"}</Text>
                    <Text style={styles.subtitle}>
                        {step === 1 ? "Join Paryatak today" : `We sent an OTP to ${email}`}
                    </Text>
                </View>

                <View style={styles.card}>
                    {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}
                    
                    {step === 1 ? (
                        <>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} />
                            
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput style={styles.input} placeholder="e.g., 9876543210" placeholderTextColor="#9ca3af" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                            
                            <Text style={styles.inputLabel}>Email Address</Text>
                            <TextInput style={styles.input} placeholder="john@example.com" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                            
                            <Text style={styles.inputLabel}>Password</Text>
                            <TextInput style={styles.input} placeholder="Create a strong password" placeholderTextColor="#9ca3af" secureTextEntry value={password} onChangeText={setPassword} />
                            
                            <TouchableOpacity style={styles.button} onPress={handleInitiate} disabled={loading}>
                                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Continue</Text>}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.inputLabel}>One-Time Password (OTP)</Text>
                            <TextInput style={styles.input} placeholder="Enter 6-digit OTP" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={otp} onChangeText={setOtp} />
                            
                            <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
                                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Verify & Complete</Text>}
                            </TouchableOpacity>
                            
                            <TouchableOpacity onPress={() => setStep(1)} style={{ marginTop: 20 }}>
                                <Text style={styles.linkText}>Back to Registration</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    
                    {step === 1 && (
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/login')}>
                                <Text style={styles.linkText}>Sign in</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
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
        textAlign: 'center',
    }
});
