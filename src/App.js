import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavigationBar from './components/layout/NavigationBar';
import HomePage from './pages/HomePage';
import AddMerchantPage from './pages/AddMerchantPage';
import EditMerchantPage from './pages/EditMerchantPage';
import LoginPage from './pages/LoginPage';
import UserGuidePage from './pages/UserGuidePage'; // 新增使用說明頁面
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
            {/* 公開路由 */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* 新增使用說明頁面 */}
            <Route path="/guide" element={
              <ProtectedRoute>
                <UserGuidePage />
              </ProtectedRoute>
            } />
            
            {/* 受保護的路由 */}
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
            <Route path="/edit-merchant/:merchantId" element={
              <ProtectedRoute>
                <EditMerchantPage />
              </ProtectedRoute>
            } />
            
            {/* 找不到頁面導向登入 */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </main>
        <ShoppingCart />
      </div>
    </Router>
  );
}

export default App;