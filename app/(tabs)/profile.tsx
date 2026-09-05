import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Star,
  ShieldCheck,
  ScanFace,
  Globe,
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { useLanguage } from '@/services/i18n/languageContext';
import { fetchUserVerification } from '@/services/verification/identityService';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';

export default function Profile() {
  const router = useRouter();
  const { activeUser, activeRole, toggleRole, setUserRole } = useDemoAuth();
  const { language, setLanguage, t, isUrdu } = useLanguage();

  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    async function checkVerification() {
      if (activeUser?.id) {
        const rec = await fetchUserVerification(activeUser.id);
        setIsVerified(Boolean(rec && rec.verification_status === 'verified'));
      }
    }
    checkVerification();
  }, [activeUser?.id]);

  const bids = [
    {
      id: '1',
      buyerName: isUrdu ? 'علی احمد' : 'Ali Ahmad',
      bidAmount: 83000,
      deliveryDate: isUrdu ? '25 اپریل 2026' : 'April 25, 2026',
      dateCreated: isUrdu ? '2 منٹ پہلے' : '2m ago',
      status: 'pending' as const,
    },
  ];

  const userListings: any[] = [];

  const isSeller = activeRole === 'seller';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with Universal Language Switcher */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <LanguageSwitcherButton compact />
        </View>

        <View style={styles.list}>
          {/* User Profile Card */}
          <View style={[styles.card, Shadows.soft]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {activeUser?.full_name ? activeUser.full_name.charAt(0) : 'A'}
              </Text>
            </View>

            <Text style={styles.name}>{activeUser?.full_name || 'Ahmad Ali'}</Text>
            <Text style={styles.location}>
              {isSeller ? t('profile.farmerLocation') : t('profile.buyerLocation')}
            </Text>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <View style={styles.ratingRow}>
                  <Star size={15} color="#EAB308" fill="#EAB308" />
                  <Text style={styles.statValue}>4.8</Text>
                </View>
                <Text style={styles.statLabel}>{t('profile.rating')}</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.stat}>
                <Text style={styles.statValue}>14</Text>
                <Text style={styles.statLabel}>{t('profile.sales')}</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.stat}>
                <View style={styles.ratingRow}>
                  <ShieldCheck size={16} color="#059669" />
                  <Text style={[styles.statValue, { color: '#059669' }]}>
                    {isVerified ? t('profile.verifiedText') : (isUrdu ? 'تصدیق' : 'Active')}
                  </Text>
                </View>
                <Text style={styles.statLabel}>{t('common.verified')}</Text>
              </View>
            </View>
          </View>

          {/* DEDICATED LANGUAGE SELECTION CARD */}
          <View style={[styles.card, Shadows.soft]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.iconCircle}>
                <Globe size={18} color="#15803D" />
              </View>
              <Text style={styles.cardTitle}>{t('profile.languagePref')}</Text>
            </View>

            <View style={styles.languageToggleContainer}>
              <TouchableOpacity
                style={[styles.langOptionCard, isUrdu && styles.langOptionCardActive]}
                onPress={() => setLanguage('ur')}
                activeOpacity={0.85}
              >
                <View style={styles.langOptionTop}>
                  <Text style={[styles.langOptionTitle, isUrdu && styles.langOptionTitleActive]}>
                    اردو
                  </Text>
                  {isUrdu && <CheckCircle2 size={16} color="#15803D" />}
                </View>
                <Text style={styles.langOptionSub}>Urdu (قومی زبان)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.langOptionCard, !isUrdu && styles.langOptionCardActive]}
                onPress={() => setLanguage('en')}
                activeOpacity={0.85}
              >
                <View style={styles.langOptionTop}>
                  <Text style={[styles.langOptionTitle, !isUrdu && styles.langOptionTitleActive]}>
                    English
                  </Text>
                  {!isUrdu && <CheckCircle2 size={16} color="#15803D" />}
                </View>
                <Text style={styles.langOptionSub}>انگریزی (English)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* TRADING ROLE SWITCHER CARD */}
          <View style={[styles.card, Shadows.soft]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.iconCircle}>
                <ArrowLeftRight size={18} color="#2563EB" />
              </View>
              <Text style={styles.cardTitle}>{t('profile.activeRole')}</Text>
            </View>

            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleOptionCard, isSeller && styles.roleOptionCardSeller]}
                onPress={() => setUserRole('seller')}
                activeOpacity={0.85}
              >
                <Text style={[styles.roleOptionTitle, isSeller && styles.roleOptionTextActive]}>
                  {isUrdu ? 'فروخت کنندہ (Seller)' : 'Seller / Farmer'}
                </Text>
                {isSeller && <CheckCircle2 size={16} color="#15803D" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOptionCard, !isSeller && styles.roleOptionCardBuyer]}
                onPress={() => setUserRole('buyer')}
                activeOpacity={0.85}
              >
                <Text style={[styles.roleOptionTitle, !isSeller && styles.roleOptionTextActive]}>
                  {isUrdu ? 'خریدار (Buyer)' : 'Buyer / Mill'}
                </Text>
                {!isSeller && <CheckCircle2 size={16} color="#2563EB" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* VERIFICATION STATUS CARD */}
          <View style={[styles.card, Shadows.soft]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.iconCircle}>
                <ShieldCheck size={18} color="#059669" />
              </View>
              <Text style={styles.cardTitle}>{t('profile.verificationStatus')}</Text>
            </View>

            <View style={styles.verifList}>
              <View style={styles.verifItem}>
                <View style={styles.verifItemLeft}>
                  <ShieldCheck size={18} color="#059669" />
                  <View>
                    <Text style={styles.verifItemTitle}>{t('profile.cnicStatus')}</Text>
                    <Text style={styles.verifItemSub}>
                      {isVerified ? t('profile.verifiedText') : t('profile.unverifiedText')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.verifActionBtn}
                  onPress={() => router.push('/verification/cnic')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.verifActionText}>
                    {isVerified ? (isUrdu ? 'دوبارہ دیکھیں' : 'Review') : (isUrdu ? 'تصدیق کریں' : 'Verify')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.verifItem}>
                <View style={styles.verifItemLeft}>
                  <ScanFace size={18} color="#059669" />
                  <View>
                    <Text style={styles.verifItemTitle}>{t('profile.biometricStatus')}</Text>
                    <Text style={styles.verifItemSub}>
                      {isVerified ? t('profile.verifiedText') : t('profile.unverifiedText')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.verifActionBtn}
                  onPress={() => router.push('/verification/trade-101' as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.verifActionText}>
                    {isVerified ? (isUrdu ? 'دوبارہ دیکھیں' : 'Review') : (isUrdu ? 'تصدیق کریں' : 'Verify')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* RECEIVED BIDS */}
          {bids.length > 0 && (
            <View style={[styles.card, Shadows.soft]}>
              <Text style={styles.cardTitle}>{t('profile.receivedBids')}</Text>
              <View style={styles.bidList}>
                {bids.map((bid) => (
                  <View key={bid.id} style={styles.bidItem}>
                    <View style={styles.bidInfo}>
                      <Text style={styles.bidName}>{bid.buyerName}</Text>
                      <Text style={styles.bidAmount}>
                        ₨{bid.bidAmount.toLocaleString()} {t('common.pkrPerMann')}
                      </Text>
                      <Text style={styles.bidMeta}>{bid.deliveryDate}</Text>
                      <Text style={styles.bidMeta}>{bid.dateCreated}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: Colors.warningBg }]}>
                      <Text style={[styles.statusText, { color: Colors.warning }]}>
                        {t('profile.underReview')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* MY LISTINGS */}
          <View style={[styles.card, Shadows.soft]}>
            <Text style={styles.cardTitle}>{t('profile.myListings')}</Text>
            {userListings.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{t('profile.noListings')}</Text>
                <TouchableOpacity
                  style={styles.addListingBtn}
                  onPress={() => router.push('/(tabs)/add')}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addListingBtnText}>{t('profile.createFirstListing')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.foreground,
  },
  list: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#15803D',
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  location: {
    fontSize: FontSize.sm,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: '#0F172A',
  },
  languageToggleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  langOptionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  langOptionCardActive: {
    borderColor: '#15803D',
    backgroundColor: '#F0FDF4',
  },
  langOptionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  langOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  langOptionTitleActive: {
    color: '#15803D',
  },
  langOptionSub: {
    fontSize: 11,
    color: '#64748B',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOptionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleOptionCardSeller: {
    borderColor: '#15803D',
    backgroundColor: '#F0FDF4',
  },
  roleOptionCardBuyer: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  roleOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  roleOptionTextActive: {
    color: '#0F172A',
  },
  verifList: {
    gap: 10,
  },
  verifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  verifItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verifItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifItemSub: {
    fontSize: 11,
    color: '#64748B',
  },
  verifActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  verifActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  bidList: {
    width: '100%',
    gap: Spacing.sm,
  },
  bidItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bidInfo: {
    flex: 1,
  },
  bidName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#0F172A',
  },
  bidAmount: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  bidMeta: {
    fontSize: FontSize.xs,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: FontSize.sm,
  },
  addListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1b4332',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addListingBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
