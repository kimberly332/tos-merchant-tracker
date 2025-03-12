import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavigationBar from './components/layout/NavigationBar';
import HomePage from './pages/HomePage';
import AddMerchantPage from './pages/AddMerchantPage';
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;