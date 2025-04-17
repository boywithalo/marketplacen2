// Basic product model structure
class Product {
  constructor(id, data) {
    this.id = id;
    this.name = data.name || '';
    this.description = data.description || '';
    this.price = data.price || 0;
    this.imageUrl = data.imageUrl || '';
    this.category = data.category || '';
    this.tags = data.tags || [];
    this.stock = data.stock || 0;
    this.featured = data.featured || false;
    this.bestseller = data.bestseller || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Helper method to convert Firestore document to Product
  static fromFirestore(doc) {
    const data = doc.data();
    return new Product(doc.id, {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    });
  }

  // Helper method to convert Product to Firestore document
  toFirestore() {
    return {
      name: this.name,
      description: this.description,
      price: this.price,
      imageUrl: this.imageUrl,
      category: this.category,
      tags: this.tags,
      stock: this.stock,
      featured: this.featured,
      bestseller: this.bestseller,
      createdAt: this.createdAt,
      updatedAt: new Date()
    };
  }
}

export default Product;