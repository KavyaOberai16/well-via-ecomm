import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
  Gift,
  CreditCard,
  Clock,
  Heart,
  Star,
  BadgeCheck,
  Package,
  Sparkles,
  Zap,
  Percent,
  Lock,
} from 'lucide-react';

/** Icon registry for hero-slide perk badges, keyed by the name stored on the
 *  slide. Single source of truth for both the storefront and the admin editor. */
export const PERK_ICONS = {
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
  Gift,
  CreditCard,
  Clock,
  Heart,
  Star,
  BadgeCheck,
  Package,
  Sparkles,
  Zap,
  Percent,
  Lock,
};

export const PERK_ICON_NAMES = Object.keys(PERK_ICONS);

export const resolvePerkIcon = (name) => PERK_ICONS[name] || ShieldCheck;

/** Shown when a sale slide doesn't define its own perks (perks === null). */
export const DEFAULT_PERKS = [
  { icon: 'Truck', label: 'Free Delivery' },
  { icon: 'RotateCcw', label: '7-Day Returns' },
  { icon: 'ShieldCheck', label: 'Secure Checkout' },
];
