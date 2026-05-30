import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useSyncQueueStore } from '../state/syncQueueStore';
import { ticketApi } from '../api/services/ticketApi';

export const useOfflineSyncController = () => {
  const { queue, isSyncing, loadQueue, startSync, completeSync, failSync, removeAction } = useSyncQueueStore();

  // Load the persisted queue on controller startup
  useEffect(() => {
    loadQueue();
  }, []);

  // Set up network transitions listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable && queue.length > 0 && !isSyncing) {
        triggerSyncReplay();
      }
    });

    return () => unsubscribe();
  }, [queue, isSyncing]);

  const triggerSyncReplay = async () => {
    if (queue.length === 0 || isSyncing) return;
    startSync();

    try {
      // Replay actions using the /sync/queue REST endpoint
      const syncResults = await ticketApi.syncQueue(queue);
      
      for (const result of syncResults) {
        if (result.success) {
          await removeAction(result.actionId);
        } else {
          console.warn(`Sync failed for action: ${result.actionId}. Details: ${result.error}`);
        }
      }
      completeSync();
    } catch (err) {
      failSync(err instanceof Error ? err.message : 'Unknown sync network error');
    }
  };

  return {
    queue,
    queueLength: queue.length,
    isSyncing,
    triggerManualSync: triggerSyncReplay
  };
};
