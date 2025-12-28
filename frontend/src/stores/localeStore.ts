import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { setLocaleGetter } from '../lib/api';
import type { Locale, Direction, TranslationsResponse } from '../types';

interface LocaleState {
  locale: Locale;
  direction: Direction;
  translations: Record<string, string>;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setLocale: (locale: Locale) => Promise<void>;
  loadTranslations: () => Promise<void>;
  t: (key: string, fallback?: string) => string;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      direction: 'ltr',
      translations: {},
      isLoading: false,
      isInitialized: false,

      setLocale: async (locale: Locale) => {
        const direction: Direction = locale === 'ar' ? 'rtl' : 'ltr';

        // Update HTML attributes immediately for RTL
        document.documentElement.lang = locale;
        document.documentElement.dir = direction;

        // Set locale first so API requests use the new locale header
        set({ locale, direction, isLoading: true });

        // Small delay to ensure locale is set before API call
        await new Promise(resolve => setTimeout(resolve, 10));

        // Load translations for new locale
        await get().loadTranslations();

        set({ isLoading: false, isInitialized: true });
      },

      loadTranslations: async () => {
        const { locale } = get();
        try {
          // Force the correct locale header
          const response = await api.get<TranslationsResponse>('/translations', {
            headers: {
              'Accept-Language': locale,
              'X-Locale': locale,
            }
          });
          const messages = response.data.data.messages || {};
          set({ translations: messages, isInitialized: true });
        } catch (error) {
          console.error('Failed to load translations:', error);
          // Fallback to empty translations
          set({ translations: {}, isInitialized: true });
        }
      },

      t: (key: string, fallback?: string) => {
        const { translations } = get();
        return translations[key] || fallback || key;
      },
    }),
    {
      name: 'locale-storage',
      partialize: (state) => ({ locale: state.locale, direction: state.direction }),
      onRehydrateStorage: () => (state) => {
        // Apply stored locale to HTML on rehydration
        if (state) {
          document.documentElement.lang = state.locale;
          document.documentElement.dir = state.direction;
          // Load translations for the stored locale after rehydration
          // This needs to happen after the store is fully initialized
          setTimeout(() => {
            useLocaleStore.getState().loadTranslations();
          }, 0);
        }
      },
    }
  )
);

// Initialize locale getter for API client
setLocaleGetter(() => useLocaleStore.getState().locale);
