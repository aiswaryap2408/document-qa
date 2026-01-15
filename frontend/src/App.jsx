import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Verify from './pages/Verify';
import Register from './pages/Register';
import RegisterSuccess from './pages/RegisterSuccess';
import Onboarding from './pages/Onboarding';
import Chat from './pages/Chat';
import UserProfile from './pages/UserProfile';
import ChatHistory from './pages/ChatHistory';
import PlaceTest from './pages/PlaceTest';
import Dakshina from './pages/Dakshina';
import Wallet from './pages/wallet/Wallet';
import Recharge from './pages/wallet/Recharge';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ScrollToTop from './components/ScrollToTop';

// User Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Admin Protected Route Component
const AdminProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

import Layout from './components/Layout';

const MobileLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* User Routes (Wrapped in Mobile Layout) */}
        <Route element={<MobileLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/register-success"
            element={
              <ProtectedRoute>
                <RegisterSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <ChatHistory />
              </ProtectedRoute>
            }
          />
          <Route path="/place-test" element={<PlaceTest />} />
          <Route
            path="/dakshina"
            element={
              <ProtectedRoute>
                <Dakshina />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet/recharge"
            element={
              <ProtectedRoute>
                <Recharge />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin Routes (Full Screen, No Mobile Layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
