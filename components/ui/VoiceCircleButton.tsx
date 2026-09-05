import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Volume2, VolumeX } from 'lucide-react-native';
import { Shadows } from '@/constants/theme';
import { speakUrdu, stopSpeaking } from '@/services/voice/speechService';

interface VoiceCircleButtonProps {
  text: string;
  autoPlay?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onStateChange?: (speaking: boolean) => void;
}

export const VoiceCircleButton: React.FC<VoiceCircleButtonProps> = ({
  text,
  autoPlay = true,
  size = 40,
  style,
  onStateChange,
}) => {
  const [speaking, setSpeaking] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  // Real-time animation while speaking
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;

    if (speaking) {
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.12, duration: 450, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1.0, duration: 450, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rippleAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(rippleAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
      rippleAnim.setValue(0);
    }

    return () => {
      animLoop?.stop();
    };
  }, [speaking]);

  // Handle autoplay on screen/step entry
  useEffect(() => {
    if (!text || !text.trim()) return;

    let timer: NodeJS.Timeout | null = null;

    if (autoPlay) {
      // Delay slightly (350ms) to allow screen transition to complete smoothly
      timer = setTimeout(() => {
        startPlayback();
      }, 350);
    }

    return () => {
      if (timer) clearTimeout(timer);
      stopSpeaking();
      setSpeaking(false);
      onStateChange?.(false);
    };
  }, [text, autoPlay]);

  const startPlayback = () => {
    setSpeaking(true);
    onStateChange?.(true);

    speakUrdu(text, {
      onStart: () => {
        setSpeaking(true);
        onStateChange?.(true);
      },
      onEnd: () => {
        setSpeaking(false);
        onStateChange?.(false);
      },
      onError: () => {
        setSpeaking(false);
        onStateChange?.(false);
      },
    });
  };

  const handleToggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      onStateChange?.(false);
    } else {
      startPlayback();
    }
  };

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.6, 0.2, 0],
  });

  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      {/* Real-time pulsing radar ring when speaking */}
      {speaking && (
        <Animated.View
          style={[
            styles.rippleRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: rippleScale }],
              opacity: rippleOpacity,
            },
          ]}
          pointerEvents="none"
        />
      )}

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handleToggle}
          activeOpacity={0.8}
          style={[
            styles.circleBtn,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: speaking ? '#15803D' : '#F0FDF4',
              borderColor: speaking ? '#166534' : '#BBF7D0',
            },
            Shadows.soft,
          ]}
          accessibilityRole="button"
          accessibilityLabel={speaking ? 'Stop audio' : 'Play audio guidance'}
        >
          {speaking ? (
            <VolumeX size={size * 0.45} color="#FFFFFF" strokeWidth={2.5} />
          ) : (
            <Volume2 size={size * 0.48} color="#15803D" strokeWidth={2.2} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  rippleRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#22C55E',
    backgroundColor: '#86EFAC33',
  },
});
