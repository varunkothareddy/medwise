import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

import HomePage from '@/pages/HomePage.jsx';
import OTPLoginPage from '@/pages/OTPLoginPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import HealthAnalysisPage from '@/pages/HealthAnalysisPage.jsx';
import HealthResultsPage from '@/pages/HealthResultsPage.jsx';
import AppointmentBookingPage from '@/pages/AppointmentBookingPage.jsx';
import AppointmentHistoryPage from '@/pages/AppointmentHistoryPage.jsx';
import ChatbotPage from '@/pages/ChatbotPage.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<OTPLoginPage />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/health-analysis" element={<ProtectedRoute><HealthAnalysisPage /></ProtectedRoute>} />
              <Route path="/health-results/:recordId" element={<ProtectedRoute><HealthResultsPage /></ProtectedRoute>} />
              <Route path="/appointments/book" element={<ProtectedRoute><AppointmentBookingPage /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute><AppointmentHistoryPage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
              
              {/* Catch-all */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                  <h1 className="text-4xl font-bold mb-4">404</h1>
                  <p className="text-muted-foreground mb-6">Page not found</p>
                  <a href="/" className="text-primary hover:underline">Return Home</a>
                </div>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster position="top-center" />
      </Router>
    </AuthProvider>
  );
}

export default App;