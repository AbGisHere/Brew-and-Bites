import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PieChart, Activity, Users, Store, Settings, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const SuperAdminDashboard = ({ onExit }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newRestName, setNewRestName] = useState('');

    useEffect(() => {
        // Fetch initialization
        fetchData();
        // Clear any previously selected restaurant when visiting superadmin portal
        localStorage.removeItem('selectedRestaurant');
    }, []);

    const fetchData = async () => {
        try {
            const token = user?.id; // backend expects ID as token for now
            const headers = { 'Authorization': `Bearer ${token}` };

            const [restRes, analyticsRes] = await Promise.all([
                fetch(`${API_URL}/api/superadmin/restaurants`, { headers }),
                fetch(`${API_URL}/api/superadmin/analytics`, { headers })
            ]);

            const [restData, analyticsData] = await Promise.all([
                restRes.json(),
                analyticsRes.json()
            ]);

            setRestaurants(restData);
            setAnalytics(analyticsData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching superadmin data:", error);
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const token = user?.id;
            await fetch(`${API_URL}/api/superadmin/restaurants/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleCreateRestaurant = async (e) => {
        e.preventDefault();
        try {
            const token = user?.id;
            await fetch(`${API_URL}/api/superadmin/restaurants`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newRestName })
            });
            setNewRestName('');
            setShowNewModal(false);
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleManage = (restaurant) => {
        // Save the selection and go to the normal admin dashboard
        localStorage.setItem('selectedRestaurant', JSON.stringify(restaurant));
        navigate('/admin');
    };

    if (loading) return <div className="p-8 text-center text-white">Loading Portal...</div>;

    return (
        <div className="min-h-screen p-6 font-poppins relative z-10">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 glassmorphism p-4 rounded-2xl">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Super Admin Portal</h1>
                    <p className="text-blue-100">Welcome back, {user?.username}</p>
                </div>
                <button
                    onClick={onExit}
                    className="flex justify-center flex-col items-center bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-all"
                >
                    <LogOut size={20} />
                    <span className="text-xs mt-1">Exit</span>
                </button>
            </header>

            {/* Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="glassmorphism p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-blue-200 text-sm font-medium">Network Earnings</p>
                        <p className="text-3xl font-bold text-white mt-1">₹{analytics?.totalEarnings?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <Activity size={24} />
                    </div>
                </div>
                <div className="glassmorphism p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-blue-200 text-sm font-medium">Total Orders</p>
                        <p className="text-3xl font-bold text-white mt-1">{analytics?.totalOrders || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <PieChart size={24} />
                    </div>
                </div>
                <div className="glassmorphism p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-blue-200 text-sm font-medium">Active Tenants</p>
                        <p className="text-3xl font-bold text-white mt-1">{analytics?.activeRestaurants || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Store size={24} />
                    </div>
                </div>
                <div className="glassmorphism p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-blue-200 text-sm font-medium">Suspended</p>
                        <p className="text-3xl font-bold text-white mt-1">{analytics?.suspendedRestaurants || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                        <Users size={24} />
                    </div>
                </div>
            </div>

            {/* Restaurants List */}
            <div className="glassmorphism p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Managed Restaurants</h2>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-all"
                    >
                        + Add Restaurant
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-blue-200 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold">Restaurant Name</th>
                                <th className="p-4 font-semibold">Created Date</th>
                                <th className="p-4 font-semibold text-right">Total Earnings</th>
                                <th className="p-4 font-semibold text-center">Status</th>
                                <th className="p-4 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-white text-sm">
                            {restaurants.map(rest => (
                                <tr key={rest._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium">{rest.name}</td>
                                    <td className="p-4 text-blue-100">{new Date(rest.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 text-right font-mono text-green-400 font-bold">₹{rest.earnings?.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                        {rest.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">
                                                <CheckCircle size={14} /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs">
                                                <XCircle size={14} /> Suspended
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 flex justify-center gap-3">
                                        <button
                                            onClick={() => handleManage(rest)}
                                            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg flex items-center gap-2 transition-all"
                                        >
                                            <Settings size={14} /> Manage
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(rest._id)}
                                            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${rest.status === 'active'
                                                ? 'bg-red-500/20 hover:bg-red-500/40 text-red-300'
                                                : 'bg-green-500/20 hover:bg-green-500/40 text-green-300'
                                                }`}
                                        >
                                            {rest.status === 'active' ? 'Suspend' : 'Reactivate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {restaurants.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-blue-200">No restaurants found. Create one above!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Restaurant Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1e293b] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10"
                    >
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4">Add New Restaurant</h3>
                            <form onSubmit={handleCreateRestaurant}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-blue-200 mb-2">Restaurant Name</label>
                                    <input
                                        type="text"
                                        value={newRestName}
                                        onChange={(e) => setNewRestName(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                                        placeholder="e.g. Pizza Palace"
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewModal(false)}
                                        className="flex-1 py-3 rounded-xl font-medium text-white bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 rounded-xl font-medium text-white bg-accent hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
