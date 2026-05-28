import uiReducer, { 
  toggleSidebar, 
  addToast, 
  removeToast, 
  toggleTheme, 
  setTheme,
  ThemeType
} from '../state/slices/uiSlice';

describe('Redux uiSlice', () => {
  const initialState = {
    sidebarOpen: true,
    toasts: [],
    theme: 'light' as ThemeType,
  };

  // Mock localStorage
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should successfully toggle sidebar status state', () => {
    const nextState = uiReducer(initialState, toggleSidebar());
    expect(nextState.sidebarOpen).toBe(false);

    const backState = uiReducer(nextState, toggleSidebar());
    expect(backState.sidebarOpen).toBe(true);
  });

  it('should successfully append new toast alerts to queue', () => {
    const action = addToast({ type: 'success', message: 'Ticket assigned successfully' });
    const nextState = uiReducer(initialState, action);

    expect(nextState.toasts).toHaveLength(1);
    expect(nextState.toasts[0].message).toBe('Ticket assigned successfully');
    expect(nextState.toasts[0].type).toBe('success');
  });

  it('should successfully remove active toast alerts from queue by ID', () => {
    const activeState = {
      sidebarOpen: true,
      toasts: [
        { id: 't-1', type: 'info' as const, message: 'Message 1', timestamp: '...' },
        { id: 't-2', type: 'warning' as const, message: 'Message 2', timestamp: '...' }
      ],
      theme: 'light' as ThemeType
    };

    const nextState = uiReducer(activeState, removeToast('t-1'));
    expect(nextState.toasts).toHaveLength(1);
    expect(nextState.toasts[0].id).toBe('t-2');
  });

  it('should successfully toggle theme state and update localStorage', () => {
    // 1. Light -> Dark
    const nextState = uiReducer(initialState, toggleTheme());
    expect(nextState.theme).toBe('dark');
    expect(localStorage.getItem('roadwatch_crm_theme')).toBe('dark');

    // 2. Dark -> Light
    const backState = uiReducer(nextState, toggleTheme());
    expect(backState.theme).toBe('light');
    expect(localStorage.getItem('roadwatch_crm_theme')).toBe('light');
  });

  it('should allow setting the theme directly and update localStorage', () => {
    const nextState = uiReducer(initialState, setTheme('dark'));
    expect(nextState.theme).toBe('dark');
    expect(localStorage.getItem('roadwatch_crm_theme')).toBe('dark');
  });
});
