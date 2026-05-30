import '@testing-library/jest-native/extend-expect';

// 1. Mock AsyncStorage persistent engine
jest.mock('@react-native-async-storage/async-storage', () => {
  return require('@react-native-async-storage/async-storage/jest/async-storage-mock');
});

// 2. Mock Expo SecureStore tokens persists
jest.mock('expo-secure-store', () => {
  const store = {};
  return {
    setItemAsync: jest.fn((key, value) => {
      store[key] = value.toString();
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key) => {
      return Promise.resolve(store[key] || null);
    }),
    deleteItemAsync: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
  };
});

// 3. Mock NetInfo connection listener
jest.mock('@react-native-community/netinfo', () => {
  return {
    fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
    addEventListener: jest.fn(() => jest.fn()),
  };
});

// 4. Mock WebView components rendering
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props) => <View {...props} testID="webview-mock" />
  };
});
