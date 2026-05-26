import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ImageOff } from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { ProductImageManager } from '@/components/admin/ProductImageManager.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Textarea } from '@/components/ui/Textarea.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { useProduct } from '@/features/products/hooks.js';
import { useCategories } from '@/features/categories/hooks.js';
import { useCreateProduct, useUpdateProduct } from '@/features/admin/hooks.js';

const EMPTY = {
  sku: '',
  name: '',
  description: '',
  price: '',
  stock: '',
  category_id: '',
};

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: product, isLoading, isError } = useProduct(isEdit ? id : undefined);
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  // Prefill when editing once the product loads.
  useEffect(() => {
    if (isEdit && product) {
      setForm({
        sku: product.sku ?? '',
        name: product.name ?? '',
        description: product.description ?? '',
        price: String(product.price ?? ''),
        stock: String(product.stock ?? ''),
        category_id: product.category_id != null ? String(product.category_id) : '',
      });
    }
  }, [isEdit, product]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!isEdit && !form.sku.trim()) next.sku = 'SKU is required.';
    if (form.price === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      next.price = 'Enter a price of 0 or more.';
    }
    if (form.stock !== '' && (Number.isNaN(Number(form.stock)) || Number(form.stock) < 0)) {
      next.stock = 'Stock cannot be negative.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildPayload() {
    const base = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      stock: form.stock === '' ? 0 : Number(form.stock),
      category_id: form.category_id === '' ? null : Number(form.category_id),
    };
    return isEdit ? base : { sku: form.sku.trim(), ...base };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    try {
      if (isEdit) {
        await updateProduct.mutateAsync({ id, data: buildPayload() });
      } else {
        await createProduct.mutateAsync(buildPayload());
      }
      navigate('/admin/products');
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message || 'Could not save the product. Try again.',
      );
    }
  }

  const busy = createProduct.isPending || updateProduct.isPending;

  if (isEdit && isLoading) {
    return (
      <AdminPage title="Edit product">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </AdminPage>
    );
  }

  if (isEdit && (isError || !product)) {
    return (
      <AdminPage title="Edit product">
        <EmptyState
          icon={AlertTriangle}
          title="Product not found"
          description="This product may have been removed."
          action={
            <Link to="/admin/products">
              <Button size="sm">Back to products</Button>
            </Link>
          }
        />
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title={isEdit ? 'Edit product' : 'New product'}
      description={
        isEdit ? 'Update the details of this product.' : 'Add a product to the catalog.'
      }
    >
      <Link
        to="/admin/products"
        className="mb-6 inline-flex items-center gap-1.5 rounded-sm text-sm text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to products
      </Link>

      <div className="max-w-2xl">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-lg border border-line-subtle bg-bg-elevated p-6"
        >
          <Input
            label="SKU"
            value={form.sku}
            onChange={set('sku')}
            error={errors.sku}
            disabled={isEdit}
            helper={isEdit ? 'SKU cannot be changed after creation.' : 'Unique product code.'}
            placeholder="AUD-AURA-01"
          />
          <Input
            label="Name"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
            placeholder="Aura Wireless Headphones"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={set('description')}
            placeholder="A short, appealing product description."
          />
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Input
              label="Price (USD)"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={set('price')}
              error={errors.price}
              placeholder="299.00"
            />
            <Input
              label="Stock"
              type="number"
              step="1"
              min="0"
              value={form.stock}
              onChange={set('stock')}
              error={errors.stock}
              placeholder="24"
            />
          </div>
          <Select
            label="Category"
            value={form.category_id}
            onChange={set('category_id')}
            helper="Optional — used for browsing and filtering."
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          {serverError && (
            <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={busy}>
              {isEdit ? 'Save changes' : 'Create product'}
            </Button>
            <Link to="/admin/products">
              <Button type="button" variant="ghost" disabled={busy}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>

        {/* Images — managed separately; uploads apply immediately */}
        <div className="mt-6 rounded-lg border border-line-subtle bg-bg-elevated p-6">
          {isEdit ? (
            <ProductImageManager
              key={product.id}
              productId={product.id}
              initialImages={product.images || []}
            />
          ) : (
            <div className="flex items-center gap-3 text-sm text-ink-secondary">
              <ImageOff className="size-5 shrink-0 text-ink-tertiary" aria-hidden="true" />
              <span>
                Save the product first — then edit it to upload up to 8 images.
              </span>
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
