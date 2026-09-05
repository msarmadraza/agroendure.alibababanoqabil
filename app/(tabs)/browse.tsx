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
import { Search, MapPin, List, Grid2x2, SlidersHorizontal } from 'lucide-react-native';
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
    { id: 'all', name: t('browse.allCategories'), count: 156 },
    { id: 'grains', name: t('browse.grains'), count: 89 },
    { id: 'vegetables', name: t('browse.vegetables'), count: 42 },
    { id: 'fruits', name: t('browse.fruits'), count: 25 },
  ];

  const locations = [
    { id: 'all', name: t('browse.allRegions') },
    { id: 'faisalabad', name: isUrdu ? 'فیصل آباد' : 'Faisalabad' },
    { id: 'lahore', name: isUrdu ? 'لاہور' : 'Lahore' },
    { id: 'multan', name: isUrdu ? 'ملتان' : 'Multan' },
    { id: 'sialkot', name: isUrdu ? 'سیالکوٹ' : 'Sialkot' },
  ];

  // Live search filter over fetched listings (DB + locally created + demo)
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('browse.title')}</Text>
          <View style={styles.headerActions}>
            <LanguageSwitcherButton compact />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? (
                <List size={20} color={Colors.foreground} />
              ) : (
                <Grid2x2 size={20} color={Colors.foreground} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={20} color={Colors.foreground} />
              {showFilters && <View style={styles.filterDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('browse.searchPlaceholder')}
            placeholderTextColor={Colors.mutedForeground}
          />
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={[
                styles.categoryPill,
                {
                  backgroundColor:
                    selectedCategory === category.id ? Colors.primary : Colors.accent,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color:
                      selectedCategory === category.id
                        ? Colors.primaryForeground
                        : Colors.foreground,
                  },
                ]}
              >
                {category.name} ({category.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filters Panel */}
        {showFilters && (
          <View style={[styles.card, Shadows.soft]}>
            <Text style={styles.filterTitle}>{t('browse.filters')}</Text>

            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>{t('browse.region')}</Text>
              <View style={styles.select}>
                <Text style={styles.selectText}>
                  {locations.find((l) => l.id === selectedLocation)?.name}
                </Text>
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
                <Text style={styles.priceSeparator}>{t('browse.priceTo')}</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder={t('browse.maxPrice')}
                  placeholderTextColor={Colors.mutedForeground}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.applyButton}>
              <Text style={styles.applyButtonText}>{t('browse.applyFilters')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {isLoading ? t('common.loading') : `${filteredCrops.length} ${t('browse.cropsFound')}`}
          </Text>
          <View style={styles.nearby}>
            <MapPin size={14} color={Colors.mutedForeground} />
            <Text style={styles.nearbyText}>{t('browse.nearYou')}</Text>
          </View>
        </View>

        {/* Crops List */}
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
                onViewDetails={() => router.push('/crop-details')}
                onPlayVoice={() => console.log('Play voice:', crop.id)}
              />
            ))}
          </View>
        )}

        {/* Load More / Refresh */}
        <TouchableOpacity style={styles.loadMore} onPress={loadListings}>
          <Text style={styles.loadMoreText}>
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
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.foreground,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.foreground,
  },
  categories: {
    gap: Spacing.md,
    paddingBottom: Spacing.md,
  },
  categoryPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  categoryText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  filterTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  filterField: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  select: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.card,
  },
  selectText: {
    fontSize: FontSize.md,
    color: Colors.foreground,
  },
  priceRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.foreground,
    backgroundColor: Colors.card,
  },
  priceSeparator: {
    color: Colors.mutedForeground,
    fontSize: FontSize.sm,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultsText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  nearby: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  nearbyText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  listings: {
    gap: Spacing.lg,
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
  loadMore: {
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  loadMoreText: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.foreground,
  },
});
