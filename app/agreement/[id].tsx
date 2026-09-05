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
import { useLanguage } from '@/services/i18n/languageContext';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';
import { VoiceCircleButton } from '@/components/ui/VoiceCircleButton';
import { generateAgreementAudioSummaryUrdu } from '@/services/voice/speechService';
import { supabase } from '@/services/supabase/client';
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Clock,
  UserCheck,
  FileText,
  Sparkles,
} from 'lucide-react-native';

export default function AgreementReviewScreen() {
  const { id, faceVerified } = useLocalSearchParams<{ id: string; faceVerified?: string }>();
  const tradeId = id || 'trade-101';

  const { activeRole } = useDemoAuth();
  const { isUrdu } = useLanguage();

  const currentRole = activeRole || 'buyer';
  const otherRole = currentRole === 'buyer' ? 'seller' : 'buyer';
  const currentRoleName = currentRole === 'buyer' ? (isUrdu ? 'خریدار' : 'Buyer') : (isUrdu ? 'فروخت کنندہ' : 'Seller');
  const otherRoleName = otherRole === 'seller' ? (isUrdu ? 'فروخت کنندہ' : 'Seller') : (isUrdu ? 'خریدار' : 'Buyer');

  const [trade, setTrade] = useState<Trade | null>(null);
  const [terms, setTerms] = useState<AgreementTerm[]>(() => loadTradeTerms(tradeId));
  const [buyerConfirmed, setBuyerConfirmed] = useState(false);
  const [sellerConfirmed, setSellerConfirmed] = useState(false);
  const [buyerConfirmedAt, setBuyerConfirmedAt] = useState<string | null>(null);
  const [sellerConfirmedAt, setSellerConfirmedAt] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Load trade details and confirmation state
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
        isUrdu ? 'تصدیق کامیاب' : 'Verification Succeeded',
        isUrdu
          ? 'آپ کی بائیو میٹرک توثیق اور شرائط کی منظوری باضابطہ درج ہو چکی ہے۔'
          : 'Your biometric verification and terms approval have been officially recorded.'
      );
    }
  }, [faceVerified, tradeId, currentRole, isUrdu]);

  // Safe Realtime channel subscription
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
        console.warn('Error cleaning up channel:', err);
      }
      unsubscribeSync();
    };
  }, [tradeId]);

  const bothConfirmed = buyerConfirmed && sellerConfirmed;
  const currentConfirmed = currentRole === 'buyer' ? buyerConfirmed : sellerConfirmed;

  const handleAction = () => {
    if (bothConfirmed) {
      router.push(`/agreement/final/${tradeId}` as any);
      return;
    }

    if (!currentConfirmed) {
      router.push(`/verification/${tradeId}` as any);
      return;
    }

    Alert.alert(
      isUrdu ? 'معاہدہ زیرِ توثیق' : 'Awaiting Counterparty',
      isUrdu
        ? `آپ کی توثیق مکمل ہو چکی ہے۔ معاہدے کے قانونی نفاذ کے لیے دوسرے فریق (${otherRoleName}) کے دستخط درکار ہیں۔`
        : `Your verification is complete. Awaiting counterparty (${otherRoleName}) signature to enact contract.`
    );
  };

  // Simulate other party confirmation for demo
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
    } catch (err) {
      console.warn('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Helper values for the clean summary table
  const findVal = (field: string, fallback: string) => {
    const t = terms.find((item) => item.field_name === field);
    return t ? String(t.value) : fallback;
  };

  const productName = findVal('product_name', trade?.listing?.product_name || (isUrdu ? 'سپر باسمتی چاول' : 'Super Basmati Rice'));
  const quantity = findVal('quantity', isUrdu ? '100 من' : '100 Mann');
  const pricePerUnit = findVal('price_per_unit', isUrdu ? 'PKR 5,700 فی من' : 'PKR 5,700 per Mann');
  const deliveryLocation = findVal('delivery_location', isUrdu ? 'لاہور' : 'Lahore');
  const deliveryDate = findVal('delivery_date', isUrdu ? '10 ستمبر 2026' : '10 September 2026');
  const paymentMethod = findVal('payment_method', isUrdu ? 'بینک ٹرانسفر / JazzCash' : 'Bank Transfer / JazzCash');

  // Compute total
  const parseNum = (str: string) => {
    const m = str.replace(/,/g, '').match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  };
  const pNum = parseNum(pricePerUnit) || 5700;
  const qNum = parseNum(quantity) || 100;
  const totalAmount = (pNum * qNum).toLocaleString();

  const buyerName = trade?.buyer?.full_name || (isUrdu ? 'طارق ہول سیل خریدار' : 'Tariq Wholesale Buyer');
  const sellerName = trade?.seller?.full_name || (isUrdu ? 'چوہدری احمد کسان' : 'Chaudhry Ahmad');
  const agreementAudioUrdu = generateAgreementAudioSummaryUrdu(
    buyerName,
    sellerName,
    productName,
    quantity,
    pricePerUnit,
    totalAmount,
    deliveryLocation,
    deliveryDate,
    paymentMethod
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. Sleek Unified Top Header with Universal Language Switcher */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerMainTitle}>
                {isUrdu ? 'تجارتی معاہدہ' : 'Trade Agreement'}
              </Text>
              <Text style={styles.headerSubTitle}>
                {isUrdu ? 'معاہدے کا جائزہ و باہمی توثیق' : 'Terms Review & Mutual Consent'}
              </Text>
            </View>

            <View style={styles.headerRightActions}>
              <VoiceCircleButton text={agreementAudioUrdu} autoPlay size={36} />
              <LanguageSwitcherButton compact />
              <View style={styles.tradeTag}>
                <Text style={styles.tradeTagText}>#{tradeId}</Text>
              </View>
            </View>
          </View>

          {/* Single Clear Status Badge */}
          <View style={styles.statusBanner}>
            {bothConfirmed ? (
              <View style={styles.statusRowConfirmed}>
                <ShieldCheck size={16} color="#059669" />
                <Text style={styles.statusTextConfirmed}>
                  {isUrdu
                    ? 'باہمی معاہدہ باضابطہ طے پا گیا • Digitally Executed'
                    : 'Mutual Agreement Legally Executed & Digitally Locked'}
                </Text>
              </View>
            ) : currentConfirmed ? (
              <View style={styles.statusRowPending}>
                <Clock size={16} color="#D97706" />
                <Text style={styles.statusTextPending}>
                  {isUrdu
                    ? `آپ کی تصدیق مکمل • دوسرے فریق (${otherRoleName}) کے دستخط کا انتظار ہے`
                    : `Your signature is recorded • Awaiting counterparty (${otherRoleName})`}
                </Text>
              </View>
            ) : (
              <View style={styles.statusRowAction}>
                <FileText size={16} color="#0F766E" />
                <Text style={styles.statusTextAction}>
                  {isUrdu
                    ? 'شرائط کا جائزہ لیں اور بائیو میٹرک توثیق مکمل کریں'
                    : 'Review terms and complete biometric verification to sign'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. Compact Symmetrical Signatures Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {isUrdu ? 'فریقین کی ڈیجیٹل توثیق' : 'Digital Signatures & Consent'}
          </Text>
          
          <View style={styles.signaturesRow}>
            {/* Buyer Box */}
            <View style={[styles.sigBox, buyerConfirmed ? styles.sigBoxConfirmed : styles.sigBoxPending]}>
              <View style={styles.sigBoxHeader}>
                <Text style={styles.sigRole}>{isUrdu ? 'خریدار (Buyer)' : 'Buyer'}</Text>
                {currentRole === 'buyer' && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>{isUrdu ? 'آپ' : 'You'}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.sigPartyName} numberOfLines={1}>
                {trade?.buyer?.full_name || (isUrdu ? 'طارق ہول سیل خریدار' : 'Tariq Wholesale Buyer')}
              </Text>

              <View style={styles.sigStatusPill}>
                {buyerConfirmed ? (
                  <View style={styles.pillConfirmed}>
                    <CheckCircle2 size={12} color="#047857" />
                    <Text style={styles.pillTextConfirmed}>
                      {isUrdu ? 'دستخط شدہ' : 'Signed'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.pillPending}>
                    <Clock size={12} color="#B45309" />
                    <Text style={styles.pillTextPending}>
                      {isUrdu ? 'دستخط درکار' : 'Pending'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Seller Box */}
            <View style={[styles.sigBox, sellerConfirmed ? styles.sigBoxConfirmed : styles.sigBoxPending]}>
              <View style={styles.sigBoxHeader}>
                <Text style={styles.sigRole}>{isUrdu ? 'فروخت کنندہ (Seller)' : 'Seller'}</Text>
                {currentRole === 'seller' && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>{isUrdu ? 'آپ' : 'You'}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.sigPartyName} numberOfLines={1}>
                {trade?.seller?.full_name || (isUrdu ? 'چوہدری احمد کسان' : 'Chaudhry Ahmad')}
              </Text>

              <View style={styles.sigStatusPill}>
                {sellerConfirmed ? (
                  <View style={styles.pillConfirmed}>
                    <CheckCircle2 size={12} color="#047857" />
                    <Text style={styles.pillTextConfirmed}>
                      {isUrdu ? 'دستخط شدہ' : 'Signed'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.pillPending}>
                    <Clock size={12} color="#B45309" />
                    <Text style={styles.pillTextPending}>
                      {isUrdu ? 'دستخط درکار' : 'Pending'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* 3. High-Clarity Contract Summary Table */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardHeader}>
            <FileText size={16} color="#15803D" />
            <Text style={styles.summaryCardTitle}>
              {isUrdu ? 'طے شدہ شرائط کا خلاصہ' : 'Contract Terms Summary'}
            </Text>
          </View>

          {/* Row 1: Item */}
          <View style={styles.tableRow}>
            <Text style={styles.colLabel}>{isUrdu ? 'فصل / جنس' : 'Crop / Produce'}</Text>
            <Text style={styles.colValue}>{productName}</Text>
          </View>

          {/* Row 2: Quantity */}
          <View style={styles.tableRow}>
            <Text style={styles.colLabel}>{isUrdu ? 'مقدار و وزن' : 'Quantity & Weight'}</Text>
            <Text style={styles.colValue}>{quantity}</Text>
          </View>

          {/* Row 3: Unit Rate */}
          <View style={styles.tableRow}>
            <Text style={styles.colLabel}>{isUrdu ? 'قیمت فی من' : 'Rate per Mann'}</Text>
            <Text style={styles.colValue}>{pricePerUnit}</Text>
          </View>

          {/* Row 4: Total Value Highlight */}
          <View style={[styles.tableRow, styles.totalHighlightRow]}>
            <Text style={styles.totalLabel}>{isUrdu ? 'کل مالیت' : 'Total Contract Value'}</Text>
            <Text style={styles.totalValue}>PKR {totalAmount}</Text>
          </View>

          {/* Row 5: Logistics */}
          <View style={styles.tableRow}>
            <Text style={styles.colLabel}>{isUrdu ? 'ڈیلیوری مقام' : 'Delivery Location'}</Text>
            <Text style={styles.colValue}>{deliveryLocation}</Text>
          </View>

          {/* Row 6: Delivery Date */}
          <View style={styles.tableRow}>
            <Text style={styles.colLabel}>{isUrdu ? 'ترسیل کی تاریخ' : 'Delivery Date'}</Text>
            <Text style={styles.colValue}>{deliveryDate}</Text>
          </View>

          {/* Row 7: Payment */}
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.colLabel}>{isUrdu ? 'طریقہ ادائیگی' : 'Payment Method'}</Text>
            <Text style={styles.colValue}>{paymentMethod}</Text>
          </View>
        </View>

        {/* 4. Discrete Demo Simulator */}
        {currentConfirmed && !bothConfirmed && (
          <View style={styles.demoBox}>
            <View style={styles.demoLeft}>
              <Sparkles size={14} color="#0F766E" />
              <Text style={styles.demoText}>
                {isUrdu
                  ? `ڈیمو ٹیسٹنگ: دوسرے فریق (${otherRoleName}) کے طور پر توثیق کریں`
                  : `Demo Testing: Simulate signature for ${otherRoleName}`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={handleSimulateOtherParty}
              disabled={simulating}
              activeOpacity={0.8}
            >
              {simulating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <UserCheck size={14} color="#FFFFFF" />
                  <Text style={styles.demoBtnText}>
                    {isUrdu ? 'توثیق سمیولیٹ کریں' : 'Simulate Signing'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 5. Clean Action Controls */}
        <View style={styles.actionContainer}>
          {bothConfirmed ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleAction}
              activeOpacity={0.85}
            >
              <FileCheck size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>
                {isUrdu ? 'حتمی معاہدہ دستاویز دیکھیں →' : 'View Final Agreement Document →'}
              </Text>
            </TouchableOpacity>
          ) : !currentConfirmed ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleAction}
              activeOpacity={0.85}
            >
              <ShieldCheck size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>
                {isUrdu ? 'بائیو میٹرک اسکین و توثیق کریں →' : 'Verify Biometric Identity & Sign →'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.waitingNotice}>
              <Clock size={16} color="#B45309" />
              <Text style={styles.waitingNoticeText}>
                {isUrdu
                  ? `دوسرے فریق (${otherRoleName}) کی توثیق کا انتظار ہے...`
                  : `Waiting for ${otherRoleName} to complete signature...`}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.push(`/trade/${tradeId}` as any)}
            activeOpacity={0.7}
          >
            <ArrowLeft size={15} color="#15803D" />
            <Text style={styles.backLinkText}>
              {isUrdu ? 'واپس تجارتی چیٹ پر جائیں' : 'Return to Trade Chat'}
            </Text>
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

  // Header Card
  headerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  headerMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tradeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tradeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statusBanner: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  statusRowConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusTextConfirmed: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  statusRowPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusTextPending: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  statusRowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusTextAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },

  // Section
  sectionContainer: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },

  // Signatures Row
  signaturesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sigBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    minHeight: 92,
  },
  sigBoxConfirmed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#A7F3D0',
  },
  sigBoxPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  sigBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sigRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  youBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  sigPartyName: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 6,
  },
  sigStatusPill: {
    marginTop: 'auto',
  },
  pillConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillTextConfirmed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  pillPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillTextPending: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },

  // Contract Summary Table
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 4,
  },
  summaryCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  colLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  colValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
    flex: 1.2,
  },
  totalHighlightRow: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: -14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DCFCE7',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
    textAlign: 'right',
  },

  // Demo Simulator Drawer
  demoBox: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  demoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoText: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
    flex: 1,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F766E',
    paddingVertical: 8,
    borderRadius: 6,
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Bottom Actions
  actionContainer: {
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803D',
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  waitingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 12,
    borderRadius: 10,
  },
  waitingNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  backLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
});
