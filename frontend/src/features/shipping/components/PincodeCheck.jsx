import { useState, useEffect } from 'react';
import { MapPin, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { useServiceability } from '@/features/shipping/hooks.js';
import { readSavedPincode, saveSavedPincode } from '@/features/shipping/storage.js';

/**
 * Pincode serviceability widget for the cart / checkout page.
 *
 * Behavior:
 * - The submitted pincode (not the live input) drives the query, so the
 *   carrier isn't hit on every keystroke.
 * - On a successful check we store the pincode in localStorage and call
 *   `onResult(result)` so the parent can disable checkout when the area
 *   isn't serviceable.
 */
export default function PincodeCheck({ onResult }) {
  const [draft, setDraft] = useState(readSavedPincode);
  const [submitted, setSubmitted] = useState(readSavedPincode);
  const [error, setError] = useState(null);
  const { data, isFetching, isError, error: queryError } =
    useServiceability(submitted);

  // Bubble the result up so the parent can gate the checkout button. Effect
  // (not inline) so a parent that does setState in onResult doesn't loop.
  useEffect(() => {
    if (data && onResult) onResult(data);
  }, [data, onResult]);

  function handleCheck(e) {
    e.preventDefault();
    setError(null);
    const clean = draft.trim();
    if (!/^\d{6}$/.test(clean)) {
      setError('Enter a 6-digit Indian pincode.');
      return;
    }
    saveSavedPincode(clean);
    setSubmitted(clean);
  }

  const result = data;
  const showServerError = isError && submitted;
  const serverMessage =
    queryError?.response?.data?.error?.message ||
    'Could not check that pincode right now.';

  return (
    <div className="mt-5 rounded-sm border border-line-subtle bg-bg-sunken p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
        <MapPin className="size-3.5" aria-hidden="true" /> Check delivery
      </div>
      <form onSubmit={handleCheck} className="mt-2 flex items-start gap-2">
        <div className="flex-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            error={error}
            aria-label="Delivery pincode"
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          loading={isFetching}
          className="mt-0.5"
        >
          Check
        </Button>
      </form>

      {isFetching && !result && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-tertiary">
          <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Checking…
        </p>
      )}

      {showServerError && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-danger">
          <AlertTriangle className="mt-0.5 size-3" aria-hidden="true" />
          {serverMessage}
        </p>
      )}

      {result && result.serviceable && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-success">
          <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span className="text-ink-secondary">
            <span className="font-medium text-success">Delivers to {result.pincode}.</span>
            {result.eta_days_min && (
              <>
                {' '}Arrives in {result.eta_days_min}
                {result.eta_days_max && result.eta_days_max !== result.eta_days_min
                  ? `–${result.eta_days_max}`
                  : ''}{' '}
                days.
              </>
            )}
            {result.cod_available && (
              <span className="ml-1 rounded-sm bg-success/10 px-1.5 py-0.5 font-mono text-[10px] text-success">
                COD
              </span>
            )}
          </span>
        </div>
      )}

      {result && !result.serviceable && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-danger">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium">Sorry — we don&apos;t deliver to {result.pincode}.</span>{' '}
            {result.remark}
          </span>
        </p>
      )}
    </div>
  );
}
