import React, { useState } from 'react';
import { MOCK_CATALOG, addProduct, deleteProduct } from '../services/mockData';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Edit2, Package } from 'lucide-react';
import { Product } from '../types';

export const SponsorCatalog: React.FC = () => {
    const [products, setProducts] = useState(MOCK_CATALOG);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Form State
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState(0);
    const [newDesc, setNewDesc] = useState('');
    const [newImg, setNewImg] = useState('');

    const toggleAvailability = (id: string) => {
        setProducts(products.map(p => p.id === id ? { ...p, availability: !p.availability } : p));
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to remove this item?')) {
            deleteProduct(id);
            setProducts(products.filter(p => p.id !== id));
        }
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const p: Partial<Product> = {
            name: newName,
            pricePoints: newPrice,
            description: newDesc,
            imageUrl: newImg || 'https://via.placeholder.com/150',
            availability: true
        };
        addProduct(p);
        // Refresh local list (mock only)
        setProducts([...products, { 
            ...p, 
            id: `p${Date.now()}`, 
            availability: true, 
            imageUrl: p.imageUrl!, 
            description: p.description!, 
            name: p.name!, 
            pricePoints: p.pricePoints!,
            createdAt: new Date().toISOString()
        }]);
        setShowAddModal(false);
        setNewName('');
        setNewPrice(0);
        setNewDesc('');
        setNewImg('');
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">
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
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
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

            {/* Add Modal */}
            {showAddModal && (
                <div className="absolute top-0 left-0 w-full h-full bg-gray-600 bg-opacity-50 flex items-center justify-center min-h-screen z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Product</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Name</label>
                                <input className="w-full border rounded px-3 py-2" value={newName} onChange={e => setNewName(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Price (Points)</label>
                                <input type="number" className="w-full border rounded px-3 py-2" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Description</label>
                                <textarea className="w-full border rounded px-3 py-2" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Image URL</label>
                                <input className="w-full border rounded px-3 py-2" value={newImg} onChange={e => setNewImg(e.target.value)} placeholder="https://..." />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};