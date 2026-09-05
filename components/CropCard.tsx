import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, MapPin, Star, Volume2 } from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useLanguage } from '@/services/i18n/languageContext';

interface CropCardProps {
  id: string;
  title: string;
  price: number;
  currency?: string;
  quantity: string;
  location: string;
  timeAgo: string;
  rating?: number;
  image: any;
  farmerName: string;
  hasVoiceDescription?: boolean;
  isAvailable?: boolean;
  onViewDetails?: (id: string) => void;
  onPlayVoice?: (id: string) => void;
}

export const CropCard = ({
  id,
  title,
  price,
  currency = 'PKR',
  quantity,
  location,
  timeAgo,
  rating,
  image,
  farmerName,
  hasVoiceDescription = false,
  isAvailable = true,
  onViewDetails,
  onPlayVoice,
}: CropCardProps) => {
  const { isUrdu } = useLanguage();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onViewDetails?.(id)}
      style={[styles.card, Shadows.soft]}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode="cover" />

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: isAvailable ? Colors.success : Colors.error },
          ]}
        >
          <Text style={styles.statusText}>
            {isAvailable ? (isUrdu ? 'دستیاب' : 'Available') : (isUrdu ? 'فروخت' : 'Sold')}
          </Text>
        </View>

        {/* Voice Description Button */}
        {hasVoiceDescription && (
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={(e) => {
              e.stopPropagation();
              onPlayVoice?.(id);
            }}
          >
            <Volume2 size={16} color={Colors.white} />
          </TouchableOpacity>
        )}

        {/* Rating */}
        {rating && (
          <View style={styles.ratingBadge}>
            <Star size={12} color={Colors.warning} fill={Colors.warning} />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Title and Price */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.priceColumn}>
            <Text style={styles.price}>
              {currency} {price.toLocaleString()}
            </Text>
            <Text style={styles.quantity}>{quantity}</Text>
          </View>
        </View>

        {/* Farmer Info */}
        <View style={styles.farmerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{farmerName.charAt(0)}</Text>
          </View>
          <Text style={styles.farmerName}>{farmerName}</Text>
        </View>

        {/* Location and Time */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin size={12} color={Colors.mutedForeground} />
            <Text style={styles.metaText}>{location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={12} color={Colors.mutedForeground} />
            <Text style={styles.metaText}>{timeAgo}</Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={(e) => {
            e.stopPropagation();
            onViewDetails?.(id);
          }}
        >
          <Text style={styles.primaryButtonText}>
            {isUrdu ? 'بولی لگائیں' : 'Place Bid'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: Radius.lg,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  statusText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  voiceButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.md,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  ratingText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.foreground,
  },
  content: {
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
    marginRight: Spacing.sm,
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  quantity: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  farmerName: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.mutedForeground,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.foreground,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
});
