import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { addProduct, updateProduct } from '../../services/productService';

const ProductForm = ({ product, onSave, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.imageUrl || '');
  const [tags, setTags] = useState(product?.tags || []);
  const [tagInput, setTagInput] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || '',
      category: product?.category || '',
      stock: product?.stock || 0,
      featured: product?.featured || false,
      bestseller: product?.bestseller || false
    }
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Prepare product data
      const productData = {
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        tags
      };
      
      if (product) {
        // Update existing product
        await updateProduct(product.id, productData, imageFile);
      } else {
        // Add new product
        await addProduct(productData, imageFile);
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              {...register('name', { required: 'Product name is required' })}
              className="w-full border rounded px-3 py-2"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows="4"
              className="w-full border rounded px-3 py-2"
            ></textarea>
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('price', { 
                  required: 'Price is required',
                  min: { value: 0, message: 'Price must be positive' }
                })}
                className="w-full border rounded px-3 py-2"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Stock</label>
              <input
                type="number"
                min="0"
                {...register('stock', { 
                  required: 'Stock is required',
                  min: { value: 0, message: 'Stock cannot be negative' }
                })}
                className="w-full border rounded px-3 py-2"
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Category</label>
            <input
              type="text"
              {...register('category', { required: 'Category is required' })}
              className="w-full border rounded px-3 py-2"
            />
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Tags</label>
            <div className="flex">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-grow border rounded-l px-3 py-2"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-r"
              >
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <span key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded flex items-center">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-gray-500 hover:text-red-500"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full border rounded px-3 py-2"
            />
            
            {imagePreview && (
              <div className="mt-2 border rounded p-2">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="max-h-48 mx-auto"
                />
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                {...register('featured')}
                className="mr-2"
              />
              <label htmlFor="featured">Featured Product</label>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="bestseller"
                {...register('bestseller')}
                className="mr-2"
              />
              <label htmlFor="bestseller">Bestseller</label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-6 space-x-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {isSubmitting ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;