import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import Product from '../models/Product';

const PRODUCTS_COLLECTION = 'products';

// Get all products
export const getAllProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    return querySnapshot.docs.map(doc => Product.fromFirestore(doc));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Get featured products
export const getFeaturedProducts = async (limitCount = 6) => {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('featured', '==', true),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => Product.fromFirestore(doc));
  } catch (error) {
    console.error('Error getting featured products:', error);
    throw error;
  }
};

// Get bestseller products
export const getBestsellerProducts = async (limitCount = 8) => {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('bestseller', '==', true),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => Product.fromFirestore(doc));
  } catch (error) {
    console.error('Error getting bestseller products:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (productId) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return Product.fromFirestore(docSnap);
    } else {
      throw new Error(`Product with ID ${productId} not found`);
    }
  } catch (error) {
    console.error('Error getting product by ID:', error);
    throw error;
  }
};

// Add a new product with improved image handling
export const addProduct = async (productData, imageFile) => {
  try {
    let imageUrl = '';
    
    // Upload image if provided
    if (imageFile) {
      try {
        // Create a more unique filename with timestamp
        const timestamp = Date.now();
        const safeFilename = imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filename = `${timestamp}_${safeFilename}`;
        const storageRef = ref(storage, `products/${filename}`);
        
        console.log('Uploading image:', filename);
        
        // Set metadata with content type
        const metadata = {
          contentType: imageFile.type,
          customMetadata: {
            'uploaded-by': 'web-app'
          }
        };
        
        // Upload with metadata and handle errors better
        await uploadBytes(storageRef, imageFile, metadata)
          .then(async (snapshot) => {
            console.log('Upload complete, getting URL...');
            return getDownloadURL(snapshot.ref);
          })
          .then((url) => {
            console.log('Image URL obtained:', url);
            imageUrl = url;
          })
          .catch((error) => {
            console.error('Error in upload process:', error);
            // Continue with product creation even if image upload fails
          });
      } catch (imageError) {
        console.error('Error handling image upload:', imageError);
        // Continue with product creation even if image upload fails
      }
    }
    
    const product = new Product(null, {
      ...productData,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), product.toFirestore());
    return { ...product, id: docRef.id };
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update product with improved image handling
export const updateProduct = async (productId, productData, imageFile) => {
  try {
    let imageUrl = productData.imageUrl;
    
    // Upload new image if provided
    if (imageFile) {
      try {
        // Create a more unique filename with timestamp
        const timestamp = Date.now();
        const safeFilename = imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filename = `${timestamp}_${safeFilename}`;
        const storageRef = ref(storage, `products/${filename}`);
        
        console.log('Uploading new image:', filename);
        
        // Set metadata with content type
        const metadata = {
          contentType: imageFile.type,
          customMetadata: {
            'uploaded-by': 'web-app'
          }
        };
        
        // Upload with metadata and handle errors better
        await uploadBytes(storageRef, imageFile, metadata)
          .then(async (snapshot) => {
            console.log('Upload complete, getting URL...');
            return getDownloadURL(snapshot.ref);
          })
          .then((url) => {
            console.log('Image URL obtained:', url);
            imageUrl = url;
          })
          .catch((error) => {
            console.error('Error in upload process:', error);
            // Keep existing image URL if upload fails
          });
      } catch (imageError) {
        console.error('Error handling image upload:', imageError);
        // Keep existing image URL if upload fails
      }
    }
    
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const updatedData = {
      ...productData,
      imageUrl,
      updatedAt: new Date()
    };
    
    await updateDoc(productRef, updatedData);
    return { id: productId, ...updatedData };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Add the missing updateProductStock function
export const updateProductStock = async (productId, newStockAmount) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, {
      stock: newStockAmount,
      updatedAt: new Date()
    });
    console.log(`Stock updated for product ${productId}: ${newStockAmount}`);
    return true;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
};

// Delete a product
export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }
    
    const product = Product.fromFirestore(productSnap);
    
    // Delete image if exists
    if (product.imageUrl) {
      try {
        const imageRef = ref(storage, product.imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn('Error deleting image:', error);
        // Continue even if image deletion fails
      }
    }
    
    await deleteDoc(productRef);
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Search products
export const searchProducts = async (searchTerm, category = null) => {
  try {
    // Note: Firestore doesn't support native text search
    // For a real app, consider using Algolia or similar
    // This is a simple implementation that gets all products and filters client-side
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const products = querySnapshot.docs.map(doc => Product.fromFirestore(doc));
    
    return products.filter(product => {
      const matchesSearch = searchTerm ? 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
        
      const matchesCategory = category ? 
        product.category === category 
        : true;
        
      return matchesSearch && matchesCategory;
    });
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

export default {
  getAllProducts,
  getFeaturedProducts,
  getBestsellerProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  updateProductStock
};

