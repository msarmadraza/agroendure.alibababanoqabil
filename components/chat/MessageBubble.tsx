import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '@/types/database';
import { VoicePlayer } from './VoicePlayer';

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isCurrentUser }) => {
  const isSystem = message.message_type === 'system';
  const isAI = message.message_type === 'ai_assistant';

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, isCurrentUser ? styles.userWrapper : styles.otherWrapper]}>
      <View style={[styles.bubble, isCurrentUser ? styles.userBubble : styles.otherBubble, isAI && styles.aiBubble]}>
        {!isCurrentUser && message.sender && (
          <Text style={styles.senderName}>{message.sender.full_name || 'Participant'}</Text>
        )}

        {message.message_type === 'voice' ? (
          <VoicePlayer audioUrl={message.audio_url} transcription={message.transcription} />
        ) : (
          <Text style={[styles.messageText, isCurrentUser ? styles.userText : styles.otherText]}>
            {message.content}
          </Text>
        )}

        <Text style={[styles.timeText, isCurrentUser ? styles.userTime : styles.otherTime]}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  otherWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: '#1b4332',
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiBubble: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#40916c',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#1A202C',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTime: {
    color: '#D8F3DC',
  },
  otherTime: {
    color: '#718096',
  },
  systemContainer: {
    alignSelf: 'center',
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
  },
  systemText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
  },
});
