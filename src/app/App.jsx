import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import Layout from '@/components/layout/Layout.jsx';
import AdminLayout from '@/components/admin/AdminLayout.jsx';
import RequireAdmin from './RequireAdmin.jsx';
import RequirePermission from './RequirePermission.jsx';
import ScrollToTop from './ScrollToTop.jsx';
import AuthBootstrap from './AuthBootstrap.jsx';
import { PageFallback } from '@/components/feedback/PageFallback.jsx';

import Bestsellers from '../pages/Bestsellers.jsx';
import NewArrivals from '../pages/NewArrivals.jsx';
import Emptycart from '../pages/Emptycart.jsx';
import SearchCategory from '../pages/Search.jsx';
import Blog from '../pages/Blog.jsx';
const CartPage = lazy(() => import('@/pages/CartPage.jsx'));
import CartPage2 from '../pages/CartPage2.jsx';
const OrdersPage = lazy(() => import('@/pages/OrdersPage.jsx'));
import OrderPage2 from '../pages/OrderPage2.jsx';
import SingleProduct from '../pages/SingleProduct.jsx';
import Checkout from '../pages/Checkout.jsx';

// Route-based code splitting — each page is its own chunk.
const HomePage = lazy(() => import('@/pages/HomePage.jsx'));
const ProductListPage = lazy(() => import('@/pages/ProductListPage.jsx'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage.jsx'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage.jsx'));
const PaymentMockPage = lazy(() => import('@/pages/PaymentMockPage.jsx'));
const PaymentReturnPage = lazy(() => import('@/pages/PaymentReturnPage.jsx'));
const WishlistPage = lazy(() => import('@/pages/WishlistPage.jsx'));
const RewardsPage = lazy(() => import('@/pages/RewardsPage.jsx'));
const AccountSecurityPage = lazy(() => import('@/pages/AccountSecurityPage.jsx'));
const LoginPage = lazy(() => import('@/pages/LoginPage.jsx'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage.jsx'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage.jsx'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));

// Company / content pages (footer "About" links) — admin-editable.
const AboutPage = lazy(() => import('@/pages/AboutPage.jsx'));
const ContactPage = lazy(() => import('@/pages/ContactPage.jsx'));
const CareersPage = lazy(() => import('@/pages/CareersPage.jsx'));
const StoriesPage = lazy(() => import('@/pages/StoriesPage.jsx'));
const PressPage = lazy(() => import('@/pages/PressPage.jsx'));
const CorporatePage = lazy(() => import('@/pages/CorporatePage.jsx'));

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage.jsx'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage.jsx'));
const AdminProductFormPage = lazy(() => import('@/pages/admin/AdminProductFormPage.jsx'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage.jsx'));
const AdminHeroSlidesPage = lazy(() => import('@/pages/admin/AdminHeroSlidesPage.jsx'));
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage.jsx'));
const AdminRolesPage = lazy(() => import('@/pages/admin/AdminRolesPage.jsx'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage.jsx'));
const AdminTaxesPage = lazy(() => import('@/pages/admin/AdminTaxesPage.jsx'));
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage.jsx'));
const AdminLoyaltyPage = lazy(() => import('@/pages/admin/AdminLoyaltyPage.jsx'));
const AdminAuditPage = lazy(() => import('@/pages/admin/AdminAuditPage.jsx'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage.jsx'));
const AdminPaymentGatewayPage = lazy(() => import('@/pages/admin/AdminPaymentGatewayPage.jsx'));
const AdminFooterPage = lazy(() => import('@/pages/admin/AdminFooterPage.jsx'));
const AdminPagesPage = lazy(() => import('@/pages/admin/AdminPagesPage.jsx'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage.jsx'));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage.jsx'));
const AdminReturnsPage = lazy(() => import('@/pages/admin/AdminReturnsPage.jsx'));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AuthBootstrap />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Storefront */}
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="bestsellers" element={<Bestsellers />} />
            <Route path="newArrivals" element={<NewArrivals/>}/>
            <Route path='emptyCart' element={<Emptycart/>}/>
            <Route path='search' element={<SearchCategory/>}/>
            <Route path='blog' element={<Blog/>}/>
            <Route path="cart" element={<CartPage />} />
            <Route path='cart2' element={<CartPage2/>} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path='orders2' element={<OrderPage2/>} />
            <Route path='checkout' element={<Checkout/>}/>
            <Route path='singleProd' element={<SingleProduct/>}/>




            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="account/security" element={<AccountSecurityPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="payments/mock/:txnId" element={<PaymentMockPage />} />
            <Route path="payments/return" element={<PaymentReturnPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="auth/callback" element={<AuthCallbackPage />} />
            {/* Company / content pages — match the footer link targets */}
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="careers" element={<CareersPage />} />
            <Route path="stories" element={<StoriesPage />} />
            <Route path="press" element={<PressPage />} />
            <Route path="corporate" element={<CorporatePage />} />
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
            <Route
              path="admin/orders"
              element={
                <RequirePermission permission="orders.view_all">
                  <AdminOrdersPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin/orders/:id"
              element={
                <RequirePermission permission="orders.view_all">
                  <AdminOrderDetailPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin/returns"
              element={
                <RequirePermission permission="returns.view_all">
                  <AdminReturnsPage />
                </RequirePermission>
              }
            />
            <Route path="admin/hero" element={<AdminHeroSlidesPage />} />
            <Route
              path="admin/coupons"
              element={
                <RequirePermission permission="coupons.view">
                  <AdminCouponsPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin/roles"
              element={
                <RequirePermission permission="roles.view">
                  <AdminRolesPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin/users"
              element={
                <RequirePermission permission="users.view">
                  <AdminUsersPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin/taxes"
              element={
                <RequirePermission permission="taxes.view">
                  <AdminTaxesPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin/reviews"
              element={
                <RequirePermission permission="reviews.view">
                  <AdminReviewsPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin/loyalty"
              element={
                <RequirePermission permission="loyalty.view">
                  <AdminLoyaltyPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin/audit"
              element={
                <RequirePermission permission="audit.view">
                  <AdminAuditPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin/settings"
              element={
                <RequirePermission permission="settings.manage">
                  <AdminSettingsPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin/payment-gateway"
              element={
                <RequirePermission permission="payments.manage">
                  <AdminPaymentGatewayPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin/footer"
              element={
                <RequirePermission permission="frontend.manage">
                  <AdminFooterPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin/pages"
              element={
                <RequirePermission permission="frontend.manage">
                  <AdminPagesPage />
                </RequirePermission>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
