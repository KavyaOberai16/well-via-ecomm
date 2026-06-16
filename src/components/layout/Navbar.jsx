import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { useFooterConfig } from '@/features/footer/hooks.js';
import { FOOTER_DEFAULTS } from '@/features/footer/defaults.js';
import { Search } from 'lucide-react';


const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Shop' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

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
        className="absolute left-1/2 -translate-x-1/2 flex items-center"
        >
        <img
        src="/logo.png"
        alt="Wellvia"
       className="h-10 w-auto object-contain"
  />
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

      {/* Mobile Sidebar */}
<AnimatePresence>
  {open && (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-40"
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 h-screen w-[80%] max-w-xs bg-white z-50 p-6 inclusive-sans"
      >
        {/* Close Button */}
        <button
          onClick={() => setOpen(false)}
          className="mb-8 text-2xl"
        >
          ✕
        </button>

        {/* Links */}
        <div className="space-y-6 ">

          <div className="border-b pb-3">
  <button
    onClick={() => setShopOpen((v) => !v)}
    className="flex w-full justify-between"
  >
    <span>SHOP</span>
    <span>{shopOpen ? "∧" : "∨"}</span>
  </button>

  {shopOpen && (
    <div className="mt-3 ml-4 flex flex-col gap-3 text-sm text-gray-600">
      <Link to="/products" onClick={() => setOpen(false)}>
        All Products
      </Link>

      <Link to="/products" onClick={() => setOpen(false)}>
        Best Sellers
      </Link>

      <Link to="/products" onClick={() => setOpen(false)}>
        New Launches
      </Link>
    </div>
  )}
</div>

          <div className="flex justify-between border-b pb-3">
            <span>CATEGORIES</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span>BLOG</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span>CONTACT</span>
          </div>

        </div>

        {/* Sign In */}
        <button className="mt-12 w-full rounded-full bg-[#133F30] py-3 text-white">
          Sign In with Phone No.
        </button>

      </motion.div>
    </>
  )}
</AnimatePresence>
    </header>
  );
}