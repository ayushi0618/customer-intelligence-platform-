import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import SegmentsPage from './pages/SegmentsPage';
import FunnelPage from './pages/FunnelPage';
import CampaignsPage from './pages/CampaignsPage';
import AttributionPage from './pages/AttributionPage';
import MlDashboardPage from './pages/MlDashboardPage';
import RecommendationsPage from './pages/RecommendationsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Loading System Context...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="segments" element={<SegmentsPage />} />
            <Route path="funnel" element={<FunnelPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="attribution" element={<AttributionPage />} />
            <Route path="ml" element={<MlDashboardPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
