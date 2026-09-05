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
import {
  Package,
  Coins,
  Truck,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Clock,
  UserCheck,
  Sparkles,
  FileText,
  User,
} from 'lucide-react-native';

const SECTIONS = [
  {
    key: 'product',
    titleUrdu: 'فصل و جنس کی تفصیلات',
    titleEng: 'Product Specifications',
    icon: <Package size={17} color="#15803D" />,
    fields: ['product_name', 'quantity'],
  },
  {
    key: 'price',
    titleUrdu: 'طے شدہ قیمت و ادائیگی',
    titleEng: 'Agreed Price & Payment Value',
    icon: <Coins size={17} color="#15803D" />,
    fields: ['price_per_unit'],
  },
  {
    key: 'delivery',
    titleUrdu: 'ترسیل و ڈیلیوری مقام',
    titleEng: 'Logistics & Delivery Schedule',
    icon: <Truck size={17} color="#15803D" />,
    fields: ['delivery_location', 'delivery_date'],
  },
  {
    key: 'payment',
    titleUrdu: 'طریقہ ادائیگی و شرائط',
    titleEng: 'Payment Method & Terms',
    icon: <CreditCard size={17} color="#15803D" />,
    fields: ['payment_method'],
  },
];

const TERM_METADATA: Record<string, { labelUrdu: string; labelEng: string }> = {
  product_name: { labelUrdu: 'جنس / فصل کا نام', labelEng: 'Product Name' },
  quantity: { labelUrdu: 'مقدار و وزن', labelEng: 'Quantity' },
  price_per_unit: { labelUrdu: 'طے شدہ ریٹ (فی من)', labelEng: 'Agreed Unit Price' },
  delivery_location: { labelUrdu: 'ترسیل کا مقام', labelEng: 'Delivery Location' },
  delivery_date: { labelUrdu: 'ترسیل کی تاریخ', labelEng: 'Delivery Date' },
  payment_method: { labelUrdu: 'طریقہ ادائیگی', labelEng: 'Payment Method' },
};

