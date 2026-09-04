import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { TermStatus } from '@/types/database';

interface BadgeProps {
  status: TermStatus | string;
  label?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ status, label, style }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'agreed':
      case 'confirmed':
        return { bg: '#D1E7DD', text: '#0F5132', defaultLabel: '✓ Agreed' };
      case 'proposed':
        return { bg: '#CFE2FF', text: '#084298', defaultLabel: 'Proposed' };
      case 'negotiating':
        return { bg: '#FFF3CD', text: '#664D03', defaultLabel: '⏳ Negotiating' };
      case 'missing':
        return { bg: '#F8D7DA', text: '#842029', defaultLabel: '⚠ Missing' };
      case 'conflicting':
        return { bg: '#F8D7DA', text: '#842029', defaultLabel: '⚡ Conflict' };
      case 'rejected':
        return { bg: '#E2E3E5', text: '#41464B', defaultLabel: 'Rejected' };
      default:
        return { bg: '#E9ECEF', text: '#495057', defaultLabel: status };
    }
  };

  const { bg, text, defaultLabel } = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label || defaultLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
