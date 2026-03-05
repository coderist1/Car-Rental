import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VehicleProvider } from './context/VehicleContext';
import { useAuth } from './hooks';
import {
  LandingPage,
  Login,
  Register,
  AdminRegister,
  ForgotPassword, // Requirement: Ensure all new components are imported
  Dashboard,
  RenterDashboard,
  AdminDashboard,
  Profile,
  ChangePassword,
  Bookings,
  EmailLog,
} from './pages';

// Lab Requirement: Improved Quality - Protected Route logic 
// Ensures unauthorized users cannot access internal pages.
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/LandingPage" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'owner') return <Navigate to="/dashboard" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/renter" replace />;
  }

  return children;
};

// Lab Requirement: Usability - Public Route logic
// Prevents logged-in users from seeing the login/forgot-password pages.
const PublicRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    if (user?.role === 'owner') return <Navigate to="/dashboard" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/renter" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VehicleProvider>
          {/* Lab Requirement: Semantic Routing & SPA Fallback Support */}
          <Routes>
            {/* Landing Page */}
            <Route path="/LandingPage" element={<LandingPage />} />

            {/* Public Routes - Lab Requirement: User flow optimization */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/admin-register" element={<PublicRoute><AdminRegister /></PublicRoute>} />
            
            {/* NEW: Forgot Password Route */}
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

            {/* Owner Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Renter Routes */}
            <Route
              path="/renter"
              element={
                <ProtectedRoute allowedRoles={['renter']}>
                  <RenterDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Shared Protected Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/email-log"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EmailLog />
                </ProtectedRoute>
              }
            />

            {/* Lab Requirement Part 5: Handle 404s and Blank Pages 
                Ensures that any unknown URL redirects back to the entry point. */}
            <Route path="/" element={<Navigate to="/LandingPage" replace />} />
            <Route path="*" element={<Navigate to="/LandingPage" replace />} />
          </Routes>
        </VehicleProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
