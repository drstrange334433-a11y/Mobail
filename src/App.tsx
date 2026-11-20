/**
 * Paracha Mobile Shop — Application Entry & Router
 * Tagline: Trust • Quality • Technology
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ShopPage } from './pages/public/ShopPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { 
  AboutPage, 
  ContactPage, 
  CartPage, 
  CheckoutPage, 
  OffersPage, 
  AccessoriesPage, 
  PrivacyPolicyPage, 
  TermsPage 
} from './pages/public/StaticPages';
import { CustomerOrderHistoryPage } from './pages/public/CustomerOrderHistoryPage';
import { NotFoundPage } from './components/common/NotFoundPage';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ProductsPage } from './pages/admin/ProductsPage';
import { ProductCreatePage } from './pages/admin/ProductCreatePage';
import { ProductEditPage } from './pages/admin/ProductEditPage';
import { BulkImageUploadPage } from './pages/admin/BulkImageUploadPage';
import { ImagePromptsPage } from './pages/admin/ImagePromptsPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { CategoryCreatePage } from './pages/admin/CategoryCreatePage';
import { CategoryEditPage } from './pages/admin/CategoryEditPage';
import { BrandsPage } from './pages/admin/BrandsPage';
import { BrandCreatePage } from './pages/admin/BrandCreatePage';
import { BrandEditPage } from './pages/admin/BrandEditPage';
import { BannersPage } from './pages/admin/BannersPage';
import { BannerCreatePage } from './pages/admin/BannerCreatePage';
import { BannerEditPage } from './pages/admin/BannerEditPage';
import { OrdersPage } from './pages/admin/OrdersPage';
import { OrderDetailPage } from './pages/admin/OrderDetailPage';
import { TestimonialsPage } from './pages/admin/TestimonialsPage';
import { TestimonialCreatePage } from './pages/admin/TestimonialCreatePage';
import { TestimonialEditPage } from './pages/admin/TestimonialEditPage';
import { Phase2Placeholder } from './components/admin/Phase2Placeholder';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Website Shell */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/new-mobiles" element={<ShopPage filterCondition="new" />} />
            <Route path="/used-mobiles" element={<ShopPage filterCondition="used" />} />
            <Route path="/accessories" element={<AccessoriesPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-history" element={<CustomerOrderHistoryPage />} />
            <Route path="/orders" element={<CustomerOrderHistoryPage />} />
            <Route path="/track-order" element={<CustomerOrderHistoryPage />} />
            <Route path="/profile" element={<CustomerOrderHistoryPage />} />
            <Route path="/profile/orders" element={<CustomerOrderHistoryPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            {/* 404 Catch-All in Public Shell */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Admin Authentication */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Protected Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductCreatePage />} />
            <Route path="products/:id/edit" element={<ProductEditPage />} />
            <Route path="products/bulk-images" element={<BulkImageUploadPage />} />
            <Route path="bulk-images" element={<BulkImageUploadPage />} />
            <Route path="image-prompts" element={<ImagePromptsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="categories/new" element={<CategoryCreatePage />} />
            <Route path="categories/:id/edit" element={<CategoryEditPage />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="brands/new" element={<BrandCreatePage />} />
            <Route path="brands/:id/edit" element={<BrandEditPage />} />
            <Route path="banners" element={<BannersPage />} />
            <Route path="banners/new" element={<BannerCreatePage />} />
            <Route path="banners/:id/edit" element={<BannerEditPage />} />
            <Route
              path="offers"
              element={
                <Phase2Placeholder
                  moduleName="Offers"
                  description="Discounted bundle campaigns, special pricing discounts, and promotional vouchers."
                />
              }
            />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="testimonials" element={<TestimonialsPage />} />
            <Route path="testimonials/new" element={<TestimonialCreatePage />} />
            <Route path="testimonials/:id/edit" element={<TestimonialEditPage />} />
            <Route
              path="settings"
              element={
                <Phase2Placeholder
                  moduleName="Settings"
                  description="Store contact numbers, WhatsApp helpline, physical address, and store operational parameters."
                />
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
