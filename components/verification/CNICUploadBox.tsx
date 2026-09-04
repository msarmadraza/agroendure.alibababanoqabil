import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Camera, UploadCloud, ShieldCheck, RefreshCw, CheckCircle2, CreditCard } from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';

interface CNICUploadBoxProps {
  imageUri: string | null;
  onSelectImage: (base64OrUri: string) => void;
  onClearImage: () => void;
}

export const CNICUploadBox: React.FC<CNICUploadBoxProps> = ({
  imageUri,
  onSelectImage,
  onClearImage,
}) => {
  const handleOpenFilePicker = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
          const file = event.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              if (e.target?.result) {
                onSelectImage(e.target.result as string);
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } catch (err) {
        console.warn('CNIC file picker error:', err);
      }
    } else {
      // Fallback sample CNIC front image for demo
      onSelectImage('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&q=80');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.guidanceBox}>
        <View style={styles.guidanceIconWrapper}>
          <ShieldCheck size={18} color={Colors.primary} />
        </View>
        <Text style={styles.guidanceText}>
          شناختی کارڈ واضح اور سیدھا رکھیں۔ چاروں کونے نظر آنے چاہییں۔
          {'\n'}
          <Text style={styles.guidanceSub}>Make sure CNIC is well-lit, not blurry, and fully visible.</Text>
        </Text>
      </View>

      {imageUri ? (
        <View style={styles.previewContainer}>
          <View style={styles.imageCard}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            <View style={styles.verifiedChip}>
              <CheckCircle2 size={15} color={Colors.white} />
              <Text style={styles.verifiedChipText}>تصویر منتخب ہو گئی</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.retakeBtn} onPress={onClearImage} activeOpacity={0.8}>
            <RefreshCw size={15} color={Colors.primary} />
            <Text style={styles.retakeText}>تبدیل کریں / Choose Different Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploadArea}>
          <View style={styles.cardHeaderStrip}>
            <CreditCard size={18} color={Colors.primary} />
            <Text style={styles.cardHeaderStripText}>PAKISTAN NATIONAL IDENTITY CARD</Text>
          </View>

          <View style={styles.cardCenter}>
            <Text style={styles.uploadTitle}>Pakistani CNIC (Front Side)</Text>
            <Text style={styles.uploadSub}>پاکستانی شناختی کارڈ (سامنے والا حصہ)</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.primaryActionBtn} onPress={handleOpenFilePicker} activeOpacity={0.85}>
              <Camera size={20} color={Colors.white} />
              <Text style={styles.primaryActionBtnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleOpenFilePicker} activeOpacity={0.85}>
              <UploadCloud size={20} color={Colors.foreground} />
              <Text style={styles.secondaryActionBtnText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
    gap: Spacing.md,
  },
  guidanceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryBg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  guidanceIconWrapper: {
    paddingTop: 2,
  },
  guidanceText: {
    flex: 1,
    fontSize: FontSize.xs + 1,
    color: Colors.foreground,
    lineHeight: 18,
    fontWeight: '600',
  },
  guidanceSub: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    fontWeight: '400',
  },
  uploadArea: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    backgroundColor: '#FAFDFB',
    gap: Spacing.md,
  },
  cardHeaderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeaderStripText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 0.6,
  },
  cardCenter: {
    alignItems: 'center',
    gap: 4,
  },
  uploadTitle: {
    fontSize: FontSize.md + 1,
    fontWeight: '700',
    color: Colors.foreground,
  },
  uploadSub: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    width: '100%',
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.xs + 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm + 1,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.xs + 2,
  },
  secondaryActionBtnText: {
    color: Colors.foreground,
    fontSize: FontSize.sm + 1,
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  imageCard: {
    width: '100%',
    height: 190,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.muted,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  verifiedChip: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  verifiedChipText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryBg,
  },
  retakeText: {
    fontSize: FontSize.xs + 1,
    fontWeight: '700',
    color: Colors.primary,
  },
});
