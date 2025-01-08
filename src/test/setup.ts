import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with React Testing Library matchers
expect.extend(matchers);

// Mock Audio
class AudioMock {
  volume: number;
  currentTime: number;
  paused: boolean;
  src: string;
  onerror: ((ev: Event) => any) | null;
  oncanplaythrough: ((ev: Event) => any) | null;

  constructor(url?: string) {
    this.volume = 1;
    this.currentTime = 0;
    this.paused = true;
    this.src = url || '';
    this.onerror = null;
    this.oncanplaythrough = null;
    
    // Simulate successful loading for OGG files
    if (this.src.endsWith('.ogg')) {
      setTimeout(() => {
        if (this.oncanplaythrough) {
          this.oncanplaythrough(new Event('canplaythrough'));
        }
      }, 0);
    }
  }

  load() {
    return Promise.resolve();
  }

  play() {
    if (!this.src) {
      return Promise.reject(new Error('No audio source'));
    }
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }
}

// @ts-ignore
global.Audio = AudioMock;

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

const i18nInstance = {
  language: 'fr',
  languages: ['fr', 'en'],
  isInitialized: true,
  changeLanguage: () => Promise.resolve(),
  t: (key: string, params?: Record<string, any>) => {
    // Handle hypeTrain special case
    if (key === 'hypeTrain' && params?.count) {
      return `${key} (${params.count})`;
    }
    return key;
  },
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
      t: (key: string, params?: Record<string, any>) => i18nInstance.t(key, params),
      i18n: i18nInstance,
    }),
    initReactI18next: {
      type: '3rdParty',
      init: () => Promise.resolve(),
    },
    I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
    Trans: ({ children }: { children: React.ReactNode }) => children,
  };
});
