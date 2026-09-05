import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bot,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Sparkles,
  Camera,
  ShieldCheck,
} from 'lucide-react-native';
import { WizardStepIndicator } from '@/components/listing/WizardStepIndicator';
import { VoiceInputButton } from '@/components/listing/VoiceInputButton';
import { DetectionCard } from '@/components/listing/DetectionCard';
import { PhotoUploadGrid } from '@/components/listing/PhotoUploadGrid';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { processListingQuestionResponse } from '@/services/gemini/listingAssistant';
import {
  createListingWithImages,
  suggestListingPrice,
} from '@/services/marketplace/listingService';
import {
  AIListingResponse,
  ListingImageItem,
  QuantityExtraction,
  QualityExtraction,
} from '@/types/listingWizard';
import { Listing } from '@/types/database';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useLanguage } from '@/services/i18n/languageContext';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';

// Urdu questions + English hints shown for each AI step
const AI_STEPS = [
  {
    titleUrdu: 'آپ کون سی فصل بیچنا چاہتے ہیں؟',
    titleEng: '"What crop would you like to sell?"',
    voiceHint: 'فصل کا نام بولیں (مثلاً: گندم، چاول، کپاس...)',
    placeholder: 'فصل کا نام لکھیں (مثلاً: گندم، چاول، کپاس...)',
    fallback: 'میرے پاس باسمتی چاول ہیں',
  },
  {
    titleUrdu: 'آپ کتنی مقدار میں فصل بیچنا چاہتے ہیں؟',
    titleEng: '"How much crop would you like to sell?"',
    voiceHint: 'مقدار اور یونٹ بولیں (مثلاً: 400 من، 50 کلو...)',
    placeholder: 'مقدار لکھیں (مثلاً: 400 من، 50 کلو...)',
    fallback: 'میرے پاس 400 من ہیں',
  },
  {
    titleUrdu: 'آپ کی فصل کی کوالٹی کیسی ہے؟',
    titleEng: '"What is the quality of your crop?"',
    voiceHint: 'کوالٹی گریڈ بولیں (مثلاً: گریڈ اے، بی، سی...)',
    placeholder: 'کوالٹی لکھیں (مثلاً: گریڈ اے، بی، سی...)',
    fallback: 'quality B Grade hai',
  },
];

