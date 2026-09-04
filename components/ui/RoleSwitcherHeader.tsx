import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { fetchUserVerification } from '@/services/verification/identityService';
import { ArrowLeftRight, User, Sprout, ShieldCheck, AlertCircle } from 'lucide-react-native';

export const RoleSwitcherHeader: React.FC = () => {
  const { activeRole, activeUser, toggleRole } = useDemoAuth();
  const [isVerified, setIsVerified] = useState(false);

  if (!activeUser) return null;
  const userId = activeUser.id;
  const isSeller = activeRole === 'seller';

  useEffect(() => {
    async function checkVerification() {
      const rec = await fetchUserVerification(userId);
      setIsVerified(Boolean(rec && rec.verification_status === 'verified'));
    }
    checkVerification();
  }, [userId]);

  return (
    <View style={[styles.container, isSeller ? styles.sellerBg : styles.buyerBg]}>
      <View style={styles.leftCol}>
        {isSeller ? <Sprout size={16} color="#0F5132" /> : <User size={16} color="#084298" />}
        <Text style={styles.roleTitle}>
          Active View: <Text style={styles.roleBold}>{isSeller ? '🌾 SELLER / FARMER' : '🛒 BUYER'}</Text>
        </Text>

        {isSeller && (
          <View
            style={[styles.verifPill, isVerified ? styles.verifSuccess : styles.verifWarning]}
          >
            {isVerified ? <ShieldCheck size={12} color="#0F5132" /> : <AlertCircle size={12} color="#B45309" />}
            <Text style={[styles.verifPillText, isVerified ? styles.textSuccess : styles.textWarning]}>
              {isVerified ? '✓ CNIC Verified' : '🛡️ Verify CNIC'}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.switchBtn} onPress={toggleRole} activeOpacity={0.8}>
        <ArrowLeftRight size={14} color="#1b4332" />
        <Text style={styles.switchText}>
          Switch to {isSeller ? 'Buyer 👤' : 'Seller 🌾'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  buyerBg: {
    backgroundColor: '#EBF8FF',
  },
  sellerBg: {
    backgroundColor: '#F0FDF4',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleTitle: {
    fontSize: 12,
    color: '#334155',
  },
  roleBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  verifPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifSuccess: {
    backgroundColor: '#D1E7DD',
  },
  verifWarning: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  verifPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textSuccess: {
    color: '#0F5132',
  },
  textWarning: {
    color: '#92400E',
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1b4332',
  },
  switchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b4332',
  },
});
