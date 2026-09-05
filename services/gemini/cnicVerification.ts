import { CNICExtractionResult } from '@/types/identityVerification';
import { translateEnglishNameToUrdu } from './nameTranslationService';

const NOVITA_API_URL = 'https://api.novita.ai/v3/openai/chat/completions';
const NOVITA_API_KEY = process.env.EXPO_PUBLIC_NOVITA_API_KEY || process.env.NOVITA_API_KEY || '';
const MODEL = 'qwen/qwen3-vl-235b-a22b-instruct';

async function toBase64DataUrl(uri: string): Promise<string> {
  if (uri.startsWith('data:image')) {
    return uri;
  }

  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('FileReader result was not a string'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Failed to convert image URI to base64:', err);
    return uri;
  }
}

const CNIC_EXTRACTION_PROMPT = `You are a Pakistani CNIC (national identity card) document analyzer.

Analyze the provided image and determine if it is a valid Pakistani CNIC document.

Extract the following information if visible:
1. Full name of the card holder in English / Romanized script
2. Full name of the card holder in Urdu script (e.g. محمد احمد علی). If not written in Urdu on the card, transliterate the English name into standard Urdu script.
3. CNIC number (format: XXXXX-XXXXXXX-X, 13 digits with dashes)

Return your analysis as a JSON object with EXACTLY these fields:
{
  "document_detected": true or false,
  "document_type": "pakistani_cnic" or null,
  "is_readable": true or false,
  "holder_name": "extracted English name" or null,
  "holder_name_urdu": "نام اردو رسم الخط میں" or null,
  "cnic_number": "XXXXX-XXXXXXX-X" or null,
  "confidence": 0.0 to 1.0,
  "issues": ["list of issues found"] or []
}

Rules:
- Only return valid JSON, no other text
- If the image is not a CNIC, set document_detected to false
- If text is not readable, set is_readable to false and explain in issues
- CNIC numbers must be 13 digits in format XXXXX-XXXXXXX-X
- Provide both holder_name (English) and holder_name_urdu (Urdu)
- Set confidence based on how clearly you could read the document`;

export async function processCNICVerificationImage(
  imageBase64OrUri: string
): Promise<CNICExtractionResult> {
  const base64DataUrl = await toBase64DataUrl(imageBase64OrUri);

  try {
    const response = await fetch(NOVITA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NOVITA_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: CNIC_EXTRACTION_PROMPT,
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64DataUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Novita AI API error:', response.status, errorText);
      return buildFallbackResult();
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.warn('Novita AI returned empty content');
      return buildFallbackResult();
    }

    const result = await parseOcrResponse(content);
    if (result.holder_name && (!result.holder_name_urdu || !/[\u0600-\u06FF]/.test(result.holder_name_urdu))) {
      result.holder_name_urdu = await translateEnglishNameToUrdu(result.holder_name);
    }
    return result;
  } catch (err) {
    console.warn('Novita AI CNIC OCR error:', err);
    return buildFallbackResult();
  }
}

async function parseOcrResponse(content: string): Promise<CNICExtractionResult> {
  try {
    const cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleaned) as any;

    if (typeof parsed.document_detected !== 'boolean') {
      return buildFallbackResult();
    }

    let urduName = parsed.holder_name_urdu || null;
    if (!urduName && parsed.holder_name) {
      urduName = await translateEnglishNameToUrdu(parsed.holder_name);
    }

    return {
      document_detected: parsed.document_detected,
      document_type: parsed.document_type || 'pakistani_cnic',
      is_readable: parsed.is_readable ?? true,
      holder_name: parsed.holder_name || null,
      holder_name_urdu: urduName,
      cnic_number: parsed.cnic_number || null,
      confidence: parsed.confidence ?? 0.75,
      issues: parsed.issues || [],
    };
  } catch (err) {
    console.warn('Failed to parse Novita AI OCR response:', err);
    return buildFallbackResult();
  }
}

function buildFallbackResult(): CNICExtractionResult {
  return {
    document_detected: true,
    document_type: 'pakistani_cnic',
    is_readable: true,
    holder_name: null,
    cnic_number: null,
    confidence: 0.7,
    issues: ['OCR could not fully read the document. Please enter your name and CNIC number manually.'],
  };
}
