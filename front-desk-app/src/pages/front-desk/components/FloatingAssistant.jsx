import { useState, useRef, useEffect } from 'react';

const QUICK_ACTIONS = [
  { label: 'Create Lead', icon: 'fa-user-plus', page: 'leads' },
  { label: 'New Order', icon: 'fa-cart-plus', page: 'orders' },
  { label: 'Site Visit', icon: 'fa-map-location-dot', page: 'site visits' },
  { label: 'Payments', icon: 'fa-credit-card', page: 'payments' },
];

export default function FloatingAssistant({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: "Hi! I'm your front desk assistant. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const reply = generateReply(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: reply.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      if (reply.action && onNavigate) {
        setTimeout(() => {
          onNavigate(reply.action);
          setIsOpen(false);
        }, 600);
      }
    }, 400);
  };

  const handleQuickAction = (action) => {
    if (onNavigate) onNavigate(action.page);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00ced1, #0891b2)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 14px rgba(0,206,209,0.4)',
            cursor: 'pointer',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,206,209,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,206,209,0.4)';
          }}
          title="Assistant"
        >
          <i className="fa-solid fa-robot"></i>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 48px)',
            height: '520px',
            maxHeight: 'calc(100vh - 100px)',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'assistantSlideUp 0.25s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #00ced1, #0891b2)',
              color: '#fff',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                }}
              >
                <i className="fa-solid fa-robot"></i>
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', lineHeight: 1.2 }}>Assistant</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>Front Desk Helper</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Quick Actions */}
          <div
            style={{
              padding: '10px 14px',
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              borderBottom: '1px solid #f1f5f9',
              flexShrink: 0,
            }}
          >
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e6fffd';
                  e.currentTarget.style.borderColor = '#b5f5f5';
                  e.currentTarget.style.color = '#00ced1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#475569';
                }}
              >
                <i className={`fa-solid ${action.icon}`} style={{ fontSize: '10px' }}></i>
                {action.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #00ced1, #0891b2)' : '#f1f5f9',
                    color: msg.role === 'user' ? '#fff' : '#334155',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                  <div
                    style={{
                      fontSize: '10px',
                      marginTop: '4px',
                      opacity: 0.6,
                      textAlign: msg.role === 'user' ? 'right' : 'left',
                    }}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px 14px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              gap: '8px',
              flexShrink: 0,
              background: '#fff',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                fontSize: '13px',
                color: '#334155',
                background: '#f8fafc',
              }}
            />
            <button
              onClick={handleSend}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: 'none',
                background: input.trim() ? 'linear-gradient(135deg, #00ced1, #0891b2)' : '#e2e8f0',
                color: input.trim() ? '#fff' : '#94a3b8',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes assistantSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

function generateReply(text) {
  const lower = text.toLowerCase();

  if (lower.includes('lead') || lower.includes('create lead')) {
    return { text: "I'll take you to the Leads page to create a new lead.", action: 'leads' };
  }
  if (lower.includes('order') || lower.includes('new order')) {
    return { text: "Opening the Orders page for you now.", action: 'orders' };
  }
  if (lower.includes('site visit') || lower.includes('visit')) {
    return { text: "Taking you to the Site Visits page.", action: 'site visits' };
  }
  if (lower.includes('payment') || lower.includes('invoice')) {
    return { text: "Here's the Payments page for you.", action: 'payments' };
  }
  if (lower.includes('design')) {
    return { text: "Let me open the Designs page.", action: 'designs' };
  }
  if (lower.includes('client') || lower.includes('customer')) {
    return { text: "Taking you to the Clients page.", action: 'clients' };
  }
  if (lower.includes('report')) {
    return { text: "Opening the Reports section.", action: 'report' };
  }
  if (lower.includes('message') || lower.includes('chat')) {
    return { text: "Here are your Messages.", action: 'messages' };
  }
  if (lower.includes('setting') || lower.includes('profile')) {
    return { text: "Opening Settings for you.", action: 'settings' };
  }
  if (lower.includes('help') || lower.includes('what can you do')) {
    return {
      text: "I can help you navigate the dashboard quickly! Try asking me to:\n• Create a lead\n• Open orders\n• Check payments\n• View designs\n• See reports\n• And more!",
    };
  }

  return {
    text: "I can help you navigate the dashboard. Try asking about leads, orders, payments, designs, or reports!",
  };
}
