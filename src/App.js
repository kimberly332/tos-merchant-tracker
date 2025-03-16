import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavigationBar from './components/layout/NavigationBar';
import HomePage from './pages/HomePage';
import AddMerchantPage from './pages/AddMerchantPage';
import EditMerchantPage from './pages/EditMerchantPage';
import LoginPage from './pages/LoginPage';
import UserGuidePage from './pages/UserGuidePage';
// Removed CartDetailPage import
import ShoppingCart from './components/cart/ShoppingCart';
import { checkUserAuth } from './firebase/userAuth';
import './styles/main.css';

// 受保護的路由組件
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const user = checkUserAuth();
      setIsAuthenticated(!!user);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="app">
        <NavigationBar />
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Guide page */}
            <Route path="/guide" element={
              <ProtectedRoute>
                <UserGuidePage />
              </ProtectedRoute>
            } />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/add-merchant" element={
              <ProtectedRoute>
                <AddMerchantPage />
              </ProtectedRoute>
            } />
            {/* Add new edit route */}
            <Route path="/edit-merchant/:id" element={
              <ProtectedRoute>
                <EditMerchantPage />
              </ProtectedRoute>
            } />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
      <ShoppingCart />
    </Router>
  );
}

export default App;