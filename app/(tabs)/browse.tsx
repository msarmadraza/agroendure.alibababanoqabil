import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Search, X, SlidersHorizontal, RotateCcw, MapPin, ArrowUpDown } from 'lucide-react-native';
import { CropCard } from '@/components/CropCard';
import { fetchListings } from '@/services/marketplace/listingService';
import { listingToCropCard, CropCardView } from '@/services/marketplace/listingAdapter';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useLanguage } from '@/services/i18n/languageContext';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';

export default function CropBrowser() {
  const router = useRouter();
  const { t, isUrdu } = useLanguage();

  // Search & Category
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter Section State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  // Data State
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

  // Main Category Filters
  const categories = [
    { id: 'all', label: isUrdu ? 'تمام فصلیں' : 'All Crops' },
    { id: 'wheat', label: isUrdu ? 'گندم' : 'Wheat' },
    { id: 'rice', label: isUrdu ? 'چاول' : 'Rice' },
    { id: 'cotton', label: isUrdu ? 'کپاس' : 'Cotton' },
    { id: 'sugarcane', label: isUrdu ? 'گنا' : 'Sugarcane' },
    { id: 'corn', label: isUrdu ? 'مکئی' : 'Corn' },
  ];

  // Regions for Filter Section
  const regions = [
    { id: 'all', label: isUrdu ? 'تمام علاقے' : 'All Regions' },
    { id: 'faisalabad', label: isUrdu ? 'فیصل آباد' : 'Faisalabad' },
    { id: 'lahore', label: isUrdu ? 'لاہور' : 'Lahore' },
    { id: 'multan', label: isUrdu ? 'ملتان' : 'Multan' },
    { id: 'gujranwala', label: isUrdu ? 'گوجرانوالہ' : 'Gujranwala' },
    { id: 'sialkot', label: isUrdu ? 'سیالکوٹ' : 'Sialkot' },
    { id: 'rahim_yar_khan', label: isUrdu ? 'رحیم یار خان' : 'Rahim Yar Khan' },
  ];

  // Active custom filters count (in the filter section)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedRegion !== 'all') count += 1;
    if (minPrice.trim() !== '') count += 1;
    if (maxPrice.trim() !== '') count += 1;
    if (sortBy !== 'newest') count += 1;
    return count;
  }, [selectedRegion, minPrice, maxPrice, sortBy]);

  const resetFilters = () => {
    setSelectedRegion('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  const filteredCrops = useMemo(() => {
    let result = crops.filter((crop) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matches =
          crop.title.toLowerCase().includes(q) ||
          crop.farmerName.toLowerCase().includes(q) ||
          crop.location.toLowerCase().includes(q) ||
          crop.quantity.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all') {
        const tLower = crop.title.toLowerCase();
        if (selectedCategory === 'wheat' && !tLower.includes('گندم') && !tLower.includes('wheat')) return false;
        if (selectedCategory === 'rice' && !tLower.includes('چاول') && !tLower.includes('rice') && !tLower.includes('basmati')) return false;
        if (selectedCategory === 'cotton' && !tLower.includes('کپاس') && !tLower.includes('cotton')) return false;
        if (selectedCategory === 'sugarcane' && !tLower.includes('گنا') && !tLower.includes('sugarcane')) return false;
        if (selectedCategory === 'corn' && !tLower.includes('مکئی') && !tLower.includes('corn') && !tLower.includes('maize')) return false;
      }

      // 3. Region Filter
      if (selectedRegion !== 'all') {
        const locLower = (crop.location + ' ' + crop.title).toLowerCase();
        if (selectedRegion === 'faisalabad' && !locLower.includes('faisalabad') && !locLower.includes('فیصل آباد')) return false;
        if (selectedRegion === 'lahore' && !locLower.includes('lahore') && !locLower.includes('لاہور')) return false;
        if (selectedRegion === 'multan' && !locLower.includes('multan') && !locLower.includes('ملتان')) return false;
        if (selectedRegion === 'gujranwala' && !locLower.includes('gujranwala') && !locLower.includes('گوجرانوالہ') && !locLower.includes('گجرانوالہ')) return false;
        if (selectedRegion === 'sialkot' && !locLower.includes('sialkot') && !locLower.includes('سیالکوٹ')) return false;
        if (selectedRegion === 'rahim_yar_khan' && !locLower.includes('rahim') && !locLower.includes('رحیم یار خان')) return false;
      }

      // 4. Price Range
      const min = parseFloat(minPrice);
      if (!isNaN(min) && crop.price < min) return false;

      const max = parseFloat(maxPrice);
      if (!isNaN(max) && crop.price > max) return false;

      return true;
    });

    // 5. Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [crops, searchQuery, selectedCategory, selectedRegion, minPrice, maxPrice, sortBy]);

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
            {/* Filter Toggle Button */}
            <TouchableOpacity
              style={[
                styles.filterToggleBtn,
                (showFilters || activeFiltersCount > 0) && styles.filterToggleBtnActive,
              ]}
              onPress={() => setShowFilters((prev) => !prev)}
              activeOpacity={0.8}
            >
              <SlidersHorizontal
                size={18}
                color={showFilters || activeFiltersCount > 0 ? Colors.primary : Colors.foreground}
              />
              {activeFiltersCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color={Colors.mutedForeground} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('browse.searchPlaceholder')}
              placeholderTextColor={Colors.mutedForeground}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color={Colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Single Category Filter Bar (No Collisions) ── */}
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
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Filter Section Panel (Expandable) ── */}
        {showFilters && (
          <View style={[styles.filterCard, Shadows.soft]}>
            <View style={styles.filterCardHeader}>
              <View style={styles.filterHeaderLeft}>
                <SlidersHorizontal size={16} color={Colors.primary} />
                <Text style={styles.filterCardTitle}>
                  {isUrdu ? 'فلٹرز' : 'Filters'}
                </Text>
                {activeFiltersCount > 0 && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>
                      {activeFiltersCount} {isUrdu ? 'منتخب' : 'active'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.filterHeaderActions}>
                {activeFiltersCount > 0 && (
                  <TouchableOpacity
                    style={styles.resetTextBtn}
                    onPress={resetFilters}
                  >
                    <RotateCcw size={12} color={Colors.mutedForeground} />
                    <Text style={styles.resetText}>
                      {isUrdu ? 'صاف کریں' : 'Reset'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeFilterBtn}
                  onPress={() => setShowFilters(false)}
                >
                  <X size={18} color={Colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Region / Location Filter */}
            <View style={styles.filterGroup}>
              <View style={styles.groupHeader}>
                <MapPin size={14} color={Colors.primary} />
                <Text style={styles.filterGroupLabel}>
                  {isUrdu ? 'علاقہ منتخب کریں' : 'Select Region'}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterOptionPills}
              >
                {regions.map((reg) => {
                  const active = selectedRegion === reg.id;
                  return (
                    <TouchableOpacity
                      key={reg.id}
                      style={[styles.filterPill, active && styles.filterPillActive]}
                      onPress={() => setSelectedRegion(reg.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                        {reg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>
                {isUrdu ? 'قیمت کی حد (روپے)' : 'Price Range (PKR)'}
              </Text>
              <View style={styles.priceRow}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.pricePrefix}>Min</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={minPrice}
                    onChangeText={setMinPrice}
                    placeholder="10,000"
                    placeholderTextColor={Colors.mutedForeground}
                    keyboardType="number-pad"
                  />
                </View>
                <Text style={styles.priceDivider}>—</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.pricePrefix}>Max</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    placeholder="100,000"
                    placeholderTextColor={Colors.mutedForeground}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            {/* Sorting */}
            <View style={styles.filterGroup}>
              <View style={styles.groupHeader}>
                <ArrowUpDown size={14} color={Colors.primary} />
                <Text style={styles.filterGroupLabel}>
                  {isUrdu ? 'ترتیب دیں' : 'Sort By'}
                </Text>
              </View>
              <View style={styles.sortRow}>
                <TouchableOpacity
                  style={[styles.sortPill, sortBy === 'newest' && styles.sortPillActive]}
                  onPress={() => setSortBy('newest')}
                >
                  <Text style={[styles.sortPillText, sortBy === 'newest' && styles.sortPillTextActive]}>
                    {isUrdu ? 'تازہ ترین' : 'Newest'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortPill, sortBy === 'price_asc' && styles.sortPillActive]}
                  onPress={() => setSortBy('price_asc')}
                >
                  <Text style={[styles.sortPillText, sortBy === 'price_asc' && styles.sortPillTextActive]}>
                    {isUrdu ? 'قیمت: کم سے زیادہ' : 'Price: Low to High'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortPill, sortBy === 'price_desc' && styles.sortPillActive]}
                  onPress={() => setSortBy('price_desc')}
                >
                  <Text style={[styles.sortPillText, sortBy === 'price_desc' && styles.sortPillTextActive]}>
                    {isUrdu ? 'قیمت: زیادہ سے کم' : 'Price: High to Low'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Apply Action */}
            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => setShowFilters(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.applyFilterBtnText}>
                {isUrdu ? 'فلٹر لاگو کریں' : 'Apply Filters'}
                {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </Text>
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
                  {isUrdu ? 'کوئی نتیجہ نہیں ملا' : 'No listings found'}
                </Text>
                {activeFiltersCount > 0 && (
                  <TouchableOpacity style={styles.clearBtnInline} onPress={resetFilters}>
                    <Text style={styles.clearBtnInlineText}>
                      {isUrdu ? 'تمام فلٹرز ختم کریں' : 'Clear All Filters'}
                    </Text>
                  </TouchableOpacity>
                )}
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
    gap: Spacing.md,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
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
  },
  filterToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  filterToggleBtnActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  // Search
  searchRow: {
    marginBottom: 2,
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
  // Clean Single Chips Row (Zero Collision)
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
    paddingRight: Spacing.lg,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '700',
  },
  // Filter Section Panel
  filterCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  filterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  filterCardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  activeTag: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  filterHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  resetTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    fontWeight: '600',
  },
  closeFilterBtn: {
    padding: 4,
  },
  filterGroup: {
    gap: Spacing.xs,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterGroupLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  filterOptionPills: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  // Price Range
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priceInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.muted,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
  },
  pricePrefix: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.mutedForeground,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    height: 40,
    fontSize: FontSize.sm,
    color: Colors.foreground,
  },
  priceDivider: {
    fontSize: FontSize.md,
    color: Colors.mutedForeground,
  },
  // Sort
  sortRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sortPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortPillActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedForeground,
  },
  sortPillTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  // Apply Button
  applyFilterBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  applyFilterBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  // Listings
  listings: {
    gap: Spacing.lg,
    marginTop: Spacing.xs,
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
  clearBtnInline: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryBg,
  },
  clearBtnInlineText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  refreshBtn: {
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  refreshText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
});

