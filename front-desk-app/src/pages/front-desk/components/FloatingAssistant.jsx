import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../../lib/auth';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AI_API = (import.meta.env.VITE_AI_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');

const ACCEPTED = [
  '.pdf', '.docx', '.txt', '.md', '.csv', '.json', '.log', '.html', '.xml', '.yml', '.yaml', '.py',
].join(',');

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const rowTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return nowTime();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function sessionDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (d >= startOfToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d >= startOfYesterday) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function humanSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function greeting() {
  return {
    id: 1,
    role: 'assistant',
    text: "Hi! I'm your front desk assistant. I can look up clients, orders, invoices and more, or navigate to a page. You can also upload documents and ask me about them. How can I help?",
  };
}

/* ─── helpers ──────────────────────────────────────────────────────────── */

async function callAI(path, body, method = 'GET') {
  const res = await fetch(`${AI_API}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    } catch { /* keep */ }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

async function uploadFile(user, sid, file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${AI_API}/users/${user.id}/sessions/${sid}/attachments`, { method: 'POST', body: fd });
  if (!res.ok) {
    let detail = `Upload failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    } catch { /* keep */ }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function deleteAttachment(user, sid, aid) {
  const res = await fetch(`${AI_API}/users/${user.id}/sessions/${sid}/attachments/${aid}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    const err = new Error(`Failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
}

/* ─── markdown components ──────────────────────────────────────────────── */

const mdComponents = {
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  table: ({ children, ...props }) => (
    <div style={{ overflowX: 'auto', margin: '4px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }} {...props}>{children}</table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th style={{ border: '1px solid #e2e8f0', padding: '4px 8px', background: '#e2e8f0', textAlign: 'left', fontWeight: 600 }} {...props}>{children}</th>
  ),
  td: ({ children, ...props }) => (
    <td style={{ border: '1px solid #e2e8f0', padding: '4px 8px', verticalAlign: 'top' }} {...props}>{children}</td>
  ),
  code: ({ inline, children, ...props }) =>
    inline
      ? <code style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px', fontSize: '12px' }} {...props}>{children}</code>
      : <code {...props}>{children}</code>,
  pre: ({ children, ...props }) => (
    <pre style={{ background: '#1e293b', color: '#f1f5f9', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', lineHeight: 1.4, overflowX: 'auto', whiteSpace: 'pre' }} {...props}>{children}</pre>
  ),
  ul: ({ children, ...props }) => (
    <ul style={{ margin: '2px 0', paddingLeft: '18px', lineHeight: 1.5 }} {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }) => (
    <ol style={{ margin: '2px 0', paddingLeft: '18px', lineHeight: 1.5 }} {...props}>{children}</ol>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote style={{ borderLeft: '3px solid #0891b2', margin: '4px 0', padding: '2px 10px', color: '#475569', fontStyle: 'italic' }} {...props}>{children}</blockquote>
  ),
  h1: ({ children, ...props }) => <h1 style={{ fontSize: '15px', margin: '4px 0 2px', fontWeight: 700 }} {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 style={{ fontSize: '14px', margin: '4px 0 2px', fontWeight: 700 }} {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 style={{ fontSize: '13px', margin: '4px 0 2px', fontWeight: 700 }} {...props}>{children}</h3>,
};

/* ─── component ────────────────────────────────────────────────────────── */

export default function FloatingAssistant({ onNavigate }) {
  const { user } = useAuth();

  // UI state
  const [isOpen, setIsOpen]           = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [input, setInput]             = useState('');
  const [sending, setSending]         = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [messages, setMessages]       = useState([greeting()]);
  const [attachments, setAttachments] = useState([]);
  const [sessions, setSessions]       = useState([]);
  const [hoveredSid, setHoveredSid]   = useState(null);

  // voice state
  const [listening, setListening]     = useState(false);
  const [autoSpeak, setAutoSpeak]     = useState(true);
  const [speakingId, setSpeakingId]   = useState(null);

  // refs
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const fileRef        = useRef(null);
  const sessionRef     = useRef(null);   // current session id
  const sessionsFetched = useRef(false);
  const loadedSid      = useRef(null);   // which session's data we last loaded
  const freshSids      = useRef(new Set()); // sessions we created here, still titled "New Chat"
  const sentMsgIds     = useRef(new Set()); // assistant replies created during this widget lifecycle
  const autoSpeakRef   = useRef(true);
  const recognitionRef = useRef(null);
  const speakingIdRef  = useRef(null);

  const speechSupported = Boolean(
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const ttsSupported = typeof window !== 'undefined' && Boolean(window.speechSynthesis);

  // localStorage helpers
  const sessionKey = user ? `ai_session_${user.id}` : null;

  const saveSessionId = useCallback((sid) => {
    if (sessionKey && sid) localStorage.setItem(sessionKey, sid);
    else if (sessionKey) localStorage.removeItem(sessionKey);
  }, [sessionKey]);

  /* ── scrolling ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  /* ── focus ── */
  useEffect(() => {
    if (isOpen && !showSessions) inputRef.current?.focus();
  }, [isOpen, showSessions]);

  /* ── load a single session's data into messages + attachments ── */
  const loadSessionData = useCallback(async (sid) => {
    if (!user || !sid) return;
    loadedSid.current = sid;
    sessionRef.current = sid;
    saveSessionId(sid);
    setAttachments([]);
    try {
      const [rows, atts] = await Promise.all([
        callAI(`/users/${user.id}/sessions/${sid}/chats`).catch(() => []),
        callAI(`/users/${user.id}/sessions/${sid}/attachments`).catch(() => []),
      ]);
      // bail if user switched while we were fetching
      if (loadedSid.current !== sid) return;
      setMessages(
        rows.length
          ? rows.map((r) => ({ id: r.id, role: r.role, text: r.content, time: rowTime(r.created_at) }))
          : [greeting()]
      );
      setAttachments(
        Array.isArray(atts)
          ? atts.map((a) => ({ id: a.id, name: a.name, file_size: a.file_size, mime_type: a.mime_type }))
          : []
      );
    } catch {
      if (loadedSid.current !== sid) return;
      setMessages([greeting()]);
    }
  }, [user, saveSessionId]);

  /* ── load sessions list ── */
  const loadSessions = useCallback(async () => {
    if (!user || sessionsFetched.current) return;
    try {
      const list = await callAI(`/users/${user.id}/sessions`);
      if (!Array.isArray(list)) return;
      // sort newest-first
      list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      setSessions(list);
      sessionsFetched.current = true;
    } catch {
      /* keep empty */
    }
  }, [user]);

  /* ── first open: fetch sessions list, then load the cached/active session ── */
  useEffect(() => {
    if (!isOpen || !user) return;
    loadSessions().then(() => {
      const sid = sessionRef.current || (sessionKey ? localStorage.getItem(sessionKey) : null);
      if (sid) loadSessionData(sid);
      else sessionRef.current = null;
    });
  }, [isOpen, user, loadSessions, loadSessionData, sessionKey]);

  /* ── rename a fresh session to a portion of its first prompt ── */
  const maybeTitleSession = useCallback((sid, text) => {
    if (!sid || !freshSids.current.has(sid)) return;
    const title = text.trim().slice(0, 80);
    // optimistic update for the header
    setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, title } : s)));
    callAI(`/users/${user.id}/sessions/${sid}`, { title }, 'PATCH')
      .then((updated) => {
        freshSids.current.delete(sid);
        setSessions((prev) => prev.map((s) => (s.id === sid ? updated : s)));
      })
      .catch(() => {});
  }, [user]);

  /* ── create new session ── */
  const handleNewSession = useCallback(async () => {
    if (!user) return;
    try {
      const s = await callAI(`/users/${user.id}/sessions`, { title: 'New Chat' }, 'POST');
      freshSids.current.add(s.id);
      setSessions((prev) => [s, ...prev]);
      setShowSessions(false);
      loadedSid.current = null;
      setMessages([greeting()]);
      setAttachments([]);
      sessionRef.current = s.id;
      saveSessionId(s.id);
      sessionsFetched.current = false;
    } catch {
      /* silent */
    }
  }, [user, saveSessionId]);

  /* ── switch to an existing session ── */
  const handleSwitchSession = useCallback(async (sid) => {
    if (sid === sessionRef.current) { setShowSessions(false); return; }
    setShowSessions(false);
    setMessages([greeting()]);
    setAttachments([]);
    loadedSid.current = null;
    await loadSessionData(sid);
  }, [loadSessionData]);

  /* ── delete a session ── */
  const handleDeleteSession = useCallback(async (sid) => {
    if (!user) return;
    if (!window.confirm('Delete this chat?')) return;
    try {
      await callAI(`/users/${user.id}/sessions/${sid}`, undefined, 'DELETE');
      setSessions((prev) => prev.filter((s) => s.id !== sid));
      if (sid === sessionRef.current) {
        sessionRef.current = null;
        loadedSid.current = null;
        saveSessionId(null);
        setMessages([greeting()]);
        setAttachments([]);
      }
    } catch {
      /* silent */
    }
  }, [user, saveSessionId]);

  /* ── navigate (quick actions) ── */
  const navigateAfter = (action) => {
    if (!action || !onNavigate) return;
    setTimeout(() => { onNavigate(action); setIsOpen(false); }, 600);
  };

  /* ── file upload ── */
  const handleUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file || !user) return;
    e.target.value = '';
    setUploading(true);
    try {
      // ensure we have a session to upload into
      let sid = sessionRef.current;
      if (!sid) {
        const s = await callAI(`/users/${user.id}/sessions`, { title: 'New Chat' }, 'POST');
        sid = s.id;
        sessionRef.current = sid;
        saveSessionId(sid);
        freshSids.current.add(sid);
        setSessions((prev) => [s, ...prev]);
      }
      const att = await uploadFile(user, sid, file);
      setAttachments((prev) => [...prev, { id: att.id, name: att.name, file_size: att.file_size, mime_type: att.mime_type }]);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'assistant', text: `📎 Uploaded **${att.name}** (${humanSize(att.file_size)}). You can now ask me about it in this chat.`, time: nowTime() },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', text: `Upload failed: ${err.message}`, time: nowTime() }]);
    } finally {
      setUploading(false);
    }
  };

  /* ── remove attachment ── */
  const handleRemoveAttachment = async (att) => {
    if (!user || !sessionRef.current) return;
    try { await deleteAttachment(user, sessionRef.current, att.id); } catch { /* remove anyway */ }
    setAttachments((prev) => prev.filter((a) => a.id !== att.id));
  };

  /* ── text-to-speech ── */
  const speakText = useCallback((text, id) => {
    if (!ttsSupported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    if (speakingIdRef.current === id) {
      speakingIdRef.current = null;
      setSpeakingId(null);
      return;
    }
    // strip markdown noise for a clean read-out
    const clean = text
      .replace(/```[\s\S]*?```/g, ' (code block) ')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/[*_~#|>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\|/g, ', ')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return;
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1;
    utter.pitch = 1;
    const voices = synth.getVoices();
    const v = voices.find((x) => x.lang.startsWith('en') && x.name.includes('Google'))
      || voices.find((x) => x.lang.startsWith('en'));
    if (v) utter.voice = v;
    speakingIdRef.current = id;
    setSpeakingId(id);
    utter.onend = () => { speakingIdRef.current = null; setSpeakingId(null); };
    utter.onerror = () => { speakingIdRef.current = null; setSpeakingId(null); };
    synth.speak(utter);
  }, [ttsSupported]);

  /* ── speech-to-text ── */
  useEffect(() => {
    if (!speechSupported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = (navigator.language || 'en-US').slice(0, 5);
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join('');
      setInput(transcript.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch { /* noop */ }
      recognitionRef.current = null;
    };
  }, [speechSupported]);

  const toggleListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      try { rec.stop(); } catch { /* noop */ }
      setListening(false);
      return;
    }
    window.speechSynthesis?.cancel();
    speakingIdRef.current = null;
    setSpeakingId(null);
    try {
      setInput('');
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [listening]);

  /* ── stop sound when the widget closes ── */
  useEffect(() => {
    if (!isOpen) {
      setListening(false);
      try { recognitionRef.current?.abort(); } catch { /* noop */ }
      window.speechSynthesis?.cancel();
      speakingIdRef.current = null;
      setSpeakingId(null);
    }
  }, [isOpen]);

  /* ── auto-speak freshly created assistant replies only ── */
  useEffect(() => {
    if (sending) return;
    if (!autoSpeakRef.current) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && sentMsgIds.current.has(last.id)) {
      sentMsgIds.current.delete(last.id);
      speakText(last.text, last.id);
    }
  }, [messages, sending, speakText]);

  /* ── send chat ── */
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    // public / no user — local fallback
    if (!user) {
      setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: trimmed, time: nowTime() }]);
      setInput('');
      const reply = fallbackReply(trimmed);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply.text, time: nowTime() }]);
      navigateAfter(reply.action);
      return;
    }

    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: trimmed, time: nowTime() }]);
    setInput('');
    setSending(true);
    if (listening) { try { recognitionRef.current?.stop(); } catch { /* noop */ } setListening(false); }
    window.speechSynthesis?.cancel();
    speakingIdRef.current = null;
    setSpeakingId(null);
    inputRef.current?.focus();

    try {
      // ensure session
      let sid = sessionRef.current;
      if (!sid) {
        const s = await callAI(`/users/${user.id}/sessions`, { title: 'New Chat' }, 'POST');
        sid = s.id;
        sessionRef.current = sid;
        saveSessionId(sid);
        freshSids.current.add(sid);
        setSessions((prev) => [s, ...prev]);
        loadedSid.current = sid;
      }

      try {
        const exchange = await callAI(`/users/${user.id}/sessions/${sid}/chats`, { content: trimmed }, 'POST');
        maybeTitleSession(sid, trimmed);
        const replyId = Date.now() + 1;
        sentMsgIds.current.add(replyId);
        setMessages((prev) => [...prev, { id: replyId, role: 'assistant', text: exchange?.assistant_message?.content || "I couldn't form a reply.", time: nowTime() }]);
      } catch (err) {
        if (err.status === 404) {
          // session gone — start fresh
          sessionRef.current = null;
          loadedSid.current = null;
          if (sessionKey) localStorage.removeItem(sessionKey);
          const fresh = await callAI(`/users/${user.id}/sessions`, { title: 'New Chat' }, 'POST');
          sessionRef.current = fresh.id;
          loadedSid.current = fresh.id;
          saveSessionId(fresh.id);
          freshSids.current.add(fresh.id);
          setSessions((prev) => [fresh, ...prev]);
          const retry = await callAI(`/users/${user.id}/sessions/${fresh.id}/chats`, { content: trimmed }, 'POST');
          maybeTitleSession(fresh.id, trimmed);
          const retryId = Date.now() + 1;
          sentMsgIds.current.add(retryId);
          setMessages((prev) => [...prev, { id: retryId, role: 'assistant', text: retry?.assistant_message?.content || "I couldn't form a reply.", time: nowTime() }]);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: `Sorry, I couldn't reach the assistant service. ${err.message}`, time: nowTime() }]);
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = (action) => {
    if (onNavigate) onNavigate(action.page);
    setIsOpen(false);
  };

  const busy = sending || uploading;

  /* ─── shared header button style ── */
  const hdrBtn = (active = false) => ({
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: 'none',
    background: active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    flexShrink: 0,
    transition: 'background 0.12s ease',
  });

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Floating Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00ced1, #0891b2)',
            color: '#fff', border: 'none',
            boxShadow: '0 4px 14px rgba(0,206,209,0.4)',
            cursor: 'pointer', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,206,209,0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,206,209,0.4)'; }}
          title="Assistant"
        >
          <i className="fa-solid fa-robot" />
        </button>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
            width: '380px', maxWidth: 'calc(100vw - 48px)',
            height: '520px', maxHeight: 'calc(100vh - 100px)',
            background: '#fff', borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0',
            display: 'flex', flexDirection: 'column',
            zIndex: 1000, overflow: 'hidden',
            animation: 'assistantSlideUp 0.25s ease-out',
          }}
        >
          {/* ── Header ── */}
          <div style={{ background: 'linear-gradient(135deg, #00ced1, #0891b2)', color: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* new chat */}
            <button onClick={handleNewSession} style={hdrBtn()} title="New chat">
              <i className="fa-solid fa-plus" />
            </button>
            {/* sessions panel toggle */}
            <button onClick={() => setShowSessions((v) => !v)} style={hdrBtn(showSessions)} title={showSessions ? 'Back to chat' : 'Chats'}>
              <i className={`fa-solid ${showSessions ? 'fa-xmark' : 'fa-clock-rotate-left'}`} />
            </button>
            {/* auto-speak toggle */}
            {ttsSupported && (
              <button
                onClick={() => {
                  const next = !autoSpeak;
                  setAutoSpeak(next);
                  autoSpeakRef.current = next;
                  if (!next) {
                    window.speechSynthesis?.cancel();
                    speakingIdRef.current = null;
                    setSpeakingId(null);
                  }
                }}
                style={hdrBtn(autoSpeak)}
                title={autoSpeak ? 'Auto voice replies: ON' : 'Auto voice replies: OFF'}
              >
                <i className={`fa-solid ${autoSpeak ? 'fa-volume-high' : 'fa-volume-xmark'}`} />
              </button>
            )}
            {/* title */}
            <div style={{ flex: 1, minWidth: 0, marginLeft: '2px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {showSessions ? 'Chats' : (sessions.find((s) => s.id === sessionRef.current)?.title || 'Assistant')}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                {user ? 'ERP Assistant' : 'Front Desk Helper'}
              </div>
            </div>
            {/* close widget */}
            <button
              onClick={() => setIsOpen(false)}
              style={{ ...hdrBtn(), background: 'rgba(255,255,255,0.15)' }}
              title="Close"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {/* ════════════════ Sessions List Panel ════════════════ */}
          {showSessions && (
            <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
              {sessions.length === 0 && (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No chats yet. Start a new one above.
                </div>
              )}
              {sessions.map((s) => {
                const isActive = s.id === sessionRef.current;
                const isHovered = hoveredSid === s.id;
                return (
                  <div
                    key={s.id}
                    onMouseEnter={() => setHoveredSid(s.id)}
                    onMouseLeave={() => setHoveredSid(null)}
                    onClick={() => handleSwitchSession(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '11px 14px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #e2e8f0',
                      background: isActive ? '#e6fffd' : isHovered ? '#f1f5f9' : '#fff',
                      transition: 'background 0.1s ease',
                    }}
                  >
                    {/* icon */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                      background: isActive ? '#0891b2' : '#e2e8f0',
                      color: isActive ? '#fff' : '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
                    }}>
                      <i className="fa-solid fa-comment" />
                    </div>
                    {/* text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px', fontWeight: isActive ? 600 : 400, color: '#1e293b',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
                      }}>
                        {s.title || 'Untitled'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                        {sessionDate(s.updated_at)}
                      </div>
                    </div>
                    {/* delete */}
                    {isHovered && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                        style={{
                          width: '24px', height: '24px', borderRadius: '6px', border: 'none',
                          background: '#fee2e2', color: '#ef4444', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0,
                        }}
                        title="Delete chat"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ════════════════ Chat View ════════════════ */}
          {!showSessions && (
            <>
              {/* ── Messages ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #00ced1, #0891b2)' : '#f1f5f9',
                      color: msg.role === 'user' ? '#fff' : '#334155',
                      fontSize: '13px', lineHeight: 1.5,
                    }}>
                      {msg.role === 'assistant' ? (
                        <div className="asst-md">
                          <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>{msg.text}</Markdown>
                        </div>
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                      )}
                      {msg.role === 'assistant' && ttsSupported ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '4px' }}>
                          <div style={{ fontSize: '10px', opacity: 0.6 }}>{msg.time}</div>
                          <button
                            onClick={() => speakText(msg.text, msg.id)}
                            style={{
                              background: speakingId === msg.id ? 'rgba(8,145,178,0.12)' : 'none',
                              border: 'none', color: speakingId === msg.id ? '#0891b2' : '#94a3b8',
                              cursor: 'pointer', fontSize: '12px', padding: '1px 3px', borderRadius: '4px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                              transition: 'all 0.12s ease',
                            }}
                            title={speakingId === msg.id ? 'Stop reading' : 'Read aloud'}
                          >
                            <i className={`fa-solid ${speakingId === msg.id ? 'fa-stop' : 'fa-volume-high'}`} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.6, textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.time}</div>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '12px 14px', borderRadius: '14px 14px 14px 4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="asst-dot" style={{ animationDelay: '0ms' }} />
                      <span className="asst-dot" style={{ animationDelay: '150ms' }} />
                      <span className="asst-dot" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Attachment chips ── */}
              {user && attachments.length > 0 && (
                <div style={{
                  padding: '6px 14px', borderTop: '1px solid #f1f5f9',
                  display: 'flex', flexWrap: 'wrap', gap: '5px', flexShrink: 0,
                  background: '#f8fafc', maxHeight: '60px', overflowY: 'auto',
                }}>
                  {attachments.map((att) => (
                    <span key={att.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '3px 6px 3px 8px', borderRadius: '12px',
                      background: '#e0f7fa', color: '#0891b2', fontSize: '11px', whiteSpace: 'nowrap', lineHeight: 1,
                    }}>
                      <i className="fa-solid fa-file-lines" style={{ fontSize: '10px' }} />
                      <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.name}</span>
                      {att.file_size != null && <span style={{ opacity: 0.7, fontSize: '10px' }}>{humanSize(att.file_size)}</span>}
                      <button
                        onClick={() => handleRemoveAttachment(att)}
                        style={{ background: 'none', border: 'none', color: '#0891b2', padding: 0, marginLeft: '2px', cursor: 'pointer', fontSize: '10px', lineHeight: 1, opacity: 0.7 }}
                        title="Remove"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* ── Input ── */}
              <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', flexShrink: 0, background: '#fff', alignItems: 'center' }}>
                {user && (
                  <>
                    <input ref={fileRef} type="file" accept={ACCEPTED} onChange={handleUpload} style={{ display: 'none' }} />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={busy}
                      style={{
                        width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                        background: uploading ? '#e0f7fa' : '#f1f5f9', color: uploading ? '#0891b2' : '#64748b',
                        cursor: busy ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                      title="Upload file (PDF, DOCX, TXT, MD, CSV...)"
                    >
                      <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-paperclip'}`} />
                    </button>
                  </>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={busy ? '…' : 'Type a message...'}
                  disabled={busy}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', color: '#334155', background: '#f8fafc' }}
                />

                {user && (
                  <button
                    onClick={toggleListening}
                    disabled={busy}
                    style={{
                      width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                      background: listening ? '#fee2e2' : '#f1f5f9',
                      color: listening ? '#ef4444' : '#64748b',
                      cursor: busy ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0,
                      transition: 'all 0.15s ease',
                      animation: listening ? 'asstMicPulse 1.2s infinite ease-in-out' : 'none',
                    }}
                    title={listening ? 'Stop listening' : 'Speak your message'}
                  >
                    <i className="fa-solid fa-microphone" />
                  </button>
                )}

                <button
                  onClick={handleSend}
                  disabled={busy || !input.trim()}
                  style={{
                    width: '40px', height: '40px', borderRadius: '10px', border: 'none',
                    background: input.trim() && !busy ? 'linear-gradient(135deg, #00ced1, #0891b2)' : '#e2e8f0',
                    color: input.trim() && !busy ? '#fff' : '#94a3b8',
                    cursor: input.trim() && !busy ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                    transition: 'all 0.15s ease', flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-paper-plane" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Keyframes + styling ── */}
      <style>{`
        @keyframes assistantSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .asst-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; opacity: 0.4;
          animation: asstBlink 1s infinite ease-in-out;
        }
        @keyframes asstBlink {
          0%, 100% { opacity: 0.25; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
        @keyframes asstMicPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.45); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        .asst-md p { margin: 2px 0; }
        .asst-md strong { font-weight: 700; }
        .asst-md em { font-style: italic; }
        .asst-md hr { border: none; border-top: 1px solid #e2e8f0; margin: 6px 0; }
      `}</style>
    </>
  );
}

/* ─── local fallback (public route, no backend) ──────────────────────── */

function fallbackReply(text) {
  const lower = text.toLowerCase();
  if (lower.includes('lead') || lower.includes('create lead'))
    return { text: "I'll take you to the Leads page to create a new lead.", action: 'leads' };
  if (lower.includes('order') || lower.includes('new order'))
    return { text: "Opening the Orders page for you now.", action: 'orders' };
  if (lower.includes('site visit') || lower.includes('visit'))
    return { text: "Taking you to the Site Visits page.", action: 'site visits' };
  if (lower.includes('payment') || lower.includes('invoice'))
    return { text: "Here's the Payments page for you.", action: 'payments' };
  if (lower.includes('design'))
    return { text: "Let me open the Designs page.", action: 'designs' };
  if (lower.includes('client') || lower.includes('customer'))
    return { text: "Taking you to the Clients page.", action: 'clients' };
  if (lower.includes('report'))
    return { text: "Opening the Reports section.", action: 'report' };
  if (lower.includes('message') || lower.includes('chat'))
    return { text: "Here are your Messages.", action: 'messages' };
  if (lower.includes('setting') || lower.includes('profile'))
    return { text: "Opening Settings for you.", action: 'settings' };
  if (lower.includes('help') || lower.includes('what can you do'))
    return {
      text: "I can help you navigate the dashboard quickly! Try asking me to:\n• Create a lead\n• Open orders\n• Check payments\n• View designs\n• See reports\n• And more!",
    };
  return { text: "I can help you navigate the dashboard. Try asking about leads, orders, payments, designs, or reports!" };
}