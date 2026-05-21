# Business Rules — Simple Ecommerce

The domain rules for the storefront. Every agent **must** honor these.
Referenced by `orchestrator/master-orchestrator.md`. Where this document and
`architecture-rules.md` overlap, architecture-rules governs *how* and this
document governs *what*.

## 1. Core ecommerce flow

This is the highest-priority path — it **must** always work and ship first.

```
Browse catalog → View product → Add to cart → Review cart → Checkout → Order placed
```

Each step **must** be reachable in one obvious action from the previous step.
No required step (cart, checkout) may be gated behind a non-essential one.

## 2. Catalog & products

- A product has: `sku` (unique), `name`, `description`, `price`, `stock`,
  `image_url`, optional `category`.
- `price` is stored as a decimal with 2 places, currency USD. It **must never**
  be computed or rounded on the client — the server is authoritative.
- Listing supports search (by name), filter by category, and pagination
  (default 20, max 100 per page).
- A product with `stock = 0` is shown as **out of stock**: visible and
  browsable, but not purchasable.
- Products are never hard-deleted while referenced by an order (FK `RESTRICT`).

## 3. Cart

- The cart is per-user and server-owned (Redis-backed). The client **must not**
  be the source of truth for cart contents or totals.
- Adding an item requires the product to exist; quantity **must** be ≥ 1.
- Cart line price is a **display estimate** — the authoritative price is
  re-resolved at order creation. If a price changed, checkout uses the current
  price and **should** surface the change to the user.
- Cart subtotal = Σ(line unit_price × quantity). No tax/shipping at cart stage.
- An empty cart **must** show the empty state and a path back to the catalog.

## 4. Pricing & totals

- All money is server-computed. Order `total_amount` = Σ(item unit_price × qty)
  at the moment the order is created.
- `unit_price` on an `order_item` is **frozen** at order time — later product
  price changes **must not** alter historical orders.
- Currency is USD across the system. Tax and shipping are **out of scope early**
  (see §9) — do not add fields or UI for them until prioritized.

## 5. Stock & inventory

- Stock is decremented when an order is created, within the same transaction
  as the order.
- An order **must** be rejected with a conflict error if any line quantity
  exceeds available stock — partial fulfillment is not supported.
- Stock **must never** go negative. The check and the decrement happen together
  in the order-creation transaction.
- Restocking on cancellation/refund is **out of scope early** — note it as a
  known gap, do not silently implement it.

## 6. Orders & lifecycle

Order status is one of: `pending → paid → shipped → delivered`, with
`cancelled` and `refunded` as terminal side states.

| Status | Meaning | Allowed next |
|--------|---------|--------------|
| `pending` | Created, not yet paid | `paid`, `cancelled` |
| `paid` | Payment captured | `shipped`, `refunded` |
| `shipped` | Dispatched | `delivered`, `refunded` |
| `delivered` | Received by customer | `refunded` |
| `cancelled` | Cancelled before payment | — terminal |
| `refunded` | Money returned | — terminal |

Rules:
- A new order starts as `pending`.
- Status **must** only move along an allowed transition; invalid transitions
  are rejected.
- A user may view only their own orders. Cross-user access **must** return
  not-found, not forbidden (do not leak existence).
- Order history is immutable — line items and totals are never edited after
  creation.

## 7. Users, auth & roles

- Two roles: **customer** (default) and **admin**.
- Auth is JWT: short-lived access token + refresh token.
- Customers may: browse, manage their cart, place and view *their* orders.
- Admins may additionally: create, update, and delete products.
- Catalog browsing and product detail are **public** (no auth required) — auth
  is required only for cart, checkout, orders, and account.
- Passwords are hashed (never stored or logged in plaintext).

## 8. Checkout

- Checkout requires an authenticated user and a non-empty cart.
- At order creation the server **must**, in one transaction: re-resolve prices,
  validate stock, decrement stock, create the order + items, clear the cart.
- If any validation fails, the whole transaction rolls back — no partial order,
  no stock change.
- Payment integration (Stripe) is **stubbed** — treat `payment_intent_id` as a
  placeholder until payment is prioritized.
- Idempotency: order-creation **should** be safe against double-submit (e.g. an
  idempotency key) before going to production.

## 9. Scope discipline — avoid overengineering early

Per the orchestrator's Business Prioritization, build the core flow well before
breadth. The following are **explicitly deferred** — do not implement, add
schema for, or build UI for them until they are prioritized:

- Tax, shipping rates, and address-based pricing
- Discounts, coupons, promotions
- Product reviews and ratings
- Wishlists / saved items
- Multi-currency, internationalization
- Stock restock on cancel/refund
- Inventory reservations / cart expiry
- Recommendations, search ranking, personalization

When a request touches a deferred area, the orchestrator **should** flag it and
confirm priority with the user before expanding scope.

## 10. Conversion principles

These shape product decisions (the orchestrator thinks like a strategist):

- Minimize steps and required fields in the buy path.
- Never surprise the user with cost — show the price that will be charged.
- Make stock and availability honest and visible.
- Errors in the buy path **must** be recoverable, with a clear next action.
- Speed is conversion — respect the performance budgets in `design-system.md`.

## 11. QA checklist (domain)

- [ ] Core flow works end-to-end: browse → product → cart → checkout → order
- [ ] All money is server-computed; client never sets price or total
- [ ] Out-of-stock products are browsable but not purchasable
- [ ] Order creation is atomic: price check + stock check + decrement + clear cart
- [ ] Stock can never go negative
- [ ] Order status changes follow the allowed transitions only
- [ ] A user can access only their own orders
- [ ] Public vs. authenticated routes match §7
- [ ] No deferred-scope (§9) feature was added without explicit prioritization
