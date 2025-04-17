import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from '../../firebase';
import { useCart } from '../../contexts/CartContext';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">E-Commerce</Link>
        <div className="flex items-center space-x-4">
          <Link to="/cart" className="hover:text-gray-300 relative">
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link to="/orders" className="hover:text-gray-300">My Orders</Link>
              <span className="text-sm">Hi, {user.displayName || user.email?.split('@')[0]}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:text-gray-300">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;