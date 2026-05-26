import { create } from 'zustand';
import { applyTheme, resolveInitialTheme } from '@/lib/theme.js';

/**
 * Theme store. Initial value is resolved from localStorage / OS preference —
 * it matches what the no-flash script in index.html already applied.
 */
export const useThemeStore = create((set, get) => ({
  theme: resolveInitialTheme(),

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
}));
