import { useRef, useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  GalleryHorizontal,
  Plus,
  ChevronDown as ChevronExpand,
  Save,
  Image as ImageIcon,
  Tag,
  Type,
  Clock,
  Link as LinkIcon,
  ShieldCheck,
} from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { cn } from '@/lib/utils.js';
import { PERK_ICON_NAMES, DEFAULT_PERKS } from '@/features/hero-slides/perks.js';
import {
  useAdminHeroSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
  useReorderHeroSlides,
} from '@/features/hero-slides/hooks.js';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

// Built-in defaults used to seed editor fields when a slide's value is null,
// so the admin always sees what the storefront currently renders. Mirrors the
// null → default convention in Hero.jsx. Clearing a field to empty hides it.
const HERO_DEFAULTS = {
  eyebrow: 'Mega season sale is live',
  cta2_label: 'Browse new arrivals',
  cta2_href: '/products?sort=newest',
  countdown_label: 'Sale ends in',
};

const eff = (slide, key) => (slide[key] == null ? HERO_DEFAULTS[key] ?? '' : slide[key]);
const effPerks = (slide) => (Array.isArray(slide.perks) ? slide.perks : DEFAULT_PERKS);

const fieldLabel = 'mb-1 block text-xs font-medium text-ink-secondary';
const fieldInput = cn(
  'h-9 w-full rounded-sm border border-line-subtle bg-bg-sunken px-3 text-sm text-ink-primary',
  'placeholder:text-ink-tertiary',
  'hover:border-line-strong focus-visible:border-accent focus-visible:focus-ring',
  'transition-colors duration-200',
);
const fieldTextarea = cn(fieldInput, 'h-auto min-h-[72px] resize-y py-2 leading-normal');

function isoToDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Build an editable values object from a slide (or blank defaults). */
function valuesFromSlide(slide) {
  return {
    kind: slide?.kind ?? 'sale',
    text_theme: slide?.text_theme ?? 'light',
    alt: slide?.alt ?? '',
    eyebrow: slide ? eff(slide, 'eyebrow') : HERO_DEFAULTS.eyebrow,
    heading: slide?.heading ?? '',
    subtext: slide?.subtext ?? '',
    cta_label: slide?.cta_label ?? '',
    cta_href: slide?.cta_href ?? '',
    cta2_label: slide ? eff(slide, 'cta2_label') : HERO_DEFAULTS.cta2_label,
    cta2_href: slide ? eff(slide, 'cta2_href') : HERO_DEFAULTS.cta2_href,
    badge_text: slide?.badge_text ?? '',
    countdown_end: isoToDatetimeLocal(slide?.countdown_end),
    countdown_label: slide ? eff(slide, 'countdown_label') : HERO_DEFAULTS.countdown_label,
    perks: slide ? effPerks(slide) : [...DEFAULT_PERKS],
  };
}

/** Convert an editable values object into the PATCH/create payload.
 *  `heading/subtext/cta*` use null-for-empty (they have storefront defaults);
 *  `eyebrow/cta2/countdown_label` persist '' so the admin can hide them. */
function valuesToPayload(v) {
  return {
    kind: v.kind,
    text_theme: v.text_theme,
    alt: v.alt.trim() || null,
    heading: v.heading.trim() || null,
    subtext: v.subtext.trim() || null,
    cta_label: v.cta_label.trim() || null,
    cta_href: v.cta_href.trim() || null,
    badge_text: v.badge_text.trim() || null,
    eyebrow: v.eyebrow.trim(),
    cta2_label: v.cta2_label.trim(),
    cta2_href: v.cta2_href.trim(),
    countdown_label: v.countdown_label.trim(),
    countdown_end: datetimeLocalToIso(v.countdown_end),
    perks: v.perks
      .map((p) => ({ icon: p.icon || 'ShieldCheck', label: (p.label || '').trim() }))
      .filter((p) => p.label),
  };
}

// ---------------------------------------------------------------------------
// Perks editor
// ---------------------------------------------------------------------------

function PerksEditor({ perks, onChange }) {
  function update(i, key, val) {
    onChange(perks.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)));
  }
  return (
    <div className="flex flex-col gap-2">
      {perks.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={p.icon}
            onChange={(e) => update(i, 'icon', e.target.value)}
            aria-label="Perk icon"
            className={cn(fieldInput, 'w-36 shrink-0 appearance-none')}
          >
            {PERK_ICON_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={p.label}
            onChange={(e) => update(i, 'label', e.target.value)}
            placeholder="e.g. Free Delivery"
            className={fieldInput}
          />
          <button
            type="button"
            aria-label="Remove perk"
            onClick={() => onChange(perks.filter((_, idx) => idx !== i))}
            className="grid size-9 shrink-0 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-danger/10 hover:text-danger focus-visible:focus-ring"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...perks, { icon: 'ShieldCheck', label: '' }])}
        className="flex items-center gap-1.5 self-start rounded-sm px-3 py-1.5 text-sm text-accent transition-colors hover:bg-accent/10 focus-visible:focus-ring"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add trust feature
      </button>
      <p className="text-xs text-ink-tertiary">
        Shown on sale slides. Remove all to hide them on this slide.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared content fields (used by both create form and per-slide editor)
