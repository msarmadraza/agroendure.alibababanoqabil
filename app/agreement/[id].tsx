import React, { useState, useEffect, useRef } from 'react';
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
import {
  loadTradeTerms,
  loadTradeConfirmation,
  saveTradeConfirmation,
} from '@/services/trade/demoTradeStore';
import { crossTabSync } from '@/services/trade/crossTabSync';
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
  ShieldCheck,
  Clock,
  UserCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react-native';

const SECTIONS: { key: string; title: string; icon: React.ReactNode; fields: string[] }[] = [
  {
    key: 'product',
    title: '🛒 فصل / جنس کی تفصیلات (Product Details)',
    icon: <ShoppingBag size={18} color="#15803D" />,
    fields: ['product_name', 'quantity'],
  },
  {
    key: 'price',
    title: '💰 طے شدہ قیمت و رقم (Agreed Price)',
    icon: <DollarSign size={18} color="#15803D" />,
    fields: ['price_per_unit'],
  },
  {
    key: 'delivery',
    title: '🚚 ترسیل و ڈیلیوری مقام (Delivery & Date)',
    icon: <Truck size={18} color="#15803D" />,
    fields: ['delivery_location', 'delivery_date'],
  },
  {
    key: 'payment',
    title: '💳 طریقہ ادائیگی و شرائط (Payment Terms)',
    icon: <CreditCard size={18} color="#15803D" />,
    fields: ['payment_method'],
  },
];

