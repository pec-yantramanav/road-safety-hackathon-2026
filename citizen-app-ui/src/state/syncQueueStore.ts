import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncAction } from '../api/types';

interface SyncQueueState {
  queue: SyncAction[];
  isSyncing: boolean;
  syncError: string | null;
  loadQueue: () => Promise<void>;
  queueAction: (action: SyncAction) => Promise<void>;
  removeAction: (id: string) => Promise<void>;
  startSync: () => void;
  completeSync: () => void;
  failSync: (error: string) => void;
}

const STORAGE_KEY = '@roadwatch_offline_queue';

export const useSyncQueueStore = create<SyncQueueState>((set, get) => ({
  queue: [],
  isSyncing: false,
  syncError: null,

  loadQueue: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        set({ queue: JSON.parse(saved) });
      }
    } catch (e) {
      console.error('Failed to load offline actions from AsyncStorage', e);
    }
  },

  queueAction: async (action: SyncAction) => {
    try {
      const updatedQueue = [...get().queue, action];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue));
      set({ queue: updatedQueue });
    } catch (e) {
      console.error('Failed to add offline action to queue', e);
    }
  },

  removeAction: async (id: string) => {
    try {
      const updatedQueue = get().queue.filter((item) => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue));
      set({ queue: updatedQueue });
    } catch (e) {
      console.error('Failed to remove synced action from queue', e);
    }
  },

  startSync: () => {
    set({ isSyncing: true, syncError: null });
  },

  completeSync: () => {
    set({ isSyncing: false, syncError: null });
  },

  failSync: (error: string) => {
    set({ isSyncing: false, syncError: error });
  }
}));
