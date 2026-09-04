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
  TrendingUp,
  Sparkles,
  Camera,
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
    <View style={styles.aiHeader}>
      <View style={styles.aiIconCircle}>
        <Bot size={22} color={Colors.white} />
      </View>
      <View style={styles.aiHeaderTexts}>
        <Text style={styles.aiTitle}>
          <Sparkles size={12} color={Colors.primary} /> AgroEndure AI لسٹنگ اسسٹنٹ
        </Text>
        <Text style={styles.stepTitleUrdu}>{AI_STEPS[stepIdx].titleUrdu}</Text>
        <Text style={styles.stepTitleEng}>{AI_STEPS[stepIdx].titleEng}</Text>
      </View>
    </View>
  );

  const renderTextInputRow = (stepIdx: number) => (
    <>
      <View style={styles.orDivider}>
        <View style={styles.line} />
        <Text style={styles.orText}>یا لکھ کر بتائیں</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.textInputRow}>
        <TextInput
          style={styles.textInput}
          placeholder={AI_STEPS[stepIdx].placeholder}
          placeholderTextColor={Colors.mutedForeground}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleProcessInput(inputText)}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => handleProcessInput(inputText)}
          disabled={isProcessing}
        >
          <ArrowRight size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </>
  );

  const renderAiStep = (stepIdx: number) => {
    const response =
      stepIdx === 0 ? cropResponse : stepIdx === 1 ? qtyResponse : qualityResponse;

    return (
      <View style={styles.stepContainer}>
        {renderAiHeader(stepIdx)}

        <View style={styles.voiceBox}>
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
                ? '🌾 فصل کا نام'
                : stepIdx === 1
                ? '📦 مقدار'
                : '⭐ کوالٹی'
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
      />

      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(3)}>
          <Text style={styles.backButtonText}>واپس</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, images.length === 0 && styles.disabledButton]}
          onPress={() => setStep(5)}
          disabled={images.length === 0}
        >
          <Text style={styles.nextButtonText}>آگے</Text>
          <ArrowRight size={16} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPriceStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.previewHeading}>آپ کی لسٹنگ کا جائزہ</Text>

      <View style={[styles.previewCard, Shadows.soft]}>
        {images[0] ? (
          <Image source={{ uri: images[0].uri }} style={styles.previewImage} />
        ) : null}

        <View style={styles.previewBody}>
          <Text style={styles.previewTitle}>🌾 {cropName || 'فصل'}</Text>
          <Text style={styles.previewQty}>
            📦 مقدار: {quantityStr || `${quantityNum} ${quantityUnit}`}
          </Text>
          <Text style={styles.previewQuality}>⭐ کوالٹی: {qualityStr || 'Grade A'}</Text>
          <Text style={styles.previewSeller}>👤 کسان: {activeUser?.full_name ?? 'ڈیمو کسان'}</Text>
        </View>
      </View>

      <View style={styles.voiceBox}>
        <View style={styles.aiPriceHeader}>
          <TrendingUp size={18} color={Colors.primary} />
          <Text style={styles.aiPriceTitle}>AI تجویز کردہ قیمت</Text>
        </View>

        <View style={styles.priceDisplay}>
          <Text style={styles.priceCurrency}>Rs</Text>
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
          <Text style={styles.priceUnit}>فی {quantityUnit}</Text>
        </View>

        <Text style={styles.priceHint}>
          مارکیٹ کی موجودہ قیمتوں اور آپ کی کوالٹی کے مطابق AI نے یہ قیمت تجویز کی ہے۔ آپ اسے تبدیل کر سکتے ہیں۔
        </Text>
      </View>

      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(4)}>
          <Text style={styles.backButtonText}>واپس</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishButton, isPublishing && styles.disabledButton]}
          onPress={handlePublishListing}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.publishButtonText}>🚀 لسٹنگ پبلش کریں</Text>
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
            <CheckCircle2 size={64} color={Colors.success} />
            <Text style={styles.successTitle}>آپ کی لسٹنگ لائیو ہو گئی! 🎉</Text>
            <Text style={styles.successSub}>
              آپ کی فصل اب مارکیٹ پلیس میں خریداروں کو نظر آ رہی ہے۔
            </Text>

            <View style={styles.successSummaryBox}>
              <Text style={styles.summaryItemTitle}>🌾 {cropName || 'فصل'}</Text>
              <Text style={styles.summaryItemSub}>
                📦 {quantityStr || `${quantityNum} ${quantityUnit}`} • ⭐{' '}
                {qualityStr || 'Grade A'} • Rs {price}/{quantityUnit}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => router.replace('/(tabs)/browse')}
            >
              <Text style={styles.successBtnText}>مارکیٹ پلیس دیکھیں</Text>
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
            >
              <Text style={styles.newListingBtnText}>+ نئی لسٹنگ بنائیں</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  stepContainer: {
    gap: Spacing.xl,
  },

  // AI header bubble
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.accent,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    gap: Spacing.md,
  },
  aiIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHeaderTexts: {
    flex: 1,
    gap: Spacing.xs,
  },
  aiTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  stepTitleUrdu: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.foreground,
  },
  stepTitleEng: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    fontStyle: 'italic',
  },

  // Voice box
  voiceBox: {
    alignItems: 'center',
    backgroundColor: Colors.gradientVoiceEnd,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    width: '100%',
  },

  // Text input
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.mutedForeground,
    marginHorizontal: Spacing.md,
  },
  textInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.muted,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.foreground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Nav buttons
  navButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },

  // Preview / price step
  previewHeading: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 160,
  },
  previewBody: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  previewTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.foreground,
  },
  previewQty: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  previewQuality: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.success,
  },
  previewSeller: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
  },
  aiPriceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiPriceTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  priceCurrency: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  priceInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    minWidth: 140,
    textAlign: 'center',
  },
  priceUnit: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  priceHint: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
  },
  publishButton: {
    flex: 1,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },

  // Success screen
  successScreen: {
    flex: 1,
    backgroundColor: Colors.accent,
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
    borderColor: Colors.primaryLight,
  },
  successTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.success,
    textAlign: 'center',
  },
  successSub: {
    fontSize: FontSize.md,
    color: Colors.foreground,
    textAlign: 'center',
    lineHeight: 20,
  },
  successSummaryBox: {
    backgroundColor: Colors.muted,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    width: '100%',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryItemTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.foreground,
  },
  summaryItemSub: {
    fontSize: FontSize.md,
    color: Colors.mutedForeground,
  },
  successBtn: {
    backgroundColor: Colors.primary,
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  successBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  newListingBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  newListingBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
