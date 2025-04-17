import React, { useState, useEffect } from 'react';
import { getAllProducts, deleteProduct } from '../../services/productService';
import { useProducts } from '../../contexts/ProductContext';

const ProductList = ({ onEditProduct }) => {
  const { products, loading, error, refreshProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        await deleteProduct(productId);
        refreshProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

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
          onClick={refreshProducts}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      
      {filteredProducts.length === 0 ? (
        <p className="text-center py-8 text-gray-500">
          {searchTerm ? 'No products match your search.' : 'No products found.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Image</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Price</th>
                <th className="py-3 px-4 text-left">Stock</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded">
                        <span className="text-gray-500 text-xs">No image</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium">{product.name}</td>
                  <td className="py-3 px-4">${product.price.toFixed(2)}</td>
                  <td className="py-3 px-4">{product.stock}</td>
                  <td className="py-3 px-4">{product.category}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col space-y-1">
                      {product.featured && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Featured</span>
                      )}
                      {product.bestseller && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Bestseller</span>
                      )}
                      {product.stock <= 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Out of Stock</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEditProduct(product)}
                        className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={isDeleting}
                        className="bg-red-500 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductList;