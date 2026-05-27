import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  Gift,
  Lock,
  AlertTriangle,
  Check,
  Copy,
  ShoppingBag,
  Star,
  RefreshCw,
  TicketPercent,
  Sparkles,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { Page } from '@/components/layout/Page.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { cn, formatPrice } from '@/lib/utils.js';
import { useAuthStore } from '@/features/auth/store.js';
import { useMyLoyalty, useRedeemTier } from '@/features/loyalty/hooks.js';
import { ReferralSection } from '@/features/loyalty/ReferralSection.jsx';
import { VipTierCard } from '@/features/loyalty/VipTierCard.jsx';

const REASON_LABELS = {
  signup_bonus: { label: 'Welcome bonus', icon: Sparkles },
  place_order: { label: 'Order', icon: ShoppingBag },
  write_review: { label: 'Review', icon: Star },
  redeem: { label: 'Redeemed', icon: TicketPercent },
  refund_reversal: { label: 'Refund reversal', icon: RefreshCw },
  expiry: { label: 'Expired', icon: RefreshCw },
  admin_adjust: { label: 'Admin adjustment', icon: RefreshCw },
};

function formatReason(reason) {
  return REASON_LABELS[reason] || { label: reason.replace(/_/g, ' '), icon: RefreshCw };
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function describeTierReward(tier) {
  if (tier.discount_type === 'percent') {
    const cap = tier.max_discount ? ` (up to ${formatPrice(tier.max_discount)})` : '';
    return `${Number(tier.discount_value)}% off${cap}`;
  }
  return `${formatPrice(tier.discount_value)} off`;
}

function RedeemSuccessBanner({ result, onDismiss }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(result.coupon_code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  }
  return (
    <div className="mb-6 rounded-lg border border-success/30 bg-success/10 p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success/20 text-success">
          <Gift className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink-primary">
            Reward unlocked
          </h3>
          <p className="mt-0.5 text-xs text-ink-secondary">
            Paste this code at checkout. New balance:{' '}
            <strong className="text-ink-primary">
              {result.new_balance.toLocaleString()} pts
            </strong>
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-sm border border-line-subtle bg-bg-elevated px-3 py-2">
            <span className="font-mono text-sm text-ink-primary">
              {result.coupon_code}
            </span>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy code"
              className="grid size-7 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
            >
              {copied ? (
                <Check className="size-4 text-success" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="grid size-8 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function TierCard({ tier, balance, onRedeem, redeeming }) {
  const canRedeem = balance >= tier.cost_points && !redeeming;
  const shortBy = balance < tier.cost_points ? tier.cost_points - balance : 0;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
          <TicketPercent className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-primary">{tier.name}</p>
          <p className="mt-0.5 text-xs text-ink-secondary">
            {describeTierReward(tier)}
          </p>
        </div>
      </div>
      <p className="text-h3 text-ink-primary tabular-nums">
        {tier.cost_points.toLocaleString()}{' '}
        <span className="text-sm font-normal text-ink-tertiary">pts</span>
      </p>
      <p className="text-[11px] text-ink-tertiary">
        Coupon valid for {tier.expires_after_days} day
        {tier.expires_after_days === 1 ? '' : 's'} after redemption.
      </p>
      {!canRedeem && shortBy > 0 ? (
        <Button size="sm" disabled className="mt-1">
          Need {shortBy.toLocaleString()} more pts
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => onRedeem(tier)}
          loading={redeeming}
          disabled={!canRedeem}
          className="mt-1"
        >
          <Gift className="size-4" aria-hidden="true" />
          Redeem
        </Button>
      )}
    </Card>
  );
}

function TransactionRow({ tx }) {
  const { label, icon: Icon } = formatReason(tx.reason);
  const isCredit = tx.delta > 0;
  return (
    <li className="flex items-center gap-3 border-t border-line-subtle px-4 py-3 first:border-t-0">
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full',
          isCredit ? 'bg-success/15 text-success' : 'bg-fill text-ink-secondary',
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-primary">{label}</p>
        {tx.description && (
          <p className="truncate text-xs text-ink-tertiary">{tx.description}</p>
        )}
      </div>
      <p className="text-xs text-ink-tertiary">{formatDate(tx.created_at)}</p>
      <p
        className={cn(
          'w-20 text-right text-sm font-semibold tabular-nums',
          isCredit ? 'text-success' : 'text-ink-secondary',
        )}
      >
        {isCredit ? '+' : ''}
        {tx.delta.toLocaleString()}
      </p>
    </li>
  );
}

export default function RewardsPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error, refetch } = useMyLoyalty();
  const redeem = useRedeemTier();
  const [success, setSuccess] = useState(null);

  const status = error?.response?.status;
  if (!user || status === 401) {
    return (
      <Page>
        <h1 className="text-h1 text-ink-primary">Rewards</h1>
        <div className="mt-6">
          <EmptyState
            icon={Lock}
            title="Sign in to view your rewards"
            description="Your points and coupon history live with your account."
            action={
              <Link to="/login?next=/rewards">
                <Button size="sm">Sign in</Button>
              </Link>
            }
          />
        </div>
      </Page>
    );
  }

  if (isError) {
    return (
      <Page>
        <h1 className="text-h1 text-ink-primary">Rewards</h1>
        <div className="mt-6">
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load your rewards"
            description="Something went wrong on our end. Please try again."
            action={
              <Button size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        </div>
      </Page>
    );
  }

  const balance = data?.balance ?? 0;
  const lifetime = data?.lifetime ?? 0;
  const tiers = data?.tiers ?? [];
  const recent = data?.recent ?? [];
  const tierProgress = data?.tier_progress;

  function handleRedeem(tier) {
    setSuccess(null);
    redeem.mutate(tier.id, {
      onSuccess: (resp) => setSuccess(resp),
      onError: () => {},
    });
  }

  return (
    <Page>
      <h1 className="text-h1 text-ink-primary">Rewards</h1>

      {isLoading ? (
        <div className="mt-6 flex flex-col gap-6">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {success && (
            <RedeemSuccessBanner result={success} onDismiss={() => setSuccess(null)} />
          )}

          <VipTierCard progress={tierProgress} />

          {/* Balance card */}
          <Card className="grid gap-4 p-6 sm:grid-cols-[1fr_1px_1fr]">
            <div>
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-tertiary">
                <Coins className="size-3.5" aria-hidden="true" />
                Available
              </p>
              <p className="mt-2 text-[2.25rem] font-semibold text-ink-primary tabular-nums">
                {balance.toLocaleString()}
                <span className="ml-2 text-sm font-normal text-ink-tertiary">pts</span>
              </p>
              {balance < 0 && (
                <p className="mt-1 text-xs text-warning">
                  Your balance is negative — earn points to bring it back to zero.
                </p>
              )}
            </div>
            <div className="hidden bg-line-subtle sm:block" />
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-tertiary">
                Lifetime earned
              </p>
              <p className="mt-2 text-[1.5rem] font-semibold text-ink-secondary tabular-nums">
                {lifetime.toLocaleString()}
                <span className="ml-2 text-sm font-normal text-ink-tertiary">pts</span>
              </p>
              <p className="mt-1 text-xs text-ink-tertiary">
                Total points you&apos;ve ever earned.
              </p>
            </div>
          </Card>

          {/* Tiers */}
          <section>
            <h2 className="text-h3 text-ink-primary">Ways to redeem</h2>
            {tiers.length === 0 ? (
              <p className="mt-3 text-sm text-ink-secondary">
                No rewards are available right now. Check back soon.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tiers.map((t) => (
                  <TierCard
                    key={t.id}
                    tier={t}
                    balance={balance}
                    onRedeem={handleRedeem}
                    redeeming={redeem.isPending && redeem.variables === t.id}
                  />
                ))}
              </div>
            )}
            {redeem.isError && (
              <p className="mt-3 text-xs text-danger">
                {redeem.error?.response?.data?.error?.message || 'Could not redeem.'}
              </p>
            )}
          </section>

          <ReferralSection />

          {/* Recent activity */}
          <section>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-h3 text-ink-primary">Recent activity</h2>
              <p className="text-xs text-ink-tertiary">
                <ArrowUp className="-mr-0.5 inline size-3 text-success" /> earned
                <span className="mx-2">·</span>
                <ArrowDown className="-mr-0.5 inline size-3 text-ink-secondary" /> spent
              </p>
            </div>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-ink-secondary">
                No activity yet. Place an order or write a review to start earning.
              </p>
            ) : (
              <ul className="mt-4 rounded-lg border border-line-subtle bg-bg-elevated">
                {recent.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Page>
  );
}
