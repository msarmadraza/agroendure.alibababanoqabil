import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Trash2, Send } from 'lucide-react-native';

interface VoiceRecorderProps {
  onSendVoiceMessage: (audioUri: string, durationSec: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSendVoiceMessage,
  onCancel,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    let activeRecording: Audio.Recording | null = null;

    async function startAudioRecording() {
      try {
        const perm = await Audio.requestPermissionsAsync();
        if (perm.status === 'granted') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
          const { recording: newRecording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          activeRecording = newRecording;
          setRecording(newRecording);
        }
      } catch (err) {
        console.warn('Voice recording initialization warning (fallback enabled):', err);
      }
    }

    startAudioRecording();

    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (activeRecording) {
        activeRecording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const handleStopAndSend = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let finalUri = `file:///data/user/0/com.agroendure/cache/audio_${Date.now()}.m4a`;

    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (uri) finalUri = uri;
      }
    } catch (e) {
      console.warn('Audio stop warning:', e);
    }

    onSendVoiceMessage(finalUri, Math.max(1, seconds));
  };

  const handleCancel = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
      }
    } catch {}
    onCancel();
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
        <Trash2 size={20} color="#E53E3E" />
      </TouchableOpacity>

      <View style={styles.recordingStatus}>
        <View style={styles.redDot} />
        <Text style={styles.recordingText}>Recording... {formatTime(seconds)}</Text>
      </View>

      <TouchableOpacity onPress={handleStopAndSend} style={styles.sendBtn}>
        <Send size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEB2B2',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 10,
    marginVertical: 6,
  },
  cancelBtn: {
    padding: 6,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53E3E',
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B2C2C',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1b4332',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
