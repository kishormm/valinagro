'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
// --- UPDATED: Import all necessary API functions ---
import { 
    addUser, 
    getUsersByRole, 
    getDownline,
    updateUser,
    deleteUser,
    getUserDetails
} from '@/services/apiService';
import toast from 'react-hot-toast';
import EditUserModal from '@/components/admin/EditUserModal';

// --- Reusable Loader Component ---
const Loader = ({ size = 'w-8 h-8', color = 'text-white' }) => (
    <svg className={`animate-spin ${size} ${color}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- Main Component ---
export default function AddNewUser() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg min-h-[600px]">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">User Management</h2>
        <div className="flex border-b mb-6">
            <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'create' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-green-600'}`}
            >
                Create User
            </button>
            <button
                onClick={() => setActiveTab('manage')}
                className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'manage' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-green-600'}`}
            >
                Manage Users
            </button>
            <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'search' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-green-600'}`}
            >
                Search & View
            </button>
        </div>
        
        {activeTab === 'create' && <CreateUserForm />}
        {activeTab === 'manage' && <UserManagementDashboard />}
        {activeTab === 'search' && <ViewUserDetails />}
    </div>
  );
}

// --- Sub-component for Creating a User ---
function CreateUserForm() {
    const [formData, setFormData] = useState({
        name: '', role: 'Franchise', mobile: '', email: '', pan: '', aadhar: '',
        address: '', pincode: '', crops: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [franchises, setFranchises] = useState([]);
    const [distributors, setDistributors] = useState([]);
    const [subDistributors, setSubDistributors] = useState([]);
    const [dealers, setDealers] = useState([]);
    const [selectedFranchise, setSelectedFranchise] = useState('');
    const [selectedDistributor, setSelectedDistributor] = useState('');
    const [selectedSubDistributor, setSelectedSubDistributor] = useState('');
    const [selectedDealer, setSelectedDealer] = useState('');

    const cropList = ["Cotton", "Soybean", "Sugarcane", "Wheat", "Paddy", "Maize", "Gram", "Groundnut", "Vegetables", "Fruits", "Spices", "Pulses"];

    const fetchFranchises = useCallback(async () => {
        try {
            const data = await getUsersByRole('Franchise');
            setFranchises(data);
        } catch (error) { toast.error("Could not load franchises."); }
    }, []);

    useEffect(() => { fetchFranchises(); }, [fetchFranchises]);

    useEffect(() => {
        if (selectedFranchise) {
            const franchise = franchises.find(f => f.id === selectedFranchise);
            if (franchise) getDownline(franchise.userId).then(setDistributors).catch(console.error);
        } else setDistributors([]);
        setSelectedDistributor('');
    }, [selectedFranchise, franchises]);

    useEffect(() => {
        if (selectedDistributor) {
            const distributor = distributors.find(d => d.id === selectedDistributor);
            if (distributor) getDownline(distributor.userId).then(setSubDistributors).catch(console.error);
        } else setSubDistributors([]);
        setSelectedSubDistributor('');
    }, [selectedDistributor, distributors]);

    useEffect(() => {
        if (selectedSubDistributor) {
            const subDist = subDistributors.find(sd => sd.id === selectedSubDistributor);
            if (subDist) getDownline(subDist.userId).then(setDealers).catch(console.error);
        } else setDealers([]);
        setSelectedDealer('');
    }, [selectedSubDistributor, subDistributors]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCropChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => ({ ...prev, crops: checked ? [...prev.crops, value] : prev.crops.filter(c => c !== value) }));
    };
    
    const handleRoleChange = (e) => {
        setFormData({ name: '', role: e.target.value, mobile: '', email: '', pan: '', aadhar: '', address: '', pincode: '', crops: [] });
        setSelectedFranchise(''); setSelectedDistributor(''); setSelectedSubDistributor(''); setSelectedDealer('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error('Please enter a name.');

        let uplineId;
        switch(formData.role) {
            case 'Distributor': uplineId = selectedFranchise; break;
            case 'SubDistributor': uplineId = selectedDistributor; break;
            case 'Dealer': uplineId = selectedSubDistributor; break;
            case 'Farmer': uplineId = selectedDealer; break;
        }

        const finalData = { ...formData };
        if (formData.role !== 'Franchise') {
            if (!uplineId) return toast.error(`Please select an upline for the new ${formData.role}.`);
            finalData.uplineId = uplineId;
        }

        setIsSubmitting(true);
        try {
            const createdUser = await addUser(finalData);
            toast.success(`User "${createdUser.name}" created!\nID: ${createdUser.userId}\nPassword: ${createdUser.rawPassword}`, { duration: 8000 });
            if (formData.role === 'Franchise') fetchFranchises();
            setFormData({ name: '', role: 'Franchise', mobile: '', email: '', pan: '', aadhar: '', address: '', pincode: '', crops: [] });
            setSelectedFranchise('');
        } catch (error) {
            console.error("Failed to create user:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Assign Role</label>
                    <select name="role" value={formData.role} onChange={handleRoleChange} className="w-full p-3 border border-gray-300 rounded-md">
                        <option value="Franchise">Franchise</option>
                        <option value="Distributor">Distributor</option>
                        <option value="SubDistributor">Sub-Distributor</option>
                        <option value="Dealer">Dealer</option>
                        <option value="Farmer">Farmer</option>
                    </select>
                </div>
                {formData.role !== 'Franchise' && (
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Under Franchise</label>
                        <select value={selectedFranchise} onChange={(e) => setSelectedFranchise(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md">
                            <option value="">-- Select Franchise --</option>
                            {franchises.map(f => <option key={f.id} value={f.id}>{f.name} ({f.userId})</option>)}
                        </select>
                    </div>
                )}
                {['SubDistributor', 'Dealer', 'Farmer'].includes(formData.role) && (
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Under Distributor</label>
                        <select value={selectedDistributor} onChange={(e) => setSelectedDistributor(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md" disabled={!selectedFranchise}>
                            <option value="">-- Select Distributor --</option>
                            {distributors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.userId})</option>)}
                        </select>
                    </div>
                )}
                {['Dealer', 'Farmer'].includes(formData.role) && (
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Under Sub-Distributor</label>
                        <select value={selectedSubDistributor} onChange={(e) => setSelectedSubDistributor(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md" disabled={!selectedDistributor}>
                            <option value="">-- Select Sub-Distributor --</option>
                            {subDistributors.map(sd => <option key={sd.id} value={sd.id}>{sd.name} ({sd.userId})</option>)}
                        </select>
                    </div>
                )}
                {formData.role === 'Farmer' && (
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Under Dealer</label>
                        <select value={selectedDealer} onChange={(e) => setSelectedDealer(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md" disabled={!selectedSubDistributor}>
                            <option value="">-- Select Dealer --</option>
                            {dealers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.userId})</option>)}
                        </select>
                    </div>
                )}
            </div>
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
            <button type="submit" disabled={isSubmitting} className="w-40 h-12 flex justify-center items-center px-8 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-green-400">
                {isSubmitting ? <Loader /> : 'Create User'}
            </button>
        </form>
    );
}

// --- Sub-component for Viewing and Managing Users ---
function UserManagementDashboard() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [editingUser, setEditingUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const roles = ['All', 'Franchise', 'Distributor', 'SubDistributor', 'Dealer', 'Farmer'];

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getUsersByRole(filter);
            setUsers(data);
        } catch (error) {
            toast.error("Could not load users.");
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const handleEdit = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleSave = async (userId, updatedData) => {
        try {
            await updateUser(userId, updatedData);
            toast.success("User updated successfully!");
            setIsModalOpen(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error("Failed to update user:", error);
        }
    };
    
    const handleDelete = async (user) => {
        if (window.confirm(`Are you sure you want to delete ${user.name} (${user.userId})? This will also re-assign their downline.`)) {
            try {
                await deleteUser(user.id);
                toast.success("User deleted successfully.");
                fetchUsers();
            } catch (error) {
                console.error("Failed to delete user:", error);
            }
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.userId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    return (
        <div>
            {isModalOpen && (
                <EditUserModal 
                    user={editingUser} 
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    {roles.map(role => (
                        <button key={role} onClick={() => setFilter(role)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${filter === role ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                            {role}s
                        </button>
                    ))}
                </div>
                <input 
                    type="text" 
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded-md w-full sm:w-64"
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader color="text-green-600" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                                <th className="p-3">Name</th>
                                <th className="p-3">User ID</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Upline</th>
                                <th className="p-3">Contact</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                <tr key={user.id} className="border-b hover:bg-stone-50">
                                    <td className="p-3 font-medium">{user.name}</td>
                                    <td className="p-3">{user.userId}</td>
                                    <td className="p-3">{user.role}</td>
                                    <td className="p-3">{user.upline?.name || 'Admin'}</td>
                                    <td className="p-3">{user.mobile || user.email || 'N/A'}</td>
                                    <td className="p-3 flex gap-2">
                                        <button onClick={() => handleEdit(user)} className="font-medium text-blue-600 hover:text-blue-800">Edit</button>
                                        <button onClick={() => handleDelete(user)} className="font-medium text-red-600 hover:text-red-800">Delete</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="p-4 text-center text-gray-500">No users found for this filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// --- NEW: Sub-component for Searching and Viewing a User's Details ---
function ViewUserDetails() {
    const [searchInput, setSearchInput] = useState('');
    const [userDetails, setUserDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchInput.trim()) return;

        setIsLoading(true);
        setError('');
        setUserDetails(null);
        try {
            const data = await getUserDetails(searchInput.trim());
            setUserDetails(data);
        } catch (err) {
            const errorMessage = err.message || 'User not found.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSearch} className="flex items-end gap-4 mb-6">
                <div className="flex-grow">
                    <label className="block text-gray-700 font-semibold mb-2">Search by User ID</label>
                    <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} type="text" placeholder="e.g., FRN1234" className="w-full p-3 border rounded-md" />
                </div>
                <button type="submit" disabled={isLoading} className="w-32 h-12 flex justify-center items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                    {isLoading ? <Loader /> : 'Search'}
                </button>
            </form>

            {error && !isLoading && <p className="text-center text-red-500 font-semibold py-8">{error}</p>}
            
            {userDetails && (
                <div className="space-y-4 pt-4 border-t animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-800">{userDetails.name} <span className="text-base font-medium text-gray-500">({userDetails.userId} - {userDetails.role})</span></h3>
                    {userDetails.upline && <p><strong>Upline:</strong> {userDetails.upline.name} ({userDetails.upline.userId})</p>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4 pt-4 border-t">
                        <div><p className="text-sm text-gray-500">Mobile</p><p>{userDetails.mobile || 'N/A'}</p></div>
                        <div><p className="text-sm text-gray-500">Email</p><p>{userDetails.email || 'N/A'}</p></div>
                        <div><p className="text-sm text-gray-500">PAN Card</p><p>{userDetails.pan || 'N/A'}</p></div>
                        <div><p className="text-sm text-gray-500">Aadhar</p><p>{userDetails.aadhar || 'N/A'}</p></div>
                        <div className="md:col-span-2"><p className="text-sm text-gray-500">Address</p><p>{userDetails.address || 'N/A'}, {userDetails.pincode || ''}</p></div>
                    </div>

                     <div className="md:col-span-2 pt-4 border-t">
                        <p className="font-semibold text-gray-700 mb-2">Crops:</p>
                        {userDetails.crops && userDetails.crops.length > 0 ? (
                            <ul className="list-disc list-inside flex flex-wrap gap-x-6">
                                {userDetails.crops.map(crop => <li key={crop}>{crop}</li>)}
                            </ul>
                        ) : <p>No crops specified.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

