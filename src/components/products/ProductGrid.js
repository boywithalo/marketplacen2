import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, title, emptyMessage = "No products found" }) => {
  return (
    <div className="my-8">
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      
      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGrid;