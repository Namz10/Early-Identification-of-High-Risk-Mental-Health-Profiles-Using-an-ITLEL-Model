import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Toast from './components/Toast';

// Pages
import LandingPage from './pages/LandingPage';
import AssessmentFlow from './pages/AssessmentFlow';
import Confirmation from './pages/Confirmation';
import DashboardRoster from './pages/DashboardRoster';
import ReportView from './pages/ReportView';
import PopulationAnalytics from './pages/PopulationAnalytics';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toast />
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<LandingPage />} />

          {/* Patient Routes */}
          <Route 
            path="/assessment" 
            element={
              <ProtectedRoute allowedRole="patient">
                <AssessmentFlow />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/confirmation" 
            element={
              <ProtectedRoute allowedRole="patient">
                <Confirmation />
              </ProtectedRoute>
            } 
          />

          {/* Clinician Routes */}
          <Route 
            path="/dashboard" 
            element={<Navigate to="/dashboard/patients" replace />} 
          />
          <Route 
            path="/dashboard/patients" 
            element={
              <ProtectedRoute allowedRole="clinician">
                <DashboardRoster />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/patients/:id/report/:assessmentId" 
            element={
              <ProtectedRoute allowedRole="clinician">
                <ReportView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/analytics" 
            element={
              <ProtectedRoute allowedRole="clinician">
                <PopulationAnalytics />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
