/**
 * AgroEndure Speech Synthesis & Urdu Voice Guidance Engine.
 * Powered by Web Speech API (ur-PK) + Gemini AI dynamic text generation.
 * Enables full audio accessibility for illiterate & semi-literate Pakistani farmers.
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const NOVITA_API_KEY = process.env.EXPO_PUBLIC_NOVITA_API_KEY || process.env.NOVITA_API_KEY || '';
const NOVITA_API_URL = 'https://api.novita.ai/v3/openai/chat/completions';

/**
 * Standard pre-recorded Urdu voice scripts for static guidance throughout the app.
 */
export const VOICE_SCRIPTS = {
  // Onboarding steps
  onboardingSlides: 'ایگرو اینڈور میں خوش آمدید! پاکستان کا پہلا کسان دوست ڈیجیٹل تجارتی پلیٹ فارم۔ آگے بڑھنے کے لیے اگلا مرحلہ دبائیں۔',
  onboardingRole: 'اپنا کردار منتخب کریں! کیا آپ فصل بیچنے والے کسان ہیں، یا فصل خریدنے والے تاجر؟ اپنا انتخاب کر کے جاری رکھیں دبائیں۔',
  onboardingLanguage: 'اپنی پسندیدہ زبان منتخب کریں! آپ ایپ کو اردو یا انگریزی میں چلا سکتے ہیں۔',
  onboardingCnic: 'شناختی کارڈ کی تصدیق! اپنا اصل شناختی کارڈ کیمرے کے سامنے سیدھا رکھیں اور صاف تصویر لیں۔ AI آپ کا نام اور شناختی کارڈ نمبر خود بخود پڑھ لے گا۔',
  onboardingFace: 'تصویری تصدیق! اپنا چہرہ کیمرے کے فریم کے اندر سیدھا رکھیں اور مناسب روشنی میں صاف سیلفی لیں۔',
  onboardingPhone: 'فون نمبر کی تصدیق! اپنا موبائل فون نمبر درج کریں تاکہ ایس ایم ایس کے ذریعے چار ہندسوں کا تصدیقی کوڈ بھیجا جا سکے۔',

  // Crop Listing Wizard steps
  listingCropQuestion: 'آپ کون سی فصل بیچنا چاہتے ہیں اور کتنی مقدار ہے؟ مثلاً پانچ سو من گندم یا سو بوری چاول۔ نیچے مائیک کا بٹن دبا کر بولیں۔',
  listingCrop: 'آپ کون سی فصل بیچنا چاہتے ہیں؟ مثلاً گندم، باسمتی چاول، کپاس یا مکئی۔ مائیک کا بٹن دبا کر اپنی آواز میں بولیں۔',
  listingQuantity: 'آپ کتنی مقدار میں فصل بیچنا چاہتے ہیں؟ مثلاً چار سو من، یا پچاس بوری۔ نیچے مائیک کا بٹن دبا کر بولیں۔',
  listingQuality: 'آپ کی فصل کا معیار یا کوالٹی کیسی ہے؟ مثلاً سپر فائن، گریڈ اے، بی گریڈ، یا عام کوالٹی۔ بول کر بتائیں۔',
  listingPhotosQuestion: 'اپنی فصل کی تصاویر اپلوڈ کریں! کیمرے سے تازہ فصل کی صاف تصویر لیں تاکہ خریدار معیار دیکھ سکے۔',
  listingPhotos: 'اپنی فصل کی تصاویر اپلوڈ کریں! کیمرے سے تازہ فصل کی صاف تصویر لیں تاکہ خریدار معیار دیکھ سکے۔',
  listingPriceQuestion: 'آپ فی من کیا قیمت حاصل کرنا چاہتے ہیں؟ اپنی مناسب قیمت بتائیں، مارکیٹ کے ریٹس کے مطابق بہترین سودا طے کریں۔',
  listingPrice: 'آپ فی من کیا قیمت حاصل کرنا چاہتے ہیں؟ AI کی تجویز کردہ مارکیٹ قیمت کا جائزہ لیں اور اپنی مناسب قیمت مقرر کریں۔',

  // Agreement
  agreementGeneral: 'تجارتی معاہدے کی شرائط کا جائزہ لیں! دونوں فریقین تصدیق کے لیے بائیو میٹرک تصدیق مکمل کریں۔',
  agreementFinal: 'مبارک ہو! تجارتی معاہدہ دونوں فریقین کی باہمی رضامندی اور بائیو میٹرک تصدیق کے ساتھ حتمی اور محفوظ ہو چکا ہے۔',
};

