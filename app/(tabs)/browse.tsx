import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  MapPin,
  List,
  Grid2x2,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react-native';
import { CropCard } from '@/components/CropCard';
import { fetchListings } from '@/services/marketplace/listingService';
import { listingToCropCard, CropCardView } from '@/services/marketplace/listingAdapter';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useLanguage } from '@/services/i18n/languageContext';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';

export default function CropBrowser() {
  const router = useRouter();
  const { t, isUrdu } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [crops, setCrops] = useState<CropCardView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadListings = useCallback(async () => {
    try {
      setIsLoading(true);
      const listings = await fetchListings();
      setCrops(listings.map(listingToCropCard));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const categories = [
    { id: 'all', label: t('browse.allCategories'), count: 156 },
    { id: 'grains', label: t('browse.grains'), count: 89 },
    { id: 'vegetables', label: t('browse.vegetables'), count: 42 },
    { id: 'fruits', label: t('browse.fruits'), count: 25 },
  ];

  const locations = [
    { id: 'all', name: t('browse.allRegions') },
    { id: 'faisalabad', name: isUrdu ? 'فیصل آباد' : 'Faisalabad' },
    { id: 'lahore', name: isUrdu ? 'لاہور' : 'Lahore' },
    { id: 'multan', name: isUrdu ? 'ملتان' : 'Multan' },
    { id: 'sialkot', name: isUrdu ? 'سیالکوٹ' : 'Sialkot' },
  ];

  const filteredCrops = crops.filter((crop) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      crop.title.toLowerCase().includes(q) ||
      crop.farmerName.toLowerCase().includes(q) ||
      crop.quantity.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('browse.title')}</Text>
            <Text style={styles.subtitle}>
              {isLoading
                ? t('common.loading')
                : `${filteredCrops.length} ${t('browse.cropsFound')}`}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <LanguageSwitcherButton compact />
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid'
                ? <List size={18} color={Colors.foreground} />
                : <Grid2x2 size={18} color={Colors.foreground} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, showFilters && styles.iconBtnActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={18} color={showFilters ? Colors.primary : Colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={16} color={Colors.mutedForeground} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('browse.searchPlaceholder')}
              placeholderTextColor={Colors.mutedForeground}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={Colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Category Chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.label}
                </Text>
                <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
                  <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}>
                    {cat.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Location Filter ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.locRow}
        >
          {locations.map((loc) => {
            const active = selectedLocation === loc.id;
            return (
              <TouchableOpacity
                key={loc.id}
                onPress={() => setSelectedLocation(loc.id)}
                style={[styles.locChip, active && styles.locChipActive]}
              >
                <MapPin size={12} color={active ? Colors.primary : Colors.mutedForeground} />
                <Text style={[styles.locText, active && styles.locTextActive]}>
                  {loc.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Filters Panel ── */}
        {showFilters && (
          <View style={[styles.filterCard, Shadows.soft]}>
            <Text style={styles.filterTitle}>{t('browse.filters')}</Text>

            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>{t('browse.region')}</Text>
              <View style={styles.filterSelect}>
                <Text style={styles.filterSelectText}>
                  {locations.find((l) => l.id === selectedLocation)?.name}
                </Text>
                <ChevronDown size={14} color={Colors.mutedForeground} />
              </View>
            </View>

            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>{t('browse.priceRange')}</Text>
              <View style={styles.priceRange}>
                <TextInput
                  style={styles.priceInput}
                  placeholder={t('browse.minPrice')}
                  placeholderTextColor={Colors.mutedForeground}
                  keyboardType="number-pad"
                />
                <Text style={styles.priceSep}>—</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder={t('browse.maxPrice')}
                  placeholderTextColor={Colors.mutedForeground}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>{t('browse.applyFilters')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Crop Listings ── */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              {isUrdu ? 'لسٹنگز لوڈ ہو رہی ہیں...' : 'Loading crop listings...'}
            </Text>
          </View>
        ) : (
          <View style={styles.listings}>
            {filteredCrops.map((crop) => (
              <CropCard
                key={crop.id}
                {...crop}
                onViewDetails={() => {
                  const imgUri = typeof crop.image === 'object' && crop.image?.uri ? crop.image.uri : undefined;
                  router.push({
                    pathname: '/crop-details',
                    params: {
                      id: crop.id,
                      imageUri: imgUri,
                      title: crop.title,
                      price: String(crop.price),
                      quantity: crop.quantity,
                      location: crop.location,
                    },
                  });
                }}
                onPlayVoice={() => console.log('Play voice:', crop.id)}
              />
            ))}
            {filteredCrops.length === 0 && (
              <View style={styles.emptyBox}>
                <Search size={32} color={Colors.mutedForeground} />
                <Text style={styles.emptyText}>
                  {isUrdu ? 'کوئی نتیجہ نہیں' : 'No listings found'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Refresh ── */}
        <TouchableOpacity style={styles.refreshBtn} onPress={loadListings}>
          <Text style={styles.refreshText}>
            {isLoading ? t('common.loading') : t('browse.refresh')}
          </Text>
        </TouchableOpacity>
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
    gap: Spacing.lg,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: Colors.primaryBg,
  },
  // Search
  searchRow: {
    marginTop: -Spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.muted,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.foreground,
  },
  // Chips
  chipsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  chipTextActive: {
    color: Colors.white,
  },
  chipBadge: {
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  chipBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mutedForeground,
  },
  chipBadgeTextActive: {
    color: Colors.white,
  },
  // Location chips
  locRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
    marginTop: -Spacing.sm,
  },
  locChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  locText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  locTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  // Filter Panel
  filterCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  filterTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  filterField: {
    gap: Spacing.xs,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  filterSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.muted,
  },
  filterSelectText: {
    fontSize: FontSize.md,
    color: Colors.foreground,
  },
  priceRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.foreground,
    backgroundColor: Colors.muted,
  },
  priceSep: {
    color: Colors.mutedForeground,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  // Listings
  listings: {
    gap: Spacing.md,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.mutedForeground,
  },
  refreshBtn: {
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
});
