import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with React Testing Library matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

const i18nInstance = {
  language: 'fr',
  languages: ['fr', 'en'],
  isInitialized: true,
  changeLanguage: () => Promise.resolve(),
  t: (key: string) => key,
  exists: () => true,
  use: () => i18nInstance,
  init: () => Promise.resolve(i18nInstance),
  on: () => i18nInstance,
  off: () => i18nInstance,
};

// Mock i18next
vi.mock('i18next', () => ({
  default: i18nInstance,
}));

// Mock react-i18next
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: i18nInstance,
    }),
    initReactI18next: {
      type: '3rdParty',
      init: () => Promise.resolve(),
    },
    // Add other components that might be used
    I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
    Trans: ({ children }: { children: React.ReactNode }) => children,
  };
});
