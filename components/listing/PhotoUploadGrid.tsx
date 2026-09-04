import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { Camera, ImagePlus, X, CheckCircle2, UploadCloud } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { ListingImageItem } from '@/types/listingWizard';
import { Colors, Radius, FontSize, Spacing } from '@/constants/theme';

interface PhotoUploadGridProps {
  images: ListingImageItem[];
  onAddImage: (uri: string) => void;
  onRemoveImage: (id: string) => void;
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
      <Text style={styles.title}>اپنی فصل یا کھیت کی تصاویر شامل کریں</Text>
      <Text style={styles.subtitle}>
        اپنی ڈیوائس سے 3 تک تصاویر منتخب کریں (کم از کم 1 تصویر ضروری ہے)
      </Text>

      <View style={styles.grid}>
        {[0, 1, 2].map((idx) => {
          const item = images[idx];

          if (item) {
            return (
              <View key={item.id} style={styles.photoBox}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                <View style={styles.badgeSuccess}>
                  <CheckCircle2 size={14} color={Colors.white} />
                  <Text style={styles.badgeText}>تصویر {idx + 1}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => onRemoveImage(item.id)}
                >
                  <X size={14} color={Colors.white} />
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={`empty-${idx}`}
              style={styles.emptyBox}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>
                {idx === 0 ? (
                  <Camera size={22} color={Colors.primary} />
                ) : (
                  <UploadCloud size={22} color={Colors.primary} />
                )}
              </View>
              <Text style={styles.addLabel}>تصویر {idx + 1} شامل کریں</Text>
              <Text style={styles.subText}>منتخب کرنے کے لیے دبائیں</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>بہتر تصاویر کے لیے:</Text>
        <Text style={styles.tip}>• روشنی میں تصویر لیں</Text>
        <Text style={styles.tip}>• فصل کو قریب سے دکھائیں</Text>
        <Text style={styles.tip}>• مختلف زاویوں سے لیں</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  photoBox: {
    flex: 1,
    height: 120,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  badgeSuccess: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 81, 50, 0.9)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    flex: 1,
    height: 120,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    gap: Spacing.xs,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
  },
  subText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  tipsCard: {
    backgroundColor: Colors.secondary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  tipsTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  tip: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
});
