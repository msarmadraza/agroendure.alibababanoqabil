/**
 * AgroEndure AI Name Transliteration Service.
 * Transliterates Pakistani English / Roman names from CNIC into authentic Urdu Nastaliq script.
 * e.g., "MUHAMMAD AHMAD ALI" -> "محمد احمد علی"
 */

const NOVITA_API_URL = 'https://api.novita.ai/v3/openai/chat/completions';
const NOVITA_API_KEY = process.env.EXPO_PUBLIC_NOVITA_API_KEY || process.env.NOVITA_API_KEY || '';

const COMMON_PAKISTANI_NAMES: Record<string, string> = {
  muhammad: 'محمد',
  mohammad: 'محمد',
  mohammed: 'محمد',
  md: 'محمد',
  ahmad: 'احمد',
  ahmed: 'احمد',
  ali: 'علی',
  khan: 'خان',
  chaudhry: 'چوہدری',
  choudhary: 'چوہدری',
  ch: 'چوہدری',
  tariq: 'طارق',
  tarik: 'طارق',
  bilal: 'بلال',
  hassan: 'حسن',
  hasan: 'حسن',
  hussain: 'حسین',
  husain: 'حسین',
  malik: 'ملک',
  raza: 'رضا',
  asghar: 'اصغر',
  akbar: 'اکبر',
  usman: 'عثمان',
  othman: 'عثمان',
  umar: 'عمر',
  omar: 'عمر',
  fatima: 'فاطمہ',
  ayesha: 'عائشہ',
  zainab: 'زینب',
  gul: 'گل',
  shah: 'شاہ',
  syed: 'سید',
  sayyid: 'سید',
  butt: 'بٹ',
  jutt: 'جٹ',
  jat: 'جٹ',
  gujjar: 'گجر',
  rajput: 'راجپوت',
  rana: 'رانا',
  mian: 'میاں',
  sheikh: 'شیخ',
  shaikh: 'شیخ',
  sardar: 'سردار',
  nawab: 'نواب',
  karim: 'کریم',
  kareem: 'کریم',
  rahim: 'رحیم',
  rehman: 'رحمان',
  rahman: 'رحمان',
  abdullah: 'عبداللہ',
  abdul: 'عبد',
  qasim: 'قاسم',
  hamza: 'حمزہ',
  zeeshan: 'ذیشان',
  imran: 'عمران',
  naveed: 'نوید',
  navid: 'نوید',
  farooq: 'فاروق',
  rashid: 'راشد',
  sajid: 'ساجد',
  majid: 'ماجد',
  khalid: 'خالد',
  javed: 'جاوید',
  javaid: 'جاوید',
  iqbal: 'اقبال',
  nawaz: 'نواز',
  sharif: 'شریف',
  kashif: 'کاشف',
  asif: 'آصف',
  babar: 'بابر',
  rizwan: 'رضوان',
  saeed: 'سعید',
  shahid: 'شاہد',
  waqas: 'وقاص',
  irfan: 'عرفان',
  kamran: 'کامران',
  arshad: 'ارشد',
  ashraf: 'اشرف',
  ghulam: 'غلام',
  bashir: 'بشیر',
  basheer: 'بشیر',
  munir: 'منیر',
  nazir: 'نذیر',
  tanveer: 'تنویر',
  tanvir: 'تنویر',
  nadeem: 'ندیم',
  waseem: 'وسیم',
  nasir: 'ناصر',
  zahid: 'زاہد',
  faisal: 'فیصل',
  zubair: 'زبیر',
  anwar: 'انور',
  akram: 'اکرم',
  aslam: 'اسلم',
  azhar: 'اظہر',
  mazhar: 'مظہر',
  afzal: 'افضل',
  amjad: 'امجد',
  shabbir: 'شبیر',
  abbasi: 'عباسی',
  zia: 'ضیاء',
  ziaur: 'ضیاء الرحمان',
  mustafa: 'مصطفیٰ',
  murtaza: 'مرتضیٰ',
  sultan: 'سلطان',
  alam: 'عالم',
  jamil: 'جمیل',
  shafiq: 'شفیق',
  rafiq: 'رفیق',
  attique: 'عتیق',
  atiq: 'عتیق',
  salman: 'سلمان',
  adnan: 'عدنان',
  mehmood: 'محمود',
  mahmood: 'محمود',
};

/**
 * Fast local dictionary transliterator for Pakistani names.
 */
export function transliterateNameLocally(englishName: string): string {
  if (!englishName || !englishName.trim()) return '';

  const clean = englishName.trim();
  // If already in Urdu script, return as is
  if (/[\u0600-\u06FF]/.test(clean)) {
    return clean;
  }

  const parts = clean.split(/[\s,._-]+/);
  const urduParts = parts.map((part) => {
    const lower = part.toLowerCase();
    if (COMMON_PAKISTANI_NAMES[lower]) {
      return COMMON_PAKISTANI_NAMES[lower];
    }
    // Return original if no mapping exists
    return part;
  });

  return urduParts.join(' ');
}

/**
 * AI-powered transliteration using Novita / Gemini LLM with local dictionary fallback.
 */
export async function translateEnglishNameToUrdu(englishName: string): Promise<string> {
  const localUrdu = transliterateNameLocally(englishName);

  // If local dictionary translated every word (no English chars remaining), return it immediately
  if (localUrdu && !/[a-zA-Z]/.test(localUrdu)) {
    return localUrdu;
  }

  if (!NOVITA_API_KEY) {
    return localUrdu || englishName;
  }

  try {
    const prompt = `Transliterate the following Pakistani person's name into standard Urdu Nastaliq script (اردو رسم الخط).
Output ONLY the Urdu name in Urdu characters, with no punctuation, no English, no explanation.

Name: "${englishName}"
Urdu:`;

    const response = await fetch(NOVITA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NOVITA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-vl-235b-a22b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.0,
        max_tokens: 64,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content && /[\u0600-\u06FF]/.test(content)) {
        return content.replace(/["'\n\r]/g, '').trim();
      }
    }
  } catch (err) {
    console.warn('AI name transliteration failed, using local dictionary:', err);
  }

  return localUrdu || englishName;
}
