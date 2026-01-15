import React, { useState } from 'react';
import { MOCK_CATALOG } from '../services/mockData';
import { Product } from '../types';
import { Search, ShoppingCart } from 'lucide-react';

export const Catalog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = MOCK_CATALOG.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePurchase = (product: Product) => {
      // In real app: API call to create order and deduct points
      if(!product.availability) return;
      alert(`Initiating purchase for ${product.name}. This would deduct ${product.pricePoints} points.`);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Rewards Catalog</h1>
            <p className="mt-2 text-gray-600">Redeem your hard-earned points for great gear.</p>
        </div>
        <div className="mt-4 md:mt-0 relative">
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="group relative bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-w-3 aspect-h-4 bg-gray-200 group-hover:opacity-75 h-48 sm:h-60">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-center object-cover"
              />
            </div>
            <div className="flex-1 p-4 space-y-2 flex flex-col">
              <h3 className="text-lg font-medium text-gray-900">
                  {product.name}
              </h3>
              <p className="text-sm text-gray-500 flex-1">{product.description}</p>
              <div className="flex items-center justify-between pt-4">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-amber-600">{product.pricePoints.toLocaleString()} pts</span>
                    <span className={`text-xs ${product.availability ? 'text-green-600' : 'text-red-600'}`}>
                        {product.availability ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <button 
                    onClick={() => handlePurchase(product)}
                    disabled={!product.availability}
                    className={`p-2 rounded-full ${product.availability ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                      <ShoppingCart className="w-5 h-5" />
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};