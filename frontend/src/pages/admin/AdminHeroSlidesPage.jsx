import { useRef, useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, GalleryHorizontal, Plus } from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { cn } from '@/lib/utils.js';
import {
  useAdminHeroSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
  useReorderHeroSlides,
} from '@/features/hero-slides/hooks.js';

function UploadForm({ prominent = false }) {
  const fileRef = useRef(null);
  const [alt, setAlt] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const create = useCreateHeroSlide();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Select an image file.');
      return;
    }
    try {
      await create.mutateAsync({ file, alt: alt.trim() || undefined });
      setFile(null);
      setAlt('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed. Please try again.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={prominent
        ? 'rounded-lg border border-line-subtle bg-bg-elevated p-6'
        : 'mb-8 rounded-lg border border-line-subtle bg-bg-elevated p-5'}
    >
      {prominent && (
        <p className="mb-4 text-sm font-medium text-ink-primary">Add your first slide</p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
            Image
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-sm border border-line-subtle bg-bg-sunken px-3.5 py-2.5 text-sm text-ink-primary file:mr-3 file:rounded-sm file:border-0 file:bg-fill file:px-3 file:py-1 file:text-xs file:font-medium file:text-ink-secondary hover:border-line-strong focus-visible:focus-ring"
          />
        </div>
        <div className="flex-1">
          <Input
            label="Alt text (optional)"
            placeholder="Describe the image for screen readers"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
        </div>
        <Button type="submit" loading={create.isPending} className="shrink-0 self-end mb-[1.25rem]">
          <Plus className="size-4" aria-hidden="true" />
          Add slide
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </form>
  );
}

function SlideRow({ slide, isFirst, isLast, slides, reorder }) {
  const update = useUpdateHeroSlide();
  const del = useDeleteHeroSlide();
  const [altDraft, setAltDraft] = useState(slide.alt ?? '');

  function handleAltBlur() {
    const trimmed = altDraft.trim();
    if (trimmed !== (slide.alt ?? '')) {
      update.mutate({ id: slide.id, data: { alt: trimmed } });
    }
  }

  function handleToggleActive() {
    update.mutate({ id: slide.id, data: { is_active: !slide.is_active } });
  }

  function handleDelete() {
    if (window.confirm('Delete this slide? This cannot be undone.')) {
      del.mutate(slide.id);
    }
  }

  function move(direction) {
    const ids = slides.map((s) => s.id);
    const i = ids.indexOf(slide.id);
    if (direction === 'up' && i > 0) {
      [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
    } else if (direction === 'down' && i < ids.length - 1) {
      [ids[i], ids[i + 1]] = [ids[i + 1], ids[i]];
    }
    reorder.mutate(ids);
  }

  const anyPending = update.isPending || del.isPending || reorder.isPending;

  return (
    <tr className="border-t border-line-subtle">
      <td className="px-4 py-3">
        <img
          src={slide.image_url}
          alt={slide.alt || ''}
          loading="lazy"
          className="h-[54px] w-24 rounded-sm object-cover bg-fill"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={altDraft}
          onChange={(e) => setAltDraft(e.target.value)}
          onBlur={handleAltBlur}
          placeholder="No alt text"
          className="w-full rounded-sm border border-transparent bg-transparent px-2 py-1 text-sm text-ink-primary placeholder:text-ink-tertiary hover:border-line-subtle focus:border-accent focus:bg-bg-sunken focus-visible:focus-ring"
        />
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-ink-secondary">
        {slide.sort_order}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          role="switch"
          aria-checked={slide.is_active}
          aria-label={slide.is_active ? 'Deactivate slide' : 'Activate slide'}
          disabled={anyPending}
          onClick={handleToggleActive}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
            'focus-visible:focus-ring disabled:opacity-40 disabled:pointer-events-none',
            slide.is_active ? 'bg-accent' : 'bg-fill-strong',
          )}
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
              slide.is_active ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label="Move slide up"
            disabled={isFirst || anyPending}
            onClick={() => move('up')}
            className="grid size-9 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-fill hover:text-ink-primary focus-visible:focus-ring disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Move slide down"
            disabled={isLast || anyPending}
            onClick={() => move('down')}
            className="grid size-9 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-fill hover:text-ink-primary focus-visible:focus-ring disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronDown className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Delete slide"
            disabled={anyPending}
            onClick={handleDelete}
            className="grid size-9 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-danger/10 hover:text-danger focus-visible:focus-ring disabled:opacity-30 disabled:pointer-events-none"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminHeroSlidesPage() {
  const { data: slides = [], isLoading, isError, refetch } = useAdminHeroSlides();
  const reorder = useReorderHeroSlides();

  return (
    <AdminPage
      title="Hero slides"
      description={
        isLoading
          ? 'Loading…'
          : `${slides.length} slide${slides.length === 1 ? '' : 's'} — active ones rotate on the homepage.`
      }
    >
      {isError ? (
        <EmptyState
          icon={GalleryHorizontal}
          title="Couldn't load slides"
          description="Something went wrong. Please try again."
          action={
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : slides.length === 0 ? (
        <EmptyState
          icon={GalleryHorizontal}
          title="No hero slides yet"
          description="Upload images to start rotating them on the homepage hero."
          action={<UploadForm prominent />}
          className="py-12"
        />
      ) : (
        <>
          <UploadForm />
          <div className="overflow-x-auto rounded-lg border border-line-subtle bg-bg-elevated">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-tertiary">
                  <th className="px-4 py-3 font-medium">Image</th>
                  <th className="px-4 py-3 font-medium">Alt text</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slides.map((slide, i) => (
                  <SlideRow
                    key={slide.id}
                    slide={slide}
                    slides={slides}
                    isFirst={i === 0}
                    isLast={i === slides.length - 1}
                    reorder={reorder}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminPage>
  );
}
