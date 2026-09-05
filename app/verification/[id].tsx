import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ShieldCheck,
  CheckCircle2,
  ScanFace,
  Camera,
  UploadCloud,
  RefreshCw,
  Lock,
  ArrowLeft,
  Sparkles,
} from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { useOnboarding } from '@/services/auth/onboardingContext';
import { verifyUserForTrade } from '@/services/verification/faceVerificationService';

export default function FaceVerificationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tradeId = id || 'trade-101';

  const { activeUser, activeRole } = useDemoAuth();
  const { data: onboardingData } = useOnboarding();

  // If user already took a selfie during account onboarding, preload it, otherwise start empty
  const [facePhotoUri, setFacePhotoUri] = useState<string | null>(
    onboardingData?.facePhotoUri || activeUser?.avatar_url || null
  );
  const [scanning, setScanning] = useState(false);
  const [stepText, setStepText] = useState('چہرہ فریم کے اندر سیدھا رکھیں • Position face inside frame');
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const userId = activeUser?.id || 'demo-user-uuid';
  const userName = activeUser?.full_name || 'کسان / خریدار';

  const handleTakeSelfie = async () => {
    try {
      setErrorMessage(null);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setFacePhotoUri(result.assets[0].uri);
      }
    } catch {
      handleChooseSelfieFromGallery();
    }
  };

  const handleChooseSelfieFromGallery = async () => {
    try {
      setErrorMessage(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setFacePhotoUri(result.assets[0].uri);
      }
    } catch {
      // User cancelled
    }
  };

  const handleConfirmAndVerify = async () => {
    if (!facePhotoUri) {
      Alert.alert('تصویر درکار ہے', 'براہ کرم پہلے کیمرے یا گیلری سے اپنی سیلفی لیں۔');
      return;
    }

    try {
      setScanning(true);
      setErrorMessage(null);
      setStepText('چہرے کا تجزیہ اور لائیو نیس جانچ جاری ہے...');

      // Connect with Supabase: uploads to Supabase storage, updates profile & confirms trade
      const result = await verifyUserForTrade(
        userId,
        tradeId,
        facePhotoUri,
        activeRole || 'buyer'
      );

      if (result.success) {
        setSuccess(true);
        setStepText('بائیو میٹرک شناخت کامیابی سے تصدیق ہو گئی! ✓');

        setTimeout(() => {
          router.replace({
            pathname: `/agreement/${tradeId}`,
            params: { faceVerified: 'true' },
          } as any);
        }, 1200);
      } else {
        setErrorMessage('چہرہ میچ نہیں ہو سکا۔ براہ کرم دوبارہ واضح تصویر لیں۔');
      }
    } catch (err: any) {
      console.warn('Face verification error:', err);
      setErrorMessage('Supabase تصدیق میں عارضی مسئلہ آیا۔ براہ کرم دوبارہ کوشش کریں۔');
    } finally {
      setScanning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerIconCircle}>
            <ScanFace size={30} color={Colors.primary} />
          </View>
          <Text style={styles.title}>بائیو میٹرک فیس ویری فکیشن</Text>
          <Text style={styles.subtitleEng}>Biometric Face & Identity Verification</Text>
          <Text style={styles.subtitleUrdu}>
            معاہدے کی حتمی ڈیجیٹل توثیق اور سیکیورٹی کے لیے چہرے کی لائیو تصدیق لازمی ہے۔
          </Text>

          {/* Trade Info Badge */}
          <View style={styles.tradeBadge}>
            <Sparkles size={13} color={Colors.primary} />
            <Text style={styles.tradeBadgeText}>
              معاہدہ #{tradeId} • {userName} ({activeRole === 'seller' ? 'بیچنے والا' : 'خریدار'})
            </Text>
          </View>
        </View>

        {/* Biometric Viewfinder Portal */}
        {facePhotoUri ? (
          <View style={styles.facePreview}>
            <View style={styles.facePreviewWrapper}>
              <Image source={{ uri: facePhotoUri }} style={styles.faceImage} />
              <View style={styles.faceVerifiedBadge}>
                <CheckCircle2 size={16} color={Colors.white} />
                <Text style={styles.faceVerifiedBadgeText}>تصویر تیار ہے • Photo Ready</Text>
              </View>
            </View>

            {scanning ? (
              <View style={[styles.processingCard, Shadows.soft]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.processingTitle}>Supabase سے چہرے کی تصدیق ہو رہی ہے...</Text>
                <Text style={styles.processingSub}>Uploading to secure Supabase storage & verifying identity</Text>
              </View>
            ) : success ? (
              <View style={[styles.successCard, Shadows.soft]}>
                <CheckCircle2 size={42} color={Colors.success} />
                <Text style={styles.successTitle}>بائیو میٹرک تصدیق کامیاب! 🎉</Text>
                <Text style={styles.successSub}>معاہدے کی ڈیجیٹل توثیق مکمل ہو گئی ہے۔ منتقل کیا جا رہا ہے...</Text>
              </View>
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.flexBtn]}
                  onPress={() => setFacePhotoUri(null)}
                  activeOpacity={0.85}
                >
                  <RefreshCw size={18} color={Colors.foreground} />
                  <Text style={styles.secondaryButtonText}>دوبارہ لیں • Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, styles.flexBtn]}
                  onPress={handleConfirmAndVerify}
                  activeOpacity={0.88}
                >
                  <CheckCircle2 size={18} color={Colors.white} strokeWidth={2.5} />
                  <Text style={styles.primaryButtonText}>تصدیق اور معاہدہ مکمل کریں</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.faceCaptureContainer}>
            {/* Viewfinder Frame with corner brackets */}
            <View style={styles.biometricPortal}>
              <View style={styles.biometricOuterRing}>
                <View style={styles.biometricInnerRing}>
                  <ScanFace size={58} color={Colors.primary} />
                  <View style={styles.bracketTL} />
                  <View style={styles.bracketTR} />
                  <View style={styles.bracketBL} />
                  <View style={styles.bracketBR} />
                </View>
              </View>

              <View style={styles.biometricStatusPill}>
                <View style={styles.pulseDot} />
                <Text style={styles.biometricStatusText}>{stepText}</Text>
              </View>
            </View>

            {/* Guidance Chips */}
            <View style={styles.guidanceChipsRow}>
              <View style={styles.guidanceChip}>
                <Text style={styles.guidanceChipText}>☀️ مناسب روشنی</Text>
              </View>
              <View style={styles.guidanceChip}>
                <Text style={styles.guidanceChipText}>👓 عینک اتار لیں</Text>
              </View>
              <View style={styles.guidanceChip}>
                <Text style={styles.guidanceChipText}>👤 سامنے دیکھیں</Text>
              </View>
            </View>

            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Action Buttons: Take Selfie or Choose from Gallery */}
            <View style={styles.selfieButtonStack}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleTakeSelfie}
                activeOpacity={0.88}
              >
                <Camera size={22} color={Colors.white} />
                <Text style={styles.primaryButtonText}>کیمرہ کھولیں اور سیلفی لیں • Take Selfie</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineUploadButton}
                onPress={handleChooseSelfieFromGallery}
                activeOpacity={0.85}
              >
                <UploadCloud size={20} color={Colors.primary} />
                <Text style={styles.outlineUploadButtonText}>گیلری سے تصویر منتخب کریں • Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer & Cancel */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color={Colors.mutedForeground} />
            <Text style={styles.cancelText}>واپس معاہدے پر جائیں (Cancel & Return)</Text>
          </TouchableOpacity>

          <View style={styles.footerNote}>
            <Lock size={14} color={Colors.mutedForeground} />
            <Text style={styles.footerText}>
              256-bit انکرپٹڈ • بائیو میٹرک ڈیٹا Supabase کلاؤڈ پر مکمل محفوظ ہے
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 40,
    gap: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  headerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.foreground,
    letterSpacing: -0.3,
  },
  subtitleEng: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  subtitleUrdu: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 2,
    paddingHorizontal: Spacing.sm,
  },
  tradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 4,
  },
  tradeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Biometric Viewfinder Portal
  faceCaptureContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
    width: '100%',
  },
  biometricPortal: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  biometricOuterRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  biometricInnerRing: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bracketTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
    borderTopLeftRadius: 6,
  },
  bracketTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
    borderTopRightRadius: 6,
  },
  bracketBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
    borderBottomLeftRadius: 6,
  },
  bracketBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  biometricStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: -14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  biometricStatusText: {
    fontSize: FontSize.xs + 1,
    fontWeight: '700',
    color: Colors.foreground,
  },
  guidanceChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  guidanceChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guidanceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedForeground,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Captured Face Preview
  facePreview: {
    alignItems: 'center',
    gap: Spacing.lg,
    width: '100%',
  },
  facePreviewWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  faceImage: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  faceVerifiedBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  faceVerifiedBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    maxWidth: 420,
    marginTop: Spacing.xs,
  },
  flexBtn: {
    flex: 1,
  },

  // Processing & Success cards
  processingCard: {
    backgroundColor: Colors.card,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    gap: Spacing.xs,
    width: '100%',
    maxWidth: 420,
  },
  processingTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.foreground,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  processingSub: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: Colors.card,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    gap: Spacing.xs,
    width: '100%',
    maxWidth: 420,
  },
  successTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.success,
    textAlign: 'center',
  },
  successSub: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Buttons
  selfieButtonStack: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: Spacing.sm,
  },
  primaryButton: {
    width: '100%',
    minHeight: 50,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    paddingHorizontal: Spacing.md,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  outlineUploadButton: {
    width: '100%',
    minHeight: 50,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
  },
  outlineUploadButtonText: {
    color: Colors.foreground,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 50,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
  },
  secondaryButtonText: {
    color: Colors.foreground,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  cancelText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
});
