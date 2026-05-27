import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Textarea } from '@/components/ui/Textarea.jsx';
import { StarRating } from './StarRating.jsx';
import { useCreateReview } from './hooks.js';

export function WriteReviewForm({ productId, onCancel, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);
  const create = useCreateReview();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError('Pick a star rating.');
      return;
    }
    try {
      await create.mutateAsync({
        productId,
        data: { rating, title: title.trim() || null, body: body.trim() || null },
      });
      onSubmitted?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not submit your review.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-lg border border-line-subtle bg-bg-elevated p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-h3 text-ink-primary">Write your review</h3>
        <button
          type="button"
          aria-label="Cancel"
          onClick={onCancel}
          className="grid size-9 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
        >
          <X className="size-4" />
        </button>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-secondary">Overall rating</p>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div className="mt-4">
        <Input
          label="Headline (optional)"
          placeholder="Sums up your experience in one line"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
        />
      </div>

      <div className="mt-1">
        <Textarea
          label="Your review (optional)"
          placeholder="What did you like or dislike? Was it as described?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
        />
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={create.isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending}>
          Submit review
        </Button>
      </div>
    </form>
  );
}
