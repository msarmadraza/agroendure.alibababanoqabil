# 🌾 AgroEndure

An AI-powered agricultural marketplace for Pakistani farmers, built with React Native + Expo.

## Features

- 🛒 **Marketplace** — Browse crop listings (Rice, Wheat, Cotton, etc.)
- 🎙️ **AI Voice Listing Wizard** — Sellers create listings by speaking in Urdu/Roman Urdu
- 🛡️ **CNIC Identity Verification** — AI vision OCR extracts Pakistani CNIC details before sellers can publish
- 💬 **AI Deal Copilot** — Real-time agreement term extraction from Urdu/English negotiation chats
- 📝 **Agreement Review** — Formal trade agreements generated from chat conversations
- 🔄 **Cross-Tab Live Demo** — Buyer and seller views synced in real-time across browser tabs

## Tech Stack

- **React Native + Expo** (Expo Router v3)
- **Supabase** — Database, Auth, Storage, Realtime
- **Google Gemini API** — AI listing assistant + deal copilot
- **Novita AI** (`qwen/qwen3-vl-235b-a22b-instruct`) — CNIC OCR
- **TypeScript**

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create a `.env.local` file:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_NOVITA_API_KEY=your_novita_api_key
```

### 3. Start the OCR proxy server (Terminal 1)
```bash
node ocrServer.js
```

### 4. Start the Expo app (Terminal 2)
```bash
npx expo start --web
```

App runs at: `http://localhost:8081`

## Project Structure

```
app/           — Expo Router screens
components/    — Reusable UI components
services/      — Supabase, Gemini, auth, trade logic
types/         — TypeScript type definitions
supabase/      — SQL migrations
ocrServer.js   — Node.js OCR proxy server (port 3001)
```

## License

Private — All rights reserved.
