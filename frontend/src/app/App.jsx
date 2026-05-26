import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import Layout from '@/components/layout/Layout.jsx';
import AdminLayout from '@/components/admin/AdminLayout.jsx';
import RequireAdmin from './RequireAdmin.jsx';
import ScrollToTop from './ScrollToTop.jsx';
import { PageFallback } from '@/components/feedback/PageFallback.jsx';

// Route-based code splitting — each page is its own chunk.
const HomePage = lazy(() => import('@/pages/HomePage.jsx'));
const ProductListPage = lazy(() => import('@/pages/ProductListPage.jsx'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage.jsx'));
const CartPage = lazy(() => import('@/pages/CartPage.jsx'));
const LoginPage = lazy(() => import('@/pages/LoginPage.jsx'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage.jsx'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage.jsx'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage.jsx'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage.jsx'));
const AdminProductFormPage = lazy(() => import('@/pages/admin/AdminProductFormPage.jsx'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage.jsx'));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Storefront */}
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="auth/callback" element={<AuthCallbackPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Admin — guarded; the server also enforces require_admin */}
          <Route
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/products" element={<AdminProductsPage />} />
            <Route path="admin/products/new" element={<AdminProductFormPage />} />
            <Route path="admin/products/:id/edit" element={<AdminProductFormPage />} />
            <Route path="admin/categories" element={<AdminCategoriesPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
