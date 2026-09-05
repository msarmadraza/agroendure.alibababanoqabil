import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AgreementTerm } from '@/types/database';
import { getAgreementFieldLabel } from '@/types/agreement';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, AlertTriangle, Clock, AlertCircle } from 'lucide-react-native';
import { useLanguage } from '@/services/i18n/languageContext';

interface TermItemProps {
  term: AgreementTerm;
}

export const TermItem: React.FC<TermItemProps> = ({ term }) => {
  const { isUrdu } = useLanguage();
  const fieldLabel = getAgreementFieldLabel(term.field_name, isUrdu);

  const renderIcon = () => {
    switch (term.status) {
      case 'agreed':
        return <CheckCircle2 size={16} color="#0F5132" />;
      case 'negotiating':
        return <Clock size={16} color="#664D03" />;
      case 'conflicting':
        return <AlertCircle size={16} color="#842029" />;
      case 'missing':
        return <AlertTriangle size={16} color="#842029" />;
      default:
        return null;
    }
  };

  const formattedValue = typeof term.value === 'object' ? JSON.stringify(term.value) : String(term.value);

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        {renderIcon()}
        <View style={styles.textStack}>
          <Text style={styles.label}>{fieldLabel}</Text>
          <Text style={styles.value}>{formattedValue}</Text>
        </View>
      </View>
      <Badge status={term.status} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  textStack: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
});
