import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { useCart } from '../contexts/CartContext';

const ProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(productId);
        setProduct(productData);
        setError(null);
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      // Optional: Show a toast notification
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (product?.stock || 10)) {
      setQuantity(value);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error || 'Product not found'}</p>
        <button 
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="bg-white rounded-lg overflow-hidden shadow-md">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-auto object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No image available</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
          <p className="text-2xl font-bold text-blue-600 mb-4">${product.price.toFixed(2)}</p>
          
          <div className="mb-6">
            <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
          </div>

          {product.stock > 0 ? (
            <div className="mb-6">
              <p className="text-green-600 mb-2">In Stock: {product.stock} available</p>
              
              <div className="flex items-center mb-4">
                <label htmlFor="quantity" className="mr-2">Quantity:</label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-16 border rounded px-2 py-1"
                />
              </div>
              
              <button
                onClick={handleAddToCart}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full"
              >
                Add to Cart
              </button>
            </div>
          ) : (
            <p className="text-red-500 mb-4">Out of Stock</p>
          )}

          {/* Product Metadata */}
          <div className="mt-8 border-t pt-4">
            <p className="text-gray-600">
              <span className="font-semibold">Category:</span> {product.category}
            </p>
            {product.tags && product.tags.length > 0 && (
              <div className="mt-2">
                <span className="font-semibold text-gray-600">Tags:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;