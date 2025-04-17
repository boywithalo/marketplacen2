import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from '../firebase'; // Import your Firebase auth instance

const LoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      // Trigger Google Sign-In popup
      await signInWithPopup(auth, provider);
      // Firebase's onAuthStateChanged in App.js will handle the state update.
      // Redirect the user to the home page after successful login.
      navigate('/');
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
    // No need to setLoading(false) on success because we navigate away
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"> {/* Adjust height based on Navbar/Footer */}
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
      >
        {loading ? 'Signing In...' : 'Sign In with Google'}
      </button>
      {/* You could add other login methods here later (e.g., email/password) */}
    </div>
  );
};

export default LoginPage;