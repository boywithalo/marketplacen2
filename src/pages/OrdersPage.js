import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Log user info for debugging
        console.log("Fetching orders for user:", auth.currentUser.uid);
        
        // First try with the composite index
        try {
          const q = query(
            collection(db, 'orders'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          const ordersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));
          
          console.log("Orders fetched:", ordersData.length);
          setOrders(ordersData);
          setError(null);
        } catch (indexError) {
          console.error('Index error, trying without orderBy:', indexError);
          
          // Fallback to query without orderBy if index doesn't exist
          const simpleQuery = query(
            collection(db, 'orders'),
            where('userId', '==', auth.currentUser.uid)
          );
          
          const querySnapshot = await getDocs(simpleQuery);
          const ordersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));
          
          // Sort client-side instead
          ordersData.sort((a, b) => b.createdAt - a.createdAt);
          
          console.log("Orders fetched (fallback):", ordersData.length);
          setOrders(ordersData);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        // More detailed error message
        setError(`Failed to load orders: ${err.message}. Please check your connection and try again.`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
        <p className="text-gray-600 mb-8">You need to be logged in to view your orders.</p>
        <Link 
          to="/login" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full"
        >
          Log In
        </Link>
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

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">No Orders Found</h2>
        <p className="text-gray-600 mb-8">You haven't placed any orders yet.</p>
        <Link 
          to="/" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <div className="flex flex-wrap justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">Order #{order.id.substring(0, 8)}</h2>
                  <p className="text-sm text-gray-600">
                    Placed on {order.createdAt.toLocaleDateString()} at {order.createdAt.toLocaleTimeString()}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-600 ml-2">x{item.quantity}</span>
                      </div>
                      <span>${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between mb-1">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold mt-2">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <p>
                  {order.customer.name}<br />
                  {order.shipping.address}<br />
                  {order.shipping.city}, {order.shipping.state} {order.shipping.zipCode}<br />
                  {order.shipping.country}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;