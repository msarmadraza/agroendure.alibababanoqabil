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
} from 'lucide-react-native';
import { VoiceButton } from '@/components/VoiceButton';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';

export default function Bidding() {
  const router = useRouter();
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [customTerms, setCustomTerms] = useState('');
  const [isRecordingTerms, setIsRecordingTerms] = useState(false);
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState([
    {
      id: 1,
      sender: 'farmer',
      message: 'آپ کی بولی دیکھی، کیا کم سے کم 83 ہزار ممکن ہے؟',
      time: '2 منٹ پہلے',
      isVoice: true,
      duration: '0:12',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecordingMessage, setIsRecordingMessage] = useState(false);

  const cropInfo = {
    title: 'اعلیٰ کوالٹی گندم',
    currentPrice: 85000,
    quantity: '50 من',
    farmer: 'احمد علی',
  };

  const handleSubmitBid = () => {
    if (!bidAmount) {
      Alert.alert('❌ خرابی', 'براہ کرم اپنی بولی کی رقم درج کریں');
      return;
    }

    Alert.alert('✅ کامیاب', 'آپ کی بولی کامیابی سے جمع ہو گئی!');
    setBidSubmitted(true);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: 'buyer',
        message: newMessage,
        time: 'ابھی',
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
        message: 'آواز میں پیغام',
        time: 'ابھی',
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>بولی لگائیں</Text>
          <Text style={styles.headerSubtitle}>{cropInfo.title}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Crop Summary */}
        <View style={[styles.card, Shadows.soft]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>{cropInfo.title}</Text>
            <View style={styles.summaryPriceColumn}>
              <Text style={styles.summaryPrice}>
                ₨{cropInfo.currentPrice.toLocaleString()}
              </Text>
              <Text style={styles.summaryPriceLabel}>موجودہ قیمت</Text>
            </View>
          </View>
          <Text style={styles.summaryMeta}>
            مقدار: {cropInfo.quantity} • کسان: {cropInfo.farmer}
          </Text>
        </View>

        {/* AI Deal Copilot Smart Banner */}
        <View style={styles.aiCopilotBanner}>
          <View style={styles.aiCopilotHeader}>
            <Bot size={20} color="#FFFFFF" />
            <Text style={styles.aiCopilotTag}>AgroEndure AI Deal Copilot</Text>
          </View>
          <Text style={styles.aiCopilotTitle}>
            مذاکرات اور معاہدے کے لیے AI ٹریڈ روم استعمال کریں
          </Text>
          <Text style={styles.aiCopilotSub}>
            آواز یا اردو متن کے ذریعے بات کریں، AI خودکار طور پر قیمت، تاریخ اور ادائیگی کی شرائط نکال کر معاہدہ تیار کرے گا۔
          </Text>
          <View style={styles.aiCopilotButtonsRow}>
            <TouchableOpacity
              style={styles.aiCopilotMainBtn}
              onPress={() => router.push('/trade/trade-101')}
            >
              <Bot size={15} color="#1b4332" />
              <Text style={styles.aiCopilotMainBtnText}>چیٹ اور AI ڈیل کوپائلٹ کھولیں →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aiCopilotReviewBtn}
              onPress={() => router.push('/agreement/trade-101')}
            >
              <FileText size={14} color="#FFFFFF" />
              <Text style={styles.aiCopilotReviewBtnText}>معاہدہ کا جائزہ (Review)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bidding Form */}
        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.cardTitle}>آپ کی بولی</Text>

          {/* Bid Amount */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <DollarSign size={16} color={Colors.foreground} />
              <Text style={styles.fieldLabel}>آپ کی قیمت (فی من)</Text>
            </View>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={bidAmount}
              onChangeText={setBidAmount}
              placeholder="قیمت درج کریں"
              placeholderTextColor={Colors.mutedForeground}
            />
            <View style={styles.rangeRow}>
              <Text style={styles.rangeText}>کم سے کم: ₨75,000</Text>
              <Text style={styles.rangeText}>زیادہ سے زیادہ: ₨95,000</Text>
            </View>
          </View>

          {/* Delivery Date */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Calendar size={16} color={Colors.foreground} />
              <Text style={styles.fieldLabel}>ڈیلیوری کی تاریخ</Text>
            </View>
            <TextInput
              style={styles.input}
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              placeholder="تاریخ منتخب کریں"
              placeholderTextColor={Colors.mutedForeground}
            />
          </View>

          {/* Custom Terms */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Truck size={16} color={Colors.foreground} />
              <Text style={styles.fieldLabel}>اضافی شرائط</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              value={customTerms}
              onChangeText={setCustomTerms}
              placeholder="کوئی خاص شرط یا ضرورت لکھیں..."
              placeholderTextColor={Colors.mutedForeground}
            />
            <View style={styles.voiceRow}>
              <VoiceButton
                isRecording={isRecordingTerms}
                onStartRecording={() => setIsRecordingTerms(true)}
                onStopRecording={() => setIsRecordingTerms(false)}
                size="sm"
              />
              <Text style={styles.voiceHint}>یا آواز میں بولیں</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!bidAmount || bidSubmitted) && styles.disabledButton,
            ]}
            onPress={handleSubmitBid}
            disabled={!bidAmount || bidSubmitted}
          >
            <Text style={styles.submitButtonText}>
              {bidSubmitted ? '✅ بولی جمع ہو گئی' : 'بولی جمع کریں'}
            </Text>
          </TouchableOpacity>

          {bidSubmitted && (
            <TouchableOpacity
              style={styles.contractButton}
              onPress={() => router.push('/agreement/trade-101')}
            >
              <Sparkles size={18} color={Colors.white} />
              <Text style={styles.contractButtonText}>
                معاہدہ کا جائزہ اور تصدیق (Review Agreement)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Negotiation Chat */}
        <View style={[styles.card, Shadows.soft]}>
          <View style={styles.chatHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MessageCircle size={18} color={Colors.foreground} />
              <Text style={styles.cardTitle}>بات چیت</Text>
            </View>
            <TouchableOpacity
              style={styles.openFullChatBtn}
              onPress={() => router.push('/trade/trade-101')}
            >
              <Bot size={14} color="#1b4332" />
              <Text style={styles.openFullChatText}>AI ٹریڈ روم کھولیں →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.messages}>
            {voiceMessages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  msg.sender === 'buyer' ? styles.buyerWrapper : styles.farmerWrapper,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    msg.sender === 'buyer'
                      ? styles.buyerBubble
                      : styles.farmerBubble,
                  ]}
                >
                  {msg.isVoice ? (
                    <View style={styles.voiceMessage}>
                      <TouchableOpacity>
                        <Play
                          size={14}
                          color={
                            msg.sender === 'buyer' ? Colors.white : Colors.primary
                          }
                        />
                      </TouchableOpacity>
                      <View style={styles.miniWaveform}>
                        {[...Array(5)].map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.miniWaveBar,
                              {
                                height: 8 + Math.random() * 12,
                                backgroundColor:
                                  msg.sender === 'buyer'
                                    ? `${Colors.white}80`
                                    : `${Colors.primary}80`,
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
                        styles.messageText,
                        { color: msg.sender === 'buyer' ? Colors.white : Colors.foreground },
                      ]}
                    >
                      {msg.message}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.messageTime,
                      { color: msg.sender === 'buyer' ? `${Colors.white}B3` : Colors.mutedForeground },
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Message Input */}
          <View style={styles.messageInputRow}>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="پیغام لکھیں..."
              placeholderTextColor={Colors.mutedForeground}
            />
            <VoiceButton
              isRecording={isRecordingMessage}
              onStartRecording={handleVoiceMessage}
              onStopRecording={handleVoiceMessage}
              size="sm"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
    flex: 1,
  },
  summaryPriceColumn: {
    alignItems: 'flex-end',
  },
  summaryPrice: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  summaryPriceLabel: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  summaryMeta: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  field: {
    marginBottom: Spacing.md,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.foreground,
    backgroundColor: Colors.card,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  rangeText: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  voiceHint: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  contractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.purple500,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
  },
  contractButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  messages: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
    maxHeight: 240,
  },
  messageWrapper: {
    flexDirection: 'row',
  },
  buyerWrapper: {
    justifyContent: 'flex-end',
  },
  farmerWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: Radius.xl,
  },
  buyerBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.sm,
  },
  farmerBubble: {
    backgroundColor: Colors.accent,
    borderBottomLeftRadius: Radius.sm,
  },
  messageText: {
    fontSize: FontSize.sm,
  },
  messageTime: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  miniWaveform: {
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
  messageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.foreground,
    backgroundColor: Colors.card,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  aiCopilotBanner: {
    backgroundColor: '#1b4332',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  aiCopilotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  aiCopilotTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#95D5B2',
  },
  aiCopilotTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aiCopilotSub: {
    fontSize: 12,
    color: '#D8F3DC',
    lineHeight: 18,
    marginBottom: 12,
  },
  aiCopilotButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aiCopilotMainBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#95D5B2',
    paddingVertical: 9,
    borderRadius: Radius.lg,
  },
  aiCopilotMainBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b4332',
  },
  aiCopilotReviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#95D5B2',
    paddingVertical: 9,
    borderRadius: Radius.lg,
  },
  aiCopilotReviewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  openFullChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  openFullChatText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1b4332',
  },
});
