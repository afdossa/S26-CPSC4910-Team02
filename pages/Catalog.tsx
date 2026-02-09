
import React, { useState, useEffect, useCallback } from 'react';
// Added Link to imports from react-router-dom
import { useLocation, Link } from 'react-router-dom';
import { getCatalog, getSponsors, updateDriverPoints, addNotification, getTransactions } from '../services/mockData';
import { Product, User, SponsorOrganization, CartItem, PointTransaction } from '../types';
import { Search, ShoppingCart, DollarSign, Tag, Loader, Check, X, Trash2, Plus, Minus, CreditCard, CheckCircle, AlertCircle, Receipt, Package, ArrowRight, History, Clock, Calendar } from 'lucide-react';

interface CatalogProps {
  user: User;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  onPurchaseSuccess: (points: number) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ 
  user, 
  cart, 
  addToCart, 
  updateQuantity, 
  removeItem, 
  clearCart, 
  onPurchaseSuccess 
}) => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSponsor, setActiveSponsor] = useState<SponsorOrganization | undefined>(undefined);
  const [addingId, setAddingId] = useState<string | null>(null);
  
  // UI States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<{ items: CartItem[], total: number, id: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogList, sponsorList, txList] = await Promise.all([
        getCatalog(),
        getSponsors(),
        getTransactions()
      ]);
      setProducts(catalogList);
      // Filter for purchases only
      setPurchaseHistory(txList.filter(tx => tx.type === 'PURCHASE'));
      
      if (user.sponsorId) {
        setActiveSponsor(sponsorList.find(s => s.id === user.sponsorId));
      }
    } catch (e) {
      console.error("Failed to load catalog data", e);
    } finally {
      setLoading(false);
    }
  }, [user.sponsorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('cart') === 'open') {
      setIsCartOpen(true);
      setIsHistoryOpen(false);
    }
  }, [location.search]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriceUSD = (points: number) => {
    const ratio = activeSponsor?.pointDollarRatio || 0.01;
    return (points * ratio).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const handleAddToCart = (product: Product) => {
    if(!product.availability) return;
    addToCart(product);
    setAddingId(product.id);
    setIsCartOpen(true); 
    setIsHistoryOpen(false);
    setTimeout(() => setAddingId(null), 1000);
  };

  const totalPoints = cart.reduce((acc, item) => acc + (item.pricePoints * item.quantity), 0);
  const ratio = activeSponsor?.pointDollarRatio || 0.01;
  const totalUSD = (totalPoints * ratio).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const initiateCheckout = () => {
    if (cart.length === 0) return;
    if ((user.pointsBalance || 0) < totalPoints) {
      alert("Insufficient points for this purchase.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleCheckout = async () => {
    setShowConfirmModal(false);
    setIsPurchasing(true);
    try {
      const result = await updateDriverPoints(
        user.id,
        -totalPoints,
        `Purchase: ${cart.map(i => `${i.name} (x${i.quantity})`).join(', ')}`,
        activeSponsor?.name || 'Sponsor',
        activeSponsor?.id,
        'PURCHASE'
      );

      if (result.success) {
        const orderId = `DW-${Math.floor(Math.random() * 90000) + 10000}`;
        const summary = {
          items: [...cart],
          total: totalPoints,
          id: orderId
        };
        
        setLastOrder(summary);
        
        // Add persistent summary notification
        await addNotification(
            user.id,
            'Order Confirmed',
            `Your purchase of ${cart.length} item(s) for ${totalPoints.toLocaleString()} points was successful. Order ID: ${orderId}.`,
            'ORDER_CONFIRMATION',
            { orderSummary: summary }
        );
        
        onPurchaseSuccess(totalPoints);
        clearCart();
        setIsCartOpen(false); 
        setShowSuccessModal(true);
        // Refresh history after purchase
        loadData();
      } else {
        alert("Purchase failed: " + result.message);
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during checkout.");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500">Loading catalog items...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex overflow-hidden">
      
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-amber-100 p-3 rounded-full">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">Confirm Purchase</h3>
            <p className="text-gray-500 text-center mb-6">
              You are about to spend <span className="font-bold text-gray-900">{totalPoints.toLocaleString()} points</span> ({totalUSD}) for your selected rewards.
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleCheckout}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
              >
                Confirm and Place Order
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-green-600 p-8 text-center text-white">
              <div className="inline-flex items-center justify-center bg-white/20 rounded-full p-4 mb-4 backdrop-blur-md">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-black mb-1">Order Confirmed!</h3>
              <p className="text-green-50 font-medium">A summary has been added to your notifications.</p>
            </div>
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center text-gray-400 text-sm font-bold uppercase tracking-widest">
                  <Receipt className="w-4 h-4 mr-2" />
                  Order Summary
                </div>
                <div className="text-gray-900 font-mono text-sm font-bold bg-gray-100 px-2 py-1 rounded">
                  {lastOrder?.id}
                </div>
              </div>

              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {lastOrder?.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 font-bold text-xs border border-gray-100 group-hover:border-green-200 transition-colors">
                        x{item.quantity}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                          {item.pricePoints.toLocaleString()} pts
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-gray-700">
                      {(item.pricePoints * item.quantity).toLocaleString()} <span className="text-[10px] text-gray-400">PTS</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-200 pt-6 space-y-3">
                <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                  <span>Subtotal</span>
                  <span>{lastOrder?.total.toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between items-center text-xl font-black text-gray-900">
                  <span>Total Spent</span>
                  <span className="text-green-600">{lastOrder?.total.toLocaleString()} <span className="text-xs text-gray-400 uppercase">pts</span></span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center group"
                >
                  Close
                </button>
                <Link 
                  to="/dashboard?tab=notifications"
                  className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all flex items-center justify-center shadow-lg shadow-green-100"
                >
                  View Notifications <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-grow transition-all duration-300 ${(isCartOpen || isHistoryOpen) ? 'mr-96' : ''}`}>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Rewards Catalog</h1>
                <p className="mt-2 text-gray-600">
                    Prices in USD based on 
                    <span className="font-bold text-blue-600"> {activeSponsor?.name || 'Standard'} </span> 
                    rates.
                </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="relative max-w-md w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => { setIsHistoryOpen(!isHistoryOpen); setIsCartOpen(false); }}
                    className={`relative p-2 rounded-md shadow-sm transition-all ${isHistoryOpen ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    title="Purchase History"
                  >
                    <History className="w-6 h-6" />
                  </button>

                  <button 
                    onClick={() => { setIsCartOpen(!isCartOpen); setIsHistoryOpen(false); }}
                    className={`relative p-2 rounded-md shadow-sm transition-all ${isCartOpen ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    title="View Cart"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {cart.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                        {cart.reduce((acc, item) => acc + item.quantity, 0)}
                      </span>
                    )}
                  </button>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group relative bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="aspect-w-3 aspect-h-4 bg-gray-100 group-hover:opacity-90 h-52 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-center object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  {!product.availability && (
                    <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center backdrop-blur-[2px]">
                       <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm uppercase tracking-wider">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-5 space-y-3 flex flex-col">
                  <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                          {product.name}
                      </h3>
                  </div>
                  <p className="text-sm text-gray-500 flex-1 line-clamp-2">{product.description}</p>
                  
                  <div className="pt-4 border-t border-gray-100 flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-green-600 flex items-center">
                            {getPriceUSD(product.pricePoints)}
                        </span>
                        <span className="text-xs font-medium text-gray-400 flex items-center mt-1">
                            <Tag className="w-3 h-3 mr-1" />
                            {product.pricePoints.toLocaleString()} pts
                        </span>
                      </div>
                      <button 
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.availability}
                        title={product.availability ? 'Add to cart' : 'Item unavailable'}
                        className={`flex items-center justify-center h-12 w-12 rounded-xl shadow-sm transition-all duration-200 ${
                            product.availability 
                            ? (addingId === product.id ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110 active:scale-95')
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                          {addingId === product.id ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebars Backdrop */}
      {(isCartOpen || isHistoryOpen) && (
        <div 
          className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => { setIsCartOpen(false); setIsHistoryOpen(false); }}
        />
      )}

      {/* History Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0">
            <div className="flex items-center">
              <History className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Redemption History</h2>
            </div>
            <button 
              onClick={() => setIsHistoryOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
            {purchaseHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Package className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No purchases yet</h3>
                <p className="text-gray-400 text-sm mt-1">Start redeeming your points for awesome rewards!</p>
              </div>
            ) : (
              purchaseHistory.map((tx) => (
                <div key={tx.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-green-50 text-green-700 text-[10px] font-black uppercase px-2 py-1 rounded flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {tx.date}
                    </span>
                    <span className="text-sm font-black text-gray-900">
                      {Math.abs(tx.amount).toLocaleString()} <span className="text-xs text-gray-400">PTS</span>
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-700 leading-snug line-clamp-2">
                    {tx.reason.replace('Purchase: ', '')}
                  </h4>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{tx.sponsorName}</span>
                    <span className="text-xs font-bold text-green-600">
                      ~{getPriceUSD(Math.abs(tx.amount))}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {purchaseHistory.length > 0 && (
            <div className="p-6 bg-white border-t border-gray-100">
              <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase mb-2">
                <span>Total Items Redeemed</span>
                <span>{purchaseHistory.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-700">Total Points Spent</span>
                <span className="text-lg font-black text-blue-600">
                  {Math.abs(purchaseHistory.reduce((acc, tx) => acc + tx.amount, 0)).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
            <div className="flex items-center">
              <ShoppingCart className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
            </div>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto px-6 py-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Your cart is empty</h3>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-start">
                    <img src={item.imageUrl} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                        <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-green-600 font-bold mt-1">
                        {getPriceUSD(item.pricePoints * item.quantity)}
                      </div>
                      <div className="flex items-center mt-3 bg-gray-50 rounded-lg w-fit p-1 border border-gray-100">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-blue-600"><Minus className="w-3 h-3"/></button>
                        <span className="mx-3 text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-blue-600"><Plus className="w-3 h-3"/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-gray-100 p-6 space-y-4 bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{totalPoints.toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-gray-900 font-bold">Total Due</span>
                  <div className="text-right">
                    <div className="text-2xl font-black text-green-600">{totalUSD}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={initiateCheckout}
                disabled={isPurchasing || ((user.pointsBalance || 0) < totalPoints)}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center ${
                  isPurchasing || ((user.pointsBalance || 0) < totalPoints)
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                }`}
              >
                {isPurchasing ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <CreditCard className="w-5 h-5 mr-2" />}
                {((user.pointsBalance || 0) < totalPoints) ? 'Insufficient Points' : 'Place Order'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
