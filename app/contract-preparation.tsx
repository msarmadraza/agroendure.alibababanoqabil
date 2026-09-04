import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  User,
  Building,
  FileText,
  Sparkles,
  Globe,
  Play,
} from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';

export default function ContractPreparation() {
  const router = useRouter();
  const [generatingContract, setGeneratingContract] = useState(false);
  const [generatedContract, setGeneratedContract] = useState('');
  const [contractGenerated, setContractGenerated] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ur');
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [isPlayingExplanation, setIsPlayingExplanation] = useState(false);

  const buyerDetails = {
    name: 'علی احمد',
    contact: '+92-300-1234567',
    address: 'کراچی، سندھ',
    paymentMethod: 'بینک ٹرانسفر',
    businessType: 'تاجر',
    deliveryDate: '2025-09-25',
    bidAmount: 83000,
    specialRequirements: 'اعلیٰ کوالٹی کی ضمانت',
  };

  const sellerDetails = {
    name: 'احمد علی',
    contact: '+92-301-9876543',
    address: 'فیصل آباد، پنجاب',
    farmSize: '25 ایکڑ',
    cropType: 'اعلیٰ کوالٹی گندم',
    quantity: '50 من',
    qualityStandards: 'نمی 12% سے کم، صاف اور خشک',

    deliveryTerms: 'فارم سے پک اپ یا ٹرانسپورٹ کی سہولت',
  };

  const languageOptions = [
    { value: 'ur', label: 'اردو' },
    { value: 'en', label: 'English' },
    { value: 'pa', label: 'پنجابی' },
    { value: 'sd', label: 'سندھی' },
    { value: 'ps', label: 'پشتو' },
  ];

  const mockContract = `سمارٹ کنٹریکٹ معاہدہ

فریق اول (کسان): احمد علی
فریق دوم (خریدار): علی احمد

1. فصل: اعلیٰ کوالٹی گندم
2. مقدار: 50 من
3. فی من قیمت: ₨83,000
4. کل رقم: ₨4,150,000
5. ڈیلیوری تاریخ: 25 ستمبر 2025
6. مقام: فیصل آباد، پنجاب
7. کوالٹی معیار: نمی 12% سے کم، صاف اور خشک
8. ادائیگی: بینک ٹرانسفر
9. پینلٹی: دیر سے ڈیلیوری پر 2% فی دن کاٹا جائے گا

دونوں فریقین اس معاہدے سے متفق ہیں۔`;

  const mockExplanation = `یہ معاہدہ احمد علی (کسان) اور علی احمد (خریدار) کے درمیان 50 من گندم کی فروخت کے لیے ہے۔ کل رقم ₨4,150,000 ہے جو ڈیلیوری کے بعد ادا کی جائے گی۔ کوالٹی کا معیار نمی 12% سے کم ہونا چاہیے۔ اگر ڈیلیوری مقررہ تاریخ پر نہ ہو تو 2% فی دن جرمانہ ہوگا۔`;

  const handleGenerateContract = () => {
    setGeneratingContract(true);
    setTimeout(() => {
      setGeneratedContract(mockContract);
      setContractGenerated(true);
      setGeneratingContract(false);
    }, 1500);
  };

  const handleExplainContract = () => {
    setIsExplaining(true);
    setTimeout(() => {
      setExplanation(mockExplanation);
      setIsExplaining(false);
    }, 1500);
  };

  const handlePlayExplanation = () => {
    setIsPlayingExplanation(!isPlayingExplanation);
    if (!isPlayingExplanation) {
      setTimeout(() => setIsPlayingExplanation(false), 5000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>کنٹریکٹ کی تیاری</Text>
          <Text style={styles.headerSubtitle}>تفصیلات کا جائزہ لیں</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Buyer Details */}
        <View style={[styles.card, Shadows.soft]}>
          <View style={styles.cardHeader}>
            <User size={18} color={Colors.foreground} />
            <Text style={styles.cardTitle}>خریدار کی تفصیلات</Text>
          </View>

          <View style={styles.detailList}>
            <DetailRow label="نام" value={buyerDetails.name} />
            <DetailRow label="رابطہ" value={buyerDetails.contact} />
            <DetailRow label="پتہ" value={buyerDetails.address} />
            <DetailRow label="کاروبار" value={buyerDetails.businessType} />
            <DetailRow
              label="بولی"
              value={`₨${buyerDetails.bidAmount.toLocaleString()}`}
              highlight
            />
            <DetailRow label="ڈیلیوری" value={buyerDetails.deliveryDate} />
            <DetailRow label="ادائیگی" value={buyerDetails.paymentMethod} />
          </View>

          <View style={styles.divider} />
          <Text style={styles.noteLabel}>خصوصی ضروریات:</Text>
          <Text style={styles.noteText}>{buyerDetails.specialRequirements}</Text>
        </View>

        {/* Seller Details */}
        <View style={[styles.card, Shadows.soft]}>
          <View style={styles.cardHeader}>
            <Building size={18} color={Colors.foreground} />
            <Text style={styles.cardTitle}>فروخت کنندہ کی تفصیلات</Text>
          </View>

          <View style={styles.detailList}>
            <DetailRow label="نام" value={sellerDetails.name} />
            <DetailRow label="رابطہ" value={sellerDetails.contact} />
            <DetailRow label="پتہ" value={sellerDetails.address} />
            <DetailRow label="فارم سائز" value={sellerDetails.farmSize} />
            <DetailRow label="فصل" value={sellerDetails.cropType} />
            <DetailRow
              label="مقدار"
              value={sellerDetails.quantity}
              highlight
            />
          </View>

          <View style={styles.divider} />
          <Text style={styles.noteLabel}>کوالٹی معیار:</Text>
          <Text style={styles.noteText}>{sellerDetails.qualityStandards}</Text>

          <Text style={styles.noteLabel}>ڈیلیوری کی شرائط:</Text>
          <Text style={styles.noteText}>{sellerDetails.deliveryTerms}</Text>
        </View>

        {/* Generate Contract Button */}
        {!contractGenerated && (
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateContract}
            disabled={generatingContract}
          >
            {generatingContract ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Sparkles size={18} color={Colors.white} />
            )}
            <Text style={styles.generateButtonText}>
              {generatingContract ? 'AI کنٹریکٹ بنا رہا ہے...' : 'کنٹریکٹ بنائیں'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Generated Contract Display */}
        {contractGenerated && generatedContract && (
          <View style={[styles.card, Shadows.soft]}>
            <View style={styles.cardHeader}>
              <FileText size={18} color={Colors.foreground} />
              <Text style={styles.cardTitle}>تیار شدہ کنٹریکٹ</Text>
            </View>

            <View style={styles.contractBox}>
              <Text style={styles.contractText}>{generatedContract}</Text>
            </View>

            {/* Language Selection and Explanation */}
            <View style={styles.explainSection}>
              <View style={styles.languageRow}>
                <Globe size={16} color={Colors.foreground} />
                <Text style={styles.languageLabel}>کنٹریکٹ کی وضاحت:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.languagePills}
                >
                  {languageOptions.map((lang) => (
                    <TouchableOpacity
                      key={lang.value}
                      onPress={() => setSelectedLanguage(lang.value)}
                      style={[
                        styles.languagePill,
                        {
                          backgroundColor:
                            selectedLanguage === lang.value
                              ? Colors.primary
                              : Colors.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.languagePillText,
                          {
                            color:
                              selectedLanguage === lang.value
                                ? Colors.white
                                : Colors.foreground,
                          },
                        ]}
                      >
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={styles.explainButton}
                onPress={handleExplainContract}
                disabled={isExplaining}
              >
                <Globe size={16} color={Colors.foreground} />
                <Text style={styles.explainButtonText}>
                  {isExplaining ? 'وضاحت تیار کی جا رہی ہے...' : 'کنٹریکٹ کی وضاحت کریں'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Contract Explanation */}
            {explanation && (
              <View style={styles.explanationBox}>
                <View style={styles.explanationHeader}>
                  <Text style={styles.explanationTitle}>کنٹریکٹ کی وضاحت</Text>
                  <TouchableOpacity onPress={handlePlayExplanation}>
                    {isPlayingExplanation ? (
                      <Text style={styles.playText}>رک جائیں</Text>
                    ) : (
                      <View style={styles.playButton}>
                        <Play size={16} color={Colors.primary} />
                        <Text style={styles.playText}>سنیں</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {isPlayingExplanation && (
                  <View style={styles.waveform}>
                    {[...Array(5)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.waveBar,
                          { height: 8 + Math.random() * 16 },
                        ]}
                      />
                    ))}
                  </View>
                )}

                <Text style={styles.explanationText}>{explanation}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => router.push('/contract')}
              >
                <Text style={styles.acceptButtonText}>کنٹریکٹ قبول کریں</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modifyButton}
                onPress={() => router.back()}
              >
                <Text style={styles.modifyButtonText}>تبدیلی کریں</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
          highlight && { color: Colors.primary, fontWeight: '700' },
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  detailList: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  noteLabel: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    marginBottom: Spacing.xs,
  },
  noteText: {
    fontSize: FontSize.sm,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.purple500,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
  },
  generateButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  contractBox: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    maxHeight: 320,
  },
  contractText: {
    fontSize: FontSize.sm,
    color: Colors.foreground,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
  explainSection: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  languageLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  languagePills: {
    gap: Spacing.sm,
  },
  languagePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  languagePillText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  explainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
  },
  explainButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
  explanationBox: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  explanationTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
  explanationText: {
    fontSize: FontSize.sm,
    color: Colors.foreground,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  modifyButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  modifyButtonText: {
    color: Colors.foreground,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
