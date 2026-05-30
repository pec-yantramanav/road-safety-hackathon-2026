import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_HTTP_URL, WS_BROKER_URL } from '../client/config';

const WS_URL = `${WS_HTTP_URL}/ws/tickets`; // Spring Boot WS endpoint

class STOMPClientWrapper {
  private client: Client;
  private connected: boolean = false;

  constructor() {
    this.client = new Client({
      brokerURL: `${WS_BROKER_URL}/ws/tickets`, // Fallback for pure WS connections
      webSocketFactory: () => new SockJS(WS_URL), // Use SockJS for standard fallback support
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('[STOMP DEBUG]:', str);
      },
    });

    this.client.onConnect = (frame) => {
      console.log('STOMP connected successfully', frame);
      this.connected = true;
    };

    this.client.onDisconnect = (frame) => {
      console.log('STOMP disconnected', frame);
      this.connected = false;
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP protocol error', frame);
    };

    this.client.activate();
  }

  public subscribe(destination: string, callback: (message: IMessage) => void) {
    if (!this.connected) {
      console.warn('STOMP is not connected yet, queueing subscription');
    }
    return this.client.subscribe(destination, callback);
  }

  public disconnect() {
    this.client.deactivate();
  }
}

export const socketClient = new STOMPClientWrapper();
