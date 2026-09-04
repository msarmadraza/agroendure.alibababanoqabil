import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Clock,
  Bot,
  FileText,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User,
  Sprout,
  ShieldCheck,
  FileCheck,
} from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { loadTradeMessages, loadTradeTerms } from '@/services/trade/demoTradeStore';
import { fetchAgreementTerms } from '@/services/trade/tradeService';
import { AgreementTerm, ChatMessage } from '@/types/database';

export default function Messages() {
  const router = useRouter();
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

  const agreedCount = terms101.filter((t) => t.status === 'agreed').length;
  const progressPercent = Math.round((agreedCount / 6) * 100);
  const isReadyForReview = progressPercent >= 100;
  const lastMsg101 = messages101[messages101.length - 1];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>پیغامات اور تجارتی بات چیت</Text>
            <Text style={styles.subtitle}>AI ڈیل کوپائلٹ کے ذریعے معاہدات طے کریں</Text>
          </View>
        </View>

        {/* AI Deal Copilot Quick Banner */}
        <TouchableOpacity
          style={[styles.aiBanner, Shadows.soft]}
          onPress={() => router.push('/trade/trade-101')}
          activeOpacity={0.85}
        >
          <View style={styles.aiBannerLeft}>
            <View style={styles.botIconCircle}>
              <Bot size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.bannerTagRow}>
                <Text style={styles.bannerTag}>AgroEndure AI Copilot 🤖</Text>
                <Text style={styles.liveIndicator}>• لائیو فعال</Text>
              </View>
              <Text style={styles.aiBannerTitle}>تجارتی مذاکرات اور اسمارٹ کنٹریکٹ</Text>
              <Text style={styles.aiBannerDesc}>
                اردو و انگریزی میں چیٹ یا آواز کے ذریعے قیمت، مقدار اور ڈیلیوری شرائط طے کریں
              </Text>
            </View>
          </View>
          <View style={styles.aiBannerFooter}>
            <Text style={styles.aiBannerActionText}>ٹریڈ روم میں جائیں (Open Trade Room) →</Text>
          </View>
        </TouchableOpacity>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              تمام (All)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'negotiating' && styles.filterChipActive]}
            onPress={() => setFilter('negotiating')}
          >
            <Text style={[styles.filterChipText, filter === 'negotiating' && styles.filterChipTextActive]}>
              زیر گفت و شنید (Negotiating)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'confirmed' && styles.filterChipActive]}
            onPress={() => setFilter('confirmed')}
          >
            <Text style={[styles.filterChipText, filter === 'confirmed' && styles.filterChipTextActive]}>
              معاہدے (Agreements)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conversations List */}
        <View style={styles.list}>
          {/* TRADE 101 - Primary Active Negotiation */}
          {(filter === 'all' || filter === 'negotiating') && (
            <View style={[styles.tradeCard, Shadows.soft]}>
              {/* Partner Info */}
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => router.push('/trade/trade-101')}
                activeOpacity={0.8}
              >
                <View style={styles.avatarSeller}>
                  <Text style={styles.avatarText}>چ</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.partnerName}>چوہدری احمد (Chaudhry Ahmad)</Text>
                    <View style={styles.verifiedBadge}>
                      <ShieldCheck size={11} color="#0F5132" />
                      <Text style={styles.verifiedText}>تصدیق شدہ کسان</Text>
                    </View>
                  </View>
                  <Text style={styles.tradeTitle}>
                    🌾 سپر باسمتی چاول (Super Basmati Rice) • 100 من
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Latest Message Preview */}
              <TouchableOpacity
                style={styles.latestMsgBox}
                onPress={() => router.push('/trade/trade-101')}
              >
                <MessageCircle size={14} color={Colors.mutedForeground} />
                <Text style={styles.latestMsgText} numberOfLines={1}>
                  {lastMsg101?.content || lastMsg101?.transcription || 'ٹھیک ہے، 5700 فائنل۔'}
                </Text>
                <View style={styles.timeRow}>
                  <Clock size={11} color={Colors.mutedForeground} />
                  <Text style={styles.timeText}>2 منٹ پہلے</Text>
                </View>
              </TouchableOpacity>

              {/* AI Deal Copilot Progress Status Box */}
              <View style={styles.copilotBox}>
                <View style={styles.copilotHeader}>
                  <View style={styles.copilotHeaderLeft}>
                    <Bot size={15} color="#1b4332" />
                    <Text style={styles.copilotTitle}>معاہدے کی پیش رفت (Agreement Completeness):</Text>
                  </View>
                  <Text style={styles.copilotPercent}>{progressPercent}%</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, progressPercent)}%` }]} />
                </View>

                {/* Agreed vs Missing pills */}
                <View style={styles.termsPillRow}>
                  <View style={styles.agreedPill}>
                    <CheckCircle2 size={11} color="#0F5132" />
                    <Text style={styles.agreedPillText}>
                      طے شدہ ({agreedCount}/6): چاول، 100 من، ₨5,700
                    </Text>
                  </View>
                  {!isReadyForReview && (
                    <View style={styles.missingPill}>
                      <AlertTriangle size={11} color="#842029" />
                      <Text style={styles.missingPillText}>زیر بحث: مقام، تاریخ، ادائیگی</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              {/* Single Action Button: بولی لگائیں */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.chatPrimaryBtn}
                  onPress={() => router.push('/trade/trade-101')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chatPrimaryText}>بولی لگائیں</Text>
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
                  <Text style={styles.avatarTextBuyer}>ا</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.partnerName}>احمد علی (Ahmad Ali)</Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.statusText, { color: '#B45309' }]}>نئی بولی (New Bid)</Text>
                    </View>
                  </View>
                  <Text style={styles.tradeTitle}>🌾 اعلیٰ کوالٹی گندم (Wheat) • 50 من</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.latestMsgBox}>
                <MessageCircle size={14} color={Colors.mutedForeground} />
                <Text style={styles.latestMsgText} numberOfLines={1}>
                  سلام، آپ کی گندم کی قیمت میں کمی ممکن ہے؟
                </Text>
                <View style={styles.timeRow}>
                  <Clock size={11} color={Colors.mutedForeground} />
                  <Text style={styles.timeText}>5 منٹ پہلے</Text>
                </View>
              </View>

              {/* Single Action Button: بولی لگائیں */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.chatPrimaryBtn}
                  onPress={() => router.push('/trade/trade-101')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chatPrimaryText}>بولی لگائیں</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* CONFIRMED AGREEMENTS SECTION */}
          {(filter === 'all' || filter === 'confirmed') && (
            <View style={[styles.tradeCard, styles.confirmedCard, Shadows.soft]}>
              <View style={styles.confirmedBadgeTop}>
                <FileCheck size={14} color="#0F5132" />
                <Text style={styles.confirmedBadgeTopText}>ڈیجیٹل تصدیق شدہ معاہدہ (Confirmed Contract)</Text>
              </View>

              <View style={styles.cardHeader}>
                <View style={styles.avatarConfirmed}>
                  <Text style={styles.avatarTextConfirmed}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partnerName}>معاہدہ #AGR-2026-64722</Text>
                  <Text style={styles.tradeTitle}>طارق ہول سیل خریدار ⇄ چوہدری احمد</Text>
                  <Text style={styles.confirmedSub}>
                    100 من چاول • ₨5,700/من • ڈیلیوری: لاہور • بائیو میٹرک تصدیق شدہ
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.finalDocBtn}
                  onPress={() => router.push('/agreement/final/trade-101' as any)}
                  activeOpacity={0.8}
                >
                  <FileText size={16} color="#FFFFFF" />
                  <Text style={styles.finalDocText}>حتمی قانونی معاہدہ دستاویز دیکھیں (Final Document)</Text>
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
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: '#64748B',
    marginTop: 2,
  },
  aiBanner: {
    backgroundColor: '#1b4332',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  aiBannerLeft: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  botIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bannerTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#95D5B2',
    textTransform: 'uppercase',
  },
  liveIndicator: {
    fontSize: 11,
    color: '#D8F3DC',
    fontWeight: '600',
  },
  aiBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aiBannerDesc: {
    fontSize: 12,
    color: '#D8F3DC',
    lineHeight: 18,
  },
  aiBannerFooter: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#2d6a4f',
    alignItems: 'flex-end',
  },
  aiBannerActionText: {
    color: '#95D5B2',
    fontSize: 13,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1b4332',
    borderColor: '#1b4332',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    gap: Spacing.lg,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBuyer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1b4332',
  },
  avatarTextBuyer: {
    fontSize: 17,
    fontWeight: '800',
    color: '#084298',
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
    backgroundColor: '#D1E7DD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F5132',
  },
  tradeTitle: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    marginTop: 2,
  },
  latestMsgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1b4332',
  },
  latestMsgText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
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
  copilotBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#B7E4C7',
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
  },
  copilotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  copilotHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copilotTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b4332',
  },
  copilotPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1b4332',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#D8F3DC',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2D6A4F',
    borderRadius: 3,
  },
  termsPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  agreedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1E7DD',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  agreedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F5132',
  },
  missingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8D7DA',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  missingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#842029',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chatPrimaryBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1b4332',
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  chatPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  reviewSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: '#1b4332',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  reviewSecondaryText: {
    color: '#1b4332',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  confirmedCard: {
    borderColor: '#86EFAC',
    backgroundColor: '#F9FFF9',
  },
  confirmedBadgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D8F3DC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  confirmedBadgeTopText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b4332',
  },
  avatarConfirmed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextConfirmed: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  confirmedSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 16,
  },
  finalDocBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2D6A4F',
    paddingVertical: 11,
    borderRadius: Radius.lg,
  },
  finalDocText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
