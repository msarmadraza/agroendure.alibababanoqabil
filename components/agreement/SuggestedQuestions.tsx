import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MessageSquarePlus, Sparkles } from 'lucide-react-native';
import { useLanguage } from '@/services/i18n/languageContext';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  questions,
  onSelectQuestion,
}) => {
  const { isUrdu } = useLanguage();
  if (!questions || questions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Sparkles size={14} color="#2d6a4f" />
        <Text style={styles.headerTitle}>
          {isUrdu
            ? 'معاہدہ مکمل کرنے کے لیے تجاویز:'
            : 'Suggested Questions to complete agreement:'}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {questions.map((question, index) => (
          <TouchableOpacity
            key={index}
            style={styles.pill}
            onPress={() => onSelectQuestion(question)}
            activeOpacity={0.7}
          >
            <MessageSquarePlus size={14} color="#1b4332" />
            <Text style={styles.pillText}>{question}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d6a4f',
    marginBottom: 6,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#B7E4C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1b4332',
  },
});
