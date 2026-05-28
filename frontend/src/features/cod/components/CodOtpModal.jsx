import { useEffect, useState } from 'react';
import { Smartphone, AlertTriangle, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { useSendCodOtp, useVerifyCodOtp } from '@/features/cod/hooks.js';

/**
 * OTP verification step before a COD order is placed.
 *
 * Flow:
 *   - Mounts → auto-fires `sendOtp(phone)`. Shows the masked phone the
 *     server returned (so a typo'd input doesn't get verified silently).
 *   - Customer types a 6-digit code → on Submit we call `verifyOtp`.
 *   - On success we call `onVerified()` and the parent re-fires checkout.
 *
 * The parent owns the phone — we don't let the customer edit it inside
 * the modal because that would change *which* OTP they're entering.
 */
export default function CodOtpModal({ phone, onVerified, onClose }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [maskedPhone, setMaskedPhone] = useState(null);
  const [coolingDown, setCoolingDown] = useState(0);
  const send = useSendCodOtp();
  const verify = useVerifyCodOtp();

  async function fire() {
    setError(null);
    try {
      const resp = await send.mutateAsync(phone);
      setMaskedPhone(resp.phone_masked);
      // Re-send cooldown so the customer doesn't spam the SMS provider.
      setCoolingDown(30);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not send OTP.');
    }
  }

  // Auto-send on mount.
  useEffect(() => {
    fire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-send countdown.
  useEffect(() => {
    if (coolingDown <= 0) return undefined;
    const t = setTimeout(() => setCoolingDown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [coolingDown]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4,8}$/.test(code.trim())) {
      setError('Enter the code from the SMS.');
      return;
    }
    try {
      await verify.mutateAsync({ phone, code: code.trim() });
      onVerified();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not verify.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center gap-2">
          <Smartphone className="size-5 text-accent" aria-hidden="true" />
          <h2 className="text-h3 text-ink-primary">Verify your phone</h2>
        </div>
        <p className="mt-1 text-xs text-ink-tertiary">
          Cash on Delivery orders need a phone verification. We sent a
          6-digit code to{' '}
          <span className="font-mono text-ink-primary">
            {maskedPhone || phone}
          </span>
          .
        </p>

        <form onSubmit={handleSubmit} className="mt-5">
          <Input
            label="Enter the 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
          />
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={fire}
              disabled={coolingDown > 0 || send.isPending}
              className="text-xs text-accent hover:underline disabled:opacity-50"
            >
              {coolingDown > 0 ? `Resend in ${coolingDown}s` : 'Resend code'}
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={verify.isPending}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" loading={verify.isPending}>
                <Check className="size-4" /> Verify
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
