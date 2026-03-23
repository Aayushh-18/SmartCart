import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await API.post('/auth/register', form);
            login(res.data.user, res.data.token);
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.left}>
                <div style={styles.brand}>SmartCart <span style={styles.brandAccent}>AI</span></div>
                <h1 style={styles.heroTitle}>Start your smart<br />grocery journey</h1>
                <p style={styles.heroSub}>Join thousands of users who never run out of groceries again.</p>
                <div style={styles.statsRow}>
                    {[['AI Predictions', 'Refill alerts'], ['Smart Recs', 'Personalised'], ['Analytics', 'Spending trends']].map(([title, sub], i) => (
                        <div key={i} style={styles.statBox}>
                            <div style={styles.statTitle}>{title}</div>
                            <div style={styles.statSub}>{sub}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div style={styles.right}>
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Create account</h2>
                    <p style={styles.cardSub}>Get started for free</p>
                    {error && <div style={styles.error}>{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div style={styles.field}>
                            <label style={styles.label}>Full Name</label>
                            <input
                                style={styles.input}
                                type="text"
                                name="name"
                                placeholder="Aayush Thakare"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Email</label>
                            <input
                                style={styles.input}
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Password</label>
                            <input
                                style={styles.input}
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <button style={styles.btn} type="submit" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                    <p style={styles.switchText}>
                        Already have an account? <Link to="/">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { display: 'flex', minHeight: '100vh' },
    left: { flex: 1, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '60px 50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    brand: { fontSize: '22px', fontWeight: '600', color: '#e2e8f0', marginBottom: '40px' },
    brandAccent: { color: '#a78bfa' },
    heroTitle: { fontSize: '36px', fontWeight: '600', color: '#f1f5f9', lineHeight: '1.3', marginBottom: '16px' },
    heroSub: { fontSize: '15px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '36px', maxWidth: '340px' },
    statsRow: { display: 'flex', gap: '12px' },
    statBox: { flex: 1, background: 'rgba(124,58,237,0.15)', border: '0.5px solid rgba(124,58,237,0.3)', borderRadius: '10px', padding: '14px' },
    statTitle: { color: '#c4b5fd', fontSize: '13px', fontWeight: '500', marginBottom: '4px' },
    statSub: { color: '#64748b', fontSize: '11px' },
    right: { width: '440px', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
    card: { width: '100%', maxWidth: '360px' },
    cardTitle: { fontSize: '24px', fontWeight: '600', color: '#f1f5f9', marginBottom: '6px' },
    cardSub: { fontSize: '14px', color: '#64748b', marginBottom: '28px' },
    error: { background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
    field: { marginBottom: '18px' },
    label: { display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' },
    input: { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', outline: 'none' },
    btn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '15px', fontWeight: '500', cursor: 'pointer', marginTop: '6px' },
    switchText: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }
};