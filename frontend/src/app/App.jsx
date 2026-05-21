import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import Layout from '@/components/layout/Layout.jsx';
import ScrollToTop from './ScrollToTop.jsx';
import { PageFallback } from '@/components/feedback/PageFallback.jsx';

// Route-based code splitting — each page is its own chunk.
const HomePage = lazy(() => import('@/pages/HomePage.jsx'));
const ProductListPage = lazy(() => import('@/pages/ProductListPage.jsx'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage.jsx'));
const CartPage = lazy(() => import('@/pages/CartPage.jsx'));
const LoginPage = lazy(() => import('@/pages/LoginPage.jsx'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
