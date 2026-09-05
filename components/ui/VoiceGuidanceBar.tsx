import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Volume2, VolumeX, Sparkles } from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';
import { speakUrdu, stopSpeaking, isSpeaking } from '@/services/voice/speechService';

interface VoiceGuidanceBarProps {
  text: string;
  label?: string;
  autoPlay?: boolean;
  compact?: boolean;
}

export const VoiceGuidanceBar: React.FC<VoiceGuidanceBarProps> = ({
  text,
  label,
  autoPlay = false,
  compact = false,
}) => {
  const [speaking, setSpeaking] = useState(false);
  const wave1 = useRef(new Animated.Value(0.4)).current;
  const wave2 = useRef(new Animated.Value(0.7)).current;
  const wave3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (speaking) {
      const anim1 = Animated.loop(
        Animated.sequence([
          Animated.timing(wave1, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(wave1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
      const anim2 = Animated.loop(
        Animated.sequence([
          Animated.timing(wave2, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(wave2, { toValue: 0.4, duration: 500, useNativeDriver: true }),
        ])
      );
      const anim3 = Animated.loop(
        Animated.sequence([
          Animated.timing(wave3, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(wave3, { toValue: 0.2, duration: 350, useNativeDriver: true }),
        ])
      );

      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    } else {
      wave1.setValue(0.4);
      wave2.setValue(0.7);
      wave3.setValue(0.3);
    }
  }, [speaking]);

  useEffect(() => {
    if (autoPlay && text) {
      // Small timeout to allow screen transition
      const timer = setTimeout(() => {
        handleToggleSpeak();
      }, 500);
      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }

    return () => {
      stopSpeaking();
    };
  }, [text]);

  const handleToggleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speakUrdu(text, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactBtn, speaking && styles.compactBtnActive]}
        onPress={handleToggleSpeak}
        activeOpacity={0.8}
      >
        {speaking ? (
          <VolumeX size={15} color={Colors.error} />
        ) : (
          <Volume2 size={15} color={Colors.primary} />
        )}
        <Text style={[styles.compactBtnText, speaking && styles.compactBtnTextActive]}>
          {speaking ? 'بند کریں' : label || 'سنیں'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, speaking && styles.containerActive]}>
      <TouchableOpacity
        style={styles.touchArea}
        onPress={handleToggleSpeak}
        activeOpacity={0.85}
      >
        <View style={[styles.iconCircle, speaking && styles.iconCircleActive]}>
          {speaking ? (
            <VolumeX size={18} color={Colors.white} />
          ) : (
            <Volume2 size={18} color={Colors.primary} />
          )}
        </View>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {speaking ? 'آواز جاری ہے (بول رہے ہیں...)' : label || 'آواز سے رہنمائی سنیں'}
            </Text>
            {speaking && (
              <View style={styles.wavesRow}>
                <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave1 }] }]} />
                <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave2 }] }]} />
                <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave3 }] }]} />
              </View>
            )}
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {speaking ? 'بند کرنے کے لیے یہاں دبائیں' : 'سمجھنے کے لیے بٹن دبائیں'}
          </Text>
        </View>

        <View style={[styles.actionPill, speaking && styles.actionPillActive]}>
          <Text style={[styles.actionPillText, speaking && styles.actionPillTextActive]}>
            {speaking ? 'روکیں' : 'سنیں'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  containerActive: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.primary,
  },
  touchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: FontSize.xs + 1,
    fontWeight: '800',
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.mutedForeground,
    marginTop: 1,
  },
  wavesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 14,
  },
  waveBar: {
    width: 3,
    height: 14,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  actionPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  actionPillActive: {
    backgroundColor: Colors.error,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
  },
  actionPillTextActive: {
    color: Colors.white,
  },

  // Compact variant
  compactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  compactBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: Colors.error,
  },
  compactBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  compactBtnTextActive: {
    color: Colors.error,
  },
});
