import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';

interface FuturisticCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    glowColor?: string;
    delay?: number;
}

export const FuturisticCard: React.FC<FuturisticCardProps> = ({ children, style, glowColor = Colors.dark.secondary, delay = 0 }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    useEffect(() => {
        const timer = setTimeout(() => {
            opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.exp) });
            translateY.value = withSpring(0, { damping: 12, stiffness: 90 });
        }, delay);
        return () => clearTimeout(timer);
    }, [delay, opacity, translateY]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
        };
    });

    return (
        <Animated.View style={[styles.container, { shadowColor: glowColor }, style, animatedStyle]}>
            <LinearGradient
                colors={['rgba(40, 20, 60, 0.95)', 'rgba(15, 8, 30, 0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.innerContainer, { borderColor: glowColor }]}
            >
                {children}
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
    },
    innerContainer: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
});
