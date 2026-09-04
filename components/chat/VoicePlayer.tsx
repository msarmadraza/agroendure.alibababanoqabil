import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, Volume2 } from 'lucide-react-native';

interface VoicePlayerProps {
  audioUrl: string | null;
  transcription?: string | null;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({ audioUrl, transcription }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
          {isPlaying ? <Pause size={20} color="#FFFFFF" /> : <Play size={20} color="#FFFFFF" />}
        </TouchableOpacity>

        <View style={styles.waveFormContainer}>
          <Volume2 size={16} color="#1b4332" />
          <View style={styles.dummyWaveform}>
            <View style={[styles.bar, { height: 12 }]} />
            <View style={[styles.bar, { height: 20 }]} />
            <View style={[styles.bar, { height: 14 }]} />
            <View style={[styles.bar, { height: 24 }]} />
            <View style={[styles.bar, { height: 18 }]} />
            <View style={[styles.bar, { height: 10 }]} />
            <View style={[styles.bar, { height: 22 }]} />
            <View style={[styles.bar, { height: 15 }]} />
          </View>
          <Text style={styles.duration}>0:12</Text>
        </View>
      </View>

      {transcription && (
        <View style={styles.transcriptionBox}>
          <Text style={styles.transcriptionLabel}>🎙️ Audio Transcription:</Text>
          <Text style={styles.transcriptionText}>{transcription}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 6,
    width: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1b4332',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveFormContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  dummyWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 24,
  },
  bar: {
    width: 3,
    backgroundColor: '#2d6a4f',
    borderRadius: 2,
  },
  duration: {
    fontSize: 12,
    color: '#2d6a4f',
    fontWeight: '600',
  },
  transcriptionBox: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#40916c',
  },
  transcriptionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 2,
  },
  transcriptionText: {
    fontSize: 13,
    color: '#2d3748',
    fontStyle: 'italic',
  },
});
