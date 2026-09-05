import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { CheckCircle2, Clock, AlertCircle, AlertTriangle } from 'lucide-react-native';
import { TermStatus } from '@/types/database';
import { useLanguage } from '@/services/i18n/languageContext';

interface BadgeProps {
  status: TermStatus | string;
  label?: string;
  style?: ViewStyle;
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ status, label, style, showIcon = true }) => {
  const { isUrdu } = useLanguage();

  const getBadgeConfig = () => {
    switch (status) {
      case 'agreed':
      case 'confirmed':
        return {
          bg: '#ECFDF5',
          border: '#A7F3D0',
          text: '#065F46',
          icon: <CheckCircle2 size={11} color="#059669" />,
          defaultLabel: isUrdu ? 'طے شدہ' : 'Agreed',
        };
      case 'proposed':
      case 'negotiating':
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          text: '#92400E',
          icon: <Clock size={11} color="#D97706" />,
          defaultLabel: isUrdu ? 'زیرِ بحث' : 'Negotiating',
        };
      case 'missing':
        return {
          bg: '#FEF2F2',
          border: '#FECACA',
          text: '#991B1B',
          icon: <AlertCircle size={11} color="#DC2626" />,
          defaultLabel: isUrdu ? 'درکار' : 'Required',
        };
      case 'conflicting':
        return {
          bg: '#FEF2F2',
          border: '#FECACA',
          text: '#991B1B',
          icon: <AlertTriangle size={11} color="#DC2626" />,
          defaultLabel: isUrdu ? 'تضاد' : 'Conflict',
        };
      case 'rejected':
        return {
          bg: '#F1F5F9',
          border: '#E2E8F0',
          text: '#475569',
          icon: <AlertCircle size={11} color="#64748B" />,
          defaultLabel: isUrdu ? 'مسترد' : 'Rejected',
        };
      default:
        return {
          bg: '#F8FAFC',
          border: '#E2E8F0',
          text: '#334155',
          icon: null,
          defaultLabel: status,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        style,
      ]}
    >
      {showIcon && config.icon}
      <Text style={[styles.text, { color: config.text }]}>{label || config.defaultLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
