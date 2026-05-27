import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './state/store';
import App from './App';
import './index.css';

async function prepareApp() {
  // Check if we are running in dual-mock sandboxed dev mode
  const { USE_MOCK } = await import('./api/client/apiClient').catch(() => ({ USE_MOCK: true }));
  
  if (USE_MOCK) {
    const { worker } = await import('./mocks/browser');
    // Start MSW Service Worker asynchronously
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
    console.log('[MSW Worker]: Dual-Mode Mock Interceptors Activated.');
  }
}

prepareApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
});
