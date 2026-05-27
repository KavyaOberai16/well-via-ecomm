import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Facebook,
  Twitter,
  Youtube,
  Instagram,
  Store,
  Megaphone,
  Gift,
  LifeBuoy,
  Mail,
  ArrowRight,
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils.js';

const TRUST_FEATURES = [
  { Icon: Truck, title: 'Free Shipping', sub: 'On orders over $50' },
  { Icon: RotateCcw, title: 'Easy Returns', sub: '30-day return window' },
  { Icon: ShieldCheck, title: 'Secure Payment', sub: '256-bit SSL encryption' },
  { Icon: Headphones, title: '24/7 Support', sub: 'Real humans, anytime' },
];

const LINK_COLUMNS = [
  {
    title: 'About',
    links: [
      { to: '/contact', label: 'Contact Us' },
      { to: '/about', label: 'About Us' },
      { to: '/careers', label: 'Careers' },
      { to: '/stories', label: 'Lumen Stories' },
      { to: '/press', label: 'Press' },
      { to: '/corporate', label: 'Corporate Information' },
    ],
  },
  {
    title: 'Group',
    links: [
      { to: '/brands/aura', label: 'Aura' },
      { to: '/brands/voyage', label: 'Voyage' },
      { to: '/brands/forge', label: 'Forge' },
    ],
  },
  {
    title: 'Help',
    links: [
      { to: '/help/payments', label: 'Payments' },
      { to: '/help/shipping', label: 'Shipping' },
      { to: '/help/returns', label: 'Cancellation & Returns' },
      { to: '/help/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Consumer Policy',
    links: [
      { to: '/policy/returns', label: 'Cancellation & Returns' },
      { to: '/terms', label: 'Terms of Use' },
      { to: '/security', label: 'Security' },
      { to: '/privacy', label: 'Privacy' },
      { to: '/sitemap', label: 'Sitemap' },
      { to: '/grievance', label: 'Grievance Redressal' },
      { to: '/epr', label: 'EPR Compliance' },
    ],
  },
];

const SOCIAL_LINKS = [
  { href: 'https://facebook.com/lumen', label: 'Facebook', Icon: Facebook },
  { href: 'https://twitter.com/lumen', label: 'Twitter', Icon: Twitter },
  { href: 'https://youtube.com/lumen', label: 'YouTube', Icon: Youtube },
  { href: 'https://instagram.com/lumen', label: 'Instagram', Icon: Instagram },
];

const BOTTOM_LINKS = [
  { to: '/sell', label: 'Become a Seller', Icon: Store },
  { to: '/advertise', label: 'Advertise', Icon: Megaphone },
  { to: '/gift-cards', label: 'Gift Cards', Icon: Gift },
  { to: '/help', label: 'Help Center', Icon: LifeBuoy },
];

const PAYMENT_METHODS = [
  'VISA',
  'MC',
  'AmEx',
  'UPI',
  'RuPay',
  'Net Banking',
  'COD',
  'EMI',
];

const MAIL_ADDRESS = [
  'Lumen Internet Pvt. Ltd.,',
  'Buildings Alyssa, Begonia &',
  'Clove Embassy Tech Village,',
  'Outer Ring Road, Devarabeesanahalli Village,',
  'Bengaluru, 560103,',
  'Karnataka, India',
];

const REGISTERED_OFFICE = {
  lines: MAIL_ADDRESS,
  cin: 'U51109KA2026PTC066107',
  phones: [
    { display: '044-4561 4700', tel: '+914445614700' },
    { display: '044-6741 5800', tel: '+914467415800' },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line-subtle bg-bg-sunken">
      <TrustStrip />

      <div className="border-t border-line-subtle">
        <div className="mx-auto grid max-w-content gap-8 px-6 py-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <BrandBlock />
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-line-subtle">
        <div className="mx-auto max-w-content px-6 py-12">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
            {LINK_COLUMNS.map((col) => (
              <LinkColumn key={col.title} title={col.title} links={col.links} />
            ))}

            <div className="col-span-2 md:col-span-3 lg:col-span-1 lg:border-l lg:border-line-subtle lg:pl-6">
              <SectionHeading>Mail Us</SectionHeading>
              <address className="not-italic text-sm leading-6 text-ink-secondary">
                {MAIL_ADDRESS.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>

              <SectionHeading className="mt-6">Social</SectionHeading>
              <ul className="flex items-center gap-3">
                {SOCIAL_LINKS.map(({ href, label, Icon }) => (
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
                ))}
              </ul>
            </div>

            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <SectionHeading>Registered Office Address</SectionHeading>
              <address className="not-italic text-sm leading-6 text-ink-secondary">
                {REGISTERED_OFFICE.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                <span className="mt-2 block">CIN: {REGISTERED_OFFICE.cin}</span>
              </address>
              <p className="mt-1 text-sm text-ink-secondary">
                Telephone:{' '}
                {REGISTERED_OFFICE.phones.map((p, i) => (
                  <span key={p.tel}>
                    <a
                      href={`tel:${p.tel}`}
                      className="rounded-sm text-accent transition-colors hover:text-accent-hover focus-visible:focus-ring"
                    >
                      {p.display}
                    </a>
                    {i < REGISTERED_OFFICE.phones.length - 1 && (
                      <span className="text-ink-tertiary"> / </span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-line-subtle">
        <div className="mx-auto flex max-w-content flex-col items-center gap-6 px-6 py-6 lg:flex-row lg:justify-between">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {BOTTOM_LINKS.map(({ to, label, Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center gap-2 rounded-sm text-sm text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring"
                >
                  <Icon className="size-4 text-accent" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="text-xs text-ink-tertiary">
            &copy; 2007&ndash;{year} Lumen.com
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-2">
            {PAYMENT_METHODS.map((m) => (
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

function TrustStrip() {
  return (
    <div className="mx-auto max-w-content px-6 py-8">
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {TRUST_FEATURES.map(({ Icon, title, sub }) => (
          <li
            key={title}
            className="flex items-center gap-3 rounded-sm border border-line-subtle bg-bg-elevated p-3 transition-colors hover:border-line-strong"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-accent/10 text-accent">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-primary">
                {title}
              </p>
              <p className="truncate text-xs text-ink-tertiary">{sub}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BrandBlock() {
  return (
    <Link
      to="/"
      className="flex items-start gap-3 rounded-sm focus-visible:focus-ring"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-accent text-ink-inverse">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-h3 leading-none text-ink-primary">Lumen</p>
        <p className="mt-1.5 max-w-md text-sm text-ink-secondary">
          Modern essentials, thoughtfully sourced. Join our newsletter for early
          drops and member-only pricing.
        </p>
      </div>
    </Link>
  );
}

function NewsletterForm() {
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
            placeholder="you@example.com"
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
          error
            ? 'text-danger'
            : submitted
              ? 'text-success'
              : 'text-ink-tertiary',
        )}
      >
        {error
          ? error
          : submitted
            ? "You're on the list. Welcome to Lumen."
            : 'No spam. Unsubscribe anytime.'}
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
