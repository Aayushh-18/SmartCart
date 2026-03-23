import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
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
            const res = await API.post('/auth/login', form);
            login(res.data.user, res.data.token);
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.left}>
                <div style={styles.brand}>SmartCart <span style={styles.brandAccent}>AI</span></div>
                <h1 style={styles.heroTitle}>Your grocery store<br />that thinks ahead</h1>
                <p style={styles.heroSub}>AI-powered predictions. Smart refill alerts. Personalized recommendations.</p>
                <div style={styles.features}>
                    {['Predicts when you run out', 'Recommends what to buy', 'Tracks your spending'].map((f, i) => (
                        <div key={i} style={styles.featureItem}>
                            <div style={styles.featureDot} />
                            <span style={styles.featureText}>{f}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={styles.right}>
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Welcome back</h2>
                    <p style={styles.cardSub}>Sign in to your account</p>
                    {error && <div style={styles.error}>{error}</div>}
                    <form onSubmit={handleSubmit}>
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
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                    <p style={styles.switchText}>
                        Don't have an account? <Link to="/register">Create one</Link>
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
    features: { display: 'flex', flexDirection: 'column', gap: '14px' },
    featureItem: { display: 'flex', alignItems: 'center', gap: '12px' },
    featureDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', flexShrink: 0 },
    featureText: { color: '#cbd5e1', fontSize: '14px' },
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