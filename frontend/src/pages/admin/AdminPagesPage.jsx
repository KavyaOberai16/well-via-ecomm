import { useEffect, useState } from 'react';
import { Check, AlertTriangle, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Textarea } from '@/components/ui/Textarea.jsx';
import { Card, CardBody } from '@/components/ui/Card.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { cn } from '@/lib/utils.js';
import { useSitePages, useUpdateSitePages } from '@/features/site-pages/hooks.js';
import { SITE_PAGES_DEFAULTS, PAGE_ICON_NAMES } from '@/features/site-pages/defaults.js';

// ---------------------------------------------------------------------------
// Reusable primitives (shared visual language with AdminFooterPage)
// ---------------------------------------------------------------------------

const inputCls =
  'h-9 w-full rounded-sm border border-line-subtle bg-bg-elevated px-3 text-sm text-ink-primary placeholder:text-ink-tertiary hover:border-line-strong focus-visible:border-accent focus-visible:focus-ring transition-colors';

function SectionCard({ title, description, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left focus-visible:focus-ring"
      >
        <div>
          <p className="font-semibold text-ink-primary">{title}</p>
          {description && <p className="mt-0.5 text-xs text-ink-tertiary">{description}</p>}
        </div>
        {open ? (
          <ChevronUp className="size-4 text-ink-tertiary" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-4 text-ink-tertiary" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div className="border-t border-line-subtle">
          <CardBody>{children}</CardBody>
        </div>
      )}
    </Card>
  );
}

function FieldLabel({ children }) {
  return <label className="mb-1.5 block text-xs font-medium text-ink-secondary">{children}</label>;
}

function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 self-start rounded-sm px-3 py-1.5 text-sm text-accent hover:bg-accent/10 focus-visible:focus-ring transition-colors"
    >
      <Plus className="size-4" aria-hidden="true" />
      {children}
    </button>
  );
}

function RemoveButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove"
      className="grid size-9 shrink-0 place-items-center rounded-sm text-ink-tertiary hover:bg-danger/10 hover:text-danger focus-visible:focus-ring transition-colors"
    >
      <Trash2 className="size-4" aria-hidden="true" />
    </button>
  );
}

/** A list of plain strings with add/remove. */
function StringList({ items = [], onChange, placeholder = 'Enter value', addLabel = 'Add item' }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => onChange(items.map((v, idx) => (idx === i ? e.target.value : v)))}
            placeholder={placeholder}
            className={inputCls}
          />
          <RemoveButton onClick={() => onChange(items.filter((_, idx) => idx !== i))} />
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, ''])}>{addLabel}</AddButton>
    </div>
  );
}

/**
 * Generic editor for a list of objects.
 *
 * `fields` describes each editable property:
 *   { key, label, type: 'text'|'textarea'|'icon'|'lines', placeholder, full }
 */
