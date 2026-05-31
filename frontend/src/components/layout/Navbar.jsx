import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { useAuthStore } from '@/features/auth/store.js';
import { useFooterConfig } from '@/features/footer/hooks.js';
import { FOOTER_DEFAULTS } from '@/features/footer/defaults.js';
import { ThemeToggle } from '@/components/ui/ThemeToggle.jsx';
import AccountMenu from './AccountMenu.jsx';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Shop' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { data: footer } = useFooterConfig();
  const brand = { ...FOOTER_DEFAULTS.brand, ...footer?.brand };

  const links = user?.is_admin ? [...LINKS, { to: '/admin', label: 'Admin' }] : LINKS;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled ? 'glass' : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-content items-center gap-6 px-6">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-sm text-ink-primary focus-visible:focus-ring"
        >
          {brand.logo_url ? (
            <img
              src={brand.logo_url}
              alt={brand.name || 'Lumen'}
              className="h-8 w-auto max-w-[160px] object-contain"
            />
          ) : (
            <>
              <span className="grid size-8 place-items-center rounded-sm bg-accent text-ink-inverse">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <span className="text-h3">{brand.name || 'Lumen'}</span>
            </>
          )}
        </Link>

        <ul className="ml-2 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-sm px-3 py-2 text-sm transition-colors focus-visible:focus-ring',
                    isActive
                      ? 'text-ink-primary'
                      : 'text-ink-secondary hover:text-ink-primary',
                  )
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Theme toggle lives in the bar on >=sm; on phones it moves into the
              menu to keep the top bar uncluttered. */}
          <span className="hidden sm:inline-flex">
            <ThemeToggle />
          </span>
          <Link
            to="/cart"
            aria-label="Cart"
            className="grid size-10 place-items-center rounded-sm text-ink-secondary transition-colors hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
          </Link>
          <AccountMenu />
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-sm text-ink-secondary transition-colors hover:bg-fill hover:text-ink-primary focus-visible:focus-ring md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden glass md:hidden"
          >
            <ul className="flex flex-col gap-1 px-6 py-4">
              {[...links, { to: '/cart', label: 'Cart' }].map(
                (l) => (
                  <li key={l.to}>
                    <NavLink
                      to={l.to}
                      end={l.end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'block rounded-sm px-3 py-2.5 text-base transition-colors focus-visible:focus-ring',
                          isActive
                            ? 'bg-fill text-ink-primary'
                            : 'text-ink-secondary hover:text-ink-primary',
                        )
                      }
                    >
                      {l.label}
                    </NavLink>
                  </li>
                ),
              )}

              {!user && (
                <li>
                  <NavLink
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-sm px-3 py-2.5 text-base font-medium text-accent focus-visible:focus-ring"
                  >
                    Sign in
                  </NavLink>
                </li>
              )}

              <li className="mt-1 flex items-center justify-between border-t border-line-subtle px-3 pt-3">
                <span className="text-sm text-ink-secondary">Theme</span>
                <ThemeToggle />
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
