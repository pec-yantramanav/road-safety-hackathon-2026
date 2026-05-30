import { useSyncQueueStore } from '../state/syncQueueStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncAction } from '../api/types';

describe('Zustand syncQueueStore', () => {
  beforeEach(async () => {
    // Reset state and clear storage
    useSyncQueueStore.setState({
      queue: [],
      isSyncing: false,
      syncError: null,
    });
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('should successfully add new action items to queue and serialize to AsyncStorage', async () => {
    const actionItem: SyncAction = {
      id: 'action-uuid-1',
      type: 'CREATE_TICKET',
      payload: { category: 'POTHOLE', description: 'Crater' },
      timestamp: '2026-05-13T12:00:00Z',
      attempts: 0
    };

    await useSyncQueueStore.getState().queueAction(actionItem);

    const storeState = useSyncQueueStore.getState();
    expect(storeState.queue).toHaveLength(1);
    expect(storeState.queue[0]).toEqual(actionItem);

    const persisted = await AsyncStorage.getItem('@roadwatch_offline_queue');
    expect(persisted).toBeDefined();
    expect(JSON.parse(persisted!)).toEqual([actionItem]);
  });

  it('should successfully remove synced actions from queue and update storage', async () => {
    const item1 = { id: 'act-1', type: 'CREATE_TICKET' as const, payload: {}, timestamp: '', attempts: 0 };
    const item2 = { id: 'act-2', type: 'CONTRIBUTE' as const, payload: {}, timestamp: '', attempts: 0 };
    
    useSyncQueueStore.setState({ queue: [item1, item2] });

    await useSyncQueueStore.getState().removeAction('act-1');

    const storeState = useSyncQueueStore.getState();
    expect(storeState.queue).toHaveLength(1);
    expect(storeState.queue[0].id).toBe('act-2');

    const persisted = await AsyncStorage.getItem('@roadwatch_offline_queue');
    expect(JSON.parse(persisted!)).toEqual([item2]);
  });
});
