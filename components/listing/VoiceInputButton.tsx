import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Mic, Square } from 'lucide-react-native';
import { Colors, Radius, FontSize, Spacing, Shadows } from '@/constants/theme';

interface VoiceInputButtonProps {
  onSpeechCompleted: (audioUri: string, spokenText: string) => void;
  isProcessing?: boolean;
  stepPromptHint?: string;
}

/**
 * Voice input button with real speech recognition.
 * On web, uses the browser SpeechRecognition API (ur-PK) to live-transcribe
 * the farmer's speech. On stop, hands the transcript to the AI wizard.
 */
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onSpeechCompleted,
  isProcessing = false,
  stepPromptHint,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setLiveTranscript('');
    transcriptRef.current = '';

    // Web Speech Recognition if in browser environment
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'ur-PK'; // Urdu (Pakistan)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            setLiveTranscript(current);
            transcriptRef.current = current;
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recognition.onerror = (err: any) => {
            console.warn('Speech recognition error:', err);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn('Speech recognition failed to start:', e);
        }
      }
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error
      }
    }

    setTimeout(() => {
      const finalSpokenText = transcriptRef.current.trim();
      onSpeechCompleted('voice-audio.m4a', finalSpokenText);
    }, 400);
  };

  const formatTimer = (secs: number) =>
    `00:${secs < 10 ? `0${secs}` : secs}`;

  return (
    <View style={styles.container}>
      {isProcessing ? (
        <View style={styles.processingBox}>
          <View style={styles.processingSpinnerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
          <Text style={styles.processingTitle}>AI تجزیہ جاری ہے...</Text>
          <Text style={styles.processingSub}>آپ کی آواز سے معلومات حاصل کی جا رہی ہیں</Text>
        </View>
      ) : isRecording ? (
        <View style={[styles.recordingContainer, Shadows.medium]}>
          <View style={styles.recordingHeader}>
            <View style={styles.pulsingRedDot} />
            <Text style={styles.recordingTitle}>سن رہا ہے (Listening...)</Text>
            <View style={styles.timerPill}>
              <Text style={styles.recordingTimer}>{formatTimer(recordingSeconds)}</Text>
            </View>
          </View>

          {/* Soundwave representation */}
          <View style={styles.waveRow}>
            {[8, 18, 30, 22, 36, 26, 14, 28, 12].map((height, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  styles.waveBarActive,
                  { height: Math.max(6, (height * (1 + (recordingSeconds % 3) * 0.2))) },
                ]}
              />
            ))}
          </View>

          {liveTranscript ? (
            <View style={styles.liveTranscriptCard}>
              <Text style={styles.liveTranscriptText}>"{liveTranscript}"</Text>
            </View>
          ) : (
            <Text style={styles.listeningHint}>ابھی بولیں — مثلاً فصل، مقدار، یا کوالٹی بتائیں...</Text>
          )}

          <TouchableOpacity
            style={styles.stopBtn}
            onPress={handleStopRecording}
            activeOpacity={0.85}
          >
            <Square size={18} color={Colors.white} fill={Colors.white} />
            <Text style={styles.stopText}>مکمل کریں اور تجزیہ کروائیں</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.micInteractiveArea}
          onPress={handleStartRecording}
          activeOpacity={0.85}
        >
          {/* Concentric Acoustic Rings */}
          <View style={styles.outerRing}>
            <View style={styles.middleRing}>
              <View style={[styles.innerCore, Shadows.medium]}>
                <Mic size={36} color={Colors.white} />
              </View>
            </View>
          </View>

          {/* Equalizer Visualizer preview */}
          <View style={styles.equalizerRow}>
            {[10, 16, 22, 14, 26, 18, 12].map((height, i) => (
              <View key={i} style={[styles.waveBar, { height }]} />
            ))}
          </View>

          <Text style={styles.tapPrompt}>دبائیں اور اپنی زبان میں بولیں</Text>
          <Text style={styles.langSupportText}>اردو • Punjabi • English</Text>

          {stepPromptHint ? (
            <View style={styles.hintBadge}>
              <Text style={styles.hintSubText}>{stepPromptHint}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: Spacing.sm,
  },
  micInteractiveArea: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  outerRing: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleRing: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCore: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    marginTop: 2,
  },
  waveBar: {
    width: 3.5,
    borderRadius: 2,
    backgroundColor: '#86EFAC',
  },
  waveBarActive: {
    backgroundColor: '#EF4444',
  },
  tapPrompt: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.foreground,
    letterSpacing: -0.2,
  },
  langSupportText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  hintBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: '90%',
  },
  hintSubText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  recordingContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    padding: Spacing.xl,
    borderRadius: Radius.xxl,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    width: '100%',
    gap: Spacing.md,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  pulsingRedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E11D48',
  },
  recordingTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: '#9F1239',
    flex: 1,
    marginLeft: Spacing.sm,
  },
  timerPill: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FDA4AF',
  },
  recordingTimer: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: '#E11D48',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 44,
  },
  liveTranscriptCard: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#FECDD3',
    width: '100%',
  },
  liveTranscriptText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  listeningHint: {
    fontSize: FontSize.sm,
    color: '#BE123C',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 13,
    borderRadius: Radius.xl,
    gap: Spacing.sm,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stopText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  processingBox: {
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.sm,
  },
  processingSpinnerContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  processingTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.foreground,
  },
  processingSub: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
});
