import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { ArrowLeft, FileText } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ChatMessage, AgreementTerm, Trade } from '@/types/database';
import {
  fetchTradeById,
  fetchTradeMessages,
  sendChatMessage,
  fetchAgreementTerms,
} from '@/services/trade/tradeService';
import { analyzeTradeConversation } from '@/services/gemini/agreementEngine';
import { transcribeAudioMessage } from '@/services/voice/transcriptionService';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { crossTabSync } from '@/services/trade/crossTabSync';
import {
  loadTradeMessages,
  saveTradeMessage,
  loadTradeTerms,
  saveTradeTerms,
} from '@/services/trade/demoTradeStore';
import { RoleSwitcherHeader } from '@/components/ui/RoleSwitcherHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { AIAssistantCard } from '@/components/agreement/AIAssistantCard';
import { supabase } from '@/services/supabase/client';

export default function TradeChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tradeId = id || 'trade-101';

  const { activeUser } = useDemoAuth();
  if (!activeUser) return null;
  const currentUserId = activeUser.id;

  const [trade, setTrade] = useState<Trade | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadTradeMessages(tradeId));
  const [terms, setTerms] = useState<AgreementTerm[]>(() => loadTradeTerms(tradeId));
  const [missingFields, setMissingFields] = useState<string[]>([
    'delivery_location',
    'delivery_date',
    'payment_method',
  ]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    'Where will the crop be delivered?',
    'What is the expected delivery date?',
    'How will payment be made?',
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Load trade, messages, and agreement terms
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const tradeData = await fetchTradeById(tradeId);
      if (tradeData) setTrade(tradeData);

      const storedMsgs = loadTradeMessages(tradeId);
      if (storedMsgs && storedMsgs.length > 0) {
        setMessages(storedMsgs);
      }

      const storedTerms = loadTradeTerms(tradeId);
      if (storedTerms && storedTerms.length > 0) {
        setTerms(storedTerms);
      }

      const dbMsgs = await fetchTradeMessages(tradeId);
      if (dbMsgs && dbMsgs.length > 0) {
        setMessages((prev) => {
          const map = new Map<string, ChatMessage>();
          prev.forEach((m) => map.set(m.id, m));
          dbMsgs.forEach((m) => map.set(m.id, m));
          return Array.from(map.values());
        });
      }

      const dbTerms = await fetchAgreementTerms(tradeId);
      if (dbTerms && dbTerms.length > 0) {
        setTerms((prev) => {
          const map = new Map<string, AgreementTerm>();
          dbTerms.forEach((t) => map.set(t.field_name, t));
          prev.forEach((t) => map.set(t.field_name, t));
          return Array.from(map.values());
        });
      }

      setLoading(false);
    }
    loadData();
  }, [tradeId]);

  // Subscribe to Supabase Realtime updates
  useEffect(() => {
    const channelName = `trade-${tradeId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `trade_id=eq.${tradeId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const nextMsgs = [...prev, newMsg];
            saveTradeMessage(tradeId, newMsg);
            return nextMsgs;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agreement_terms', filter: `trade_id=eq.${tradeId}` },
        async () => {
          const updated = await fetchAgreementTerms(tradeId);
          if (updated && updated.length > 0) {
            setTerms(updated);
            saveTradeTerms(tradeId, updated);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('Error removing channel in trade:', e);
      }
    };
  }, [tradeId]);

  // Subscribe to Cross-Tab / Cross-Window Dual Sync for Hackathon Live Demo
  useEffect(() => {
    const unsubscribe = crossTabSync.subscribe((payload) => {
      if (payload.tradeId === tradeId) {
        if (payload.type === 'NEW_MESSAGE' && payload.message) {
          const incomingMsg = payload.message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) return prev;
            const next = [...prev, incomingMsg];
            saveTradeMessage(tradeId, incomingMsg);
            return next;
          });
          triggerAIAnalysis(incomingMsg);
        } else if (payload.type === 'TERMS_UPDATED' && payload.terms) {
          setTerms((prev) => {
            const map = new Map<string, AgreementTerm>();
            prev.forEach((t) => map.set(t.field_name, t));
            payload.terms!.forEach((t) => map.set(t.field_name, t));
            const merged = Array.from(map.values());
            saveTradeTerms(tradeId, merged);
            return merged;
          });
        }
      }
    });

    return () => unsubscribe();
  }, [tradeId, messages]);

  // Trigger Gemini AI analysis when a new message is sent
  const triggerAIAnalysis = async (newMessage: ChatMessage) => {
    const updatedMessages = [...messages, newMessage];
    const analysis = await analyzeTradeConversation(tradeId, terms, updatedMessages, newMessage);
    if (analysis) {
      if (analysis.agreement_updates && analysis.agreement_updates.length > 0) {
        setTerms((prevTerms) => {
          const newTermsMap = new Map<string, AgreementTerm>();
          prevTerms.forEach((t) => newTermsMap.set(t.field_name, t));

          analysis.agreement_updates.forEach((update) => {
            const existing = newTermsMap.get(update.field_name);
            newTermsMap.set(update.field_name, {
              id: existing ? existing.id : `term-${Date.now()}-${update.field_name}`,
              trade_id: tradeId,
              field_name: update.field_name,
              value: update.new_value,
              status: update.status,
              confidence: update.confidence || 0.95,
              evidence_message_ids: update.evidence_message_ids || [newMessage.id],
              updated_at: new Date().toISOString(),
              confirmed_by_buyer: false,
              confirmed_by_seller: false,
              version: existing ? existing.version + 1 : 1,
            });
          });

          const mergedTerms = Array.from(newTermsMap.values());
          saveTradeTerms(tradeId, mergedTerms);
          crossTabSync.broadcastTerms(tradeId, mergedTerms);
          return mergedTerms;
        });

        const updatedFieldNames = analysis.agreement_updates.map((u) => u.field_name);
        setMissingFields((prevMissing) => prevMissing.filter((f) => !updatedFieldNames.includes(f)));
      }

      if (analysis.missing_fields) {
        setMissingFields((prevMissing) => {
          const updatedFieldNames = (analysis.agreement_updates || []).map((u) => u.field_name);
          return analysis.missing_fields.filter((f) => !updatedFieldNames.includes(f));
        });
      }

      if (analysis.suggested_questions) {
        setSuggestedQuestions(analysis.suggested_questions);
      }

      const updatedTerms = await fetchAgreementTerms(tradeId);
      if (updatedTerms && updatedTerms.length > 0) {
        setTerms((currentTerms) => {
          const map = new Map<string, AgreementTerm>();
          updatedTerms.forEach((t) => map.set(t.field_name, t));
          currentTerms.forEach((t) => map.set(t.field_name, t));
          const merged = Array.from(map.values());
          saveTradeTerms(tradeId, merged);
          return merged;
        });
      }
    }
  };

  const handleSendTextMessage = async (text: string) => {
    const tempMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      trade_id: tradeId,
      sender_id: activeUser.id,
      message_type: 'text',
      content: text,
      audio_url: null,
      transcription: null,
      language: 'ur',
      created_at: new Date().toISOString(),
      sender: activeUser,
    };

    saveTradeMessage(tradeId, tempMsg);
    setMessages((prev) => [...prev, tempMsg]);
    crossTabSync.broadcastMessage(tradeId, tempMsg);

    try {
      const savedMsg = await sendChatMessage(tradeId, activeUser.id, text);
      const msgToAnalyze = savedMsg || tempMsg;
      triggerAIAnalysis(msgToAnalyze);
    } catch {
      triggerAIAnalysis(tempMsg);
    }
  };

  const handleSendVoiceMessage = async (audioUri: string, durationSec: number) => {
    const tempVoiceId = `msg-voice-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempVoiceId,
      trade_id: tradeId,
      sender_id: activeUser.id,
      message_type: 'voice',
      content: null,
      audio_url: audioUri,
      transcription: '[Transcribing voice message...]',
      language: 'ur',
      created_at: new Date().toISOString(),
      sender: activeUser,
    };

    saveTradeMessage(tradeId, tempMsg);
    setMessages((prev) => [...prev, tempMsg]);
    crossTabSync.broadcastMessage(tradeId, tempMsg);

    const transcription = await transcribeAudioMessage(audioUri, tempVoiceId, tradeId);
    if (transcription) {
      const updatedVoiceMsg = { ...tempMsg, transcription };
      saveTradeMessage(tradeId, updatedVoiceMsg);
      setMessages((prev) => prev.map((m) => (m.id === tempVoiceId ? updatedVoiceMsg : m)));
      crossTabSync.broadcastMessage(tradeId, updatedVoiceMsg);
      triggerAIAnalysis(updatedVoiceMsg);
    }
  };

  const handleSelectSuggestedQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Top App Bar with Back Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/(tabs)/messages')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#1b4332" />
            <Text style={styles.backBtnText}>پیغامات (Back)</Text>
          </TouchableOpacity>

          <View style={styles.topNavCenter}>
            <Text style={styles.topNavTitle}>تجارتی چیٹ و AI کوپائلٹ</Text>
            <Text style={styles.topNavSubtitle}>
              {trade?.listing?.product_name || 'سپر باسمتی چاول'} • #{tradeId}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.reviewNavBtn}
            onPress={() => router.push(`/agreement/${tradeId}` as any)}
            activeOpacity={0.7}
          >
            <FileText size={15} color="#1b4332" />
            <Text style={styles.reviewNavBtnText}>معاہدے کا جائزہ</Text>
          </TouchableOpacity>
        </View>

        <RoleSwitcherHeader />

        <AIAssistantCard
          terms={terms}
          missingFields={missingFields}
          suggestedQuestions={suggestedQuestions}
          onSelectQuestion={handleSelectSuggestedQuestion}
          onReviewAgreement={() => router.push(`/agreement/${tradeId}` as any)}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1b4332" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} isCurrentUser={item.sender_id === currentUserId} />
            )}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <ChatInput
          onSendTextMessage={handleSendTextMessage}
          onSendVoiceMessage={handleSendVoiceMessage}
          inputText={inputText}
          setInputText={setInputText}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    paddingVertical: 10,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b4332',
  },
  topNavCenter: {
    alignItems: 'center',
  },
  topNavTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  topNavSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  reviewNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#B7E4C7',
  },
  reviewNavBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b4332',
  },
});
