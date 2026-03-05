import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Section, cardStyles } from '../styles/shared/CardStyles'
import { AnimatedButton, animatedButtonStyles, tableButtonStyles, statusBadgeStyles, colors } from '../styles/shared/SharedButtonStyles'
import PenIcon from './icons/PenIcon'
import API_URL from '../config'

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon }) => (
    <div style={{
        ...cardStyles.card,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '20px 24px',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: colors.brown, letterSpacing: '0.04em' }}>{label}</span>
            <span style={{ fontSize: '22px' }}>{icon}</span>
        </div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: colors.primaryDark, lineHeight: 1.1 }}>{value}</div>
    </div>
)

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ active }) => (
    <span style={{
        ...(active ? statusBadgeStyles.served : statusBadgeStyles.preparing),
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
    }}>
        <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: active ? '#66BB6A' : '#E88B5E',
            display: 'inline-block',
        }} />
        {active ? 'Active' : 'Suspended'}
    </span>
)

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const SuperAdminDashboard = ({ onExit }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [restaurants, setRestaurants] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [newName, setNewName] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchData()
        localStorage.removeItem('selectedRestaurant')
    }, [])

    const authHeaders = () => ({ 'Authorization': `Bearer ${user?.id}` })

    const fetchData = async () => {
        try {
            const [rr, ar] = await Promise.all([
                fetch(`${API_URL}/api/superadmin/restaurants`, { headers: authHeaders() }),
                fetch(`${API_URL}/api/superadmin/analytics`, { headers: authHeaders() }),
            ])
            const [rd, ad] = await Promise.all([rr.json(), ar.json()])
            setRestaurants(Array.isArray(rd) ? rd : [])
            setAnalytics(ad)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const handleToggle = async (id) => {
        await fetch(`${API_URL}/api/superadmin/restaurants/${id}/toggle`, {
            method: 'PUT', headers: authHeaders()
        })
        fetchData()
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!newName.trim()) return
        setCreating(true)
        try {
            await fetch(`${API_URL}/api/superadmin/restaurants`, {
                method: 'POST',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() }),
            })
            setNewName(''); setShowModal(false); fetchData()
        } catch (e) { console.error(e) }
        finally { setCreating(false) }
    }

    const handleManage = (rest) => {
        localStorage.setItem('selectedRestaurant', JSON.stringify(rest))
        navigate('/admin')
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="loader" />
        </div>
    )

    return (
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px', fontFamily: 'inherit' }}>
            <style>{animatedButtonStyles.hoverStyles}</style>

            {/* ── HEADER ── */}
            <div style={{ ...cardStyles.card, padding: '20px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.brown, marginBottom: 4 }}>
                        Super Admin Portal
                    </div>
                    <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: colors.primaryDark }}>
                        Restaurant Network
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.brown }}>
                        Logged in as <strong>{user?.username}</strong> · Full network access
                    </p>
                </div>
                {/* Exit button — using the close-button pattern from the shared system */}
                <button
                    className="close-button"
                    onClick={onExit}
                    style={{
                        ...animatedButtonStyles.closeButton,
                        minWidth: 120,
                    }}
                >
                    ↩ Exit Portal
                </button>
            </div>

            {/* ── STATS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 24 }}>
                <StatCard label="Network Earnings" value={`₹${(analytics?.totalEarnings || 0).toFixed(2)}`} icon="💰" />
                <StatCard label="Total Orders" value={analytics?.totalOrders ?? 0} icon="📋" />
                <StatCard label="Active" value={analytics?.activeRestaurants ?? 0} icon="✅" />
                <StatCard label="Suspended" value={analytics?.suspendedRestaurants ?? 0} icon="⛔" />
            </div>

            {/* ── RESTAURANTS TABLE ── */}
            <Section title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span>Managed Restaurants</span>
                    {/* Add button — AnimatedButton, exact same as rest of app */}
                    <AnimatedButton
                        onClick={() => setShowModal(true)}
                        color={colors.primary}
                        hoverColor={colors.primaryDark}
                        minWidth="180px"
                        height="38px"
                    >
                        + Add Restaurant
                    </AnimatedButton>
                </div>
            }>
                {restaurants.length === 0 ? (
                    <p style={{ color: colors.brown, textAlign: 'center', padding: '32px 0', fontStyle: 'italic' }}>
                        No restaurants yet — click "+ Add Restaurant" to get started.
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: `2px solid rgba(212,167,106, 0.2)` }}>
                                    {['Restaurant', 'Created', 'Earnings', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{
                                            padding: '10px 12px',
                                            textAlign: h === 'Earnings' ? 'right' : (h === 'Status' || h === 'Actions') ? 'center' : 'left',
                                            fontSize: 11, fontWeight: 700,
                                            letterSpacing: '0.1em', textTransform: 'uppercase',
                                            color: colors.brown,
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {restaurants.map((rest, i) => {
                                    const isActive = rest.status === 'active'
                                    return (
                                        <tr
                                            key={rest._id}
                                            style={{
                                                borderBottom: i < restaurants.length - 1
                                                    ? '1px solid rgba(212,167,106,0.12)' : 'none',
                                            }}
                                        >
                                            {/* Name */}
                                            <td style={{ padding: '14px 12px', fontWeight: 700, color: colors.primaryDark, fontSize: 15 }}>
                                                🍽 {rest.name}
                                            </td>
                                            {/* Date */}
                                            <td style={{ padding: '14px 12px', color: colors.brown, fontSize: 13 }}>
                                                {new Date(rest.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            {/* Earnings */}
                                            <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: '#5a7a2b', fontVariantNumeric: 'tabular-nums', fontSize: 14 }}>
                                                ₹{(rest.earnings || 0).toFixed(2)}
                                            </td>
                                            {/* Status badge */}
                                            <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                                                <StatusBadge active={isActive} />
                                            </td>
                                            {/* Action buttons — exact tableButtonStyles from shared system */}
                                            <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    {/* Manage — view-button style from shared system */}
                                                    <button
                                                        className="view-button admin-button"
                                                        onClick={() => handleManage(rest)}
                                                        style={{ ...tableButtonStyles.adminButton, minWidth: 110 }}
                                                    >
                                                        <PenIcon style={{ width: 14, height: 14 }} /> Manage
                                                    </button>
                                                    {/* Toggle — proper AnimatedButton, same as all other buttons in the app */}
                                                    <AnimatedButton
                                                        onClick={() => handleToggle(rest._id)}
                                                        color={colors.primary}
                                                        hoverColor={colors.primaryDark}
                                                        minWidth="130px"
                                                        height="36px"
                                                    >
                                                        {isActive ? 'Suspend' : 'Reactivate'}
                                                    </AnimatedButton>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>

            {/* ── NEW RESTAURANT MODAL ── */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 300,
                    background: 'rgba(62,39,35,0.4)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 16,
                }}>
                    <div className="anim-scale-in" style={{
                        ...cardStyles.card,
                        background: 'rgba(255,250,245,0.97)',
                        width: '100%', maxWidth: 420,
                        padding: 28,
                    }}>
                        <h3 style={{ ...cardStyles.title, marginBottom: 6 }}>🍽 New Restaurant</h3>
                        <p style={{ fontSize: 13, color: colors.brown, margin: '0 0 20px' }}>
                            Give your new location a name. Menu, tables, and staff can be added after.
                        </p>
                        <form onSubmit={handleCreate}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.brown, marginBottom: 6 }}>
                                Restaurant Name
                            </label>
                            <input
                                className="input"
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                required
                                autoFocus
                                placeholder="e.g. Pizza Palace"
                                style={{ marginBottom: 20 }}
                            />
                            <div style={{ display: 'flex', gap: 12 }}>
                                {/* Cancel — close-button style */}
                                <button
                                    type="button"
                                    className="close-button"
                                    onClick={() => { setShowModal(false); setNewName('') }}
                                    style={{ ...animatedButtonStyles.closeButton, flex: 1, minWidth: 'unset' }}
                                >
                                    Cancel
                                </button>
                                {/* Submit — AnimatedButton */}
                                <AnimatedButton
                                    type="submit"
                                    disabled={creating}
                                    style={{ flex: 1, opacity: creating ? 0.7 : 1, minWidth: 'unset', height: 40 }}
                                >
                                    {creating ? 'Creating…' : 'Create'}
                                </AnimatedButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SuperAdminDashboard
