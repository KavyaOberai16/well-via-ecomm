import { useEffect, useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import {
  usePaymentGateway,
  useUpdatePaymentGateway,
} from '@/features/payment-gateway/hooks.js';

// Sent back unchanged so the server keeps the stored salt key.
const SALT_KEPT = '***';

export default function AdminPaymentGatewayPage() {
  const { data, isLoading, isError, refetch } = usePaymentGateway();
  const update = useUpdatePaymentGateway();

  const [form, setForm] = useState(null);
  const [saltDirty, setSaltDirty] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(false);

  // Hydrate the form from the server config. The salt key is never returned —
  // we seed it with the keep-sentinel and only send a real value once edited.
  useEffect(() => {
    if (!data) return;
    setForm({
      provider: data.provider,
      phonepe_merchant_id: data.phonepe_merchant_id || '',
      phonepe_salt_key: SALT_KEPT,
      phonepe_salt_index: String(data.phonepe_salt_index || 1),
      phonepe_environment: data.phonepe_environment || 'sandbox',
    });
    setSaltDirty(false);
  }, [data]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSavedAt(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const payload = {
      provider: form.provider,
      phonepe_merchant_id: form.phonepe_merchant_id.trim(),
      phonepe_salt_index: Number(form.phonepe_salt_index),
      phonepe_environment: form.phonepe_environment,
    };
    // Only send the salt key if the admin actually typed a new one.
    if (saltDirty) payload.phonepe_salt_key = form.phonepe_salt_key;

    try {
      await update.mutateAsync(payload);
      setSavedAt(true);
      setSaltDirty(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save the gateway config.');
    }
  }

  const isPhonePe = form?.provider === 'phonepe';
  const saltOnFile = !!data?.salt_key_set;

  return (
    <AdminPage
      title="Payment Gateway"
      description="Choose the active payment provider and configure its credentials. Stored securely in the database."
    >
      {isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load the gateway config"
          description="Something went wrong. Please try again."
          action={
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : isLoading || !form ? (
        <div className="flex max-w-2xl flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl rounded-lg border border-line-subtle bg-bg-elevated p-6"
        >
          <Select
            label="Active gateway"
            value={form.provider}
            onChange={(e) => set('provider', e.target.value)}
            helper={
              isPhonePe
                ? 'Live PhonePe checkout. Fill in the credentials below.'
                : 'Mock simulator — safe for testing, no real money moves.'
            }
          >
            <option value="mock">Mock (test only)</option>
            <option value="phonepe">PhonePe (live)</option>
          </Select>

          {isPhonePe && (
            <div className="mt-2 grid gap-4 border-t border-line-subtle pt-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Merchant ID"
                  placeholder="PGTESTPAYUAT"
                  value={form.phonepe_merchant_id}
                  onChange={(e) => set('phonepe_merchant_id', e.target.value)}
                  helper="From your PhonePe business dashboard."
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Salt key"
                  type="password"
                  autoComplete="new-password"
                  value={saltDirty ? form.phonepe_salt_key : ''}
                  placeholder={saltOnFile ? 'Saved — type to replace' : 'Paste from the PhonePe dashboard'}
                  onChange={(e) => {
                    setSaltDirty(true);
                    set('phonepe_salt_key', e.target.value);
                  }}
                  helper="The signing secret. Encrypted at rest; never shown again after saving."
                />
              </div>

              <Select
                label="Salt index"
                value={form.phonepe_salt_index}
                onChange={(e) => set('phonepe_salt_index', e.target.value)}
                helper="Usually 1."
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </Select>

              <Select
                label="Environment"
                value={form.phonepe_environment}
                onChange={(e) => set('phonepe_environment', e.target.value)}
                helper="Use Sandbox until you go live."
              >
                <option value="sandbox">Sandbox (pre-prod)</option>
                <option value="production">Production</option>
              </Select>
            </div>
          )}

          {error && <p className="mt-3 text-xs text-danger">{error}</p>}

          <div className="mt-5 flex items-center justify-end gap-3">
            {savedAt && (
              <span className="flex items-center gap-1.5 text-xs text-success">
                <Check className="size-4" aria-hidden="true" />
                Saved
              </span>
            )}
            <Button type="submit" loading={update.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      )}
    </AdminPage>
  );
}
