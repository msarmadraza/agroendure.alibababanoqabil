import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Agreement, AgreementTerm, Trade } from '@/types/database';
import { fetchTradeById, fetchAgreementTerms } from '@/services/trade/tradeService';
import { finalizeAndGenerateAgreement, generateAgreementHTML } from '@/services/agreement/documentService';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/services/i18n/languageContext';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';
import { VoiceCircleButton } from '@/components/ui/VoiceCircleButton';
import { generateAgreementAudioSummaryUrdu } from '@/services/voice/speechService';
import { CheckCircle2, ShieldCheck, FileText, ArrowLeft, X } from 'lucide-react-native';

export default function FinalAgreementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tradeId = id || 'trade-101';

  const [trade, setTrade] = useState<Trade | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [terms, setTerms] = useState<AgreementTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const t = await fetchTradeById(tradeId);
      if (t) setTrade(t);

      const fetchedTerms = await fetchAgreementTerms(tradeId);
      setTerms(fetchedTerms);

      const finalDoc = await finalizeAndGenerateAgreement(tradeId, t, fetchedTerms);
      if (finalDoc) {
        setAgreement(finalDoc);
      }
      setLoading(false);
    }
    load();
  }, [tradeId]);

  const handleOpenDocument = () => {
    const agrNum = agreement?.agreement_number || 'AGR-2026-64722';
    const htmlContent = generateAgreementHTML(
      agrNum,
      trade,
      terms,
      new Date().toLocaleString(),
      new Date().toLocaleString()
    );

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        // Create Blob & Blob URL for Web
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // Open in new tab or download
        const newWin = window.open(url, '_blank');
        if (!newWin) {
          // Fallback download if popup is blocked
          const link = document.createElement('a');
          link.href = url;
          link.download = `AgroEndure_Agreement_${agrNum}.html`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (e) {
        console.warn('Web document open fallback:', e);
      }
    } else if (agreement && agreement.document_url) {
      Linking.openURL(agreement.document_url);
    }

    // Toggle Modal Preview as well
    setShowPreviewModal(true);
  };

  const agrNumber = agreement?.agreement_number || 'AGR-2026-64722';
  const prodName = agreement?.agreement_data?.productName || terms.find(t => t.field_name === 'product_name')?.value || 'Rice (چاول)';
  const qty = agreement?.agreement_data?.quantity || terms.find(t => t.field_name === 'quantity')?.value || '100 Mann';
  const price = agreement?.agreement_data?.price || terms.find(t => t.field_name === 'price_per_unit')?.value || 'PKR 5,700 per Mann';
  const loc = agreement?.agreement_data?.deliveryLocation || terms.find(t => t.field_name === 'delivery_location')?.value || 'Lahore';
  const delDate = agreement?.agreement_data?.deliveryDate || terms.find(t => t.field_name === 'delivery_date')?.value || '10 September 2026';
  const payMethod = agreement?.agreement_data?.paymentMethod || terms.find(t => t.field_name === 'payment_method')?.value || 'Bank Transfer';

  const { isUrdu } = useLanguage();

  const buyerName = trade?.buyer?.full_name || (isUrdu ? 'طارق ہول سیل خریدار' : 'Tariq Wholesale Buyer');
  const sellerName = trade?.seller?.full_name || (isUrdu ? 'چوہدری احمد کسان' : 'Chaudhry Ahmad');
  const finalSpeechSummary = generateAgreementAudioSummaryUrdu(
    buyerName,
    sellerName,
    prodName,
    qty,
    price,
    '570,000',
    loc,
    delDate,
    payMethod
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* TOP HEADER CONTROLS */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <VoiceCircleButton text={finalSpeechSummary} autoPlay size={38} />
        <LanguageSwitcherButton compact />
      </View>

      {/* SUCCESS HEADER BANNER */}
      <View style={styles.successBanner}>
        <CheckCircle2 size={32} color="#0F5132" />
        <Text style={styles.bannerTitle}>
          {isUrdu ? 'تجارتی معاہدہ باضابطہ تصدیق شدہ' : 'Transaction Agreement Confirmed!'}
        </Text>
        <Text style={styles.bannerSub}>
          {isUrdu
            ? 'دونوں فریقین نے بائیو میٹرک توثیق مکمل کر کے تمام شرائط منظور کر لی ہیں۔'
            : 'Both parties have biometrically verified and digitally confirmed all transaction terms.'}
        </Text>
      </View>

      {/* AGREEMENT DETAILS CARD */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{isUrdu ? 'معاہدہ نمبر:' : 'Agreement Number:'}</Text>
          <Text style={styles.badgeText}>{agrNumber}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{isUrdu ? 'حیثیت:' : 'Status:'}</Text>
          <View style={styles.statusBadge}>
            <ShieldCheck size={14} color="#0F5132" />
            <Text style={styles.statusText}>
              {isUrdu ? 'ڈیجیٹل طور پر مصدقہ و لاک' : 'Digitally Locked & Confirmed'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>{isUrdu ? 'خریدار کی توثیق:' : 'Buyer Confirmation:'}</Text>
          <View style={styles.confirmRow}>
            <CheckCircle2 size={13} color="#059669" />
            <Text style={styles.confirmText}>
              {isUrdu ? 'تصدیق شدہ' : 'Confirmed'} ({new Date().toLocaleDateString()})
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{isUrdu ? 'فروخت کنندہ کی توثیق:' : 'Seller Confirmation:'}</Text>
          <View style={styles.confirmRow}>
            <CheckCircle2 size={13} color="#059669" />
            <Text style={styles.confirmText}>
              {isUrdu ? 'تصدیق شدہ' : 'Confirmed'} ({new Date().toLocaleDateString()})
            </Text>
          </View>
        </View>
      </View>

      {/* AGREED SUMMARY CARD */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>
          {isUrdu ? 'طے شدہ شرائط کا خلاصہ' : 'Agreed Terms Summary'}
        </Text>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{isUrdu ? 'فصل / جنس:' : 'Product:'}</Text>
          <Text style={styles.summaryVal}>{prodName}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{isUrdu ? 'مقدار:' : 'Quantity:'}</Text>
          <Text style={styles.summaryVal}>{qty}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{isUrdu ? 'قیمت:' : 'Price:'}</Text>
          <Text style={styles.summaryVal}>{price}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{isUrdu ? 'ڈیلیوری مقام:' : 'Delivery Location:'}</Text>
          <Text style={styles.summaryVal}>{loc}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{isUrdu ? 'ترسیل کی تاریخ:' : 'Delivery Date:'}</Text>
          <Text style={styles.summaryVal}>{delDate}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{isUrdu ? 'طریقہ ادائیگی:' : 'Payment Method:'}</Text>
          <Text style={styles.summaryVal}>{payMethod}</Text>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actionGroup}>
        <Button
          title={isUrdu ? 'معاہدہ دستاویز ڈاؤن لوڈ / پرنٹ کریں' : 'View / Download Agreement Document'}
          onPress={handleOpenDocument}
          icon={<FileText size={18} color="#FFFFFF" />}
          style={styles.downloadBtn}
        />

        <TouchableOpacity style={styles.returnBtn} onPress={() => router.push('/(tabs)/messages')}>
          <ArrowLeft size={16} color="#1b4332" />
          <Text style={styles.returnText}>
            {isUrdu ? 'پیغامات پر واپس جائیں' : 'Return to Messages'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* INLINE DOCUMENT PREVIEW MODAL */}
      <Modal visible={showPreviewModal} animationType="slide" onRequestClose={() => setShowPreviewModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Official Agreement Document</Text>
            <TouchableOpacity onPress={() => setShowPreviewModal(false)} style={styles.closeBtn}>
              <X size={20} color="#1A202C" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.documentBody}>
            <View style={styles.docBorder}>
              <View style={styles.docHeader}>
                <Text style={styles.docLogo}>AgroEndure</Text>
                <Text style={styles.docBadge}>DIGITALLY CONFIRMED</Text>
              </View>

              <Text style={styles.docHeading}>AGRICULTURAL TRADE AGREEMENT</Text>
              <Text style={styles.docSub}>Reference: {agrNumber}</Text>

              <View style={styles.docSection}>
                <Text style={styles.docSecTitle}>PARTIES</Text>
                <Text style={styles.docText}>• Buyer: Tariq Wholesale Buyer</Text>
                <Text style={styles.docText}>• Seller: Chaudhry Ahmad (Farmer)</Text>
              </View>

              <View style={styles.docSection}>
                <Text style={styles.docSecTitle}>TRANSACTION TERMS</Text>
                <Text style={styles.docText}>• Product: {prodName}</Text>
                <Text style={styles.docText}>• Quantity: {qty}</Text>
                <Text style={styles.docText}>• Price per Unit: {price}</Text>
                <Text style={styles.docText}>• Total Value: PKR 570,000</Text>
              </View>

              <View style={styles.docSection}>
                <Text style={styles.docSecTitle}>LOGISTICS & PAYMENT</Text>
                <Text style={styles.docText}>• Delivery Location: {loc}</Text>
                <Text style={styles.docText}>• Delivery Date: {delDate}</Text>
                <Text style={styles.docText}>• Payment Method: {payMethod}</Text>
              </View>

              <View style={styles.docVerificationBox}>
                <Text style={styles.docVerifText}>✓ Buyer Biometrically Verified & Confirmed</Text>
                <Text style={styles.docVerifText}>✓ Seller Biometrically Verified & Confirmed</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Close Preview"
              onPress={() => setShowPreviewModal(false)}
              variant="outline"
              style={styles.modalCloseBtn}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  successBanner: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 24,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F5132',
    marginTop: 10,
    textAlign: 'center',
  },
  bannerSub: {
    fontSize: 13,
    color: '#1b4332',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 10,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1b4332',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1b4332',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1E7DD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F5132',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F5132',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionGroup: {
    marginTop: 10,
    marginBottom: 30,
    gap: 12,
  },
  downloadBtn: {
    backgroundColor: '#1b4332',
    paddingVertical: 14,
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  returnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b4332',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1b4332',
  },
  closeBtn: {
    padding: 6,
  },
  documentBody: {
    flex: 1,
    padding: 20,
  },
  docBorder: {
    borderWidth: 2,
    borderColor: '#1b4332',
    borderRadius: 12,
    padding: 24,
    backgroundColor: '#FAFAFA',
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1b4332',
    paddingBottom: 12,
  },
  docLogo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1b4332',
  },
  docBadge: {
    backgroundColor: '#D8F3DC',
    color: '#1b4332',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '800',
  },
  docHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  docSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  docSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docSecTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1b4332',
    marginBottom: 6,
  },
  docText: {
    fontSize: 14,
    color: '#334155',
    marginVertical: 2,
  },
  docVerificationBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 4,
    marginTop: 10,
  },
  docVerifText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F5132',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalCloseBtn: {
    width: '100%',
  },
});
