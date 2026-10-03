import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import HomePage from './HomePage';
import CartPage from './CartPage';
import MyRentalsPage from './MyRentalsPage';
import KYCPage from './KYCPage';
import AdminDashboard from './AdminDashboard';
import OwnerDashboard from './OwnerDashboard';
import RentoraConcierge from './RentoraConcierge';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('access_token');
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('access_token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogin = (token) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <RegisterPage onLogin={handleLogin} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <HomePage onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/cart" 
          element={isAuthenticated ? <CartPage onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/rentals" 
          element={isAuthenticated ? <MyRentalsPage onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/kyc" 
          element={isAuthenticated ? <KYCPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin" 
          element={isAuthenticated ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/owner" 
          element={isAuthenticated ? <OwnerDashboard onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
      </Routes>
      <RentoraConcierge />
    </Router>
  );
}

export default App;
