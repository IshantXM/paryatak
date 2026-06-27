import React, { useEffect } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { AlertCircle } from 'lucide-react-native';

interface SosButtonProps {
    onPress: () => void;
    isTriggered?: boolean;
}

export const SosButton: React.FC<SosButtonProps> = ({ onPress, isTriggered = false }) => {
    const pulseScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.5);

    useEffect(() => {
        if (!isTriggered) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
            
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        } else {
            pulseScale.value = withTiming(1.1);
            glowOpacity.value = withTiming(1);
        }
    }, [isTriggered]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: pulseScale.value }],
        };
    });

    const glowStyle = useAnimatedStyle(() => {
        return {
            opacity: glowOpacity.value,
        };
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.glow, glowStyle]} />
            <Pressable onPress={onPress}>
                <Animated.View style={[styles.button, isTriggered && styles.buttonTriggered, animatedStyle]}>
                    <AlertCircle color="#FFFFFF" size={64} strokeWidth={2} />
                    <Text style={styles.text}>{isTriggered ? 'SOS ACTIVE' : 'SOS'}</Text>
                </Animated.View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 40,
    },
    glow: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(255, 0, 50, 0.4)',
        shadowColor: '#FF0032',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 10,
    },
    button: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#FF0032',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#FF4D6D',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 8,
    },
    buttonTriggered: {
        backgroundColor: '#CC0000',
        borderColor: '#FF0000',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 10,
        letterSpacing: 2,
    },
});
