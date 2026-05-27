import React from 'react';
import { View, Text } from 'react-native';
import { ChatMessage } from '../api/types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <View
      className={`flex-row ${
        isUser ? 'justify-end' : 'justify-start'
      } mb-4 px-2`}
    >
      <View
        className={`max-w-[80%] rounded-2xl p-4 ${
          isUser
            ? 'bg-accent rounded-tr-none'
            : 'bg-cardBg rounded-tl-none border border-borderBg'
        }`}
      >
        <Text className="text-textPrimary text-sm leading-5">
          {message.content}
        </Text>
        <Text className="text-[10px] text-textSecondary mt-2 text-right">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};
