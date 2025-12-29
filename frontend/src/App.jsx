import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Verify from './pages/Verify';
import Register from './pages/Register';
import Chat from './pages/Chat';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

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

function App() {
  return (
    <Router>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
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
