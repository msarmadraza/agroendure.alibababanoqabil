import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Send, Mic } from 'lucide-react-native';
import { VoiceRecorder } from './VoiceRecorder';

interface ChatInputProps {
  onSendTextMessage: (text: string) => void;
  onSendVoiceMessage: (audioUri: string, duration: number) => void;
  inputText: string;
  setInputText: (text: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendTextMessage,
  onSendVoiceMessage,
  inputText,
  setInputText,
}) => {
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = () => {
    if (inputText.trim().length > 0) {
      onSendTextMessage(inputText.trim());
      setInputText('');
    }
  };

  if (isRecording) {
    return (
      <VoiceRecorder
        onSendVoiceMessage={(uri, duration) => {
          setIsRecording(false);
          onSendVoiceMessage(uri, duration);
        }}
        onCancel={() => setIsRecording(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, { maxHeight: 100 }]}
        placeholder="Type a message (English, Urdu, Roman Urdu)..."
        placeholderTextColor="#94A3B8"
        value={inputText}
        onChangeText={setInputText}
        multiline
      />

      <TouchableOpacity style={styles.micBtn} onPress={() => setIsRecording(true)}>
        <Mic size={20} color="#1b4332" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sendBtn, inputText.trim().length === 0 && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={inputText.trim().length === 0}
      >
        <Send size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1b4332',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
});
