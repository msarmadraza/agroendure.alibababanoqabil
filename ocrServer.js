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

function splitTextForTTS(text, maxLen = 140) {
  if (text.length <= maxLen) return [text];
  const parts = [];
  const sentences = text.split(/([۔!?؟\n,،]+)/);
  let current = '';
  for (const piece of sentences) {
    if ((current + piece).length <= maxLen) {
      current += piece;
    } else {
      if (current.trim()) parts.push(current.trim());
      current = piece;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
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

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:3001'}`);

  if (req.method === 'GET' && urlObj.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'AgroEndure OCR & TTS Proxy' }));
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/tts') {
    const text = urlObj.searchParams.get('text') || '';
    const lang = urlObj.searchParams.get('lang') || 'ur';
    if (!text) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing text parameter' }));
      return;
    }

    (async () => {
      try {
        const chunks = splitTextForTTS(text, 140);
        const buffers = [];

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
          const resp = await fetch(googleUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });

          if (resp.ok) {
            const ab = await resp.arrayBuffer();
            buffers.push(Buffer.from(ab));
          }
        }

        if (buffers.length === 0) {
          throw new Error('No audio buffers received from TTS service');
        }

        const combinedAudio = Buffer.concat(buffers);
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Length': combinedAudio.length,
          'Cache-Control': 'public, max-age=86400',
        });
        res.end(combinedAudio);
      } catch (err) {
        console.warn('TTS proxy error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    })();
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/ocr') {
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
