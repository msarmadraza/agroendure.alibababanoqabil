import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { AgreementTerm } from '@/types/database';
import { KNOWN_AGREEMENT_FIELDS, getAgreementFieldLabel } from '@/types/agreement';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TermItem } from './TermItem';
import { SuggestedQuestions } from './SuggestedQuestions';
import { Bot, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, AlertTriangle, FileText, Clock } from 'lucide-react-native';
import { useLanguage } from '@/services/i18n/languageContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AIAssistantCardProps {
  terms: AgreementTerm[];
  missingFields?: string[];
  suggestedQuestions?: string[];
  onSelectQuestion: (question: string) => void;
  onReviewAgreement?: () => void;
}

export const AIAssistantCard: React.FC<AIAssistantCardProps> = ({
  terms,
  missingFields = ['delivery_location', 'delivery_date', 'payment_method'],
  suggestedQuestions = [
    'Where will the crop be delivered?',
    'What is the expected delivery date?',
    'How will payment be made?',
  ],
  onSelectQuestion,
  onReviewAgreement,
}) => {
  const { t, isUrdu } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(!collapsed);
  };

  const agreedTerms = terms.filter((t) => t.status === 'agreed');
  const pendingTerms = terms.filter((t) => t.status === 'proposed' || t.status === 'negotiating');
  const conflictingTerms = terms.filter((t) => t.status === 'conflicting');

  const presentFieldNames = terms.map((t) => t.field_name);
  const actualMissingFields = missingFields.filter((f) => !presentFieldNames.includes(f));
  const actualQuestions = suggestedQuestions.filter((q) => {
    const qLower = q.toLowerCase();
    if (qLower.includes('deliver') && presentFieldNames.includes('delivery_location')) return false;
    if (qLower.includes('date') && presentFieldNames.includes('delivery_date')) return false;
    if (qLower.includes('payment') && presentFieldNames.includes('payment_method')) return false;
    return true;
  });

  // Calculate percentage: total core fields expected ~ 6
  const totalCoreFields = 6;
  const progressPercentage = Math.round((agreedTerms.length / totalCoreFields) * 100);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={toggleCollapse} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <Bot size={22} color="#1b4332" />
          <Text style={styles.headerTitle}>{t('trade.aiCopilotTitle')}</Text>
        </View>
        {collapsed ? <ChevronDown size={20} color="#1b4332" /> : <ChevronUp size={20} color="#1b4332" />}
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.body}>
          <ProgressBar progress={progressPercentage} label={t('trade.completeness')} />

          {/* CONFLICTING TERMS ALERT */}
          {conflictingTerms.length > 0 && (
            <View style={styles.conflictBox}>
              <View style={styles.conflictHeader}>
                <AlertCircle size={18} color="#842029" />
                <Text style={styles.conflictTitle}>{t('trade.conflictDetected')}</Text>
              </View>
              {conflictingTerms.map((t) => (
                <View key={t.id} style={styles.conflictItem}>
                  <Text style={styles.conflictField}>
                    {getAgreementFieldLabel(t.field_name, isUrdu)}
                  </Text>
                  <Text style={styles.conflictDetail}>
                    {isUrdu ? 'موجودہ تجویز کردہ قیمت / قدر:' : 'Current Candidate Value:'} {String(t.value)}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.confirmActionBtn}
                onPress={() =>
                  onSelectQuestion(
                    isUrdu
                      ? 'براہ کرم فائنل ڈیلیوری مقام اور شرائط کی تصدیق کریں۔'
                      : 'Please confirm the final delivery location.'
                  )
                }
              >
                <Text style={styles.confirmActionText}>{t('trade.askBothConfirm')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* AGREED TERMS */}
          {agreedTerms.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <CheckCircle2 size={15} color="#0F5132" />
                <Text style={[styles.sectionTitle, { color: '#0F5132' }]}>{t('trade.agreedTerms')}</Text>
              </View>
              {agreedTerms.map((t) => (
                <TermItem key={t.id} term={t} />
              ))}
            </View>
          )}

          {/* PENDING / NEGOTIATING */}
          {pendingTerms.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Clock size={15} color="#B45309" />
                <Text style={[styles.sectionTitle, { color: '#92400E' }]}>{t('trade.pendingTerms')}</Text>
              </View>
              {pendingTerms.map((t) => (
                <TermItem key={t.id} term={t} />
              ))}
            </View>
          )}

          {/* MISSING INFORMATION */}
          {actualMissingFields.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <AlertTriangle size={15} color="#991B1B" />
                <Text style={[styles.sectionTitle, { color: '#991B1B' }]}>{t('trade.requiredInfo')}</Text>
              </View>
              {actualMissingFields.map((field, idx) => (
                <View key={idx} style={styles.missingRow}>
                  <Text style={styles.missingText}>{getAgreementFieldLabel(field, isUrdu)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* SUGGESTED QUESTIONS */}
          <SuggestedQuestions questions={actualQuestions} onSelectQuestion={onSelectQuestion} />

          {/* GENERATE AGREEMENT BUTTON (WHEN ALMOST COMPLETE) */}
          {(progressPercentage >= 60 || agreedTerms.length >= 3) && onReviewAgreement && (
            <TouchableOpacity style={styles.reviewBtn} onPress={onReviewAgreement} activeOpacity={0.85}>
              <FileText size={18} color="#FFFFFF" />
              <Text style={styles.reviewBtnText}>{t('trade.finalizeAndReview')} →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#B7E4C7',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F0FDF4',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b4332',
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  section: {
    marginTop: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  missingRow: {
    paddingVertical: 4,
    paddingLeft: 8,
  },
  missingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#842029',
  },
  conflictBox: {
    backgroundColor: '#F8D7DA',
    borderColor: '#F5C2C7',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  conflictTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#842029',
  },
  conflictItem: {
    marginBottom: 6,
  },
  conflictField: {
    fontSize: 13,
    fontWeight: '700',
    color: '#842029',
  },
  conflictDetail: {
    fontSize: 12,
    color: '#58151C',
  },
  confirmActionBtn: {
    backgroundColor: '#842029',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b4332',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 12,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
