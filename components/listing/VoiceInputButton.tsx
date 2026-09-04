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
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.processingText}>AI آپ کی آواز تجزیہ کر رہا ہے...</Text>
        </View>
      ) : isRecording ? (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingHeader}>
            <View style={styles.redDot} />
            <Text style={styles.recordingTitle}>آپ کی آواز سن رہا ہے...</Text>
            <Text style={styles.recordingTimer}>{formatTimer(recordingSeconds)}</Text>
          </View>

          {liveTranscript ? (
            <Text style={styles.liveTranscriptText}>"{liveTranscript}"</Text>
          ) : (
            <Text style={styles.listeningHint}>ابھی بولیں — فصل، مقدار یا کوالٹی بتائیں...</Text>
          )}

          <TouchableOpacity
            style={styles.stopBtn}
            onPress={handleStopRecording}
            activeOpacity={0.8}
          >
            <Square size={20} color={Colors.white} />
            <Text style={styles.stopText}>رکیں اور تجزیہ کریں</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.micButton}
          onPress={handleStartRecording}
          activeOpacity={0.8}
        >
          <View style={[styles.micInner, Shadows.medium]}>
            <Mic size={36} color={Colors.white} />
          </View>
          <Text style={styles.tapText}>دبائیں اور بولیں</Text>
          {stepPromptHint ? <Text style={styles.hintSubText}>{stepPromptHint}</Text> : null}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  micButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  micInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  hintSubText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  recordingContainer: {
    alignItems: 'center',
    backgroundColor: Colors.errorBg,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.error,
    width: '100%',
    gap: Spacing.md,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
  },
  recordingTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.error,
  },
  recordingTimer: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.error,
    marginLeft: Spacing.sm,
  },
  liveTranscriptText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    marginVertical: Spacing.xs,
    fontStyle: 'italic',
  },
  listeningHint: {
    fontSize: FontSize.md,
    color: Colors.error,
    fontStyle: 'italic',
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  stopText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  processingBox: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  processingText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '600',
  },
});
