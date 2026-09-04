import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Check, Edit2, Sparkles, AlertCircle, MessageSquareQuote, X } from 'lucide-react-native';
import { Colors, Radius, FontSize, Spacing, Shadows } from '@/constants/theme';

interface DetectionCardProps {
  title: string;
  detectedValue: string;
  originalText?: string;
  confidence?: number;
  needsClarification?: boolean;
  clarificationMessage?: string | null;
  onConfirm: (confirmedValue: string) => void;
}

/**
 * Shows the value the AI extracted from the farmer's voice/text answer,
 * with Confirm / Edit actions and a clarification state when the AI
 * needs more information.
 */
export const DetectionCard: React.FC<DetectionCardProps> = ({
  title,
  detectedValue,
  originalText,
  confidence,
  needsClarification = false,
  clarificationMessage,
  onConfirm,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(detectedValue);

  const handleSaveEdit = () => {
    if (!editValue.trim()) return;
    setIsEditing(false);
    onConfirm(editValue.trim());
  };

  if (needsClarification) {
    return (
      <View style={[styles.container, styles.clarificationContainer, Shadows.soft]}>
        <View style={styles.headerRow}>
          <View style={styles.warningIconCircle}>
            <AlertCircle size={20} color={Colors.warning} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.clarificationTitle}>مزید تفصیل درکار ہے</Text>
            <Text style={styles.clarificationEng}>Clarification Needed</Text>
          </View>
        </View>
        <Text style={styles.clarificationText}>{clarificationMessage}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, Shadows.soft]}>
      {/* Card Header with AI badge and confidence */}
      <View style={styles.headerRow}>
        <View style={styles.aiBadge}>
          <Sparkles size={14} color={Colors.primary} />
          <Text style={styles.aiLabel}>AI خودکار شناخت</Text>
        </View>

        {typeof confidence === 'number' && (
          <View style={styles.confidenceBadge}>
            <View style={styles.confidenceDot} />
            <Text style={styles.confidenceText}>{Math.round(confidence * 100)}% درستگی</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardCategory}>{title}</Text>

      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.textInput}
            value={editValue}
            onChangeText={setEditValue}
            placeholder="درست قیمت یا نام درج کریں..."
            placeholderTextColor={Colors.mutedForeground}
            autoFocus
          />
          <View style={styles.editActionRow}>
            <TouchableOpacity
              style={styles.cancelEditBtn}
              onPress={() => {
                setEditValue(detectedValue);
                setIsEditing(false);
              }}
              activeOpacity={0.8}
            >
              <X size={16} color={Colors.mutedForeground} />
              <Text style={styles.cancelEditText}>منسوخ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveEdit}
              activeOpacity={0.8}
            >
              <Check size={16} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.saveText}>محفوظ کریں اور تصدیق کریں</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.valueRow}>
            <Text style={styles.valueText}>{detectedValue}</Text>
            <View style={styles.verifiedCheckBadge}>
              <Check size={14} color={Colors.primary} strokeWidth={3} />
            </View>
          </View>

          {originalText ? (
            <View style={styles.spokenQuoteBox}>
              <MessageSquareQuote size={15} color={Colors.mutedForeground} style={styles.quoteIcon} />
              <Text style={styles.originalText}>
                آپ کی آواز: "{originalText}"
              </Text>
            </View>
          ) : null}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setEditValue(detectedValue);
                setIsEditing(true);
              }}
              activeOpacity={0.7}
            >
              <Edit2 size={15} color={Colors.foreground} />
              <Text style={styles.editText}>تبدیل کریں</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => onConfirm(detectedValue)}
              activeOpacity={0.85}
            >
              <Check size={18} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.confirmText}>تصدیق کریں اور آگے بڑھیں</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  clarificationContainer: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warning,
  },
  warningIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  clarificationTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: '#B45309',
  },
  clarificationEng: {
    fontSize: FontSize.xs,
    color: '#92400E',
  },
  clarificationText: {
    fontSize: FontSize.md,
    color: Colors.foreground,
    lineHeight: 22,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  aiLabel: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  confidenceText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.foreground,
  },
  cardCategory: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    fontWeight: '700',
    marginTop: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.foreground,
    letterSpacing: -0.3,
    flex: 1,
  },
  verifiedCheckBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  spokenQuoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.muted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  quoteIcon: {
    marginTop: 1,
  },
  originalText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    fontStyle: 'italic',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 13,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  editText: {
    color: Colors.foreground,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
  editContainer: {
    gap: Spacing.md,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.lg,
    color: Colors.foreground,
    fontWeight: '700',
  },
  editActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.muted,
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 4,
  },
  cancelEditText: {
    color: Colors.mutedForeground,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 6,
  },
  saveText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
});
