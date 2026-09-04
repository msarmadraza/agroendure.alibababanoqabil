import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { verifyUserForTrade } from '@/services/verification/faceVerificationService';
import { Button } from '@/components/ui/Button';
import { Camera, ShieldCheck, CheckCircle2, Scan, AlertCircle } from 'lucide-react-native';

export default function FaceVerificationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tradeId = id || 'trade-101';
  const userId = 'buyer-001';

  const [scanning, setScanning] = useState(false);
  const [stepText, setStepText] = useState('Position face inside frame');
  const [success, setSuccess] = useState(false);

  const handleStartScan = async () => {
    try {
      setScanning(true);
      setStepText('Scanning face & testing liveness...');

      setTimeout(() => {
        setStepText('Verifying biometric identity match...');
      }, 1000);

      const result = await verifyUserForTrade(userId, tradeId);
      if (result.success) {
        setSuccess(true);
        setStepText('Identity Verified Successfully!');
        setTimeout(() => {
          router.replace({
            pathname: `/agreement/${tradeId}`,
            params: { faceVerified: 'true' },
          } as any);
        }, 1200);
      }
    } catch (err) {
      setStepText('تصدیق ناکام ہو گئی۔ براہ کرم دوبارہ کوشش کریں (Verification failed)');
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ShieldCheck size={32} color="#52B788" />
        <Text style={styles.title}>بائیو میٹرک فیس ویری فکیشن</Text>
        <Text style={styles.subTitleUrdu}>Biometric Face & Identity Verification</Text>
        <Text style={styles.subtitle}>
          معاہدے کی حتمی ڈیجیٹل توثیق اور سیکیورٹی کے لیے چہرے کی لائیو تصدیق لازمی ہے۔
        </Text>
      </View>

      {/* Camera Viewport Simulation */}
      <View style={styles.cameraViewport}>
        <View style={[styles.faceOval, success && styles.faceOvalSuccess]}>
          {scanning ? (
            <ActivityIndicator size="large" color="#52B788" />
          ) : success ? (
            <CheckCircle2 size={64} color="#4ADE80" />
          ) : (
            <Scan size={64} color="#52B788" />
          )}
        </View>

        <Text style={styles.stepText}>{stepText}</Text>
      </View>

      <View style={styles.footer}>
        <Button
          title={
            scanning
              ? "تصدیق کی جا رہی ہے (Verifying)..."
              : success
              ? "تصدیق مکمل ہو گئی (Verified ✓)"
              : "فیس اسکین شروع کریں (Start Face Scan)"
          }
          onPress={handleStartScan}
          loading={scanning}
          disabled={success}
          icon={<Camera size={18} color="#FFFFFF" />}
          style={styles.scanBtn}
        />

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>واپس جائیں (Cancel & Return)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  subTitleUrdu: {
    fontSize: 14,
    fontWeight: '600',
    color: '#52B788',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  cameraViewport: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  faceOval: {
    width: 220,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: '#52B788',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  faceOvalSuccess: {
    borderColor: '#4ADE80',
    borderStyle: 'solid',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  stepText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  footer: {
    gap: 12,
    marginBottom: 20,
  },
  scanBtn: {
    backgroundColor: '#1b4332',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
