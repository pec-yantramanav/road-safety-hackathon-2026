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
            ? 'bg-accent dark:bg-darkAccent rounded-tr-none'
            : 'bg-cardBg dark:bg-darkCardBg rounded-tl-none border border-borderBg dark:border-darkBorderBg'
        }`}
      >
        <Text className={`text-textPrimary dark:text-darkTextPrimary text-sm leading-5 ${isUser ? 'text-white' : ''}`}>
          {message.content}
        </Text>
        <Text className="text-[10px] text-textSecondary dark:text-darkTextSecondary mt-2 text-right">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};