export default function AgreementReviewScreen() {
  const { id, faceVerified } = useLocalSearchParams<{ id: string; faceVerified?: string }>();
  const tradeId = id || 'trade-101';

  const { activeRole } = useDemoAuth();
  const currentRole = activeRole || 'buyer';
  const otherRole = currentRole === 'buyer' ? 'seller' : 'buyer';
  const currentRoleName = currentRole === 'buyer' ? 'خریدار' : 'فروخت کنندہ';
  const otherRoleName = otherRole === 'seller' ? 'فروخت کنندہ' : 'خریدار';

  const [trade, setTrade] = useState<Trade | null>(null);
  const [terms, setTerms] = useState<AgreementTerm[]>(() => loadTradeTerms(tradeId));
  const [buyerConfirmed, setBuyerConfirmed] = useState(false);
  const [sellerConfirmed, setSellerConfirmed] = useState(false);
  const [buyerConfirmedAt, setBuyerConfirmedAt] = useState<string | null>(null);
  const [sellerConfirmedAt, setSellerConfirmedAt] = useState<string | null>(null);
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
        'تصدیق کامیاب • Verification Complete',
        `آپ (${currentRoleName}) کی بائیو میٹرک تصدیق اور شرائط کی منظوری باضابطہ درج کر لی گئی ہے۔`
      );
    }
  }, [faceVerified, tradeId, currentRole, currentRoleName]);

  // Listen for real-time changes safely with unique channel identifier
  useEffect(() => {
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

  const findTerm = (field: string) => terms.find((t) => t.field_name === field);

  const handleAction = async () => {
    if (bothConfirmed) {
      router.push(`/agreement/final/${tradeId}` as any);
      return;
    }

    if (!currentConfirmed) {
      router.push(`/verification/${tradeId}` as any);
      return;
    }

    Alert.alert(
      'معاہدہ زیرِ توثیق • Awaiting Confirmation',
      `آپ کی تصدیق درج ہو چکی ہے۔ قانونی معاہدے کے نفاذ کے لیے دوسرے فریق (${otherRoleName}) کی بائیو میٹرک توثیق درکار ہے۔`
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
        'باہمی اتفاق مکمل • Mutual Agreement Complete',
        `دونوں فریقین (${currentRoleName} اور ${otherRoleName}) کی شرائط پر رضامندی اور بائیو میٹرک توثیق مکمل ہو گئی ہے۔ اب حتمی قانونی معاہدہ دستاویز تیار ہے۔`
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
    const meta = TERM_METADATA[field] || {
      labelUrdu: field.replace(/_/g, ' '),
      labelEng: field.replace(/_/g, ' '),
    };

    return (
      <View key={field} style={styles.termRow}>
        <View style={styles.termInfo}>
          <Text style={styles.termLabelUrdu}>{meta.labelUrdu}</Text>
          <Text style={styles.termLabelEng}>{meta.labelEng}</Text>
          <Text style={styles.termValue}>{value}</Text>
        </View>
        <Badge status={status} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Document Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleCol}>
              <View style={styles.headerTitleRow}>
                <FileText size={18} color="#15803D" />
                <Text style={styles.headerTitle}>تجارتی معاہدے کا جائزہ</Text>
              </View>
              <Text style={styles.headerSubtitleEng}>Trade Agreement Review & Mutual Consent</Text>
            </View>
            <View style={styles.tradeIdBadge}>
              <Text style={styles.tradeIdText}>Trade #{tradeId}</Text>
            </View>
          </View>

          <Text style={styles.headerDescUrdu}>
            معاہدے کے قانونی نفاذ کے لیے خریدار اور فروخت کنندہ دونوں کی بائیو میٹرک توثیق لازمی ہے۔
          </Text>

          {/* Current User Active Role Status */}
          <View style={styles.currentRoleBar}>
            <View style={styles.currentRoleLeft}>
              <User size={13} color="#15803D" />
              <Text style={styles.currentRoleBarText}>
                آپ کا کردار: <Text style={styles.boldRoleText}>{currentRole === 'buyer' ? 'خریدار • Buyer' : 'فروخت کنندہ • Seller'}</Text>
              </Text>
            </View>
            <View style={currentConfirmed ? styles.rolePillConfirmed : styles.rolePillPending}>
              {currentConfirmed ? (
                <CheckCircle2 size={11} color="#047857" />
              ) : (
                <Clock size={11} color="#B45309" />
              )}
              <Text style={currentConfirmed ? styles.rolePillTextConfirmed : styles.rolePillTextPending}>
                {currentConfirmed ? 'توثیق مکمل' : 'توثیق درکار'}
              </Text>
            </View>
          </View>
        </View>

        {/* Dynamic Mutual Status Banner */}
        {bothConfirmed ? (
          <View style={styles.bannerConfirmed}>
            <View style={styles.bannerIconBoxConfirmed}>
              <ShieldCheck size={22} color="#15803D" />
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitleConfirmed}>باہمی معاہدہ باضابطہ طے پا گیا</Text>
              <Text style={styles.bannerSubEngConfirmed}>Contract Legally Executed & Digitally Locked</Text>
              <Text style={styles.bannerDescConfirmed}>
                دونوں فریقین نے تمام شرائط تسلیم کر کے بائیو میٹرک توثیق مکمل کر لی ہے۔ قانونی ڈیجیٹل معاہدہ نافذ ہو چکا ہے۔
              </Text>
            </View>
          </View>
        ) : currentConfirmed ? (
          <View style={styles.bannerPending}>
            <View style={styles.bannerIconBoxPending}>
              <Clock size={22} color="#B45309" />
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitlePending}>معاہدہ زیرِ توثیق ہے</Text>
              <Text style={styles.bannerSubEngPending}>Awaiting Counterparty Confirmation</Text>
              <Text style={styles.bannerDescPending}>
                آپ کی جانب سے بائیو میٹرک توثیق اور شرائط کی منظوری درج ہو چکی ہے۔ دوسرے فریق ({otherRoleName}) کی توثیق کے بعد قانونی معاہدہ خودبخود مکمل ہو جائے گا۔
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.bannerInitial}>
            <View style={styles.bannerIconBoxInitial}>
              <FileText size={22} color="#0F766E" />
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitleInitial}>معاہدے کی شرائط کی جانچ و توثیق</Text>
              <Text style={styles.bannerSubEngInitial}>Review Agreed Terms & Provide Biometric Signature</Text>
              <Text style={styles.bannerDescInitial}>
                درج ذیل شرائط کا بغور جائزہ لیں۔ معاہدے کی حتمی تشکیل کے لیے دونوں فریقین کی بائیو میٹرک تصدیق لازمی ہے۔
              </Text>
            </View>
          </View>
        )}

        {/* Both Parties Digital Signatures Section */}
        <View style={styles.sectionHeadingWrapper}>
          <Text style={styles.sectionHeadingTitle}>فریقین کی ڈیجیٹل توثیق • Both Parties Consent</Text>
          <Text style={styles.sectionHeadingSub}>
            معاہدے کے قانونی نفاذ کے لیے فریقین کے ڈیجیٹل دستخط لازمی ہیں
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

        {/* Demo Simulation Drawer for Testing */}
        {currentConfirmed && !bothConfirmed && (
          <View style={styles.demoSimulateCard}>
            <View style={styles.demoHeaderRow}>
              <View style={styles.demoIconBox}>
                <Sparkles size={14} color="#0F766E" />
              </View>
              <View style={styles.demoTitleCol}>
                <Text style={styles.demoTitle}>ڈیمو سمیولیشن • Demo Verification Mode</Text>
                <Text style={styles.demoDesc}>
                  ٹیسٹنگ کے لیے دوسرے فریق ({otherRoleName}) کی جانب سے توثیق درج کر کے معاہدے کی تکمیل کا مشاہدہ کریں:
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.demoSimulateBtn}
              onPress={handleSimulateOtherParty}
              disabled={simulating}
              activeOpacity={0.85}
            >
              {simulating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <UserCheck size={16} color="#FFFFFF" />
                  <Text style={styles.demoSimulateBtnText}>
                    دوسرے فریق ({otherRoleName}) کی توثیق سمیولیٹ کریں
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Contract Terms Sections */}
        <View style={[styles.sectionHeadingWrapper, { marginTop: 12 }]}>
          <Text style={styles.sectionHeadingTitle}>معاہدے کی طے شدہ شرائط • Agreed Terms</Text>
          <Text style={styles.sectionHeadingSub}>
            تجارتی گفتگو سے اخذ کردہ تصدیق شدہ شرائط
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <AgreementSectionCard
            key={section.key}
            title={section.titleUrdu}
            subtitle={section.titleEng}
            icon={section.icon}
          >
            {section.fields.map((field) => renderTermRow(field))}
          </AgreementSectionCard>
        ))}

        {/* Action Controls */}
        <View style={styles.actionContainer}>
          {bothConfirmed ? (
            <TouchableOpacity
              style={styles.finalDocBtn}
              onPress={handleAction}
              activeOpacity={0.85}
            >
              <FileCheck size={18} color="#FFFFFF" />
              <View style={styles.btnTextCol}>
                <Text style={styles.finalDocBtnTitle}>حتمی معاہدہ دستاویز دیکھیں</Text>
                <Text style={styles.finalDocBtnSub}>View Official Executed Agreement</Text>
              </View>
            </TouchableOpacity>
          ) : !currentConfirmed ? (
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleAction}
              activeOpacity={0.85}
            >
              <ShieldCheck size={18} color="#FFFFFF" />
              <View style={styles.btnTextCol}>
                <Text style={styles.confirmBtnTitle}>شرائط کی منظوری و بائیو میٹرک تصدیق</Text>
                <Text style={styles.confirmBtnSub}>Verify Biometric Identity & Sign Contract</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.waitingActionBox}>
              <Clock size={18} color="#B45309" />
              <View style={styles.waitingTextCol}>
                <Text style={styles.waitingActionText}>
                  دوسرے فریق ({otherRoleName}) کی توثیق کا انتظار ہے...
                </Text>
                <Text style={styles.waitingActionSub}>
                  Awaiting Counterparty Verification to finalize contract
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.chatReturnBtn}
            onPress={() => router.push(`/trade/${tradeId}` as any)}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color="#15803D" />
            <Text style={styles.chatReturnText}>واپس تجارتی چیٹ پر جائیں • Return to Trade Chat</Text>
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
  headerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitleEng: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tradeIdBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tradeIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  headerDescUrdu: {
    fontSize: 12,
    color: '#334155',
    marginTop: 4,
    lineHeight: 18,
  },
  currentRoleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currentRoleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentRoleBarText: {
    fontSize: 12,
    color: '#334155',
  },
  boldRoleText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  rolePillConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rolePillTextConfirmed: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  rolePillPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rolePillTextPending: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },

  // Corporate Status Banners (No Emojis)
  bannerConfirmed: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  bannerIconBoxConfirmed: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  bannerTitleConfirmed: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  bannerSubEngConfirmed: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
    marginTop: 1,
  },
  bannerDescConfirmed: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 4,
    lineHeight: 17,
  },

  bannerPending: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  bannerIconBoxPending: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  bannerTitlePending: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  bannerSubEngPending: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
    marginTop: 1,
  },
  bannerDescPending: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 4,
    lineHeight: 17,
  },

  bannerInitial: {
    flexDirection: 'row',
    backgroundColor: '#F0FDFA',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginBottom: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  bannerIconBoxInitial: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#5EEAD4',
  },
  bannerTitleInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: '#115E59',
  },
  bannerSubEngInitial: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F766E',
    marginTop: 1,
  },
  bannerDescInitial: {
    fontSize: 11,
    color: '#134E4A',
    marginTop: 4,
    lineHeight: 17,
  },
  bannerContent: {
    flex: 1,
  },

  sectionHeadingWrapper: {
    marginBottom: 8,
    marginTop: 2,
  },
  sectionHeadingTitle: {
    fontSize: 13,
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

  // Demo Simulation Drawer
  demoSimulateCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  demoIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoTitleCol: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  demoDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    marginTop: 2,
  },
  demoSimulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  demoSimulateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Term Rows
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  termInfo: {
    flex: 1,
    gap: 2,
    marginRight: 8,
  },
  termLabelUrdu: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  termLabelEng: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  termValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },

  // Action Buttons
  actionContainer: {
    marginTop: 16,
    marginBottom: 20,
    gap: 10,
  },
  finalDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#15803D',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#15803D',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  btnTextCol: {
    alignItems: 'center',
  },
  finalDocBtnTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  finalDocBtnSub: {
    color: '#DCFCE7',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  confirmBtnTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  confirmBtnSub: {
    color: '#DCFCE7',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  waitingActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  waitingTextCol: {
    alignItems: 'center',
  },
  waitingActionText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '800',
  },
  waitingActionSub: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  chatReturnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  chatReturnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
});
