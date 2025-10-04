'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ProductModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    stock: '', 
    franchisePrice: '',
    distributorPrice: '',
    subDistributorPrice: '',
    dealerPrice: '',
    farmerPrice: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        stock: product.stock || '', 
        franchisePrice: product.franchisePrice || '',
        distributorPrice: product.distributorPrice || '',
        subDistributorPrice: product.subDistributorPrice || '',
        dealerPrice: product.dealerPrice || '',
        farmerPrice: product.farmerPrice || '',
      });
    } else {
      setFormData({ name: '', stock: '', franchisePrice: '', distributorPrice: '', subDistributorPrice: '', dealerPrice: '', farmerPrice: '' });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const productData = {
      name: formData.name,
      stock: parseInt(formData.stock, 10), 
      franchisePrice: parseFloat(formData.franchisePrice),
      distributorPrice: parseFloat(formData.distributorPrice),
      subDistributorPrice: parseFloat(formData.subDistributorPrice),
      dealerPrice: parseFloat(formData.dealerPrice),
      farmerPrice: parseFloat(formData.farmerPrice),
    };

    for (const key in productData) {
      const value = productData[key];
      if ((typeof value === 'number' && isNaN(value)) || (typeof value === 'string' && !value.trim())) {
        toast.error(`Please fill in a valid value for ${key}.`);
        setIsSubmitting(false);
        return;
      }
    }
    
    await onSave(productData);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{product ? 'Edit Product' : 'Add New Product'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Product Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border rounded-md" required />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Initial Stock (Quantity)</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full p-3 border rounded-md" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Franchise Price</label>
              <input type="number" step="0.01" name="franchisePrice" value={formData.franchisePrice} onChange={handleChange} className="w-full p-3 border rounded-md" required />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Distributor Price</label>
              <input type="number" step="0.01" name="distributorPrice" value={formData.distributorPrice} onChange={handleChange} className="w-full p-3 border rounded-md" required />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Sub-Distributor Price</label>
              <input type="number" step="0.01" name="subDistributorPrice" value={formData.subDistributorPrice} onChange={handleChange} className="w-full p-3 border rounded-md" required />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Dealer Price</label>
              <input type="number" step="0.01" name="dealerPrice" value={formData.dealerPrice} onChange={handleChange} className="w-full p-3 border rounded-md" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-semibold mb-2">Farmer Price (MRP)</label>
              <input type="number" step="0.01" name="farmerPrice" value={formData.farmerPrice} onChange={handleChange} className="w-full p-3 border rounded-md" required />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-stone-200 text-stone-800 rounded-md font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md font-semibold disabled:bg-green-300"
            >
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

