import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';

interface WizardStepIndicatorProps {
  currentStep: number; // 1: Crop, 2: Quantity, 3: Quality, 4: Photos, 5: Price
}

const STEPS = [
  { id: 1, label: 'فصل', en: 'Crop' },
  { id: 2, label: 'مقدار', en: 'Qty' },
  { id: 3, label: 'کوالٹی', en: 'Quality' },
  { id: 4, label: 'تصاویر', en: 'Photos' },
  { id: 5, label: 'قیمت', en: 'Price' },
];

export const WizardStepIndicator: React.FC<WizardStepIndicatorProps> = ({ currentStep }) => {
  const currentStepData = STEPS.find((s) => s.id === currentStep) || STEPS[0];
  const progressPercent = Math.min(100, Math.max(0, (currentStep / STEPS.length) * 100));

  return (
    <View style={styles.container}>
      {/* Top step counter title */}
      <View style={styles.headerRow}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>مرحلہ {currentStep} از 5</Text>
        </View>
        <Text style={styles.stepCurrentTitle}>
          {currentStepData.label} ({currentStepData.en})
        </Text>
      </View>

      {/* Progress Track */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Step Nodes Row */}
      <View style={styles.stepsRow}>
        {STEPS.map((step, index) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              <View style={styles.stepNode}>
                <View
                  style={[
                    styles.circle,
                    isDone && styles.circleDone,
                    isCurrent && styles.circleCurrent,
                  ]}
                >
                  {isDone ? (
                    <Check size={13} color={Colors.white} strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.stepNum,
                        isCurrent && styles.stepNumCurrent,
                      ]}
                    >
                      {step.id}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isCurrent && styles.stepLabelCurrent,
                    isDone && styles.stepLabelDone,
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {index < STEPS.length - 1 && (
                <View
                  style={[
                    styles.connectingLine,
                    currentStep > step.id && styles.connectingLineDone,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  stepBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  stepBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
  },
  stepCurrentTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.foreground,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.muted,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNode: {
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  circleCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  circleDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNum: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.mutedForeground,
  },
  stepNumCurrent: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
  stepLabel: {
    fontSize: 11,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  stepLabelCurrent: {
    color: Colors.primary,
    fontWeight: '800',
  },
  stepLabelDone: {
    color: Colors.foreground,
    fontWeight: '600',
  },
  connectingLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
    marginBottom: 16,
  },
  connectingLineDone: {
    backgroundColor: Colors.primary,
  },
});
