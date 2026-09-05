import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Cloud,
  Building2,
  Handshake,
  Flame,
  Mic,
  ChevronRight,
  Droplets,
  Wind,
  ShoppingBag,
  Search,
} from 'lucide-react-native';
import { VoiceButton } from '@/components/VoiceButton';
import { CropCard } from '@/components/CropCard';
import { fetchListings } from '@/services/marketplace/listingService';
import { listingToCropCard, CropCardView } from '@/services/marketplace/listingAdapter';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { fetchUserTrades } from '@/services/trade/tradeService';
import { useLanguage } from '@/services/i18n/languageContext';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';

export default function Dashboard() {
  const router = useRouter();
  const { activeUser, activeRole } = useDemoAuth();
  const { t, isUrdu } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [recentCrops, setRecentCrops] = useState<CropCardView[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [activeNegotiationsCount, setActiveNegotiationsCount] = useState(0);
  const [topActiveBid, setTopActiveBid] = useState(0);

  const loadRecentListings = useCallback(async () => {
    try {
      setIsLoadingListings(true);
      const allListings = await fetchListings();
      setRecentCrops(allListings.slice(0, 3).map(listingToCropCard));

      const userId = activeUser?.id;
      if (userId) {
        const userListings = allListings.filter((l) => l.seller_id === userId);
        const activeUserListings = userListings.filter((l) => l.status === 'active');
        setActiveListingsCount(activeUserListings.length);

        const topPrice = activeUserListings.reduce((max, l) => Math.max(max, l.price || 0), 0);
        setTopActiveBid(topPrice);

        try {
          const trades = await fetchUserTrades(userId);
          const negotiatingCount = trades.filter((t) => t.status === 'negotiating').length;
          setActiveNegotiationsCount(negotiatingCount);
        } catch {
          setActiveNegotiationsCount(0);
        }
      }
    } finally {
      setIsLoadingListings(false);
    }
  }, [activeUser?.id]);

  useEffect(() => {
    loadRecentListings();
  }, [loadRecentListings]);

  const marketPrices = [
    {
      crop: isUrdu ? 'گندم' : 'Wheat',
      price: isUrdu ? '85,000/من' : '85,000/Mann',
      change: '+2.5%',
      up: true,
    },
    {
      crop: isUrdu ? 'چاول' : 'Rice',
      price: isUrdu ? '120,000/من' : '120,000/Mann',
      change: '-1.2%',
      up: false,
    },
    {
      crop: isUrdu ? 'کپاس' : 'Cotton',
      price: isUrdu ? '95,000/من' : '95,000/Mann',
      change: '+5.8%',
      up: true,
    },
  ];

  const isSeller = activeRole === 'seller';

  const metrics = isSeller
    ? [
        {
          icon: Building2,
          value: String(activeListingsCount).padStart(2, '0'),
          label: t('home.activeListings'),
        },
        {
          icon: Handshake,
          value: String(activeNegotiationsCount).padStart(2, '0'),
          label: t('home.activeNegotiations'),
        },
        {
          icon: Flame,
          value: topActiveBid > 0 ? `${(topActiveBid / 1000).toFixed(0)}K` : '—',
          label: t('home.topActiveBid'),
        },
      ]
    : [
        {
          icon: ShoppingBag,
          value: String(recentCrops.length || 6).padStart(2, '0'),
          label: isUrdu ? 'دستیاب فصلیں' : 'Available Crops',
        },
        {
          icon: Handshake,
          value: String(activeNegotiationsCount).padStart(2, '0'),
          label: t('home.activeNegotiations'),
        },
        {
          icon: Flame,
          value: '01',
          label: isUrdu ? 'میری پیشکشیں' : 'Active Bids',
        },
      ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/agroendure-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerActions}>
            <LanguageSwitcherButton compact />
            <TouchableOpacity style={styles.bellButton}>
              <Bell size={20} color={Colors.foreground} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Role-Specific Hero CTA ── */}
        {isSeller ? (
          <View style={styles.voiceCard}>
            <View style={styles.voiceCardLeft}>
              <View style={styles.micCircle}>
                <Mic size={22} color={Colors.white} />
              </View>
              <View style={styles.voiceTexts}>
                <Text style={styles.voiceTitle}>{t('home.voiceListingTitle')}</Text>
                <Text style={styles.voiceSubtitle}>{t('home.voiceListingSub')}</Text>
              </View>
            </View>
            <VoiceButton
              isRecording={isRecording}
              onStartRecording={() => setIsRecording(true)}
              onStopRecording={() => {
                setIsRecording(false);
                router.push('/(tabs)/add');
              }}
              size="sm"
            />
          </View>
        ) : (
          <View style={styles.buyerHeroCard}>
            <View style={styles.voiceCardLeft}>
              <View style={styles.buyerIconCircle}>
                <ShoppingBag size={22} color={Colors.white} />
              </View>
              <View style={styles.voiceTexts}>
                <Text style={styles.voiceTitle}>
                  {isUrdu ? 'منڈی سے تازہ فصل خریدیں' : 'Explore Mandi Marketplace'}
                </Text>
                <Text style={styles.voiceSubtitle}>
                  {isUrdu ? 'تصدیق شدہ کسانوں سے براہ راست بولی لگائیں' : 'Bid directly with verified local farmers'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.buyerBrowseBtn}
              onPress={() => router.push('/(tabs)/browse')}
              activeOpacity={0.85}
            >
              <Search size={16} color={Colors.primary} />
              <Text style={styles.buyerBrowseBtnText}>
                {isUrdu ? 'منڈی دیکھیں' : 'Browse Mandi'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {isRecording && isSeller && (
          <Text style={styles.recordingText}>{t('home.listeningVoice')}</Text>
        )}

        {/* ── Metrics ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {activeRole === 'seller' ? t('home.farmerDashboard') : t('home.buyerDashboard')}
          </Text>
          <View style={styles.metricsRow}>
            {metrics.map((m, i) => (
              <View key={i} style={[styles.metricCard, Shadows.soft]}>
                <View style={styles.metricIconBg}>
                  <m.icon size={16} color={Colors.primary} />
                </View>
                <Text style={styles.metricValue}>{m.value}</Text>
                <Text style={styles.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Market Prices ── */}
        <View style={[styles.card, Shadows.soft]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('home.todayPrices')}</Text>
            <TrendingUp size={16} color={Colors.primary} />
          </View>
          {marketPrices.map((item, index) => (
            <View key={index} style={[styles.priceRow, index < marketPrices.length - 1 && styles.priceRowBorder]}>
              <Text style={styles.priceCrop}>{item.crop}</Text>
              <View style={styles.priceRight}>
                <Text style={styles.priceValue}>PKR {item.price}</Text>
                <View style={[styles.changeBadge, { backgroundColor: item.up ? Colors.successBg : Colors.errorBg }]}>
                  {item.up
                    ? <TrendingUp size={10} color={Colors.success} />
                    : <TrendingDown size={10} color={Colors.error} />
                  }
                  <Text style={[styles.changeText, { color: item.up ? Colors.success : Colors.error }]}>
                    {item.change}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── Recent Listings ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{t('home.recentListings')}</Text>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => router.push('/(tabs)/browse')}
            >
              <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
              <ChevronRight size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {isLoadingListings ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.listings}>
              {recentCrops.map((crop) => (
                <CropCard
                  key={crop.id}
                  {...crop}
                  onViewDetails={() => router.push('/crop-details')}
                  onPlayVoice={() => console.log('Play voice:', crop.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Weather ── */}
        <View style={[styles.weatherCard, Shadows.soft]}>
          <View style={styles.weatherLeft}>
            <View style={styles.weatherLocationRow}>
              <Cloud size={16} color={Colors.primary} />
              <Text style={styles.weatherCity}>{t('home.weatherCity')}</Text>
            </View>
            <Text style={styles.weatherTemp}>28°C</Text>
            <Text style={styles.weatherCondition}>{t('home.weatherCondition')}</Text>
          </View>
          <View style={styles.weatherRight}>
            <View style={styles.weatherDetail}>
              <Droplets size={14} color={Colors.mutedForeground} />
              <Text style={styles.weatherDetailText}>65%</Text>
            </View>
            <View style={styles.weatherDetail}>
              <Wind size={14} color={Colors.mutedForeground} />
              <Text style={styles.weatherDetailText}>12 {t('home.windUnit')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.xl,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    height: 32,
    width: 140,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: -Spacing.lg,
    marginTop: -Spacing.md,
  },
  // Voice Card
  voiceCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  micCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceTexts: {
    flex: 1,
    gap: 2,
  },
  voiceTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  voiceSubtitle: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  buyerHeroCard: {
    backgroundColor: '#166534',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  buyerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerBrowseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  buyerBrowseBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  recordingText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -Spacing.md,
  },
  // Sections
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  metricIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 28,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    fontWeight: '500',
    lineHeight: 14,
  },
  // Market Prices Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  priceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  priceCrop: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
  priceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priceValue: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  changeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  // Listings
  listings: {
    gap: Spacing.md,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  // Weather
  weatherCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherLeft: {
    gap: 2,
  },
  weatherLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  weatherCity: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  weatherTemp: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.foreground,
    lineHeight: 44,
  },
  weatherCondition: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  weatherRight: {
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  weatherDetailText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
});
