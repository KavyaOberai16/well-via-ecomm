import { useState } from 'react';
import { Copy, Check, Share2, Users, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { cn } from '@/lib/utils.js';
import { useMyReferralOverview, useMyReferrals } from './hooks.js';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function CopyButton({ value, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );
  }
  return (
    <Button type="button" size="sm" variant="secondary" onClick={copy}>
      {copied ? (
        <>
          <Check className="size-4" /> Copied
        </>
      ) : (
        <>
          <Copy className="size-4" /> {label}
        </>
      )}
    </Button>
  );
}

function NativeShareButton({ url, friendAmount }) {
  // Wrap navigator.share — only render if the device supports it; the desktop
  // Copy button is the fallback path.
  if (typeof navigator === 'undefined' || !navigator.share) return null;
  function share() {
    navigator
      .share({
        title: 'Try this store',
        text: `Use my link and get ₹${friendAmount} off your first order.`,
        url,
      })
      .catch(() => {});
  }
  return (
    <Button type="button" size="sm" variant="secondary" onClick={share}>
      <Share2 className="size-4" /> Share
    </Button>
  );
}

export function ReferralSection() {
  const { data, isLoading } = useMyReferralOverview();
  const { data: list, isLoading: listLoading } = useMyReferrals({
    page: 1,
    page_size: 10,
  });

  if (isLoading) {
    return <Skeleton className="h-64 rounded-lg" />;
  }
  if (!data) return null;

  const items = list?.items || [];

  return (
    <section>
      <h2 className="text-h3 text-ink-primary">Refer a friend</h2>
      <Card className="mt-4 grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <p className="text-sm text-ink-secondary">
            Share your link. When a friend signs up they get{' '}
            <strong className="text-ink-primary">₹{data.friend_welcome_amount}</strong>{' '}
            off (min ₹{data.friend_welcome_min_order}). After they complete their
            first order you get{' '}
            <strong className="text-ink-primary">₹{data.referrer_reward_amount}</strong>{' '}
            off (min ₹{data.referrer_reward_min_order}).
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-ink-tertiary">
              Your code
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-sm border border-line-subtle bg-bg-sunken px-3 py-2 font-mono text-sm text-ink-primary">
                {data.code}
              </code>
              <CopyButton value={data.code} />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-ink-tertiary">
              Share link
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-sm border border-line-subtle bg-bg-sunken px-3 py-2 font-mono text-xs text-ink-primary">
                {data.share_url}
              </code>
              <CopyButton value={data.share_url} label="Copy link" />
              <NativeShareButton
                url={data.share_url}
                friendAmount={data.friend_welcome_amount}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
          <Stat label="Total" value={data.total} icon={Users} tone="default" />
          <Stat label="Completed" value={data.completed} icon={Check} tone="success" />
          <Stat label="Pending" value={data.pending} icon={Clock} tone="muted" />
        </div>
      </Card>

      {items.length > 0 && (
        <div className="mt-4 rounded-lg border border-line-subtle bg-bg-elevated">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-ink-tertiary">
                <th className="px-4 py-2 font-medium">Friend</th>
                <th className="px-4 py-2 font-medium">Joined</th>
                <th className="px-4 py-2 font-medium">Completed</th>
                <th className="px-4 py-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-line-subtle">
                  <td className="px-4 py-3 text-sm text-ink-primary">
                    {r.referred_display}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-tertiary">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-tertiary">
                    {formatDate(r.completed_at) || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                        r.status === 'completed'
                          ? 'bg-success/15 text-success'
                          : 'bg-fill text-ink-secondary',
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-sm border border-line-subtle bg-bg-sunken p-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-ink-tertiary">
        <Icon
          className={cn(
            'size-3',
            tone === 'success' ? 'text-success' : 'text-ink-tertiary',
          )}
        />
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-ink-primary tabular-nums">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
