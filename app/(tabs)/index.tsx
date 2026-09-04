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
  Cloud,
  Building2,
  Handshake,
  Flame,
} from 'lucide-react-native';
import { VoiceButton } from '@/components/VoiceButton';
import { CropCard } from '@/components/CropCard';
import { fetchListings } from '@/services/marketplace/listingService';
import { listingToCropCard, CropCardView } from '@/services/marketplace/listingAdapter';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { fetchUserTrades } from '@/services/trade/tradeService';

export default function Dashboard() {
  const router = useRouter();
  const { activeUser, activeRole } = useDemoAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ur');
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
    { crop: 'گندم', price: 'PKR 85,000/من', change: '+2.5%', up: true },
    { crop: 'چاول', price: 'PKR 120,000/من', change: '-1.2%', up: false },
    { crop: 'کپاس', price: 'PKR 95,000/man', change: '+5.8%', up: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('@/assets/agroendure-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.greeting}>السلام علیکم، احمد! آپ کی فصل کی معلومات</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.picker}>
              <Text style={styles.pickerText}>اردو</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={20} color={Colors.foreground} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Recording Section */}
        <View style={styles.voiceSection}>
          <Text style={styles.voiceTitle}>آواز سے فصل کی فہرست بنائیں</Text>
          <Text style={styles.voiceSubtitle}>بٹن دبائیں اور اپنی فصل کے بارے میں بتائیں</Text>

          <VoiceButton
            isRecording={isRecording}
            onStartRecording={() => setIsRecording(true)}
            onStopRecording={() => {
              setIsRecording(false);
              router.push('/(tabs)/add');
            }}
            size="lg"
          />

          {isRecording && (
            <Text style={styles.recordingText}>سن رہا ہے... اپنی فصل کے بارے میں بتائیں</Text>
          )}
        </View>

        {/* Dashboard Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {activeRole === 'seller' ? 'فارمر ڈیش بورڈ' : 'ڈیش بورڈ'}
          </Text>
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, Shadows.soft]}>
              <View style={styles.metricIconWrapper}>
                <Building2 size={16} color={Colors.primary} />
              </View>
              <Text style={styles.metricValue}>
                {String(activeListingsCount).padStart(2, '0')}
              </Text>
              <Text style={styles.metricLabel}>Active Listings</Text>
            </View>

            <View style={[styles.metricCard, Shadows.soft]}>
              <View style={styles.metricIconWrapper}>
                <Handshake size={16} color={Colors.primary} />
              </View>
              <Text style={styles.metricValue}>
                {String(activeNegotiationsCount).padStart(2, '0')}
              </Text>
              <Text style={styles.metricLabel}>Active Negotiations</Text>
            </View>

            <View style={[styles.metricCard, Shadows.soft]}>
              <View style={styles.metricIconWrapper}>
                <Flame size={16} color={Colors.primary} />
              </View>
              <Text style={styles.metricLabel}>Top Active Bid</Text>
              <Text style={styles.metricBidValue}>
                {topActiveBid > 0
                  ? `PKR ${topActiveBid.toLocaleString()}`
                  : 'PKR 0'}
              </Text>
            </View>
          </View>
        </View>

        {/* Market Prices Ticker */}
        <View style={[styles.card, Shadows.soft]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>آج کی قیمتیں</Text>
            <TrendingUp size={16} color={Colors.primary} />
          </View>
          <View style={styles.priceList}>
            {marketPrices.map((item, index) => (
              <View key={index} style={styles.priceRow}>
                <Text style={styles.priceCrop}>{item.crop}</Text>
                <View style={styles.priceRight}>
                  <Text style={styles.priceValue}>{item.price}</Text>
                  <View
                    style={[
                      styles.changeBadge,
                      { backgroundColor: item.up ? Colors.successBg : Colors.errorBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.changeText,
                        { color: item.up ? Colors.success : Colors.error },
                      ]}
                    >
                      {item.change}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>حالیہ فہرست</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/browse')}>
              <Text style={styles.seeAll}>سب دیکھیں</Text>
            </TouchableOpacity>
          </View>

          {isLoadingListings ? (
            <View style={styles.listingsLoading}>
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

        {/* Weather Widget */}
        <View style={styles.weatherCard}>
          <View>
            <View style={styles.weatherLocation}>
              <Cloud size={20} color={Colors.white} />
              <Text style={styles.weatherCity}>فیصل آباد</Text>
            </View>
            <Text style={styles.weatherTemp}>28°C</Text>
            <Text style={styles.weatherCondition}>صاف موسم</Text>
          </View>
          <View style={styles.weatherDetails}>
            <Text style={styles.weatherDetailText}>نمی: 65%</Text>
            <Text style={styles.weatherDetailText}>ہوا: 12 کلو میٹر/گھنٹہ</Text>
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
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  logo: {
    height: 32,
    width: 140,
  },
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  picker: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
  },
  pickerText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  iconButton: {
    padding: Spacing.sm,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  voiceSection: {
    alignItems: 'center',
    backgroundColor: Colors.gradientVoiceEnd,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  voiceTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  voiceSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  recordingText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
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
    gap: 4,
    alignItems: 'flex-start',
  },
  metricIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.mutedForeground,
  },
  metricBidValue: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
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
  priceList: {
    gap: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceCrop: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.foreground,
  },
  priceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priceValue: {
    fontSize: FontSize.sm,
    color: Colors.foreground,
  },
  changeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  changeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  listings: {
    gap: Spacing.lg,
  },
  listingsLoading: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  weatherCard: {
    backgroundColor: Colors.blue500,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  weatherCity: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  weatherTemp: {
    color: Colors.white,
    fontSize: FontSize.xxxl,
    fontWeight: '700',
  },
  weatherCondition: {
    color: Colors.white,
    fontSize: FontSize.sm,
    opacity: 0.9,
  },
  weatherDetails: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  weatherDetailText: {
    color: Colors.white,
    fontSize: FontSize.sm,
  },
});
