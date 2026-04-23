import { useState, useRef, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = [
    'What dairy products do you have?',
    'Suggest a healthy grain',
    'Which oils are in stock?',
    'What are your bakery items?',
];

export default function ChatBot() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        {
            role: 'model',
            text: `Hi ${user?.name?.split(' ')[0] || 'there'} 👋  I'm SmartCart AI. Ask me anything about our products!`,
        },
    ]);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to latest message
    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    // Focus input when panel opens
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 150);
    }, [open]);

    const sendMessage = async (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed || loading) return;

        const userMsg = { role: 'user', text: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await API.post('/chat', { message: trimmed, history });
            const reply = res.data.reply;

            setMessages(prev => [...prev, { role: 'model', text: reply }]);
            // Maintain multi-turn history for the AI
            setHistory(prev => [
                ...prev,
                { role: 'user', parts: trimmed },
                { role: 'model', parts: reply },
            ]);
        } catch (err) {
            const errText =
                err.response?.data?.message ||
                'Sorry, I couldn\'t reach the AI right now. Please try again.';
            setMessages(prev => [...prev, { role: 'error', text: errText }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([{
            role: 'model',
            text: `Hi ${user?.name?.split(' ')[0] || 'there'} 👋  I'm SmartCart AI. Ask me anything about our products!`,
        }]);
        setHistory([]);
    };

    if (!user) return null;

    return (
        <>
            {/* ── Floating Bubble ─────────────────────────────── */}
            <button
                id="chatbot-toggle"
                onClick={() => setOpen(o => !o)}
                style={styles.bubble}
                title="SmartCart AI Assistant"
            >
                {open ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )}
                {!open && messages.length > 1 && (
                    <span style={styles.bubbleBadge}>{messages.filter(m => m.role === 'model').length - 1}</span>
                )}
            </button>

            {/* ── Chat Panel ──────────────────────────────────── */}
            <div style={{ ...styles.panel, ...(open ? styles.panelOpen : styles.panelClosed) }}>

                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <div style={styles.avatarDot} />
                        <div>
                            <div style={styles.headerTitle}>SmartCart <span style={styles.accent}>AI</span></div>
                            <div style={styles.headerSub}>Grocery assistant · always online</div>
                        </div>
                    </div>
                    <button onClick={clearChat} style={styles.clearBtn} title="Clear chat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div style={styles.messages} id="chatbot-messages">
                    {messages.map((msg, i) => (
                        <div key={i} style={{ ...styles.msgRow, ...(msg.role === 'user' ? styles.msgRowUser : {}) }}>
                            {msg.role !== 'user' && (
                                <div style={styles.msgAvatar}>🤖</div>
                            )}
                            <div style={{
                                ...styles.bubble2,
                                ...(msg.role === 'user' ? styles.bubbleUser : msg.role === 'error' ? styles.bubbleError : styles.bubbleAI),
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                        <div style={styles.msgRow}>
                            <div style={styles.msgAvatar}>🤖</div>
                            <div style={{ ...styles.bubble2, ...styles.bubbleAI, ...styles.typingBubble }}>
                                <span style={styles.dot} /><span style={{ ...styles.dot, animationDelay: '0.2s' }} /><span style={{ ...styles.dot, animationDelay: '0.4s' }} />
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Quick suggestions (show only at start) */}
                {messages.length === 1 && !loading && (
                    <div style={styles.suggestions}>
                        {SUGGESTIONS.map((s, i) => (
                            <button key={i} style={styles.chip} onClick={() => sendMessage(s)}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div style={styles.inputRow}>
                    <input
                        ref={inputRef}
                        id="chatbot-input"
                        style={styles.input}
                        placeholder="Ask about any product…"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        disabled={loading}
                    />
                    <button
                        id="chatbot-send"
                        style={{ ...styles.sendBtn, ...((!input.trim() || loading) ? styles.sendBtnDisabled : {}) }}
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Typing animation keyframes injected once */}
            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                    40% { transform: translateY(-5px); opacity: 1; }
                }
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes pulseBubble {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
                    50% { box-shadow: 0 0 0 8px rgba(124,58,237,0); }
                }
                #chatbot-toggle { animation: pulseBubble 2.5s ease-in-out infinite; }
                #chatbot-input::placeholder { color: #475569; }
                #chatbot-input:focus { outline: none; border-color: rgba(124,58,237,0.5); }
            `}</style>
        </>
    );
}

const styles = {
    /* ── Floating Bubble ── */
    bubble: {
        position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
        width: '56px', height: '56px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', boxShadow: '0 8px 24px rgba(124,58,237,0.45)',
        transition: 'transform 0.2s',
    },
    bubbleBadge: {
        position: 'absolute', top: '2px', right: '2px',
        background: '#ef4444', color: '#fff',
        fontSize: '10px', fontWeight: '700',
        width: '18px', height: '18px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },

    /* ── Panel ── */
    panel: {
        position: 'fixed', bottom: '96px', right: '28px', zIndex: 9998,
        width: '360px',
        background: 'linear-gradient(180deg, #0f0f1a 0%, #0d1117 100%)',
        border: '0.5px solid rgba(124,58,237,0.3)',
        borderRadius: '20px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transition: 'opacity 0.25s, transform 0.25s',
        fontFamily: "'Inter', -apple-system, sans-serif",
    },
    panelOpen: { opacity: 1, transform: 'translateY(0) scale(1)', pointerEvents: 'all', animation: 'chatSlideUp 0.28s ease' },
    panelClosed: { opacity: 0, transform: 'translateY(16px) scale(0.96)', pointerEvents: 'none' },

    /* ── Header ── */
    header: {
        padding: '14px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        background: 'rgba(124,58,237,0.08)',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    avatarDot: {
        width: '36px', height: '36px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0,
    },
    headerTitle: { fontSize: '14px', fontWeight: '600', color: '#e2e8f0' },
    accent: { color: '#a78bfa' },
    headerSub: { fontSize: '11px', color: '#10b981', marginTop: '1px' },
    clearBtn: {
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: '#475569', padding: '6px', borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'color 0.15s',
    },

    /* ── Messages ── */
    messages: {
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        maxHeight: '320px', minHeight: '200px',
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.2) transparent',
    },
    msgRow: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
    msgRowUser: { flexDirection: 'row-reverse' },
    msgAvatar: { fontSize: '20px', flexShrink: 0, marginBottom: '2px' },
    bubble2: {
        maxWidth: '76%', padding: '10px 13px',
        borderRadius: '14px', fontSize: '13px', lineHeight: '1.5',
        wordBreak: 'break-word',
    },
    bubbleAI: {
        background: 'rgba(255,255,255,0.05)', color: '#e2e8f0',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderBottomLeftRadius: '4px',
    },
    bubbleUser: {
        background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
        color: '#fff', borderBottomRightRadius: '4px',
    },
    bubbleError: {
        background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
        border: '0.5px solid rgba(239,68,68,0.25)',
    },
    typingBubble: {
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '12px 16px',
    },
    dot: {
        display: 'inline-block', width: '6px', height: '6px',
        borderRadius: '50%', background: '#a78bfa',
        animation: 'bounce 1.2s ease-in-out infinite',
    },

    /* ── Suggestions ── */
    suggestions: {
        padding: '0 12px 12px', display: 'flex', flexWrap: 'wrap', gap: '6px',
    },
    chip: {
        padding: '5px 12px',
        background: 'rgba(124,58,237,0.15)',
        border: '0.5px solid rgba(124,58,237,0.3)',
        borderRadius: '20px', color: '#c4b5fd',
        fontSize: '11px', cursor: 'pointer',
        transition: 'background 0.15s',
    },

    /* ── Input row ── */
    inputRow: {
        padding: '12px', display: 'flex', gap: '8px', alignItems: 'center',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
    },
    input: {
        flex: 1, padding: '10px 14px',
        background: 'rgba(255,255,255,0.05)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', color: '#e2e8f0',
        fontSize: '13px', resize: 'none',
        transition: 'border-color 0.2s',
    },
    sendBtn: {
        width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
        background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', transition: 'opacity 0.15s',
    },
    sendBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
};
