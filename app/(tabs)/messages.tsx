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
import { loadTradeMessages, loadTradeTerms } from '@/services/trade/demoTradeStore';
import { fetchAgreementTerms } from '@/services/trade/tradeService';
import { AgreementTerm, ChatMessage } from '@/types/database';
import { useLanguage } from '@/services/i18n/languageContext';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';

export default function Messages() {
  const router = useRouter();
  const { t, isUrdu } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'negotiating' | 'confirmed'>('all');
  const [terms101, setTerms101] = useState<AgreementTerm[]>(() => loadTradeTerms('trade-101'));
  const [messages101, setMessages101] = useState<ChatMessage[]>(() => loadTradeMessages('trade-101'));

  useEffect(() => {
    async function loadTerms() {
      const dbTerms = await fetchAgreementTerms('trade-101');
      if (dbTerms && dbTerms.length > 0) {
        setTerms101(dbTerms);
      }
    }
    loadTerms();
  }, []);

  const agreedCount = terms101.filter((term) => term.status === 'agreed').length;
  const progressPercent = Math.round((agreedCount / 6) * 100);
  const isReadyForReview = progressPercent >= 80;
  const lastMsg101 = messages101[messages101.length - 1];

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
              {t('messages.tabAll')} (3)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentTab, filter === 'negotiating' && styles.segmentTabActive]}
            onPress={() => setFilter('negotiating')}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentTabText, filter === 'negotiating' && styles.segmentTabTextActive]}>
              {t('messages.tabNegotiating')} (2)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentTab, filter === 'confirmed' && styles.segmentTabActive]}
            onPress={() => setFilter('confirmed')}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentTabText, filter === 'confirmed' && styles.segmentTabTextActive]}>
              {t('messages.tabConfirmed')} (1)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conversations List */}
        <View style={styles.list}>
          {/* TRADE 101 - Primary Active Negotiation */}
          {(filter === 'all' || filter === 'negotiating') && (
            <View style={[styles.tradeCard, Shadows.soft]}>
              {/* Partner & Commodity Info */}
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => router.push('/trade/trade-101')}
                activeOpacity={0.8}
              >
                <View style={styles.avatarSeller}>
                  <Text style={styles.avatarText}>CA</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.partnerName}>
                      {isUrdu ? 'چوہدری احمد' : 'Chaudhry Ahmad'}
                    </Text>
                    <View style={styles.verifiedBadge}>
                      <ShieldCheck size={11} color="#065F46" />
                      <Text style={styles.verifiedText}>{t('messages.verifiedFarmer')}</Text>
                    </View>
                  </View>
                  <View style={styles.commodityRow}>
                    <Text style={styles.tradeTitle}>
                      {isUrdu ? 'سپر باسمتی چاول • 100 من' : 'Super Basmati Rice • 100 Mann'}
                    </Text>
                    <Text style={styles.priceTag}>
                      {isUrdu ? '₨5,700/من' : '₨5,700/Mann'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Latest Message Preview */}
              <TouchableOpacity
                style={styles.latestMsgBox}
                onPress={() => router.push('/trade/trade-101')}
                activeOpacity={0.8}
              >
                <View style={styles.msgLeftIcon}>
                  <MessageCircle size={14} color="#059669" />
                </View>
                <Text style={styles.latestMsgText} numberOfLines={1}>
                  {lastMsg101?.content || lastMsg101?.transcription || (isUrdu ? 'ٹھیک ہے، 5700 فائنل۔' : 'Agreed, 5,700 final.')}
                </Text>
                <View style={styles.timeRow}>
                  <Clock size={11} color="#94A3B8" />
                  <Text style={styles.timeText}>{isUrdu ? '2 منٹ پہلے' : '2m ago'}</Text>
                </View>
              </TouchableOpacity>

              {/* Slender Agreement Progress Tracker */}
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
                  {isReadyForReview && (
                    <View style={styles.readyBadge}>
                      <Text style={styles.readyBadgeText}>{t('messages.readyToFinalize')}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, progressPercent)}%` }]} />
                </View>
              </View>

              {/* Contextual Action Buttons */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.chatPrimaryBtn}
                  onPress={() => router.push('/trade/trade-101')}
                  activeOpacity={0.85}
                >
                  <MessageCircle size={15} color="#FFFFFF" />
                  <Text style={styles.chatPrimaryText}>
                    {t('messages.continueChat')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reviewSecondaryBtn}
                  onPress={() => router.push('/agreement/trade-101')}
                  activeOpacity={0.85}
                >
                  <FileText size={14} color="#065F46" />
                  <Text style={styles.reviewSecondaryText}>
                    {t('messages.reviewAgreement')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TRADE 102 - Ahmad Ali Wheat Bid */}
          {(filter === 'all' || filter === 'negotiating') && (
            <View style={[styles.tradeCard, Shadows.soft]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => router.push('/trade/trade-101')}
                activeOpacity={0.8}
              >
                <View style={styles.avatarBuyer}>
                  <Text style={styles.avatarTextBuyer}>AA</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.partnerName}>
                      {isUrdu ? 'احمد علی' : 'Ahmad Ali'}
                    </Text>
                    <View style={styles.newOfferBadge}>
                      <Text style={styles.newOfferBadgeText}>
                        {t('messages.newOfferTag')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.commodityRow}>
                    <Text style={styles.tradeTitle}>
                      {isUrdu ? 'اعلیٰ کوالٹی گندم • 50 من' : 'High Quality Wheat • 50 Mann'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.latestMsgBox}
                onPress={() => router.push('/trade/trade-101')}
                activeOpacity={0.8}
              >
                <View style={styles.msgLeftIcon}>
                  <MessageCircle size={14} color="#0284C7" />
                </View>
                <Text style={styles.latestMsgText} numberOfLines={1}>
                  {isUrdu
                    ? 'سلام، آپ کی گندم کی قیمت میں کمی ممکن ہے؟'
                    : 'Hello, can you offer a discount on the wheat price?'}
                </Text>
                <View style={styles.timeRow}>
                  <Clock size={11} color="#94A3B8" />
                  <Text style={styles.timeText}>{isUrdu ? '5 منٹ پہلے' : '5m ago'}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.replyPrimaryBtn}
                  onPress={() => router.push('/trade/trade-101')}
                  activeOpacity={0.85}
                >
                  <MessageCircle size={15} color="#FFFFFF" />
                  <Text style={styles.chatPrimaryText}>
                    {t('messages.replyToOffer')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* CONFIRMED CONTRACT SECTION */}
          {(filter === 'all' || filter === 'confirmed') && (
            <View style={[styles.tradeCard, styles.confirmedCard, Shadows.soft]}>
              <View style={styles.confirmedHeaderRow}>
                <View style={styles.contractIdGroup}>
                  <FileCheck size={16} color="#059669" />
                  <Text style={styles.contractIdText}>
                    {isUrdu ? 'معاہدہ #AGR-2026-64722' : 'Contract #AGR-2026-64722'}
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
                  {isUrdu ? 'طارق ہول سیل خریدار ⇄ چوہدری احمد' : 'Tariq Wholesale Buyer ⇄ Chaudhry Ahmad'}
                </Text>
                <Text style={styles.confirmedSpecs}>
                  {isUrdu
                    ? '100 من سپر باسمتی چاول • کل مالیت: ₨570,000 • بائیو میٹرک تصدیق شدہ'
                    : '100 Mann Super Basmati Rice • Total Value: PKR 570,000 • Biometric Verified'}
                </Text>
              </View>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.finalDocBtn}
                  onPress={() => router.push('/agreement/final/trade-101' as any)}
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
          )}
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
