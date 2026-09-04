import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { AgreementTerm, Trade } from '@/types/database';
import {
  fetchTradeById,
  fetchAgreementTerms,
  confirmTrade,
} from '@/services/trade/tradeService';
import { loadTradeTerms } from '@/services/trade/demoTradeStore';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { supabase } from '@/services/supabase/client';
import { AgreementSectionCard } from '@/components/agreement/AgreementSectionCard';
import { ConfirmationStatusBadge } from '@/components/agreement/ConfirmationStatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ShoppingBag,
  DollarSign,
  Truck,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
} from 'lucide-react-native';

const SECTIONS: { key: string; title: string; icon: React.ReactNode; fields: string[] }[] = [
  {
    key: 'product',
    title: '🛒 Product',
    icon: <ShoppingBag size={18} color="#1b4332" />,
    fields: ['product_name', 'quantity'],
  },
  {
    key: 'price',
    title: '💰 Price',
    icon: <DollarSign size={18} color="#1b4332" />,
    fields: ['price_per_unit'],
  },
  {
    key: 'delivery',
    title: '🚚 Delivery',
    icon: <Truck size={18} color="#1b4332" />,
    fields: ['delivery_location', 'delivery_date'],
  },
  {
    key: 'payment',
    title: '💳 Payment',
    icon: <CreditCard size={18} color="#1b4332" />,
    fields: ['payment_method'],
  },
];

export default function AgreementReviewScreen() {
  const { id, faceVerified } = useLocalSearchParams<{ id: string; faceVerified?: string }>();
  const tradeId = id || 'trade-101';

  const { activeRole } = useDemoAuth();

  const [trade, setTrade] = useState<Trade | null>(null);
  const [terms, setTerms] = useState<AgreementTerm[]>(() => loadTradeTerms(tradeId));
  const [buyerConfirmed, setBuyerConfirmed] = useState(false);
  const [sellerConfirmed, setSellerConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function load() {
      const t = await fetchTradeById(tradeId);
      if (t) {
        setTrade(t);
        setBuyerConfirmed(t.buyer_confirmed === true);
        setSellerConfirmed(t.seller_confirmed === true);
      }

      const stored = loadTradeTerms(tradeId);
      if (stored && stored.length > 0) {
        setTerms(stored);
      }

      const dbTerms = await fetchAgreementTerms(tradeId);
      if (dbTerms && dbTerms.length > 0) {
        setTerms((current) => {
          const map = new Map<string, AgreementTerm>();
          dbTerms.forEach((term) => map.set(term.field_name, term));
          current.forEach((term) => map.set(term.field_name, term));
          return Array.from(map.values());
        });
      }
    }
    load();
  }, [tradeId]);

  // Handle return from Face Verification
  useEffect(() => {
    if (faceVerified === 'true') {
      setBuyerConfirmed(true);
      setSellerConfirmed(true);
      confirmTrade(tradeId, activeRole || 'buyer').catch(() => {});
      Alert.alert(
        '✅ بائیو میٹرک تصدیق کامیاب (Identity Verified)',
        'آپ کے چہرے کی بائیو میٹرک تصدیق مکمل ہو گئی ہے اور معاہدے کی ڈیجیٹل توثیق درج کر لی گئی ہے۔'
      );
    }
  }, [faceVerified, tradeId, activeRole]);

  // Listen for the other party confirming in real-time
  useEffect(() => {
    const channel = supabase
      .channel(`agreement-trade-${tradeId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trades', filter: `id=eq.${tradeId}` },
        (payload) => {
          const updated = payload.new as Trade;
          setTrade(updated);
          setBuyerConfirmed(updated.buyer_confirmed === true);
          setSellerConfirmed(updated.seller_confirmed === true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tradeId]);

  const findTerm = (field: string) => terms.find((t) => t.field_name === field);

  const handleConfirm = async () => {
    if (buyerConfirmed && sellerConfirmed) {
      router.push(`/agreement/final/${tradeId}` as any);
      return;
    }

    // Trigger Face Verification before final confirmation!
    router.push(`/verification/${tradeId}` as any);
  };

  const renderTermRow = (field: string) => {
    const term = findTerm(field);
    const value = term ? String(term.value) : '—';
    const status = term?.status || 'missing';
    return (
      <View key={field} style={styles.termRow}>
        <View style={styles.termInfo}>
          <Text style={styles.termField}>{field.replace(/_/g, ' ').toUpperCase()}</Text>
          <Text style={styles.termValue}>{value}</Text>
        </View>
        <Badge status={status} label={status === 'agreed' ? '✅ Agreed' : '⚠️ Proposed'} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBanner}>
          <Text style={styles.headerTitle}>📋 Trade Agreement Review</Text>
          <Text style={styles.headerSub}>
            Verify all transaction terms before final confirmation
          </Text>
        </View>

        <View style={styles.confirmationRow}>
          <ConfirmationStatusBadge
            roleLabel="Buyer"
            isConfirmed={buyerConfirmed}
            confirmedAt={trade?.buyer_confirmed_at}
          />
          <ConfirmationStatusBadge
            roleLabel="Seller"
            isConfirmed={sellerConfirmed}
            confirmedAt={trade?.seller_confirmed_at}
          />
        </View>

        {SECTIONS.map((section) => (
          <AgreementSectionCard key={section.key} title={section.title} icon={section.icon}>
            {section.fields.map((field) => renderTermRow(field))}
          </AgreementSectionCard>
        ))}

        <View style={styles.actionContainer}>
          <Button
            title={
              buyerConfirmed && sellerConfirmed
                ? 'حتمی معاہدہ دستاویز دیکھیں (View Final Agreement) →'
                : 'معاہدہ کی تصدیق اور بائیو میٹرک ویری فکیشن (Verify & Confirm)'
            }
            onPress={handleConfirm}
            loading={confirming}
            icon={
              buyerConfirmed && sellerConfirmed ? (
                <FileCheck size={18} color="#FFFFFF" />
              ) : (
                <CheckCircle2 size={18} color="#FFFFFF" />
              )
            }
            style={styles.confirmBtn}
          />

          <TouchableOpacity
            style={styles.chatReturnBtn}
            onPress={() => router.push(`/trade/${tradeId}` as any)}
          >
            <ArrowLeft size={16} color="#1b4332" />
            <Text style={styles.chatReturnText}>Request Changes / Return to Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBanner: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B7E4C7',
    marginBottom: 16,
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1b4332',
  },
  headerSub: {
    fontSize: 13,
    color: '#2d6a4f',
  },
  confirmationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  termInfo: {
    flex: 1,
    gap: 2,
  },
  termField: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  termValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionContainer: {
    marginTop: 10,
    marginBottom: 30,
    gap: 12,
  },
  confirmBtn: {
    paddingVertical: 14,
  },
  chatReturnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  chatReturnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b4332',
  },
  viewFinalDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2D6A4F',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 4,
  },
  viewFinalDocText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
