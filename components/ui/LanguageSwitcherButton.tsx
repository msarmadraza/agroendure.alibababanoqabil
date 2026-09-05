import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { Globe } from 'lucide-react-native';
import { useLanguage } from '@/services/i18n/languageContext';

interface LanguageSwitcherButtonProps {
  compact?: boolean;
  style?: ViewStyle;
}

export const LanguageSwitcherButton: React.FC<LanguageSwitcherButtonProps> = ({
  compact = false,
  style,
}) => {
  const { language, toggleLanguage, isUrdu } = useLanguage();

  return (
    <TouchableOpacity
      style={[styles.container, compact ? styles.compactContainer : null, style]}
      onPress={toggleLanguage}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Switch language, current is ${language === 'ur' ? 'Urdu' : 'English'}`}
    >
      <Globe size={compact ? 13 : 15} color="#15803D" />
      <View style={styles.textContainer}>
        <Text style={[styles.langText, isUrdu ? styles.activeLang : styles.inactiveLang]}>
          اردو
        </Text>
        <Text style={styles.divider}>|</Text>
        <Text style={[styles.langText, !isUrdu ? styles.activeLang : styles.inactiveLang]}>
          EN
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    gap: 4,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeLang: {
    color: '#15803D',
    fontWeight: '800',
  },
  inactiveLang: {
    color: '#94A3B8',
  },
  divider: {
    fontSize: 10,
    color: '#CBD5E1',
    marginHorizontal: 1,
  },
});
