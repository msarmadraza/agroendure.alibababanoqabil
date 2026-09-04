import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Check, Edit2, Lock, ShieldCheck, Sparkles, User, CreditCard } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { ExtractionSource } from '@/types/identityVerification';

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
        <Sparkles size={16} color="#0F5132" />
        <Text style={styles.aiBadgeText}>CNIC Information Detected (Gemini AI)</Text>
      </View>

      <Text style={styles.instruction}>
        Please review the extracted information. If any detail is incorrect, tap edit to correct it before confirming.
      </Text>

      {isEditing ? (
        <View style={styles.editSection}>
          <Text style={styles.fieldLabel}>Full Name (CNIC Holder)</Text>
          <TextInput
            style={styles.textInput}
            value={editedName}
            onChangeText={setEditedName}
            placeholder="Full Name"
          />

          <Text style={styles.fieldLabel}>CNIC Number (XXXXX-XXXXXXX-X)</Text>
          <TextInput
            style={styles.textInput}
            value={editedCnic}
            onChangeText={setEditedCnic}
            placeholder="35202-1234567-1"
          />

          <TouchableOpacity style={styles.saveEditBtn} onPress={handleSaveEdits}>
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.saveEditText}>Save Edits</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <User size={18} color="#1b4332" />
            <View style={styles.infoCol}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.valText}>{editedName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <CreditCard size={18} color="#1b4332" />
            <View style={styles.infoCol}>
              <Text style={styles.label}>CNIC Number</Text>
              <Text style={styles.valText}>{editedCnic}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editToggleBtn} onPress={() => setIsEditing(true)}>
            <Edit2 size={14} color="#1b4332" />
            <Text style={styles.editToggleText}>Edit Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Privacy Message */}
      <View style={styles.privacyNote}>
        <Lock size={14} color="#64748B" />
        <Text style={styles.privacyText}>
          Your identity information is used only for account verification and is not visible to other AgroEndure users.
        </Text>
      </View>

      <View style={styles.actionGroup}>
        <Button
          title="Confirm Information & Verify"
          onPress={handleFinalSubmit}
          loading={isSubmitting}
          icon={<ShieldCheck size={18} color="#FFFFFF" />}
          style={styles.confirmBtn}
        />

        <TouchableOpacity style={styles.retakeActionBtn} onPress={onRetake}>
          <Text style={styles.retakeActionText}>Upload Different Image</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1b4332',
    padding: 18,
    marginVertical: 14,
    gap: 14,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F5132',
    textTransform: 'uppercase',
  },
  instruction: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoCol: {
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  valText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 6,
  },
  editToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b4332',
  },
  editSection: {
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  saveEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b4332',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  saveEditText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  actionGroup: {
    gap: 10,
    marginTop: 4,
  },
  confirmBtn: {
    backgroundColor: '#1b4332',
    paddingVertical: 14,
  },
  retakeActionBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  retakeActionText: {
    color: '#64748B',
    fontSize: 13,
  },
});
