import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Camera, UploadCloud, ShieldCheck, RefreshCw } from 'lucide-react-native';

interface CNICUploadBoxProps {
  imageUri: string | null;
  onSelectImage: (base64OrUri: string) => void;
  onClearImage: () => void;
}

export const CNICUploadBox: React.FC<CNICUploadBoxProps> = ({
  imageUri,
  onSelectImage,
  onClearImage,
}) => {
  const handleOpenFilePicker = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
          const file = event.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              if (e.target?.result) {
                onSelectImage(e.target.result as string);
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } catch (err) {
        console.warn('CNIC file picker error:', err);
      }
    } else {
      // Fallback sample CNIC front image for demo
      onSelectImage('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&q=80');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.guidanceBox}>
        <ShieldCheck size={18} color="#0F5132" />
        <Text style={styles.guidanceText}>
          Make sure the CNIC is clearly visible, well-lit, and all text can be read easily.
        </Text>
      </View>

      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <TouchableOpacity style={styles.retakeBtn} onPress={onClearImage} activeOpacity={0.8}>
            <RefreshCw size={14} color="#1b4332" />
            <Text style={styles.retakeText}>Retake / Choose Different Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploadArea}>
          <Text style={styles.uploadTitle}>Pakistani CNIC (Front Side)</Text>
          <Text style={styles.uploadSub}>پاکستانی شناختی کارڈ (سامنے والا حصہ)</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleOpenFilePicker} activeOpacity={0.85}>
              <Camera size={22} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.galleryBtn]}
              onPress={handleOpenFilePicker}
              activeOpacity={0.85}
            >
              <UploadCloud size={22} color="#1b4332" />
              <Text style={[styles.actionBtnText, styles.galleryBtnText]}>Upload Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    gap: 12,
  },
  guidanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  guidanceText: {
    flex: 1,
    fontSize: 12,
    color: '#0F5132',
    lineHeight: 16,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#1b4332',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  uploadSub: {
    fontSize: 13,
    color: '#64748B',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b4332',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  galleryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1b4332',
  },
  galleryBtnText: {
    color: '#1b4332',
  },
  previewContainer: {
    alignItems: 'center',
    gap: 10,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1b4332',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  retakeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b4332',
  },
});
