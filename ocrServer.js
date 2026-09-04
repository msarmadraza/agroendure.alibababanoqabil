// AgroEndure OCR Proxy Server
// Run: node ocrServer.js
// Listens at http://localhost:3001

const http = require('http');
const PORT = 3001;
const NOVITA_API_KEY = process.env.EXPO_PUBLIC_NOVITA_API_KEY || process.env.NOVITA_API_KEY || '';

function parseOCRText(rawText) {
  if (!rawText) return null;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && (parsed.holder_name || parsed.cnic_number)) {
        return {
          document_detected: true,
          document_type: 'pakistani_cnic',
          is_readable: true,
          holder_name: parsed.holder_name || null,
          cnic_number: parsed.cnic_number || null,
          confidence: 0.98,
          issues: [],
        };
      }
    }
  } catch (e) {}

  let cnicNumber = null;
  const cnicMatch = rawText.match(/\b\d{5}[-\s]?\d{7}[-\s]?\d{1}\b/);
  if (cnicMatch) {
    const digits = cnicMatch[0].replace(/\D/g, '');
    if (digits.length === 13) {
      cnicNumber = `${digits.substring(0, 5)}-${digits.substring(5, 12)}-${digits.substring(12, 13)}`;
    }
  }

  let holderName = null;
  const nameMatch = rawText.match(/(?:Name|Holder|Citizen|نام)[:\s\-]+([A-Za-z\s]{3,35})/i);
  if (nameMatch) holderName = nameMatch[1].trim();

  if (cnicNumber || holderName) {
    return {
      document_detected: true,
      document_type: 'pakistani_cnic',
      is_readable: true,
      holder_name: holderName,
      cnic_number: cnicNumber,
      confidence: 0.95,
      issues: [],
    };
  }
  return null;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'AgroEndure OCR Proxy' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/ocr') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { base64DataUrl } = JSON.parse(body);
        const prompt = `You are AgroEndure Identity Document Extraction Engine.
Analyze this image of a Pakistani CNIC (Computerized National Identity Card).
Extract the holder's full English name and 13-digit CNIC number (XXXXX-XXXXXXX-X format).
Respond with ONLY valid JSON (no markdown, no extra text):
{"document_detected":true,"document_type":"pakistani_cnic","is_readable":true,"holder_name":"Full Name Here","cnic_number":"35202-1234567-1","confidence":0.98,"issues":[]}`;

        const models = [
          'qwen/qwen3-vl-235b-a22b-instruct',
          'zai-org/glm-5v-turbo',
          'deepseek/deepseek-v4-flash-vision-exp',
        ];

        let result = null;
        for (const model of models) {
          try {
            console.log(`Trying model: ${model}`);
            const novitaRes = await fetch('https://api.novita.ai/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${NOVITA_API_KEY}`,
              },
              body: JSON.stringify({
                model,
                messages: [
                  {
                    role: 'user',
                    content: [
                      { type: 'text', text: prompt },
                      { type: 'image_url', image_url: { url: base64DataUrl } },
                    ],
                  },
                ],
                max_tokens: 1000,
                temperature: 0.1,
              }),
            });

            if (novitaRes.ok) {
              const data = await novitaRes.json();
              const rawText = data?.choices?.[0]?.message?.content || '';
              console.log(`Model ${model} response:`, rawText.substring(0, 200));
              result = parseOCRText(rawText);
              if (result && (result.holder_name || result.cnic_number)) break;
            }
          } catch (e) {
            console.warn(`${model} error:`, e.message);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify(
            result || {
              document_detected: true,
              document_type: 'pakistani_cnic',
              is_readable: true,
              holder_name: null,
              cnic_number: null,
              confidence: 0.7,
              issues: ['Could not extract data. Please enter your details manually.'],
            }
          )
        );
      } catch (err) {
        console.error('OCR error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🌾 AgroEndure OCR Proxy running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 OCR endpoint: POST http://localhost:${PORT}/api/ocr\n`);
});
