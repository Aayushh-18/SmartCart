import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const [predictions, setPredictions] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { fetchAllData(); }, []);

    const fetchAllData = async () => {
        try {
            const [predRes, recRes, orderRes] = await Promise.all([
                axios.get(`https://smartcart-ai-module.onrender.com/predict/${user.id}`),
                axios.get(`https://smartcart-ai-module.onrender.com/recommend/${user.id}`),
                API.get('/orders/myorders')
            ]);
            setPredictions(predRes.data.predictions);
            setRecommendations(recRes.data.recommendations);
            setOrders(orderRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const urgentCount = predictions.filter(p => p.daysUntilRefill <= 5).length;

    const urgencyColor = (days) => {
        if (days <= 3) return '#ef4444';
        if (days <= 7) return '#f59e0b';
        return '#10b981';
    };

    return (
        <div style={styles.page}>
            {/* Navbar */}
            <div style={styles.navbar}>
                <div style={styles.navLogo}>SmartCart <span style={styles.accent}>AI</span></div>
                <div style={styles.navRight}>
                    <span style={styles.navUser}>Hi, {user?.name}</span>
                    <button style={styles.navBtn} onClick={() => navigate('/home')}>Shop</button>
                    <button style={styles.navLogout} onClick={() => { logout(); navigate('/'); }}>Logout</button>
                </div>
            </div>

            {loading ? (
                <div style={styles.loading}>
                    <div style={styles.loadingDot} />
                    <span>Loading your smart dashboard...</span>
                </div>
            ) : (
                <div style={styles.body}>

                    {/* Page Header */}
                    <div style={styles.pageHeader}>
                        <h2 style={styles.pageTitle}>Your Dashboard</h2>
                        <p style={styles.pageSub}>AI-powered insights based on your purchase history</p>
                    </div>

                    {/* Stats */}
                    <div style={styles.statsGrid}>
                        {[
                            { label: 'Total Orders', value: orders.length, color: '#a78bfa' },
                            { label: 'Total Spent', value: `₹${totalSpent}`, color: '#34d399' },
                            { label: 'Urgent Refills', value: urgentCount, color: '#f87171' },
                            { label: 'Recommendations', value: recommendations.length, color: '#60a5fa' },
                        ].map((stat, i) => (
                            <div key={i} style={styles.statCard}>
                                <div style={styles.statLabel}>{stat.label}</div>
                                <div style={{ ...styles.statValue, color: stat.color }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={styles.row}>
                        {/* Predictions */}
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div style={styles.cardTitle}>Refill Predictions</div>
                                <div style={styles.cardBadge}>{predictions.length} items</div>
                            </div>
                            {predictions.length === 0 ? (
                                <div style={styles.empty}>Place more orders to see AI predictions</div>
                            ) : (
                                predictions.map((p, i) => (
                                    <div key={i} style={styles.predItem}>
                                        <div style={styles.predLeft}>
                                            <div style={styles.predName}>{p.productName}</div>
                                            <div style={styles.predDate}>Refill by {p.predictedRefillDate}</div>
                                        </div>
                                        <div style={{ ...styles.urgencyPill, background: `${urgencyColor(p.daysUntilRefill)}22`, color: urgencyColor(p.daysUntilRefill), border: `0.5px solid ${urgencyColor(p.daysUntilRefill)}44` }}>
                                            {p.daysUntilRefill}d left
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Recommendations */}
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div style={styles.cardTitle}>Recommended For You</div>
                                <div style={styles.cardBadge}>AI picks</div>
                            </div>
                            {recommendations.length === 0 ? (
                                <div style={styles.empty}>Not enough data yet for recommendations</div>
                            ) : (
                                recommendations.map((r, i) => (
                                    <div key={i} style={styles.recItem}>
                                        <div style={styles.recLeft}>
                                            <div style={styles.recName}>{r.productName}</div>
                                            <div style={styles.recCat}>{r.category}</div>
                                        </div>
                                        <div style={styles.recPrice}>₹{r.price}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Order History */}
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div style={styles.cardTitle}>Order History</div>
                            <div style={styles.cardBadge}>{orders.length} orders</div>
                        </div>
                        {orders.length === 0 ? (
                            <div style={styles.empty}>No orders yet</div>
                        ) : (
                            <div style={styles.ordersTable}>
                                <div style={styles.tableHeader}>
                                    <span>Order ID</span>
                                    <span>Items</span>
                                    <span>Date</span>
                                    <span>Amount</span>
                                </div>
                                {orders.map((order, i) => (
                                    <div key={i} style={styles.tableRow}>
                                        <span style={styles.orderId}>#{order._id.slice(-6).toUpperCase()}</span>
                                        <span style={styles.orderItems}>{order.items.map(item => item.productId?.name).filter(Boolean).join(', ') || '—'}</span>
                                        <span style={styles.orderDate}>{new Date(order.orderDate).toLocaleDateString()}</span>
                                        <span style={styles.orderAmount}>₹{order.totalAmount}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', background: '#0d1117' },
    navbar: { background: '#0d1117', borderBottom: '0.5px solid rgba(255,255,255,0.08)', padding: '14px 24px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 },
    navLogo: { fontSize: '18px', fontWeight: '600', color: '#e2e8f0' },
    accent: { color: '#a78bfa' },
    navRight: { display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' },
    navUser: { color: '#94a3b8', fontSize: '13px' },
    navBtn: { padding: '7px 16px', background: 'rgba(124,58,237,0.2)', border: '0.5px solid rgba(124,58,237,0.4)', borderRadius: '8px', color: '#c4b5fd', fontSize: '13px', cursor: 'pointer' },
    navLogout: { padding: '7px 16px', background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#64748b', fontSize: '13px', cursor: 'pointer' },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', height: '60vh', color: '#64748b', fontSize: '14px' },
    loadingDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', animation: 'pulse 1s infinite' },
    body: { padding: '28px 24px', maxWidth: '1200px', margin: '0 auto' },
    pageHeader: { marginBottom: '24px' },
    pageTitle: { fontSize: '22px', fontWeight: '600', color: '#f1f5f9', marginBottom: '4px' },
    pageSub: { fontSize: '13px', color: '#64748b' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' },
    statCard: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px' },
    statLabel: { fontSize: '12px', color: '#64748b', marginBottom: '8px' },
    statValue: { fontSize: '26px', fontWeight: '600' },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' },
    card: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', marginBottom: '14px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    cardTitle: { fontSize: '14px', fontWeight: '500', color: '#e2e8f0' },
    cardBadge: { fontSize: '11px', color: '#7c3aed', background: 'rgba(124,58,237,0.15)', padding: '3px 10px', borderRadius: '10px' },
    empty: { color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px 0' },
    predItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,0.05)' },
    predLeft: {},
    predName: { fontSize: '13px', color: '#e2e8f0', fontWeight: '500', marginBottom: '3px' },
    predDate: { fontSize: '11px', color: '#64748b' },
    urgencyPill: { fontSize: '11px', fontWeight: '500', padding: '4px 10px', borderRadius: '20px' },
    recItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,0.05)' },
    recLeft: {},
    recName: { fontSize: '13px', color: '#e2e8f0', fontWeight: '500', marginBottom: '3px' },
    recCat: { fontSize: '11px', color: '#64748b' },
    recPrice: { fontSize: '14px', color: '#a78bfa', fontWeight: '500' },
    ordersTable: {},
    tableHeader: { display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', padding: '8px 0', borderBottom: '0.5px solid rgba(255,255,255,0.08)', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
    tableRow: { display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', padding: '12px 0', borderBottom: '0.5px solid rgba(255,255,255,0.04)', alignItems: 'center' },
    orderId: { fontSize: '12px', color: '#a78bfa', fontWeight: '500' },
    orderItems: { fontSize: '12px', color: '#94a3b8' },
    orderDate: { fontSize: '12px', color: '#64748b' },
    orderAmount: { fontSize: '13px', color: '#34d399', fontWeight: '500' }
};