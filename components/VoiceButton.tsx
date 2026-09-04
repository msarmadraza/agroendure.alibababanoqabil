import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import { Colors, Radius, Shadows } from '@/constants/theme';

interface VoiceButtonProps {
  isRecording?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const VoiceButton = ({
  isRecording = false,
  onStartRecording,
  onStopRecording,
  size = 'lg',
  disabled = false,
}: VoiceButtonProps) => {
  const [localRecording, setLocalRecording] = useState(false);
  const recording = isRecording || localRecording;

  const pulseAnim = useState(new Animated.Value(1))[0];
  const ripple1 = useState(new Animated.Value(0))[0];
  const ripple2 = useState(new Animated.Value(0))[0];
  const ripple3 = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.96, duration: 600, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(ripple1, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(ripple1, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ripple2, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(ripple2, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ripple3, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(ripple3, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      ripple1.setValue(0);
      ripple2.setValue(0);
      ripple3.setValue(0);
    }
  }, [recording]);

  const handleToggleRecording = () => {
    if (recording) {
      setLocalRecording(false);
      onStopRecording?.();
    } else {
      setLocalRecording(true);
      onStartRecording?.();
    }
  };

  const sizeMap = {
    sm: 48,
    md: 64,
    lg: 80,
  };

  const iconSizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const dim = sizeMap[size];
  const iconSize = iconSizeMap[size];

  return (
    <View style={styles.container}>
      {recording && (
        <>
          <Animated.View
            style={[
              styles.ripple,
              {
                width: dim + 48,
                height: dim + 48,
                borderRadius: (dim + 48) / 2,
                opacity: ripple1.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0] }),
                transform: [{ scale: ripple1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] }) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ripple,
              {
                width: dim + 32,
                height: dim + 32,
                borderRadius: (dim + 32) / 2,
                opacity: ripple2.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0] }),
                transform: [{ scale: ripple2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.4] }) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ripple,
              {
                width: dim + 16,
                height: dim + 16,
                borderRadius: (dim + 16) / 2,
                opacity: ripple3.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0] }),
                transform: [{ scale: ripple3.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.3] }) }],
              },
            ]}
          />
        </>
      )}

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handleToggleRecording}
          disabled={disabled}
          activeOpacity={0.8}
          style={[
            styles.button,
            {
              width: dim,
              height: dim,
              borderRadius: dim / 2,
              backgroundColor: recording ? Colors.error : Colors.primary,
            },
            disabled && styles.disabled,
            Shadows.medium,
          ]}
        >
          {recording ? (
            <MicOff size={iconSize} color={Colors.white} />
          ) : (
            <Mic size={iconSize} color={Colors.white} />
          )}

          {recording && (
            <View style={styles.recordingDot} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  ripple: {
    position: 'absolute',
    backgroundColor: Colors.voicePulse,
  },
  recordingDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
  },
});
