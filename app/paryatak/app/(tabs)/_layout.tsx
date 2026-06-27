import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Home, Map, ShieldAlert, Search, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#f72585', // Neon Pink
        tabBarInactiveTintColor: '#a393b3', // Muted Purple
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'rgba(28, 17, 53, 0.95)',
            borderTopWidth: 0,
            elevation: 0,
            height: 85,
            shadowColor: '#7b2cbf',
            shadowOpacity: 0.3,
            shadowRadius: 15,
            shadowOffset: {
              height: -4,
              width: 0,
            },
          },
          default: {
            backgroundColor: 'rgba(10, 5, 20, 0.95)',
            borderTopWidth: 1,
            borderTopColor: '#3a2a6a',
            height: 65,
            paddingBottom: 10,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dash',
          tabBarIcon: ({ color }) => <Home color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Nearby',
          tabBarIcon: ({ color }) => <Search color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color }) => <ShieldAlert color="#ff0a54" size={36} style={{ marginBottom: 5 }} />,
          tabBarLabelStyle: { color: '#ff0a54', fontWeight: 'bold' }
        }}
      />
      <Tabs.Screen
        name="trip"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Map color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={28} />,
        }}
      />
    </Tabs>
  );
}
