import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import api from '../../src/utils/api';
import { FuturisticCard } from '../../src/components/FuturisticCard';
import { ShieldCheck, Activity, MapPin, Users, AlertOctagon, ShieldAlert, PhoneCall } from 'lucide-react-native';

export default function DashboardScreen() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTrip, setActiveTrip] = useState<any>(null);
    const [contactsCount, setContactsCount] = useState<number>(0);
    const [safetyScore, setSafetyScore] = useState<number>(100);

    const fetchData = async () => {
        try {
            const tripRes = await api.get('/trip/active');
            if (tripRes.data?.success) {
                setActiveTrip(tripRes.data.data);
                // Dynamically lower safety score if in an active trip and speed/anomalies exist
                setSafetyScore(tripRes.data.data.anomalies?.length > 0 ? 82 : 98);
            } else {
                setActiveTrip(null);
                setSafetyScore(100);
            }
        } catch (e) {
            setActiveTrip(null);
            setSafetyScore(100);
        }

        try {
            const contactsRes = await api.get('/user/emergency-contacts');
            if (contactsRes.data?.success) {
                setContactsCount(contactsRes.data.data?.length || 0);
            }
        } catch (e) {
            setContactsCount(0);
        }
    };

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        } else if (user) {
            fetchData();
        }
    }, [user, isLoading]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    if (isLoading || !user) return <View style={styles.container} />;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>SYSTEM ONLINE</Text>
                    <Text style={styles.operative}>Operative: {user.name}</Text>
                </View>
                <ShieldCheck color="#4cc9f0" size={40} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ffff" />}
            >
                {/* General status card */}
                <FuturisticCard glowColor="rgba(76, 201, 240, 0.4)">
                    <View style={styles.statusRow}>
                        <Activity color="#4cc9f0" size={24} />
                        <Text style={styles.statusText}>
                            {activeTrip ? 'MONITORING LIVE TRANSIT' : 'STANDBY MODE'}
                        </Text>
                    </View>
                    <Text style={styles.subText}>
                        {activeTrip 
                            ? 'Your geofencing, route deviation, and speed are currently being evaluated in real-time.' 
                            : 'No active transit detected. Your coordinates are secure.'}
                    </Text>
                </FuturisticCard>

                {/* Safety Metrics Grid */}
                <Text style={styles.sectionHeader}>SAFETY METRICS</Text>
                <View style={styles.grid}>
                    <View style={styles.gridCol}>
                        <FuturisticCard glowColor="rgba(0, 255, 136, 0.3)" style={styles.metricCard}>
                            <ShieldCheck color="#00ff88" size={20} />
                            <Text style={styles.metricLabel}>Safety Score</Text>
                            <Text style={[styles.metricValue, { color: safetyScore > 90 ? '#00ff88' : '#ffb703' }]}>
                                {safetyScore}%
                            </Text>
                        </FuturisticCard>
                    </View>

                    <View style={styles.gridCol}>
                        <FuturisticCard glowColor="rgba(123, 44, 191, 0.3)" style={styles.metricCard}>
                            <Users color="#7b2cbf" size={20} />
                            <Text style={styles.metricLabel}>Guardians</Text>
                            <Text style={styles.metricValue}>{contactsCount}</Text>
                        </FuturisticCard>
                    </View>
                </View>

                <View style={styles.grid}>
                    <View style={styles.gridCol}>
                        <FuturisticCard glowColor="rgba(76, 201, 240, 0.3)" style={styles.metricCard}>
                            <MapPin color="#4cc9f0" size={20} />
                            <Text style={styles.metricLabel}>Gps Tracking</Text>
                            <Text style={[styles.metricValue, { color: activeTrip ? '#00ff88' : '#ff0a54', fontSize: 13, marginTop: 10 }]}>
                                {activeTrip ? 'ACTIVE' : 'INACTIVE'}
                            </Text>
                        </FuturisticCard>
                    </View>

                    <View style={styles.gridCol}>
                        <FuturisticCard glowColor="rgba(255, 10, 84, 0.3)" style={styles.metricCard}>
                            <AlertOctagon color="#ff0a54" size={20} />
                            <Text style={styles.metricLabel}>Risk Level</Text>
                            <Text style={[styles.metricValue, { color: activeTrip ? '#ffb703' : '#00ff88', fontSize: 13, marginTop: 10 }]}>
                                {activeTrip ? 'MODERATE' : 'OPTIMAL'}
                            </Text>
                        </FuturisticCard>
                    </View>
                </View>

                {/* Transit Details / Plan button */}
                <Text style={styles.sectionHeader}>ACTIVE PROTOCOL</Text>
                {activeTrip ? (
                    <FuturisticCard glowColor="rgba(247, 37, 133, 0.5)">
                        <Text style={styles.cardTitle}>ACTIVE TRANSIT</Text>
                        <Text style={styles.detailText} numberOfLines={2}>
                            Destination: {activeTrip.destinationAddress || 'Unknown Coordinate'}
                        </Text>
                        <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={() => router.push('/trip')}
                        >
                            <Text style={styles.actionBtnText}>VIEW LIVE TRACKING</Text>
                        </TouchableOpacity>
                    </FuturisticCard>
                ) : (
                    <FuturisticCard glowColor="rgba(123, 44, 191, 0.5)">
                        <Text style={styles.cardTitle}>NO ACTIVE TRANSIT</Text>
                        <Text style={styles.detailText}>Initiate tracking to monitor safety metrics and notify guardians.</Text>
                        <TouchableOpacity 
                            style={styles.actionBtnAlt}
                            onPress={() => router.push('/trip')}
                        >
                            <MapPin color="#ffffff" size={18} style={{ marginRight: 8 }} />
                            <Text style={styles.actionBtnTextAlt}>INITIALIZE TRIP</Text>
                        </TouchableOpacity>
                    </FuturisticCard>
                )}

                {/* Quick actions section */}
                <Text style={styles.sectionHeader}>QUICK SERVICES</Text>
                <View style={styles.quickActionsContainer}>
                    <TouchableOpacity 
                        style={[styles.quickActionBtn, { borderColor: '#ff0a54', backgroundColor: 'rgba(255, 10, 84, 0.05)' }]} 
                        onPress={() => router.push('/sos')}
                    >
                        <ShieldAlert color="#ff0a54" size={24} />
                        <Text style={[styles.quickActionText, { color: '#ff0a54' }]}>SOS Core</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.quickActionBtn, { borderColor: '#7b2cbf', backgroundColor: 'rgba(123, 44, 191, 0.05)' }]} 
                        onPress={() => router.push('/explore')}
                    >
                        <MapPin color="#7b2cbf" size={24} />
                        <Text style={[styles.quickActionText, { color: '#7b2cbf' }]}>Nearby Help</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.quickActionBtn, { borderColor: '#4cc9f0', backgroundColor: 'rgba(76, 201, 240, 0.05)' }]} 
                        onPress={() => router.push('/profile')}
                    >
                        <Users color="#4cc9f0" size={24} />
                        <Text style={[styles.quickActionText, { color: '#4cc9f0' }]}>Guardians</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0514',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2a1a4a',
        backgroundColor: 'rgba(15, 8, 30, 0.95)',
    },
    greeting: {
        color: '#4cc9f0',
        fontSize: 12,
        letterSpacing: 2,
    },
    operative: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusText: {
        color: '#4cc9f0',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginLeft: 10,
    },
    subText: {
        color: '#d1c4e9',
        fontSize: 14,
        lineHeight: 20,
    },
    sectionHeader: {
        color: '#a393b3',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: 25,
        marginBottom: 12,
    },
    grid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    gridCol: {
        flex: 1,
    },
    metricCard: {
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricLabel: {
        color: '#a393b3',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 6,
        letterSpacing: 0.5,
    },
    metricValue: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 4,
    },
    cardTitle: {
        color: '#f72585',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 12,
    },
    detailText: {
        color: '#ffffff',
        fontSize: 15,
        marginBottom: 16,
        lineHeight: 20,
    },
    actionBtn: {
        backgroundColor: '#f72585',
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#f72585',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    actionBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 2,
    },
    actionBtnAlt: {
        backgroundColor: '#7b2cbf',
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7b2cbf',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    actionBtnTextAlt: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 2,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    quickActionBtn: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    }
});
