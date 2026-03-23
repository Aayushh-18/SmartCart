import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Grains', 'Dairy', 'Oils', 'Bakery'];

const EMOJI_MAP = {
    Grains: '🌾', Dairy: '🥛', Oils: '🫙', Bakery: '🍞', default: '🛍️'
};

export default function Home() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [cart, setCart] = useState([]);
    const [message, setMessage] = useState('');
    const [orderLoading, setOrderLoading] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchProducts(); }, [search, category]);

    const fetchProducts = async () => {
        try {
            const res = await API.get('/products', {
                params: {
                    search,
                    category: category === 'All' ? '' : category
                }
            });
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const addToCart = (product) => {
        const existing = cart.find(i => i.productId === product._id);
        if (existing) {
            setCart(cart.map(i => i.productId === product._id
                ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, { productId: product._id, name: product.name, price: product.price, quantity: 1 }]);
        }
    };

    const updateQty = (productId, delta) => {
        setCart(cart
            .map(i => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
            .filter(i => i.quantity > 0)
        );
    };

    const placeOrder = async () => {
        if (cart.length === 0) return;
        setOrderLoading(true);
        try {
            await API.post('/orders/place', {
                items: cart.map(i => ({ productId: i.productId, quantity: i.quantity }))
            });
            setMessage('Order placed successfully!');
            setCart([]);
            fetchProducts();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Order failed');
        } finally {
            setOrderLoading(false);
        }
    };

    const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <div style={styles.page}>
            {/* Navbar */}
            <div style={styles.navbar}>
                <div style={styles.navLogo}>SmartCart <span style={styles.accent}>AI</span></div>
                <div style={styles.navSearch}>
                    <input
                        style={styles.navSearchInput}
                        placeholder="Search groceries..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div style={styles.navRight}>
                    <span style={styles.navUser}>Hi, {user?.name}</span>
                    <button style={styles.navBtn} onClick={() => navigate('/dashboard')}>Dashboard</button>
                    <button style={styles.navLogout} onClick={() => { logout(); navigate('/'); }}>Logout</button>
                </div>
            </div>

            {/* Hero */}
            <div style={styles.hero}>
                <div style={styles.heroContent}>
                    <h2 style={styles.heroTitle}>Fresh Groceries, <span style={styles.accent}>Predicted</span> for You</h2>
                    <p style={styles.heroSub}>AI-powered smart refill suggestions based on your purchase habits</p>
                </div>
                <div style={styles.heroOrbs}>
                    <div style={styles.orb1} />
                    <div style={styles.orb2} />
                </div>
            </div>

            <div style={styles.body}>
                {/* Sidebar */}
                <div style={styles.sidebar}>
                    <div style={styles.sidebarTitle}>Categories</div>
                    {CATEGORIES.map(cat => (
                        <div
                            key={cat}
                            style={{ ...styles.catItem, ...(category === cat || (cat === 'All' && category === '') ? styles.catItemActive : {}) }}
                            onClick={() => setCategory(cat === 'All' ? '' : cat)}
                        >
                            <span style={styles.catEmoji}>{EMOJI_MAP[cat] || '🛒'}</span>
                            <span style={styles.catLabel}>{cat}</span>
                        </div>
                    ))}
                </div>

                {/* Products */}
                <div style={styles.products}>
                    <div style={styles.productsHeader}>
                        <span style={styles.productsCount}>{products.length} products</span>
                    </div>
                    <div style={styles.grid}>
                        {products.map(product => (
                            <div key={product._id} style={styles.productCard}>
                                <div style={styles.productTop}>
                                    <div style={styles.productIcon}>
                                        {EMOJI_MAP[product.category] || EMOJI_MAP.default}
                                    </div>
                                    <div style={styles.stockBadge}>
                                        {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                                    </div>
                                </div>
                                <div style={styles.productName}>{product.name}</div>
                                <div style={styles.productCat}>{product.category}</div>
                                <div style={styles.productBottom}>
                                    <div>
                                        <div style={styles.productPrice}>₹{product.price}</div>
                                        <div style={styles.productUnit}>per {product.unit}</div>
                                    </div>
                                    <button
                                        style={{ ...styles.addBtn, ...(product.stock === 0 ? styles.addBtnDisabled : {}) }}
                                        onClick={() => addToCart(product)}
                                        disabled={product.stock === 0}
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cart */}
                <div style={styles.cart}>
                    <div style={styles.cartHeader}>
                        <span style={styles.cartTitle}>Cart</span>
                        {totalItems > 0 && <span style={styles.cartBadge}>{totalItems}</span>}
                    </div>

                    {message && (
                        <div style={message.includes('success') ? styles.successMsg : styles.errorMsg}>
                            {message}
                        </div>
                    )}

                    {cart.length === 0 ? (
                        <div style={styles.emptyCart}>
                            <div style={styles.emptyIcon}>🛒</div>
                            <p style={styles.emptyText}>Your cart is empty</p>
                        </div>
                    ) : (
                        <>
                            <div style={styles.cartItems}>
                                {cart.map(item => (
                                    <div key={item.productId} style={styles.cartItem}>
                                        <div style={styles.cartItemName}>{item.name}</div>
                                        <div style={styles.cartItemControls}>
                                            <button style={styles.qtyBtn} onClick={() => updateQty(item.productId, -1)}>−</button>
                                            <span style={styles.qtyVal}>{item.quantity}</span>
                                            <button style={styles.qtyBtn} onClick={() => updateQty(item.productId, 1)}>+</button>
                                        </div>
                                        <div style={styles.cartItemPrice}>₹{item.price * item.quantity}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={styles.cartDivider} />
                            <div style={styles.cartTotal}>
                                <span style={styles.cartTotalLabel}>Total</span>
                                <span style={styles.cartTotalValue}>₹{totalAmount}</span>
                            </div>
                            <button
                                style={styles.orderBtn}
                                onClick={placeOrder}
                                disabled={orderLoading}
                            >
                                {orderLoading ? 'Placing...' : 'Place Order'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', background: '#0d1117' },
    navbar: { background: '#0d1117', borderBottom: '0.5px solid rgba(255,255,255,0.08)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100 },
    navLogo: { fontSize: '18px', fontWeight: '600', color: '#e2e8f0', whiteSpace: 'nowrap' },
    accent: { color: '#a78bfa' },
    navSearch: { flex: 1, maxWidth: '400px' },
    navSearchInput: { width: '100%', padding: '9px 16px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', outline: 'none' },
    navRight: { display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' },
    navUser: { color: '#94a3b8', fontSize: '13px' },
    navBtn: { padding: '7px 16px', background: 'rgba(124,58,237,0.2)', border: '0.5px solid rgba(124,58,237,0.4)', borderRadius: '8px', color: '#c4b5fd', fontSize: '13px', cursor: 'pointer' },
    navLogout: { padding: '7px 16px', background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#64748b', fontSize: '13px', cursor: 'pointer' },
    hero: { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)', padding: '32px 24px', position: 'relative', overflow: 'hidden' },
    heroContent: { position: 'relative', zIndex: 1 },
    heroTitle: { fontSize: '24px', fontWeight: '600', color: '#f1f5f9', marginBottom: '8px' },
    heroSub: { fontSize: '14px', color: '#94a3b8' },
    heroOrbs: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '300px' },
    orb1: { position: 'absolute', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(124,58,237,0.15)', top: '-60px', right: '-20px' },
    orb2: { position: 'absolute', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', bottom: '-20px', right: '80px' },
    body: { display: 'flex', gap: '0', padding: '0' },
    sidebar: { width: '200px', background: '#0d1117', borderRight: '0.5px solid rgba(255,255,255,0.06)', padding: '20px 12px', flexShrink: 0, minHeight: 'calc(100vh - 140px)' },
    sidebarTitle: { color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 8px', marginBottom: '10px' },
    catItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px' },
    catItemActive: { background: 'rgba(124,58,237,0.2)', border: '0.5px solid rgba(124,58,237,0.3)' },
    catEmoji: { fontSize: '16px' },
    catLabel: { fontSize: '13px', color: '#94a3b8' },
    products: { flex: 1, padding: '20px' },
    productsHeader: { marginBottom: '16px' },
    productsCount: { color: '#64748b', fontSize: '13px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' },
    productCard: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', transition: 'border-color 0.2s' },
    productTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
    productIcon: { fontSize: '28px' },
    stockBadge: { fontSize: '10px', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '10px' },
    productName: { fontSize: '14px', fontWeight: '500', color: '#e2e8f0', marginBottom: '4px' },
    productCat: { fontSize: '12px', color: '#64748b', marginBottom: '14px' },
    productBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
    productPrice: { fontSize: '16px', fontWeight: '600', color: '#a78bfa' },
    productUnit: { fontSize: '10px', color: '#475569' },
    addBtn: { padding: '7px 14px', background: 'rgba(124,58,237,0.25)', border: '0.5px solid rgba(124,58,237,0.4)', borderRadius: '7px', color: '#c4b5fd', fontSize: '12px', cursor: 'pointer', fontWeight: '500' },
    addBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
    cart: { width: '260px', background: '#111827', borderLeft: '0.5px solid rgba(255,255,255,0.06)', padding: '20px', flexShrink: 0, minHeight: 'calc(100vh - 140px)' },
    cartHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
    cartTitle: { fontSize: '15px', fontWeight: '500', color: '#e2e8f0' },
    cartBadge: { background: '#7c3aed', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '10px' },
    emptyCart: { textAlign: 'center', paddingTop: '40px' },
    emptyIcon: { fontSize: '32px', marginBottom: '10px' },
    emptyText: { color: '#475569', fontSize: '13px' },
    cartItems: { display: 'flex', flexDirection: 'column', gap: '10px' },
    cartItem: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '10px' },
    cartItemName: { fontSize: '13px', color: '#e2e8f0', marginBottom: '8px' },
    cartItemControls: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
    qtyBtn: { width: '24px', height: '24px', background: 'rgba(124,58,237,0.2)', border: '0.5px solid rgba(124,58,237,0.3)', borderRadius: '6px', color: '#c4b5fd', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    qtyVal: { color: '#e2e8f0', fontSize: '13px', minWidth: '20px', textAlign: 'center' },
    cartItemPrice: { fontSize: '13px', color: '#a78bfa', fontWeight: '500' },
    cartDivider: { height: '0.5px', background: 'rgba(255,255,255,0.07)', margin: '14px 0' },
    cartTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
    cartTotalLabel: { color: '#94a3b8', fontSize: '13px' },
    cartTotalValue: { color: '#a78bfa', fontSize: '20px', fontWeight: '600' },
    orderBtn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
    successMsg: { background: 'rgba(16,185,129,0.1)', border: '0.5px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px', textAlign: 'center' },
    errorMsg: { background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }
};