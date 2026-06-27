import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TextInput, 
    TouchableOpacity, Alert, ActivityIndicator, FlatList 
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import api from '../../src/utils/api';
import { FuturisticCard } from '../../src/components/FuturisticCard';
import { User, Phone, Mail, Plus, Trash2, LogOut, Shield } from 'lucide-react-native';

type EmergencyContact = {
    _id: string;
    name: string;
    phone: string;
    relationship?: string;
    email?: string;
};

export default function ProfileScreen() {
    const { user, logout, refreshProfile } = useAuth();
    const router = useRouter();
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    
    // Add contact form state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [relationship, setRelationship] = useState('');
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchContacts = async () => {
        setLoadingContacts(true);
        try {
            const res = await api.get('/user/emergency-contacts');
            if (res.data?.success) {
                setContacts(res.data.data || []);
            }
        } catch (e) {
            console.error('Failed to load contacts', e);
        } finally {
            setLoadingContacts(false);
        }
    };

    useEffect(() => {
        if (!user) {
            router.replace('/login');
        } else {
            fetchContacts();
        }
    }, [user]);

    const handleAddContact = async () => {
        if (!name.trim() || !phone.trim()) {
            Alert.alert("validation Error", "Name and Phone number are required.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/user/emergency-contacts', {
                name: name.trim(),
                phone: phone.trim(),
                relationship: relationship.trim() || undefined,
                email: email.trim() || undefined
            });

            if (res.data?.success) {
                Alert.alert("Success", "Emergency contact added successfully.");
                setName('');
                setPhone('');
                setRelationship('');
                setEmail('');
                fetchContacts();
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to add contact.';
            Alert.alert("Error", msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteContact = async (contactId: string) => {
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to remove this emergency contact?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await api.delete(`/user/emergency-contacts/${contactId}`);
                            if (res.data?.success) {
                                Alert.alert("Success", "Emergency contact removed.");
                                fetchContacts();
                            }
                        } catch (err: any) {
                            Alert.alert("Error", "Failed to remove contact.");
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out of Paryatak?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Logout", 
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    if (!user) return <View style={styles.container} />;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerLabel}>OPERATIVE PROFILE</Text>
                <Text style={styles.headerTitle}>Settings & Guardians</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* User details card */}
                <FuturisticCard glowColor="rgba(76, 201, 240, 0.4)">
                    <View style={styles.profileInfo}>
                        <View style={styles.avatarContainer}>
                            <User color="#4cc9f0" size={32} />
                        </View>
                        <View style={styles.profileText}>
                            <Text style={styles.profileName}>{user.name}</Text>
                            <Text style={styles.profileRole}>Role: {user.role?.toUpperCase() || 'USER'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Phone color="#a393b3" size={16} />
                        <Text style={styles.infoText}>{user.phone_number}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Mail color="#a393b3" size={16} />
                        <Text style={styles.infoText}>{user.email}</Text>
                    </View>
                </FuturisticCard>

                {/* Emergency Contacts List */}
                <Text style={styles.sectionHeader}>EMERGENCY CONTACTS (MAX 5)</Text>
                {loadingContacts ? (
                    <ActivityIndicator size="small" color="#7b2cbf" style={{ marginVertical: 10 }} />
                ) : contacts.length === 0 ? (
                    <Text style={styles.emptyText}>No emergency contacts configured yet. Add one below.</Text>
                ) : (
                    contacts.map((contact) => (
                        <FuturisticCard key={contact._id} glowColor="rgba(123, 44, 191, 0.3)" style={styles.contactCard}>
                            <View style={styles.contactInfo}>
                                <View>
                                    <Text style={styles.contactName}>{contact.name}</Text>
                                    <Text style={styles.contactMeta}>
                                        {contact.relationship ? `${contact.relationship} • ` : ''}{contact.phone}
                                    </Text>
                                    {contact.email && (
                                        <Text style={styles.contactEmail}>{contact.email}</Text>
                                    )}
                                </View>
                                <TouchableOpacity 
                                    style={styles.deleteBtn}
                                    onPress={() => handleDeleteContact(contact._id)}
                                >
                                    <Trash2 color="#ff0a54" size={18} />
                                </TouchableOpacity>
                            </View>
                        </FuturisticCard>
                    ))
                )}

                {/* Add Contact Form */}
                {contacts.length < 5 && (
                    <FuturisticCard glowColor="rgba(247, 37, 133, 0.4)" style={styles.formCard}>
                        <Text style={styles.formTitle}>ADD NEW GUARDIAN</Text>
                        
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            placeholderTextColor="#5a4a7a"
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number (e.g. +91XXXXXXXXXX)"
                            placeholderTextColor="#5a4a7a"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Relationship (e.g. Mother, Friend)"
                            placeholderTextColor="#5a4a7a"
                            value={relationship}
                            onChangeText={setRelationship}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Email Address (for SOS emails)"
                            placeholderTextColor="#5a4a7a"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <TouchableOpacity 
                            style={styles.addBtn}
                            onPress={handleAddContact}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Plus color="#ffffff" size={18} style={{ marginRight: 6 }} />
                                    <Text style={styles.addBtnText}>ADD GUARDIAN</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </FuturisticCard>
                )}

                {/* Actions */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut color="#ff0a54" size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.logoutBtnText}>LOGOUT SYSTEM</Text>
                </TouchableOpacity>

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
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2a1a4a',
        backgroundColor: 'rgba(15, 8, 30, 0.95)',
    },
    headerLabel: {
        color: '#4cc9f0',
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
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarContainer: {
        backgroundColor: 'rgba(76, 201, 240, 0.1)',
        borderWidth: 1,
        borderColor: '#4cc9f0',
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileText: {
        marginLeft: 15,
    },
    profileName: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    profileRole: {
        color: '#4cc9f0',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#2a1a4a',
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    infoText: {
        color: '#d1c4e9',
        fontSize: 14,
        marginLeft: 10,
    },
    sectionHeader: {
        color: '#a393b3',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: 30,
        marginBottom: 12,
    },
    emptyText: {
        color: '#6f5e85',
        fontSize: 13,
        textAlign: 'center',
        marginVertical: 15,
        fontStyle: 'italic',
    },
    contactCard: {
        marginBottom: 10,
        paddingVertical: 12,
    },
    contactInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    contactName: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    contactMeta: {
        color: '#a393b3',
        fontSize: 13,
        marginTop: 2,
    },
    contactEmail: {
        color: '#7b2cbf',
        fontSize: 12,
        marginTop: 2,
    },
    deleteBtn: {
        padding: 8,
    },
    formCard: {
        marginTop: 15,
    },
    formTitle: {
        color: '#f72585',
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 15,
    },
    input: {
        backgroundColor: 'rgba(28, 17, 53, 0.7)',
        borderWidth: 1,
        borderColor: '#2a1a5a',
        borderRadius: 10,
        color: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 10,
    },
    addBtn: {
        backgroundColor: '#f72585',
        flexDirection: 'row',
        paddingVertical: 12,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
        shadowColor: '#f72585',
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 3,
    },
    addBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 13,
        letterSpacing: 1,
    },
    logoutBtn: {
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: '#ff0a54',
        backgroundColor: 'rgba(255, 10, 84, 0.05)',
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 35,
        shadowColor: '#ff0a54',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
    },
    logoutBtnText: {
        color: '#ff0a54',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 2,
    }
});
