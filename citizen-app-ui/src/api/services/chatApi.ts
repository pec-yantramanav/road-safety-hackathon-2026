import { apiClient, USE_MOCK } from '../client/apiClient';
import { ChatMessage } from '../types';
import { GATEWAY_URL } from '../client/config';

export const chatApi = {
  createSession: async (): Promise<{ token: string }> => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { token: 'mock-session-token-1234' };
    }
    // Post to Kong routed AI service chat session path
    const response = await fetch(`${GATEWAY_URL}/api/v1/ai/citizen/chat/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      throw new Error('Failed to create chat session');
    }
    const data = await response.json();
    return { token: data.session_token };
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

    // Call the FastAPI chat message endpoint, sending session_token in the request body
    const response = await fetch(`${GATEWAY_URL}/api/v1/ai/citizen/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_token: sessionToken, message }),
    });

    if (response.ok) {
      const data = await response.json();
      onChunk(data.content);
    } else {
      throw new Error('Failed to send message');
    }
  }
};
