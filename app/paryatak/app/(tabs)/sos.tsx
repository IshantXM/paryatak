import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Linking } from 'react-native';
import api from '../../src/utils/api';
import { SosButton } from '../../src/components/SosButton';
import { FuturisticCard } from '../../src/components/FuturisticCard';
import { TriangleAlert } from 'lucide-react-native';
import * as Location from 'expo-location';

export default function SosScreen() {
    const [isTriggered, setIsTriggered] = useState(false);
    const [activeSosId, setActiveSosId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSosTrigger = async () => {
        if (isTriggered || loading) return;
        setLoading(true);
        
        try {
            // Get location permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            let latitude = 28.6139; // default fallback (Delhi)
            let longitude = 77.2090;
            let address = "Delhi (Fallback Coordinate)";

            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High
                });
                latitude = loc.coords.latitude;
                longitude = loc.coords.longitude;
                address = "Live GPS Coordinates";
            } else {
                Alert.alert("WARNING", "Location access denied. Triggering SOS with default/last known coordinates.");
            }

            // Trigger SOS on backend
            const res = await api.post('/sos/trigger', {
                location: {
                    latitude,
                    longitude, 
                    address
                },
                threatLevel: "critical"
            });
            
            if (res.data?.success) {
                setIsTriggered(true);
                setActiveSosId(res.data.data.sosId || res.data.data._id);
                Alert.alert(
                    "EMERGENCY PROTOCOL ENGAGED", 
                    "Authorities and emergency contacts have been notified with your exact GPS coordinates.\n\nCalling emergency services now...",
                    [{ text: "OK", onPress: () => Linking.openURL('tel:112').catch(() => console.log('Dialer not supported')) }]
                );
            }
        } catch (e: any) {
            Alert.alert(
                "COMMUNICATION FAILURE", 
                "Unable to reach server. Dialing local authorities directly...",
                [{ text: "OK", onPress: () => Linking.openURL('tel:112').catch(() => console.log('Dialer not supported')) }]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSos = async () => {
        if (!activeSosId) return;
        try {
            const res = await api.put(`/sos/${activeSosId}/cancel`);
            if (res.data?.success) {
                setIsTriggered(false);
                setActiveSosId(null);
                Alert.alert("STAND DOWN", "Emergency protocol disengaged.");
            }
        } catch(e) {
            Alert.alert("ERROR", "Could not disengage protocol automatically.");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TriangleAlert color={isTriggered ? "#ff0a54" : "#f72585"} size={40} />
                <Text style={[styles.headerTitle, isTriggered && {color: '#ff0a54'}]}>
                    {isTriggered ? 'CRITICAL ALERT' : 'EMERGENCY OVERRIDE'}
                </Text>
            </View>

            <View style={styles.mainContent}>
                <SosButton onPress={handleSosTrigger} isTriggered={isTriggered} />
                
                {isTriggered && (
                    <FuturisticCard glowColor="rgba(255, 0, 50, 0.5)" style={styles.disengageCard}>
                        <Text style={styles.disengageText}>Authorities have been dispatched. Do not close this terminal.</Text>
                        <TouchableOpacity style={styles.disengageBtn} onPress={handleCancelSos}>
                            <Text style={styles.disengageBtnText}>DISENGAGE FALSE ALARM</Text>
                        </TouchableOpacity>
                    </FuturisticCard>
                )}

                {!isTriggered && (
                    <Text style={styles.instructions}>
                        Tap the core to initialize emergency protocols. False triggers are logged to central command.
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0514', // Deep space purple
    },
    header: {
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f72585', // Neon Pink
        letterSpacing: 4,
        marginTop: 10,
        textShadowColor: 'rgba(247, 37, 133, 0.4)',
        textShadowRadius: 10,
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 80,
    },
    instructions: {
        color: '#a393b3',
        textAlign: 'center',
        fontSize: 14,
        letterSpacing: 1,
        maxWidth: '80%',
        marginTop: 40,
    },
    disengageCard: {
        marginTop: 40,
        width: '100%',
        alignItems: 'center',
    },
    disengageText: {
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 20,
    },
    disengageBtn: {
        backgroundColor: 'rgba(15, 8, 30, 0.8)',
        borderWidth: 1.5,
        borderColor: '#ff0a54',
        padding: 15,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#ff0a54',
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    disengageBtnText: {
        color: '#ff0a54',
        fontWeight: '900',
        letterSpacing: 2,
    }
});