let currentAudio: any = null;
let currentUtterance: any = null;
let isAudioActive = false;

function playSpeechSynthesisFallback(
  text: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    isAudioActive = false;
    options?.onEnd?.();
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    const urduVoice =
      voices.find((v) => v.lang === 'ur-PK' || v.lang === 'ur_PK' || v.lang.startsWith('ur')) ||
      voices.find((v) => v.lang === 'hi-IN' || v.lang.startsWith('hi')) ||
      voices[0] ||
      null;

    if (urduVoice) {
      utterance.voice = urduVoice;
      utterance.lang = urduVoice.lang;
    }

    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      currentUtterance = utterance;
      isAudioActive = true;
      options?.onStart?.();
    };

    utterance.onend = () => {
      currentUtterance = null;
      isAudioActive = false;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('[AgroEndure Audio] SpeechSynthesis fallback error:', e);
      currentUtterance = null;
      isAudioActive = false;
      options?.onError?.(e);
      options?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[AgroEndure Audio] SpeechSynthesis fallback threw:', err);
    isAudioActive = false;
    options?.onEnd?.();
  }
}

function playDirectGoogleTTS(
  text: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  try {
    const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      text.substring(0, 160)
    )}&tl=ur&client=tw-ob`;

    const audio = new Audio(directUrl);
    currentAudio = audio;

    audio.onplay = () => {
      isAudioActive = true;
      options?.onStart?.();
    };

    audio.onended = () => {
      isAudioActive = false;
      currentAudio = null;
      options?.onEnd?.();
    };

    audio.onerror = (err) => {
      console.warn('[AgroEndure Audio] Direct Google TTS failed, falling back to Web Speech:', err);
      currentAudio = null;
      playSpeechSynthesisFallback(text, options);
    };

    const p = audio.play();
    if (p !== undefined) {
      p.catch((e) => {
        console.warn('[AgroEndure Audio] Direct audio play rejected:', e);
        playSpeechSynthesisFallback(text, options);
      });
    }
  } catch (e) {
    playSpeechSynthesisFallback(text, options);
  }
}

/**
 * Speaks the given text in authentic Urdu using multi-tier audio streaming:
 * Tier 1: Local server TTS proxy (High quality native human Urdu MP3)
 * Tier 2: Direct Google Translate TTS endpoint
 * Tier 3: Browser SpeechSynthesis API
 */
export function speakUrdu(
  text: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): void {
  if (typeof window === 'undefined') {
    options?.onEnd?.();
    return;
  }

  // Cancel any currently playing speech/audio first
  stopSpeaking();

  if (!text || !text.trim()) {
    options?.onEnd?.();
    return;
  }

  const host = window.location.hostname || 'localhost';
  const proxyUrl = `http://${host}:3001/api/tts?text=${encodeURIComponent(text.trim())}&lang=ur`;

  try {
    const audio = new Audio(proxyUrl);
    currentAudio = audio;

    audio.onplay = () => {
      isAudioActive = true;
      options?.onStart?.();
    };

    audio.onended = () => {
      isAudioActive = false;
      currentAudio = null;
      options?.onEnd?.();
    };

    audio.onerror = (e) => {
      console.warn('[AgroEndure Audio] Proxy audio failed, attempting direct Google TTS:', e);
      currentAudio = null;
      playDirectGoogleTTS(text, options);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[AgroEndure Audio] Audio play promise rejected, trying fallback:', err);
        currentAudio = null;
        playDirectGoogleTTS(text, options);
      });
    }
  } catch (err) {
    console.warn('[AgroEndure Audio] Error creating Audio element, falling back:', err);
    playDirectGoogleTTS(text, options);
  }
}

/**
 * Stops any active speech or audio playback immediately.
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined') {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (e) {}
      currentAudio = null;
    }
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
      currentUtterance = null;
    }
  }
  isAudioActive = false;
}

/**
 * Checks if speech or audio is currently active.
 */
