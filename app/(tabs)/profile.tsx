import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Star,
  ShieldCheck,
  ScanFace,
  Globe,
  Sprout,
  ShoppingBag,
  Plus,
  CheckCircle2,
  AlertCircle,
  Package,
  ChevronRight,
  MessageCircle,
} from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { useLanguage } from '@/services/i18n/languageContext';
import { fetchUserVerification } from '@/services/verification/identityService';
import { fetchListings } from '@/services/marketplace/listingService';
import { Listing } from '@/types/database';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';

export default function Profile() {
  const router = useRouter();
  const { activeUser, activeRole, setUserRole } = useDemoAuth();
  const { language, setLanguage, t, isUrdu } = useLanguage();

  const [isVerified, setIsVerified] = useState(false);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  useEffect(() => {
    async function checkVerification() {
      if (activeUser?.id) {
        const rec = await fetchUserVerification(activeUser.id);
        setIsVerified(Boolean(rec && rec.verification_status === 'verified') || Boolean(activeUser.identity_verified));
      }
    }
    checkVerification();
  }, [activeUser?.id, activeUser?.identity_verified]);

  useEffect(() => {
    async function loadUserListings() {
      if (activeUser?.id) {
        setLoadingListings(true);
        try {
          const all = await fetchListings();
          const mine = all.filter((l) => l.seller_id === activeUser.id);
          setUserListings(mine);
        } catch {
          setUserListings([]);
        } finally {
          setLoadingListings(false);
        }
      }
    }
    loadUserListings();
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

  const isSeller = activeRole === 'seller';

  // Build 2-letter monogram
  const fullName = activeUser?.full_name || 'Ahmad Ali';
  const nameParts = fullName.trim().split(' ');
  const monogram =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      : fullName.slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <LanguageSwitcherButton compact />
        </View>

        <View style={styles.cards}>
          {/* ── Profile Card ── */}
          <View style={[styles.card, Shadows.soft]}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                {activeUser?.avatar_url ? (
                  <Image source={{ uri: activeUser.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{monogram}</Text>
                )}
              </View>
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={14} color={Colors.white} />
                </View>
              )}
            </View>

            <Text style={styles.name}>{fullName}</Text>
            {activeUser?.full_name_ur ? (
              <Text style={styles.nameUrdu}>{activeUser.full_name_ur}</Text>
            ) : null}
            {activeUser?.cnic_number ? (
              <Text style={styles.cnicText}>CNIC: {activeUser.cnic_number}</Text>
            ) : null}
            <View style={styles.locationRow}>
              <View style={[styles.rolePill, isSeller ? styles.rolePillSeller : styles.rolePillBuyer]}>
                {isSeller
                  ? <Sprout size={12} color={Colors.primary} />
                  : <ShoppingBag size={12} color={Colors.blue600} />}
                <Text style={[styles.rolePillText, isSeller ? styles.rolePillTextSeller : styles.rolePillTextBuyer]}>
                  {isSeller ? (isUrdu ? 'فروخت کنندہ' : 'Seller') : (isUrdu ? 'خریدار' : 'Buyer')}
                </Text>
              </View>
              <Text style={styles.locationText}>
                {isSeller ? t('profile.farmerLocation') : t('profile.buyerLocation')}
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statValueRow}>
                  <Star size={14} color="#EAB308" fill="#EAB308" />
                  <Text style={styles.statValue}>4.8</Text>
                </View>
                <Text style={styles.statLabel}>{t('profile.rating')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>14</Text>
                <Text style={styles.statLabel}>{t('profile.sales')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statValueRow}>
                  <ShieldCheck size={14} color={isVerified ? Colors.success : Colors.mutedForeground} />
                  <Text style={[styles.statValue, { color: isVerified ? Colors.success : Colors.mutedForeground }]}>
                    {isVerified ? (isUrdu ? 'تصدیق شدہ' : 'Verified') : (isUrdu ? 'نہیں' : 'Not yet')}
                  </Text>
                </View>
                <Text style={styles.statLabel}>{t('common.verified')}</Text>
              </View>
            </View>
          </View>

          {/* ── Language Card ── */}
          <View style={[styles.card, Shadows.soft]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircle}>
                <Globe size={16} color={Colors.primary} />
              </View>
              <Text style={styles.cardTitle}>{t('profile.languagePref')}</Text>
            </View>
            <View style={styles.tileRow}>
              <TouchableOpacity
                style={[styles.tile, isUrdu && styles.tileActive]}
                onPress={() => setLanguage('ur')}
                activeOpacity={0.85}
              >
                <View style={styles.tileTop}>
                  <Text style={[styles.tileName, isUrdu && styles.tileNameActive]}>اردو</Text>
                  {isUrdu && <CheckCircle2 size={16} color={Colors.primary} />}
                </View>
                <Text style={styles.tileSub}>Urdu (قومی زبان)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tile, !isUrdu && styles.tileActive]}
                onPress={() => setLanguage('en')}
                activeOpacity={0.85}
              >
                <View style={styles.tileTop}>
                  <Text style={[styles.tileName, !isUrdu && styles.tileNameActive]}>English</Text>
                  {!isUrdu && <CheckCircle2 size={16} color={Colors.primary} />}
                </View>
                <Text style={styles.tileSub}>انگریزی (English)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Role Card ── */}
          <View style={[styles.card, Shadows.soft]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Sprout size={16} color={Colors.blue600} />
              </View>
              <Text style={styles.cardTitle}>{t('profile.activeRole')}</Text>
            </View>
            <View style={styles.tileRow}>
              <TouchableOpacity
                style={[styles.tile, isSeller && styles.tileActive]}
                onPress={() => setUserRole('seller')}
                activeOpacity={0.85}
              >
                <View style={styles.tileTop}>
                  <Sprout size={20} color={isSeller ? Colors.primary : Colors.mutedForeground} />
                  {isSeller && <CheckCircle2 size={16} color={Colors.primary} />}
                </View>
                <Text style={[styles.tileName, isSeller && styles.tileNameActive]}>
                  {isUrdu ? 'فروخت کنندہ' : 'Seller'}
                </Text>
                <Text style={styles.tileSub}>{isUrdu ? 'کسان / فارمر' : 'Farmer / Grower'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tile, !isSeller && styles.tileBuyerActive]}
                onPress={() => setUserRole('buyer')}
                activeOpacity={0.85}
              >
                <View style={styles.tileTop}>
                  <ShoppingBag size={20} color={!isSeller ? Colors.blue600 : Colors.mutedForeground} />
                  {!isSeller && <CheckCircle2 size={16} color={Colors.blue600} />}
                </View>
                <Text style={[styles.tileName, !isSeller && { color: Colors.blue600 }]}>
                  {isUrdu ? 'خریدار' : 'Buyer'}
                </Text>
                <Text style={styles.tileSub}>{isUrdu ? 'مل / تاجر' : 'Mill / Trader'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Verification Status ── */}
          <View style={[styles.card, Shadows.soft]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.primaryBg }]}>
                <ShieldCheck size={16} color={Colors.success} />
              </View>
              <Text style={styles.cardTitle}>{t('profile.verificationStatus')}</Text>
            </View>

            <View style={styles.verifList}>
              {/* CNIC row */}
              <View style={styles.verifRow}>
                <View style={styles.verifLeft}>
                  <ShieldCheck size={18} color={isVerified ? Colors.success : Colors.mutedForeground} />
                  <View>
                    <Text style={styles.verifTitle}>{t('profile.cnicStatus')}</Text>
                    <Text style={styles.verifSub}>
                      {isVerified ? t('profile.verifiedText') : t('profile.unverifiedText')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.verifBtn, isVerified && styles.verifBtnVerified]}
                  onPress={() => router.push('/verification/cnic')}
                >
                  <Text style={[styles.verifBtnText, isVerified && styles.verifBtnTextVerified]}>
                    {isVerified ? (isUrdu ? 'دیکھیں' : 'View') : (isUrdu ? 'تصدیق کریں' : 'Verify')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.verifDivider} />

              {/* Face row */}
              <View style={styles.verifRow}>
                <View style={styles.verifLeft}>
                  <ScanFace size={18} color={isVerified ? Colors.success : Colors.mutedForeground} />
                  <View>
                    <Text style={styles.verifTitle}>{t('profile.biometricStatus')}</Text>
                    <Text style={styles.verifSub}>
                      {isVerified ? t('profile.verifiedText') : t('profile.unverifiedText')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.verifBtn, isVerified && styles.verifBtnVerified]}
                  onPress={() => router.push('/verification/trade-101' as any)}
                >
                  <Text style={[styles.verifBtnText, isVerified && styles.verifBtnTextVerified]}>
                    {isVerified ? (isUrdu ? 'دیکھیں' : 'View') : (isUrdu ? 'تصدیق کریں' : 'Verify')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Received Bids ── */}
          {bids.length > 0 && (
            <View style={[styles.card, Shadows.soft]}>
              <Text style={styles.cardTitle}>{t('profile.receivedBids')}</Text>
              <View style={styles.bidList}>
                {bids.map((bid) => (
                  <View key={bid.id} style={styles.bidItem}>
                    <View style={styles.bidMonogram}>
                      <Text style={styles.bidMonogramText}>
                        {bid.buyerName.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.bidInfo}>
                      <Text style={styles.bidName}>{bid.buyerName}</Text>
                      <Text style={styles.bidAmount}>
                        PKR {bid.bidAmount.toLocaleString()} / {t('common.pkrPerMann')}
                      </Text>
                      <Text style={styles.bidMeta}>{bid.deliveryDate} · {bid.dateCreated}</Text>
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

          {/* ── My Listings (for Seller) ── */}
          {isSeller && (
            <View style={[styles.card, Shadows.soft]}>
              <View style={styles.cardHeaderWithAction}>
                <Text style={styles.cardTitle}>{t('profile.myListings')}</Text>
                <TouchableOpacity
                  style={styles.addMiniBtn}
                  onPress={() => router.push('/(tabs)/add')}
                >
                  <Plus size={14} color={Colors.primary} />
                  <Text style={styles.addMiniBtnText}>{isUrdu ? 'نئی فصل' : 'Add Crop'}</Text>
                </TouchableOpacity>
              </View>

              {loadingListings ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />
              ) : userListings.length === 0 ? (
                <View style={styles.empty}>
                  <AlertCircle size={32} color={Colors.mutedForeground} />
                  <Text style={styles.emptyText}>{t('profile.noListings')}</Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push('/(tabs)/add')}
                  >
                    <Plus size={16} color={Colors.white} />
                    <Text style={styles.addBtnText}>{t('profile.createFirstListing')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.listingsGrid}>
                  {userListings.map((listing) => (
                    <TouchableOpacity
                      key={listing.id}
                      style={styles.listingItem}
                      onPress={() => router.push('/crop-details' as any)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.listingItemLeft}>
                        <View style={styles.listingIconBox}>
                          <Package size={18} color={Colors.primary} />
                        </View>
                        <View style={styles.listingInfo}>
                          <Text style={styles.listingTitle}>{listing.title}</Text>
                          <Text style={styles.listingMeta}>
                            {listing.quantity} {listing.quantity_unit} • PKR {listing.price.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.listingItemRight}>
                        <View style={styles.activePill}>
                          <Text style={styles.activePillText}>{isUrdu ? 'فعال' : 'Active'}</Text>
                        </View>
                        <ChevronRight size={16} color={Colors.mutedForeground} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── My Bids & Negotiations (for Buyer) ── */}
          {!isSeller && (
            <View style={[styles.card, Shadows.soft]}>
              <View style={styles.cardHeaderWithAction}>
                <Text style={styles.cardTitle}>{isUrdu ? 'میری خریداریاں اور بولیاں' : 'My Bids & Orders'}</Text>
                <TouchableOpacity
                  style={styles.addMiniBtn}
                  onPress={() => router.push('/(tabs)/browse')}
                >
                  <ShoppingBag size={14} color={Colors.primary} />
                  <Text style={styles.addMiniBtnText}>{isUrdu ? 'مارکیٹ' : 'Market'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.bidList}>
                <TouchableOpacity
                  style={styles.bidItem}
                  onPress={() => router.push('/trade/trade-101')}
                  activeOpacity={0.8}
                >
                  <View style={styles.bidMonogram}>
                    <Text style={styles.bidMonogramText}>W</Text>
                  </View>
                  <View style={styles.bidInfo}>
                    <Text style={styles.bidName}>{isUrdu ? 'اعلیٰ کوالٹی گندم' : 'Premium Quality Wheat'}</Text>
                    <Text style={styles.bidAmount}>PKR 85,000 / {t('common.pkrPerMann')}</Text>
                    <Text style={styles.bidMeta}>{isUrdu ? 'مذاکرات جاری ہیں' : 'Negotiation in progress'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: Colors.primaryBg }]}>
                    <Text style={[styles.statusText, { color: Colors.primary }]}>
                      {isUrdu ? 'فعال ڈیل' : 'Active Deal'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 110,
    gap: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.foreground,
  },
  cards: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  // Avatar
  avatarWrap: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.foreground,
    textAlign: 'center',
    marginTop: -Spacing.xs,
  },
  nameUrdu: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 2,
  },
  cnicText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  rolePillSeller: {
    backgroundColor: Colors.primaryBg,
  },
  rolePillBuyer: {
    backgroundColor: '#EFF6FF',
  },
  rolePillText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  rolePillTextSeller: {
    color: Colors.primary,
  },
  rolePillTextBuyer: {
    color: Colors.blue600,
  },
  locationText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.foreground,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  // Card header
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: -Spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  // Tile row (language / role)
  tileRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tile: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.muted,
    gap: 4,
  },
  tileActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  tileBuyerActive: {
    borderColor: Colors.blue600,
    backgroundColor: '#EFF6FF',
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.mutedForeground,
  },
  tileNameActive: {
    color: Colors.primary,
  },
  tileSub: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  // Verification
  verifList: {
    gap: 0,
  },
  verifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  verifLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  verifTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.foreground,
  },
  verifSub: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    marginTop: 1,
  },
  verifDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  verifBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  verifBtnVerified: {
    borderColor: Colors.border,
    backgroundColor: Colors.muted,
  },
  verifBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  verifBtnTextVerified: {
    color: Colors.mutedForeground,
  },
  // Bids
  bidList: {
    gap: Spacing.sm,
  },
  bidItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.muted,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bidMonogram: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidMonogramText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.primary,
  },
  bidInfo: {
    flex: 1,
    gap: 1,
  },
  bidName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.foreground,
  },
  bidAmount: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.primary,
  },
  bidMeta: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  // Empty state
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  addMiniBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  listingsGrid: {
    gap: Spacing.sm,
  },
  listingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  listingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  listingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.foreground,
  },
  listingMeta: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  listingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activePill: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
});
