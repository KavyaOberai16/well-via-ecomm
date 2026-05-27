import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, ShoppingBag } from 'lucide-react';
import { apiClient } from '@/services/apiClient.js';
import { Page } from '@/components/layout/Page.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { useAuthStore } from '@/features/auth/store.js';
import { formatPrice } from '@/lib/utils.js';
import { fadeUp, staggerContainer } from '@/lib/motion.js';

const STATUS_TONES = {
  paid: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning',
  shipped: 'bg-accent/15 text-accent',
  delivered: 'bg-success/15 text-success',
  cancelled: 'bg-danger/15 text-danger',
  refunded: 'bg-ink-tertiary/15 text-ink-tertiary',
};

function useMyOrders() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => apiClient.get('/orders').then((r) => r.data),
    enabled: !!token,
    retry: false,
  });
}

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useMyOrders();
  const orders = data ?? [];

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Page>
      <h1 className="text-h1 text-ink-primary">Your orders</h1>
      <p className="mt-1 text-sm text-ink-secondary">
        Everything you&apos;ve bought, newest first.
      </p>

      {isLoading ? (
        <div className="mt-6 grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Once you place an order it will show up here."
            action={
              <Link to="/products">
                <Button size="sm">
                  <ShoppingBag className="size-4" aria-hidden="true" />
                  Start shopping
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <motion.ul
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="show"
          className="mt-6 flex flex-col gap-3"
        >
          {orders.map((o) => {
            const tone = STATUS_TONES[o.status] ?? 'bg-fill text-ink-secondary';
            return (
              <motion.li key={o.id} variants={fadeUp}>
                <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-ink-tertiary">
                      Order #{o.id}
                    </p>
                    <p className="mt-1 text-sm text-ink-primary">
                      {o.items.length} item{o.items.length === 1 ? '' : 's'} ·{' '}
                      <strong>{formatPrice(o.total_amount, o.currency)}</strong>
                    </p>
                    <p className="mt-1 text-xs text-ink-tertiary">
                      Placed {new Date(o.created_at).toLocaleString()}
                    </p>
                    {o.shipping_address && (
                      <p className="mt-1 truncate text-xs text-ink-secondary">
                        Shipping to: {o.shipping_address}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 self-start rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
                  >
                    {o.status}
                  </span>
                </Card>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </Page>
  );
}
