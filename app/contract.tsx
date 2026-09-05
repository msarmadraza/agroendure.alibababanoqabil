import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  FileText,
  User,
  Shield,
  CreditCard,
  CheckCircle,
  Play,
} from 'lucide-react-native';
import { VoiceButton } from '@/components/VoiceButton';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';
import { useLanguage } from '@/services/i18n/languageContext';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';

export default function SmartContract() {
  const router = useRouter();
  const { t, isUrdu } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [buyerConsent, setBuyerConsent] = useState(false);
  const [isRecordingConsent, setIsRecordingConsent] = useState(false);
  const [signature, setSignature] = useState('');
  const [isExplanationPlaying, setIsExplanationPlaying] = useState(false);

  const contractData = {
    crop: t('smartContract.defaultCrop'),
    quantity: t('smartContract.defaultQuantity'),
    agreedPrice: 83000,
    totalAmount: 4150000,
    deliveryDate: t('smartContract.defaultDelivery'),
    farmer: t('smartContract.defaultFarmer'),
    buyer: t('smartContract.defaultBuyer'),
    location: isUrdu ? 'فیصل آباد، پنجاب' : 'Faisalabad, Punjab',
    qualityStandards: t('smartContract.defaultQuality'),
    penaltyClause: t('smartContract.defaultPenalty'),
  };

  const steps = [
    t('smartContract.stepDetails'),
    t('smartContract.stepTerms'),
    t('smartContract.stepVoiceConsent'),
    t('smartContract.stepSignature'),
    t('smartContract.stepEscrow'),
  ];

  const handlePlayExplanation = () => {
    setIsExplanationPlaying(!isExplanationPlaying);
    if (!isExplanationPlaying) {
      setTimeout(() => setIsExplanationPlaying(false), 5000);
    }
  };

  const handleVoiceConsent = () => {
    if (isRecordingConsent) {
      setBuyerConsent(true);
      setIsRecordingConsent(false);
    } else {
      setIsRecordingConsent(true);
    }
  };

  const handlePayment = () => {
    Alert.alert(t('smartContract.successTitle'), t('smartContract.successDesc'));
    router.replace('/(tabs)/profile');
  };

  const renderContractDetails = () => (
    <View style={styles.stepContent}>
      <View style={styles.voiceBox}>
        <View style={styles.stepHeader}>
          <FileText size={18} color={Colors.foreground} />
          <Text style={styles.stepTitle}>{t('smartContract.stepDetails')}</Text>
        </View>

        <View style={styles.detailList}>
          <DetailRow label={t('smartContract.cropLabel')} value={contractData.crop} />
          <DetailRow label={t('smartContract.quantityLabel')} value={contractData.quantity} />
          <DetailRow
            label={t('smartContract.pricePerMann')}
            value={`₨${contractData.agreedPrice.toLocaleString()}`}
          />
          <DetailRow
            label={t('smartContract.totalAmount')}
            value={`₨${contractData.totalAmount.toLocaleString()}`}
            highlight
          />
          <DetailRow label={t('smartContract.deliveryDate')} value={contractData.deliveryDate} />
          <DetailRow label={t('smartContract.farmerLabel')} value={contractData.farmer} />
          <DetailRow label={t('smartContract.buyerLabel')} value={contractData.buyer} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setCurrentStep(1)}
      >
        <Text style={styles.primaryButtonText}>{t('smartContract.proceed')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTermsExplanation = () => (
    <View style={styles.stepContent}>
      <View style={[styles.card, Shadows.soft]}>
        <Text style={styles.cardTitle}>{t('smartContract.termsDetails')}</Text>

        <View style={styles.termBlock}>
          <Text style={styles.termTitle}>{t('smartContract.qualityTerms')}</Text>
          <Text style={styles.termText}>{contractData.qualityStandards}</Text>
        </View>

        <View style={styles.termBlock}>
          <Text style={styles.termTitle}>{t('smartContract.penaltyClause')}</Text>
          <Text style={styles.termText}>{contractData.penaltyClause}</Text>
        </View>

        <View style={styles.termBlock}>
          <Text style={styles.termTitle}>{t('smartContract.paymentClause')}</Text>
          <Text style={styles.termText}>
            {t('smartContract.paymentInEscrow')}
          </Text>
        </View>
      </View>

      <View style={styles.explanationCard}>
        <View style={styles.explanationHeader}>
          <Text style={styles.cardTitle}>{t('smartContract.aiExplanation')}</Text>
          <TouchableOpacity onPress={handlePlayExplanation}>
            <Text style={styles.playText}>
              {isExplanationPlaying ? t('smartContract.stop') : t('smartContract.listen')}
            </Text>
          </TouchableOpacity>
        </View>

        {isExplanationPlaying && (
          <View style={styles.waveform}>
            {[...Array(10)].map((_, i) => (
              <View
                key={i}
                style={[styles.waveBar, { height: 10 + Math.random() * 20 }]}
              />
            ))}
            <Text style={styles.playingText}>{t('smartContract.explainingText')}</Text>
          </View>
        )}

        <Text style={styles.termText}>
          {t('smartContract.protectionNote')}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setCurrentStep(2)}
      >
        <Text style={styles.primaryButtonText}>{t('smartContract.understood')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVoiceConsent = () => (
    <View style={styles.stepContent}>
      <View style={styles.voiceBox}>
        <Text style={styles.stepTitle}>{t('smartContract.voiceConsentTitle')}</Text>
        <Text style={styles.consentText}>
          {t('smartContract.voiceConsentDesc')}
        </Text>

        <View style={styles.consentPhraseBox}>
          <Text style={styles.consentPhraseLabel}>{t('smartContract.sayThis')}</Text>
          <Text style={styles.consentPhrase}>
            "{isUrdu ? `میں ${contractData.buyer} اس معاہدے سے مکمل طور پر راضی ہوں اور تمام شرائط قبول کرتا ہوں` : `I, ${contractData.buyer}, fully agree to this contract and accept all terms`}"
          </Text>
        </View>

        <VoiceButton
          isRecording={isRecordingConsent}
          onStartRecording={handleVoiceConsent}
          onStopRecording={handleVoiceConsent}
          size="lg"
        />

        {isRecordingConsent && (
          <Text style={styles.recordingText}>{t('smartContract.recordingText')}</Text>
        )}

        {buyerConsent && (
          <View style={styles.consentConfirmed}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.consentConfirmedText}>
              {t('smartContract.consentRecorded')}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !buyerConsent && styles.disabledButton]}
        onPress={() => setCurrentStep(3)}
        disabled={!buyerConsent}
      >
        <Text style={styles.primaryButtonText}>{t('smartContract.proceed')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDigitalSignature = () => (
    <View style={styles.stepContent}>
      <View style={[styles.card, Shadows.soft]}>
        <View style={styles.stepHeader}>
          <User size={18} color={Colors.foreground} />
          <Text style={styles.cardTitle}>{t('smartContract.digitalSignatureTitle')}</Text>
        </View>

        <View style={styles.signatureBox}>
          <Text style={styles.signatureHint}>{t('smartContract.signHere')}</Text>
          <View style={styles.signatureCanvas}>
            <Text style={styles.signatureCanvasText}>
              {signature ? t('smartContract.signCompleted') : t('smartContract.touchToSign')}
            </Text>
          </View>
        </View>

        <View style={styles.signatureActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setSignature('')}
          >
            <Text style={styles.secondaryButtonText}>{t('smartContract.clear')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButtonSmall}
            onPress={() => setSignature('signed')}
          >
            <Text style={styles.primaryButtonText}>{t('smartContract.completeSignature')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !signature && styles.disabledButton]}
        onPress={() => setCurrentStep(4)}
        disabled={!signature}
      >
        <Text style={styles.primaryButtonText}>{t('smartContract.signAndProceed')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEscrowPayment = () => (
    <View style={styles.stepContent}>
      <View style={styles.successBox}>
        <Shield size={48} color={Colors.white} />
        <Text style={styles.successTitle}>{t('smartContract.escrowSecurityTitle')}</Text>
        <Text style={styles.successSubtitle}>
          {t('smartContract.escrowProtected')}
        </Text>
      </View>

      <View style={[styles.card, Shadows.soft]}>
        <View style={styles.stepHeader}>
          <CreditCard size={18} color={Colors.foreground} />
          <Text style={styles.cardTitle}>{t('smartContract.paymentDetailsTitle')}</Text>
        </View>

        <View style={styles.detailList}>
          <DetailRow
            label={t('smartContract.totalAmount')}
            value={`₨${contractData.totalAmount.toLocaleString()}`}
          />
          <DetailRow
            label={t('smartContract.serviceFee')}
            value={`₨${(contractData.totalAmount * 0.02).toLocaleString()}`}
          />
          <DetailRow
            label={t('smartContract.totalPayable')}
            value={`₨${(contractData.totalAmount * 1.02).toLocaleString()}`}
            highlight
          />
        </View>
      </View>

      <View style={styles.paymentMethods}>
        <TouchableOpacity style={styles.paymentMethod}>
          <Text style={styles.paymentMethodText}>{t('smartContract.bankTransfer')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.paymentMethodOutline}>
          <Text style={styles.paymentMethodOutlineText}>{t('smartContract.mobileWallet')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.paymentMethodOutline}>
          <Text style={styles.paymentMethodOutlineText}>{t('smartContract.creditCard')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.successButton} onPress={handlePayment}>
        <Text style={styles.successButtonText}>
          {t('smartContract.payAndFinalize')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{t('smartContract.title')}</Text>
          <Text style={styles.headerSubtitle}>{steps[currentStep]}</Text>
        </View>
        <LanguageSwitcherButton compact />
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressBar,
              {
                backgroundColor:
                  index <= currentStep ? Colors.primary : Colors.muted,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 0 && renderContractDetails()}
        {currentStep === 1 && renderTermsExplanation()}
        {currentStep === 2 && renderVoiceConsent()}
        {currentStep === 3 && renderDigitalSignature()}
        {currentStep === 4 && renderEscrowPayment()}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text
        style={[
          styles.detailValue,
          highlight && { color: Colors.primary, fontWeight: '700', fontSize: FontSize.lg },
        ]}
      >
        {value}
      </Text>
    </View>
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
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  progress: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  stepContent: {
    gap: Spacing.lg,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  voiceBox: {
    backgroundColor: Colors.gradientVoiceEnd,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  detailList: {
    width: '100%',
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.foreground,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.xl,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  termBlock: {
    marginBottom: Spacing.md,
  },
  termTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  termText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    lineHeight: 20,
  },
  explanationCard: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  playText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: Spacing.sm,
  },
  waveBar: {
    width: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  playingText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  consentText: {
    fontSize: FontSize.sm,
    color: Colors.foreground,
    textAlign: 'center',
  },
  consentPhraseBox: {
    width: '100%',
    backgroundColor: `${Colors.primary}15`,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  consentPhraseLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  consentPhrase: {
    fontSize: FontSize.sm,
    color: Colors.foreground,
    lineHeight: 20,
  },
  recordingText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  consentConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  consentConfirmedText: {
    fontSize: FontSize.sm,
    color: Colors.success,
  },
  signatureBox: {
    marginBottom: Spacing.md,
  },
  signatureHint: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  signatureCanvas: {
    height: 96,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  signatureCanvasText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  signatureActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  primaryButtonSmall: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.foreground,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: Colors.success,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  successSubtitle: {
    fontSize: FontSize.sm,
    color: `${Colors.white}E6`,
    marginTop: Spacing.xs,
  },
  paymentMethods: {
    gap: Spacing.md,
  },
  paymentMethod: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  paymentMethodText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  paymentMethodOutline: {
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  paymentMethodOutlineText: {
    color: Colors.foreground,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.xl,
    alignItems: 'center',
  },
  successButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
