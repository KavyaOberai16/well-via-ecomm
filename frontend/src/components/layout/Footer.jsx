import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { useFooterConfig } from '@/features/footer/hooks.js';
import { FOOTER_DEFAULTS, resolveIcon } from '@/features/footer/defaults.js';

export default function Footer() {
  const { data } = useFooterConfig();
  // Shallow merge: server returns a complete document; FOOTER_DEFAULTS is the
  // instant-render fallback while the query is in-flight or when offline.
  const cfg = { ...FOOTER_DEFAULTS, ...data };

  const year = new Date().getFullYear();
  const copyright = (cfg.copyright || '').replace('{year}', year);

  return (
    <footer className="mt-24 border-t border-line-subtle bg-bg-sunken">
      <TrustStrip features={cfg.trust_features} />

      <div className="border-t border-line-subtle">
        <div className="mx-auto grid max-w-content gap-8 px-6 py-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <BrandBlock brand={cfg.brand} />
          {cfg.newsletter?.enabled !== false && (
            <NewsletterForm newsletter={cfg.newsletter} />
          )}
        </div>
      </div>

      <div className="border-t border-line-subtle">
        <div className="mx-auto max-w-content px-6 py-12">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
            {cfg.link_columns.map((col) => (
              <LinkColumn key={col.title} title={col.title} links={col.links} />
            ))}

            <div className="col-span-2 md:col-span-3 lg:col-span-1 lg:border-l lg:border-line-subtle lg:pl-6">
              <SectionHeading>{cfg.mail_us?.heading || 'Mail Us'}</SectionHeading>
              <address className="not-italic text-sm leading-6 text-ink-secondary">
                {(cfg.mail_us?.lines || []).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>

              <SectionHeading className="mt-6">Social</SectionHeading>
              <ul className="flex items-center gap-3">
                {cfg.social_links.map(({ href, label, icon }) => {
                  const Icon = resolveIcon(icon);
                  return (
                    <li key={label}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        className="grid size-9 place-items-center rounded-full border border-line-subtle text-ink-secondary transition-colors hover:border-line-strong hover:text-ink-primary focus-visible:focus-ring"
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <SectionHeading>
                {cfg.registered_office?.heading || 'Registered Office Address'}
              </SectionHeading>
              <address className="not-italic text-sm leading-6 text-ink-secondary">
                {(cfg.registered_office?.lines || []).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                {cfg.registered_office?.cin && (
                  <span className="mt-2 block">CIN: {cfg.registered_office.cin}</span>
                )}
              </address>
              {cfg.registered_office?.phones?.length > 0 && (
                <p className="mt-1 text-sm text-ink-secondary">
                  Telephone:{' '}
                  {cfg.registered_office.phones.map((p, i) => (
                    <span key={p.tel}>
                      <a
                        href={`tel:${p.tel}`}
                        className="rounded-sm text-accent transition-colors hover:text-accent-hover focus-visible:focus-ring"
                      >
                        {p.display}
                      </a>
                      {i < cfg.registered_office.phones.length - 1 && (
                        <span className="text-ink-tertiary"> / </span>
                      )}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-line-subtle">
        <div className="mx-auto flex max-w-content flex-col items-center gap-6 px-6 py-6 lg:flex-row lg:justify-between">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {cfg.bottom_links.map(({ to, label, icon }) => {
              const Icon = resolveIcon(icon);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 rounded-sm text-sm text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring"
                  >
                    <Icon className="size-4 text-accent" aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-ink-tertiary">{copyright}</p>

          <ul className="flex flex-wrap items-center justify-center gap-2">
            {cfg.payment_methods.map((m) => (
              <li
                key={m}
                aria-label={m}
                className="grid h-6 min-w-[2.5rem] place-items-center rounded-xs border border-line-subtle bg-bg-elevated px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-secondary"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function TrustStrip({ features }) {
  return (
    <div className="mx-auto max-w-content px-6 py-8">
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {features.map(({ icon, title, sub }) => {
          const Icon = resolveIcon(icon);
          return (
            <li
              key={title}
              className="flex items-center gap-3 rounded-sm border border-line-subtle bg-bg-elevated p-3 transition-colors hover:border-line-strong"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-accent/10 text-accent">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-primary">{title}</p>
                <p className="truncate text-xs text-ink-tertiary">{sub}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BrandBlock({ brand }) {
  return (
    <Link to="/" className="flex items-start gap-3 rounded-sm focus-visible:focus-ring">
      <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-accent text-ink-inverse">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-h3 leading-none text-ink-primary">{brand?.name || 'Lumen'}</p>
        <p className="mt-1.5 max-w-md text-sm text-ink-secondary">
          {brand?.tagline || ''}
        </p>
      </div>
    </Link>
  );
}

function NewsletterForm({ newsletter = {} }) {
  const {
    placeholder = 'you@example.com',
    note = 'No spam. Unsubscribe anytime.',
    success = "You're on the list. Welcome to Lumen.",
  } = newsletter;

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function onSubmit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
    setEmail('');
    window.setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Subscribe to the Lumen newsletter"
      className="w-full lg:w-auto"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <label htmlFor="footer-newsletter" className="sr-only">
          Email address
        </label>
        <div className="relative flex-1 sm:w-80">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden="true"
          />
          <input
            id="footer-newsletter"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder={placeholder}
            autoComplete="email"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby="footer-newsletter-msg"
            className={cn(
              'h-11 w-full rounded-sm border bg-bg-elevated pl-10 pr-3.5 text-sm text-ink-primary',
              'placeholder:text-ink-tertiary transition-colors duration-200',
              'hover:border-line-strong focus-visible:border-accent focus-visible:focus-ring',
              error ? 'border-danger' : 'border-line-subtle',
            )}
          />
        </div>
        <button
          type="submit"
          className={cn(
            'inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-5 text-sm font-semibold',
            'bg-accent text-ink-inverse transition-[transform,background-color] duration-200',
            'hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 active:bg-accent-press',
            'focus-visible:focus-ring',
          )}
        >
          {submitted ? (
            <>
              <Check className="size-4" aria-hidden="true" />
              Subscribed
            </>
          ) : (
            <>
              Subscribe
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
      <p
        id="footer-newsletter-msg"
        role="status"
        aria-live="polite"
        className={cn(
          'mt-2 min-h-[1.25rem] text-xs',
          error ? 'text-danger' : submitted ? 'text-success' : 'text-ink-tertiary',
        )}
      >
        {error ? error : submitted ? success : note}
      </p>
    </form>
  );
}

function LinkColumn({ title, links }) {
  return (
    <div>
      <SectionHeading>{title}</SectionHeading>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="rounded-sm text-sm text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionHeading({ children, className }) {
  return (
    <h3
      className={cn(
        'mb-4 text-xs font-semibold uppercase tracking-wider text-ink-tertiary',
        className,
      )}
    >
      {children}
    </h3>
  );
}