// ---------------------------------------------------------------------------

function SlideFields({ values, set }) {
  const isSale = values.kind === 'sale';
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* Kind */}
      <div>
        <label className={fieldLabel}>
          <span className="inline-flex items-center gap-1.5">
            <ImageIcon className="size-3.5" aria-hidden="true" />
            Slide type
          </span>
        </label>
        <select value={values.kind} onChange={(e) => set('kind', e.target.value)} className={fieldInput}>
          <option value="sale">Sale slide (rich layout)</option>
          <option value="photo">Photo slide (full image)</option>
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
          value={values.text_theme}
          onChange={(e) => set('text_theme', e.target.value)}
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
          value={values.alt}
          onChange={(e) => set('alt', e.target.value)}
          placeholder="Describe image for screen readers"
          className={fieldInput}
        />
      </div>

      {/* Eyebrow */}
      <div className="sm:col-span-2 lg:col-span-3">
        <label className={fieldLabel}>Eyebrow / badge pill {isSale ? '' : '(sale slides only)'}</label>
        <input
          type="text"
          value={values.eyebrow}
          onChange={(e) => set('eyebrow', e.target.value)}
          placeholder='e.g. "Mega season sale is live" — leave empty to hide'
          className={fieldInput}
        />
      </div>

      {/* Heading */}
      <div className="sm:col-span-2 lg:col-span-3">
        <label className={fieldLabel}>Heading</label>
        <input
          type="text"
          value={values.heading}
          onChange={(e) => set('heading', e.target.value)}
          placeholder='e.g. "Mega Season Sale"'
          className={fieldInput}
        />
      </div>

      {/* Subtext */}
      <div className="sm:col-span-2 lg:col-span-3">
        <label className={fieldLabel}>Subtext / description</label>
        <textarea
          value={values.subtext}
          onChange={(e) => set('subtext', e.target.value)}
          placeholder="Supporting copy shown below the heading."
          className={fieldTextarea}
        />
      </div>

      {/* Primary CTA */}
      <div>
        <label className={fieldLabel}>
          <span className="inline-flex items-center gap-1.5">
            <LinkIcon className="size-3.5" aria-hidden="true" />
            Primary button label
          </span>
        </label>
        <input
          type="text"
          value={values.cta_label}
          onChange={(e) => set('cta_label', e.target.value)}
          placeholder='e.g. "Shop the sale"'
          className={fieldInput}
        />
      </div>
      <div>
        <label className={fieldLabel}>Primary button URL</label>
        <input
          type="text"
          value={values.cta_href}
          onChange={(e) => set('cta_href', e.target.value)}
          placeholder="/products or https://…"
          className={fieldInput}
        />
      </div>
      <div className="hidden lg:block" aria-hidden="true" />

      {/* Secondary CTA */}
      <div>
        <label className={fieldLabel}>Secondary button label</label>
        <input
          type="text"
          value={values.cta2_label}
          onChange={(e) => set('cta2_label', e.target.value)}
          placeholder='e.g. "Browse new arrivals" — empty to hide'
          className={fieldInput}
        />
      </div>
      <div>
        <label className={fieldLabel}>Secondary button URL</label>
        <input
          type="text"
          value={values.cta2_href}
          onChange={(e) => set('cta2_href', e.target.value)}
          placeholder="/products?sort=newest"
          className={fieldInput}
        />
      </div>
      <div className="hidden lg:block" aria-hidden="true" />

      {/* Sale settings */}
      <div className="sm:col-span-2 lg:col-span-3">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-tertiary">
          <Tag className="size-3.5" aria-hidden="true" />
          Sale settings
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={fieldLabel}>Image badge text</label>
            <input
              type="text"
              value={values.badge_text}
              onChange={(e) => set('badge_text', e.target.value)}
              placeholder='e.g. "UP TO 60% OFF"'
              className={fieldInput}
            />
          </div>
          <div>
            <label className={fieldLabel}>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                Countdown end (local)
              </span>
            </label>
            <input
              type="datetime-local"
              value={values.countdown_end}
              onChange={(e) => set('countdown_end', e.target.value)}
              className={fieldInput}
            />
          </div>
          <div>
            <label className={fieldLabel}>Countdown label</label>
            <input
              type="text"
              value={values.countdown_label}
              onChange={(e) => set('countdown_label', e.target.value)}
              placeholder='e.g. "Sale ends in" — empty to hide'
              className={fieldInput}
            />
          </div>
        </div>
      </div>

      {/* Perks */}
      <div className="sm:col-span-2 lg:col-span-3">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-tertiary">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Trust features
        </p>
        <PerksEditor perks={values.perks} onChange={(p) => set('perks', p)} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create form — image + full content in one step
