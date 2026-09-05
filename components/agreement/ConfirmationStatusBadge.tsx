import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Clock, User, ShieldCheck } from 'lucide-react-native';

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
      {/* Top Header: Role & "You" Indicator */}
      <View style={styles.topRow}>
        <View style={styles.roleContainer}>
          <View style={styles.roleTitleRow}>
            <Text style={styles.roleLabel}>{roleLabel}</Text>
            {roleSubLabel && <Text style={styles.roleSubLabel}>• {roleSubLabel}</Text>}
          </View>
          {partyName && (
            <Text style={styles.partyName} numberOfLines={1}>
              {partyName}
            </Text>
          )}
        </View>

        {isCurrentUser && (
          <View style={styles.youBadge}>
            <User size={10} color="#15803D" />
            <Text style={styles.youBadgeText}>آپ • You</Text>
          </View>
        )}
      </View>

      {/* Verification Status Pill */}
      <View style={styles.statusSection}>
        {isConfirmed ? (
          <View style={styles.badgeConfirmed}>
            <ShieldCheck size={14} color="#059669" />
            <View style={styles.statusTextCol}>
              <Text style={styles.badgeConfirmedTitle}>ڈیجیٹل توثیق شدہ</Text>
              <Text style={styles.badgeConfirmedSub}>Verified & Signed</Text>
            </View>
          </View>
        ) : (
          <View style={styles.badgePending}>
            <Clock size={14} color="#D97706" />
            <View style={styles.statusTextCol}>
              <Text style={styles.badgePendingTitle}>توثیق زیرِ التواء</Text>
              <Text style={styles.badgePendingSub}>Awaiting Signature</Text>
            </View>
          </View>
        )}
      </View>

      {/* Signature Timestamp Footer */}
      <View style={styles.footerRow}>
        {isConfirmed && confirmedAt ? (
          <Text style={styles.timestampConfirmed}>
            دستخط وقت: {new Date(confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        ) : (
          <Text style={styles.timestampPending}>
            دستخط کا انتظار ہے
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  confirmedBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#A7F3D0',
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
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  statusSection: {
    marginVertical: 4,
  },
  badgeConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },
  statusTextCol: {
    flex: 1,
  },
  badgeConfirmedTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  badgeConfirmedSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#047857',
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },
  badgePendingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  badgePendingSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#B45309',
  },
  footerRow: {
    marginTop: 6,
  },
  timestampConfirmed: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '600',
  },
  timestampPending: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '500',
  },
});
