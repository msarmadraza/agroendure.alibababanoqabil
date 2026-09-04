import { GeminiAgreementAnalysisResult, AgreementUpdate } from '@/types/agreement';
import { AgreementTerm, ChatMessage } from '@/types/database';
import { supabase } from '@/services/supabase/client';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

const SYSTEM_PROMPT = `
You are AgroEndure Agreement Intelligence Engine.

Your job is to analyze a conversation between an agricultural buyer and seller and maintain an accurate structured representation of their potential transaction.

The conversation may contain Urdu (e.g. میرے پاس 100 من چاول ہیں), Roman Urdu (e.g. 100 mann chawal 5700 final), English, or mixed languages.

Your responsibilities are:
1. Identify transaction terms (product_name, quantity, price_per_unit, delivery_location, delivery_date, payment_method).
2. Distinguish proposals from confirmed agreements (RULE 1: proposals are PROPOSED; RULE 2: explicit confirmations are AGREED).
3. Detect rejected terms.
4. Detect changes to previously discussed terms.
5. Detect conflicts (RULE 3: if conflicting terms are mentioned, set status to CONFLICTING).
6. Identify missing critical information (RULE 4: never invent missing data).
7. Return evidence_message_ids for every extracted or updated term.
8. Preserve numeric values, dates, payment methods, and location names exactly.
9. Correctly understand Pakistani agricultural units (e.g. Mann = 40 kg, Tola) and PKR currency.
10. Return ONLY valid JSON matching the schema.

Important:
Words such as 'maybe', 'can you', 'what about', 'if' indicate proposals or negotiations.
Words such as 'final', 'done', 'agreed', 'confirmed', 'ٹھیک ہے', 'فائنل', 'will be delivered to', 'delivery date is', 'payment via' indicate agreement or agreed terms.
If there is ambiguity, use the status NEGOTIATING or CONFLICTING instead of AGREED.

Required JSON format:
{
  "conversation_summary": "Short summary",
  "agreement_updates": [
    {
      "field_name": "delivery_date | payment_method | delivery_location | product_name | quantity | price_per_unit",
      "previous_value": null,
      "new_value": "10 September 2026",
      "status": "agreed",
      "confidence": 0.95,
      "evidence_message_ids": ["msg-id"],
      "reason": "Buyer and seller agreed on delivery date."
    }
  ],
  "missing_fields": [],
  "conflicting_fields": [],
  "suggested_questions": [],
  "agreement_readiness": {
    "percentage": 100,
    "status": "ready_for_review"
  }
}
`;

