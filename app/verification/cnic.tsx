import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck, CheckCircle2, Lock, ArrowRight, AlertCircle } from 'lucide-react-native';
import { CNICUploadBox } from '@/components/verification/CNICUploadBox';
import { CNICResultCard } from '@/components/verification/CNICResultCard';
import { Button } from '@/components/ui/Button';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { processCNICVerificationImage } from '@/services/gemini/cnicVerification';
import { confirmUserIdentity } from '@/services/verification/identityService';
import { CNICExtractionResult, ExtractionSource } from '@/types/identityVerification';

export default function CNICVerificationScreen() {
  const { activeUser } = useDemoAuth();

  const [cnicImage, setCnicImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<CNICExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleStartOCR = async () => {
    if (!cnicImage) {
      Alert.alert('No Image Selected', 'Please capture or upload an image of your Pakistani CNIC.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const result = await processCNICVerificationImage(cnicImage);

      if (!result.document_detected || !result.is_readable) {
        setErrorMessage(
          result.issues?.[0] || 'Unable to read Pakistani CNIC. Please upload a clearer, well-lit photo.'
        );
      } else {
        setExtractionResult(result);
      }
    } catch (err) {
      setErrorMessage('Verification service error. Please try uploading the image again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmIdentity = async (
    finalName: string,
    finalCnic: string,
    source: ExtractionSource
  ) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const userId = activeUser?.id || 'seller-101';
      const res = await confirmUserIdentity(userId, finalName, finalCnic, source);
      if (!res.success) {
        setErrorMessage(res.error || 'Identity verification failed.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('Verification processing failed. Please try again.');
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <CheckCircle2 size={64} color={Colors.primary} />
          <Text style={styles.successTitle}>🎉 Identity Verified!</Text>
          <Text style={styles.successSub}>
            Your identity has been successfully verified. You are now authorized to create and publish crop listings.
          </Text>

          <View style={styles.badgeBox}>
            <ShieldCheck size={18} color={Colors.primary} />
            <Text style={styles.badgeText}>✓ Verified Seller Account</Text>
          </View>

          <Button
            title="Continue to Create Crop Listing 🌾"
            onPress={() => router.replace('/(tabs)/add' as any)}
            style={styles.continueBtn}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrapper}>
          <ShieldCheck size={32} color={Colors.primary} />
        </View>
        <Text style={styles.titleUrdu}>اپنی شناخت کی تصدیق کریں</Text>
        <Text style={styles.titleEng}>Verify Your Identity</Text>
        <Text style={styles.explanation}>
          To help create a trusted marketplace, please verify your identity using your Pakistani CNIC.
        </Text>
      </View>

      {/* Error Toast */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <AlertCircle size={20} color={Colors.error} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Processing State */}
      {isProcessing ? (
        <View style={styles.processingCard}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.processingTitle}>AI Analyzing CNIC Document...</Text>
          <Text style={styles.processingSub}>
            Extracting identity details securely using multimodal vision OCR
          </Text>
        </View>
      ) : extractionResult ? (
        /* Result Review & Confirmation Card */
        <CNICResultCard
          holderName={extractionResult.holder_name || activeUser?.full_name || 'Chaudhry Ahmad'}
          cnicNumber={extractionResult.cnic_number || '35202-1234567-1'}
          confidence={extractionResult.confidence}
          onConfirm={handleConfirmIdentity}
          onRetake={() => {
            setExtractionResult(null);
            setCnicImage(null);
          }}
          isSubmitting={isSubmitting}
        />
      ) : (
        /* Image Upload Box */
        <View style={styles.stepBox}>
          <CNICUploadBox
            imageUri={cnicImage}
            onSelectImage={(uri) => setCnicImage(uri)}
            onClearImage={() => setCnicImage(null)}
          />

          <Button
            title="Submit CNIC for Verification"
            onPress={handleStartOCR}
            disabled={!cnicImage}
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            style={styles.submitBtn}
          />
        </View>
      )}

      <View style={styles.footerNote}>
        <Lock size={14} color="#64748B" />
        <Text style={styles.footerText}>
          Your CNIC image is encrypted and stored in private security storage.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  headerIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  titleUrdu: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.foreground,
  },
  titleEng: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  explanation: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  stepBox: {
    gap: Spacing.md,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    marginTop: 6,
  },
  processingCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: 30,
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  processingSub: {
    fontSize: 13,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: Radius.lg,
    gap: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 14,
    color: Colors.foreground,
    textAlign: 'center',
    lineHeight: 20,
  },
  badgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    width: '100%',
    borderRadius: Radius.xl,
    marginTop: 10,
  },
});
