import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Clock,
  Sparkles,
  FileText,
  MessageCircle,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  ArrowRight,
} from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { loadAllTrades, loadTradeMessages, loadTradeTerms } from '@/services/trade/demoTradeStore';
import { fetchUserTrades, fetchAgreementTerms } from '@/services/trade/tradeService';
import { AgreementTerm, ChatMessage, Trade } from '@/types/database';
import { useDemoAuth } from '@/services/auth/demoAuthContext';
import { useLanguage } from '@/services/i18n/languageContext';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';

export default function Messages() {
  const router = useRouter();
  const { t, isUrdu } = useLanguage();
  const { activeUser, activeRole } = useDemoAuth();
  const [filter, setFilter] = useState<'all' | 'negotiating' | 'confirmed'>('all');
  const [trades, setTrades] = useState<Trade[]>(() => {
    const all = loadAllTrades();
    return all.length > 0
      ? all
      : [
          {
            id: 'trade-101',
            listing_id: 'listing-101',
            buyer_id: 'buyer-001',
            seller_id: 'seller-101',
            status: 'negotiating',
            buyer_confirmed: false,
            seller_confirmed: false,
            buyer_confirmed_at: null,
            seller_confirmed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            listing: {
              id: 'listing-101',
              seller_id: 'seller-101',
              title: 'سپر باسمتی چاول',
              product_name: 'سپر باسمتی چاول',
              price: 5700,
              quantity: 100,
              quantity_unit: 'Mann',
              currency: 'PKR',
              location: 'Lahore, Punjab',
              image_url: null,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            seller: {
              id: 'seller-101',
              full_name: 'چوہدری احمد',
              role: 'seller',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            buyer: {
              id: 'buyer-001',
              full_name: 'طارق خریدار',
              role: 'buyer',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          } as unknown as Trade,
        ];
  });

  useEffect(() => {
    async function loadTrades() {
      const userTrades = await fetchUserTrades(activeUser?.id || '');
      if (userTrades && userTrades.length > 0) {
        setTrades(userTrades);
      }
    }
    loadTrades();
  }, [activeUser?.id]);

  const negotiatingTrades = trades.filter((t) => t.status !== 'confirmed');
  const confirmedTrades = trades.filter((t) => t.status === 'confirmed');

  const filteredTrades =
    filter === 'negotiating'
      ? negotiatingTrades
      : filter === 'confirmed'
      ? confirmedTrades
      : trades;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Header with clean horizontal layout */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{t('messages.title')}</Text>
            <Text style={styles.subtitle}>{t('messages.subtitle')}</Text>
          </View>
          <LanguageSwitcherButton compact />
        </View>

        {/* AI Deal Copilot Quick Hub Banner */}
        <TouchableOpacity
          style={[styles.aiBanner, Shadows.soft]}
          onPress={() => router.push('/trade/trade-101')}
          activeOpacity={0.88}
        >
          <View style={styles.aiBannerTopRow}>
            <View style={styles.copilotBadge}>
              <Sparkles size={13} color="#10B981" />
              <Text style={styles.copilotBadgeText}>AgroEndure Copilot</Text>
              <View style={styles.pulseLiveDot} />
              <Text style={styles.liveIndicatorText}>{t('messages.liveActive')}</Text>
            </View>
            <View style={styles.tradeRoomPill}>
              <Text style={styles.tradeRoomPillText}>{t('messages.openTradeRoom')}</Text>
              <ArrowRight size={12} color="#10B981" />
            </View>
          </View>
          <Text style={styles.aiBannerTitle}>{t('messages.bannerTitle')}</Text>
          <Text style={styles.aiBannerDesc}>{t('messages.bannerDesc')}</Text>
        </TouchableOpacity>

        {/* Segmented Filter Control */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[styles.segmentTab, filter === 'all' && styles.segmentTabActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentTabText, filter === 'all' && styles.segmentTabTextActive]}>
              {t('messages.tabAll')} ({trades.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentTab, filter === 'negotiating' && styles.segmentTabActive]}
            onPress={() => setFilter('negotiating')}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentTabText, filter === 'negotiating' && styles.segmentTabTextActive]}>
              {t('messages.tabNegotiating')} ({negotiatingTrades.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentTab, filter === 'confirmed' && styles.segmentTabActive]}
            onPress={() => setFilter('confirmed')}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentTabText, filter === 'confirmed' && styles.segmentTabTextActive]}>
              {t('messages.tabConfirmed')} ({confirmedTrades.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conversations List */}
        <View style={styles.list}>
          {filteredTrades.map((trade) => {
            const partner = activeRole === 'seller' ? trade.buyer : trade.seller;
            const partnerName =
              partner?.full_name ||
              (activeRole === 'seller'
                ? isUrdu
                  ? 'خریدار'
                  : 'Buyer'
                : isUrdu
                ? 'کسان'
                : 'Farmer');
            const cropTitle = trade.listing?.product_name || trade.listing?.title || (isUrdu ? 'فصل' : 'Crop');
            const cropQty = trade.listing ? `${trade.listing.quantity} ${trade.listing.quantity_unit || 'من'}` : '';
            const cropPrice = trade.listing ? `₨${Number(trade.listing.price).toLocaleString()}/من` : '';
            const tradeMsgs = loadTradeMessages(trade.id);
            const lastMsg = tradeMsgs[tradeMsgs.length - 1];
            const tradeTerms = loadTradeTerms(trade.id, trade.listing);
            const agreedCount = tradeTerms.filter((t) => t.status === 'agreed').length;
            const progressPercent = Math.round((agreedCount / 6) * 100);
            const isReady = progressPercent >= 80;
            const isConfirmed = trade.status === 'confirmed';

            if (isConfirmed) {
              const pNum = Number(trade.listing?.price) || 5700;
              const qNum = Number(trade.listing?.quantity) || 100;
              const totalVal = (pNum * qNum).toLocaleString();

              return (
                <View key={trade.id} style={[styles.tradeCard, styles.confirmedCard, Shadows.soft]}>
                  <View style={styles.confirmedHeaderRow}>
                    <View style={styles.contractIdGroup}>
                      <FileCheck size={16} color="#059669" />
                      <Text style={styles.contractIdText}>
                        {isUrdu ? `معاہدہ #${trade.id}` : `Contract #${trade.id}`}
                      </Text>
                    </View>
                    <View style={styles.executedBadge}>
                      <ShieldCheck size={11} color="#065F46" />
                      <Text style={styles.executedBadgeText}>
                        {t('messages.contractExecuted')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.confirmedDetailsBody}>
                    <Text style={styles.confirmedParties}>
                      {trade.buyer?.full_name || 'Buyer'} ⇄ {trade.seller?.full_name || 'Farmer'}
                    </Text>
                    <Text style={styles.confirmedSpecs}>
                      {`${cropQty} ${cropTitle} • ${isUrdu ? 'کل مالیت:' : 'Total Value:'} ₨${totalVal} • ${isUrdu ? 'بائیو میٹرک تصدیق شدہ' : 'Biometric Verified'}`}
                    </Text>
                  </View>

                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.finalDocBtn}
                      onPress={() => router.push(`/agreement/final/${trade.id}` as any)}
                      activeOpacity={0.85}
                    >
                      <FileText size={15} color="#FFFFFF" />
                      <Text style={styles.finalDocText}>
                        {isUrdu
                          ? 'حتمی قانونی معاہدہ دستاویز دیکھیں →'
                          : 'View Final Confirmed Agreement Document →'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            // Negotiating Trade Card
            return (
              <View key={trade.id} style={[styles.tradeCard, Shadows.soft]}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => router.push(`/trade/${trade.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={activeRole === 'seller' ? styles.avatarBuyer : styles.avatarSeller}>
                    <Text style={activeRole === 'seller' ? styles.avatarTextBuyer : styles.avatarText}>
                      {partnerName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.partnerName}>{partnerName}</Text>
                      <View style={styles.verifiedBadge}>
                        <ShieldCheck size={11} color="#065F46" />
                        <Text style={styles.verifiedText}>{t('messages.verifiedFarmer')}</Text>
                      </View>
                    </View>
                    <View style={styles.commodityRow}>
                      <Text style={styles.tradeTitle}>
                        {cropTitle} {cropQty ? `• ${cropQty}` : ''}
                      </Text>
                      {cropPrice ? <Text style={styles.priceTag}>{cropPrice}</Text> : null}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Latest Message Preview */}
                <TouchableOpacity
                  style={styles.latestMsgBox}
                  onPress={() => router.push(`/trade/${trade.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.msgLeftIcon}>
                    <MessageCircle size={14} color="#059669" />
                  </View>
                  <Text style={styles.latestMsgText} numberOfLines={1}>
                    {lastMsg?.content || lastMsg?.transcription || (isUrdu ? 'بات چیت جاری ہے...' : 'Negotiation in progress...')}
                  </Text>
                  <View style={styles.timeRow}>
                    <Clock size={11} color="#94A3B8" />
                    <Text style={styles.timeText}>{isUrdu ? 'ابھی' : 'Active'}</Text>
                  </View>
                </TouchableOpacity>

                {/* Progress Strip */}
                <View style={styles.progressStrip}>
                  <View style={styles.progressHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <Text style={styles.progressLabel}>
                        {isUrdu
                          ? `6 میں سے ${agreedCount} شرائط طے شدہ (${progressPercent}%)`
                          : `${agreedCount} of 6 terms agreed (${progressPercent}%)`}
                      </Text>
                    </View>
                    {isReady && (
                      <View style={styles.readyBadge}>
                        <Text style={styles.readyBadgeText}>{t('messages.readyToFinalize')}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(100, progressPercent)}%` }]} />
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.chatPrimaryBtn}
                    onPress={() => router.push(`/trade/${trade.id}` as any)}
                    activeOpacity={0.85}
                  >
                    <MessageCircle size={15} color="#FFFFFF" />
                    <Text style={styles.chatPrimaryText}>
                      {t('messages.continueChat')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.reviewSecondaryBtn}
                    onPress={() => router.push(`/agreement/${trade.id}` as any)}
                    activeOpacity={0.85}
                  >
                    <FileText size={14} color="#065F46" />
                    <Text style={styles.reviewSecondaryText}>
                      {t('messages.reviewAgreement')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
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
    padding: Spacing.lg,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 18,
  },
  aiBanner: {
    backgroundColor: '#064E3B',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  aiBannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  copilotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 95, 70, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  copilotBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D1FAE5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pulseLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveIndicatorText: {
    fontSize: 10,
    color: '#A7F3D0',
    fontWeight: '600',
  },
  tradeRoomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  tradeRoomPillText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
  },
  aiBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  aiBannerDesc: {
    fontSize: 12,
    color: '#A7F3D0',
    lineHeight: 18,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 3,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    gap: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  list: {
    gap: Spacing.md,
  },
  tradeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  avatarSeller: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBuyer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  avatarTextBuyer: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  commodityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  tradeTitle: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  priceTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  newOfferBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  newOfferBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  latestMsgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  msgLeftIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },
  latestMsgText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  progressStrip: {
    marginVertical: 6,
    paddingTop: 4,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  readyBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  readyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  chatPrimaryBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#064E3B',
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  replyPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0369A1',
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  chatPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: '#064E3B',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  reviewSecondaryText: {
    color: '#064E3B',
    fontSize: 12,
    fontWeight: '700',
  },
  confirmedCard: {
    borderColor: '#A7F3D0',
    backgroundColor: '#FFFFFF',
  },
  confirmedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contractIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contractIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  executedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  executedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  confirmedDetailsBody: {
    marginVertical: 4,
  },
  confirmedParties: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  confirmedSpecs: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  finalDocBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#065F46',
    paddingVertical: 11,
    borderRadius: Radius.lg,
  },
  finalDocText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
