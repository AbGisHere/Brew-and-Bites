import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const SuperAdminDashboard = ({ onExit }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newRestName, setNewRestName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchData();
        localStorage.removeItem('selectedRestaurant');
    }, []);

    const fetchData = async () => {
        try {
            const token = user?.id;
            const headers = { 'Authorization': `Bearer ${token}` };
            const [restRes, analyticsRes] = await Promise.all([
                fetch(`${API_URL}/api/superadmin/restaurants`, { headers }),
                fetch(`${API_URL}/api/superadmin/analytics`, { headers })
            ]);
            const [restData, analyticsData] = await Promise.all([
                restRes.json(), analyticsRes.json()
            ]);
            setRestaurants(Array.isArray(restData) ? restData : []);
            setAnalytics(analyticsData);
        } catch (e) {
            console.error('Error fetching superadmin data:', e);
        } finally {
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
        if (!newRestName.trim()) return;
        setCreating(true);
        try {
            const token = user?.id;
            await fetch(`${API_URL}/api/superadmin/restaurants`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newRestName.trim() })
            });
            setNewRestName('');
            setShowNewModal(false);
            fetchData();
        } catch (e) { console.error(e); } finally { setCreating(false); }
    };

    const handleManage = (restaurant) => {
        localStorage.setItem('selectedRestaurant', JSON.stringify(restaurant));
        navigate('/admin');
    };

    // Shared card style matching the app's glassmorphism aesthetic
    const cardStyle = {
        background: 'rgba(253, 243, 229, 0.75)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        border: '1px solid rgba(212, 167, 106, 0.25)',
        borderRadius: '18px',
        boxShadow: '0 8px 32px rgba(139, 90, 43, 0.10), inset 0 1px 0 rgba(255,255,255,0.6)',
    };

    const sectionHeaderStyle = {
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#8B5A2B',
        marginBottom: '0.25rem',
    };

    const bigNumberStyle = {
        fontSize: '2rem',
        fontWeight: 800,
        color: '#3E2723',
        lineHeight: 1.1,
    };

    const subLabelStyle = {
        fontSize: '0.78rem',
        color: '#A0522D',
        marginTop: '0.2rem',
    };

    const primaryBtnStyle = {
        background: 'linear-gradient(135deg, #D4A76A 0%, #B9864B 50%, #8B5A2B 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '0.55rem 1.25rem',
        fontWeight: 700,
        fontSize: '0.85rem',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(139, 90, 43, 0.25)',
        transition: 'all 0.2s ease',
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#8B5A2B', fontWeight: 600, fontSize: '1.1rem' }}>
            <div className="loader" style={{ marginRight: '1rem' }} />
            Loading Portal...
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', padding: '1.5rem', fontFamily: 'inherit', maxWidth: '1400px', margin: '0 auto' }}>

            {/* ── HEADER ── */}
            <div style={{ ...cardStyle, padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <div style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A0522D', fontWeight: 600 }}>
                        Super Admin Portal
                    </div>
                    <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#3E2723', margin: 0, lineHeight: 1.2 }}>
                        Welcome back, {user?.username} 👑
                    </h1>
                    <div style={{ fontSize: '0.8rem', color: '#8B5A2B', marginTop: '0.15rem' }}>
                        Manage your entire restaurant network from one place
                    </div>
                </div>
                <button
                    onClick={onExit}
                    style={{
                        background: 'rgba(139, 90, 43, 0.1)',
                        border: '1px solid rgba(139, 90, 43, 0.2)',
                        borderRadius: '10px',
                        padding: '0.6rem 1.1rem',
                        color: '#8B5A2B',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139, 90, 43, 0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(139, 90, 43, 0.1)'}
                >
                    <span>↩</span> Exit
                </button>
            </div>

            {/* ── ANALYTICS CARDS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Network Earnings', value: `₹${(analytics?.totalEarnings || 0).toFixed(2)}`, icon: '💰', note: 'All time, all restaurants' },
                    { label: 'Total Orders', value: analytics?.totalOrders ?? 0, icon: '📋', note: 'Across all locations' },
                    { label: 'Active Restaurants', value: analytics?.activeRestaurants ?? 0, icon: '✅', note: 'Currently serving' },
                    { label: 'Suspended', value: analytics?.suspendedRestaurants ?? 0, icon: '⛔', note: 'Currently paused' },
                ].map(({ label, value, icon, note }) => (
                    <div key={label} style={{ ...cardStyle, padding: '1.25rem 1.5rem' }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{icon}</div>
                        <div style={sectionHeaderStyle}>{label}</div>
                        <div style={bigNumberStyle}>{value}</div>
                        <div style={subLabelStyle}>{note}</div>
                    </div>
                ))}
            </div>

            {/* ── RESTAURANT TABLE ── */}
            <div style={{ ...cardStyle, padding: '1.5rem 1.75rem' }}>
                {/* Table header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <div style={sectionHeaderStyle}>Managed Locations</div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3E2723', margin: 0 }}>
                            All Restaurants
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowNewModal(true)}
                        style={primaryBtnStyle}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(139, 90, 43, 0.4)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 90, 43, 0.25)'}
                    >
                        + Add Restaurant
                    </button>
                </div>

                {restaurants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#A0522D', fontStyle: 'italic' }}>
                        No restaurants yet. Click "+ Add Restaurant" to get started!
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid rgba(212, 167, 106, 0.2)' }}>
                                    {['Restaurant', 'Created', 'Earnings', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{
                                            padding: '0.6rem 1rem',
                                            textAlign: h === 'Earnings' ? 'right' : h === 'Status' || h === 'Actions' ? 'center' : 'left',
                                            fontSize: '0.68rem',
                                            fontWeight: 700,
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                            color: '#8B5A2B',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {restaurants.map((rest, i) => {
                                    const isActive = rest.status === 'active';
                                    return (
                                        <tr
                                            key={rest._id}
                                            style={{
                                                borderBottom: i < restaurants.length - 1 ? '1px solid rgba(212, 167, 106, 0.12)' : 'none',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212, 167, 106, 0.08)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#3E2723', fontSize: '0.95rem' }}>
                                                🍽 {rest.name}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', color: '#8B5A2B', fontSize: '0.85rem' }}>
                                                {new Date(rest.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: '#5a7a2b', fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums' }}>
                                                ₹{(rest.earnings || 0).toFixed(2)}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    background: isActive ? 'rgba(90, 122, 43, 0.12)' : 'rgba(180, 60, 40, 0.1)',
                                                    color: isActive ? '#4a6626' : '#b43c28',
                                                    border: `1px solid ${isActive ? 'rgba(90,122,43,0.25)' : 'rgba(180,60,40,0.2)'}`,
                                                }}>
                                                    {isActive ? '● Active' : '● Suspended'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleManage(rest)}
                                                        style={{
                                                            background: 'rgba(212, 167, 106, 0.15)',
                                                            border: '1px solid rgba(212, 167, 106, 0.35)',
                                                            borderRadius: '8px',
                                                            padding: '0.4rem 0.9rem',
                                                            color: '#7a4f1a',
                                                            fontWeight: 600,
                                                            fontSize: '0.8rem',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,167,106,0.3)'; e.currentTarget.style.color = '#3E2723'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,167,106,0.15)'; e.currentTarget.style.color = '#7a4f1a'; }}
                                                    >
                                                        ⚙ Manage
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(rest._id)}
                                                        style={{
                                                            background: isActive ? 'rgba(180, 60, 40, 0.08)' : 'rgba(90, 122, 43, 0.1)',
                                                            border: `1px solid ${isActive ? 'rgba(180,60,40,0.25)' : 'rgba(90,122,43,0.25)'}`,
                                                            borderRadius: '8px',
                                                            padding: '0.4rem 0.9rem',
                                                            color: isActive ? '#b43c28' : '#4a6626',
                                                            fontWeight: 600,
                                                            fontSize: '0.8rem',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s',
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                                    >
                                                        {isActive ? '⛔ Suspend' : '✅ Reactivate'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── NEW RESTAURANT MODAL ── */}
            {showNewModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(62, 39, 35, 0.35)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                }}>
                    <div style={{
                        ...cardStyle,
                        background: 'rgba(255, 250, 242, 0.97)',
                        width: '100%',
                        maxWidth: '420px',
                        padding: '2rem',
                        animation: 'scaleIn 0.25s cubic-bezier(0.22,1,0.36,1) both',
                    }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3E2723', margin: '0 0 0.25rem' }}>
                            🍽 New Restaurant
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#8B5A2B', margin: '0 0 1.25rem' }}>
                            Add a new location to your network. You can configure its menu, tables, and staff afterwards.
                        </p>
                        <form onSubmit={handleCreateRestaurant}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B5A2B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                Restaurant Name
                            </label>
                            <input
                                type="text"
                                value={newRestName}
                                onChange={e => setNewRestName(e.target.value)}
                                required
                                autoFocus
                                placeholder="e.g. Pizza Palace"
                                className="input"
                                style={{ marginBottom: '1.25rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowNewModal(false); setNewRestName(''); }}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(139, 90, 43, 0.08)',
                                        border: '1px solid rgba(139, 90, 43, 0.2)',
                                        borderRadius: '10px',
                                        padding: '0.65rem',
                                        color: '#8B5A2B',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    style={{ ...primaryBtnStyle, flex: 1, opacity: creating ? 0.7 : 1 }}
                                >
                                    {creating ? 'Creating…' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
