import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Phone,
  Globe,
  ArrowRight,
  ArrowLeft,
  Mic,
  Handshake,
  ShieldCheck,
  Camera,
  RefreshCw,
  CheckCircle,
  Tractor,
  ShoppingBag,
  Lock,
  AlertCircle,
} from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { useOnboarding } from '@/services/auth/onboardingContext';
import { processCNICVerificationImage } from '@/services/gemini/cnicVerification';
import { confirmUserIdentity } from '@/services/verification/identityService';
import { verifyFaceForOnboarding, imageUriToBase64 } from '@/services/verification/faceOnboardingService';
import { CNICExtractionResult, ExtractionSource } from '@/types/identityVerification';
import { CNICUploadBox } from '@/components/verification/CNICUploadBox';
import { CNICResultCard } from '@/components/verification/CNICResultCard';

type OnboardingStep = 'slides' | 'role' | 'language' | 'cnic' | 'face' | 'phone';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: Mic,
    title: 'آواز سے فصل کی فہرست بنائیں',
    subtitle: 'بٹن دبائیں اور آسان اردو میں اپنی فصل بتائیں',
    color: Colors.primary,
  },
  {
    icon: Handshake,
    title: 'AI کی مدد سے بہترین قیمت حاصل کریں',
    subtitle: 'سمارٹ مذاکرات سے منافع بڑھائیں',
    color: Colors.blue500,
  },
  {
    icon: ShieldCheck,
    title: 'محفوظ اور قابل اعتماد مارکیٹ پلیس',
    subtitle: 'تصدیق شدہ خریداروں اور بیچنے والوں کے ساتھ تجارت کریں',
    color: Colors.success,
  },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const { activeUser, setRealProfile } = useDemoAuth();
  const {
    data,
    setRole,
    setLanguage,
    setCnicData,
    setFacePhoto,
    setPhone,
    completeOnboarding,
  } = useOnboarding();

  const [step, setStep] = useState<OnboardingStep>('slides');
  const [slideIndex, setSlideIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Language
  const [selectedLang, setSelectedLang] = useState(data.preferredLanguage || 'ur');

  // CNIC
  const [cnicImage, setCnicImage] = useState<string | null>(null);
  const [isCnicProcessing, setIsCnicProcessing] = useState(false);
  const [isCnicSubmitting, setIsCnicSubmitting] = useState(false);
  const [cnicResult, setCnicResult] = useState<CNICExtractionResult | null>(null);
  const [cnicError, setCnicError] = useState<string | null>(null);

  // Face
  const [facePhotoUri, setFacePhotoUri] = useState<string | null>(null);
  const [isFaceVerifying, setIsFaceVerifying] = useState(false);

  // Phone
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isPhoneVerifying, setIsPhoneVerifying] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const userId = activeUser?.id || 'demo-user';

  // --- Slides ---
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setSlideIndex(index);
  }, []);

  const goToNextSlide = () => {
    if (slideIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (slideIndex + 1) * SCREEN_WIDTH, animated: true });
    } else {
      setStep('role');
    }
  };

  // --- Role ---
  const handleRoleSelect = (role: 'buyer' | 'seller') => {
    setRole(role);
    setStep('language');
  };

  // --- Language ---
  const handleLanguageContinue = () => {
    setLanguage(selectedLang);
    setStep('cnic');
  };

  // --- CNIC ---
  const handleCnicOcr = async () => {
    if (!cnicImage) return;
    try {
      setIsCnicProcessing(true);
      setCnicError(null);
      const result = await processCNICVerificationImage(cnicImage);
      if (!result.document_detected || !result.is_readable) {
        setCnicError(result.issues?.[0] || 'CNIC پڑھ نہیں سکا۔ براہ کرم صاف تصویر لیں۔');
      } else {
        setCnicResult(result);
      }
    } catch {
      setCnicError('Verification service error. Please try again.');
    } finally {
      setIsCnicProcessing(false);
    }
  };

  const handleCnicConfirm = async (finalName: string, finalCnic: string, source: ExtractionSource) => {
    try {
      setIsCnicSubmitting(true);
      setCnicError(null);
      await confirmUserIdentity(userId, finalName, finalCnic, source);
      setCnicData(finalName, finalCnic);
      setStep('face');
    } catch {
      setCnicError('Identity confirmation failed. Please try again.');
    } finally {
      setIsCnicSubmitting(false);
    }
  };

  // --- Face ---
  const handleTakeSelfie = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setFacePhotoUri(result.assets[0].uri);
      }
    } catch {
      try {
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
    }
  };

  const handleFaceVerify = async () => {
    if (!facePhotoUri) return;
    try {
      setIsFaceVerifying(true);
      setFacePhoto(facePhotoUri);
      const base64 = await imageUriToBase64(facePhotoUri);
      await verifyFaceForOnboarding(userId, base64);
      setStep('phone');
    } catch {
      Alert.alert('Error', 'Face verification failed. Please try again.');
    } finally {
      setIsFaceVerifying(false);
    }
  };

  // --- Phone ---
  const handleSendOtp = () => {
    if (phoneNumber.length < 10) return;
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(code);
    setOtpSent(true);
    setOtpValues(['', '', '', '']);

    // Auto-fill OTP after 1 second (demo mode)
    setTimeout(() => {
      const digits = code.split('');
      setOtpValues(digits);
    }, 1000);
  };

  const handleVerifyOtp = async () => {
    const entered = otpValues.join('');
    if (entered.length !== 4) return;
    try {
      setIsPhoneVerifying(true);
      setPhone(`+92${phoneNumber}`);
      const success = await completeOnboarding(userId);
      if (success) {
        navigateToDashboard();
      }
    } catch {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsPhoneVerifying(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const navigateToDashboard = () => {
    if (data.role === 'buyer') {
      router.replace('/(tabs)/browse');
    } else {
      router.replace('/(tabs)');
    }
  };

  const goToDashboard = () => navigateToDashboard();

  // --- Step navigation ---
  const steps: OnboardingStep[] = ['slides', 'role', 'language', 'cnic', 'face', 'phone'];
  const currentIndex = steps.indexOf(step);

  const goBack = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  // --- Progress dots ---
  const renderDots = () => (
    <View style={styles.dots}>
      {steps.map((s, i) => (
        <View
          key={s}
          style={[styles.dot, { backgroundColor: currentIndex >= i ? Colors.primary : Colors.border }]}
        />
      ))}
    </View>
  );

  // ===== RENDER: Slides =====
  const renderSlides = () => (
    <View style={styles.flex}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slideContainer, { width: SCREEN_WIDTH }]}>
            <View style={[styles.slideIconWrapper, { backgroundColor: `${slide.color}18` }]}>
              <slide.icon size={56} color={slide.color} />
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.slideDots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.slideDot,
              { backgroundColor: slideIndex === i ? Colors.primary : Colors.border },
            ]}
          />
        ))}
      </View>

      <View style={styles.slideActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={goToNextSlide}>
          <Text style={styles.primaryButtonText}>
            {slideIndex < SLIDES.length - 1 ? 'اگلا' : 'شروع کریں'}
          </Text>
          <ArrowRight size={20} color={Colors.white} />
        </TouchableOpacity>
        {slideIndex === 0 && (
          <TouchableOpacity style={styles.demoButton} onPress={goToDashboard}>
            <Text style={styles.demoButtonText}>ڈیش بورڈ دیکھیں</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ===== RENDER: Role Selection =====
  const renderRole = () => (
    <View style={styles.stepContainer}>
      <View style={styles.center}>
        <Text style={styles.stepTitle}>اپنا کردار منتخب کریں</Text>
        <Text style={styles.stepSubtitle}>Select your role</Text>
      </View>

      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleCard, data.role === 'seller' && styles.roleCardSelected]}
          onPress={() => handleRoleSelect('seller')}
        >
          <View style={[styles.roleIconWrapper, { backgroundColor: Colors.primaryBg }]}>
            <Tractor size={36} color={Colors.primary} />
          </View>
          <Text style={styles.roleTitle}>Farmer</Text>
          <Text style={styles.roleTitleUrdu}>کسان</Text>
          <Text style={styles.roleDesc}>فصل بیچیں اور منافع کمائیں</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, data.role === 'buyer' && styles.roleCardSelected]}
          onPress={() => handleRoleSelect('buyer')}
        >
          <View style={[styles.roleIconWrapper, { backgroundColor: `${Colors.blue500}18` }]}>
            <ShoppingBag size={36} color={Colors.blue500} />
          </View>
          <Text style={styles.roleTitle}>Buyer</Text>
          <Text style={styles.roleTitleUrdu}>خریدار</Text>
          <Text style={styles.roleDesc}>تازہ فصل خریدیں</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ===== RENDER: Language =====
  const renderLanguage = () => (
    <View style={styles.stepContainer}>
      <View style={styles.center}>
        <Globe size={48} color={Colors.primary} />
        <Text style={styles.stepTitle}>اپنی زبان منتخب کریں</Text>
        <Text style={styles.stepSubtitle}>Choose your preferred language</Text>
      </View>

      <View style={styles.languageList}>
        {[
          { code: 'ur', native: 'اردو', name: 'Urdu' },
          { code: 'en', native: 'English', name: 'English' },
        ].map((lang) => (
          <TouchableOpacity
            key={lang.code}
            onPress={() => setSelectedLang(lang.code)}
            style={[
              styles.languageButton,
              {
                borderColor: selectedLang === lang.code ? Colors.primary : Colors.border,
                backgroundColor: selectedLang === lang.code ? Colors.primaryBg : Colors.card,
              },
            ]}
          >
            <Text style={styles.languageNative}>{lang.native}</Text>
            <Text style={styles.languageName}>{lang.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleLanguageContinue}>
        <Text style={styles.primaryButtonText}>جاری رکھیں</Text>
        <ArrowRight size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  // ===== RENDER: CNIC =====
  const renderCnic = () => (
    <View style={styles.stepContainer}>
      <View style={styles.center}>
        <ShieldCheck size={36} color={Colors.primary} />
        <Text style={styles.stepTitle}>شناخت کی تصدیق</Text>
        <Text style={styles.stepSubtitle}>Upload your CNIC for verification</Text>
      </View>

      {cnicError && (
        <View style={styles.errorBox}>
          <AlertCircle size={18} color={Colors.error} />
          <Text style={styles.errorText}>{cnicError}</Text>
        </View>
      )}

      {isCnicProcessing ? (
        <View style={styles.processingCard}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.processingTitle}>CNIC Analyzing...</Text>
          <Text style={styles.processingSub}>AI extracting document details</Text>
        </View>
      ) : cnicResult ? (
        <CNICResultCard
          holderName={cnicResult.holder_name || activeUser?.full_name || 'User'}
          cnicNumber={cnicResult.cnic_number || '35202-1234567-1'}
          confidence={cnicResult.confidence}
          onConfirm={handleCnicConfirm}
          onRetake={() => {
            setCnicResult(null);
            setCnicImage(null);
          }}
          isSubmitting={isCnicSubmitting}
        />
      ) : (
        <View style={styles.cnicUpload}>
          <CNICUploadBox
            imageUri={cnicImage}
            onSelectImage={(uri) => setCnicImage(uri)}
            onClearImage={() => setCnicImage(null)}
          />
          <TouchableOpacity
            style={[styles.primaryButton, !cnicImage && styles.disabledButton]}
            onPress={handleCnicOcr}
            disabled={!cnicImage}
          >
            <Text style={styles.primaryButtonText}>Submit for Verification</Text>
            <ArrowRight size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footerNote}>
        <Lock size={14} color={Colors.mutedForeground} />
        <Text style={styles.footerText}>Your CNIC is encrypted and stored securely.</Text>
      </View>
    </View>
  );

  // ===== RENDER: Face =====
  const renderFace = () => (
    <View style={styles.stepContainer}>
      <View style={styles.center}>
        <Camera size={48} color={Colors.primary} />
        <Text style={styles.stepTitle}>تصویری تصدیق</Text>
        <Text style={styles.stepSubtitle}>Take a clear selfie for verification</Text>
      </View>

      {facePhotoUri ? (
        <View style={styles.facePreview}>
          <Image source={{ uri: facePhotoUri }} style={styles.faceImage} />
          {isFaceVerifying ? (
            <View style={styles.faceVerifying}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.processingTitle}>Verifying face...</Text>
            </View>
          ) : (
            <View style={styles.faceActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setFacePhotoUri(null)}
              >
                <RefreshCw size={18} color={Colors.foreground} />
                <Text style={styles.secondaryButtonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleFaceVerify}>
                <Text style={styles.primaryButtonText}>Confirm</Text>
                <CheckCircle size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.faceCapture}>
          <View style={styles.faceGuide}>
            <Camera size={64} color={Colors.mutedForeground} />
            <Text style={styles.faceGuideText}>Position your face in the circle</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={handleTakeSelfie}>
            <Camera size={20} color={Colors.white} />
            <Text style={styles.primaryButtonText}>Take Selfie</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ===== RENDER: Phone =====
  const renderPhone = () => (
    <View style={styles.stepContainer}>
      <View style={styles.center}>
        <Phone size={48} color={Colors.primary} />
        <Text style={styles.stepTitle}>فون نمبر کی تصدیق</Text>
        <Text style={styles.stepSubtitle}>Enter your phone number</Text>
      </View>

      <View style={styles.phoneInputRow}>
        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>+92</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="3001234567"
          placeholderTextColor={Colors.mutedForeground}
          maxLength={10}
          editable={!otpSent}
        />
      </View>

      {!otpSent ? (
        <TouchableOpacity
          style={[styles.primaryButton, phoneNumber.length < 10 && styles.disabledButton]}
          onPress={handleSendOtp}
          disabled={phoneNumber.length < 10}
        >
          <Text style={styles.primaryButtonText}>Send Code</Text>
          <ArrowRight size={20} color={Colors.white} />
        </TouchableOpacity>
      ) : (
        <View style={styles.otpSection}>
          <Text style={styles.otpLabel}>+92 {phoneNumber} پر بھیجا گیا کوڈ داخل کریں</Text>
          <View style={styles.otpRow}>
            {[0, 1, 2, 3].map((i) => (
              <TextInput
                key={i}
                ref={(ref) => { otpRefs.current[i] = ref; }}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                value={otpValues[i]}
                onChangeText={(val) => handleOtpChange(i, val)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isPhoneVerifying && styles.disabledButton]}
            onPress={handleVerifyOtp}
            disabled={isPhoneVerifying}
          >
            {isPhoneVerifying ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>تصدیق کریں</Text>
                <CheckCircle size={18} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header with back button and progress */}
          <View style={styles.header}>
            {step !== 'slides' && (
              <TouchableOpacity onPress={goBack}>
                <ArrowLeft size={20} color={Colors.foreground} />
              </TouchableOpacity>
            )}
            {renderDots()}
          </View>

          {step === 'slides' && renderSlides()}
          {step === 'role' && renderRole()}
          {step === 'language' && renderLanguage()}
          {step === 'cnic' && renderCnic()}
          {step === 'face' && renderFace()}
          {step === 'phone' && renderPhone()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    minHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginLeft: 'auto',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    gap: Spacing.xl,
  },
  center: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.foreground,
  },
  stepSubtitle: {
    fontSize: FontSize.md,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },

  // Slides
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  slideIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  slideTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  slideSubtitle: {
    fontSize: FontSize.md,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  slideDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  slideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  slideActions: {
    gap: Spacing.md,
  },

  // Role
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    gap: Spacing.sm,
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  roleIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  roleTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  roleTitleUrdu: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  roleDesc: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },

  // Language
  languageList: {
    gap: Spacing.md,
  },
  languageButton: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 2,
  },
  languageNative: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  languageName: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
  },

  // CNIC
  cnicUpload: {
    gap: Spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: '#991B1B',
    fontWeight: '600',
  },
  processingCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    padding: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  processingTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
  },
  processingSub: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },

  // Face
  facePreview: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  faceImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  faceVerifying: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  faceActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  faceCapture: {
    alignItems: 'center',
    gap: Spacing.xl,
  },
  faceGuide: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  faceGuideText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },

  // Phone
  phoneInputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  countryCode: {
    backgroundColor: Colors.muted,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    minWidth: 70,
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.foreground,
    backgroundColor: Colors.card,
  },
  otpSection: {
    gap: Spacing.lg,
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  otpInput: {
    width: 52,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    textAlign: 'center',
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.foreground,
    backgroundColor: Colors.card,
  },

  // Buttons
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.xl,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  secondaryButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
  disabledButton: {
    opacity: 0.5,
  },
  demoButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  demoButtonText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
