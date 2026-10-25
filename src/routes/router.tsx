import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout, DashboardLayout } from '../components/layout';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';

// Auth pages
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  OtpVerificationPage,
  ResetPasswordPage,
} from '../pages/auth';

// Dashboard pages
import { DashboardPage, ShopProfilePage } from '../pages/dashboard';

// Product pages
import {
  ProductListPage,
  AddProductPage,
  EditProductPage,
  ProductDetailPage,
  ProductReviewsPage,
} from '../pages/products';

// Inventory pages
import { InventoryPage } from '../pages/inventory';

// Order pages
import { OrdersListPage, OrderDetailPage, ReturnsListPage, OrdersDashboardPage } from '../pages/orders';

// Shipment pages
import { ShipmentsListPage } from '../pages/shipments';

// Customer pages
import { CustomersListPage, CustomerDetailPage } from '../pages/customers';

// Marketing pages
import { FlashSalesPage, FlashSaleDetailPage } from '../pages/marketing';

// Analytics pages
import { SalesAnalyticsPage, ProductAnalyticsPage, CustomerAnalyticsPage } from '../pages/analytics';

// Finance pages
import { WalletPage, RevenueReportPage, InvoicesListPage, InvoiceDetailPage, PendingPayablesPage, VnpayReturnPage } from '../pages/finance';

// Chat pages
import { ChatPage, NotificationsPage, ReportsPage, ReportDetailPage } from '../pages/chat';

// Settings pages
import {
  AccountSettingsPage,
} from '../pages/settings';

export const router = createBrowserRouter([
  // Auth routes
  {
    path: '/',
    element: <PublicRoute><AuthLayout /></PublicRoute>,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'register/verify-otp', element: <OtpVerificationPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },

  // VNPay return — public route (payment-service callback)
  { path: '/payment/vnpay-return', element: <VnpayReturnPage /> },

  // Dashboard routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'shop', element: <ShopProfilePage /> },

      // Products
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/add', element: <AddProductPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'products/:id/edit', element: <EditProductPage /> },
      { path: 'products/reviews', element: <ProductReviewsPage /> },

      // Inventory
      { path: 'inventory', element: <InventoryPage /> },

      // Orders
      { path: 'orders', element: <OrdersDashboardPage /> },
      { path: 'orders/list', element: <OrdersListPage /> },
      { path: 'orders/pending', element: <Navigate to="/orders/list?status=pending" replace /> },
      { path: 'orders/processing', element: <Navigate to="/orders/list?status=processing" replace /> },
      { path: 'orders/shipping-requested', element: <Navigate to="/orders/list?status=shipping-requested" replace /> },
      { path: 'orders/shipped', element: <Navigate to="/orders/list?status=shipped" replace /> },
      { path: 'orders/completed', element: <Navigate to="/orders/list?status=completed" replace /> },
      { path: 'orders/cancelled', element: <Navigate to="/orders/list?status=cancelled" replace /> },
      { path: 'orders/returned', element: <Navigate to="/orders/list?status=returned" replace /> },
      { path: 'orders/returns', element: <ReturnsListPage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },

      // Shipments
      { path: 'shipments', element: <ShipmentsListPage /> },
      { path: 'shipments/:status', element: <ShipmentsListPage /> },

      // Customers
      { path: 'customers', element: <CustomersListPage /> },
      { path: 'customers/:id', element: <CustomerDetailPage /> },

      // Marketing
      { path: 'marketing/flash-sales', element: <FlashSalesPage /> },
      { path: 'marketing/flash-sales/:id', element: <FlashSaleDetailPage /> },

      // Analytics
      { path: 'analytics/sales', element: <SalesAnalyticsPage /> },
      { path: 'analytics/products', element: <ProductAnalyticsPage /> },
      { path: 'analytics/customers', element: <CustomerAnalyticsPage /> },

      // Finance
      { path: 'finance/wallet', element: <WalletPage /> },
      { path: 'finance/payables', element: <PendingPayablesPage /> },
      { path: 'finance/revenue', element: <RevenueReportPage /> },
      { path: 'finance/invoices', element: <InvoicesListPage /> },
      { path: 'finance/invoices/:id', element: <InvoiceDetailPage /> },

      // Communication
      { path: 'chat', element: <ChatPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'reports/:id', element: <ReportDetailPage /> },
      { path: 'questions', element: <Navigate to="/chat" replace /> },

      // Settings
      { path: 'settings/account', element: <AccountSettingsPage /> },
      { path: 'settings/security', element: <Navigate to="/settings/account?tab=security" replace /> },
      { path: 'settings/shipping', element: <Navigate to="/settings/account?tab=address" replace /> },
      { path: 'settings/payment', element: <Navigate to="/settings/account?tab=payment" replace /> },
    ],
  },

  // Catch all - redirect to dashboard
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
