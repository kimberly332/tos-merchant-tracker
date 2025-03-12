import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavigationBar from './components/layout/NavigationBar';
import HomePage from './pages/HomePage';
import AddMerchantPage from './pages/AddMerchantPage';
import AddSpecialMerchantPage from './pages/AddSpecialMerchantPage';
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="app">
        <NavigationBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add-merchant" element={<AddMerchantPage />} />
            <Route path="/add-special-merchant" element={<AddSpecialMerchantPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;