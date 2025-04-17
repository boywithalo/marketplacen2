import React from 'react';
import { useProducts } from '../contexts/ProductContext';
import ProductGrid from '../components/products/ProductGrid';

const HomePage = () => {
  const { featuredProducts, bestsellerProducts, loading, error } = useProducts();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <button 
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-12 px-4 rounded-lg mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Our E-Commerce Store</h1>
          <p className="text-xl mb-6">Discover amazing products at unbeatable prices</p>
          <button className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-2 px-6 rounded-full">
            Shop Now
          </button>
        </div>
      </div>

      {/* Featured Products */}
      <ProductGrid 
        products={featuredProducts} 
        title="Featured Products" 
        emptyMessage="No featured products available at the moment."
      />

      {/* Bestsellers */}
      <ProductGrid 
        products={bestsellerProducts} 
        title="Bestsellers" 
        emptyMessage="No bestseller products available at the moment."
      />
    </div>
  );
};

export default HomePage;