import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase';
import './App.css';

// Import layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Import context providers
import { ProductProvider } from './contexts/ProductContext';
import { CartProvider } from './contexts/CartContext';

// Import page components
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import AdminPage from './pages/AdminPage';

// 404 Page
const NotFoundPage = () => (
  <div className="text-center py-16">
    <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
    <p className="text-gray-600 mb-8">The page you are looking for doesn't exist or has been moved.</p>
    <a href="/" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full">
      Go Home
    </a>
  </div>
);

// Protected Route component
const ProtectedRoute = ({ children, user, redirectPath = '/login' }) => {
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      console.log("Auth state changed:", currentUser);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ProductProvider>
      <CartProvider>
        <Router>
          <Navbar user={user} />
          <main className="container mx-auto p-4 flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:productId" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={
                <ProtectedRoute user={user}>
                  <CheckoutPage />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/orders" element={
                <ProtectedRoute user={user}>
                  <OrdersPage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute user={user}>
                  <AdminPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </Router>
      </CartProvider>
    </ProductProvider>
  );
}

// Add basic flex styles to ensure footer stays at the bottom if content is short
const appStyle = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh'
};

function StyledApp() {
  return (
    <div style={appStyle}>
      <App />
    </div>
  )
}

export default StyledApp;
