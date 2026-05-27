import { formatPrice } from '@/lib/utils.js';

/**
 * Compact spec table — mirrors Amazon's two-column key/value strip. All values
 * are derived from real product fields so no fake data is introduced.
 */
export function SpecTable({ product, categoryName }) {
  const rows = [
    ['Brand', categoryName || '—'],
    ['SKU', product.sku],
    ['Unit price', formatPrice(product.price)],
    ['Availability', product.stock > 0 ? `In stock (${product.stock})` : 'Out of stock'],
    ['Listed', new Date(product.created_at).toLocaleDateString()],
  ];

  return (
    <section className="mt-6 overflow-hidden rounded-md border border-line-subtle">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v], i) => (
            <tr
              key={k}
              className={i % 2 === 0 ? 'bg-bg-elevated' : 'bg-bg-sunken'}
            >
              <th
                scope="row"
                className="w-1/3 border-r border-line-subtle px-4 py-2.5 text-left font-medium text-ink-secondary"
              >
                {k}
              </th>
              <td className="px-4 py-2.5 text-ink-primary">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
