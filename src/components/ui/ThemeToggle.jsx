import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/features/theme/store.js';

/** Dark/light theme switch. Icon cross-fades on toggle. */
export function ThemeToggle({ className }) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const reduce = useReducedMotion();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      className={
        'relative grid size-10 place-items-center overflow-hidden rounded-sm ' +
        'text-ink-secondary transition-colors hover:bg-fill hover:text-ink-primary ' +
        'focus-visible:focus-ring ' +
        (className || '')
      }
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={theme}
          initial={reduce ? false : { opacity: 0, rotate: -45, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.6 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {isDark ? (
            <Moon className="size-5" aria-hidden="true" />
          ) : (
            <Sun className="size-5" aria-hidden="true" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
