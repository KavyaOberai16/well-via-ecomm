import { Sparkles } from 'lucide-react';

/**
 * "About this item" bullets.
 *
 * We don't have a structured bullets field on Product, so we derive an honest
 * list from data we *do* have: the description (split into sentences) plus a
 * couple of factual auto-bullets (category, in-stock count). Skipped if the
 * product has no description.
 */
export function AboutThisItem({ product, categoryName }) {
  const bullets = extractBullets(product, categoryName);
  if (bullets.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-h3 text-ink-primary">About this item</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-ink-secondary">
            <Sparkles
              className="mt-0.5 size-4 shrink-0 text-accent"
              aria-hidden="true"
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function extractBullets(product, categoryName) {
  const raw = (product.description || '').trim();
  // Split on sentence end OR explicit newlines. Filter empties + dedupe.
  const sentenceParts = raw
    .split(/(?<=[.!?])\s+|\n+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const bullets = [...new Set(sentenceParts)];

  // Add factual auto-bullets that we know are true from the product record.
  if (categoryName) bullets.push(`Curated under ${categoryName}.`);
  if (product.stock > 0) {
    bullets.push(
      product.stock <= 5
        ? `Limited availability — only ${product.stock} left in stock.`
        : `Ready to ship — currently in stock.`,
    );
  }
  bullets.push(`SKU: ${product.sku}`);

  return bullets;
}
