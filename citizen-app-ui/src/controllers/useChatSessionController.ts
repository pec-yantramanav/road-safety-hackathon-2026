import { useState, useEffect } from 'react';
import { chatApi } from '../api/services/chatApi';
import { ChatMessage } from '../api/types';

export const useChatSessionController = () => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Initialize session token on hook load
  useEffect(() => {
    const initSession = async () => {
      try {
        const { token } = await chatApi.createSession();
        setSessionToken(token);
        
        // Add initial welcoming greeting message from AI
        setMessages([
          {
            id: 'init',
            role: 'assistant',
            content: "Hello! I am RoadWatch AI. How can I help you improve road safety today? You can report a pothole, request status on complaints, or check local municipal budget allocations.",
            timestamp: new Date().toISOString()
          }
        ]);
      } catch (e) {
        console.error('Failed to initialize AI chat session', e);
      }
    };
    initSession();
  }, []);

  const sendMessage = async (content: string) => {
    if (!sessionToken || !content.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    const assistantMsgId = Math.random().toString();
    const assistantMsgPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMsgPlaceholder]);

    try {
      await chatApi.sendMessage(sessionToken, content, (chunk) => {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === assistantMsgId) {
              return { ...msg, content: msg.content + chunk };
            }
            return msg;
          })
        );
      });
    } catch (e) {
      console.error('Streaming message failed', e);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === assistantMsgId) {
            return { ...msg, content: 'Error streaming response. Please try again.' };
          }
          return msg;
        })
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return {
    messages,
    isStreaming,
    sendMessage,
    isReady: !!sessionToken
  };
};