export default function VoiceListing() {
  const router = useRouter();
  const { activeUser } = useDemoAuth();
  const { t, isUrdu } = useLanguage();

  const [step, setStep] = useState(1); // 1: Crop, 2: Quantity, 3: Quality, 4: Photos, 5: Price & Publish
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedListing, setPublishedListing] = useState<Listing | null>(null);

  // AI-extracted values
  const [cropName, setCropName] = useState<string | null>(null);
  const [cropResponse, setCropResponse] = useState<AIListingResponse | null>(null);

  const [quantityStr, setQuantityStr] = useState<string | null>(null);
  const [quantityNum, setQuantityNum] = useState<number>(100);
  const [quantityUnit, setQuantityUnit] = useState<string>('Mann');
  const [qtyResponse, setQtyResponse] = useState<AIListingResponse | null>(null);

  const [qualityStr, setQualityStr] = useState<string | null>(null);
  const [qualityDesc, setQualityDesc] = useState<string | null>(null);
  const [qualityResponse, setQualityResponse] = useState<AIListingResponse | null>(null);

  // Photos
  const [images, setImages] = useState<ListingImageItem[]>([]);

  // Price (AI suggested, editable)
  const [price, setPrice] = useState<string>('6000');
  const [priceTouched, setPriceTouched] = useState(false);

  // AI suggests a price once crop + quality are known
  useEffect(() => {
    if (step === 5 && !priceTouched) {
      setPrice(String(suggestListingPrice(cropName, qualityStr)));
    }
  }, [step, priceTouched, cropName, qualityStr]);

  // Process voice or text answer through the Gemini listing assistant
  const handleProcessInput = async (userText: string) => {
    const rawInput = (userText || inputText).trim();
    if (!rawInput) {
      Alert.alert('جواب درکار ہے', 'براہ کرم بولیں یا اپنا جواب لکھیں۔');
      return;
    }

    try {
      setIsProcessing(true);
      if (step === 1) {
        const res = await processListingQuestionResponse('crop_name', rawInput);
        setCropResponse(res);
        if (res.display_value) setCropName(res.display_value);
      } else if (step === 2) {
        const res = await processListingQuestionResponse('quantity', rawInput);
        setQtyResponse(res);
        if (res.display_value) setQuantityStr(res.display_value);
        const extracted = res.extracted_value as QuantityExtraction | null;
        if (extracted && typeof extracted === 'object' && 'quantity' in extracted) {
          if (extracted.quantity) setQuantityNum(extracted.quantity);
          if (extracted.unit) setQuantityUnit(extracted.unit);
        }
      } else if (step === 3) {
        const res = await processListingQuestionResponse('quality', rawInput);
        setQualityResponse(res);
        if (res.display_value) setQualityStr(res.display_value);
        const extracted = res.extracted_value as QualityExtraction | null;
        if (extracted && typeof extracted === 'object' && 'quality_description' in extracted) {
          if (extracted.quality_description) setQualityDesc(extracted.quality_description);
        }
      }
    } catch {
      Alert.alert('خرابی', 'AI جواب پراسیس نہیں کر سکا۔ براہ کرم دوبارہ کوشش کریں یا دستی طور پر لکھیں۔');
    } finally {
      setIsProcessing(false);
      setInputText('');
    }
  };

  // Voice button finished: use the live transcript, or a step-aware
  // fallback when the browser did not capture the microphone
  const handleVoiceCompleted = (_audioUri: string, spokenText: string) => {
    let finalQuery = spokenText.trim();

    if (!finalQuery) {
      finalQuery = AI_STEPS[step - 1].fallback;
    }

    handleProcessInput(finalQuery);
  };

  // Confirm the AI-detected value (possibly edited by the farmer)
  const handleConfirmStep = (value: string) => {
    if (step === 1) {
      setCropName(value);
      setStep(2);
    } else if (step === 2) {
      setQuantityStr(value);
      setStep(3);
    } else if (step === 3) {
      setQualityStr(value);
      setStep(4);
    }
  };

  const handleAddPhoto = (uri: string) => {
    if (images.length >= 3) return;
    setImages((prev) => [...prev, { id: `img-${Date.now()}-${prev.length + 1}`, uri }]);
  };

  // Demo convenience: attach bundled crop photos (resolved to real URLs)
  const addDemoPhotos = () => {
    const demoAssets = [
      require('@/assets/wheat-field.jpg'),
      require('@/assets/rice-seedlings.jpg'),
      require('@/assets/cotton-harvest.jpg'),
    ];
    const uris = demoAssets
      .map((asset) => Image.resolveAssetSource(asset).uri)
      .filter(Boolean)
      .slice(0, 3 - images.length);
    setImages((prev) => [
      ...prev,
      ...uris.map((uri, i) => ({ id: `img-demo-${Date.now()}-${prev.length + i + 1}`, uri })),
    ]);
  };

  const handleRemovePhoto = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  // Publish the listing live to Supabase (falls back to local storage)
  const handlePublishListing = async () => {
    const finalPrice = parseInt(price.replace(/[^\d]/g, ''), 10);
    if (!finalPrice || finalPrice <= 0) {
      Alert.alert('قیمت درکار ہے', 'براہ کرم فی یونٹ درست قیمت بتائیں۔');
      return;
    }

    try {
      setIsPublishing(true);

      const title = `${cropName || 'فصل'} — ${quantityStr || `${quantityNum} ${quantityUnit}`}`;
      const description =
        `${quantityStr || `${quantityNum} ${quantityUnit}`} ${qualityStr || 'اچھی'} کوالٹی ` +
        `${cropName || 'فصل'} براہ راست کسان ${activeUser?.full_name || ''} کے کھیت سے دستیاب ہے۔`;

      const listing = await createListingWithImages(
        {
          seller_id: activeUser?.id ?? 'demo-seller-uuid',
          title,
          description,
          product_name: cropName || 'فصل',
          product_category: 'Crops',
          quantity: quantityNum,
          quantity_unit: quantityUnit,
          quality: qualityStr || 'Grade A',
          quality_description: qualityDesc || 'اچھی کوالٹی',
          price: finalPrice,
        },
        images.map((i) => i.uri),
        activeUser
      );

      setPublishedListing(listing);
    } catch {
      Alert.alert('پبلش خرابی', 'لسٹنگ پبلش نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔');
    } finally {
      setIsPublishing(false);
    }
  };

  const renderAiHeader = (stepIdx: number) => (
    <View style={[styles.aiHeader, Shadows.soft]}>
      <View style={styles.aiBadgePill}>
        <Sparkles size={13} color={Colors.primary} />
        <Text style={styles.aiBadgeText}>
          {isUrdu ? 'ایگرو اینڈیور AI اسسٹنٹ' : 'AgroEndure AI Assistant'}
        </Text>
      </View>
      <Text style={styles.stepTitleUrdu}>
        {isUrdu ? AI_STEPS[stepIdx].titleUrdu : AI_STEPS[stepIdx].titleEng}
      </Text>
    </View>
  );

  const renderTextInputRow = (stepIdx: number) => (
    <View style={styles.textSection}>
      <View style={styles.orDivider}>
        <View style={styles.line} />
        <Text style={styles.orText}>
          {isUrdu ? 'یا کی بورڈ سے لکھیں' : 'Or type with keyboard'}
        </Text>
        <View style={styles.line} />
      </View>

      <View style={styles.textInputCard}>
        <TextInput
          style={styles.textInput}
          placeholder={AI_STEPS[stepIdx].placeholder}
          placeholderTextColor={Colors.mutedForeground}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleProcessInput(inputText)}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => handleProcessInput(inputText)}
          disabled={isProcessing || !inputText.trim()}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <ArrowRight size={18} color={Colors.white} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAiStep = (stepIdx: number) => {
    const response =
      stepIdx === 0 ? cropResponse : stepIdx === 1 ? qtyResponse : qualityResponse;

    return (
      <View style={styles.stepContainer}>
        {renderAiHeader(stepIdx)}

        <View style={[styles.voiceStudioBox, Shadows.soft]}>
          <VoiceInputButton
            onSpeechCompleted={handleVoiceCompleted}
            isProcessing={isProcessing}
            stepPromptHint={AI_STEPS[stepIdx].voiceHint}
          />
        </View>

        {renderTextInputRow(stepIdx)}

        {response && (
          <DetectionCard
            title={
              stepIdx === 0
                ? (isUrdu ? 'فصل کی تفصیل' : 'Crop Details')
                : stepIdx === 1
                ? (isUrdu ? 'مقدار اور پیمانہ' : 'Quantity & Units')
                : (isUrdu ? 'کوالٹی گریڈ' : 'Quality Grade')
            }
            detectedValue={response.display_value ?? ''}
            originalText={
              response.extracted_value &&
              typeof response.extracted_value === 'object' &&
              'original_response' in response.extracted_value
                ? (response.extracted_value as { original_response: string }).original_response
                : undefined
            }
            confidence={response.confidence}
            needsClarification={response.needs_clarification}
            clarificationMessage={response.clarification_question}
            onConfirm={handleConfirmStep}
          />
        )}
      </View>
    );
  };

  const renderPhotoStep = () => (
    <View style={styles.stepContainer}>
      <PhotoUploadGrid
        images={images}
        onAddImage={handleAddPhoto}
        onRemoveImage={handleRemovePhoto}
        onAddDemoPhotos={addDemoPhotos}
      />

      <View style={styles.navButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(3)}
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color={Colors.foreground} />
          <Text style={styles.backButtonText}>واپس</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, images.length === 0 && styles.disabledButton]}
          onPress={() => setStep(5)}
          disabled={images.length === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>آگے بڑھیں (قیمت کا مرحلہ)</Text>
          <ArrowRight size={16} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPriceStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.reviewBanner}>
        <ShieldCheck size={18} color={Colors.primary} />
        <Text style={styles.previewHeading}>آپ کی لسٹنگ کا حتمی جائزہ</Text>
      </View>

      {/* Modern Listing Preview Card */}
      <View style={[styles.previewCard, Shadows.soft]}>
        {images[0] ? (
          <Image source={{ uri: images[0].uri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Camera size={32} color={Colors.mutedForeground} />
            <Text style={styles.previewPlaceholderText}>کوئی تصویر منسلک نہیں کی گئی</Text>
          </View>
        )}

        <View style={styles.previewBody}>
          <View style={styles.previewTitleRow}>
            <Text style={styles.previewTitle}>{cropName || 'فصل'}</Text>
            <View style={styles.previewLiveBadge}>
              <Text style={styles.previewLiveBadgeText}>پیش نظارہ</Text>
            </View>
          </View>

          {/* Structured Table to prevent any RTL/LTR jumbling */}
          <View style={styles.specsTable}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>مقدار (Quantity)</Text>
              <Text style={styles.specValue}>{quantityStr || `${quantityNum} ${quantityUnit}`}</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>کوالٹی (Quality)</Text>
              <View style={styles.qualityPill}>
                <Text style={styles.qualityPillText}>{qualityStr || 'Grade A'}</Text>
              </View>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>کسان (Seller)</Text>
              <Text style={styles.specValue}>{activeUser?.full_name ?? 'ڈیمو کسان'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* AI Price Recommendation Card */}
      <View style={[styles.aiPriceCard, Shadows.soft]}>
        <View style={styles.aiPriceHeader}>
          <View style={styles.trendingIconBox}>
            <TrendingUp size={20} color={Colors.primary} />
          </View>
          <View style={styles.aiPriceHeaderTextGroup}>
            <Text style={styles.aiPriceTitle}>AI تجویز کردہ مارکیٹ ریٹ</Text>
            <Text style={styles.aiPriceSubTitle}>AI Recommended Market Price</Text>
          </View>
        </View>

        {/* Clean, spacious Price Input Widget */}
        <View style={styles.priceInputCapsule}>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencySymbol}>PKR</Text>
            <Text style={styles.currencyUrdu}>روپے</Text>
          </View>

          <TextInput
            style={styles.priceInput}
            value={price}
            onChangeText={(t) => {
              setPrice(t);
              setPriceTouched(true);
            }}
            keyboardType="number-pad"
            placeholder="6000"
            placeholderTextColor={Colors.mutedForeground}
          />

          <View style={styles.unitBadge}>
            <Text style={styles.unitText}>فی {quantityUnit}</Text>
          </View>
        </View>

        <View style={styles.marketInsightBox}>
          <Text style={styles.priceHint}>
            {isUrdu
              ? 'مارکیٹ میں اس کوالٹی کی اوسط قیمتوں کے تجزیے سے یہ ریٹ تجویز کیا گیا ہے۔ آپ اپنی مرضی سے اسے بدل سکتے ہیں۔'
              : 'This benchmark rate is suggested based on current market trends. You can adjust it as needed.'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.navButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(4)}
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color={Colors.foreground} />
          <Text style={styles.backButtonText}>واپس</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishButton, isPublishing && styles.disabledButton]}
          onPress={handlePublishListing}
          disabled={isPublishing}
          activeOpacity={0.85}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <CheckCircle2 size={18} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.publishButtonText}>{t('addCrop.submitBtn')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Success screen after publish
  if (publishedListing) {
    return (
      <SafeAreaView style={styles.successScreen}>
        <ScrollView contentContainerStyle={styles.successContent}>
          <View style={[styles.successCard, Shadows.soft]}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={54} color={Colors.primary} strokeWidth={2.5} />
            </View>

            <Text style={styles.successTitle}>{t('addCrop.successTitle')}</Text>
            <Text style={styles.successSub}>{t('addCrop.successSub')}</Text>

            <View style={styles.successSummaryBox}>
              <Text style={styles.summaryItemTitle}>{cropName || (isUrdu ? 'فصل' : 'Crop')}</Text>
              <View style={styles.summaryBadgesRow}>
                <View style={styles.summaryTag}>
                  <Text style={styles.summaryTagText}>{quantityStr || `${quantityNum} ${quantityUnit}`}</Text>
                </View>
                <View style={styles.summaryTag}>
                  <Text style={styles.summaryTagText}>{qualityStr || 'Grade A'}</Text>
                </View>
                <View style={[styles.summaryTag, styles.summaryPriceTag]}>
                  <Text style={styles.summaryPriceTagText}>PKR {price} / {quantityUnit}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => router.replace('/(tabs)/browse')}
              activeOpacity={0.85}
            >
              <Text style={styles.successBtnText}>
                {isUrdu ? 'مارکیٹ پلیس میں دیکھیں' : 'View in Marketplace'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newListingBtn}
              onPress={() => {
                setPublishedListing(null);
                setStep(1);
                setCropName(null);
                setCropResponse(null);
                setQuantityStr(null);
                setQtyResponse(null);
                setQualityStr(null);
                setQualityResponse(null);
                setQualityDesc(null);
                setImages([]);
                setPrice('6000');
                setPriceTouched(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.newListingBtnText}>
                {isUrdu ? '+ نئی فصل کی لسٹنگ بنائیں' : '+ Create New Crop Listing'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeaderBar}>
        <Text style={styles.topHeaderTitle}>{t('addCrop.title')}</Text>
        <LanguageSwitcherButton compact />
      </View>
      <WizardStepIndicator currentStep={step} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step <= 3
          ? renderAiStep(step - 1)
          : step === 4
          ? renderPhotoStep()
          : renderPriceStep()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  topHeaderTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  stepContainer: {
    gap: Spacing.lg,
  },

  // AI header bubble
  aiHeader: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  aiBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBg,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  aiBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
  },
  stepTitleUrdu: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.foreground,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  stepTitleEng: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    fontStyle: 'italic',
  },

  // Voice studio container
  voiceStudioBox: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.xxl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: Spacing.lg,
    width: '100%',
  },

  // Text input section
  textSection: {
    gap: Spacing.sm,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.mutedForeground,
    marginHorizontal: Spacing.md,
  },
  textInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.foreground,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },

  // Nav buttons
  navButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    backgroundColor: Colors.card,
  },
  backButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.5,
  },

  // Preview & Price Step
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  previewHeading: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primary,
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 170,
  },
  previewPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewPlaceholderText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  previewBody: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  previewTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.foreground,
  },
  previewLiveBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  previewLiveBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
  },
  specsTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    fontWeight: '600',
  },
  specValue: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.foreground,
  },
  specDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  qualityPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  qualityPillText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
  },

  // AI Price card
  aiPriceCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  aiPriceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trendingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  aiPriceHeaderTextGroup: {
    flex: 1,
  },
  aiPriceTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.foreground,
  },
  aiPriceSubTitle: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  priceInputCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    justifyContent: 'space-between',
  },
  currencyBadge: {
    alignItems: 'center',
    paddingRight: Spacing.sm,
  },
  currencySymbol: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.mutedForeground,
  },
  currencyUrdu: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  priceInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  unitBadge: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  unitText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.foreground,
  },
  marketInsightBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceHint: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    lineHeight: 18,
    textAlign: 'center',
  },
  publishButton: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  publishButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '800',
  },

  // Success Screen
  successScreen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  successContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
    flexGrow: 1,
    justifyContent: 'center',
  },
  successCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginBottom: Spacing.xs,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.foreground,
    textAlign: 'center',
  },
  successSub: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  successSummaryBox: {
    backgroundColor: '#F8FAFC',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    width: '100%',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItemTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.foreground,
  },
  summaryBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  summaryTag: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTagText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.foreground,
  },
  summaryPriceTag: {
    backgroundColor: Colors.primaryBg,
    borderColor: '#BBF7D0',
  },
  summaryPriceTagText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
  },
  successBtn: {
    backgroundColor: Colors.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  successBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  newListingBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  newListingBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
