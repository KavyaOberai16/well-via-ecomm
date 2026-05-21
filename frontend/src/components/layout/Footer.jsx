import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line-subtle">
      <div className="mx-auto flex max-w-content flex-col gap-8 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-ink-primary">
          <span className="grid size-8 place-items-center rounded-sm bg-accent text-ink-inverse">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span className="text-h3">Lumen</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {[
            { to: '/products', label: 'Shop' },
            { to: '/cart', label: 'Cart' },
            { to: '/login', label: 'Account' },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-sm text-sm text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-ink-tertiary">
          &copy; {new Date().getFullYear()} Lumen. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
