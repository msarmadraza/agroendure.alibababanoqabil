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
} from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';

export default function CropDetails() {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [customBidAmount, setCustomBidAmount] = useState('');

  const cropData = {
    id: '1',
    title: 'اعلیٰ کوالٹی گندم',
    price: 85000,
    quantity: '50 من',
    location: 'فیصل آباد، پنجاب',
    harvestDate: '15 اپریل 2024',
    quality: 'پریمیم',
    variety: 'پنجاب 2011',
    moisture: '12%',
    farmer: {
      name: 'احمد علی',
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
    description:
      'یہ بہترین کوالٹی کا گندم ہے۔ بالکل صاف اور خشک، کوئی کیڑا نہیں۔ فوری ڈیلیوری کے لیے دستیاب۔',
    voiceDescription: true,
    currentBids: [
      { bidder: 'علی حسن', amount: 83000, time: '2 گھنٹے پہلے' },
      { bidder: 'محمد کریم', amount: 81000, time: '4 گھنٹے پہلے' },
    ],
    specifications: [
      { label: 'نمی', value: '12%' },
      { label: 'پیداوار', value: '45 من فی ایکڑ' },
      { label: 'دانے کا سائز', value: 'متوسط' },
      { label: 'رنگ', value: 'سنہری' },
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>فصل کی تفصیلات</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <View style={styles.gallery}>
          <Image
            source={cropData.images[currentImageIndex]}
            style={styles.galleryImage}
            resizeMode="cover"
          />

          <View style={styles.indicators}>
            {cropData.images.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentImageIndex(index)}
                style={[
                  styles.indicator,
                  {
                    backgroundColor:
                      index === currentImageIndex
                        ? Colors.white
                        : 'rgba(255,255,255,0.5)',
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.qualityBadge}>
            <Text style={styles.qualityText}>{cropData.quality}</Text>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{cropData.title}</Text>
            <View style={styles.priceColumn}>
              <Text style={styles.price}>
                ₨{cropData.price.toLocaleString()}
              </Text>
              <Text style={styles.priceUnit}>فی من</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={14} color={Colors.mutedForeground} />
              <Text style={styles.metaText}>{cropData.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={14} color={Colors.mutedForeground} />
              <Text style={styles.metaText}>{cropData.harvestDate}</Text>
            </View>
          </View>

          <Text style={styles.quantity}>مقدار: {cropData.quantity}</Text>
        </View>

        {/* Voice Description */}
        {cropData.voiceDescription && (
          <View style={styles.voiceBox}>
            <View style={styles.voiceHeader}>
              <View style={styles.voiceTitleRow}>
                <Volume2 size={20} color={Colors.primary} />
                <Text style={styles.voiceTitle}>آواز میں تفصیل</Text>
              </View>
              <TouchableOpacity onPress={handlePlayVoice} style={styles.playButton}>
                {isPlayingVoice ? (
                  <Pause size={16} color={Colors.primary} />
                ) : (
                  <Play size={16} color={Colors.primary} />
                )}
                <Text style={styles.playText}>
                  {isPlayingVoice ? 'رک جائیں' : 'سنیں'}
                </Text>
              </TouchableOpacity>
            </View>

            {isPlayingVoice && (
              <View style={styles.playingIndicator}>
                <View style={styles.waveform}>
                  {[...Array(8)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        { height: 10 + Math.random() * 20 },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.playingText}>چل رہا ہے...</Text>
              </View>
            )}
          </View>
        )}

        {/* Specifications */}
        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.cardTitle}>تفصیلات</Text>
          <View style={styles.specGrid}>
            {cropData.specifications.map((spec, index) => (
              <View key={index} style={styles.specRow}>
                <Text style={styles.specLabel}>{spec.label}:</Text>
                <Text style={styles.specValue}>{spec.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Farmer Info */}
        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.cardTitle}>کسان کی معلومات</Text>
          <View style={styles.farmerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {cropData.farmer.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.farmerInfo}>
              <Text style={styles.farmerName}>{cropData.farmer.name}</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color={Colors.warning} fill={Colors.warning} />
                <Text style={styles.ratingText}>{cropData.farmer.rating}</Text>
                <Text style={styles.reviewText}>
                  ({cropData.farmer.totalReviews} ریویوز)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.farmerStats}>
            <View style={styles.farmerStat}>
              <Text style={styles.farmerStatLabel}>ممبر:</Text>
              <Text style={styles.farmerStatValue}>
                {cropData.farmer.memberSince} سے
              </Text>
            </View>
            <View style={styles.farmerStat}>
              <Text style={styles.farmerStatLabel}>فروخت:</Text>
              <Text style={styles.farmerStatValue}>
                {cropData.farmer.completedSales}
              </Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactButton}>
              <Phone size={16} color={Colors.foreground} />
              <Text style={styles.contactButtonText}>کال کریں</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => router.push('/trade/trade-101')}
            >
              <MessageCircle size={16} color={Colors.primary} />
              <Text style={[styles.contactButtonText, { color: Colors.primary }]}>پیغام / چیٹ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Bids */}
        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.cardTitle}>موجودہ بولیاں</Text>
          <View style={styles.bidList}>
            {cropData.currentBids.map((bid, index) => (
              <View key={index} style={styles.bidRow}>
                <View>
                  <Text style={styles.bidderName}>{bid.bidder}</Text>
                  <Text style={styles.bidTime}>{bid.time}</Text>
                </View>
                <Text style={styles.bidAmount}>
                  ₨{bid.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Make Your Bid Section */}
        <View style={styles.bidSection}>
          <Text style={styles.bidSectionTitle}>اپنی بولی لگائیں</Text>

          <Text style={styles.inputLabel}>آپ کی بولی (PKR فی من)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>₨</Text>
            <TextInput
              style={styles.bidInput}
              keyboardType="number-pad"
              value={customBidAmount}
              onChangeText={setCustomBidAmount}
              placeholder="جیسے 65000"
              placeholderTextColor={Colors.mutedForeground}
            />
          </View>

          <View style={styles.bestBidRow}>
            <Text style={styles.bestBidLabel}>موجودہ بہترین بولی:</Text>
            <Text style={styles.bestBidValue}>
              ₨
              {Math.max(
                ...cropData.currentBids.map((b) => b.amount)
              ).toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.bidButton,
              (!customBidAmount || parseInt(customBidAmount) <= 0) &&
                styles.disabledButton,
            ]}
            onPress={handleCustomBid}
            disabled={!customBidAmount || parseInt(customBidAmount) <= 0}
          >
            <Text style={styles.bidButtonText}>
              ₨{customBidAmount ? parseInt(customBidAmount).toLocaleString() : '0'}{' '}
              میں بولی لگائیں
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action - Single Button: بولی لگائیں */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.singleBottomButton}
          onPress={() => router.push('/trade/trade-101')}
          activeOpacity={0.85}
        >
          <Text style={styles.singleBottomButtonText}>بولی لگائیں</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  gallery: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  galleryImage: {
    width: '100%',
    height: 240,
    borderRadius: Radius.xl,
  },
  indicators: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  qualityBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  qualityText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.foreground,
    marginRight: Spacing.sm,
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  quantity: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.foreground,
  },
  voiceBox: {
    backgroundColor: Colors.gradientVoiceEnd,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  voiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  voiceTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  playText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  playingText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  specRow: {
    width: '47%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specLabel: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  specValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  ratingText: {
    fontSize: FontSize.sm,
    color: Colors.foreground,
  },
  reviewText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  farmerStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  farmerStat: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  farmerStatLabel: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  farmerStatValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  contactRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
  },
  contactButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  bidList: {
    gap: Spacing.md,
  },
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidderName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
  bidTime: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
  },
  bidAmount: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  bidSection: {
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  bidSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  inputPrefix: {
    color: Colors.mutedForeground,
    fontSize: FontSize.md,
    marginRight: Spacing.xs,
  },
  bidInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.foreground,
  },
  bestBidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  bestBidLabel: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  bestBidValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  bidButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  bidButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  bottomSecondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
  },
  bottomSecondaryText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
  bottomPrimaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  bottomPrimaryText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  singleBottomButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleBottomButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
