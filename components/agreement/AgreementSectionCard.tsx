import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AgreementSectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const AgreementSectionCard: React.FC<AgreementSectionCardProps> = ({
  title,
  icon,
  children,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1b4332',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    gap: 10,
  },
});
