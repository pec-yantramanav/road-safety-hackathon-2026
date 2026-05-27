import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

// 1. Establish Mock Service Worker node server wrapper
export const server = setupServer(...handlers);

beforeAll(() => {
  // Boot node mock server interceptors before test runs
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  // Reset active mock route handlers between tests
  server.resetHandlers();
});

afterAll(() => {
  // Gracefully terminate mock worker server
  server.close();
});