export function isSpeaking(): boolean {
  if (isAudioActive) return true;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

/**
 * Returns instant Urdu dashboard briefing without network delay, ensuring prompt audio playback on click.
 */
export function getInstantDashboardBriefingUrdu(
  role: 'buyer' | 'seller',
  metrics: {
    activeListings: number;
    activeNegotiations: number;
    topBid: number;
    availableCrops: number;
    userName?: string;
  }
): string {
  const name = metrics.userName ? ` محترم ${metrics.userName}` : '';

  if (role === 'seller') {
    const bidStr = metrics.topBid > 0 ? `آپ کی فصل پر سب سے بڑی بولی ${metrics.topBid.toLocaleString()} روپے ہے۔` : '';
    return `خوش آمدید${name}! آپ کے پاس کل ${metrics.activeListings} فعال فصلیں لسٹ ہیں، اور ${metrics.activeNegotiations} خریداروں کے ساتھ تجارتی مذاکرات جاری ہیں۔ ${bidStr} نئی فصل لسٹ کرنے کے لیے مائیک کا بٹن دبائیں۔`;
  } else {
    return `خوش آمدید${name}! منڈی میں آج ${metrics.availableCrops} تازہ فصلیں خریداری کے لیے دستیاب ہیں۔ آپ کے ${metrics.activeNegotiations} کسانوں کے ساتھ مذاکرات جاری ہیں۔ بولیاں لگانے کے لیے منڈی براؤز کریں۔`;
  }
}

/**
 * Generates dynamic Urdu dashboard briefing for Farmer or Buyer.
 * Uses Gemini AI if key available, with smart template fallback.
 */
export async function generateDashboardBriefingUrdu(
  role: 'buyer' | 'seller',
  metrics: {
    activeListings: number;
    activeNegotiations: number;
    topBid: number;
    availableCrops: number;
    userName?: string;
  }
): Promise<string> {
  const name = metrics.userName ? ` محترم ${metrics.userName}` : '';

  // 1. Template generation
  let briefing = '';
  if (role === 'seller') {
    const bidStr = metrics.topBid > 0 ? `آپ کی فصل پر سب سے بڑی بولی ${metrics.topBid.toLocaleString()} روپے ہے۔` : '';
    briefing = `خوش آمدید${name}! آپ کے پاس کل ${metrics.activeListings} فعال فصلیں لسٹ ہیں، اور ${metrics.activeNegotiations} خریداروں کے ساتھ تجارتی مذاکرات جاری ہیں۔ ${bidStr} نئی فصل لسٹ کرنے کے لیے مائیک کا بٹن دبائیں۔`;
  } else {
    briefing = `خوش آمدید${name}! منڈی میں آج ${metrics.availableCrops} تازہ فصلیں خریداری کے لیے دستیاب ہیں۔ آپ کے ${metrics.activeNegotiations} کسانوں کے ساتھ مذاکرات جاری ہیں۔ بولیاں لگانے کے لیے منڈی براؤز کریں۔`;
  }

  // 2. Enhance with Gemini if API available
  if (GEMINI_API_KEY) {
    try {
      const prompt = `You are the AgroEndure Urdu voice assistant for Pakistani farmers.
Generate a friendly, spoken Urdu briefing (maximum 2 sentences) for a ${role === 'seller' ? 'farmer' : 'grain buyer'}.
Stats:
- Role: ${role}
- Active crops: ${metrics.activeListings}
- Negotiating deals: ${metrics.activeNegotiations}
- Top bid: PKR ${metrics.topBid}
- Available crops in market: ${metrics.availableCrops}

Rules:
- Speak in respectful, natural Pakistani Urdu (Nastaliq characters).
- Return ONLY the Urdu sentence, nothing else.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 120 },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (geminiText && /[\u0600-\u06FF]/.test(geminiText)) {
          return geminiText;
        }
      }
    } catch (err) {
      console.warn('Gemini briefing generation notice, using template fallback:', err);
    }
  }

  return briefing;
}

/**
 * Generates dynamic Urdu voice summary of legal agreement terms.
 */
export function generateAgreementAudioSummaryUrdu(
  buyerName: string,
  sellerName: string,
  productName: string,
  quantity: string,
  pricePerUnit: string,
  totalAmount: string,
  deliveryLocation: string,
  deliveryDate: string,
  paymentMethod: string
): string {
  return `یہ تجارتی معاہدہ خریدار ${buyerName} اور کسان ${sellerName} کے درمیان طے پایا ہے۔ فصل: ${productName}، مقدار: ${quantity}، قیمت: ${pricePerUnit}، کل مالیت: ${totalAmount} روپے ہے۔ ترسیل کا مقام ${deliveryLocation} ہے اور تاریخ ترسیل ${deliveryDate} ہے۔ ادائیگی کا طریقہ ${paymentMethod} ہے۔ دونوں فریقین شرائط کی تصدیق کے لیے بائیو میٹرک تصدیق کریں۔`;
}
