import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { CompareProvider } from './context/CompareContext';

// Layouts
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AdminLayout from './admin/components/AdminLayout';
import OwnerLayout from './admin/components/OwnerLayout';

// Public/User Pages
import Home from './user/pages/Home';
import Beaches from './user/pages/Beaches';
import BeachDetail from './user/pages/BeachDetail';
import Compare from './user/pages/Compare';
import Booking from './user/pages/Booking';
import Reviews from './user/pages/Reviews';
import Bookmarks from './user/pages/Bookmarks';

// Admin Pages
import Login from './admin/pages/Login';
import Dashboard from './admin/pages/Dashboard';
import AdminBeaches from './admin/pages/AdminBeaches';
import AdminBookings from './admin/pages/AdminBookings';
import AdminReviews from './admin/pages/AdminReviews';
import AdminAccounts from './admin/pages/AdminAccounts';
import AdminReports from './admin/pages/AdminReports';

// Owner Pages
import OwnerDashboard from './admin/pages/OwnerDashboard';
import OwnerBookings from './admin/pages/OwnerBookings';
import OwnerReviews from './admin/pages/OwnerReviews';
import OwnerReports from './admin/pages/OwnerReports';

// Protected Route Component (Admin)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

// Protected Route Component (Owner)
const OwnerRoute = ({ children }) => {
  const { isOwner, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return <Navigate to="/admin/login" replace />;
  }

  return <OwnerLayout>{children}</OwnerLayout>;
};

// Public Layout Component
const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    <main style={{ minHeight: 'calc(100vh - 200px)' }}>
      {children}
    </main>
    <Footer />
  </>
);

function App() {
  return (
    <AuthProvider>
      <BookmarkProvider>
        <CompareProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/beaches" element={<PublicLayout><Beaches /></PublicLayout>} />
            <Route path="/beaches/:id" element={<PublicLayout><BeachDetail /></PublicLayout>} />
            <Route path="/compare" element={<PublicLayout><Compare /></PublicLayout>} />
            <Route path="/booking" element={<PublicLayout><Booking /></PublicLayout>} />
            <Route path="/reviews" element={<PublicLayout><Reviews /></PublicLayout>} />
            <Route path="/bookmarks" element={<PublicLayout><Bookmarks /></PublicLayout>} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/beaches" element={<ProtectedRoute><AdminBeaches /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute><AdminBookings /></ProtectedRoute>} />
            <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviews /></ProtectedRoute>} />
            <Route path="/admin/admins" element={<ProtectedRoute><AdminAccounts /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />

            {/* Owner Routes */}
            <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="/owner/dashboard" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
            <Route path="/owner/bookings" element={<OwnerRoute><OwnerBookings /></OwnerRoute>} />
            <Route path="/owner/reviews" element={<OwnerRoute><OwnerReviews /></OwnerRoute>} />
            <Route path="/owner/reports" element={<OwnerRoute><OwnerReports /></OwnerRoute>} />

            {/* 404 */}
            <Route path="*" element={
              <PublicLayout>
                <div className="text-center py-5">
                  <h1 className="display-1">404</h1>
                  <p className="lead">Page not found</p>
                  <a href="/" className="btn btn-primary">Go Home</a>
                </div>
              </PublicLayout>
            } />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </CompareProvider>
      </BookmarkProvider>
    </AuthProvider>
  );
}

export default App;
