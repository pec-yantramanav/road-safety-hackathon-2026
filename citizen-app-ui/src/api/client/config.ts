import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getHostIP = (): string => {
  // Dynamically resolve packager server IP to support physical devices & emulators
  const hostUri = Constants.expoConfig?.hostUri || 
                  Constants.manifest2?.extra?.expoGo?.developer?.projectUrl ||
                  (Constants as any).manifest?.debuggerHost;
                  
  if (hostUri) {
    const cleaned = hostUri.replace(/^[a-z]+:\/\//, '');
    const ip = cleaned.split(':')[0];
    if (ip) {
      return ip;
    }
  }
  
  // Default to emulator/localhost loopbacks
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

export const LOCAL_HOST = getHostIP();

export const GATEWAY_URL = `http://${LOCAL_HOST}:8000`;
export const KEYCLOAK_URL = `http://${LOCAL_HOST}:8180`;
export const WS_HTTP_URL = `http://${LOCAL_HOST}:8080`;
export const WS_BROKER_URL = `ws://${LOCAL_HOST}:8080`;
