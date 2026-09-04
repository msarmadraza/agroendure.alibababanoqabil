import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Clock } from 'lucide-react-native';

interface ConfirmationStatusBadgeProps {
  roleLabel: string;
  isConfirmed: boolean;
  confirmedAt?: string | null;
}

export const ConfirmationStatusBadge: React.FC<ConfirmationStatusBadgeProps> = ({
  roleLabel,
  isConfirmed,
  confirmedAt,
}) => {
  return (
    <View style={[styles.container, isConfirmed ? styles.confirmedBox : styles.pendingBox]}>
      <View style={styles.topRow}>
        <Text style={styles.roleLabel}>{roleLabel}</Text>
        {isConfirmed ? (
          <View style={styles.badgeConfirmed}>
            <CheckCircle2 size={14} color="#0F5132" />
            <Text style={styles.badgeConfirmedText}>Confirmed</Text>
          </View>
        ) : (
          <View style={styles.badgePending}>
            <Clock size={14} color="#664D03" />
            <Text style={styles.badgePendingText}>Pending Confirmation</Text>
          </View>
        )}
      </View>
      {isConfirmed && confirmedAt && (
        <Text style={styles.timestamp}>Digitally Signed: {new Date(confirmedAt).toLocaleString()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
  },
  confirmedBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  pendingBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  badgeConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1E7DD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeConfirmedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F5132',
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePendingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#664D03',
  },
  timestamp: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
});
