import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  Phone,
  MessageCircle,
  Play,
  Pause,
  Volume2,
  Package,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useLanguage } from '@/services/i18n/languageContext';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';

export default function CropDetails() {
  const router = useRouter();
  const { t, isUrdu } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [customBidAmount, setCustomBidAmount] = useState('');

  const cropData = {
    id: '1',
    title: isUrdu ? 'اعلیٰ کوالٹی گندم' : 'Premium Quality Wheat',
    price: 85000,
    quantity: isUrdu ? '50 من' : '50 Mann',
    location: isUrdu ? 'فیصل آباد، پنجاب' : 'Faisalabad, Punjab',
    harvestDate: isUrdu ? '15 اپریل 2024' : 'April 15, 2024',
    quality: isUrdu ? 'پریمیم' : 'Premium',
    variety: isUrdu ? 'پنجاب 2011' : 'Punjab 2011',
    moisture: '12%',
    farmer: {
      name: isUrdu ? 'احمد علی' : 'Ahmad Ali',
      rating: 4.8,
      totalReviews: 23,
      memberSince: '2022',
      phone: '+92 300 1234567',
      completedSales: 156,
    },
    images: [
      require('@/assets/wheat-field.jpg'),
      require('@/assets/rice-seedlings.jpg'),
      require('@/assets/cotton-harvest.jpg'),
    ],
    description: isUrdu
      ? 'یہ بہترین کوالٹی کا گندم ہے۔ بالکل صاف اور خشک، کوئی کیڑا نہیں۔ فوری ڈیلیوری کے لیے دستیاب۔'
      : 'Premium quality wheat, clean and dry with no pest damage. Available for immediate delivery.',
    voiceDescription: true,
    currentBids: [
      {
        bidder: isUrdu ? 'علی حسن' : 'Ali Hassan',
        amount: 83000,
        time: isUrdu ? '2 گھنٹے پہلے' : '2h ago',
      },
      {
        bidder: isUrdu ? 'محمد کریم' : 'Muhammad Karim',
        amount: 81000,
        time: isUrdu ? '4 گھنٹے پہلے' : '4h ago',
      },
    ],
    specifications: [
      { label: isUrdu ? 'نمی' : 'Moisture', value: '12%' },
      { label: isUrdu ? 'پیداوار' : 'Yield', value: isUrdu ? '45 من/ایکڑ' : '45 Mann/Acre' },
      { label: isUrdu ? 'دانے کا سائز' : 'Grain Size', value: isUrdu ? 'متوسط' : 'Medium' },
      { label: isUrdu ? 'رنگ' : 'Color', value: isUrdu ? 'سنہری' : 'Golden' },
    ],
  };

  const handlePlayVoice = () => {
    setIsPlayingVoice(!isPlayingVoice);
    if (!isPlayingVoice) {
      setTimeout(() => setIsPlayingVoice(false), 3000);
    }
  };

  const handleCustomBid = () => {
    if (customBidAmount && parseInt(customBidAmount) > 0) {
      router.push('/bidding');
    }
  };

  // Build 2-letter monogram for farmer
  const nameParts = cropData.farmer.name.trim().split(' ');
  const monogram =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : cropData.farmer.name.slice(0, 2).toUpperCase();

  const bestBid = Math.max(...cropData.currentBids.map((b) => b.amount));

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('cropDetails.title')}</Text>
        <LanguageSwitcherButton compact />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Image Carousel ── */}
        <View style={styles.gallery}>
          <Image
            source={cropData.images[currentImageIndex]}
            style={styles.galleryImage}
            resizeMode="cover"
          />
          <View style={styles.imageDots}>
            {cropData.images.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentImageIndex(index)}
                style={[styles.dot, index === currentImageIndex && styles.dotActive]}
              />
            ))}
          </View>
          <View style={styles.qualityTag}>
            <ShieldCheck size={12} color={Colors.white} />
            <Text style={styles.qualityTagText}>{cropData.quality}</Text>
          </View>
        </View>

        {/* ── Title & Price ── */}
        <View style={styles.titleCard}>
          <View style={styles.titleRow}>
            <Text style={styles.cropTitle}>{cropData.title}</Text>
            <View style={styles.priceBox}>
              <Text style={styles.priceValue}>PKR {cropData.price.toLocaleString()}</Text>
              <Text style={styles.priceUnit}>{isUrdu ? 'فی من' : 'per Mann'}</Text>
            </View>
          </View>

          {/* Key stats chips */}
          <View style={styles.statsChips}>
            <View style={styles.chip}>
              <Package size={12} color={Colors.primary} />
              <Text style={styles.chipText}>{cropData.quantity}</Text>
            </View>
            <View style={styles.chip}>
              <MapPin size={12} color={Colors.primary} />
              <Text style={styles.chipText}>{cropData.location}</Text>
            </View>
            <View style={styles.chip}>
              <Calendar size={12} color={Colors.primary} />
              <Text style={styles.chipText}>{cropData.harvestDate}</Text>
            </View>
          </View>

          <Text style={styles.description}>{cropData.description}</Text>
        </View>

        {/* ── Voice Description ── */}
        {cropData.voiceDescription && (
          <View style={[styles.card, Shadows.soft]}>
            <View style={styles.voiceRow}>
              <View style={styles.voiceLeft}>
                <View style={styles.voiceIconBg}>
                  <Volume2 size={18} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.voiceTitle}>
                    {isUrdu ? 'آواز میں تفصیل' : 'Voice Description'}
                  </Text>
                  <Text style={styles.voiceSub}>
                    {isUrdu ? 'کسان کی زبان میں' : 'By the farmer'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handlePlayVoice} style={styles.playBtn}>
                {isPlayingVoice
                  ? <Pause size={18} color={Colors.primary} />
                  : <Play size={18} color={Colors.primary} />}
              </TouchableOpacity>
            </View>
            {isPlayingVoice && (
              <View style={styles.waveformRow}>
                {[...Array(12)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      { height: 8 + ((i * 7) % 20) },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Specifications ── */}
        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.cardTitle}>
            {isUrdu ? 'تفصیلات' : 'Specifications'}
          </Text>
          <View style={styles.specGrid}>
            {cropData.specifications.map((spec, index) => (
              <View key={index} style={styles.specCell}>
                <Text style={styles.specLabel}>{spec.label}</Text>
                <Text style={styles.specValue}>{spec.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Farmer Info ── */}
        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.cardTitle}>
            {isUrdu ? 'کسان کی معلومات' : 'Farmer Information'}
          </Text>

          <View style={styles.farmerRow}>
            <View style={styles.farmerAvatar}>
              <Text style={styles.farmerAvatarText}>{monogram}</Text>
            </View>
            <View style={styles.farmerInfo}>
              <Text style={styles.farmerName}>{cropData.farmer.name}</Text>
              <View style={styles.ratingRow}>
                <Star size={13} color={Colors.warning} fill={Colors.warning} />
                <Text style={styles.ratingText}>{cropData.farmer.rating}</Text>
                <Text style={styles.reviewCount}>
                  ({cropData.farmer.totalReviews} {isUrdu ? 'ریویوز' : 'reviews'})
                </Text>
              </View>
            </View>
            <View style={styles.farmerBadge}>
              <ShieldCheck size={14} color={Colors.success} />
              <Text style={styles.farmerBadgeText}>{isUrdu ? 'تصدیق شدہ' : 'Verified'}</Text>
            </View>
          </View>

          <View style={styles.farmerMeta}>
            <View style={styles.farmerMetaItem}>
              <Text style={styles.farmerMetaLabel}>{isUrdu ? 'ممبر' : 'Member since'}</Text>
              <Text style={styles.farmerMetaValue}>{cropData.farmer.memberSince}</Text>
            </View>
            <View style={styles.farmerMetaDivider} />
            <View style={styles.farmerMetaItem}>
              <Text style={styles.farmerMetaLabel}>{isUrdu ? 'مکمل فروخت' : 'Completed sales'}</Text>
              <Text style={styles.farmerMetaValue}>{cropData.farmer.completedSales}</Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBtn}>
              <Phone size={16} color={Colors.foreground} />
              <Text style={styles.contactBtnText}>{isUrdu ? 'کال' : 'Call'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactBtn, styles.contactBtnPrimary]}
              onPress={() => router.push('/trade/trade-101')}
            >
              <MessageCircle size={16} color={Colors.white} />
              <Text style={styles.contactBtnPrimaryText}>{isUrdu ? 'چیٹ' : 'Chat'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Current Bids ── */}
        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.cardTitle}>
            {isUrdu ? 'موجودہ بولیاں' : 'Current Bids'}
          </Text>
          {cropData.currentBids.map((bid, index) => (
            <View key={index} style={[styles.bidRow, index < cropData.currentBids.length - 1 && styles.bidRowBorder]}>
              <View style={styles.bidLeft}>
                <View style={styles.bidRank}>
                  <Text style={styles.bidRankText}>{index + 1}</Text>
                </View>
                <View>
                  <Text style={styles.bidderName}>{bid.bidder}</Text>
                  <Text style={styles.bidTime}>{bid.time}</Text>
                </View>
              </View>
              <Text style={styles.bidAmount}>PKR {bid.amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* ── Place Your Bid ── */}
        <View style={[styles.bidCard, Shadows.soft]}>
          <Text style={styles.bidCardTitle}>
            {isUrdu ? 'اپنی بولی لگائیں' : 'Place Your Bid'}
          </Text>

          <View style={styles.bestBidInfo}>
            <Text style={styles.bestBidLabel}>
              {isUrdu ? 'بہترین بولی:' : 'Top bid:'}
            </Text>
            <Text style={styles.bestBidValue}>PKR {bestBid.toLocaleString()}</Text>
          </View>

          <View style={styles.bidInputRow}>
            <Text style={styles.bidInputPrefix}>PKR</Text>
            <TextInput
              style={styles.bidInput}
              keyboardType="number-pad"
              value={customBidAmount}
              onChangeText={setCustomBidAmount}
              placeholder={isUrdu ? 'مثلاً 65000' : 'e.g. 65000'}
              placeholderTextColor={Colors.mutedForeground}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.bidSubmitBtn,
              (!customBidAmount || parseInt(customBidAmount) <= 0) && styles.bidSubmitDisabled,
            ]}
            onPress={handleCustomBid}
            disabled={!customBidAmount || parseInt(customBidAmount) <= 0}
          >
            <Text style={styles.bidSubmitText}>
              {isUrdu ? 'بولی جمع کریں' : 'Submit Bid'}
              {customBidAmount && parseInt(customBidAmount) > 0
                ? ` — PKR ${parseInt(customBidAmount).toLocaleString()}`
                : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Fixed Bottom CTA ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomCTA}
          onPress={() => router.push('/trade/trade-101')}
          activeOpacity={0.85}
        >
          <MessageCircle size={18} color={Colors.white} />
          <Text style={styles.bottomCTAText}>
            {isUrdu ? 'بولی لگائیں' : 'Start Negotiation'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  // Gallery
  gallery: {
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: 220,
    borderRadius: Radius.xl,
  },
  imageDots: {
    position: 'absolute',
    bottom: Spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 20,
  },
  qualityTag: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  qualityTagText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  // Title Card
  titleCard: {
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  cropTitle: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.foreground,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  statsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    lineHeight: 20,
  },
  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  // Voice
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  voiceIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  voiceSub: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    marginTop: 1,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: Spacing.sm,
  },
  waveBar: {
    width: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    opacity: 0.8,
  },
  // Specs
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  specCell: {
    width: '47%',
    backgroundColor: Colors.muted,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 2,
  },
  specLabel: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  specValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.foreground,
  },
  // Farmer
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  farmerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  farmerAvatarText: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
  },
  farmerInfo: {
    flex: 1,
    gap: 2,
  },
  farmerName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.foreground,
  },
  reviewCount: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  farmerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryBg,
  },
  farmerBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.success,
  },
  farmerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.muted,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  farmerMetaItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  farmerMetaLabel: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  farmerMetaValue: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.foreground,
  },
  farmerMetaDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  contactRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
  },
  contactBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.foreground,
  },
  contactBtnPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    flex: 2,
  },
  contactBtnPrimaryText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  // Bids
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  bidRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  bidLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bidRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidRankText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.primary,
  },
  bidderName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  bidTime: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    marginTop: 1,
  },
  bidAmount: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primary,
  },
  // Bid Card
  bidCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    gap: Spacing.md,
  },
  bidCardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  bestBidInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestBidLabel: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  bestBidValue: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.primary,
  },
  bidInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  bidInputPrefix: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.mutedForeground,
    marginRight: Spacing.sm,
  },
  bidInput: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  bidSubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bidSubmitDisabled: {
    opacity: 0.45,
  },
  bidSubmitText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
    paddingBottom: 28,
  },
  bottomCTA: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  bottomCTAText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
