import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Check, Edit2, Sparkles, AlertCircle } from 'lucide-react-native';
import { Colors, Radius, FontSize, Spacing } from '@/constants/theme';

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
 * needs more information (e.g. quantity without a unit).
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
    setIsEditing(false);
    onConfirm(editValue);
  };

  if (needsClarification) {
    return (
      <View style={[styles.container, styles.clarificationContainer]}>
        <View style={styles.headerRow}>
          <AlertCircle size={22} color={Colors.warning} />
          <Text style={styles.clarificationTitle}>مزید تفصیل درکار ہے</Text>
        </View>
        <Text style={styles.clarificationText}>{clarificationMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Sparkles size={18} color={Colors.primaryLight} />
        <Text style={styles.aiLabel}>AI نے یہ سمجھا</Text>
        {typeof confidence === 'number' && (
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{Math.round(confidence * 100)}%</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardTitle}>{title}</Text>

      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.textInput}
            value={editValue}
            onChangeText={setEditValue}
            placeholder="یہاں لکھیں..."
            placeholderTextColor={Colors.mutedForeground}
            autoFocus
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
            <Check size={16} color={Colors.white} />
            <Text style={styles.saveText}>محفوظ کریں</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.valueRow}>
            <Text style={styles.valueText}>{detectedValue}</Text>
          </View>

          {originalText ? (
            <Text style={styles.originalText}>"{originalText}"</Text>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => onConfirm(detectedValue)}
              activeOpacity={0.8}
            >
              <Check size={16} color={Colors.white} />
              <Text style={styles.confirmText}>تصدیق کریں اور آگے بڑھیں</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setEditValue(detectedValue);
                setIsEditing(true);
              }}
              activeOpacity={0.8}
            >
              <Edit2 size={15} color={Colors.primary} />
              <Text style={styles.editText}>درست کریں</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  clarificationContainer: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warning,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  aiLabel: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  confidenceText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  clarificationTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.warning,
  },
  clarificationText: {
    fontSize: FontSize.md,
    color: Colors.foreground,
    lineHeight: 22,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.foreground,
  },
  originalText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  confirmText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.xs,
  },
  editText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  editContainer: {
    gap: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.foreground,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  saveText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
});
