import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '../src/contexts/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const FuturisticDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#050510',
    card: '#0a0a1a',
    text: '#ffffff',
    border: '#1a1a3a',
    primary: '#00ffff', // Cyan neon
  },
};

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={FuturisticDarkTheme}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: FuturisticDarkTheme.colors.card },
            headerTintColor: FuturisticDarkTheme.colors.primary,
            contentStyle: { backgroundColor: FuturisticDarkTheme.colors.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: 'Access Port' }} />
          <Stack.Screen name="signup" options={{ title: 'Register Protocol' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </AuthProvider>
    </ThemeProvider>
  );
}
