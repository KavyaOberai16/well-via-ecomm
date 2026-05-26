/** Theme persistence + application. The key matches the no-flash script in index.html. */

export const THEME_KEY = 'lumen-theme';

/** Resolve the initial theme: stored choice, else the OS preference. */
export function resolveInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* localStorage unavailable */
  }
  const prefersLight =
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
}

/** Apply a theme to <html> and persist it. */
export function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* localStorage unavailable */
  }
}
