import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Package, Tags, Store, LogOut, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { useAuthStore } from '@/features/auth/store.js';
import { ThemeToggle } from '@/components/ui/ThemeToggle.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/categories', label: 'Categories', icon: Tags, end: false },
];

function SidebarContent({ onNavigate }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-full flex-col gap-1 p-4">
      <Link
        to="/admin"
        onClick={onNavigate}
        className="mb-4 flex items-center gap-2 rounded-sm px-2 py-1 text-ink-primary focus-visible:focus-ring"
      >
        <span className="grid size-8 place-items-center rounded-sm bg-accent text-ink-inverse">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <span className="text-h3">Lumen</span>
        <span className="rounded-full bg-fill-strong px-2 py-0.5 text-xs text-ink-secondary">
          Admin
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors focus-visible:focus-ring',
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-ink-secondary hover:bg-fill hover:text-ink-primary',
              )
            }
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-line-subtle pt-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
        >
          <Store className="size-4" aria-hidden="true" />
          Back to store
        </Link>

        <div className="flex items-center gap-2 px-3 py-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
            {(user?.email || '?').charAt(0).toUpperCase()}
          </div>
          <span className="min-w-0 flex-1 truncate text-xs text-ink-secondary">
            {user?.email}
          </span>
          <ThemeToggle className="size-8" />
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-danger/10 hover:text-danger focus-visible:focus-ring"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop — persistent */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line-subtle bg-bg-elevated lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile — overlay drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-line-subtle bg-bg-elevated lg:hidden"
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="absolute right-3 top-3 grid size-9 place-items-center rounded-sm text-ink-secondary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
              >
                <X className="size-5" />
              </button>
              <SidebarContent onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
