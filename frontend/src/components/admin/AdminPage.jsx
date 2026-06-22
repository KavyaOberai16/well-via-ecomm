import { motion, useReducedMotion } from 'framer-motion';
import { duration, ease } from '@/lib/motion.js';

/** Consistent admin page shell — title, optional description + action, content. */
export function AdminPage({ title, description, action, children }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: ease.standard }}
      className="mx-auto w-full max-w-5xl"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-h1 text-ink-primary">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-ink-secondary">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="mt-8">{children}</div>
    </motion.div>
  );
}
