import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label }) => {
  const percentage = Math.min(100, Math.max(0, progress));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.title}>{label || 'Agreement Progress'}</Text>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3748',
  },
  percentage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b4332',
  },
  track: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#2d6a4f',
    borderRadius: 4,
  },
});
