import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar.jsx';

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-full bg-bg-base">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Mobile top bar */}
        <div className="flex h-16 items-center gap-3 border-b border-line-subtle px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid size-10 place-items-center rounded-sm text-ink-secondary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold text-ink-primary">Admin</span>
        </div>

        <main className="flex-1 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
