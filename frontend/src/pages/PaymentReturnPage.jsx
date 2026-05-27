import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ShoppingBag, ListOrdered } from 'lucide-react';
import { Page } from '@/components/layout/Page.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { usePaymentStatus } from '@/features/payments/hooks.js';
import { formatPrice } from '@/lib/utils.js';
import { fadeUp } from '@/lib/motion.js';

const TERMINAL_STATES = new Set(['paid', 'cancelled', 'refunded']);

/**
 * Lands here from the provider redirect. We don't trust the URL — we poll
 * /payments/{mtid}/status so the server tells us what actually happened.
 */
export default function PaymentReturnPage() {
  const [params] = useSearchParams();
  const mtid = params.get('mtid');

  const { data, isLoading, isError } = usePaymentStatus(mtid, {
    enabled: !!mtid,
    // Poll until the server resolves the order. Once terminal, stop.
    refetchInterval: (query) => {
      const status = query.state.data?.order_status;
      return status && TERMINAL_STATES.has(status) ? false : 1500;
    },
  });

  if (!mtid) {
    return (
      <Page>
        <BadParams />
      </Page>
    );
  }

  const status = data?.order_status;
  const isPaid = status === 'paid';
  const isFailed = status === 'cancelled' || status === 'refunded';
  const isPending = !status || status === 'pending';

  return (
    <Page>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-md"
      >
        <Card className="p-7 text-center">
          {(isLoading || isPending) && !isError && (
            <>
              <Spinner />
              <h1 className="mt-4 text-h2 text-ink-primary">Confirming your payment</h1>
              <p className="mt-2 text-sm text-ink-secondary">
                This usually takes only a moment.
              </p>
            </>
          )}

          {isPaid && (
            <>
              <Icon tone="success">
                <CheckCircle2 className="size-7" aria-hidden="true" />
              </Icon>
              <h1 className="mt-4 text-h2 text-ink-primary">Payment successful</h1>
              <p className="mt-2 text-sm text-ink-secondary">
                Order <code>#{data.order_id}</code> for{' '}
                <strong>{formatPrice(data.total_amount, data.currency)}</strong> is
                confirmed. We&apos;ll email you when it ships.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Link to="/orders">
                  <Button block variant="primary" size="md">
                    <ListOrdered className="size-4" aria-hidden="true" />
                    View my orders
                  </Button>
                </Link>
                <Link to="/products">
                  <Button block variant="secondary" size="md">
                    <ShoppingBag className="size-4" aria-hidden="true" />
                    Keep shopping
                  </Button>
                </Link>
              </div>
            </>
          )}

          {isFailed && (
            <>
              <Icon tone="danger">
                <XCircle className="size-7" aria-hidden="true" />
              </Icon>
              <h1 className="mt-4 text-h2 text-ink-primary">Payment didn&apos;t go through</h1>
              <p className="mt-2 text-sm text-ink-secondary">
                Your order wasn&apos;t placed. Stock has been returned to the catalog;
                feel free to try again.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Link to="/cart">
                  <Button block variant="primary" size="md">
                    Back to cart
                  </Button>
                </Link>
                <Link to="/products">
                  <Button block variant="secondary" size="md">
                    Browse products
                  </Button>
                </Link>
              </div>
            </>
          )}

          {isError && (
            <>
              <Icon tone="danger">
                <XCircle className="size-7" aria-hidden="true" />
              </Icon>
              <h1 className="mt-4 text-h2 text-ink-primary">Couldn&apos;t confirm</h1>
              <p className="mt-2 text-sm text-ink-secondary">
                We had trouble checking the payment status. Check your orders in a
                moment to see if it went through.
              </p>
              <Link to="/orders" className="mt-6 inline-block">
                <Button variant="primary" size="md">
                  View my orders
                </Button>
              </Link>
            </>
          )}
        </Card>
      </motion.div>
    </Page>
  );
}

function Spinner() {
  return (
    <span className="grid size-12 place-items-center rounded-full bg-fill text-ink-secondary mx-auto">
      <Loader2 className="size-6 animate-spin" aria-hidden="true" />
    </span>
  );
}

function Icon({ tone, children }) {
  const toneClass =
    tone === 'success'
      ? 'bg-success/15 text-success'
      : tone === 'danger'
        ? 'bg-danger/15 text-danger'
        : 'bg-fill text-ink-secondary';
  return (
    <span className={`mx-auto grid size-14 place-items-center rounded-full ${toneClass}`}>
      {children}
    </span>
  );
}

function BadParams() {
  return (
    <Card className="mx-auto max-w-md p-6 text-center">
      <h1 className="text-h2 text-ink-primary">Missing transaction reference</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        It looks like you landed here without a transaction id.
      </p>
      <Link to="/orders" className="mt-5 inline-block">
        <Button variant="primary" size="md">
          View my orders
        </Button>
      </Link>
    </Card>
  );
}
