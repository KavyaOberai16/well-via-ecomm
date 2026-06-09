import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { useFooterConfig } from '@/features/footer/hooks.js';
import { FOOTER_DEFAULTS } from '@/features/footer/defaults.js';
import { Search } from 'lucide-react';
const logo = "/logo.jsx";

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Shop' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: footer } = useFooterConfig();
  const brand = { ...FOOTER_DEFAULTS.brand, ...footer?.brand };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
  'fixed inset-x-0 top-0 z-50 transition-colors duration-300 bg-white/80 backdrop-blur-md border-b border-line-subtle',
  scrolled ? 'shadow-sm' : '',
)}
    >
      <nav className="relative mx-auto flex h-16 max-w-content items-center px-6">

        {/* LEFT — Hamburger */}
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-sm text-ink-secondary hover:bg-fill"
        >
          <Menu className="size-5" />
        </button>

        {/* CENTER — Logo */}
        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-ink-primary"
        >
          {brand.logo_url ? (
            <img
              src={logo}
              alt={brand.name || 'Brand'}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <>
              <span className="grid size-8 place-items-center rounded-sm bg-accent text-ink-inverse">
                <Sparkles className="size-4" />
              </span>
              <span className="text-h3">{brand.name || 'Brand'}</span>
            </>
          )}
        </Link>

        {/* RIGHT — Search + Cart */}
        <div className="ml-auto flex items-center gap-2">

          {/* Search */}
          <button
            aria-label="Search"
            className="grid size-10 place-items-center rounded-sm text-ink-secondary hover:bg-fill"
          >
            <Search className="size-5" />
          </button>

          {/* Cart */}
          <Link
            to="/cart"
            aria-label="Cart"
            className="grid size-10 place-items-center rounded-sm text-ink-secondary hover:bg-fill"
          >
            <ShoppingBag className="size-5" />
          </Link>

        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden glass md:hidden"
          >
            <ul className="flex flex-col gap-1 px-6 py-4">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-sm px-3 py-2.5 text-base text-ink-secondary hover:text-ink-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}

              <li className="mt-2 border-t border-line-subtle pt-3">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-accent"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}