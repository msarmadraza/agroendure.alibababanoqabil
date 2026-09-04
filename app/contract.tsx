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
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';

export default function SmartContract() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [buyerConsent, setBuyerConsent] = useState(false);
  const [isRecordingConsent, setIsRecordingConsent] = useState(false);
  const [signature, setSignature] = useState('');
  const [isExplanationPlaying, setIsExplanationPlaying] = useState(false);

  const contractData = {
    crop: 'اعلیٰ کوالٹی گندم',
    quantity: '50 من',
    agreedPrice: 83000,
    totalAmount: 4150000,
    deliveryDate: '25 اپریل 2024',
    farmer: 'احمد علی',
    buyer: 'علی حسن',
    location: 'فیصل آباد، پنجاب',
    qualityStandards: 'نمی 12% سے کم، صاف اور خشک',
    penaltyClause: 'دیر سے ڈیلیوری پر 2% فی دن کاٹا جائے گا',
  };

  const steps = [
    'معاہدہ کی تفصیلات',
    'شرائط کی وضاحت',
    'آوازی رضامندی',
    'ڈیجیٹل دستخط',
    'ایسکرو پیمنٹ',
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
    Alert.alert('✅ کامیابی', 'معاہدہ مکمل ہو گیا اور رقم ایسکرو میں محفوظ ہے!');
    router.replace('/(tabs)/profile');
  };

  const renderContractDetails = () => (
    <View style={styles.stepContent}>
      <View style={styles.voiceBox}>
        <View style={styles.stepHeader}>
          <FileText size={18} color={Colors.foreground} />
          <Text style={styles.stepTitle}>معاہدہ کی تفصیلات</Text>
        </View>

        <View style={styles.detailList}>
          <DetailRow label="فصل" value={contractData.crop} />
          <DetailRow label="مقدار" value={contractData.quantity} />
          <DetailRow
            label="فی من قیمت"
            value={`₨${contractData.agreedPrice.toLocaleString()}`}
          />
          <DetailRow
            label="کل رقم"
            value={`₨${contractData.totalAmount.toLocaleString()}`}
            highlight
          />
          <DetailRow label="ڈیلیوری" value={contractData.deliveryDate} />
          <DetailRow label="کسان" value={contractData.farmer} />
          <DetailRow label="خریدار" value={contractData.buyer} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setCurrentStep(1)}
      >
        <Text style={styles.primaryButtonText}>آگے بڑھیں</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTermsExplanation = () => (
    <View style={styles.stepContent}>
      <View style={[styles.card, Shadows.soft]}>
        <Text style={styles.cardTitle}>شرائط کی تفصیل</Text>

        <View style={styles.termBlock}>
          <Text style={styles.termTitle}>کوالٹی کی شرائط:</Text>
          <Text style={styles.termText}>{contractData.qualityStandards}</Text>
        </View>

        <View style={styles.termBlock}>
          <Text style={styles.termTitle}>پنالٹی:</Text>
          <Text style={styles.termText}>{contractData.penaltyClause}</Text>
        </View>

        <View style={styles.termBlock}>
          <Text style={styles.termTitle}>پیمنٹ:</Text>
          <Text style={styles.termText}>
            ایسکرو میں محفوظ، ڈیلیوری کے بعد ریلیز
          </Text>
        </View>
      </View>

      <View style={styles.explanationCard}>
        <View style={styles.explanationHeader}>
          <Text style={styles.cardTitle}>AI وضاحت</Text>
          <TouchableOpacity onPress={handlePlayExplanation}>
            <Text style={styles.playText}>
              {isExplanationPlaying ? 'رک جائیں' : 'سنیں'}
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
            <Text style={styles.playingText}>شرائط کی تفصیل چل رہی ہے...</Text>
          </View>
        )}

        <Text style={styles.termText}>
          یہ معاہدہ آپ کو کوالٹی کی گارنٹی اور محفوظ پیمنٹ فراہم کرتا ہے۔
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setCurrentStep(2)}
      >
        <Text style={styles.primaryButtonText}>میں سمجھ گیا ہوں</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVoiceConsent = () => (
    <View style={styles.stepContent}>
      <View style={styles.voiceBox}>
        <Text style={styles.stepTitle}>آوازی رضامندی</Text>
        <Text style={styles.consentText}>
          براہ کرم اس معاہدے سے اپنی رضامندی کا اظہار کریں
        </Text>

        <View style={styles.consentPhraseBox}>
          <Text style={styles.consentPhraseLabel}>یہ کہیں:</Text>
          <Text style={styles.consentPhrase}>
            "میں {contractData.buyer} اس معاہدے سے مکمل طور پر راضی ہوں اور تمام شرائط قبول کرتا ہوں"
          </Text>
        </View>

        <VoiceButton
          isRecording={isRecordingConsent}
          onStartRecording={handleVoiceConsent}
          onStopRecording={handleVoiceConsent}
          size="lg"
        />

        {isRecordingConsent && (
          <Text style={styles.recordingText}>ریکارڈ ہو رہا ہے... بولیں</Text>
        )}

        {buyerConsent && (
          <View style={styles.consentConfirmed}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.consentConfirmedText}>
              رضامندی ریکارڈ ہو گئی
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !buyerConsent && styles.disabledButton]}
        onPress={() => setCurrentStep(3)}
        disabled={!buyerConsent}
      >
        <Text style={styles.primaryButtonText}>آگے بڑھیں</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDigitalSignature = () => (
    <View style={styles.stepContent}>
      <View style={[styles.card, Shadows.soft]}>
        <View style={styles.stepHeader}>
          <User size={18} color={Colors.foreground} />
          <Text style={styles.cardTitle}>ڈیجیٹل دستخط</Text>
        </View>

        <View style={styles.signatureBox}>
          <Text style={styles.signatureHint}>یہاں اپنا دستخط کریں</Text>
          <View style={styles.signatureCanvas}>
            <Text style={styles.signatureCanvasText}>
              {signature ? 'دستخط مکمل' : 'ٹچ کر کے دستخط کریں'}
            </Text>
          </View>
        </View>

        <View style={styles.signatureActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setSignature('')}
          >
            <Text style={styles.secondaryButtonText}>صاف کریں</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButtonSmall}
            onPress={() => setSignature('signed')}
          >
            <Text style={styles.primaryButtonText}>دستخط مکمل</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !signature && styles.disabledButton]}
        onPress={() => setCurrentStep(4)}
        disabled={!signature}
      >
        <Text style={styles.primaryButtonText}>دستخط مکمل، آگے بڑھیں</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEscrowPayment = () => (
    <View style={styles.stepContent}>
      <View style={styles.successBox}>
        <Shield size={48} color={Colors.white} />
        <Text style={styles.successTitle}>محفوظ پیمنٹ</Text>
        <Text style={styles.successSubtitle}>
          آپ کی رقم ایسکرو میں محفوظ ہے
        </Text>
      </View>

      <View style={[styles.card, Shadows.soft]}>
        <View style={styles.stepHeader}>
          <CreditCard size={18} color={Colors.foreground} />
          <Text style={styles.cardTitle}>پیمنٹ کی تفصیلات</Text>
        </View>

        <View style={styles.detailList}>
          <DetailRow
            label="کل رقم"
            value={`₨${contractData.totalAmount.toLocaleString()}`}
          />
          <DetailRow
            label="سروس فیس (2%)"
            value={`₨${(contractData.totalAmount * 0.02).toLocaleString()}`}
          />
          <DetailRow
            label="کل ادائیگی"
            value={`₨${(contractData.totalAmount * 1.02).toLocaleString()}`}
            highlight
          />
        </View>
      </View>

      <View style={styles.paymentMethods}>
        <TouchableOpacity style={styles.paymentMethod}>
          <Text style={styles.paymentMethodText}>بینک ٹرانسفر</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.paymentMethodOutline}>
          <Text style={styles.paymentMethodOutlineText}>موبائل والٹ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.paymentMethodOutline}>
          <Text style={styles.paymentMethodOutlineText}>کریڈٹ کارڈ</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.successButton} onPress={handlePayment}>
        <Text style={styles.successButtonText}>
          پیمنٹ کریں اور معاہدہ مکمل کریں
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
        <View>
          <Text style={styles.headerTitle}>اسمارٹ معاہدہ</Text>
          <Text style={styles.headerSubtitle}>{steps[currentStep]}</Text>
        </View>
        <View style={styles.headerSpacer} />
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
