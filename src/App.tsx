import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { LabsPage } from './pages/LabsPage';
import { EquipmentPage } from './pages/EquipmentPage';
import { RequestsPage } from './pages/RequestsPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { CalendarPage } from './pages/CalendarPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { ProfilePage } from './pages/ProfilePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode, roles?: string[] }> = ({ children, roles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />
            
            <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/labs" element={
            <ProtectedRoute roles={['admin']}>
              <LabsPage />
            </ProtectedRoute>
          } />

          <Route path="/departments" element={
            <ProtectedRoute roles={['admin']}>
              <DepartmentsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/equipment" element={
            <ProtectedRoute roles={['admin']}>
              <EquipmentPage />
            </ProtectedRoute>
          } />
          
          <Route path="/requests" element={
            <ProtectedRoute>
              <RequestsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/reservations" element={
            <ProtectedRoute>
              <ReservationsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/calendar" element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute roles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  </ThemeProvider>
  );
}
