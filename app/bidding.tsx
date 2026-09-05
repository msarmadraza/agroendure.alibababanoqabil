import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Truck,
  MessageCircle,
  Mic,
  Send,
  Play,
  Sparkles,
  Bot,
  FileText,
  Package,
  User,
} from 'lucide-react-native';
import { VoiceButton } from '@/components/VoiceButton';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';
import { useLanguage } from '@/services/i18n/languageContext';
import { LanguageSwitcherButton } from '@/components/ui/LanguageSwitcherButton';

export default function Bidding() {
  const router = useRouter();
  const { t, isUrdu } = useLanguage();
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [customTerms, setCustomTerms] = useState('');
  const [isRecordingTerms, setIsRecordingTerms] = useState(false);
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState([
    {
      id: 1,
      sender: 'farmer',
      message: isUrdu
        ? 'آپ کی بولی دیکھی، کیا کم سے کم 83 ہزار ممکن ہے؟'
        : 'I saw your bid. Is 83,000 the minimum possible?',
      time: isUrdu ? '2 منٹ پہلے' : '2m ago',
      isVoice: true,
      duration: '0:12',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecordingMessage, setIsRecordingMessage] = useState(false);

  const cropInfo = {
    title: isUrdu ? 'اعلیٰ کوالٹی گندم' : 'Premium Quality Wheat',
    currentPrice: 85000,
    quantity: isUrdu ? '50 من' : '50 Mann',
    farmer: isUrdu ? 'احمد علی' : 'Ahmad Ali',
  };

  const handleSubmitBid = () => {
    if (!bidAmount) {
      Alert.alert(
        isUrdu ? 'خرابی' : 'Error',
        isUrdu ? 'براہ کرم اپنی بولی کی رقم درج کریں' : 'Please enter your bid amount'
      );
      return;
    }
    Alert.alert(
      isUrdu ? 'کامیاب' : 'Success',
      isUrdu ? 'آپ کی بولی کامیابی سے جمع ہو گئی!' : 'Your bid was submitted successfully!'
    );
    setBidSubmitted(true);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: 'buyer',
        message: newMessage,
        time: isUrdu ? 'ابھی' : 'Just now',
        isVoice: false,
        duration: '',
      };
      setVoiceMessages([...voiceMessages, message]);
      setNewMessage('');
    }
  };

  const handleVoiceMessage = () => {
    if (isRecordingMessage) {
      const voiceMessage = {
        id: Date.now(),
        sender: 'buyer',
        message: isUrdu ? 'آواز میں پیغام' : 'Voice message',
        time: isUrdu ? 'ابھی' : 'Just now',
        isVoice: true,
        duration: '0:08',
      };
      setVoiceMessages([...voiceMessages, voiceMessage]);
      setIsRecordingMessage(false);
    } else {
      setIsRecordingMessage(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isUrdu ? 'بولی لگائیں' : 'Place Bid'}
          </Text>
          <Text style={styles.headerSub}>{cropInfo.title}</Text>
        </View>
        <LanguageSwitcherButton compact />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Crop Summary ── */}
        <View style={[styles.summaryCard, Shadows.soft]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryTitle}>{cropInfo.title}</Text>
              <View style={styles.summaryMeta}>
                <View style={styles.metaChip}>
                  <Package size={12} color={Colors.primary} />
                  <Text style={styles.metaChipText}>{cropInfo.quantity}</Text>
                </View>
                <View style={styles.metaChip}>
                  <User size={12} color={Colors.primary} />
                  <Text style={styles.metaChipText}>{cropInfo.farmer}</Text>
                </View>
              </View>
            </View>
            <View style={styles.summaryPriceBox}>
              <Text style={styles.summaryPrice}>
                PKR {cropInfo.currentPrice.toLocaleString()}
              </Text>
              <Text style={styles.summaryPriceSub}>
                {isUrdu ? 'فی من' : 'per Mann'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── AI Deal Copilot Banner ── */}
        <View style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <View style={styles.aiIconBg}>
              <Bot size={18} color={Colors.white} />
            </View>
            <View style={styles.aiCardTexts}>
              <Text style={styles.aiCardLabel}>AgroEndure AI</Text>
              <Text style={styles.aiCardTitle}>
                {isUrdu ? 'AI ڈیل کوپائلٹ استعمال کریں' : 'Use AI Deal Copilot'}
              </Text>
            </View>
          </View>
          <Text style={styles.aiCardSub}>
            {isUrdu
              ? 'آواز یا اردو میں بات کریں — AI خودکار معاہدہ تیار کرے گا'
              : 'Speak in Urdu or text — AI auto-drafts the agreement'}
          </Text>
          <View style={styles.aiCardButtons}>
            <TouchableOpacity
              style={styles.aiPrimaryBtn}
              onPress={() => router.push('/trade/trade-101')}
            >
              <MessageCircle size={15} color={Colors.primary} />
              <Text style={styles.aiPrimaryBtnText}>
                {isUrdu ? 'ٹریڈ روم کھولیں' : 'Open Trade Room'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aiSecondaryBtn}
              onPress={() => router.push('/agreement/trade-101')}
            >
              <FileText size={14} color={Colors.white} />
              <Text style={styles.aiSecondaryBtnText}>
                {isUrdu ? 'معاہدہ' : 'Agreement'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Bid Form ── */}
        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.cardTitle}>
            {isUrdu ? 'آپ کی بولی' : 'Your Bid'}
          </Text>

          {/* Bid Amount */}
          <View style={styles.field}>
            <View style={styles.fieldLabel}>
              <DollarSign size={14} color={Colors.foreground} />
              <Text style={styles.fieldLabelText}>
                {isUrdu ? 'آپ کی قیمت (فی من)' : 'Your Price (per Mann)'}
              </Text>
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputPrefix}>PKR</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={bidAmount}
                onChangeText={setBidAmount}
                placeholder={isUrdu ? 'مثلاً 65000' : 'e.g. 65000'}
                placeholderTextColor={Colors.mutedForeground}
              />
            </View>
            <View style={styles.rangeRow}>
              <Text style={styles.rangeText}>{isUrdu ? 'کم: PKR 75,000' : 'Min: PKR 75,000'}</Text>
              <Text style={styles.rangeText}>{isUrdu ? 'زیادہ: PKR 95,000' : 'Max: PKR 95,000'}</Text>
            </View>
          </View>

          {/* Delivery Date */}
          <View style={styles.field}>
            <View style={styles.fieldLabel}>
              <Calendar size={14} color={Colors.foreground} />
              <Text style={styles.fieldLabelText}>
                {isUrdu ? 'ڈیلیوری کی تاریخ' : 'Delivery Date'}
              </Text>
            </View>
            <TextInput
              style={styles.inputSingle}
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              placeholder={isUrdu ? 'تاریخ لکھیں' : 'Enter date'}
              placeholderTextColor={Colors.mutedForeground}
            />
          </View>

          {/* Custom Terms */}
          <View style={styles.field}>
            <View style={styles.fieldLabel}>
              <Truck size={14} color={Colors.foreground} />
              <Text style={styles.fieldLabelText}>
                {isUrdu ? 'اضافی شرائط' : 'Additional Terms'}
              </Text>
            </View>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              value={customTerms}
              onChangeText={setCustomTerms}
              placeholder={isUrdu ? 'کوئی خاص شرط لکھیں...' : 'Write any special condition...'}
              placeholderTextColor={Colors.mutedForeground}
              textAlignVertical="top"
            />
            <View style={styles.voiceRow}>
              <VoiceButton
                isRecording={isRecordingTerms}
                onStartRecording={() => setIsRecordingTerms(true)}
                onStopRecording={() => setIsRecordingTerms(false)}
                size="sm"
              />
              <View style={styles.micHint}>
                <Mic size={12} color={Colors.mutedForeground} />
                <Text style={styles.micHintText}>
                  {isUrdu ? 'آواز میں بولیں' : 'Or speak your terms'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!bidAmount || bidSubmitted) && styles.submitBtnDisabled]}
            onPress={handleSubmitBid}
            disabled={!bidAmount || bidSubmitted}
          >
            <Text style={styles.submitBtnText}>
              {bidSubmitted
                ? (isUrdu ? 'بولی جمع ہو گئی' : 'Bid Submitted')
                : (isUrdu ? 'بولی جمع کریں' : 'Submit Bid')}
            </Text>
          </TouchableOpacity>

          {bidSubmitted && (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => router.push('/agreement/trade-101')}
            >
              <Sparkles size={16} color={Colors.white} />
              <Text style={styles.reviewBtnText}>
                {isUrdu ? 'معاہدہ کا جائزہ' : 'Review Agreement'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Negotiation Chat Preview ── */}
        <View style={[styles.card, Shadows.soft]}>
          <View style={styles.chatHeaderRow}>
            <View style={styles.chatHeaderLeft}>
              <MessageCircle size={16} color={Colors.foreground} />
              <Text style={styles.cardTitle}>
                {isUrdu ? 'بات چیت' : 'Negotiation Chat'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.openChatBtn}
              onPress={() => router.push('/trade/trade-101')}
            >
              <Bot size={13} color={Colors.primary} />
              <Text style={styles.openChatBtnText}>
                {isUrdu ? 'AI روم' : 'AI Room'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.messages}>
            {voiceMessages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.msgWrap,
                  msg.sender === 'buyer' ? styles.msgWrapBuyer : styles.msgWrapFarmer,
                ]}
              >
                <View
                  style={[
                    styles.msgBubble,
                    msg.sender === 'buyer' ? styles.msgBubbleBuyer : styles.msgBubbleFarmer,
                  ]}
                >
                  {msg.isVoice ? (
                    <View style={styles.voiceMsgRow}>
                      <TouchableOpacity>
                        <Play
                          size={14}
                          color={msg.sender === 'buyer' ? Colors.white : Colors.primary}
                        />
                      </TouchableOpacity>
                      <View style={styles.miniWave}>
                        {[...Array(5)].map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.miniWaveBar,
                              {
                                height: 8 + (i * 3 % 12),
                                backgroundColor:
                                  msg.sender === 'buyer'
                                    ? `${Colors.white}90`
                                    : `${Colors.primary}90`,
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <Text
                        style={[
                          styles.durationText,
                          { color: msg.sender === 'buyer' ? Colors.white : Colors.foreground },
                        ]}
                      >
                        {msg.duration}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.msgText,
                        { color: msg.sender === 'buyer' ? Colors.white : Colors.foreground },
                      ]}
                    >
                      {msg.message}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.msgTime,
                      { color: msg.sender === 'buyer' ? `${Colors.white}B3` : Colors.mutedForeground },
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.msgInputRow}>
            <TextInput
              style={styles.msgInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={isUrdu ? 'پیغام لکھیں...' : 'Type message...'}
              placeholderTextColor={Colors.mutedForeground}
            />
            <VoiceButton
              isRecording={isRecordingMessage}
              onStartRecording={handleVoiceMessage}
              onStopRecording={handleVoiceMessage}
              size="sm"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
              <Send size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  // Summary Card
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  summaryLeft: {
    flex: 1,
    gap: Spacing.sm,
  },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  summaryMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  metaChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  summaryPriceBox: {
    alignItems: 'flex-end',
  },
  summaryPrice: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  summaryPriceSub: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  // AI Card
  aiCard: {
    backgroundColor: '#1b4332',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aiIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardTexts: {
    flex: 1,
    gap: 2,
  },
  aiCardLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#95D5B2',
  },
  aiCardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  aiCardSub: {
    fontSize: FontSize.sm,
    color: '#D8F3DC',
    lineHeight: 20,
    marginTop: -Spacing.xs,
  },
  aiCardButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  aiPrimaryBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#95D5B2',
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  aiPrimaryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#1b4332',
  },
  aiSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: '#95D5B2',
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  aiSecondaryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  // Form fields
  field: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fieldLabelText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.muted,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputPrefix: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.mutedForeground,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  inputSingle: {
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.foreground,
  },
  textArea: {
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.foreground,
    minHeight: 72,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.xs,
  },
  rangeText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  micHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  micHintText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  reviewBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  // Chat
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -Spacing.xs,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  openChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  openChatBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  messages: {
    gap: Spacing.sm,
  },
  msgWrap: {
    flexDirection: 'row',
  },
  msgWrapBuyer: { justifyContent: 'flex-end' },
  msgWrapFarmer: { justifyContent: 'flex-start' },
  msgBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    gap: 4,
  },
  msgBubbleBuyer: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.sm,
  },
  msgBubbleFarmer: {
    backgroundColor: Colors.muted,
    borderBottomLeftRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  msgText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  msgTime: {
    fontSize: FontSize.xs,
  },
  voiceMsgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  miniWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniWaveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  durationText: {
    fontSize: FontSize.xs,
  },
  msgInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  msgInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.foreground,
    backgroundColor: Colors.muted,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
