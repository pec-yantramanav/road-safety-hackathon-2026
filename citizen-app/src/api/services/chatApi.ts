import { apiClient, USE_MOCK } from '../client/apiClient';
import { ChatMessage } from '../types';

export const chatApi = {
  createSession: async (): Promise<{ token: string }> => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { token: 'mock-session-token-1234' };
    }
    const response = await apiClient.post<{ token: string }>('/chat/session');
    return response.data;
  },

  sendMessage: async (
    sessionToken: string,
    message: string,
    onChunk: (text: string) => void
  ): Promise<void> => {
    if (USE_MOCK) {
      // High fidelity mock stream simulation using standard intervals
      const mockResponses = [
        "Hello! I am the RoadWatch AI assistant. ",
        "I can help you report road grievances, check ticket statuses, or query local budgets. ",
        "It looks like you're talking about a road safety issue. ",
        "I will assist in geo-routing this ticket to the proper municipal body. ",
        "Would you like me to submit a formal complaint for you?"
      ];
      
      let currentWordIndex = 0;
      const interval = setInterval(() => {
        if (currentWordIndex < mockResponses.length) {
          onChunk(mockResponses[currentWordIndex]);
          currentWordIndex++;
        } else {
          clearInterval(interval);
        }
      }, 400);
      return;
    }

    // In prod, use native EventSource or fetch reader for true Server-Sent Events (SSE)
    const response = await fetch(`http://localhost:8000/api/v1/ai/citizen/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}` // session token
      },
      body: JSON.stringify({ message }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      onChunk(chunk);
    }
  }
};
