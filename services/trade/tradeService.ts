import { supabase } from '@/services/supabase/client';
import { AgreementTerm, ChatMessage, Trade } from '@/types/database';

export async function createOrGetTrade(
  listingId: string,
  sellerId: string,
  buyerId: string
): Promise<Trade | null> {
  const { data: existingTrades } = await supabase
    .from('trades')
    .select('*, listing:listings(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId);

  if (existingTrades && existingTrades.length > 0) {
    return existingTrades[0];
  }

  const { data: newTrade, error } = await supabase
    .from('trades')
    .insert({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
      status: 'negotiating',
    })
    .select('*, listing:listings(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)')
    .single();

  if (error) {
    console.error('Error creating trade:', error);
    throw error;
  }

  if (newTrade && newTrade.listing) {
    await supabase.from('agreement_terms').insert([
      {
        trade_id: newTrade.id,
        field_name: 'product_name',
        value: newTrade.listing.product_name,
        status: 'proposed',
        confidence: 1.0,
      },
      {
        trade_id: newTrade.id,
        field_name: 'quantity',
        value: newTrade.listing.quantity,
        status: 'proposed',
        confidence: 1.0,
      },
      {
        trade_id: newTrade.id,
        field_name: 'price_per_unit',
        value: newTrade.listing.price,
        status: 'proposed',
        confidence: 1.0,
      },
    ]);
  }

  return newTrade;
}

export async function fetchTradeById(tradeId: string): Promise<Trade | null> {
  const { data, error } = await supabase
    .from('trades')
    .select('*, listing:listings(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)')
    .eq('id', tradeId)
    .single();

  if (error) {
    console.error('Error fetching trade:', error);
    return null;
  }
  return data;
}

export async function fetchUserTrades(userId: string): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*, listing:listings(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching user trades:', error);
    return [];
  }
  return data || [];
}

export async function fetchTradeMessages(tradeId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, sender:profiles(*)')
    .eq('trade_id', tradeId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching trade messages:', error);
    return [];
  }
  return data || [];
}

export async function sendChatMessage(
  tradeId: string,
  senderId: string,
  content: string,
  messageType: 'text' | 'voice' | 'system' | 'ai_assistant' = 'text',
  audioUrl: string | null = null,
  transcription: string | null = null
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      trade_id: tradeId,
      sender_id: senderId,
      content,
      message_type: messageType,
      audio_url: audioUrl,
      transcription,
      language: 'en',
    })
    .select('*, sender:profiles(*)')
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }
  return data;
}

export async function fetchAgreementTerms(tradeId: string): Promise<AgreementTerm[]> {
  const { data, error } = await supabase
    .from('agreement_terms')
    .select('*')
    .eq('trade_id', tradeId);

  if (error) {
    console.error('Error fetching agreement terms:', error);
    return [];
  }
  return data || [];
}

export async function confirmTrade(
  tradeId: string,
  role: 'buyer' | 'seller'
): Promise<void> {
  const { data: trade, error: fetchError } = await supabase
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .single();

  if (fetchError) {
    console.error('Error fetching trade for confirmation:', fetchError);
    throw fetchError;
  }

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (role === 'buyer') {
    updatePayload.buyer_confirmed = true;
    updatePayload.buyer_confirmed_at = new Date().toISOString();
  } else {
    updatePayload.seller_confirmed = true;
    updatePayload.seller_confirmed_at = new Date().toISOString();
  }

  const otherConfirmed =
    role === 'buyer'
      ? trade?.seller_confirmed === true
      : trade?.buyer_confirmed === true;

  if (otherConfirmed) {
    updatePayload.status = 'confirmed';
  } else {
    updatePayload.status = 'pending_confirmation';
  }

  const { error: updateError } = await supabase
    .from('trades')
    .update(updatePayload)
    .eq('id', tradeId);

  if (updateError) {
    console.error('Error confirming trade:', updateError);
    throw updateError;
  }
}
