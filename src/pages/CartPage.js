import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const CartPage = () => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
        <p className="text-gray-600 mb-8">Add some products to your cart to see them here.</p>
        <Link 
          to="/" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          {cartItems.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row items-center py-4 border-b last:border-b-0">
              {/* Product Image */}
              <div className="w-24 h-24 flex-shrink-0 mr-4 mb-4 sm:mb-0">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded">
                    <span className="text-gray-500 text-xs">No image</span>
                  </div>
                )}
              </div>
              
              {/* Product Details */}
              <div className="flex-grow mb-4 sm:mb-0 text-center sm:text-left">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-gray-600 text-sm">${item.price.toFixed(2)} each</p>
              </div>
              
              {/* Quantity Controls */}
              <div className="flex items-center mr-4">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded-l"
                >
                  -
                </button>
                <span className="bg-gray-100 py-1 px-4">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded-r"
                >
                  +
                </button>
              </div>
              
              {/* Item Total & Remove */}
              <div className="text-right">
                <p className="text-lg font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm mt-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Cart Summary */}
        <div className="bg-gray-50 p-6 border-t">
          <div className="flex justify-between mb-4">
            <span className="font-semibold">Subtotal:</span>
            <span className="font-semibold">${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-6 text-sm text-gray-600">
            <span>Shipping:</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex justify-between items-center">
            <Link to="/" className="text-blue-500 hover:text-blue-700">
              Continue Shopping
            </Link>
            <button 
              onClick={() => navigate('/checkout')}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;