export async function analyzeTradeConversation(
  tradeId: string,
  currentState: AgreementTerm[],
  recentMessages: ChatMessage[],
  newMessage: ChatMessage
): Promise<GeminiAgreementAnalysisResult | null> {
  try {
    const allMessages = [...recentMessages];
    if (!allMessages.find((m) => m.id === newMessage.id)) {
      allMessages.push(newMessage);
    }

    const userPrompt = `
CURRENT AGREEMENT STATE:
${JSON.stringify(
  currentState.map((t) => ({ field: t.field_name, value: t.value, status: t.status })),
  null,
  2
)}

RECENT RELEVANT MESSAGES:
${JSON.stringify(
  allMessages.slice(-6).map((m) => ({
    id: m.id,
    sender: m.sender_id,
    content: m.content || m.transcription,
  })),
  null,
  2
)}

NEW MESSAGE:
${JSON.stringify(
  {
    id: newMessage.id,
    sender: newMessage.sender_id,
    content: newMessage.content || newMessage.transcription,
  },
  null,
  2
)}

Analyze conversation and output JSON:
`;

    let result: GeminiAgreementAnalysisResult | null = null;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: SYSTEM_PROMPT }, { text: userPrompt }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim();
          result = JSON.parse(cleanJson);
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, using client-side fallback parsing:', err);
    }

    // Heuristic/Fallback extraction for delivery location, date, and payment terms
    const msgText = (newMessage.content || newMessage.transcription || '').toLowerCase();
    const fallbackUpdates: AgreementUpdate[] = [];

    // 1. Delivery Location extraction pattern
    const locationKeywords = [
      'lahore', 'faisalabad', 'karachi', 'multan', 'rawalpindi', 'gujranwala',
      'peshawar', 'islamabad', 'sargodha', 'sahiwal', 'bahawalpur', 'vehari',
      'okara', 'location', 'delivered to', 'delivery in', 'deliver to',
    ];
    if (locationKeywords.some((kw) => msgText.includes(kw))) {
      let matchedCity = 'Lahore';
      if (msgText.includes('faisalabad')) matchedCity = 'Faisalabad';
      else if (msgText.includes('karachi')) matchedCity = 'Karachi';
      else if (msgText.includes('multan')) matchedCity = 'Multan';
      else if (msgText.includes('rawalpindi')) matchedCity = 'Rawalpindi';
      else if (msgText.includes('gujranwala')) matchedCity = 'Gujranwala';
      else if (msgText.includes('islamabad')) matchedCity = 'Islamabad';
      else if (msgText.includes('lahore')) matchedCity = 'Lahore';
      else if (newMessage.content) matchedCity = newMessage.content;

      const existingLoc = currentState.find((t) => t.field_name === 'delivery_location');
      const isConflict =
        existingLoc &&
        existingLoc.value &&
        String(existingLoc.value).toLowerCase() !== matchedCity.toLowerCase();

      fallbackUpdates.push({
        field_name: 'delivery_location',
        previous_value: existingLoc ? existingLoc.value : null,
        new_value: matchedCity,
        status: isConflict ? 'conflicting' : 'agreed',
        confidence: 0.96,
        evidence_message_ids: [newMessage.id],
        reason: `Delivery location specified as ${matchedCity}.`,
      });
    }

    // 2. Delivery Date extraction pattern
    const dateKeywords = [
      'date', 'tomorrow', 'september', 'october', 'august', 'november', 'december',
      'january', 'february', 'march', 'april', 'may', 'june', 'july', 'days', 'day',
      'week', 'kal', 'parson', 'tareekh', 'tarikh', 'delivery on', 'delivery by',
      'expected date',
    ];
    if (dateKeywords.some((kw) => msgText.includes(kw))) {
      let dateValue = newMessage.content || 'Expected in 2-3 Days';
      if (msgText.includes('tomorrow') || msgText.includes('kal')) {
        dateValue = 'Tomorrow';
      } else if (msgText.includes('parson')) {
        dateValue = 'In 2 Days';
      }

      const existingDate = currentState.find((t) => t.field_name === 'delivery_date');
      fallbackUpdates.push({
        field_name: 'delivery_date',
        previous_value: existingDate ? existingDate.value : null,
        new_value: dateValue,
        status: 'agreed',
        confidence: 0.95,
        evidence_message_ids: [newMessage.id],
        reason: `Delivery date agreed as ${dateValue}.`,
      });
    }

    // 3. Payment Method extraction pattern
    const paymentKeywords = [
      'bank', 'cash', 'easypaisa', 'jazzcash', 'payment', 'pay', 'advance', 'cheque',
      'check', 'online', 'account', 'transfer', 'wasool', 'nqd',
    ];
    if (paymentKeywords.some((kw) => msgText.includes(kw))) {
      let paymentValue = 'Bank Transfer';
      if (msgText.includes('cash')) paymentValue = 'Cash on Delivery';
      else if (msgText.includes('easypaisa')) paymentValue = 'Easypaisa';
      else if (msgText.includes('jazzcash')) paymentValue = 'JazzCash';
      else if (msgText.includes('advance')) paymentValue = 'Advance Payment';
      else if (msgText.includes('cheque') || msgText.includes('check')) paymentValue = 'Cheque';
      else if (msgText.includes('online')) paymentValue = 'Online Transfer';
      else if (newMessage.content) paymentValue = newMessage.content;

      const existingPayment = currentState.find((t) => t.field_name === 'payment_method');
      fallbackUpdates.push({
        field_name: 'payment_method',
        previous_value: existingPayment ? existingPayment.value : null,
        new_value: paymentValue,
        status: 'agreed',
        confidence: 0.95,
        evidence_message_ids: [newMessage.id],
        reason: `Payment method agreed as ${paymentValue}.`,
      });
    }

    // Combine Gemini result with fallback updates
    if (!result) {
      const knownMissing = ['delivery_location', 'delivery_date', 'payment_method'];
      const updatedFields = fallbackUpdates.map((u) => u.field_name);
      const remainingMissing = knownMissing.filter(
        (f) => !currentState.some((ct) => ct.field_name === f) && !updatedFields.includes(f)
      );

      result = {
        conversation_summary: 'Trade terms updated.',
        agreement_updates: fallbackUpdates,
        missing_fields: remainingMissing,
        conflicting_fields: fallbackUpdates.filter((u) => u.status === 'conflicting').map((u) => u.field_name),
        suggested_questions: [
          remainingMissing.includes('delivery_location') ? 'Where will the crop be delivered?' : null,
          remainingMissing.includes('delivery_date') ? 'What is the expected delivery date?' : null,
          remainingMissing.includes('payment_method') ? 'How will payment be made?' : null,
        ].filter(Boolean) as string[],
        agreement_readiness: {
          percentage: Math.round(((currentState.length + fallbackUpdates.length) / 6) * 100),
          status: remainingMissing.length === 0 ? 'ready_for_review' : 'incomplete',
        },
      };
    } else {
      // Merge fallback updates missing from Gemini response
      fallbackUpdates.forEach((fu) => {
        if (!result!.agreement_updates.some((u) => u.field_name === fu.field_name)) {
          result!.agreement_updates.push(fu);
        }
      });
    }

    // Persist agreement terms updates to Supabase asynchronously
    if (result.agreement_updates && result.agreement_updates.length > 0) {
      for (const update of result.agreement_updates) {
        await supabase.from('agreement_terms').upsert(
          {
            trade_id: tradeId,
            field_name: update.field_name,
            value: update.new_value,
            status: update.status,
            confidence: update.confidence || 0.9,
            evidence_message_ids: update.evidence_message_ids || [newMessage.id],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'trade_id,field_name' }
        );
      }
    }

    return result;
  } catch (error) {
    console.error('Error analyzing trade conversation with Gemini:', error);
    return null;
  }
}
