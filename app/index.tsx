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
  CheckCircle2,
  Tractor,
  ShoppingBag,
  Lock,
  AlertCircle,
  ScanFace,
  UploadCloud,
  Sparkles,
  Sun,
  Glasses,
  UserCheck,
} from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useLanguage } from '@/services/i18n/languageContext';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { useOnboarding } from '@/services/auth/onboardingContext';
import { processCNICVerificationImage } from '@/services/gemini/cnicVerification';
import { confirmUserIdentity, findProfileByCNIC, createOrUpdateProfileWithIdentity } from '@/services/verification/identityService';
import { verifyFaceForOnboarding, imageUriToBase64 } from '@/services/verification/faceOnboardingService';
import { translateEnglishNameToUrdu } from '@/services/gemini/nameTranslationService';
import { CNICExtractionResult, ExtractionSource } from '@/types/identityVerification';
import { CNICUploadBox } from '@/components/verification/CNICUploadBox';
import { CNICResultCard } from '@/components/verification/CNICResultCard';
import { VoiceCircleButton } from '@/components/ui/VoiceCircleButton';
import { VOICE_SCRIPTS } from '@/services/voice/speechService';

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
  const { isUrdu } = useLanguage();
  const { activeUser, setRealProfile, loginWithProfile } = useDemoAuth();
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
  const [selectedRole, setSelectedRole] = useState<'seller' | 'buyer'>(data.role || 'seller');

  const handleRoleSelect = (role: 'buyer' | 'seller') => {
    setSelectedRole(role);
  };

  const handleRoleContinue = () => {
    setRole(selectedRole);
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

      // 1. Resolve Urdu name (via OCR or AI transliteration)
      let urduName = cnicResult?.holder_name_urdu;
      if (!urduName || !/[\u0600-\u06FF]/.test(urduName)) {
        urduName = await translateEnglishNameToUrdu(finalName);
      }

      // 2. Check if this CNIC already belongs to an existing user
      const existingProfile = await findProfileByCNIC(finalCnic);
      if (existingProfile) {
        loginWithProfile(existingProfile);
        setCnicData(existingProfile.full_name || finalName, finalCnic, existingProfile.full_name_ur || urduName);
        if (existingProfile.avatar_url) {
          setFacePhoto(existingProfile.avatar_url);
        }
        if (existingProfile.role) {
          setRole(existingProfile.role);
        }

        Alert.alert(
          isUrdu ? 'خوش آمدید!' : 'Welcome Back!',
          isUrdu
            ? `آپ کا شناختی کارڈ ریکارڈ (${existingProfile.full_name || existingProfile.full_name_ur}) مل گیا ہے۔ آپ کامیابی سے لاگ ان ہو گئے ہیں۔`
            : `Existing profile found for this CNIC (${existingProfile.full_name}). You are now logged in.`,
          [
            {
              text: isUrdu ? 'ڈیش بورڈ پر جائیں' : 'Continue to Dashboard',
              onPress: () => {
                if (existingProfile.role === 'buyer') {
                  router.replace('/(tabs)/browse');
                } else {
                  router.replace('/(tabs)');
                }
              },
            },
          ]
        );
        return;
      }

      // 3. New User Registration
      await confirmUserIdentity(userId, finalName, finalCnic, source);
      setCnicData(finalName, finalCnic, urduName);
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
      handleChooseSelfieFromGallery();
    }
  };

  const handleChooseSelfieFromGallery = async () => {
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
  };

  const handleFaceVerify = async () => {
    if (!facePhotoUri) return;
    try {
      setIsFaceVerifying(true);
      setFacePhoto(facePhotoUri);
      const base64 = await imageUriToBase64(facePhotoUri);
      await verifyFaceForOnboarding(userId, base64, facePhotoUri);
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
      const fullPhone = `+92${phoneNumber}`;
      setPhone(fullPhone);

      // Create or update profile in Supabase & local storage
      const savedProfile = await createOrUpdateProfileWithIdentity({
        id: userId,
        role: data.role || selectedRole || 'seller',
        cnicNumber: data.cnicNumber || '35202-1234567-1',
        holderName: data.cnicHolderName || 'User',
        holderNameUrdu: data.cnicHolderNameUrdu || null,
        phone: fullPhone,
        avatarUrl: data.facePhotoUri || facePhotoUri || null,
        preferredLanguage: data.preferredLanguage || selectedLang || 'ur',
      });

      loginWithProfile(savedProfile);
      await completeOnboarding(savedProfile.id);

      navigateToDashboard();
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

  // --- Progress Stepper Header ---
  const renderDots = () => (
    <View style={styles.stepperContainer}>
      <View style={styles.stepperBars}>
        {steps.map((s, i) => {
          const isCurrent = currentIndex === i;
          const isCompleted = currentIndex > i;
          return (
            <View
              key={s}
              style={[
                styles.stepperBar,
                isCurrent && styles.stepperBarActive,
                isCompleted && styles.stepperBarCompleted,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>
          {currentIndex + 1} / {steps.length}
        </Text>
      </View>
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
            <View style={[styles.slideIconWrapper, { backgroundColor: `${slide.color}15` }]}>
              <slide.icon size={52} color={slide.color} />
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
              slideIndex === i && styles.slideDotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.slideActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={goToNextSlide} activeOpacity={0.88}>
          <Text style={styles.primaryButtonText}>
            {slideIndex < SLIDES.length - 1 ? 'اگلا مرحلہ • Next' : 'شروع کریں • Get Started'}
          </Text>
          <ArrowRight size={20} color={Colors.white} />
        </TouchableOpacity>
        {slideIndex === 0 && (
          <TouchableOpacity style={styles.demoButton} onPress={goToDashboard}>
            <Text style={styles.demoButtonText}>ڈیش بورڈ دیکھیں • Explore Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ===== RENDER: Role Selection =====
  const renderRole = () => (
    <View style={styles.stepContainer}>
      <View style={styles.center}>
        <View style={styles.headerIconCircle}>
          <Tractor size={28} color={Colors.primary} />
        </View>
        <Text style={styles.stepTitle}>اپنا کردار منتخب کریں</Text>
        <Text style={styles.stepSubtitle}>Select your account role to continue</Text>
      </View>

      <View style={styles.roleGrid}>
        {/* Farmer Card */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'seller' ? styles.roleCardSelected : styles.roleCardUnselected,
          ]}
          onPress={() => handleRoleSelect('seller')}
          activeOpacity={0.88}
        >
          <View style={styles.roleCardHeader}>
            <View style={[styles.roleBadge, selectedRole === 'seller' && styles.roleBadgeActive]}>
              <Text style={[styles.roleBadgeText, selectedRole === 'seller' && styles.roleBadgeTextActive]}>
                بیچنے والا • Seller
              </Text>
            </View>
            <View style={[styles.radioCircle, selectedRole === 'seller' && styles.radioCircleSelected]}>
              {selectedRole === 'seller' && <CheckCircle2 size={18} color={Colors.primary} />}
            </View>
          </View>

          <View style={styles.roleIconWrapper}>
            <Tractor size={36} color={Colors.primary} />
          </View>

          <View style={styles.roleTextContainer}>
            <Text style={styles.roleTitle}>Farmer</Text>
            <Text style={styles.roleTitleUrdu}>کسان / زمیندار</Text>
            <Text style={styles.roleDesc}>اپنی فصل کی لسٹنگ بنائیں، سمارٹ بولیاں وصول کریں اور منافع کمائیں</Text>
          </View>

          <View style={styles.rolePerksRow}>
            <View style={styles.perkChip}>
              <CheckCircle2 size={12} color={Colors.primary} />
              <Text style={styles.rolePerkItem}>AI آواز لسٹنگ</Text>
            </View>
            <View style={styles.perkChip}>
              <CheckCircle2 size={12} color={Colors.primary} />
              <Text style={styles.rolePerkItem}>محفوظ ڈیجیٹل معاہدہ</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Buyer Card */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'buyer' ? styles.roleCardSelected : styles.roleCardUnselected,
          ]}
          onPress={() => handleRoleSelect('buyer')}
          activeOpacity={0.88}
        >
          <View style={styles.roleCardHeader}>
            <View style={[styles.roleBadge, selectedRole === 'buyer' && styles.roleBadgeActive]}>
              <Text style={[styles.roleBadgeText, selectedRole === 'buyer' && styles.roleBadgeTextActive]}>
                خریدار • Trader
              </Text>
            </View>
            <View style={[styles.radioCircle, selectedRole === 'buyer' && styles.radioCircleSelected]}>
              {selectedRole === 'buyer' && <CheckCircle2 size={18} color={Colors.primary} />}
            </View>
          </View>

          <View style={styles.roleIconWrapper}>
            <ShoppingBag size={36} color={Colors.primary} />
          </View>

          <View style={styles.roleTextContainer}>
            <Text style={styles.roleTitle}>Buyer</Text>
            <Text style={styles.roleTitleUrdu}>خریدار / تاجر</Text>
            <Text style={styles.roleDesc}>تصدیق شدہ کسانوں سے معیاری گندم، چاول اور کپاس کی فصلیں براہ راست خریدیں</Text>
          </View>

          <View style={styles.rolePerksRow}>
            <View style={styles.perkChip}>
              <CheckCircle2 size={12} color={Colors.primary} />
              <Text style={styles.rolePerkItem}>شفاف ریٹس</Text>
            </View>
            <View style={styles.perkChip}>
              <CheckCircle2 size={12} color={Colors.primary} />
              <Text style={styles.rolePerkItem}>ایسکرو سیکیورٹی</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleRoleContinue}
        activeOpacity={0.88}
      >
        <Text style={styles.primaryButtonText}>اگلا مرحلہ — جاری رکھیں • Continue</Text>
        <ArrowRight size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  // ===== RENDER: Language =====
  const renderLanguage = () => (
    <View style={styles.stepContainer}>
      <View style={styles.center}>
        <View style={styles.headerIconCircle}>
          <Globe size={28} color={Colors.primary} />
        </View>
        <Text style={styles.stepTitle}>اپنی زبان منتخب کریں</Text>
        <Text style={styles.stepSubtitle}>Choose your preferred app language</Text>
      </View>

      <View style={styles.languageList}>
        {[
          { code: 'ur', native: 'اردو', name: 'Urdu (پاکستانی اردو)', badge: 'تجویز کردہ • Recommended' },
          { code: 'en', native: 'English', name: 'English (US / UK)', badge: 'Official' },
        ].map((lang) => {
          const isSelected = selectedLang === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setSelectedLang(lang.code)}
              activeOpacity={0.88}
              style={[
                styles.languageCard,
                isSelected ? styles.languageCardSelected : styles.languageCardUnselected,
              ]}
            >
              <View style={styles.languageCardLeft}>
                <Text style={[styles.languageNative, isSelected && { color: Colors.primary }]}>
                  {lang.native}
                </Text>
                <Text style={styles.languageName}>{lang.name}</Text>
              </View>
              <View style={styles.languageCardRight}>
                <View style={[styles.langBadge, isSelected && styles.langBadgeSelected]}>
                  <Text style={[styles.langBadgeText, isSelected && { color: Colors.primaryDark }]}>
                    {lang.badge}
                  </Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <CheckCircle2 size={18} color={Colors.primary} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleLanguageContinue}
        activeOpacity={0.88}
      >
        <Text style={styles.primaryButtonText}>جاری رکھیں • Continue to CNIC</Text>
        <ArrowRight size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  // ===== RENDER: CNIC =====
  const renderCnic = () => (
    <View style={styles.stepContainer}>
      <View style={styles.center}>
        <View style={styles.headerIconCircle}>
          <ShieldCheck size={28} color={Colors.primary} />
        </View>
        <Text style={styles.stepTitle}>شناخت کی تصدیق</Text>
        <Text style={styles.stepSubtitle}>Upload your Pakistani CNIC for verification</Text>
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
          <Text style={styles.processingTitle}>شناختی کارڈ کا تجزیہ جاری ہے...</Text>
          <Text style={styles.processingSub}>AI extracting document name & CNIC number</Text>
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
            style={[
              styles.primaryButton,
              !cnicImage && styles.disabledSubmitButton,
            ]}
            onPress={handleCnicOcr}
            disabled={!cnicImage}
            activeOpacity={0.88}
          >
            <Text style={[styles.primaryButtonText, !cnicImage && styles.disabledSubmitButtonText]}>
              {cnicImage ? 'تصدیق کے لیے جمع کریں • Submit for Verification' : 'پہلے تصویر منتخب کریں • Select Photo First'}
            </Text>
            <ArrowRight size={20} color={cnicImage ? Colors.white : Colors.disabledText} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footerNote}>
        <Lock size={14} color={Colors.mutedForeground} />
        <Text style={styles.footerText}>256-bit انکرپٹڈ • آپ کا شناختی کارڈ مکمل محفوظ ہے</Text>
      </View>
    </View>
  );

  // ===== RENDER: Face =====
  const renderFace = () => (
    <View style={styles.stepContainer}>
      <View style={styles.center}>
        <View style={styles.headerIconCircle}>
          <ScanFace size={28} color={Colors.primary} />
        </View>
        <Text style={styles.stepTitle}>تصویری تصدیق (سیلفی)</Text>
        <Text style={styles.stepSubtitle}>Take a clear selfie to match with your CNIC</Text>
      </View>

      {facePhotoUri ? (
        <View style={styles.facePreview}>
          <View style={styles.facePreviewWrapper}>
            <Image source={{ uri: facePhotoUri }} style={styles.faceImage} />
            <View style={styles.faceVerifiedBadge}>
              <CheckCircle2 size={16} color={Colors.white} />
              <Text style={styles.faceVerifiedBadgeText}>تصویر محفوظ ہو گئی</Text>
            </View>
          </View>

          {isFaceVerifying ? (
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.processingTitle}>چہرے کی بائیو میٹرک تصدیق ہو رہی ہے...</Text>
              <Text style={styles.processingSub}>Matching selfie with CNIC photo</Text>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.flexBtn]}
                onPress={() => setFacePhotoUri(null)}
                activeOpacity={0.88}
              >
                <RefreshCw size={18} color={Colors.foreground} />
                <Text style={styles.secondaryButtonText}>دوبارہ لیں • Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, styles.flexBtn]}
                onPress={handleFaceVerify}
                activeOpacity={0.88}
              >
                <CheckCircle2 size={18} color={Colors.white} />
                <Text style={styles.primaryButtonText}>تصدیق مکمل کریں</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.faceCaptureContainer}>
          {/* Biometric Viewfinder Portal */}
          <View style={styles.biometricPortal}>
            <View style={styles.biometricOuterRing}>
              <View style={styles.biometricInnerRing}>
                <ScanFace size={56} color={Colors.primary} />
                <View style={styles.bracketTL} />
                <View style={styles.bracketTR} />
                <View style={styles.bracketBL} />
                <View style={styles.bracketBR} />
              </View>
            </View>

            <View style={styles.biometricStatusPill}>
              <View style={styles.pulseDot} />
              <Text style={styles.biometricStatusText}>چہرہ دائرے کے اندر سیدھا رکھیں</Text>
            </View>
          </View>

          {/* Guidance Chips */}
          <View style={styles.guidanceChipsRow}>
            <View style={styles.guidanceChip}>
              <Sun size={13} color={Colors.primary} />
              <Text style={styles.guidanceChipText}>مناسب روشنی • Good Light</Text>
            </View>
            <View style={styles.guidanceChip}>
              <Glasses size={13} color={Colors.primary} />
              <Text style={styles.guidanceChipText}>عینک اتار لیں • No Glasses</Text>
            </View>
            <View style={styles.guidanceChip}>
              <UserCheck size={13} color={Colors.primary} />
              <Text style={styles.guidanceChipText}>سامنے دیکھیں • Look Ahead</Text>
            </View>
          </View>

          {/* Action Buttons: Full Width, Non-collapsing, Premium Style */}
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
              activeOpacity={0.88}
            >
              <UploadCloud size={18} color={Colors.primary} />
              <Text style={styles.outlineUploadButtonText}>گیلری سے تصویر منتخب کریں • Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.footerNote}>
        <Lock size={14} color={Colors.mutedForeground} />
        <Text style={styles.footerText}>بائیو میٹرک ڈیٹا انکرپشن کے ساتھ مکمل محفوظ ہے</Text>
      </View>
    </View>
  );

  // ===== RENDER: Phone =====
  const renderPhone = () => (
    <View style={styles.stepContainer}>
      <View style={styles.center}>
        <View style={styles.headerIconCircle}>
          <Phone size={28} color={Colors.primary} />
        </View>
        <Text style={styles.stepTitle}>فون نمبر کی تصدیق</Text>
        <Text style={styles.stepSubtitle}>Enter your phone number to receive OTP code</Text>
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
          style={[
            styles.primaryButton,
            phoneNumber.length < 10 && styles.disabledSubmitButton,
          ]}
          onPress={handleSendOtp}
          disabled={phoneNumber.length < 10}
          activeOpacity={0.88}
        >
          <Text style={[styles.primaryButtonText, phoneNumber.length < 10 && styles.disabledSubmitButtonText]}>
            کوڈ حاصل کریں • Send Verification Code
          </Text>
          <ArrowRight size={20} color={phoneNumber.length < 10 ? Colors.disabledText : Colors.white} />
        </TouchableOpacity>
      ) : (
        <View style={styles.otpSection}>
          <Text style={styles.otpLabel}>+92 {phoneNumber} پر بھیجا گیا 4 ہندسوں کا کوڈ درج کریں</Text>
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
            style={[styles.primaryButton, isPhoneVerifying && styles.disabledSubmitButton]}
            onPress={handleVerifyOtp}
            disabled={isPhoneVerifying}
            activeOpacity={0.88}
          >
            {isPhoneVerifying ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>تصدیق مکمل کریں • Verify & Enter</Text>
                <CheckCircle2 size={18} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const onboardingVoiceScript =
    step === 'slides'
      ? VOICE_SCRIPTS.onboardingSlides
      : step === 'role'
      ? VOICE_SCRIPTS.onboardingRole
      : step === 'language'
      ? VOICE_SCRIPTS.onboardingLanguage
      : step === 'cnic'
      ? VOICE_SCRIPTS.onboardingCnic
      : step === 'face'
      ? VOICE_SCRIPTS.onboardingFace
      : VOICE_SCRIPTS.onboardingPhone;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header with back button and progress */}
          <View style={styles.header}>
            {step !== 'slides' ? (
              <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.8}>
                <ArrowLeft size={20} color={Colors.foreground} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            {renderDots()}
            <VoiceCircleButton
              text={onboardingVoiceScript}
              autoPlay
              size={38}
            />
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
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    minHeight: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: 'auto',
  },
  stepperBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stepperBar: {
    width: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  stepperBarActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  stepperBarCompleted: {
    width: 10,
    backgroundColor: '#86EFAC',
  },
  stepBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  stepContainer: {
    gap: Spacing.xl,
  },
  center: {
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  headerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  stepTitle: {
    fontSize: FontSize.xxl + 2,
    fontWeight: '800',
    color: Colors.foreground,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: FontSize.sm + 1,
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
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  slideTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.foreground,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  slideSubtitle: {
    fontSize: FontSize.md,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
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
    backgroundColor: Colors.border,
  },
  slideDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  slideActions: {
    gap: Spacing.md,
  },

  // Role
  roleGrid: {
    gap: Spacing.md,
    width: '100%',
  },
  roleCard: {
    borderRadius: Radius.xl,
    borderWidth: 2,
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    gap: Spacing.sm,
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  roleCardUnselected: {
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleBadgeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.mutedForeground,
  },
  roleBadgeTextActive: {
    color: Colors.white,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  roleIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  roleTextContainer: {
    gap: 4,
  },
  roleTitle: {
    fontSize: FontSize.lg + 1,
    fontWeight: '800',
    color: Colors.foreground,
  },
  roleTitleUrdu: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  roleDesc: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    lineHeight: 20,
  },
  rolePerksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  perkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rolePerkItem: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
  },

  // Language
  languageList: {
    gap: Spacing.md,
  },
  languageCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  languageCardUnselected: {
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  languageCardLeft: {
    gap: 4,
  },
  languageNative: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.foreground,
  },
  languageName: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  languageCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  langBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langBadgeSelected: {
    backgroundColor: Colors.white,
    borderColor: '#BBF7D0',
  },
  langBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mutedForeground,
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  processingTitle: {
    fontSize: FontSize.md + 1,
    fontWeight: '700',
    color: Colors.primaryDark,
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
    marginTop: Spacing.xs,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },

  // Face
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
    gap: 4,
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
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.sm,
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guidanceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedForeground,
  },
  selfieButtonStack: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: Spacing.sm,
  },
  outlineUploadButton: {
    width: '100%',
    minHeight: 48,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineUploadButtonText: {
    color: Colors.foreground,
    fontSize: FontSize.sm + 1,
    fontWeight: '600',
  },

  // Phone
  phoneInputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  countryCode: {
    backgroundColor: Colors.secondary,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    minWidth: 70,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countryCodeText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1.5,
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
    width: '100%',
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
    width: 54,
    height: 58,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    textAlign: 'center',
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.foreground,
    backgroundColor: Colors.card,
  },

  // Buttons
  primaryButton: {
    width: '100%',
    minHeight: 52,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSize.md + 1,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  secondaryButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  flexBtn: {
    flex: 1,
    width: undefined,
  },
  disabledSubmitButton: {
    backgroundColor: Colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledSubmitButtonText: {
    color: Colors.disabledText,
  },
  demoButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  demoButtonText: {
    color: Colors.primary,
    fontSize: FontSize.sm + 1,
    fontWeight: '700',
  },
});
