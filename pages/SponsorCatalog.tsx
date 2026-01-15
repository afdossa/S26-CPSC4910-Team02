import React, { useState } from 'react';
import { MOCK_CATALOG } from '../services/mockData';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Edit2, Package } from 'lucide-react';

export const SponsorCatalog: React.FC = () => {
    const [products, setProducts] = useState(MOCK_CATALOG);

    const toggleAvailability = (id: string) => {
        setProducts(products.map(p => p.id === id ? { ...p, availability: !p.availability } : p));
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to remove this item?')) {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
             <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                     <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Package className="mr-2" /> Catalog Management
                    </h1>
                    <p className="mt-2 text-gray-600">Add, edit, or remove products from the driver rewards catalog.</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <button className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" /> Add New Product
                    </button>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {products.map((product) => (
                        <li key={product.id}>
                            <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                <div className="flex items-center">
                                    <img className="h-12 w-12 rounded bg-gray-100 object-cover" src={product.imageUrl} alt="" />
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-blue-600">{product.name}</div>
                                        <div className="text-sm text-gray-500">{product.pricePoints.toLocaleString()} pts</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {product.availability ? 'In Stock' : 'Unavailable'}
                                    </span>
                                    <button 
                                        onClick={() => toggleAvailability(product.id)}
                                        className="text-gray-400 hover:text-gray-500 text-xs border border-gray-300 px-2 py-1 rounded"
                                    >
                                        Toggle Status
                                    </button>
                                    <button className="text-indigo-600 hover:text-indigo-900">
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};