'use client';

import { useState } from 'react';
import { addUser } from '@/services/apiService';
import toast from 'react-hot-toast';

// Reusable Loader Component
const Loader = () => (
    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function UserFormModal({ isOpen, onClose, onUserAdded, uplineId, roleToCreate }) {
    const [formData, setFormData] = useState({
        name: '', mobile: '', email: '', pan: '', aadhar: '',
        address: '', pincode: '', crops: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const cropList = ["Cotton", "Soybean", "Sugarcane", "Wheat", "Paddy", "Maize", "Gram", "Groundnut", "Vegetables", "Fruits", "Spices", "Pulses"];

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCropChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => ({ ...prev, crops: checked ? [...prev.crops, value] : prev.crops.filter(c => c !== value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error('Please enter a name.');
        
        setIsSubmitting(true);
        try {
            const finalData = {
                ...formData,
                role: roleToCreate,
                uplineId: uplineId,
            };
            const createdUser = await addUser(finalData);
            toast.success(`User "${createdUser.name}" created!\nID: ${createdUser.userId}\nPassword: ${createdUser.rawPassword}`, { duration: 8000 });
            
            // Reset form and close modal
            setFormData({ name: '', mobile: '', email: '', pan: '', aadhar: '', address: '', pincode: '', crops: [] });
            onUserAdded(); // This will trigger a data refresh on the parent dashboard
            onClose();
        } catch (error) {
            console.error("Failed to create user:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold text-gray-800">Recruit New {roleToCreate}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </header>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name" required className="p-3 border rounded-md" />
                        <input name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="Mobile Number" className="p-3 border rounded-md" />
                        <input name="email" value={formData.email} type="email" onChange={handleInputChange} placeholder="Email ID" className="p-3 border rounded-md" />
                        <input name="pan" value={formData.pan} onChange={handleInputChange} placeholder="PAN Card Number" className="p-3 border rounded-md" />
                        <input name="aadhar" value={formData.aadhar} onChange={handleInputChange} placeholder="Aadhar Number" className="p-3 border rounded-md" />
                        <input name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="Pincode" className="p-3 border rounded-md" />
                        <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Full Address" className="p-3 border rounded-md md:col-span-2" rows="3"></textarea>
                    </div>
                    <div className="pt-4 border-t">
                        <label className="block text-gray-700 font-semibold mb-2">Which crops do they purchase products for?</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {cropList.map(crop => (
                                <label key={crop} className="flex items-center space-x-2">
                                    <input type="checkbox" value={crop} checked={formData.crops.includes(crop)} onChange={handleCropChange} className="h-5 w-5 rounded"/>
                                    <span>{crop}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </form>

                <footer className="p-4 border-t flex justify-end gap-4 sticky bottom-0 bg-white z-10">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-48 h-11 flex justify-center items-center px-6 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-green-400"
                    >
                        {isSubmitting ? <Loader /> : `Create ${roleToCreate}`}
                    </button>
                </footer>
            </div>
        </div>
    );
}

