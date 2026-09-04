import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors, FontSize, Spacing } from '@/constants/theme';

interface WizardStepIndicatorProps {
  currentStep: number; // 1: Crop, 2: Quantity, 3: Quality, 4: Photos, 5: Price
}

const STEPS = [
  { id: 1, label: 'فصل' },
  { id: 2, label: 'مقدار' },
  { id: 3, label: 'کوالٹی' },
  { id: 4, label: 'تصاویر' },
  { id: 5, label: 'قیمت' },
];

export const WizardStepIndicator: React.FC<WizardStepIndicatorProps> = ({ currentStep }) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((step, index) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              <View style={styles.stepCircleContainer}>
                <View
                  style={[
                    styles.circle,
                    isDone && styles.circleDone,
                    isCurrent && styles.circleCurrent,
                  ]}
                >
                  {isDone ? (
                    <Check size={14} color={Colors.white} />
                  ) : (
                    <Text style={[styles.stepNum, isCurrent && styles.stepNumCurrent]}>
                      {step.id}
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}>
                  {step.label}
                </Text>
              </View>

              {index < STEPS.length - 1 && (
                <View style={[styles.line, currentStep > step.id && styles.lineDone]} />
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
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCircleContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCurrent: {
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  circleDone: {
    backgroundColor: Colors.success,
  },
  stepNum: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.mutedForeground,
  },
  stepNumCurrent: {
    color: Colors.white,
  },
  stepLabel: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  stepLabelCurrent: {
    color: Colors.primary,
    fontWeight: '800',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  lineDone: {
    backgroundColor: Colors.success,
  },
});
