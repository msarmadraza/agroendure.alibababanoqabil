import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { useLanguage } from '@/services/i18n/languageContext';
import { fetchUserVerification } from '@/services/verification/identityService';
import { LanguageSwitcherButton } from './LanguageSwitcherButton';
import { ArrowLeftRight, User, Sprout, ShieldCheck, AlertCircle } from 'lucide-react-native';

export const RoleSwitcherHeader: React.FC = () => {
  const { activeRole, activeUser, toggleRole } = useDemoAuth();
  const { t, isUrdu } = useLanguage();
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
      {/* Left Column: Active Role & Verification Status */}
      <View style={styles.leftCol}>
        {isSeller ? <Sprout size={15} color="#0F5132" /> : <User size={15} color="#084298" />}
        <Text style={styles.roleTitle}>
          {isUrdu ? 'منظر:' : 'View:'}{' '}
          <Text style={styles.roleBold}>
            {isSeller ? (isUrdu ? 'فروخت کنندہ (Seller)' : 'Seller / Farmer') : (isUrdu ? 'خریدار (Buyer)' : 'Buyer')}
          </Text>
        </Text>

        {isSeller && (
          <View
            style={[styles.verifPill, isVerified ? styles.verifSuccess : styles.verifWarning]}
          >
            {isVerified ? <ShieldCheck size={11} color="#0F5132" /> : <AlertCircle size={11} color="#B45309" />}
            <Text style={[styles.verifPillText, isVerified ? styles.textSuccess : styles.textWarning]}>
              {isVerified ? (isUrdu ? 'تصدیق شدہ' : 'Verified') : (isUrdu ? 'CNIC تصدیق' : 'Verify')}
            </Text>
          </View>
        )}
      </View>

      {/* Right Column: Switch Role Button + Universal Language Toggle */}
      <View style={styles.rightCol}>
        <LanguageSwitcherButton compact />

        <TouchableOpacity style={styles.switchBtn} onPress={toggleRole} activeOpacity={0.8}>
          <ArrowLeftRight size={13} color="#15803D" />
          <Text style={styles.switchText}>
            {isSeller ? (isUrdu ? 'خریدار موڈ' : 'Buyer') : (isUrdu ? 'فروخت کنندہ' : 'Seller')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  sellerBg: {
    backgroundColor: '#F0FDF4',
    borderBottomColor: '#DCFCE7',
  },
  buyerBg: {
    backgroundColor: '#EFF6FF',
    borderBottomColor: '#DBEAFE',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
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
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  verifSuccess: {
    backgroundColor: '#DCFCE7',
  },
  verifWarning: {
    backgroundColor: '#FEF3C7',
  },
  verifPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textSuccess: {
    color: '#0F5132',
  },
  textWarning: {
    color: '#B45309',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  switchText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
});
