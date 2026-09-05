import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Clock, ShieldCheck, User } from 'lucide-react-native';

interface ConfirmationStatusBadgeProps {
  roleLabel: string;
  roleSubLabel?: string;
  partyName?: string;
  isConfirmed: boolean;
  confirmedAt?: string | null;
  isCurrentUser?: boolean;
}

export const ConfirmationStatusBadge: React.FC<ConfirmationStatusBadgeProps> = ({
  roleLabel,
  roleSubLabel,
  partyName,
  isConfirmed,
  confirmedAt,
  isCurrentUser = false,
}) => {
  return (
    <View style={[styles.container, isConfirmed ? styles.confirmedBox : styles.pendingBox]}>
      {/* Top row with Role & You tag */}
      <View style={styles.topRow}>
        <View style={styles.roleContainer}>
          <View style={styles.roleHeaderRow}>
            <Text style={styles.roleLabel}>{roleLabel}</Text>
            {roleSubLabel && <Text style={styles.roleSubLabel}>({roleSubLabel})</Text>}
          </View>
          {partyName && <Text style={styles.partyName} numberOfLines={1}>{partyName}</Text>}
        </View>

        {isCurrentUser && (
          <View style={styles.youBadge}>
            <User size={10} color="#15803D" />
            <Text style={styles.youBadgeText}>آپ (You)</Text>
          </View>
        )}
      </View>

      {/* Status indicator row */}
      <View style={styles.statusRow}>
        {isConfirmed ? (
          <View style={styles.badgeConfirmed}>
            <ShieldCheck size={14} color="#15803D" />
            <View>
              <Text style={styles.badgeConfirmedTitle}>بائیو میٹرک توثیق شدہ</Text>
              <Text style={styles.badgeConfirmedSubtitle}>Digitally Verified & Signed</Text>
            </View>
          </View>
        ) : (
          <View style={styles.badgePending}>
            <Clock size={14} color="#B45309" />
            <View>
              <Text style={styles.badgePendingTitle}>توثیق زیرِ التواء ہے</Text>
              <Text style={styles.badgePendingSubtitle}>Pending Verification</Text>
            </View>
          </View>
        )}
      </View>

      {/* Timestamp */}
      {isConfirmed && confirmedAt && (
        <Text style={styles.timestamp}>
          دستخط وقت: {new Date(confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 110,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roleContainer: {
    flex: 1,
    marginRight: 4,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleSubLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  partyName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  youBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  statusRow: {
    marginTop: 4,
  },
  badgeConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeConfirmedTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#14532D',
  },
  badgeConfirmedSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: '#166534',
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgePendingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78350F',
  },
  badgePendingSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: '#92400E',
  },
  timestamp: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '600',
    marginTop: 6,
  },
});
