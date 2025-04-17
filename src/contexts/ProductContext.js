import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAllProducts, getFeaturedProducts, getBestsellerProducts } from '../services/productService';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const [allProducts, featured, bestsellers] = await Promise.all([
          getAllProducts(),
          getFeaturedProducts(),
          getBestsellerProducts()
        ]);
        
        setProducts(allProducts);
        setFeaturedProducts(featured);
        setBestsellerProducts(bestsellers);
        setError(null);
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Refresh products (useful after adding/updating/deleting)
  const refreshProducts = async () => {
    try {
      setLoading(true);
      const [allProducts, featured, bestsellers] = await Promise.all([
        getAllProducts(),
        getFeaturedProducts(),
        getBestsellerProducts()
      ]);
      
      setProducts(allProducts);
      setFeaturedProducts(featured);
      setBestsellerProducts(bestsellers);
      setError(null);
    } catch (err) {
      console.error('Error refreshing products:', err);
      setError('Failed to refresh products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    products,
    featuredProducts,
    bestsellerProducts,
    loading,
    error,
    refreshProducts
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductContext;