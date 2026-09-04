import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { Camera, ImagePlus, X, CheckCircle2, UploadCloud, Sparkles, Lightbulb } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { ListingImageItem } from '@/types/listingWizard';
import { Colors, Radius, FontSize, Spacing, Shadows } from '@/constants/theme';

interface PhotoUploadGridProps {
  images: ListingImageItem[];
  onAddImage: (uri: string) => void;
  onRemoveImage: (id: string) => void;
  onAddDemoPhotos?: () => void;
}

/**
 * 3-slot photo grid for listing photos.
 * Web: DOM file picker reading the image as a data URI.
 * Native: expo-image-picker camera roll / camera.
 */
export const PhotoUploadGrid: React.FC<PhotoUploadGridProps> = ({
  images,
  onAddImage,
  onRemoveImage,
  onAddDemoPhotos,
}) => {
  const pickImageWeb = () => {
    if (images.length >= 3) {
      Alert.alert('حد مکمل', 'آپ زیادہ سے زیادہ 3 تصاویر شامل کر سکتے ہیں۔');
      return;
    }

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input.onchange = (event: any) => {
          const file = event.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            reader.onload = (e: any) => {
              if (e.target?.result) {
                onAddImage(e.target.result as string);
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } catch (err) {
        console.warn('File picker error:', err);
      }
    }
  };

  const pickImageNative = async () => {
    if (images.length >= 3) {
      Alert.alert('حد مکمل', 'آپ زیادہ سے زیادہ 3 تصاویر شامل کر سکتے ہیں۔');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onAddImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handlePickImage = () => {
    if (Platform.OS === 'web') {
      pickImageWeb();
    } else {
      pickImageNative();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.title}>اپنی فصل یا کھیت کی تصاویر شامل کریں</Text>
        <Text style={styles.subtitle}>
          خریدار اصل تصاویر دیکھ کر زیادہ بھروسہ کرتے ہیں۔ کم از کم 1 تصویر درکار ہے۔
        </Text>
      </View>

      <View style={styles.grid}>
        {[0, 1, 2].map((idx) => {
          const item = images[idx];
          const slotTitles = ['مرکزی تصویر', 'تصویر 2', 'تصویر 3'];

          if (item) {
            return (
              <View key={item.id} style={[styles.photoBox, Shadows.soft]}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} resizeMode="cover" />
                <View style={styles.badgeSuccess}>
                  <CheckCircle2 size={12} color={Colors.white} />
                  <Text style={styles.badgeText}>{slotTitles[idx]}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => onRemoveImage(item.id)}
                  activeOpacity={0.8}
                >
                  <X size={14} color={Colors.white} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={`empty-${idx}`}
              style={styles.emptyBox}
              onPress={handlePickImage}
              activeOpacity={0.75}
            >
              <View style={styles.iconCircle}>
                {idx === 0 ? (
                  <Camera size={20} color={Colors.primary} />
                ) : (
                  <UploadCloud size={20} color={Colors.primary} />
                )}
              </View>
              <Text style={styles.addLabel}>{slotTitles[idx]}</Text>
              <Text style={styles.subText}>+ تصویر لگائیں</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Demo sample photos quick button */}
      {images.length === 0 && onAddDemoPhotos && (
        <TouchableOpacity
          style={styles.demoPhotosBtn}
          onPress={onAddDemoPhotos}
          activeOpacity={0.8}
        >
          <Sparkles size={16} color={Colors.primary} />
          <Text style={styles.demoPhotosText}>ڈیمو تصاویر لگائیں (Quick Sample Photos)</Text>
        </TouchableOpacity>
      )}

      {/* Pro tips card */}
      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Lightbulb size={16} color="#B45309" />
          <Text style={styles.tipsTitle}>بہترین نتائج کے لیے مشورے:</Text>
        </View>
        <Text style={styles.tip}>• دن کی کھلی روشنی میں تصویر لیں تاکہ دانہ واضح نظر آئے۔</Text>
        <Text style={styles.tip}>• فصل کے دانے یا گٹھے کو ہاتھ میں رکھ کر قریب سے دکھائیں۔</Text>
        <Text style={styles.tip}>• ایک تصویر مجموعی اسٹاک اور ایک قریبی منظر کی رکھیں۔</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  headerBox: {
    gap: 4,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  photoBox: {
    flex: 1,
    height: 130,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    backgroundColor: Colors.card,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  badgeSuccess: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(21, 128, 61, 0.88)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  emptyBox: {
    flex: 1,
    height: 130,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    gap: 4,
    padding: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  addLabel: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.foreground,
    textAlign: 'center',
  },
  subText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  demoPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  demoPhotosText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  tipsCard: {
    backgroundColor: '#FEF9C3',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FEF08A',
    gap: 6,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipsTitle: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: '#854D0E',
  },
  tip: {
    fontSize: FontSize.xs,
    color: '#713F12',
    lineHeight: 18,
  },
});
