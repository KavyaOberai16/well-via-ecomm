import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button.jsx';
import { duration, ease } from '@/lib/motion.js';

export default function NotFoundPage() {
  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-content flex-col items-center justify-center px-6 py-12 text-center">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/3 -z-10 size-[380px] -translate-x-1/2 rounded-full bg-accent/12 blur-[130px]"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.base, ease: ease.entrance }}
        className="flex flex-col items-center"
      >
        <span className="grid size-14 place-items-center rounded-full bg-fill text-ink-secondary">
          <Compass className="size-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-display text-ink-primary">404</p>
        <h1 className="mt-1 text-h2 text-ink-primary">This page wandered off</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-secondary">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link to="/" className="mt-7">
          <Button size="lg">Back to home</Button>
        </Link>
      </motion.div>
    </main>
  );
}
