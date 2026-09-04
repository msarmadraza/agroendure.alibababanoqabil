(async () => {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  const prompt = [
    'You are the AgroEndure AI Listing Assistant for Pakistani farmers.',
    'Analyze the user response for question type: quantity.',
    'User input: "chaar soo mann"',
    'Respond with ONLY valid JSON:',
    '{"success":true,"question_type":"quantity","extracted_value":{"quantity":400,"unit":"Mann","original_response":"chaar soo mann"},"display_value":"400 Mann","confidence":0.98,"needs_clarification":false,"clarification_question":null}',
  ].join('\n');

  for (const model of ['gemini-3.6-flash', 'gemini-flash-latest']) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
          }),
        }
      );
      const j = await r.json();
      const txt = j?.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log(`--- ${model} -> STATUS ${r.status}`);
      console.log((txt || JSON.stringify(j)).substring(0, 500));
      if (r.status === 200 && txt) break;
    } catch (e) {
      console.log(`--- ${model} ERR`, e.message);
    }
  }
})();
