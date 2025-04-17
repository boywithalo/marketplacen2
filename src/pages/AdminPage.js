import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useProducts } from '../contexts/ProductContext';
import ProductForm from '../components/admin/ProductForm';
import ProductList from '../components/admin/ProductList';

// Admin emails - in a real app, this would be stored in Firestore or managed through Firebase Auth custom claims
const ADMIN_EMAILS = ['mmangoouu@gmail.com', 'test@example.com'];

const AdminPage = () => {
  const navigate = useNavigate();
  const { refreshProducts, products } = useProducts();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  });

  // Check if user is admin
  const isAdmin = auth.currentUser && (
    ADMIN_EMAILS.includes(auth.currentUser.email) || 
    auth.currentUser.email === 'mmangoouu@gmail.com'
  );

  useEffect(() => {
    // Redirect non-admin users
    if (auth.currentUser === null) {
      navigate('/login');
      return;
    }
    
    if (!isAdmin) {
      navigate('/');
      return;
    }

    // Log authentication info for debugging
    console.log("Current user:", auth.currentUser?.email);
    console.log("Is admin:", isAdmin);

    // Fetch data based on active tab
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [navigate, isAdmin, activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent orders
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      try {
        const ordersSnapshot = await getDocs(ordersQuery);
        const recentOrders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setOrders(recentOrders);
      } catch (orderErr) {
        console.error('Error fetching orders:', orderErr);
        // Continue with other operations even if orders fetch fails
        setOrders([]);
      }
      
      // Calculate dashboard stats - wrapped in try/catch to handle partial failures
      try {
        const allOrdersSnapshot = await getDocs(collection(db, 'orders'));
        const allOrders = allOrdersSnapshot.docs.map(doc => doc.data());
        
        const totalOrders = allOrders.length;
        const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const pendingOrders = allOrders.filter(order => 
          order.status === 'processing' || order.status === 'shipped'
        ).length;
        
        // Count low stock products (less than 5 items)
        const lowStockProducts = products.filter(product => product.stock < 5).length;
        
        setDashboardStats({
          totalOrders,
          totalRevenue,
          pendingOrders,
          lowStockProducts
        });
      } catch (statsErr) {
        console.error('Error calculating stats:', statsErr);
        // Keep default stats if calculation fails
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please check Firebase permissions and try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      // Sort by date (newest first)
      ordersData.sort((a, b) => b.createdAt - a.createdAt);
      
      setOrders(ordersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please check Firebase permissions and try again later.');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      // If viewing order details, update that too
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleProductFormClose = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleProductSaved = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    refreshProducts();
  };
  
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };
  
  const handleCloseOrderDetails = () => {
    setSelectedOrder(null);
  };

  if (loading && (activeTab === 'orders' || activeTab === 'dashboard')) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'dashboard' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'products' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'orders' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
      </div>
      
      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Dashboard Overview</h2>
          
          {error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <button 
                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={fetchDashboardData}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                  <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
                  <p className="text-3xl font-bold">{dashboardStats.totalOrders}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                  <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                  <p className="text-3xl font-bold">${dashboardStats.totalRevenue.toFixed(2)}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                  <h3 className="text-gray-500 text-sm font-medium">Pending Orders</h3>
                  <p className="text-3xl font-bold">{dashboardStats.pendingOrders}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                  <h3 className="text-gray-500 text-sm font-medium">Low Stock Products</h3>
                  <p className="text-3xl font-bold">{dashboardStats.lowStockProducts}</p>
                </div>
              </div>
              
              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                
                {orders.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No orders found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewOrder(order)}>
                            <td className="py-2 px-3 whitespace-nowrap">{order.id.substring(0, 8)}</td>
                            <td className="py-2 px-3 whitespace-nowrap">{order.createdAt.toLocaleDateString()}</td>
                            <td className="py-2 px-3 whitespace-nowrap">{order.customer?.name || 'N/A'}</td>
                            <td className="py-2 px-3 whitespace-nowrap">${order.total?.toFixed(2) || '0.00'}</td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="mt-4 text-right">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                  >
                    View All Orders →
                  </button>
                </div>
              </div>
              
              {/* Low Stock Products */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Low Stock Products</h3>
                
                {products.filter(p => p.stock < 5).length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No low stock products found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {products.filter(p => p.stock < 5).slice(0, 5).map(product => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 whitespace-nowrap">{product.name}</td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                product.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {product.stock} left
                              </span>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                              >
                                Update Stock
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="mt-4 text-right">
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                  >
                    Manage All Products →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Manage Products</h2>
            <button
              onClick={handleAddProduct}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Add New Product
            </button>
          </div>
          
          <ProductList onEditProduct={handleEditProduct} />
        </div>
      )}
      
      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Manage Orders</h2>
          
          {error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <button 
                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={fetchOrders}
              >
                Retry
              </button>
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Order ID</th>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Customer</th>
                    <th className="py-3 px-4 text-left">Total</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{order.id.substring(0, 8)}</td>
                      <td className="py-3 px-4">{order.createdAt.toLocaleDateString()}</td>
                      <td className="py-3 px-4">{order.customer?.name || 'N/A'}</td>
                      <td className="py-3 px-4">${order.total?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <select
                            value={order.status || ''}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
                          >
                            View
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
      )}
      
      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              
              <ProductForm 
                product={editingProduct}
                onSave={handleProductSaved}
                onCancel={handleProductFormClose}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button
                  onClick={handleCloseOrderDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Order ID:</span>
                  <span>{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Date:</span>
                  <span>{selectedOrder.createdAt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Status:</span>
                  <select
                    value={selectedOrder.status || ''}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p><span className="font-medium">Name:</span> {selectedOrder.customer?.name || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.customer?.email || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {selectedOrder.customer?.phone || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p>{selectedOrder.shipping?.address || 'N/A'}</p>
                  <p>{selectedOrder.shipping?.city || 'N/A'}, {selectedOrder.shipping?.state || 'N/A'} {selectedOrder.shipping?.zipCode || 'N/A'}</p>
                  <p>{selectedOrder.shipping?.country || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-3 text-left border-b">Product</th>
                        <th className="py-2 px-3 text-right border-b">Price</th>
                        <th className="py-2 px-3 text-right border-b">Quantity</th>
                        <th className="py-2 px-3 text-right border-b">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-3">{item.name}</td>
                          <td className="py-2 px-3 text-right">${item.price?.toFixed(2) || '0.00'}</td>
                          <td className="py-2 px-3 text-right">{item.quantity}</td>
                          <td className="py-2 px-3 text-right">${item.subtotal?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span>${selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Tax:</span>
                    <span>${selectedOrder.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${selectedOrder.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="font-semibold">Payment Method:</span>
                <span className="capitalize">{selectedOrder.paymentMethod || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;