'use client';

import { useState, useEffect } from 'react';
import { getUplineInventory, createPurchase } from '../services/apiService';
import toast from 'react-hot-toast';

export default function BuyFromUplineForm({ userRole, onPurchaseSuccess }) {
    const [uplineProducts, setUplineProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState(1);

    const roleToPriceMap = {
        Franchise: 'franchisePrice',
        Distributor: 'distributorPrice',
        SubDistributor: 'subDistributorPrice',
        Dealer: 'dealerPrice',
    };
    
    const selectedProductItem = uplineProducts.find(item => item.productId === productId);
    const price = selectedProductItem ? selectedProductItem.product[roleToPriceMap[userRole]] || 0 : 0;

    useEffect(() => {
        const fetchUplineStock = async () => {
            setIsLoading(true);
            try {
                const data = await getUplineInventory();
                setUplineProducts(data);
            } catch (error) {
                toast.error("Could not load products from your upline.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUplineStock();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productId || quantity < 1) {
            toast.error("Please select a product and enter a valid quantity.");
            return;
        }
        setIsSubmitting(true);
        try {
            await createPurchase({ productId, quantity: parseInt(quantity) });
            toast.success('Purchase from upline successful!');
            // Reset form and refresh parent dashboard
            setProductId('');
            setQuantity(1);
            if (onPurchaseSuccess) {
                onPurchaseSuccess();
            }
            // Manually refresh this component's data as well
            const data = await getUplineInventory();
            setUplineProducts(data);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
             <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Buy From Upline</h2>
                <p className="text-center text-sm text-gray-500">Loading products...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Buy From Upline</h2>
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
                        {uplineProducts.filter(p => p.quantity > 0).map(item => (
                            <option key={item.id} value={item.productId}>
                                {item.product.name} (Available: {item.quantity})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedProductItem && (
                    <p className="text-md text-gray-600">
                        Price per unit: <span className="font-bold text-blue-600">₹{price.toFixed(2)}</span>
                    </p>
                )}

                <div>
                    <label className="block text-sm font-medium">Quantity</label>
                    <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(e.target.value)} 
                        className="w-full mt-1 p-2 border rounded-md" 
                        min="1" 
                        max={selectedProductItem?.quantity || 0}
                        disabled={isSubmitting || !productId}
                    />
                </div>
                <button 
                    type="submit" 
                    className="w-full mt-2 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    disabled={isSubmitting || !productId}
                >
                    {isSubmitting ? 'Processing...' : 'Complete Purchase'}
                </button>
            </form>
        </div>
    );
}