import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator, Platform } from 'react-native';
import CustomMap, { MarkerData } from '../../src/components/Map';
import api from '../../src/utils/api';
import { Play, Square, MapPin, Compass, Navigation, Clock, ShieldAlert } from 'lucide-react-native';
import * as Location from 'expo-location';
import { LOCATION_TASK_NAME } from '../../src/utils/backgroundLocationTask';

// Dark map style for futuristic UI
const customMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#120b24"}]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{"visibility": "on"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#b39ddb"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#120b24"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{"color": "#2c1e4d"}]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#d1c4e9"}]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#06030c"}]
  }
];

const POPULAR_DESTINATIONS = [
    { id: '1', name: 'Triveni Sangam, Prayagraj', latitude: 25.4284, longitude: 81.8845, address: 'Triveni Sangam, Prayagraj' },
    { id: '2', name: 'Allahabad Fort, Prayagraj', latitude: 25.4299, longitude: 81.8789, address: 'Allahabad Fort, Prayagraj' },
    { id: '3', name: 'Anand Bhawan Museum, Prayagraj', latitude: 25.4605, longitude: 81.8562, address: 'Anand Bhawan Museum, Prayagraj' },
    { id: '4', name: 'Khusro Bagh, Prayagraj', latitude: 25.4419, longitude: 81.8322, address: 'Khusro Bagh, Prayagraj' },
    { id: '5', name: 'Taj Mahal, Agra', latitude: 27.1751, longitude: 78.0421, address: 'Taj Mahal, Agra' },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

export default function TripScreen() {
    const [activeTrip, setActiveTrip] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [fgStatus, requestFgPermission] = Location.useForegroundPermissions();
    const [bgStatus, requestBgPermission] = Location.useBackgroundPermissions();

    const [selectedDest, setSelectedDest] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [startModalVisible, setStartModalVisible] = useState(false);

    // Default location set to Prayagraj center
    const [region, setRegion] = useState({
        latitude: 25.4358,
        longitude: 81.8463,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
    });

    const [startLocation, setStartLocation] = useState<any>({
        latitude: 25.4358,
        longitude: 81.8463,
        address: 'Prayagraj (Default Location)'
    });

    const POPULAR_START_LOCATIONS = [
        { id: 'start-1', name: 'Prayagraj (City Center)', latitude: 25.4358, longitude: 81.8463 },
        { id: 'start-2', name: 'Delhi (Connaught Place)', latitude: 28.6304, longitude: 77.2177 },
        { id: 'start-3', name: 'Agra (Taj VIP Road)', latitude: 27.1651, longitude: 78.0421 },
    ];

    useEffect(() => {
        const fetchActiveTrip = async () => {
            try {
                const res = await api.get('/trip/active');
                if (res.data?.success && res.data.data) {
                    const trip = res.data.data;
                    setActiveTrip(trip);
                    
                    // Restore coordinates
                    const sLat = trip.origin.coordinates[1];
                    const sLng = trip.origin.coordinates[0];
                    const dLat = trip.destination.coordinates[1];
                    const dLng = trip.destination.coordinates[0];
                    
                    setStartLocation({ latitude: sLat, longitude: sLng, address: trip.origin.address });
                    setSelectedDest({ name: trip.destination.address, latitude: dLat, longitude: dLng });
                    setRegion({
                        latitude: (sLat + dLat) / 2,
                        longitude: (sLng + dLng) / 2,
                        latitudeDelta: Math.abs(sLat - dLat) * 1.5 || 0.08,
                        longitudeDelta: Math.abs(sLng - dLng) * 1.5 || 0.08,
                    });
                }
            } catch (e) {
                // No active trip
            }
        };
        fetchActiveTrip();
    }, []);

    const handleUseMyLocation = async () => {
        setLocating(true);
        setStartModalVisible(false);
        try {
            let currentFgStatus = fgStatus;
            if (!currentFgStatus?.granted) {
                const req = await requestFgPermission();
                if (req) currentFgStatus = req;
            }
            if (!currentFgStatus?.granted) {
                Alert.alert('Permission Denied', 'Foreground location permission is required.');
                return;
            }

            const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy.High });
            const { latitude, longitude } = currentLoc.coords;
            
            setStartLocation({
                latitude,
                longitude,
                address: 'Browser GPS Location'
            });

            setRegion(prev => ({
                ...prev,
                latitude,
                longitude,
            }));
            
            Alert.alert("Success", "Location set to browser coordinates. Note: On desktops, IP location may resolve to your nearest ISP hub (e.g. Indore).");
        } catch (err) {
            Alert.alert("Error", "Could not retrieve GPS coordinates.");
        } finally {
            setLocating(false);
        }
    };

    const handleSelectStartLocation = (item: any) => {
        setStartLocation({
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.name
        });
        setStartModalVisible(false);
        
        // Focus camera on new start location
        setRegion(prev => ({
            ...prev,
            latitude: item.latitude,
            longitude: item.longitude,
        }));
    };

    const handleSelectDestination = (dest: any) => {
        setSelectedDest(dest);
        setModalVisible(false);
        
        // Re-center map to encompass both start and destination
        const avgLat = (startLocation.latitude + dest.latitude) / 2;
        const avgLng = (startLocation.longitude + dest.longitude) / 2;
        const latDelta = Math.max(Math.abs(startLocation.latitude - dest.latitude) * 1.6, 0.05);
        const lngDelta = Math.max(Math.abs(startLocation.longitude - dest.longitude) * 1.6, 0.05);

        setRegion({
            latitude: avgLat,
            longitude: avgLng,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta
        });
    };

    const toggleTrip = async () => {
        setLoading(true);
        try {
            if (activeTrip) {
                // End trip
                await api.post('/trip/end');
                if (Platform.OS !== 'web') {
                    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
                }
                setActiveTrip(null);
                setSelectedDest(null);
                Alert.alert("Transit Terminated", "Safety tracking is disabled.");
            } else {
                if (!selectedDest) {
                    Alert.alert("Setup Incomplete", "Please select a destination first.");
                    setLoading(false);
                    return;
                }

                // Verify permissions (only on native)
                if (Platform.OS !== 'web') {
                    let currentFgStatus = fgStatus;
                    if (!currentFgStatus?.granted) {
                        const req = await requestFgPermission();
                        if (req) currentFgStatus = req;
                    }
                    if (!currentFgStatus?.granted) {
                        Alert.alert('Permission Denied', 'Foreground location is required.');
                        setLoading(false);
                        return;
                    }
                    
                    let currentBgStatus = bgStatus;
                    if (!currentBgStatus?.granted) {
                        const req = await requestBgPermission();
                        if (req) currentBgStatus = req;
                    }
                    if (!currentBgStatus?.granted) {
                        Alert.alert('Permission Denied', 'Background tracking is required for safety alerts.');
                        setLoading(false);
                        return;
                    }
                }

                // Send request
                const res = await api.post('/trip/start', {
                    originLat: startLocation.latitude,
                    originLng: startLocation.longitude,
                    originAddress: startLocation.address,
                    destLat: selectedDest.latitude,
                    destLng: selectedDest.longitude,
                    destAddress: selectedDest.name
                });
                
                if (res.data?.success) {
                    if (Platform.OS !== 'web') {
                        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                            accuracy: Location.Accuracy.BestForNavigation,
                            timeInterval: 5000,
                            distanceInterval: 5,
                            foregroundService: {
                                notificationTitle: "Paryatak Safety Active",
                                notificationBody: "Your location is being tracked for safety protocols.",
                                notificationColor: "#7b2cbf",
                            }
                        });
                    }
                    setActiveTrip(res.data.data);
                    Alert.alert("Transit Active", "Paryatak safety tracking initialized.");
                }
            }
        } catch (e: any) {
            Alert.alert("Error", e.response?.data?.message || "Could not process request.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate details for routing UI
    const distance = selectedDest ? calculateDistance(startLocation.latitude, startLocation.longitude, selectedDest.latitude, selectedDest.longitude) : 0;
    const eta = Math.round(distance * 1.5 + 5); // Rough proxy: 1.5 mins per km + buffer

    // Build markers list
    const markers: MarkerData[] = [
        { id: 'start', latitude: startLocation.latitude, longitude: startLocation.longitude, title: 'Start Position', color: '#4cc9f0' }
    ];
    if (selectedDest) {
        markers.push({ id: 'dest', latitude: selectedDest.latitude, longitude: selectedDest.longitude, title: selectedDest.name, color: '#f72585' });
    }

    const polylineCoords = selectedDest ? [
        { latitude: startLocation.latitude, longitude: startLocation.longitude },
        { latitude: selectedDest.latitude, longitude: selectedDest.longitude }
    ] : [];

    return (
        <View style={styles.container}>
            <CustomMap
                style={styles.map}
                customMapStyle={customMapStyle}
                region={region}
                onRegionChangeComplete={(r) => setRegion(r)}
                markers={markers}
                showPolyline={!!selectedDest}
                polylineCoordinates={polylineCoords}
            />
            
            {/* Conditional Google Maps layout */}
            {activeTrip ? (
                // Navigation Mode: Fullscreen Map with floating compact bars
                <>
                    {/* Compact Top Navigation Routing Bar */}
                    <View style={styles.topNavBar}>
                        <View style={styles.navBarCard}>
                            <Navigation color="#4cc9f0" size={18} style={styles.navBarIcon} />
                            <Text style={styles.navBarText} numberOfLines={1}>
                                Routing from <Text style={styles.navBarHighlight}>{startLocation.address.split(',')[0]}</Text> to <Text style={styles.navBarHighlight}>{selectedDest?.name.split(',')[0]}</Text>
                            </Text>
                        </View>
                    </View>

                    {/* Bottom Sliding Navigation Details Sheet */}
                    <View style={styles.bottomNavSheet}>
                        <View style={styles.navSheetCard}>
                            <View style={styles.pulseContainer}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.navStatusText}>LIVE SAFETY TRACKING ACTIVE</Text>
                            </View>
                            
                            <View style={styles.navMetricsRow}>
                                <View style={styles.navMetricItem}>
                                    <Text style={styles.navMetricTime}>{eta} min</Text>
                                    <Text style={styles.navMetricSub}>
                                        {distance.toFixed(1)} km · Arrival {(new Date(Date.now() + eta * 60 * 1000)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </Text>
                                </View>
                                
                                <TouchableOpacity 
                                    style={styles.navRecenterBtn}
                                    onPress={() => {
                                        setRegion(prev => ({
                                            ...prev,
                                            latitude: startLocation.latitude,
                                            longitude: startLocation.longitude,
                                            latitudeDelta: 0.03,
                                            longitudeDelta: 0.03
                                        }));
                                    }}
                                >
                                    <Compass color="#4cc9f0" size={18} style={{ marginRight: 6 }} />
                                    <Text style={styles.recenterText}>RECENTER</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity 
                                style={styles.navStopBtn}
                                onPress={toggleTrip}
                                disabled={loading}
                            >
                                <Square fill="#ffffff" color="#ffffff" size={16} style={{ marginRight: 8 }} />
                                <Text style={styles.navStopBtnText}>EXIT NAVIGATION</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            ) : (
                // Routing Mode: Large Configuration Panel
                <>
                    {/* Top routing configuration container */}
                    <View style={styles.topDashboard}>
                        <View style={styles.card}>
                            <Text style={styles.dashboardTitle}>DISCOVERY & ROUTING PANEL</Text>
                            
                            <TouchableOpacity 
                                style={styles.routeRow}
                                onPress={() => setStartModalVisible(true)}
                            >
                                <MapPin color="#4cc9f0" size={18} style={styles.rowIcon} />
                                <View style={styles.rowContent}>
                                    <Text style={styles.rowLabel}>START LOCATION</Text>
                                    <Text style={styles.rowValue} numberOfLines={1}>{startLocation.address}</Text>
                                </View>
                                <Compass color="#4cc9f0" size={20} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity 
                                style={styles.routeRow} 
                                onPress={() => setModalVisible(true)}
                            >
                                <MapPin color="#f72585" size={18} style={styles.rowIcon} />
                                <View style={styles.rowContent}>
                                    <Text style={styles.rowLabel}>DESTINATION</Text>
                                    <Text style={[styles.rowValue, !selectedDest && styles.placeholderText]} numberOfLines={1}>
                                        {selectedDest ? selectedDest.name : 'Select popular destination...'}
                                    </Text>
                                </View>
                                <Navigation color="#f72585" size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bottom active metrics and controls panel */}
                    <View style={styles.bottomDashboard}>
                        {selectedDest && (
                            <View style={styles.metricsCard}>
                                <View style={styles.metricItem}>
                                    <Clock color="#4cc9f0" size={18} style={{ marginBottom: 4 }} />
                                    <Text style={styles.metricLabel}>EST. TIME</Text>
                                    <Text style={styles.metricVal}>{eta} MIN</Text>
                                </View>
                                
                                <View style={[styles.metricItem, styles.metricBorder]}>
                                    <Navigation color="#7b2cbf" size={18} style={{ marginBottom: 4 }} />
                                    <Text style={styles.metricLabel}>DISTANCE</Text>
                                    <Text style={styles.metricVal}>{distance.toFixed(1)} KM</Text>
                                </View>

                                <View style={styles.metricItem}>
                                    <ShieldAlert color="#f72585" size={18} style={{ marginBottom: 4 }} />
                                    <Text style={styles.metricLabel}>SECURITY</Text>
                                    <Text style={[styles.metricVal, { color: '#00f5d4' }]}>SECURE</Text>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity 
                            style={[
                                styles.tripBtn, 
                                styles.tripBtnStart,
                                !selectedDest && styles.tripBtnDisabled
                            ]}
                            onPress={toggleTrip}
                            disabled={loading || !selectedDest}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <>
                                    <Play fill="#ffffff" color="#ffffff" size={20} style={{ marginRight: 10 }} />
                                    <Text style={styles.tripBtnText}>INITIATE RUN</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* Start Location Selection Modal */}
            <Modal
                visible={startModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setStartModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>CHOOSE STARTING POINT</Text>
                        
                        <TouchableOpacity 
                            style={[styles.modalItem, { backgroundColor: 'rgba(76, 201, 240, 0.12)', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 }]}
                            onPress={handleUseMyLocation}
                            disabled={locating}
                        >
                            <Compass color="#4cc9f0" size={22} style={{ marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.modalSpotName, { color: '#4cc9f0' }]}>Use Browser GPS Location</Text>
                                <Text style={styles.modalSpotCoords}>Queries browser location API (which might resolve to ISP hub)</Text>
                            </View>
                        </TouchableOpacity>

                        <Text style={[styles.rowLabel, { marginVertical: 8, marginLeft: 4 }]}>POPULAR START PRESETS</Text>

                        <FlatList
                            data={POPULAR_START_LOCATIONS}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.modalItem}
                                    onPress={() => handleSelectStartLocation(item)}
                                >
                                    <MapPin color="#4cc9f0" size={20} style={{ marginRight: 12 }} />
                                    <View>
                                        <Text style={styles.modalSpotName}>{item.name}</Text>
                                        <Text style={styles.modalSpotCoords}>Lat: {item.latitude.toFixed(4)}, Lng: {item.longitude.toFixed(4)}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
                        />

                        <TouchableOpacity 
                            style={styles.modalCloseBtn}
                            onPress={() => setStartModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>CLOSE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Destination Selection Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>POPULAR TOURIST SPOTS</Text>
                        
                        <FlatList
                            data={POPULAR_DESTINATIONS}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.modalItem}
                                    onPress={() => handleSelectDestination(item)}
                                >
                                    <MapPin color="#7b2cbf" size={20} style={{ marginRight: 12 }} />
                                    <View>
                                        <Text style={styles.modalSpotName}>{item.name}</Text>
                                        <Text style={styles.modalSpotCoords}>Lat: {item.latitude.toFixed(4)}, Lng: {item.longitude.toFixed(4)}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
                        />

                        <TouchableOpacity 
                            style={styles.modalCloseBtn}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>CLOSE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0514',
    },
    map: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    topDashboard: {
        position: 'absolute',
        top: 50,
        left: 15,
        right: 15,
    },
    card: {
        backgroundColor: 'rgba(18, 10, 36, 0.92)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#3a2a6a',
        shadowColor: '#7b2cbf',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    dashboardTitle: {
        color: '#4cc9f0',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 2,
        marginBottom: 16,
        textAlign: 'center',
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    rowIcon: {
        marginRight: 12,
    },
    rowContent: {
        flex: 1,
    },
    rowLabel: {
        color: '#a393b3',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    rowValue: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    placeholderText: {
        color: '#4a3a6a',
        fontStyle: 'italic',
    },
    locateBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(76, 201, 240, 0.12)',
    },
    divider: {
        height: 1,
        backgroundColor: '#2c1e4d',
        marginVertical: 4,
    },
    bottomDashboard: {
        position: 'absolute',
        bottom: 95,
        left: 15,
        right: 15,
    },
    metricsCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(18, 10, 36, 0.92)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#3a2a6a',
        justifyContent: 'space-between',
    },
    metricItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricBorder: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#2c1e4d',
    },
    metricLabel: {
        color: '#a393b3',
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 2,
    },
    metricVal: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '900',
    },
    tripBtn: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 8,
    },
    tripBtnStart: {
        backgroundColor: '#7b2cbf', // Violet
        shadowColor: '#7b2cbf',
    },
    tripBtnEnd: {
        backgroundColor: '#ff0a54', // Crimson Red
        shadowColor: '#ff0a54',
    },
    tripBtnDisabled: {
        backgroundColor: '#2c1e4d',
        shadowColor: 'transparent',
    },
    tripBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 15,
        letterSpacing: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(6, 3, 12, 0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#120b24',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '75%',
        borderWidth: 1,
        borderColor: '#3a2a6a',
    },
    modalTitle: {
        color: '#4cc9f0',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 2,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    modalSpotName: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    modalSpotCoords: {
        color: '#a393b3',
        fontSize: 12,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#2c1e4d',
    },
    modalCloseBtn: {
        marginTop: 20,
        backgroundColor: 'rgba(255, 10, 84, 0.12)',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 10, 84, 0.3)',
    },
    modalCloseText: {
        color: '#ff0a54',
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    
    // Google Maps Style Navigation Panel styling
    topNavBar: {
        position: 'absolute',
        top: 50,
        left: 15,
        right: 15,
    },
    navBarCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(18, 10, 36, 0.95)',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#3a2a6a',
        shadowColor: '#4cc9f0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
    },
    navBarIcon: {
        marginRight: 10,
        transform: [{ rotate: '45deg' }]
    },
    navBarText: {
        color: '#a393b3',
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    navBarHighlight: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    bottomNavSheet: {
        position: 'absolute',
        bottom: 95,
        left: 15,
        right: 15,
    },
    navSheetCard: {
        backgroundColor: 'rgba(18, 10, 36, 0.96)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#3a2a6a',
        shadowColor: '#7b2cbf',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 10,
    },
    pulseContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00f5d4',
        marginRight: 8,
        shadowColor: '#00f5d4',
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    navStatusText: {
        color: '#00f5d4',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    navMetricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    navMetricItem: {
        flex: 1,
    },
    navMetricTime: {
        color: '#00f5d4',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    navMetricSub: {
        color: '#a393b3',
        fontSize: 13,
        fontWeight: '600',
    },
    navRecenterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: 'rgba(76, 201, 240, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(76, 201, 240, 0.25)',
    },
    recenterText: {
        color: '#4cc9f0',
        fontWeight: 'bold',
        fontSize: 11,
        letterSpacing: 1,
    },
    navStopBtn: {
        flexDirection: 'row',
        backgroundColor: '#ff0a54',
        padding: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff0a54',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 6,
    },
    navStopBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 2,
    }
});
