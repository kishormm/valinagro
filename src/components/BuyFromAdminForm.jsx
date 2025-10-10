// src/components/BuyFromAdminForm.jsx

'use client';
import { useState, useEffect } from 'react';
import { getMasterProductList, createDirectPurchase } from '../services/apiService';
import toast from 'react-hot-toast';

export default function BuyFromAdminForm({ onPurchaseSuccess }) {
    const [masterProducts, setMasterProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    
    const selectedProduct = masterProducts.find(p => p.id === productId);

    useEffect(() => {
        const fetchMasterStock = async () => {
            try {
                const data = await getMasterProductList();
                setMasterProducts(data);
            } catch (error) {
                toast.error("Could not load master product list from Admin.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMasterStock();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productId || quantity < 1) {
            toast.error("Please select a product and enter a valid quantity.");
            return;
        }
        setIsSubmitting(true);
        try {
            await createDirectPurchase({ productId, quantity: parseInt(quantity) });
            toast.success('Direct purchase from Admin successful!');
            // Reset form
            setProductId('');
            setQuantity(1);
            if (onPurchaseSuccess) {
                onPurchaseSuccess(); // Refresh parent dashboard
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <p className="text-center text-sm text-gray-500">Loading direct purchase form...</p>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Buy Directly from Admin</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Product</label>
                    <select 
                        value={productId} 
                        onChange={(e) => setProductId(e.target.value)} 
                        className="w-full mt-1 p-2 border rounded-md"
                        disabled={isSubmitting}
                    >
                        <option value="">Select a product</option>
                        {masterProducts.filter(p => p.stock > 0).map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} (Admin Stock: {p.stock})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Quantity</label>
                    <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(e.target.value)} 
                        className="w-full mt-1 p-2 border rounded-md" 
                        min="1" 
                        max={selectedProduct?.stock || 0}
                        disabled={isSubmitting || !productId}
                    />
                </div>
                <button 
                    type="submit" 
                    className="w-full mt-2 py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                    disabled={isSubmitting || !productId}
                >
                    {isSubmitting ? 'Processing...' : 'Complete Purchase'}
                </button>
            </form>
        </div>
    );
}