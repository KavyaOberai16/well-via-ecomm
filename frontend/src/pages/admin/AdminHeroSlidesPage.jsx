import { useRef, useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  GalleryHorizontal,
  Plus,
  ChevronDown as ChevronExpand,
  Save,
  Image,
  Tag,
  Type,
  Clock,
  Link as LinkIcon,
} from 'lucide-react';
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert an ISO datetime string (from the server) to the value expected by
 * <input type="datetime-local"> (YYYY-MM-DDTHH:mm in LOCAL time).
 */
function isoToDatetimeLocal(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    // Shift to local timezone by using local getters
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

/**
 * Convert a datetime-local value back to an ISO string (UTC).
 * Returns null when the value is empty.
 */
function datetimeLocalToIso(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Upload form (unchanged functionality, unchanged layout)
// ---------------------------------------------------------------------------

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
      className={
        prominent
          ? 'rounded-lg border border-line-subtle bg-bg-elevated p-6'
          : 'mb-8 rounded-lg border border-line-subtle bg-bg-elevated p-5'
      }
    >
      {prominent && (
        <p className="mb-4 text-sm font-medium text-ink-primary">Add your first slide</p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-ink-secondary">Image</label>
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
        <Button type="submit" loading={create.isPending} className="mb-[1.25rem] shrink-0 self-end">
          <Plus className="size-4" aria-hidden="true" />
          Add slide
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Per-slide editor card
// ---------------------------------------------------------------------------

function SlideCard({ slide, isFirst, isLast, slides, reorder }) {
  const update = useUpdateHeroSlide();
  const del = useDeleteHeroSlide();

  const [expanded, setExpanded] = useState(false);

  // Field state — initialised from the slide prop
  const [kind, setKind] = useState(slide.kind ?? 'photo');
  const [altDraft, setAltDraft] = useState(slide.alt ?? '');
  const [heading, setHeading] = useState(slide.heading ?? '');
  const [subtext, setSubtext] = useState(slide.subtext ?? '');
  const [badgeText, setBadgeText] = useState(slide.badge_text ?? '');
  const [countdownEnd, setCountdownEnd] = useState(isoToDatetimeLocal(slide.countdown_end));
  const [ctaLabel, setCtaLabel] = useState(slide.cta_label ?? '');
  const [ctaHref, setCtaHref] = useState(slide.cta_href ?? '');
  const [textTheme, setTextTheme] = useState(slide.text_theme ?? 'light');

  const [saveError, setSaveError] = useState(null);

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

  async function handleSave() {
    setSaveError(null);
    const data = {
      kind,
      alt: altDraft.trim() || null,
      heading: heading.trim() || null,
      subtext: subtext.trim() || null,
      badge_text: badgeText.trim() || null,
      countdown_end: datetimeLocalToIso(countdownEnd),
      cta_label: ctaLabel.trim() || null,
      cta_href: ctaHref.trim() || null,
      text_theme: textTheme,
    };
    try {
      await update.mutateAsync({ id: slide.id, data });
    } catch (err) {
      setSaveError(err.response?.data?.error?.message || 'Save failed. Please try again.');
    }
  }

  const anyPending = update.isPending || del.isPending || reorder.isPending;

  // Label classes shared by inline labels in the editor
  const fieldLabel = 'mb-1 block text-xs font-medium text-ink-secondary';
  const fieldInput = cn(
    'h-9 w-full rounded-sm border border-line-subtle bg-bg-sunken px-3 text-sm text-ink-primary',
    'placeholder:text-ink-tertiary',
    'hover:border-line-strong focus-visible:border-accent focus-visible:focus-ring',
    'transition-colors duration-200',
  );
  const fieldTextarea = cn(
    fieldInput,
    'h-auto min-h-[72px] resize-y py-2 leading-normal',
  );

  return (
    <div className="rounded-lg border border-line-subtle bg-bg-elevated overflow-hidden">
      {/* --- Collapsed row --- */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Thumbnail */}
        <img
          src={slide.image_url}
          alt={slide.alt || ''}
          loading="lazy"
          className="h-[54px] w-24 shrink-0 rounded-sm object-cover bg-fill"
        />

        {/* Kind badge */}
        <span
          className={cn(
            'hidden shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide sm:inline-block',
            kind === 'sale'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
              : 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
          )}
        >
          {kind}
        </span>

        {/* Heading preview */}
        <p className="min-w-0 flex-1 truncate text-sm text-ink-secondary">
          {slide.heading || slide.alt || (
            <span className="text-ink-tertiary italic">No title</span>
          )}
        </p>

        {/* Sort order */}
        <span className="hidden shrink-0 text-xs tabular-nums text-ink-tertiary sm:block">
          #{slide.sort_order}
        </span>

        {/* Active toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={slide.is_active}
          aria-label={slide.is_active ? 'Deactivate slide' : 'Activate slide'}
          disabled={anyPending}
          onClick={handleToggleActive}
          className={cn(
            'relative shrink-0 inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
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

        {/* Move up/down */}
        <button
          type="button"
          aria-label="Move slide up"
          disabled={isFirst || anyPending}
          onClick={() => move('up')}
          className="grid size-8 shrink-0 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-fill hover:text-ink-primary focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Move slide down"
          disabled={isLast || anyPending}
          onClick={() => move('down')}
          className="grid size-8 shrink-0 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-fill hover:text-ink-primary focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronDown className="size-4" />
        </button>

        {/* Delete */}
        <button
          type="button"
          aria-label="Delete slide"
          disabled={anyPending}
          onClick={handleDelete}
          className="grid size-8 shrink-0 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-danger/10 hover:text-danger focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-30"
        >
          <Trash2 className="size-4" />
        </button>

        {/* Expand / collapse editor */}
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse editor' : 'Expand editor'}
          onClick={() => setExpanded((v) => !v)}
          className="grid size-8 shrink-0 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
        >
          <ChevronExpand
            className={cn('size-4 transition-transform duration-200', expanded && 'rotate-180')}
          />
        </button>
      </div>

      {/* --- Expanded editor --- */}
      {expanded && (
        <div className="border-t border-line-subtle bg-bg-base/40 px-4 pb-5 pt-4">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Kind */}
            <div>
              <label className={fieldLabel}>
                <span className="inline-flex items-center gap-1.5">
                  <Image className="size-3.5" aria-hidden="true" />
                  Slide type
                </span>
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className={fieldInput}
              >
                <option value="photo">Photo slide</option>
                <option value="sale">Sale slide</option>
              </select>
            </div>

            {/* Text theme */}
            <div>
              <label className={fieldLabel}>
                <span className="inline-flex items-center gap-1.5">
                  <Type className="size-3.5" aria-hidden="true" />
                  Text theme
                </span>
              </label>
              <select
                value={textTheme}
                onChange={(e) => setTextTheme(e.target.value)}
                className={fieldInput}
              >
                <option value="light">Light text (over dark image)</option>
                <option value="dark">Dark text (over light image)</option>
              </select>
            </div>

            {/* Alt text */}
            <div>
              <label className={fieldLabel}>Alt text</label>
              <input
                type="text"
                value={altDraft}
                onChange={(e) => setAltDraft(e.target.value)}
                placeholder="Describe image for screen readers"
                className={fieldInput}
              />
            </div>

            {/* Heading — full width */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={fieldLabel}>Heading</label>
              <input
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder='e.g. "Shopping, refined to a feeling."'
                className={fieldInput}
              />
            </div>

            {/* Subtext — full width */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={fieldLabel}>Subtext / description</label>
              <textarea
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
                placeholder="Supporting copy shown below the heading."
                className={fieldTextarea}
              />
            </div>

            {/* CTA label */}
            <div>
              <label className={fieldLabel}>
                <span className="inline-flex items-center gap-1.5">
                  <LinkIcon className="size-3.5" aria-hidden="true" />
                  CTA button label
                </span>
              </label>
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder='e.g. "Shop the collection"'
                className={fieldInput}
              />
            </div>

            {/* CTA href */}
            <div>
              <label className={fieldLabel}>CTA button URL</label>
              <input
                type="text"
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
                placeholder='/products or https://…'
                className={fieldInput}
              />
            </div>

            {/* Spacer on lg to keep sale settings on new row */}
            <div className="hidden lg:block" aria-hidden="true" />

            {/* Sale settings group */}
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-tertiary">
                <Tag className="size-3.5" aria-hidden="true" />
                Sale settings
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Badge text */}
                <div>
                  <label className={fieldLabel}>Badge text</label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder='e.g. "UP TO 60% OFF"'
                    className={fieldInput}
                  />
                </div>

                {/* Countdown end */}
                <div>
                  <label className={fieldLabel}>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden="true" />
                      Countdown end (local time)
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    value={countdownEnd}
                    onChange={(e) => setCountdownEnd(e.target.value)}
                    className={fieldInput}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save row */}
          <div className="mt-5 flex items-center gap-3">
            <Button
              size="sm"
              onClick={handleSave}
              loading={update.isPending}
              disabled={anyPending}
            >
              <Save className="size-4" aria-hidden="true" />
              Save changes
            </Button>
            {update.isSuccess && !update.isPending && (
              <span className="text-xs font-medium text-success">Saved</span>
            )}
            {saveError && (
              <span className="text-xs text-danger">{saveError}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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
          <div className="flex flex-col gap-3">
            {slides.map((slide, i) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                slides={slides}
                isFirst={i === 0}
                isLast={i === slides.length - 1}
                reorder={reorder}
              />
            ))}
          </div>
        </>
      )}
    </AdminPage>
  );
}
