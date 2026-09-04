import { AIListingResponse, WizardQuestionType } from '@/types/listingWizard';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

// Model fallback chain: newest flash models first (gemini-1.5-flash is retired)
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest'];

/**
 * AgroEndure AI Listing Assistant.
 * Processes a farmer's spoken/typed answer for one wizard question
 * (crop name, quantity, or quality) using Gemini, with a smart
 * Roman Urdu / Urdu local fallback parser.
 */
export async function processListingQuestionResponse(
  questionType: WizardQuestionType,
  inputText: string
): Promise<AIListingResponse> {
  const trimmed = inputText.trim();

  // Try direct Gemini API if key is available
  if (GEMINI_API_KEY) {
    for (const model of GEMINI_MODELS) {
      try {
        const result = await callGemini(model, questionType, trimmed);
        if (result) return result;
      } catch (err) {
        console.warn(`Gemini ${model} call warning, trying next:`, err);
      }
    }
  }

  // Local Smart Fallback Parser
  return fallbackParseListingResponse(questionType, trimmed);
}

async function callGemini(
  model: string,
  questionType: WizardQuestionType,
  trimmed: string
): Promise<AIListingResponse | null> {
  const prompt = `
You are the AgroEndure AI Listing Assistant for Pakistani farmers.
Analyze the user's response for question type: "${questionType}".
User input: "${trimmed}"

Special Instructions for Pakistani Spoken Terms & Roman Urdu:
* Convert Roman Urdu spoken numbers into numeric values accurately:
  - "charr soo", "char sau", "chaar soo", "400", "چار سو" => 400
  - "paanch soo", "panch sau", "500", "پانچ سو" => 500
  - "teen soo", "teen sau", "300", "تین سو" => 300
  - "do soo", "do sau", "200", "دو سو" => 200
  - "aik sau", "ek soo", "100", "ایک سو" => 100
  - "maan", "mann", "man", "من" => unit "Mann"
  - "kg", "kilo", "کلو" => unit "KG"
  - "ton", "ٹن" => unit "Ton"
* Extract quality grades flexibly regardless of word order:
  - "quality b grade", "b grade", "grade b", "b-grade", "medium", "درمیانی" => "Grade B"
  - "quality a grade", "a grade", "grade a", "a-grade", "premium", "بہترین" => "Grade A"
  - "quality c grade", "c grade", "grade c", "c-grade", "عام" => "Grade C"

Respond with ONLY valid JSON matching this schema:
For question_type "crop_name":
{
  "success": true,
  "question_type": "crop_name",
  "extracted_value": {
    "crop_name": "Basmati Rice",
    "original_response": "${trimmed}",
    "language": "ur"
  },
  "display_value": "Basmati Rice",
  "confidence": 0.95,
  "needs_clarification": false,
  "clarification_question": null
}

For question_type "quantity":
If quantity and unit are found (e.g. 400 Mann, 100 Mann, 500 KG, 10 Ton, 50 Quintal):
{
  "success": true,
  "question_type": "quantity",
  "extracted_value": {
    "quantity": 400,
    "unit": "Mann",
    "original_response": "${trimmed}"
  },
  "display_value": "400 Mann",
  "confidence": 0.98,
  "needs_clarification": false,
  "clarification_question": null
}

If unit is missing (e.g. user only said "400" or "100"):
{
  "success": true,
  "question_type": "quantity",
  "extracted_value": null,
  "display_value": null,
  "confidence": 0.45,
  "needs_clarification": true,
  "clarification_question": "آپ نے مقدار بتائی ہے۔ براہ کرم یونٹ بھی بتائیں، جیسے من یا کلو۔"
}

For question_type "quality":
{
  "success": true,
  "question_type": "quality",
  "extracted_value": {
    "quality": "Grade B",
    "quality_description": "Seller described as B Grade quality",
    "original_response": "${trimmed}"
  },
  "display_value": "Grade B",
  "confidence": 0.95,
  "needs_clarification": false,
  "clarification_question": null
}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
      }),
    }
  );

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson) as AIListingResponse;
  if (parsed && parsed.question_type) {
    return parsed;
  }
  return null;
}

function parseUrduQuantityAndUnit(input: string): { quantity: number | null; unit: string | null } {
  const lower = input.toLowerCase();

  // 1. Direct digits
  let num: number | null = null;
  const numMatch = input.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    num = parseFloat(numMatch[1]);
  }

  // 2. Roman Urdu & Urdu Number Words
  if (num === null) {
    if (
      lower.includes('charr soo') ||
      lower.includes('char sau') ||
      lower.includes('chaar sau') ||
      lower.includes('char soo') ||
      lower.includes('chaar soo') ||
      lower.includes('چار سو')
    ) {
      num = 400;
    } else if (
      lower.includes('paanch soo') ||
      lower.includes('panch sau') ||
      lower.includes('paanch sau') ||
      lower.includes('panch soo') ||
      lower.includes('پانچ سو')
    ) {
      num = 500;
    } else if (
      lower.includes('teen soo') ||
      lower.includes('teen sau') ||
      lower.includes('تین سو')
    ) {
      num = 300;
    } else if (lower.includes('do soo') || lower.includes('do sau') || lower.includes('دو سو')) {
      num = 200;
    } else if (
      lower.includes('aik sau') ||
      lower.includes('ek sau') ||
      lower.includes('ek soo') ||
      lower.includes('aik soo') ||
      lower.includes('ایک سو')
    ) {
      num = 100;
    } else if (lower.includes('chhe sau') || lower.includes('che sau') || lower.includes('چھ سو')) {
      num = 600;
    } else if (lower.includes('saat sau') || lower.includes('سات سو')) {
      num = 700;
    } else if (lower.includes('aath sau') || lower.includes('آٹھ سو')) {
      num = 800;
    } else if (lower.includes('nau sau') || lower.includes('no sau') || lower.includes('نو سو')) {
      num = 900;
    } else if (lower.includes('hazaar') || lower.includes('hazar') || lower.includes('ہزار')) {
      num = 1000;
    } else if (lower.includes('pachaas') || lower.includes('pachas') || lower.includes('پچاس')) {
      num = 50;
    }
  }

  // Unit parsing
  let unit: string | null = null;
  if (lower.includes('mann') || lower.includes('من') || lower.includes('maan') || lower.includes('man')) {
    unit = 'Mann';
  } else if (lower.includes('kg') || lower.includes('کلو') || lower.includes('kilo') || lower.includes('kilogram')) {
    unit = 'KG';
  } else if (lower.includes('ton') || lower.includes('ٹن')) {
    unit = 'Ton';
  } else if (lower.includes('quintal') || lower.includes('کوئنٹل')) {
    unit = 'Quintal';
  }

  return { quantity: num, unit };
}

function parseQualityGrade(input: string): string {
  const lower = input.toLowerCase();

  // Flexible B grade patterns: "b grade", "grade b", "b-grade", "quality b grade", "b quality"
  if (
    lower.includes('b grade') ||
    lower.includes('grade b') ||
    lower.includes('b-grade') ||
    lower.includes('grade-b') ||
    lower.includes('class b') ||
    lower.includes('b class') ||
    lower.includes('b quality') ||
    lower.includes('darmiyani') ||
    lower.includes('der meny') ||
    lower.includes('درمیانی') ||
    lower.includes('medium')
  ) {
    return 'Grade B';
  }

  // Flexible C grade patterns
  if (
    lower.includes('c grade') ||
    lower.includes('grade c') ||
    lower.includes('c-grade') ||
    lower.includes('grade-c') ||
    lower.includes('class c') ||
    lower.includes('c quality') ||
    lower.includes('aam') ||
    lower.includes('عام')
  ) {
    return 'Grade C';
  }

  // Flexible A grade patterns
  if (
    lower.includes('a grade') ||
    lower.includes('grade a') ||
    lower.includes('a-grade') ||
    lower.includes('grade-a') ||
    lower.includes('class a') ||
    lower.includes('a class') ||
    lower.includes('a quality') ||
    lower.includes('premium') ||
    lower.includes('بہترین') ||
    lower.includes('behtreen') ||
    lower.includes('aala') ||
    lower.includes('اعلی')
  ) {
    return 'Grade A';
  }

  return 'Good Quality';
}

function fallbackParseListingResponse(
  questionType: WizardQuestionType,
  input: string
): AIListingResponse {
  const lower = input.toLowerCase();

  if (questionType === 'crop_name') {
    let crop = 'Basmati Rice';
    if (lower.includes('wheat') || lower.includes('گندم') || lower.includes('gandum')) {
      crop = 'Wheat (گندم)';
    } else if (lower.includes('cotton') || lower.includes('کپاس') || lower.includes('kapas')) {
      crop = 'Cotton (کپاس)';
    } else if (
      lower.includes('rice') ||
      lower.includes('چاول') ||
      lower.includes('chawal') ||
      lower.includes('basmati')
    ) {
      crop = 'Basmati Rice (باسمتی چاول)';
    } else if (lower.includes('sugarcane') || lower.includes('گنا') || lower.includes('ganna')) {
      crop = 'Sugarcane (گنا)';
    } else if (lower.includes('corn') || lower.includes('مکئی') || lower.includes('makkai')) {
      crop = 'Corn (مکئی)';
    } else if (lower.includes('potato') || lower.includes('آلو') || lower.includes('aloo')) {
      crop = 'Potato (آلو)';
    } else if (input.length > 2) {
      crop = input;
    }

    return {
      success: true,
      question_type: 'crop_name',
      extracted_value: {
        crop_name: crop,
        original_response: input,
        language: 'ur',
      },
      display_value: crop,
      confidence: 0.9,
      needs_clarification: false,
      clarification_question: null,
    };
  }

  if (questionType === 'quantity') {
    const { quantity, unit } = parseUrduQuantityAndUnit(input);

    if (quantity !== null && !unit) {
      return {
        success: true,
        question_type: 'quantity',
        extracted_value: null,
        display_value: null,
        confidence: 0.45,
        needs_clarification: true,
        clarification_question: `آپ نے ${quantity} مقدار بتائی ہے۔ براہ کرم یونٹ بھی بتائیں، جیسے من یا کلو۔`,
      };
    }

    if (quantity === null) {
      return {
        success: false,
        question_type: 'quantity',
        extracted_value: null,
        display_value: null,
        confidence: 0.3,
        needs_clarification: true,
        clarification_question: 'مقدار اور یونٹ بتائیں، مثلاً: 400 من یا 50 کلو',
      };
    }

    return {
      success: true,
      question_type: 'quantity',
      extracted_value: {
        quantity,
        unit,
        original_response: input,
      },
      display_value: `${quantity} ${unit}`,
      confidence: 0.95,
      needs_clarification: false,
      clarification_question: null,
    };
  }

  // Quality fallback
  const qualityGrade = parseQualityGrade(input);

  return {
    success: true,
    question_type: 'quality',
    extracted_value: {
      quality: qualityGrade,
      quality_description: input,
      confidence: 0.9,
      original_response: input,
    },
    display_value: qualityGrade,
    confidence: 0.9,
    needs_clarification: false,
    clarification_question: null,
  };
}
