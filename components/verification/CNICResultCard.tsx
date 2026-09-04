import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Check, Edit2, Lock, ShieldCheck, Sparkles, User, CreditCard, CheckCircle2 } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { ExtractionSource } from '@/types/identityVerification';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';

interface CNICResultCardProps {
  holderName: string;
  cnicNumber: string;
  confidence?: number;
  onConfirm: (finalName: string, finalCnic: string, source: ExtractionSource) => void;
  onRetake: () => void;
  isSubmitting?: boolean;
}

export const CNICResultCard: React.FC<CNICResultCardProps> = ({
  holderName,
  cnicNumber,
  confidence = 0.98,
  onConfirm,
  onRetake,
  isSubmitting = false,
}) => {
  const isPlaceholder =
    holderName === 'Chaudhry Ahmad' ||
    holderName === 'Pakistani Citizen Name' ||
    cnicNumber === '35202-8819203-1' ||
    cnicNumber === '35202-1234567-1';

  const [isEditing, setIsEditing] = useState(isPlaceholder);
  const [editedName, setEditedName] = useState(isPlaceholder ? '' : holderName);
  const [editedCnic, setEditedCnic] = useState(isPlaceholder ? '' : cnicNumber);
  const [source, setSource] = useState<ExtractionSource>('gemini_extracted');

  useEffect(() => {
    if (isPlaceholder) {
      setIsEditing(true);
      setEditedName('');
      setEditedCnic('');
    } else {
      setEditedName(holderName);
      setEditedCnic(cnicNumber);
    }
  }, [holderName, cnicNumber, isPlaceholder]);

  const handleSaveEdits = () => {
    setIsEditing(false);
    setSource('user_edited');
  };

  const handleFinalSubmit = () => {
    onConfirm(editedName, editedCnic, source);
  };

  return (
    <View style={styles.container}>
      <View style={styles.aiBadge}>
        <Sparkles size={16} color={Colors.primary} />
        <Text style={styles.aiBadgeText}>CNIC Information Detected (AI Verified)</Text>
      </View>

      <Text style={styles.instruction}>
        شناختی کارڈ کی تفصیلات چیک کر لیں۔ اگر کوئی معلومات غلط ہیں تو درست کریں۔
      </Text>

      {isEditing ? (
        <View style={styles.editSection}>
          <Text style={styles.fieldLabel}>Full Name (CNIC Holder)</Text>
          <TextInput
            style={styles.textInput}
            value={editedName}
            onChangeText={setEditedName}
            placeholder="Full Name"
            placeholderTextColor={Colors.mutedForeground}
          />

          <Text style={styles.fieldLabel}>CNIC Number (XXXXX-XXXXXXX-X)</Text>
          <TextInput
            style={styles.textInput}
            value={editedCnic}
            onChangeText={setEditedCnic}
            placeholder="35202-1234567-1"
            placeholderTextColor={Colors.mutedForeground}
          />

          <TouchableOpacity style={styles.saveEditBtn} onPress={handleSaveEdits}>
            <Check size={16} color={Colors.white} />
            <Text style={styles.saveEditText}>Save Edits</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <User size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.label}>نام / Full Name</Text>
              <Text style={styles.valText}>{editedName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <CreditCard size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.label}>شناختی کارڈ نمبر / CNIC Number</Text>
              <Text style={styles.valText}>{editedCnic}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editToggleBtn} onPress={() => setIsEditing(true)}>
            <Edit2 size={14} color={Colors.primary} />
            <Text style={styles.editToggleText}>معلومات تبدیل کریں / Edit Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Privacy Message */}
      <View style={styles.privacyNote}>
        <Lock size={14} color={Colors.mutedForeground} />
        <Text style={styles.privacyText}>
          یہ معلومات صرف اکاؤنٹ کی تصدیق کے لیے ہے۔ دیگر صارفین سے مکمل پوشیدہ رہے گی۔
        </Text>
      </View>

      <View style={styles.actionGroup}>
        <Button
          title="معلومات کی توثیق کریں • Confirm & Continue"
          onPress={handleFinalSubmit}
          loading={isSubmitting}
          icon={<ShieldCheck size={18} color={Colors.white} />}
          style={styles.confirmBtn}
        />

        <TouchableOpacity style={styles.retakeActionBtn} onPress={onRetake}>
          <Text style={styles.retakeActionText}>دوسری تصویر اپلوڈ کریں / Upload Different Image</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    gap: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 0.4,
  },
  instruction: {
    fontSize: FontSize.xs + 1,
    color: Colors.mutedForeground,
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    gap: 2,
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mutedForeground,
    letterSpacing: 0.5,
  },
  valText: {
    fontSize: FontSize.md + 1,
    fontWeight: '800',
    color: Colors.foreground,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  editToggleText: {
    fontSize: FontSize.xs + 1,
    fontWeight: '700',
    color: Colors.primary,
  },
  editSection: {
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.foreground,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    fontSize: FontSize.sm + 1,
    color: Colors.foreground,
  },
  saveEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 6,
    marginTop: 4,
  },
  saveEditText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: Radius.md,
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    color: Colors.mutedForeground,
    lineHeight: 16,
  },
  actionGroup: {
    gap: 10,
    marginTop: 4,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.lg,
  },
  retakeActionBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  retakeActionText: {
    color: Colors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
  },
});
