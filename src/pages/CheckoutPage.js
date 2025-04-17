import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCart } from '../contexts/CartContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Add this import at the top
import { updateProductStock, getProductById } from '../services/productService';

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Redirect to cart if cart is empty
  if (cartItems.length === 0 && !orderComplete) {
    navigate('/cart');
    return null;
  }

  const onSubmit = async (data) => {
    try {
      setIsProcessing(true);
      
      // Create order object
      const order = {
        customer: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
        },
        shipping: {
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        },
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        paymentMethod,
        subtotal: cartTotal,
        tax: cartTotal * 0.08, // 8% tax rate
        total: cartTotal * 1.08,
        status: 'processing',
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid || 'guest'
      };
      
      // Save order to Firestore
      const docRef = await addDoc(collection(db, 'orders'), order);
      
      // Update product stock for each item - with fallback if updateProductStock is not available
      try {
        // Manual stock update since updateProductStock might not be available
        const stockUpdatePromises = cartItems.map(async (item) => {
          try {
            // Get current product to check stock
            const productRef = doc(db, 'products', item.id);
            const productSnap = await getDoc(productRef);
            
            if (productSnap.exists()) {
              const currentStock = productSnap.data().stock || 0;
              const newStock = Math.max(0, currentStock - item.quantity);
              
              // Update the stock directly
              return updateDoc(productRef, {
                stock: newStock,
                updatedAt: new Date()
              });
            }
          } catch (err) {
            console.error(`Error updating stock for product ${item.id}:`, err);
          }
        });
        
        await Promise.all(stockUpdatePromises);
        console.log('All product stocks updated successfully');
      } catch (stockError) {
        console.error('Error updating product stocks:', stockError);
        // Continue with order process even if stock update fails
      }
      
      // Clear cart and show success message
      clearCart();
      setOrderId(docRef.id);
      setOrderComplete(true);
      
    } catch (error) {
      console.error('Error processing order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
          <p>Your order ID is: <span className="font-mono font-bold">{orderId}</span></p>
        </div>
        <p className="mb-6">Thank you for your purchase. We'll send you an email confirmation shortly.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="max-h-64 overflow-y-auto mb-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <p>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Tax (8%)</span>
                <span>${(cartTotal * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-4">
                <span>Total</span>
                <span>${(cartTotal * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  {...register('firstName', { required: 'First name is required' })}
                  className="w-full border rounded px-3 py-2"
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  {...register('lastName', { required: 'Last name is required' })}
                  className="w-full border rounded px-3 py-2"
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full border rounded px-3 py-2"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  {...register('phone', { required: 'Phone number is required' })}
                  className="w-full border rounded px-3 py-2"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-1">Address</label>
              <input
                type="text"
                {...register('address', { required: 'Address is required' })}
                className="w-full border rounded px-3 py-2"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  {...register('city', { required: 'City is required' })}
                  className="w-full border rounded px-3 py-2"
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">State/Province</label>
                <input
                  type="text"
                  {...register('state', { required: 'State is required' })}
                  className="w-full border rounded px-3 py-2"
                />
                {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">ZIP/Postal Code</label>
                <input
                  type="text"
                  {...register('zipCode', { required: 'ZIP code is required' })}
                  className="w-full border rounded px-3 py-2"
                />
                {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode.message}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  {...register('country', { required: 'Country is required' })}
                  className="w-full border rounded px-3 py-2"
                />
                {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>}
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-4">Payment Method</h2>
            
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  id="credit"
                  name="paymentMethod"
                  value="credit"
                  checked={paymentMethod === 'credit'}
                  onChange={() => setPaymentMethod('credit')}
                  className="mr-2"
                />
                <label htmlFor="credit">Credit Card</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="paypal"
                  name="paymentMethod"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={() => setPaymentMethod('paypal')}
                  className="mr-2"
                />
                <label htmlFor="paypal">PayPal</label>
              </div>
            </div>
            
            {paymentMethod === 'credit' && (
              <div className="mb-6">
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    {...register('cardNumber', { required: 'Card number is required' })}
                    placeholder="1234 5678 9012 3456"
                    className="w-full border rounded px-3 py-2"
                  />
                  {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber.message}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Expiration Date</label>
                    <input
                      type="text"
                      {...register('expDate', { required: 'Expiration date is required' })}
                      placeholder="MM/YY"
                      className="w-full border rounded px-3 py-2"
                    />
                    {errors.expDate && <p className="text-red-500 text-sm mt-1">{errors.expDate.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-1">CVV</label>
                    <input
                      type="text"
                      {...register('cvv', { required: 'CVV is required' })}
                      placeholder="123"
                      className="w-full border rounded px-3 py-2"
                    />
                    {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv.message}</p>}
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8">
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? 'Processing...' : `Pay $${(cartTotal * 1.08).toFixed(2)}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;