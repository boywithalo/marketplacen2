import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
    // Optional: Show a toast notification
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      <Link to={`/product/${product.id}`} className="block">
        <div className="h-48 overflow-hidden">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
          <p className="text-gray-600 text-sm mt-1 h-12 overflow-hidden">
            {product.description.substring(0, 60)}
            {product.description.length > 60 ? '...' : ''}
          </p>
          <div className="mt-3 flex justify-between items-center">
            <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
            <button
              onClick={handleAddToCart}
              className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-sm"
            >
              Add to Cart
            </button>
          </div>
          {product.stock <= 0 && (
            <span className="block mt-2 text-red-500 text-sm">Out of stock</span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;