// ---------------------------------------------------------------------------

function CreateSlideForm({ prominent = false }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [values, setValues] = useState(() => valuesFromSlide(null));
  const [error, setError] = useState(null);
  const create = useCreateHeroSlide();

  const set = (key, val) => setValues((v) => ({ ...v, [key]: val }));

  function reset() {
    setFile(null);
    setValues(valuesFromSlide(null));
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Select an image file.');
      return;
    }
    try {
      await create.mutateAsync({ file, ...valuesToPayload(values) });
      reset();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Create failed. Please try again.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'rounded-lg border border-line-subtle bg-bg-elevated p-5',
        prominent ? 'p-6' : 'mb-8',
      )}
    >
      <p className="mb-4 text-sm font-semibold text-ink-primary">
        {prominent ? 'Add your first slide' : 'Add a new slide'}
      </p>

      {/* Image (required) */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={fieldLabel}>Image (required)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-sm border border-line-subtle bg-bg-sunken px-3.5 py-2 text-sm text-ink-primary file:mr-3 file:rounded-sm file:border-0 file:bg-fill file:px-3 file:py-1 file:text-xs file:font-medium file:text-ink-secondary hover:border-line-strong focus-visible:focus-ring"
          />
        </div>
      </div>

      {/* Full content */}
      <SlideFields values={values} set={set} />

      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" loading={create.isPending}>
          <Plus className="size-4" aria-hidden="true" />
          Create slide
        </Button>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
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
  const [values, setValues] = useState(() => valuesFromSlide(slide));
  const [saveError, setSaveError] = useState(null);

  const set = (key, val) => setValues((v) => ({ ...v, [key]: val }));

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
    try {
      await update.mutateAsync({ id: slide.id, data: valuesToPayload(values) });
    } catch (err) {
      setSaveError(err.response?.data?.error?.message || 'Save failed. Please try again.');
    }
  }

  const anyPending = update.isPending || del.isPending || reorder.isPending;

  return (
    <div className="overflow-hidden rounded-lg border border-line-subtle bg-bg-elevated">
      {/* Collapsed row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <img
          src={slide.image_url}
          alt={slide.alt || ''}
          loading="lazy"
          className="h-[54px] w-24 shrink-0 rounded-sm bg-fill object-cover"
        />
        <span
          className={cn(
            'hidden shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide sm:inline-block',
            slide.kind === 'sale'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
              : 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
          )}
        >
          {slide.kind}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm text-ink-secondary">
          {slide.heading || slide.alt || <span className="italic text-ink-tertiary">No title</span>}
        </p>
        <span className="hidden shrink-0 text-xs tabular-nums text-ink-tertiary sm:block">
          #{slide.sort_order}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={slide.is_active}
          aria-label={slide.is_active ? 'Deactivate slide' : 'Activate slide'}
          disabled={anyPending}
          onClick={handleToggleActive}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
            'focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-40',
            slide.is_active ? 'bg-accent' : 'bg-fill-strong',
          )}
        >
          <span
            className={cn(
              'pointer-events-none block size-4 rounded-full bg-white shadow transition-transform duration-200',
              slide.is_active ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </button>
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
        <button
          type="button"
          aria-label="Delete slide"
          disabled={anyPending}
          onClick={handleDelete}
          className="grid size-8 shrink-0 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-danger/10 hover:text-danger focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-30"
        >
          <Trash2 className="size-4" />
        </button>
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

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-line-subtle bg-bg-base/40 px-4 pb-5 pt-4">
          <SlideFields values={values} set={set} />
          <div className="mt-5 flex items-center gap-3">
            <Button size="sm" onClick={handleSave} loading={update.isPending} disabled={anyPending}>
              <Save className="size-4" aria-hidden="true" />
              Save changes
            </Button>
            {update.isSuccess && !update.isPending && (
              <span className="text-xs font-medium text-success">Saved</span>
            )}
            {saveError && <span className="text-xs text-danger">{saveError}</span>}
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
          description="Create a slide to start rotating it on the homepage hero."
          action={<CreateSlideForm prominent />}
          className="py-12"
        />
      ) : (
        <>
          <CreateSlideForm />
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
