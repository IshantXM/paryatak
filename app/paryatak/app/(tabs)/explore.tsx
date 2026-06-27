import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, TextInput, RefreshControl, Linking, Alert
} from 'react-native';
import * as Location from 'expo-location';
import api from '../../src/utils/api';
import { MapPin, Phone, Star, Search, AlertTriangle, CheckCircle, XCircle, Shield, Cross } from 'lucide-react-native';

type Place = {
    id: string;
    name: string;
    address: string;
    rating: number | null;
    reviews: number;
    type: string;
    phone: string | null;
    openNow: boolean | null;
    openState: string | null;
    thumbnail: string | null;
    distance: string | null;
    distanceMeters: number | null;
    coordinates: { latitude: number; longitude: number } | null;
    source: 'serpapi' | 'local_db';
};

const CATEGORIES = [
    { label: 'Police', query: 'police station', icon: Shield },
    { label: 'Hospital', query: 'hospital', icon: Cross },
    { label: 'Pharmacy', query: 'pharmacy', icon: Cross },
    { label: 'Safe Zone', query: 'safe place', icon: CheckCircle },
];

export default function NearbyScreen() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeQuery, setActiveQuery] = useState('police station');
    const [customQuery, setCustomQuery] = useState('');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [source, setSource] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const getLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationError('Location permission denied. Using default coordinates.');
                return { latitude: 28.6139, longitude: 77.2090 }; // Delhi fallback
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        } catch {
            setLocationError('Could not get location. Using default.');
            return { latitude: 28.6139, longitude: 77.2090 };
        }
    };

    const fetchNearby = useCallback(async (query: string, coords?: { latitude: number; longitude: number }) => {
        setLoading(true);
        setLocationError(null);
        try {
            const currentCoords = coords || location || await getLocation();
            if (!currentCoords) return;
            setLocation(currentCoords);

            const res = await api.get('/maps/nearby', {
                params: {
                    lat: currentCoords.latitude,
                    lng: currentCoords.longitude,
                    query,
                    radius: 5000,
                }
            });

            if (res.data?.success) {
                setPlaces(res.data.data.results || []);
                setSource(res.data.data.source || null);
                setNotice(res.data.data.notice || null);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to load nearby places.';
            setLocationError(msg);
            setPlaces([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [location]);

    useEffect(() => {
        const init = async () => {
            const coords = await getLocation();
            fetchNearby('police station', coords || undefined);
        };
        init();
    }, []);

    const handleCategoryPress = (query: string) => {
        setActiveQuery(query);
        fetchNearby(query);
    };

    const handleSearch = () => {
        const q = customQuery.trim();
        if (!q) return;
        setActiveQuery(q);
        fetchNearby(q);
    };

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`).catch(() =>
            Alert.alert('Error', 'Cannot open phone dialer')
        );
    };

    const handleDirections = (coords: { latitude: number; longitude: number }, name: string) => {
        const url = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}&label=${encodeURIComponent(name)}`;
        Linking.openURL(url).catch(() =>
            Alert.alert('Error', 'Cannot open maps')
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNearby(activeQuery);
    };

    const renderPlace = ({ item }: { item: Place }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                    <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
                    {item.openNow !== null && (
                        <View style={[styles.badge, item.openNow ? styles.badgeOpen : styles.badgeClosed]}>
                            {item.openNow
                                ? <CheckCircle size={10} color="#00ff88" />
                                : <XCircle size={10} color="#ff0a54" />
                            }
                            <Text style={[styles.badgeText, item.openNow ? styles.badgeOpenText : styles.badgeClosedText]}>
                                {item.openNow ? 'OPEN' : 'CLOSED'}
                            </Text>
                        </View>
                    )}
                </View>

                {item.rating !== null && (
                    <View style={styles.ratingRow}>
                        <Star size={12} color="#f7c59f" fill="#f7c59f" />
                        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                        {item.reviews > 0 && <Text style={styles.reviewCount}>({item.reviews})</Text>}
                    </View>
                )}
            </View>

            <View style={styles.addressRow}>
                <MapPin size={13} color="#7b2cbf" />
                <Text style={styles.addressText} numberOfLines={2}>{item.address}</Text>
            </View>

            {item.distance && (
                <Text style={styles.distanceText}>📍 {item.distance}</Text>
            )}

            {item.openState && !item.openNow && (
                <Text style={styles.openStateText}>{item.openState}</Text>
            )}

            <View style={styles.actions}>
                {item.phone && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(item.phone!)}>
                        <Phone size={14} color="#4cc9f0" />
                        <Text style={styles.actionBtnText}>CALL</Text>
                    </TouchableOpacity>
                )}
                {item.coordinates && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnPrimary]}
                        onPress={() => handleDirections(item.coordinates!, item.name)}
                    >
                        <MapPin size={14} color="#ffffff" />
                        <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>DIRECTIONS</Text>
                    </TouchableOpacity>
                )}
            </View>

            {item.source === 'local_db' && (
                <View style={styles.localBadge}>
                    <Text style={styles.localBadgeText}>LOCAL DATA</Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerLabel}>NEARBY SAFETY</Text>
                <Text style={styles.headerTitle}>Find Help Near You</Text>
                {location && (
                    <Text style={styles.coordText}>
                        📡 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </Text>
                )}
            </View>

            {/* Search bar */}
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search police, hospital..."
                    placeholderTextColor="#4a4a6a"
                    value={customQuery}
                    onChangeText={setCustomQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                    <Search size={20} color="#ffffff" />
                </TouchableOpacity>
            </View>

            {/* Category chips */}
            <View style={styles.chips}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.query}
                        style={[styles.chip, activeQuery === cat.query && styles.chipActive]}
                        onPress={() => handleCategoryPress(cat.query)}
                    >
                        <Text style={[styles.chipText, activeQuery === cat.query && styles.chipTextActive]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Notice banner */}
            {notice && (
                <View style={styles.noticeBanner}>
                    <AlertTriangle size={14} color="#f7c59f" />
                    <Text style={styles.noticeText}>{notice}</Text>
                </View>
            )}

            {/* Error */}
            {locationError && (
                <View style={styles.errorBanner}>
                    <AlertTriangle size={14} color="#ff0a54" />
                    <Text style={styles.errorText}>{locationError}</Text>
                </View>
            )}

            {/* Content */}
            {loading && !refreshing ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#7b2cbf" />
                    <Text style={styles.loadingText}>SCANNING AREA...</Text>
                </View>
            ) : (
                <FlatList
                    data={places}
                    keyExtractor={(item) => item.id || item.name}
                    renderItem={renderPlace}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2cbf" />
                    }
                    ListEmptyComponent={
                        <View style={styles.centerContent}>
                            <Shield size={50} color="#3a2a6a" />
                            <Text style={styles.emptyTitle}>NO RESULTS</Text>
                            <Text style={styles.emptySubtitle}>Try a different search or check your connection.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0514',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a0a3a',
        backgroundColor: 'rgba(15, 8, 30, 0.95)',
    },
    headerLabel: {
        color: '#7b2cbf',
        fontSize: 11,
        letterSpacing: 3,
        fontWeight: '600',
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 4,
    },
    coordText: {
        color: '#4a4a6a',
        fontSize: 11,
        marginTop: 4,
        fontFamily: 'SpaceMono',
    },
    searchRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        backgroundColor: 'rgba(28, 17, 53, 0.8)',
        borderWidth: 1,
        borderColor: '#2a1a5a',
        borderRadius: 12,
        color: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
    },
    searchBtn: {
        backgroundColor: '#7b2cbf',
        borderRadius: 12,
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#7b2cbf',
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 4,
    },
    chips: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 12,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2a1a5a',
        backgroundColor: 'rgba(28, 17, 53, 0.6)',
    },
    chipActive: {
        backgroundColor: '#7b2cbf',
        borderColor: '#7b2cbf',
        shadowColor: '#7b2cbf',
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 3,
    },
    chipText: {
        color: '#a393b3',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    chipTextActive: {
        color: '#ffffff',
    },
    noticeBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(247, 197, 159, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(247, 197, 159, 0.3)',
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 10,
        padding: 10,
        gap: 8,
    },
    noticeText: {
        color: '#f7c59f',
        fontSize: 11,
        flex: 1,
        lineHeight: 16,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 10, 84, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 10, 84, 0.3)',
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 10,
        padding: 10,
        gap: 8,
    },
    errorText: {
        color: '#ff0a54',
        fontSize: 12,
        flex: 1,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: 'rgba(20, 10, 40, 0.9)',
        borderWidth: 1,
        borderColor: '#2a1a5a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#7b2cbf',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    cardHeader: {
        marginBottom: 10,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 4,
    },
    placeName: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
    },
    badgeOpen: {
        backgroundColor: 'rgba(0, 255, 136, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 136, 0.4)',
    },
    badgeClosed: {
        backgroundColor: 'rgba(255, 10, 84, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 10, 84, 0.4)',
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
    },
    badgeOpenText: { color: '#00ff88' },
    badgeClosedText: { color: '#ff0a54' },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: '#f7c59f',
        fontSize: 13,
        fontWeight: '600',
    },
    reviewCount: {
        color: '#4a4a6a',
        fontSize: 11,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginBottom: 6,
    },
    addressText: {
        color: '#a393b3',
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    distanceText: {
        color: '#4cc9f0',
        fontSize: 12,
        marginBottom: 4,
        fontFamily: 'SpaceMono',
    },
    openStateText: {
        color: '#ff0a54',
        fontSize: 11,
        marginBottom: 6,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#2a3a6a',
        backgroundColor: 'rgba(76, 201, 240, 0.08)',
    },
    actionBtnPrimary: {
        backgroundColor: '#7b2cbf',
        borderColor: '#7b2cbf',
        flex: 1,
        justifyContent: 'center',
        shadowColor: '#7b2cbf',
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 3,
    },
    actionBtnText: {
        color: '#4cc9f0',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    localBadge: {
        marginTop: 10,
        paddingVertical: 3,
        paddingHorizontal: 8,
        backgroundColor: 'rgba(123, 44, 191, 0.15)',
        borderRadius: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(123, 44, 191, 0.3)',
    },
    localBadgeText: {
        color: '#7b2cbf',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    loadingText: {
        color: '#7b2cbf',
        marginTop: 15,
        letterSpacing: 2,
        fontSize: 12,
        fontWeight: '600',
    },
    emptyTitle: {
        color: '#3a2a6a',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 3,
        marginTop: 16,
    },
    emptySubtitle: {
        color: '#2a1a4a',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 8,
        maxWidth: '70%',
    },
});
