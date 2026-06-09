import { Truck, RotateCcw, ShieldCheck, BadgeCheck } from 'lucide-react';
import { Reveal } from './luxe.jsx';

/**
 * Trust badge strip — the platform guarantees that hold for every order.
 * Rendered as the dark premium band from the design mockup: a deep indigo
 * surface with accent icons and hairline dividers between items.
 */
const BADGES = [
  { icon: Truck, title: 'Free Delivery', sub: 'On every order' },
  { icon: RotateCcw, title: '7-Day Returns', sub: 'Hassle-free' },
  { icon: ShieldCheck, title: 'Secure Payments', sub: 'Encrypted checkout' },
  { icon: BadgeCheck, title: '100% Authentic', sub: 'Sold by ShopWell' },
];

export function TrustRow() {
  return (
    <Reveal className="mt-12">
      <ul
        className="grid grid-cols-2 gap-y-6 rounded-lg border border-white/10 p-6 sm:p-7 md:grid-cols-4 md:gap-0"
        style={{
          background:
            'linear-gradient(120deg, #171627 0%, #1d1b35 55%, #241f47 100%)',
        }}
      >
        {BADGES.map(({ icon: Icon, title, sub }, i) => (
          <li
            key={title}
            className={
              'flex items-center gap-3 px-2 md:px-6 ' +
              (i > 0 ? 'md:border-l md:border-white/10' : '')
            }
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-[#B794F4]">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="truncate text-xs text-white/55">{sub}</p>
            </div>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