function ObjectList({ items = [], onChange, fields, template, addLabel }) {
  function updateRow(i, key, val) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));
  }
  function removeRow(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="relative rounded-sm border border-line-subtle bg-bg-sunken p-3 pr-12">
          <div className="absolute right-2 top-2">
            <RemoveButton onClick={() => removeRow(i)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={cn(f.full || f.type === 'textarea' || f.type === 'lines' ? 'sm:col-span-2' : '')}>
                <FieldLabel>{f.label}</FieldLabel>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={f.rows || 3}
                    value={item[f.key] ?? ''}
                    onChange={(e) => updateRow(i, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={cn(inputCls, 'h-auto resize-y py-2')}
                  />
                ) : f.type === 'icon' ? (
                  <select
                    value={item[f.key] ?? ''}
                    onChange={(e) => updateRow(i, f.key, e.target.value)}
                    className={cn(inputCls, 'appearance-none')}
                  >
                    {PAGE_ICON_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'lines' ? (
                  <StringList
                    items={item[f.key] || []}
                    onChange={(val) => updateRow(i, f.key, val)}
                    placeholder={f.placeholder}
                    addLabel={f.addLabel || 'Add line'}
                  />
                ) : (
                  <input
                    type="text"
                    value={item[f.key] ?? ''}
                    onChange={(e) => updateRow(i, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={inputCls}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, { ...template }])}>{addLabel}</AddButton>
    </div>
  );
}

function HeroEditor({ hero, onChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Eyebrow"
        value={hero.eyebrow}
        onChange={(e) => onChange({ ...hero, eyebrow: e.target.value })}
        placeholder="Our Story"
      />
      <Input
        label="Title"
        value={hero.title}
        onChange={(e) => onChange({ ...hero, title: e.target.value })}
        placeholder="Page headline"
      />
      <div className="sm:col-span-2">
        <Textarea
          label="Subtitle"
          rows={2}
          value={hero.subtitle}
          onChange={(e) => onChange({ ...hero, subtitle: e.target.value })}
        />
      </div>
    </div>
  );
}

function ProseEditor({ value, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Heading"
        value={value.heading}
        onChange={(e) => onChange({ ...value, heading: e.target.value })}
      />
      <Textarea
        label="Body"
        rows={5}
        value={value.body}
        onChange={(e) => onChange({ ...value, body: e.target.value })}
        helper="Separate paragraphs with a blank line."
      />
    </div>
  );
}

function EnabledToggle({ enabled, onChange }) {
  return (
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={enabled !== false}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded-sm border border-line-subtle bg-bg-elevated text-accent focus-visible:focus-ring"
      />
      <span className="text-sm font-medium text-ink-primary">Page published</span>
      <span className="text-xs text-ink-tertiary">When off, visitors see an "unavailable" message.</span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Per-page editors
// ---------------------------------------------------------------------------

function AboutEditor({ page, set }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Header" description="Eyebrow, title and subtitle.">
        <EnabledToggle enabled={page.enabled} onChange={(v) => set('enabled', v)} />
        <div className="mt-4">
          <HeroEditor hero={page.hero} onChange={(v) => set('hero', v)} />
        </div>
      </SectionCard>
      <SectionCard title="Story paragraphs" defaultOpen={false}>
        <StringList items={page.intro} onChange={(v) => set('intro', v)} placeholder="A paragraph of your story" addLabel="Add paragraph" />
      </SectionCard>
      <SectionCard title="Stats" description="Headline numbers." defaultOpen={false}>
        <ObjectList
          items={page.stats}
          onChange={(v) => set('stats', v)}
          fields={[
            { key: 'value', label: 'Value', placeholder: '10M+' },
            { key: 'label', label: 'Label', placeholder: 'Happy customers' },
          ]}
          template={{ value: '', label: '' }}
          addLabel="Add stat"
        />
      </SectionCard>
      <SectionCard title="Values" description="Icon + title + text cards." defaultOpen={false}>
        <ObjectList
          items={page.values}
          onChange={(v) => set('values', v)}
          fields={[
            { key: 'icon', label: 'Icon', type: 'icon' },
            { key: 'title', label: 'Title', placeholder: 'Customer obsessed' },
            { key: 'text', label: 'Text', type: 'textarea', rows: 2 },
          ]}
          template={{ icon: 'Sparkles', title: '', text: '' }}
          addLabel="Add value"
        />
      </SectionCard>
      <SectionCard title="Mission" defaultOpen={false}>
        <ProseEditor value={page.mission} onChange={(v) => set('mission', v)} />
      </SectionCard>
    </div>
  );
}

function ContactEditor({ page, set }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Header">
        <EnabledToggle enabled={page.enabled} onChange={(v) => set('enabled', v)} />
        <div className="mt-4">
          <HeroEditor hero={page.hero} onChange={(v) => set('hero', v)} />
        </div>
        <div className="mt-4">
          <Textarea label="Intro" rows={2} value={page.intro} onChange={(e) => set('intro', e.target.value)} />
        </div>
      </SectionCard>
      <SectionCard title="Contact methods" description="Email, phone, chat, address cards.">
        <ObjectList
          items={page.methods}
          onChange={(v) => set('methods', v)}
          fields={[
            { key: 'icon', label: 'Icon', type: 'icon' },
            { key: 'title', label: 'Title', placeholder: 'Email us' },
            { key: 'detail', label: 'Detail', placeholder: 'support@lumen.com' },
            { key: 'href', label: 'Link (mailto:/tel:/https:)', placeholder: 'mailto:support@lumen.com' },
          ]}
          template={{ icon: 'Mail', title: '', detail: '', href: '' }}
          addLabel="Add method"
        />
      </SectionCard>
      <SectionCard title="Enquiry form" description="Copy for the on-page contact form.">
        <div className="grid gap-4">
          <Input label="Heading" value={page.form.heading} onChange={(e) => set('form', { ...page.form, heading: e.target.value })} />
          <Input label="Note" value={page.form.note} onChange={(e) => set('form', { ...page.form, note: e.target.value })} />
          <Input label="Success message" value={page.form.success} onChange={(e) => set('form', { ...page.form, success: e.target.value })} />
        </div>
      </SectionCard>
      <SectionCard title="Offices" defaultOpen={false}>
        <ObjectList
          items={page.offices}
          onChange={(v) => set('offices', v)}
          fields={[
            { key: 'city', label: 'City / label', placeholder: 'Bengaluru (HQ)' },
            { key: 'lines', label: 'Address lines', type: 'lines', placeholder: 'Address line' },
          ]}
          template={{ city: '', lines: [] }}
          addLabel="Add office"
        />
      </SectionCard>
    </div>
  );
}

function CareersEditor({ page, set }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Header">
        <EnabledToggle enabled={page.enabled} onChange={(v) => set('enabled', v)} />
        <div className="mt-4">
          <HeroEditor hero={page.hero} onChange={(v) => set('hero', v)} />
        </div>
        <div className="mt-4">
          <Textarea label="Intro" rows={2} value={page.intro} onChange={(e) => set('intro', e.target.value)} />
        </div>
      </SectionCard>
      <SectionCard title="Perks">
        <ObjectList
          items={page.perks}
          onChange={(v) => set('perks', v)}
          fields={[
            { key: 'icon', label: 'Icon', type: 'icon' },
            { key: 'title', label: 'Title', placeholder: 'People first' },
            { key: 'text', label: 'Text', type: 'textarea', rows: 2 },
          ]}
          template={{ icon: 'Gift', title: '', text: '' }}
          addLabel="Add perk"
        />
      </SectionCard>
      <SectionCard title="Open roles">
        <ObjectList
          items={page.openings}
          onChange={(v) => set('openings', v)}
          fields={[
            { key: 'title', label: 'Role title', placeholder: 'Senior Frontend Engineer' },
            { key: 'department', label: 'Department', placeholder: 'Engineering' },
            { key: 'location', label: 'Location', placeholder: 'Bengaluru / Remote' },
            { key: 'type', label: 'Type', placeholder: 'Full-time' },
            { key: 'url', label: 'Apply link', placeholder: 'mailto:careers@lumen.com', full: true },
          ]}
          template={{ title: '', department: '', location: '', type: 'Full-time', url: '' }}
          addLabel="Add role"
        />
      </SectionCard>
      <SectionCard title="Culture" defaultOpen={false}>
        <ProseEditor value={page.culture} onChange={(v) => set('culture', v)} />
      </SectionCard>
    </div>
  );
}

function StoriesEditor({ page, set }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Header">
        <EnabledToggle enabled={page.enabled} onChange={(v) => set('enabled', v)} />
        <div className="mt-4">
          <HeroEditor hero={page.hero} onChange={(v) => set('hero', v)} />
        </div>
        <div className="mt-4">
          <Textarea label="Intro" rows={2} value={page.intro} onChange={(e) => set('intro', e.target.value)} />
        </div>
      </SectionCard>
      <SectionCard title="Posts">
        <ObjectList
          items={page.posts}
          onChange={(v) => set('posts', v)}
          fields={[
            { key: 'title', label: 'Title', placeholder: 'Story title', full: true },
            { key: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 2 },
            { key: 'category', label: 'Category', placeholder: 'People' },
            { key: 'date', label: 'Date (YYYY-MM-DD)', placeholder: '2026-05-12' },
            { key: 'image', label: 'Image URL', placeholder: 'https://…' },
            { key: 'url', label: 'Article link', placeholder: 'https://…' },
          ]}
          template={{ title: '', excerpt: '', category: '', date: '', image: '', url: '' }}
          addLabel="Add post"
        />
      </SectionCard>
    </div>
  );
}

function PressEditor({ page, set }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Header">
        <EnabledToggle enabled={page.enabled} onChange={(v) => set('enabled', v)} />
        <div className="mt-4">
          <HeroEditor hero={page.hero} onChange={(v) => set('hero', v)} />
        </div>
        <div className="mt-4">
          <Textarea label="Intro" rows={2} value={page.intro} onChange={(e) => set('intro', e.target.value)} />
        </div>
      </SectionCard>
      <SectionCard title="Releases & coverage">
        <ObjectList
          items={page.releases}
          onChange={(v) => set('releases', v)}
          fields={[
            { key: 'title', label: 'Title', placeholder: 'Headline', full: true },
            { key: 'date', label: 'Date (YYYY-MM-DD)', placeholder: '2026-05-20' },
            { key: 'source', label: 'Source', placeholder: 'The Economic Times' },
            { key: 'url', label: 'Link', placeholder: 'https://…', full: true },
          ]}
          template={{ date: '', title: '', source: '', url: '' }}
          addLabel="Add release"
        />
      </SectionCard>
      <SectionCard title="Media contact & kit" defaultOpen={false}>
        <div className="grid gap-4">
          <Input label="Heading" value={page.contact.heading} onChange={(e) => set('contact', { ...page.contact, heading: e.target.value })} />
          <Input label="Email" value={page.contact.email} onChange={(e) => set('contact', { ...page.contact, email: e.target.value })} />
          <Input label="Phone" value={page.contact.phone} onChange={(e) => set('contact', { ...page.contact, phone: e.target.value })} />
          <Input label="Media kit URL" value={page.kit_url} onChange={(e) => set('kit_url', e.target.value)} helper="Leave blank to hide the media-kit card." />
        </div>
      </SectionCard>
    </div>
  );
}

