-- AgroEndure Migration 1: Core Schema
-- Run in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT CHECK (role IN ('buyer', 'seller')) NOT NULL DEFAULT 'buyer',
    avatar_url TEXT,
    identity_verified BOOLEAN DEFAULT FALSE,
    identity_verification_status TEXT DEFAULT 'not_started',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    quantity_unit TEXT NOT NULL DEFAULT 'Mann',
    price NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PKR',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'draft')),
    quality TEXT,
    quality_description TEXT,
    product_category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);

CREATE TABLE IF NOT EXISTS public.listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON public.listing_images(listing_id);

CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'negotiating' CHECK (status IN ('negotiating','pending_confirmation','confirmed','cancelled','completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trades_buyer_id ON public.trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trades_seller_id ON public.trades(seller_id);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','voice','system','ai_assistant')),
    content TEXT,
    audio_url TEXT,
    transcription TEXT,
    language TEXT DEFAULT 'ur',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_trade_id ON public.chat_messages(trade_id);

CREATE TABLE IF NOT EXISTS public.agreement_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    value JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','negotiating','agreed','missing','conflicting','rejected')),
    confidence NUMERIC NOT NULL DEFAULT 1.0,
    evidence_message_ids UUID[] DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_by_buyer BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_by_seller BOOLEAN NOT NULL DEFAULT FALSE,
    version INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT unique_trade_field UNIQUE (trade_id, field_name)
);

CREATE TABLE IF NOT EXISTS public.identity_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT DEFAULT 'pakistani_cnic',
    holder_name TEXT,
    cnic_number TEXT,
    verification_status TEXT CHECK (verification_status IN (
        'pending','processing','extracted','user_confirmed','verified','failed'
    )) DEFAULT 'pending',
    extraction_source TEXT CHECK (extraction_source IN ('gemini_extracted','user_edited')) DEFAULT 'gemini_extracted',
    confidence NUMERIC DEFAULT 0.95,
    verification_attempts INTEGER DEFAULT 0,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('voice-messages', 'voice-messages', false),
    ('listing-images', 'listing-images', true),
    ('identity-documents', 'identity-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Active listings viewable" ON public.listings FOR SELECT TO authenticated USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Seller creates listing" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Seller updates listing" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "Public listing images" ON public.listing_images FOR SELECT USING (true);
CREATE POLICY "Seller inserts listing images" ON public.listing_images FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.seller_id = auth.uid()));

CREATE POLICY "Trade participants view" ON public.trades FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyer creates trade" ON public.trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants update trade" ON public.trades FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Trade message view" ON public.chat_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM trades WHERE trades.id = chat_messages.trade_id AND (trades.buyer_id = auth.uid() OR trades.seller_id = auth.uid())));
CREATE POLICY "Participants send message" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM trades WHERE trades.id = chat_messages.trade_id AND (trades.buyer_id = auth.uid() OR trades.seller_id = auth.uid())));

CREATE POLICY "Agreement terms view" ON public.agreement_terms FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM trades WHERE trades.id = agreement_terms.trade_id AND (trades.buyer_id = auth.uid() OR trades.seller_id = auth.uid())));
CREATE POLICY "Agreement terms manage" ON public.agreement_terms FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM trades WHERE trades.id = agreement_terms.trade_id AND (trades.buyer_id = auth.uid() OR trades.seller_id = auth.uid())));

CREATE POLICY "Own identity view" ON public.identity_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own identity insert" ON public.identity_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own identity update" ON public.identity_verifications FOR UPDATE USING (auth.uid() = user_id);

-- Storage policies
CREATE POLICY "Public read listing images" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "Auth upload listing images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Own identity docs" ON storage.objects FOR SELECT USING (bucket_id = 'identity-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Upload identity docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'identity-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agreement_terms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