export default function AgreementReviewScreen() {
  const { id, faceVerified } = useLocalSearchParams<{ id: string; faceVerified?: string }>();
  const tradeId = id || 'trade-101';

  const { activeRole, activeUser } = useDemoAuth();
  const currentRole = activeRole || 'buyer';
  const otherRole = currentRole === 'buyer' ? 'seller' : 'buyer';
  const otherRoleLabel = otherRole === 'seller' ? 'فروخت کنندہ (Seller)' : 'خریدار (Buyer)';
  const currentRoleLabel = currentRole === 'buyer' ? 'خریدار (Buyer)' : 'فروخت کنندہ (Seller)';

  const [trade, setTrade] = useState<Trade | null>(null);
  const [terms, setTerms] = useState<AgreementTerm[]>(() => loadTradeTerms(tradeId));
  const [buyerConfirmed, setBuyerConfirmed] = useState(false);
  const [sellerConfirmed, setSellerConfirmed] = useState(false);
  const [buyerConfirmedAt, setBuyerConfirmedAt] = useState<string | null>(null);
  const [sellerConfirmedAt, setSellerConfirmedAt] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Load trade details and local confirmation state
  useEffect(() => {
    async function load() {
      const localConf = loadTradeConfirmation(tradeId);
      if (localConf.buyerConfirmed) {
        setBuyerConfirmed(true);
        setBuyerConfirmedAt(localConf.buyerConfirmedAt || null);
      }
      if (localConf.sellerConfirmed) {
        setSellerConfirmed(true);
        setSellerConfirmedAt(localConf.sellerConfirmedAt || null);
      }

      const t = await fetchTradeById(tradeId);
      if (t) {
        setTrade(t);
        if (t.buyer_confirmed) {
          setBuyerConfirmed(true);
          setBuyerConfirmedAt(t.buyer_confirmed_at || null);
        }
        if (t.seller_confirmed) {
          setSellerConfirmed(true);
          setSellerConfirmedAt(t.seller_confirmed_at || null);
        }
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
  // IMPORTANT: Only the CURRENT active user is confirmed. The contract is ONLY finalized when both agree!
  const hasProcessedFaceVerified = useRef(false);
  useEffect(() => {
    if (faceVerified === 'true' && !hasProcessedFaceVerified.current) {
      hasProcessedFaceVerified.current = true;
      const now = new Date().toISOString();

      if (currentRole === 'buyer') {
        setBuyerConfirmed(true);
        setBuyerConfirmedAt(now);
        saveTradeConfirmation(tradeId, 'buyer', true);
        confirmTrade(tradeId, 'buyer').catch(() => {});
      } else {
        setSellerConfirmed(true);
        setSellerConfirmedAt(now);
        saveTradeConfirmation(tradeId, 'seller', true);
        confirmTrade(tradeId, 'seller').catch(() => {});
      }

      Alert.alert(
        '✅ بائیو میٹرک تصدیق کامیاب (Biometric Verified)',
        `آپ (${currentRoleLabel}) کی بائیو میٹرک شناخت اور معاہدے کی شرائط کی منظوری کامیابی سے درج کر لی گئی ہے۔`
      );
    }
  }, [faceVerified, tradeId, currentRole, currentRoleLabel]);

  // Listen for real-time changes safely with unique channel identifier
  useEffect(() => {
    // Unique channel identifier per component mount to completely prevent Supabase Realtime channel collision
    const uniqueChannelName = `agreement-trade-${tradeId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase.channel(uniqueChannelName);

    try {
      channel
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'trades', filter: `id=eq.${tradeId}` },
          (payload) => {
            const updated = payload.new as Trade;
            setTrade(updated);
            if (updated.buyer_confirmed !== undefined) {
              setBuyerConfirmed(Boolean(updated.buyer_confirmed));
              if (updated.buyer_confirmed_at) setBuyerConfirmedAt(updated.buyer_confirmed_at);
            }
            if (updated.seller_confirmed !== undefined) {
              setSellerConfirmed(Boolean(updated.seller_confirmed));
              if (updated.seller_confirmed_at) setSellerConfirmedAt(updated.seller_confirmed_at);
            }
          }
        )
        .subscribe();
    } catch (channelErr) {
      console.warn('Realtime subscription warning:', channelErr);
    }

    // Dual Cross-Window/Tab sync for live demos & multi-party testing
    const unsubscribeSync = crossTabSync.subscribe((payload) => {
      if (payload.tradeId === tradeId && payload.type === 'CONFIRMATION_UPDATED') {
        if (payload.role === 'buyer') {
          setBuyerConfirmed(true);
          setBuyerConfirmedAt(payload.confirmedAt || new Date().toISOString());
        } else if (payload.role === 'seller') {
          setSellerConfirmed(true);
          setSellerConfirmedAt(payload.confirmedAt || new Date().toISOString());
        }
      }
    });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn('Error cleaning up realtime channel:', err);
      }
      unsubscribeSync();
    };
  }, [tradeId]);

  const bothConfirmed = buyerConfirmed && sellerConfirmed;
  const currentConfirmed = currentRole === 'buyer' ? buyerConfirmed : sellerConfirmed;
  const otherConfirmed = otherRole === 'buyer' ? buyerConfirmed : sellerConfirmed;

  const findTerm = (field: string) => terms.find((t) => t.field_name === field);

  const handleAction = async () => {
    if (bothConfirmed) {
      // Both have confirmed -> Navigate to final legal contract
      router.push(`/agreement/final/${tradeId}` as any);
      return;
    }

    if (!currentConfirmed) {
      // Current user hasn't verified -> Go to biometric verification
      router.push(`/verification/${tradeId}` as any);
      return;
    }

    // If current confirmed but other party hasn't confirmed yet
    Alert.alert(
      'معاہدہ زیرِ توثیق (Waiting for Other Party)',
      `آپ کی تصدیق مکمل ہو چکی ہے۔ قانونی معاہدہ مکمل کرنے کے لیے ${otherRoleLabel} کی منظوری اور بائیو میٹرک توثیق درکار ہے۔ آپ نیچے دیے گئے بٹن سے دوسرے فریق کی تصدیق ٹیسٹ کر سکتے ہیں۔`
    );
  };

  // Simulate other party confirmation for smooth demo/testing
  const handleSimulateOtherParty = async () => {
    try {
      setSimulating(true);
      const now = new Date().toISOString();

      if (otherRole === 'buyer') {
        setBuyerConfirmed(true);
        setBuyerConfirmedAt(now);
        saveTradeConfirmation(tradeId, 'buyer', true);
        await confirmTrade(tradeId, 'buyer');
      } else {
        setSellerConfirmed(true);
        setSellerConfirmedAt(now);
        saveTradeConfirmation(tradeId, 'seller', true);
        await confirmTrade(tradeId, 'seller');
      }

      Alert.alert(
        '🤝 باہمی اتفاق مکمل! (Mutual Agreement Formed)',
        `دونوں فریقین (${currentRoleLabel} اور ${otherRoleLabel}) کی شرائط پر باہمی رضامندی اور بائیو میٹرک توثیق درج ہو چکی ہے۔ اب آپ حتمی معاہدہ دستاویز دیکھ سکتے ہیں۔`
      );
    } catch (err) {
      console.warn('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const renderTermRow = (field: string) => {
    const term = findTerm(field);
    const value = term ? String(term.value) : '—';
    const status = term?.status || 'agreed';
    return (
      <View key={field} style={styles.termRow}>
        <View style={styles.termInfo}>
          <Text style={styles.termField}>{field.replace(/_/g, ' ').toUpperCase()}</Text>
          <Text style={styles.termValue}>{value}</Text>
        </View>
        <Badge status={status} label={status === 'agreed' ? '✅ باہمی طے شدہ' : '⚠️ زیرِ بحث'} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Title Card */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>📋 تجارتی معاہدے کا جائزہ</Text>
            <View style={styles.tradeIdBadge}>
              <Text style={styles.tradeIdText}>#{tradeId}</Text>
            </View>
          </View>
          <Text style={styles.headerSubEng}>Trade Agreement Review & Mutual Consent</Text>
          <Text style={styles.headerSubUrdu}>
            دونوں فریقین (خریدار اور فروخت کنندہ) کی بائیو میٹرک توثیق کے بعد ہی باضابطہ قانونی معاہدہ تشکیل پائے گا۔
          </Text>

          {/* Current User Role Notice */}
          <View style={styles.currentRoleNotice}>
            <Sparkles size={14} color="#15803D" />
            <Text style={styles.currentRoleText}>
              آپ کا کردار: <Text style={styles.boldText}>{currentRoleLabel}</Text>
              {currentConfirmed ? ' • ✅ تصدیق مکمل' : ' • ⏳ تصدیق درکار'}
            </Text>
          </View>
        </View>

        {/* Dynamic Mutual Agreement Status Card */}
        {bothConfirmed ? (
          <View style={styles.successBanner}>
            <View style={styles.bannerIconCircle}>
              <ShieldCheck size={26} color="#15803D" />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.successBannerTitle}>🎉 باہمی معاہدہ طے پا گیا ہے!</Text>
              <Text style={styles.successBannerEng}>Contract Formed & Digitally Locked</Text>
              <Text style={styles.successBannerUrdu}>
                دونوں فریقین نے تمام شرائط تسلیم کر کے بائیو میٹرک توثیق مکمل کر لی ہے۔ قانونی ڈیجیٹل معاہدہ نافذ ہو چکا ہے۔
              </Text>
            </View>
          </View>
        ) : currentConfirmed ? (
          <View style={styles.waitingBanner}>
            <View style={[styles.bannerIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={24} color="#B45309" />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.waitingBannerTitle}>⏳ معاہدہ زیرِ توثیق ہے</Text>
              <Text style={styles.waitingBannerEng}>Awaiting Other Party Confirmation</Text>
              <Text style={styles.waitingBannerUrdu}>
                آپ کی جانب سے بائیو میٹرک توثیق درج ہو چکی ہے۔ اب دوسرے فریق ({otherRoleLabel}) کی تصدیق کا انتظار ہے۔ جب دونوں متفق ہوں گے تو معاہدہ نافذ العمل ہو گا۔
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.infoBanner}>
            <View style={[styles.bannerIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <AlertCircle size={24} color="#1D4ED8" />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.infoBannerTitle}>معاہدے کی شرائط کی توثیق</Text>
              <Text style={styles.infoBannerEng}>Review Terms & Confirm with Face Biometrics</Text>
              <Text style={styles.infoBannerUrdu}>
                نیچے درج شرائط کا جائزہ لیں اور چہرے کی بائیو میٹرک اسکین کے ذریعے اپنی ڈیجیٹل رضامندی درج کریں۔
              </Text>
            </View>
          </View>
        )}

        {/* Signatures & Consent Status Box */}
        <View style={styles.sectionHeadingWrapper}>
          <Text style={styles.sectionHeadingTitle}>فریقین کی ڈیجیٹل توثیق (Both Parties Consent)</Text>
          <Text style={styles.sectionHeadingSub}>
            معاہدہ بننے کے لیے دونوں فریقین کے دستخط اور بائیو میٹرک لازمی ہیں
          </Text>
        </View>

        <View style={styles.confirmationRow}>
          <ConfirmationStatusBadge
            roleLabel="Buyer"
            roleSubLabel="خریدار"
            partyName={trade?.buyer?.full_name || 'طارق ہول سیل خریدار'}
            isConfirmed={buyerConfirmed}
            confirmedAt={buyerConfirmedAt}
            isCurrentUser={currentRole === 'buyer'}
          />
          <ConfirmationStatusBadge
            roleLabel="Seller"
            roleSubLabel="فروخت کنندہ"
            partyName={trade?.seller?.full_name || 'چوہدری احمد کسان'}
            isConfirmed={sellerConfirmed}
            confirmedAt={sellerConfirmedAt}
            isCurrentUser={currentRole === 'seller'}
          />
        </View>

        {/* Simulation / Testing Box when only 1 party confirmed */}
        {currentConfirmed && !bothConfirmed && (
          <View style={styles.demoSimulateCard}>
            <View style={styles.demoHeaderRow}>
              <Sparkles size={16} color="#B45309" />
              <Text style={styles.demoTitle}>ڈیمو / ٹیسٹنگ سہولت (Hackathon Demo)</Text>
            </View>
            <Text style={styles.demoDesc}>
              چونکہ آپ ٹیسٹ کر رہے ہیں، آپ ایک کلک سے دوسرے فریق ({otherRoleLabel}) کی توثیق کی نقالی کر کے معاہدے کی تکمیل کا جائزہ لے سکتے ہیں:
            </Text>
            <TouchableOpacity
              style={styles.demoSimulateBtn}
              onPress={handleSimulateOtherParty}
              disabled={simulating}
            >
              {simulating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <UserCheck size={16} color="#FFFFFF" />
                  <Text style={styles.demoSimulateBtnText}>
                    دوسرے فریق ({otherRoleLabel}) کی توثیق درج کریں
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Contract Terms Sections */}
        <View style={[styles.sectionHeadingWrapper, { marginTop: 12 }]}>
          <Text style={styles.sectionHeadingTitle}>معاہدے کی طے شدہ شرائط (Agreed Terms)</Text>
          <Text style={styles.sectionHeadingSub}>
            چیٹ اور بات چیت سے اخذ کردہ تجارتی شرائط
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <AgreementSectionCard key={section.key} title={section.title} icon={section.icon}>
            {section.fields.map((field) => renderTermRow(field))}
          </AgreementSectionCard>
        ))}

        {/* Bottom Actions */}
        <View style={styles.actionContainer}>
          {bothConfirmed ? (
            <Button
              title="📜 حتمی معاہدہ دستاویز دیکھیں (View Final Agreement) →"
              onPress={handleAction}
              loading={confirming}
              icon={<FileCheck size={18} color="#FFFFFF" />}
              style={styles.finalDocBtn}
            />
          ) : !currentConfirmed ? (
            <Button
              title="🛡️ شرائط منظور کریں اور بائیو میٹرک اسکین کریں"
              onPress={handleAction}
              loading={confirming}
              icon={<ShieldCheck size={18} color="#FFFFFF" />}
              style={styles.confirmBtn}
            />
          ) : (
            <View style={styles.waitingActionBox}>
              <Clock size={18} color="#B45309" />
              <Text style={styles.waitingActionText}>
                دوسرے فریق ({otherRoleLabel}) کی توثیق کا انتظار ہے...
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.chatReturnBtn}
            onPress={() => router.push(`/trade/${tradeId}` as any)}
          >
            <ArrowLeft size={16} color="#15803D" />
            <Text style={styles.chatReturnText}>واپس تجارتی چیٹ پر جائیں (Return to Chat)</Text>
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
    paddingBottom: 50,
  },
  headerBanner: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  tradeIdBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tradeIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  headerSubEng: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  headerSubUrdu: {
    fontSize: 12,
    color: '#334155',
    marginTop: 6,
    lineHeight: 18,
  },
  currentRoleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  currentRoleText: {
    fontSize: 12,
    color: '#166534',
  },
  boldText: {
    fontWeight: '800',
    color: '#15803D',
  },

  // Dynamic Banners
  successBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginBottom: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  waitingBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextCol: {
    flex: 1,
  },
  successBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14532D',
  },
  successBannerEng: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    marginTop: 1,
  },
  successBannerUrdu: {
    fontSize: 12,
    color: '#166534',
    marginTop: 4,
    lineHeight: 18,
  },
  waitingBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#78350F',
  },
  waitingBannerEng: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginTop: 1,
  },
  waitingBannerUrdu: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 4,
    lineHeight: 18,
  },
  infoBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  infoBannerEng: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
    marginTop: 1,
  },
  infoBannerUrdu: {
    fontSize: 12,
    color: '#1E40AF',
    marginTop: 4,
    lineHeight: 18,
  },

  sectionHeadingWrapper: {
    marginBottom: 8,
    marginTop: 4,
  },
  sectionHeadingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeadingSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  confirmationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  demoSimulateCard: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  demoDesc: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
    marginBottom: 10,
  },
  demoSimulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  demoSimulateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  actionContainer: {
    marginTop: 16,
    marginBottom: 20,
    gap: 12,
  },
  confirmBtn: {
    backgroundColor: '#15803D',
    paddingVertical: 14,
    borderRadius: 10,
  },
  finalDocBtn: {
    backgroundColor: '#166534',
    paddingVertical: 14,
    borderRadius: 10,
  },
  waitingActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  waitingActionText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
  },
  chatReturnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  chatReturnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
});
