import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Feedback() {
    const [form, setForm] = useState({
        name: '', email: '', rating: 5, message: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('email', form.email);
            formData.append('rating', form.rating);
            formData.append('message', form.message);

            const res = await fetch(
                'http://localhost:8080/feedback-servlet/feedback',
                { method: 'POST', body: formData }
            );

            const data = await res.json();

            if (data.success) {
                setSubmitted(true);
            } else {
                setError(data.message || 'Submission failed');
            }
        } catch (err) {
            setError('Could not connect to server. Make sure Tomcat is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            {/* Navbar */}
            <div style={styles.navbar}>
                <div style={styles.navLogo}>
                    SmartCart <span style={styles.accent}>AI</span>
                </div>
                <div style={styles.navRight}>
                    <span style={styles.navUser}>Hi, {user?.name}</span>
                    <button style={styles.navBtn}
                        onClick={() => navigate('/home')}>
                        Shop
                    </button>
                    <button style={styles.navBtn}
                        onClick={() => navigate('/dashboard')}>
                        Dashboard
                    </button>
                    <button style={styles.navLogout}
                        onClick={() => { logout(); navigate('/'); }}>
                        Logout
                    </button>
                </div>
            </div>

            <div style={styles.body}>
                <div style={styles.card}>
                    <h2 style={styles.title}>Share Your Feedback</h2>
                    <p style={styles.subtitle}>
                        Help us improve SmartCart AI
                    </p>

                    {submitted ? (
                        <div style={styles.successBox}>
                            <div style={styles.successIcon}>✓</div>
                            <h3 style={styles.successTitle}>
                                Thank you for your feedback!
                            </h3>
                            <p style={styles.successText}>
                                We appreciate you taking the time to share
                                your thoughts with us.
                            </p>
                            <button style={styles.btn}
                                onClick={() => navigate('/home')}>
                                Back to Shopping
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div style={styles.errorBox}>{error}</div>
                            )}

                            <div style={styles.row}>
                                <div style={styles.field}>
                                    <label style={styles.label}>
                                        Full Name
                                    </label>
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
                                    <label style={styles.label}>
                                        Email Address
                                    </label>
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
                            </div>

                            <div style={styles.field}>
                                <label style={styles.label}>
                                    Rating
                                </label>
                                <div style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span
                                            key={star}
                                            style={{
                                                ...styles.star,
                                                color: star <= form.rating
                                                    ? '#f59e0b' : '#334155'
                                            }}
                                            onClick={() => setForm({
                                                ...form, rating: star
                                            })}
                                        >
                                            ★
                                        </span>
                                    ))}
                                    <span style={styles.ratingText}>
                                        {form.rating}/5
                                    </span>
                                </div>
                            </div>

                            <div style={styles.field}>
                                <label style={styles.label}>
                                    Your Message
                                </label>
                                <textarea
                                    style={styles.textarea}
                                    name="message"
                                    placeholder="Tell us about your experience..."
                                    value={form.message}
                                    onChange={handleChange}
                                    rows={5}
                                    required
                                />
                            </div>

                            <button
                                style={styles.btn}
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? 'Submitting...'
                                    : 'Submit Feedback'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
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
    body: { display: 'flex', justifyContent: 'center', padding: '40px 24px' },
    card: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '620px' },
    title: { fontSize: '22px', fontWeight: '600', color: '#f1f5f9', marginBottom: '6px', marginTop: 0 },
    subtitle: { fontSize: '14px', color: '#64748b', marginBottom: '28px' },
    errorBox: { background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    field: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' },
    input: { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    starsRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    star: { fontSize: '28px', cursor: 'pointer', transition: 'color 0.1s' },
    ratingText: { color: '#64748b', fontSize: '13px', marginLeft: '4px' },
    textarea: { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
    btn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '15px', fontWeight: '500', cursor: 'pointer' },
    successBox: { textAlign: 'center', padding: '20px 0' },
    successIcon: { width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '0.5px solid rgba(16,185,129,0.4)', color: '#34d399', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
    successTitle: { color: '#f1f5f9', fontSize: '18px', marginBottom: '8px' },
    successText: { color: '#64748b', fontSize: '14px', marginBottom: '24px' }
};