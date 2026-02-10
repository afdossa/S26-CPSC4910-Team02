
import React, { useState, useEffect } from 'react';
import { CartItem, User, SponsorOrganization } from '../types';
import { getSponsors, updateDriverPoints, validateCartAvailability } from '../services/mockData';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, ArrowLeft, Loader, CheckCircle, Receipt, ArrowRight, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface CartProps {
  user: User;
  cart: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  onPurchaseSuccess: (points: number) => void;
}

export const Cart: React.FC<CartProps> = ({ user, cart, updateQuantity, removeItem, clearCart, onPurchaseSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeSponsor, setActiveSponsor] = useState<SponsorOrganization | undefined>(undefined);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [lastOrder, setLastOrder] = useState<{ items: CartItem[], total: number, id: string } | null>(null);

  useEffect(() => {
    const loadSponsor = async () => {
      if (user.sponsorId) {
        const sponsors = await getSponsors();
        setActiveSponsor(sponsors.find(s => s.id === user.sponsorId));
      }
    };
    loadSponsor();
  }, [user.sponsorId]);

  const totalPoints = cart.reduce((acc, item) => acc + (item.pricePoints * item.quantity), 0);
  const ratio = activeSponsor?.pointDollarRatio || 0.01;
  const totalUSD = (totalPoints * ratio).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if ((user.pointsBalance || 0) < totalPoints) {
      alert("Insufficient points for this purchase.");
      return;
    }

    if (!confirm(`Confirm purchase for ${totalPoints.toLocaleString()} points (${totalUSD})?`)) return;

    setLoading(true);
    try {
      // Step 1: Validate availability
      const validation = await validateCartAvailability(cart);
      if (!validation.valid) {
          alert(`Checkout Failed: The following items are no longer available:\n- ${validation.unavailableItems.join('\n- ')}\n\nPlease remove them from your cart.`);
          setLoading(false);
          return;
      }

      // Step 2: Process transaction
      const result = await updateDriverPoints(
        user.id,
        -totalPoints,
        `Purchase: ${cart.map(i => `${i.name} (x${i.quantity})`).join(', ')}`,
        activeSponsor?.name || 'Sponsor',
        activeSponsor?.id,
        'PURCHASE'
      );

      if (result.success) {
        setLastOrder({
          items: [...cart],
          total: totalPoints,
          id: `DW-${Math.floor(Math.random() * 90000) + 10000}`
        });
        onPurchaseSuccess(totalPoints);
        clearCart();
        setPurchaseComplete(true);
      } else {
        alert("Purchase failed: " + result.message);
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  if (purchaseComplete) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col items-center">
        <div className="bg-white rounded-3xl shadow-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-green-600 p-10 text-center text-white">
            <div className="inline-flex items-center justify-center bg-white/20 rounded-full p-4 mb-4 backdrop-blur-md">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-4xl font-black mb-1">Order Confirmed!</h1>
            <p className="text-green-50 text-lg font-medium">Your rewards summary is ready.</p>
          </div>
          
          <div className="p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center text-gray-400 text-sm font-bold uppercase tracking-widest">
                <Receipt className="w-5 h-5 mr-2" />
                Receipt Details
              </div>
              <div className="text-gray-900 font-mono text-sm font-bold bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                {lastOrder?.id}
              </div>
            </div>

            <div className="space-y-5 mb-10 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {lastOrder?.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 font-black text-sm border border-gray-100 group-hover:border-green-200 group-hover:bg-green-50 transition-all">
                      {item.quantity}x
                    </div>
                    <div className="ml-4">
                      <div className="text-base font-bold text-gray-900 leading-none mb-1">{item.name}</div>
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-tighter">
                        Unit Price: {item.pricePoints.toLocaleString()} pts
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-black text-gray-900">
                    {(item.pricePoints * item.quantity).toLocaleString()} <span className="text-xs text-gray-400">PTS</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-200 pt-8 space-y-4">
              <div className="flex justify-between items-center text-base font-medium text-gray-500">
                <span>Summary Subtotal</span>
                <span>{lastOrder?.total.toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between items-center text-3xl font-black text-gray-900">
                <span>Grand Total</span>
                <div className="text-right">
                  <div className="text-green-600 leading-none mb-1">{lastOrder?.total.toLocaleString()} <span className="text-sm text-gray-400 uppercase">pts</span></div>
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Transaction Successful</div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link 
                to="/dashboard" 
                className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center"
              >
                Go to Dashboard
              </Link>
              <Link 
                to="/catalog" 
                className="flex-1 py-5 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all flex items-center justify-center shadow-lg shadow-green-100"
              >
                Back to Catalog <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-8 text-gray-400 text-sm font-medium flex items-center">
          <Package className="w-4 h-4 mr-2" /> Track your rewards delivery in the dashboard soon.
        </p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center">
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200">
          <ShoppingCart className="w-20 h-20 text-gray-200 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">It looks like you haven't added any rewards yet.</p>
          <Link to="/catalog" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" /> Start Browsing Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center mb-8">
        <Link to="/catalog" className="p-2 hover:bg-gray-100 rounded-full mr-4 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Review Your Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center shadow-sm hover:shadow-md transition-shadow">
              <img src={item.imageUrl} alt={item.name} className="w-24 h-24 rounded-xl object-cover" />
              <div className="ml-6 flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-2 line-clamp-1">{item.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-blue-600 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="mx-4 font-bold text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-blue-600 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {((item.pricePoints * item.quantity) * ratio).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </div>
                    <div className="text-xs text-gray-400">
                      {(item.pricePoints * item.quantity).toLocaleString()} pts
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-blue-600" /> Order Summary
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Total Items</span>
                <span>{cart.reduce((acc, i) => acc + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (Points)</span>
                <span>{totalPoints.toLocaleString()} pts</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between items-end">
                <span className="text-gray-900 font-bold">Total Value</span>
                <div className="text-right">
                  <div className="text-3xl font-black text-green-600">{totalUSD}</div>
                  <div className="text-sm font-medium text-gray-400">Equivalent to {totalPoints.toLocaleString()} points</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between text-sm text-blue-800 font-medium mb-1">
                <span>Your Balance</span>
                <span>{(user.pointsBalance || 0).toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between text-sm text-blue-800 mb-2">
                <span>After Purchase</span>
                <span className={((user.pointsBalance || 0) - totalPoints) < 0 ? 'text-red-600' : ''}>
                  {((user.pointsBalance || 0) - totalPoints).toLocaleString()} pts
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${((user.pointsBalance || 0) - totalPoints) < 0 ? 'bg-red-500' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min(((user.pointsBalance || 0) / totalPoints) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || ((user.pointsBalance || 0) < totalPoints)}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center ${
                loading || ((user.pointsBalance || 0) < totalPoints)
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {loading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
              {((user.pointsBalance || 0) < totalPoints) ? 'Insufficient Points' : 'Place Order'}
            </button>
            <p className="mt-4 text-center text-xs text-gray-400">
              Orders are final upon confirmation. Delivery times vary by reward provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};