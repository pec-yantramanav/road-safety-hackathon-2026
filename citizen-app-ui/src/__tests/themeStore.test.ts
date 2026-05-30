import { useThemeStore } from '../state/themeStore';

describe('Zustand themeStore', () => {
  beforeEach(() => {
    // Reset Zustand store state before each run
    useThemeStore.setState({
      theme: 'light',
    });
    jest.clearAllMocks();
  });

  it('should initialize with light theme by default', () => {
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('should allow setting the theme directly', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');

    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('should toggle the theme state correctly between light and dark', () => {
    // Starts light -> toggles to dark
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');

    // Toggles back to light
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });
});