function CorporateEditor({ page, set }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Header">
        <EnabledToggle enabled={page.enabled} onChange={(v) => set('enabled', v)} />
        <div className="mt-4">
          <HeroEditor hero={page.hero} onChange={(v) => set('hero', v)} />
        </div>
      </SectionCard>
      <SectionCard title="Content sections" description="Heading + body blocks.">
        <ObjectList
          items={page.sections}
          onChange={(v) => set('sections', v)}
          fields={[
            { key: 'heading', label: 'Heading', placeholder: 'Company overview', full: true },
            { key: 'body', label: 'Body', type: 'textarea', rows: 4 },
          ]}
          template={{ heading: '', body: '' }}
          addLabel="Add section"
        />
      </SectionCard>
      <SectionCard title="Leadership" defaultOpen={false}>
        <ObjectList
          items={page.leadership}
          onChange={(v) => set('leadership', v)}
          fields={[
            { key: 'name', label: 'Name', placeholder: 'A. Sharma' },
            { key: 'title', label: 'Title', placeholder: 'Chief Executive Officer' },
            { key: 'image', label: 'Photo URL', placeholder: 'https://…', full: true },
          ]}
          template={{ name: '', title: '', image: '' }}
          addLabel="Add leader"
        />
      </SectionCard>
      <SectionCard title="Registered entity" defaultOpen={false}>
        <div className="flex flex-col gap-4">
          <Input label="Legal name" value={page.entity.name} onChange={(e) => set('entity', { ...page.entity, name: e.target.value })} />
          <Input label="CIN" value={page.entity.cin} onChange={(e) => set('entity', { ...page.entity, cin: e.target.value })} />
          <div>
            <p className="mb-2 text-sm font-medium text-ink-secondary">Registered office lines</p>
            <StringList
              items={page.entity.address_lines}
              onChange={(v) => set('entity', { ...page.entity, address_lines: v })}
              placeholder="Address line"
              addLabel="Add line"
            />
          </div>
          <Input label="Email" value={page.entity.email} onChange={(e) => set('entity', { ...page.entity, email: e.target.value })} />
          <Input label="Phone" value={page.entity.phone} onChange={(e) => set('entity', { ...page.entity, phone: e.target.value })} />
        </div>
      </SectionCard>
      <SectionCard title="Documents" description="Downloadable / linked documents." defaultOpen={false}>
        <ObjectList
          items={page.downloads}
          onChange={(v) => set('downloads', v)}
          fields={[
            { key: 'label', label: 'Label', placeholder: 'Terms of Use' },
            { key: 'url', label: 'URL (/internal or https:)', placeholder: '/terms' },
          ]}
          template={{ label: '', url: '' }}
          addLabel="Add document"
        />
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page tabs
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'about', label: 'About Us', path: '/about', Editor: AboutEditor },
  { key: 'contact', label: 'Contact Us', path: '/contact', Editor: ContactEditor },
  { key: 'careers', label: 'Careers', path: '/careers', Editor: CareersEditor },
  { key: 'stories', label: 'Lumen Stories', path: '/stories', Editor: StoriesEditor },
  { key: 'press', label: 'Press', path: '/press', Editor: PressEditor },
  { key: 'corporate', label: 'Corporate Information', path: '/corporate', Editor: CorporateEditor },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminPagesPage() {
  const { data, isLoading, isError, refetch } = useSitePages();
  const update = useUpdateSitePages();

  const [draft, setDraft] = useState(null);
  const [active, setActive] = useState('about');
  const [saveError, setSaveError] = useState(null);
  const [savedAt, setSavedAt] = useState(false);

  useEffect(() => {
    if (draft !== null) return; // don't clobber edits on background refetch
    const source = data ?? SITE_PAGES_DEFAULTS;
    setDraft(JSON.parse(JSON.stringify(source)));
  }, [data, draft]);

  function setField(pageKey, key, value) {
    setDraft((d) => ({ ...d, [pageKey]: { ...d[pageKey], [key]: value } }));
    setSavedAt(false);
  }

  async function handleSave() {
    setSaveError(null);
    try {
      await update.mutateAsync(draft);
      setSavedAt(true);
      setTimeout(() => setSavedAt(false), 3000);
    } catch (err) {
      setSaveError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.detail ||
          'Could not save pages. Please try again.',
      );
    }
  }

  if (isLoading && !draft) {
    return (
      <AdminPage title="Company Pages" description="Loading…">
        <div className="flex max-w-3xl flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </AdminPage>
    );
  }

  if (isError && !draft) {
    return (
      <AdminPage title="Company Pages" description="Storefront company pages.">
        <div className="flex items-start gap-3 rounded-sm border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Could not load company pages</p>
            <p className="mt-0.5 text-xs opacity-80">Showing defaults. Save to persist your changes.</p>
            <button type="button" onClick={() => refetch()} className="mt-2 text-xs underline hover:no-underline focus-visible:focus-ring">
              Retry
            </button>
          </div>
        </div>
      </AdminPage>
    );
  }

  if (!draft) return null;

  const activeTab = TABS.find((t) => t.key === active) || TABS[0];
  const ActiveEditor = activeTab.Editor;

  return (
    <AdminPage
      title="Company Pages"
      description="Manage the About, Contact, Careers, Stories, Press and Corporate pages linked from the footer. Changes go live immediately after saving."
    >
      {/* Sticky save toolbar */}
      <div className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-between gap-4 border-b border-line-subtle bg-bg-elevated/95 px-6 py-3 backdrop-blur">
        <p className="text-sm text-ink-secondary">
          Editing <span className="font-medium text-ink-primary">{activeTab.label}</span>
          {' · '}
          <a href={activeTab.path} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            view live ↗
          </a>
        </p>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="flex items-center gap-1.5 text-xs text-success">
              <Check className="size-4" aria-hidden="true" />
              Saved
            </span>
          )}
          {saveError && (
            <span className="flex items-center gap-1.5 text-xs text-danger">
              <AlertTriangle className="size-4" aria-hidden="true" />
              {saveError}
            </span>
          )}
          <Button onClick={handleSave} loading={update.isPending}>
            Save all changes
          </Button>
        </div>
      </div>

      {/* Page switcher */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const isActive = t.key === active;
          const published = draft[t.key]?.enabled !== false;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:focus-ring',
                isActive
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-line-subtle text-ink-secondary hover:border-line-strong hover:text-ink-primary',
              )}
            >
              {t.label}
              {!published && (
                <span className="rounded-full bg-fill-strong px-1.5 py-0.5 text-[10px] uppercase text-ink-tertiary">
                  Off
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="max-w-3xl">
        <ActiveEditor
          page={draft[active]}
          set={(key, value) => setField(active, key, value)}
        />
      </div>

      <div className="mt-8 flex max-w-3xl items-center justify-end gap-3">
        {savedAt && (
          <span className="flex items-center gap-1.5 text-xs text-success">
            <Check className="size-4" aria-hidden="true" />
            Saved
          </span>
        )}
        {saveError && <p className="text-xs text-danger">{saveError}</p>}
        <Button onClick={handleSave} loading={update.isPending}>
          Save all changes
        </Button>
      </div>
    </AdminPage>
  );
}
