import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../api/types';
import { useThemeStore } from '../state/themeStore';
import { Colors } from '../styles/theme';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.botContainer]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, isDark ? styles.userBubbleDark : styles.userBubbleLight]
            : [styles.botBubble, isDark ? styles.botBubbleDark : styles.botBubbleLight],
        ]}
      >
        <Text
          style={[
            styles.text,
            isDark ? styles.textDark : styles.textLight,
            isUser && styles.userText,
          ]}
        >
          {message.content}
        </Text>
        <Text style={[styles.timeText, isDark ? styles.timeTextDark : styles.timeTextLight]}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  botContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 16,
  },
  userBubble: {
    borderTopRightRadius: 0,
  },
  userBubbleLight: {
    backgroundColor: Colors.light.accent,
  },
  userBubbleDark: {
    backgroundColor: Colors.dark.accent,
  },
  botBubble: {
    borderTopLeftRadius: 0,
    borderWidth: 1,
  },
  botBubbleLight: {
    backgroundColor: Colors.light.cardBg,
    borderColor: Colors.light.borderBg,
  },
  botBubbleDark: {
    backgroundColor: Colors.dark.cardBg,
    borderColor: Colors.dark.borderBg,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  textLight: {
    color: Colors.light.textPrimary,
  },
  textDark: {
    color: Colors.dark.textPrimary,
  },
  userText: {
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 10,
    marginTop: 8,
    textAlign: 'right',
  },
  timeTextLight: {
    color: Colors.light.textSecondary,
  },
  timeTextDark: {
    color: Colors.dark.textSecondary,
  },
});
