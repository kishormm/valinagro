'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/services/apiService';
import ProductModal from '@/components/ProductModal';
import toast from 'react-hot-toast';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const productData = await getProducts();
      setProducts(productData);
    } catch (error) {
      console.error("Failed to fetch product data:", error);
      toast.error("Could not load product data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (product = null) => { setEditingProduct(product); setIsModalOpen(true); };
  const handleCloseModal = () => { setEditingProduct(null); setIsModalOpen(false); };
  
  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast.success('Product updated!');
      } else {
        await addProduct(productData);
        toast.success('Product added!');
      }
      handleCloseModal();
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await deleteProduct(productId);
        toast.success('Product deleted!');
        fetchData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <>
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
        />
      )}
      <div className="bg-white p-6 rounded-lg shadow-lg min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">Product Management</h2>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Add New Product
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                  <th className="p-3 font-semibold">Product Name</th>
                  <th className="p-3 font-semibold">Stock</th>
                  <th className="p-3 font-semibold">Franchise Price</th>
                  <th className="p-3 font-semibold">Distributor Price</th>
                  <th className="p-3 font-semibold">Sub-Distributor Price</th>
                  <th className="p-3 font-semibold">Dealer Price</th>
                  <th className="p-3 font-semibold">Farmer Price (MRP)</th>
                  <th className="p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-stone-200 hover:bg-stone-50">
                    <td className="p-3 text-gray-800 font-medium">{product.name}</td>
                    <td className="p-3 text-gray-800 font-bold">{product.totalStock || 0} Units</td>
                    <td className="p-3 text-gray-800">₹{(product.franchisePrice || 0).toFixed(2)}</td>
                    <td className="p-3 text-gray-800">₹{(product.distributorPrice || 0).toFixed(2)}</td>
                    <td className="p-3 text-gray-800">₹{(product.subDistributorPrice || 0).toFixed(2)}</td>
                    <td className="p-3 text-gray-800">₹{(product.dealerPrice || 0).toFixed(2)}</td>
                    <td className="p-3 text-gray-800 font-bold">₹{(product.farmerPrice || 0).toFixed(2)}</td>
                    <td className="p-3">
                      <button onClick={() => handleOpenModal(product)} className="font-medium text-teal-600 hover:text-teal-800 mr-4">Edit</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="font-medium text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

