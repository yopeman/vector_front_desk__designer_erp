import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCreativeAuth } from '../contexts/CreativeAuthContext';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import talkAI1 from '../assets/assistant/talk-ai-1.gif';
import talkAI2 from '../assets/assistant/talk-ai-2.gif';
import talkAI3 from '../assets/assistant/talk-ai-3.gif';

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
    text: "Hi! I'm your creative assistant. I can look up prototype requests, ideas, design logs, reports and more, or navigate to a page. You can also upload documents and ask me about them. How can I help?",
  };
}

/** Strip markdown noise so a reply can be read aloud or shown as a clean subtitle. */
function toPlainText(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' (code block) ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~#>]/g, '')
    .replace(/\|/g, ', ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

/* ─── theme-aware markdown components ─────────────────────────────────── */

function makeMdComponents(isDark) {
  const border   = isDark ? '#334155' : '#e2e8f0';
  const codeBg   = isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)';
  const thBg     = isDark ? '#1e293b' : '#e2e8f0';
  const thColor  = isDark ? '#e2e8f0' : 'inherit';
  const tdColor  = isDark ? '#e2e8f0' : 'inherit';
  const bqColor  = isDark ? '#94a3b8' : '#475569';
  const bqBorder = isDark ? '#22d3ee' : '#0891b2';
  const preBg    = isDark ? '#020617' : '#1e293b';
  const preFg    = isDark ? '#e2e8f0' : '#f1f5f9';

  return {
    a: ({ children, ...props }) => (
      <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>
    ),
    table: ({ children, ...props }) => (
      <div style={{ overflowX: 'auto', margin: '4px 0' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }} {...props}>{children}</table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th style={{ border: `1px solid ${border}`, padding: '4px 8px', background: thBg, color: thColor, textAlign: 'left', fontWeight: 600 }} {...props}>{children}</th>
    ),
    td: ({ children, ...props }) => (
      <td style={{ border: `1px solid ${border}`, padding: '4px 8px', verticalAlign: 'top', color: tdColor }} {...props}>{children}</td>
    ),
    code: ({ inline, children, ...props }) =>
      inline
        ? <code style={{ background: codeBg, padding: '1px 4px', borderRadius: '3px', fontSize: '12px' }} {...props}>{children}</code>
        : <code {...props}>{children}</code>,
    pre: ({ children, ...props }) => (
      <pre style={{ background: preBg, color: preFg, padding: '8px 10px', borderRadius: '8px', fontSize: '12px', lineHeight: 1.45, overflowX: 'auto', whiteSpace: 'pre' }} {...props}>{children}</pre>
    ),
    ul: ({ children, ...props }) => (
      <ul style={{ margin: '2px 0', paddingLeft: '18px', lineHeight: 1.5 }} {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
      <ol style={{ margin: '2px 0', paddingLeft: '18px', lineHeight: 1.5 }} {...props}>{children}</ol>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote style={{ borderLeft: `3px solid ${bqBorder}`, margin: '4px 0', padding: '2px 10px', color: bqColor, fontStyle: 'italic' }} {...props}>{children}</blockquote>
    ),
    h1: ({ children, ...props }) => <h1 style={{ fontSize: '15px', margin: '6px 0 2px', fontWeight: 700 }} {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 style={{ fontSize: '14px', margin: '6px 0 2px', fontWeight: 700 }} {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 style={{ fontSize: '13px', margin: '6px 0 2px', fontWeight: 700 }} {...props}>{children}</h3>,
  };
}

/* ─── component ────────────────────────────────────────────────────────── */

export default function FloatingAssistant({ onNavigate, embedded = false, onClose }) {
  const { user } = useCreativeAuth();

  // ── UI state ──
  const [isOpen, setIsOpen]               = useState(embedded);
  const [isFullscreen, setIsFullscreen]   = useState(embedded);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [showSessions, setShowSessions]   = useState(true);
  const [showMenu, setShowMenu]           = useState(false);
  const [input, setInput]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [messages, setMessages]           = useState([greeting()]);
  const [attachments, setAttachments]     = useState([]);
  const [sessions, setSessions]           = useState([]);
  const [activeSid, setActiveSid]         = useState(null);
  const [hoveredSid, setHoveredSid]       = useState(null);
  const [confirmDeleteSid, setConfirmDeleteSid] = useState(null);
  const [loadingSessions, setLoadingSessions]   = useState(false);
  const [copiedId, setCopiedId]           = useState(null);
  const [atBottom, setAtBottom]           = useState(true);

  // ── rename state ──
  const [editingSid, setEditingSid]       = useState(null);
  const [editTitle, setEditTitle]         = useState('');
  const [savingEdit, setSavingEdit]       = useState(false);
  const [editError, setEditError]         = useState(null);

  // ── voice state ──
  const [listening, setListening]         = useState(false);
  const [autoSpeak, setAutoSpeak]         = useState(true);
  const [speakingId, setSpeakingId]       = useState(null);
  const [showAvatar, setShowAvatar]       = useState(true);
  const [speechError, setSpeechError]     = useState(null);

  // ── humanize mode ──
  const [humanize, setHumanize]           = useState(false);

  // ── theme (system only, no manual toggle) ──
  const isDark = false;

  const mdComponents = useMemo(() => makeMdComponents(isDark), [isDark]);

  // ── refs ──
  const scrollBoxRef    = useRef(null);
  const messagesEndRef  = useRef(null);
  const inputRef        = useRef(null);
  const fileRef         = useRef(null);
  const menuRef         = useRef(null);
  const sessionRef      = useRef(null);
  const sessionsFetched = useRef(false);
  const loadedSid       = useRef(null);
  const freshSids       = useRef(new Set());
  const sentMsgIds      = useRef(new Set());
  const autoSpeakRef    = useRef(true);
  const recognitionRef  = useRef(null);
  const speakingIdRef   = useRef(null);
  const atBottomRef     = useRef(true);
  const editInputRef    = useRef(null);
  const cancelEditRef   = useRef(false);   // avoids double-fire of blur + Enter

  const speechSupported = Boolean(
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const ttsSupported = typeof window !== 'undefined' && Boolean(window.speechSynthesis);

  const sessionKey = user ? `ai_session_${user.id}` : null;

  const saveSessionId = useCallback((sid) => {
    if (sessionKey && sid) localStorage.setItem(sessionKey, sid);
    else if (sessionKey) localStorage.removeItem(sessionKey);
  }, [sessionKey]);

  const setActiveSession = useCallback((sid) => {
    sessionRef.current = sid;
    setActiveSid(sid);
    saveSessionId(sid);
  }, [saveSessionId]);

  /* ── close widget and reset fullscreen ── */
  const handleCloseWidget = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    setIsOpen(false);
    setIsFullscreen(false);
    setSidebarOpen(false);
  }, [onClose]);

  /* ── toggle fullscreen ── */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setShowMenu(false);
      if (next) {
        setShowSessions(false);
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
      return next;
    });
  }, []);

  /* ── auto-resize the composer textarea ── */
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, isFullscreen ? 200 : 120)}px`;
  }, [input, isFullscreen]);

  /* ── smart auto-scroll ── */
  useEffect(() => {
    if (atBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, sending]);

  /* ── keep the view pinned to the bottom after layout toggles ── */
  useEffect(() => {
    const t = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ block: 'end' });
    }, 60);
    return () => clearTimeout(t);
  }, [isFullscreen, sidebarOpen, humanize]);

  const handleScroll = useCallback(() => {
    const el = scrollBoxRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = dist < 80;
    atBottomRef.current = near;
    setAtBottom(near);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    atBottomRef.current = true;
    setAtBottom(true);
  }, []);

  /* ── focus input when opened ── */
  useEffect(() => {
    if (isOpen && !showSessions) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen, showSessions, isFullscreen, sidebarOpen]);

  /* ── focus + select all when entering rename mode ── */
  useEffect(() => {
    if (!editingSid) return;
    const t = setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 30);
    return () => clearTimeout(t);
  }, [editingSid]);

  /* ── close on Escape (edit → menu → sessions → sidebar → fullscreen → widget) ── */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (editingSid) return;             // handled by the inline input
      if (showMenu) setShowMenu(false);
      else if (showSessions) setShowSessions(false);
      else if (isFullscreen && sidebarOpen) setSidebarOpen(false);
      else if (isFullscreen) { if (!embedded) setIsFullscreen(false); }
      else if (!embedded) setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, showMenu, showSessions, isFullscreen, sidebarOpen, editingSid, embedded]);

  /* ── click-outside for the settings menu ── */
  useEffect(() => {
    if (!showMenu) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showMenu]);

  /* ── load a single session's data ── */
  const loadSessionData = useCallback(async (sid) => {
    if (!user || !sid) return;
    loadedSid.current = sid;
    setActiveSession(sid);
    setAttachments([]);
    try {
      const [rows, atts] = await Promise.all([
        callAI(`/users/${user.id}/sessions/${sid}/chats`).catch(() => []),
        callAI(`/users/${user.id}/sessions/${sid}/attachments`).catch(() => []),
      ]);
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
  }, [user, setActiveSession]);

  /* ── load sessions list ── */
  const loadSessions = useCallback(async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const list = await callAI(`/users/${user.id}/sessions`);
      if (!Array.isArray(list)) return;
      list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      setSessions(list);
      sessionsFetched.current = true;
    } catch {
      /* keep empty */
    } finally {
      setLoadingSessions(false);
    }
  }, [user, sending]);

  /* ── first open ── */
  useEffect(() => {
    if (!isOpen || !user) return;
    loadSessions().then(() => {
      const sid = sessionRef.current || (sessionKey ? localStorage.getItem(sessionKey) : null);
      if (sid) loadSessionData(sid);
      else sessionRef.current = null;
    });
  }, [isOpen, user, loadSessions, loadSessionData, sessionKey]);

  /* ── rename fresh session from first prompt ── */
  const maybeTitleSession = useCallback((sid, text) => {
    if (!sid || !freshSids.current.has(sid)) return;
    const title = text.trim().slice(0, 80);
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
      setShowMenu(false);
      loadedSid.current = null;
      setMessages([greeting()]);
      setAttachments([]);
      setActiveSession(s.id);
      sessionsFetched.current = false;
    } catch { /* silent */ }
  }, [user, setActiveSession]);

  /* ── switch session ── */
  const handleSwitchSession = useCallback(async (sid) => {
    if (sid === sessionRef.current) { setShowSessions(false); return; }
    setShowSessions(false);
    setMessages([greeting()]);
    setAttachments([]);
    loadedSid.current = null;
    await loadSessionData(sid);
  }, [loadSessionData]);

  /* ── delete session ── */
  const handleDeleteSession = useCallback(async (sid) => {
    if (!user) return;
    try {
      await callAI(`/users/${user.id}/sessions/${sid}`, undefined, 'DELETE');
      setSessions((prev) => prev.filter((s) => s.id !== sid));
      if (sid === sessionRef.current) {
        loadedSid.current = null;
        setActiveSession(null);
        setMessages([greeting()]);
        setAttachments([]);
      }
    } catch { /* silent */ }
    finally { setConfirmDeleteSid(null); }
  }, [user, setActiveSession]);

  /* ── rename: begin ── */
  const startEditing = useCallback((s, e) => {
    e?.stopPropagation?.();
    cancelEditRef.current = false;
    setConfirmDeleteSid(null);
    setEditingSid(s.id);
    setEditTitle(s.title || '');
    setEditError(null);
  }, []);

  /* ── rename: cancel ── */
  const cancelEditing = useCallback(() => {
    cancelEditRef.current = true;
    setEditingSid(null);
    setEditTitle('');
    setEditError(null);
  }, []);

  /* ── rename: save (PATCH /sessions/{id}) ── */
  const saveEditing = useCallback(async () => {
    if (!user || !editingSid || savingEdit) return;
    if (cancelEditRef.current) { cancelEditRef.current = false; return; }

    const sid = editingSid;
    const trimmed = editTitle.trim();
    const original = sessions.find((s) => s.id === sid)?.title || '';

    // nothing to save — treat as cancel
    if (!trimmed || trimmed === original) {
      setEditingSid(null);
      setEditTitle('');
      setEditError(null);
      return;
    }

    setSavingEdit(true);
    setEditError(null);

    // optimistic update
    setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, title: trimmed } : s)));

    try {
      const updated = await callAI(`/users/${user.id}/sessions/${sid}`, { title: trimmed }, 'PATCH');
      // Merge server response, but keep our title if the payload lacks it
      setSessions((prev) => prev.map((s) => (
        s.id === sid ? { ...s, ...(updated || {}), title: updated?.title ?? trimmed } : s
      )));
      // A manually renamed session should never auto-title from the first prompt
      freshSids.current.delete(sid);
      setEditingSid(null);
      setEditTitle('');
    } catch (err) {
      // rollback on failure, keep the input open so the user can retry
      setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, title: original } : s)));
      setEditError(err.message || 'Rename failed');
    } finally {
      setSavingEdit(false);
    }
  }, [user, editingSid, savingEdit, editTitle, sessions]);

  /* ── quick navigation ── */
  const navigateAfter = (action) => {
    if (!action || !onNavigate) return;
    setTimeout(() => { onNavigate(action); setIsOpen(false); }, 600);
  };

  /* ── upload ── */
  const handleUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file || !user) return;
    e.target.value = '';
    setUploading(true);
    try {
      let sid = sessionRef.current;
      if (!sid) {
        const s = await callAI(`/users/${user.id}/sessions`, { title: 'New Chat' }, 'POST');
        sid = s.id;
        setActiveSession(sid);
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
      setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', text: `Upload failed: ${err.message}`, time: nowTime(), error: true }]);
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

  /* ── copy message ── */
  const handleCopy = useCallback(async (msg) => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId((c) => (c === msg.id ? null : c)), 1500);
    } catch { /* noop */ }
  }, []);

  /* ── text-to-speech ── */
  const speakText = useCallback((text, id) => {
    if (!ttsSupported) return;
    const synth = window.speechSynthesis;
    if (speakingIdRef.current === id) {
      speakingIdRef.current = null;
      setSpeakingId(null);
      synth.cancel();
      return;
    }
    const clean = toPlainText(text);
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
    utter.onstart = () => { if (speakingIdRef.current === id) setSpeakingId(id); };
    utter.onend = () => { if (speakingIdRef.current === id) { speakingIdRef.current = null; setSpeakingId(null); } };
    utter.onerror = () => { if (speakingIdRef.current === id) { speakingIdRef.current = null; setSpeakingId(null); } };
    synth.cancel();
    window.setTimeout(() => {
      try { synth.resume(); synth.speak(utter); } catch { /* keep */ }
    }, 60);
  }, [ttsSupported]);

  /* ── speech-to-text ── */
  useEffect(() => {
    if (!speechSupported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = (navigator.language || 'en-US').slice(0, 5);

    let finalTranscript = '';

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t;
        else interim += t;
      }
      setInput((finalTranscript + interim).trim());
    };

    rec.onend = () => {
      setListening(false);
      finalTranscript = '';
    };

    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      console.warn('SpeechRecognition error:', e.error);
      setListening(false);
      setSpeechError(e.error === 'network'
        ? 'Voice recognition needs internet access — type your message instead.'
        : e.error === 'not-allowed'
          ? 'Microphone permission was blocked — allow it in your browser settings.'
          : 'Voice recognition failed — type your message instead.');
    };

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
    setSpeechError(null);
    try {
      setInput('');
      rec.start();
      setListening(true);
    } catch (err) {
      console.warn('SpeechRecognition start failed:', err);
      setListening(false);
    }
  }, [listening]);

  /* ── stop audio when the widget closes ── */
  useEffect(() => {
    if (!isOpen) {
      setListening(false);
      console.log(2);
      
      try { recognitionRef.current?.abort(); } catch { /* noop */ }
      window.speechSynthesis?.cancel();
      speakingIdRef.current = null;
      setSpeakingId(null);
    }
  }, [isOpen]);

  /* ── auto-speak freshly created assistant replies ── */
  useEffect(() => {
    if (sending) return;
    if (!autoSpeakRef.current) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && sentMsgIds.current.has(last.id)) {
      sentMsgIds.current.delete(last.id);
      speakText(last.text, last.id);
    }
  }, [messages, sending, speakText]);

  /* ── toggle humanize mode ── */
  const toggleHumanize = useCallback(() => {
    setHumanize((prev) => {
      const next = !prev;
      if (next && ttsSupported && !autoSpeakRef.current) {
        autoSpeakRef.current = true;
        setAutoSpeak(true);
      }
      return next;
    });
  }, [ttsSupported]);

  /* ── send chat ── */
  const handleSend = async (overrideText) => {
    const trimmed = (overrideText ?? input).trim();
    if (!trimmed || sending) return;

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
    setSpeechError('');
    setSending(true);
    if (listening) { try { recognitionRef.current?.stop(); } catch { /* noop */ } setListening(false); console.log(4); }
    window.speechSynthesis?.cancel();
    speakingIdRef.current = null;
    setSpeakingId(null);
    atBottomRef.current = true;
    setAtBottom(true);
    inputRef.current?.focus();

    try {
      let sid = sessionRef.current;
      if (!sid) {
        const s = await callAI(`/users/${user.id}/sessions`, { title: 'New Chat' }, 'POST');
        sid = s.id;
        setActiveSession(sid);
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
          loadedSid.current = null;
          if (sessionKey) localStorage.removeItem(sessionKey);
          const fresh = await callAI(`/users/${user.id}/sessions`, { title: 'New Chat' }, 'POST');
          loadedSid.current = fresh.id;
          setActiveSession(fresh.id);
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
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: `Sorry, I couldn't reach the assistant service. ${err.message}`, time: nowTime(), error: true }]);
    } finally {
      setSending(false);
    }
  };

  const busy = sending || uploading;

  const activeTitle = sessions.find((s) => s.id === activeSid)?.title || 'Assistant';
  const showWelcome = !sending && messages.length === 1 && messages[0]?.id === 1;
  const lastMsg = messages[messages.length - 1];
  const humanTalking = sending || Boolean(speakingId);

  const speakingMsg = speakingId ? messages.find((m) => m.id === speakingId) : null;
  const subtitleText = speakingMsg ? toPlainText(speakingMsg.text) : '';

  /* ══════════════════════════════════════════════════════════════════════ */
  /* Shared: session rows                                                   */
  /* ══════════════════════════════════════════════════════════════════════ */
  const renderSessionRows = () => (
    <>
      {loadingSessions && sessions.length === 0 && (
        <div className="asst-skeleton-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="asst-skeleton-row">
              <div className="asst-skeleton-avatar" />
              <div className="asst-skeleton-lines">
                <div className="asst-skeleton-line w-70" />
                <div className="asst-skeleton-line w-40" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loadingSessions && sessions.length === 0 && (
        <div className="asst-empty">
          <div className="asst-empty-icon"><i className="fa-regular fa-comments" /></div>
          <div className="asst-empty-title">No chats yet</div>
          <div className="asst-empty-sub">Start a new conversation to see it here.</div>
          <button className="asst-empty-btn" onClick={handleNewSession}>
            <i className="fa-solid fa-plus" /> New chat
          </button>
        </div>
      )}

      {sessions.map((s) => {
        const isActive = s.id === activeSid;
        const isHovered = hoveredSid === s.id;
        const isConfirming = confirmDeleteSid === s.id;
        const isEditing = editingSid === s.id;
        return (
          <div
            key={s.id}
            className={`asst-session-row ${isActive ? 'active' : ''} ${isEditing ? 'editing' : ''}`}
            onMouseEnter={() => setHoveredSid(s.id)}
            onMouseLeave={() => setHoveredSid(null)}
            onClick={() => {
              if (isConfirming || isEditing) return;
              handleSwitchSession(s.id);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isConfirming && !isEditing) handleSwitchSession(s.id);
            }}
          >
            <div className="asst-session-icon">
              <i className={`fa-solid ${isActive ? 'fa-comment-dots' : 'fa-comment'}`} />
            </div>

            <div className="asst-session-text">
              {isEditing ? (
                <>
                  <input
                    ref={editInputRef}
                    className="asst-session-edit-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveEditing();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelEditing();
                      }
                    }}
                    onBlur={() => {
                      // Skip the blur that follows an Escape
                      if (!cancelEditRef.current) saveEditing();
                    }}
                    disabled={savingEdit}
                    maxLength={120}
                    aria-label="Rename chat"
                    placeholder="Chat title"
                  />
                  <div className="asst-session-edit-hint">
                    {editError
                      ? <span className="asst-session-edit-error"><i className="fa-solid fa-triangle-exclamation" /> {editError}</span>
                      : savingEdit
                        ? <span><i className="fa-solid fa-spinner fa-spin" /> Saving…</span>
                        : <span>Enter to save · Esc to cancel</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="asst-session-title">{s.title || 'Untitled'}</div>
                  <div className="asst-session-date">{sessionDate(s.updated_at)}</div>
                </>
              )}
            </div>

            {!isEditing && !isConfirming && isHovered && (
              <div className="asst-session-actions">
                <button
                  className="asst-session-btn asst-session-edit"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => startEditing(s, e)}
                  title="Rename chat"
                  aria-label={`Rename ${s.title || 'Untitled'}`}
                >
                  <i className="fa-solid fa-pen" />
                </button>
                <button
                  className="asst-session-btn asst-session-del"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteSid(s.id); }}
                  title="Delete chat"
                  aria-label={`Delete ${s.title || 'Untitled'}`}
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            )}

            {isConfirming && !isEditing && (
              <div className="asst-session-confirm" onClick={(e) => e.stopPropagation()}>
                <button className="asst-confirm-yes" onClick={() => handleDeleteSession(s.id)}>Delete</button>
                <button className="asst-confirm-no" onClick={() => setConfirmDeleteSid(null)}>Cancel</button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  /* ══════════════════════════════════════════════════════════════════════ */
  /* Shared: chat body                                                      */
  /* ══════════════════════════════════════════════════════════════════════ */
  const renderChatBody = () => (
    <>
      {humanize ? (
        <div className="asst-body asst-human-body">
          <div className="asst-human-frame">
            <img
              className={`asst-human-gif ${humanTalking ? 'talking' : ''}`}
              src={sending ? talkAI3 : speakingId ? talkAI1 : talkAI2}
              alt=""
              draggable={false}
            />
            <div className="asst-human-scrim" aria-hidden="true" />

            <div className="asst-human-top">
              {sending && (
                <div className="asst-human-status">
                  <span className="asst-dot" style={{ animationDelay: '0ms' }} />
                  <span className="asst-dot" style={{ animationDelay: '150ms' }} />
                  <span className="asst-dot" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              {!sending && lastMsg?.error && (
                <div className="asst-human-status asst-human-status-error">
                  <i className="fa-solid fa-triangle-exclamation" /> Something went wrong
                </div>
              )}
              {!sending && !speakingId && ttsSupported && !autoSpeak && (
                <button
                  className="asst-human-status asst-human-status-hint"
                  onClick={() => { autoSpeakRef.current = true; setAutoSpeak(true); }}
                >
                  <i className="fa-solid fa-volume-xmark" /> Voice is off — tap to enable
                </button>
              )}
            </div>

            {speakingId && subtitleText && (
              <div className="asst-subtitle" key={speakingId} role="status" aria-live="polite">
                {subtitleText}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="asst-body">
          <div className="asst-msgs" ref={scrollBoxRef} onScroll={handleScroll}>
            <div className="asst-msgs-inner">
              {showWelcome ? (
                <div className="asst-welcome">
                  {showAvatar && (
                    <img
                      className="asst-welcome-mascot"
                      src={speakingId ? talkAI1 : talkAI2}
                      alt=""
                    />
                  )}
                  <div className="asst-welcome-title">How can I help?</div>
                  <div className="asst-welcome-sub">{messages[0].text}</div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={msg.id} className={`asst-row ${isUser ? 'asst-row-user' : ''}`}>
                      {!isUser && showAvatar && (
                        <div className="asst-avatar-sm">
                          <img src={speakingId === msg.id ? talkAI1 : talkAI2} alt="" />
                        </div>
                      )}
                      <div className={`asst-bubble ${isUser ? 'asst-bubble-user' : 'asst-bubble-bot'} ${msg.error ? 'asst-bubble-error' : ''}`}>
                        {!isUser ? (
                          <div className="asst-md">
                            <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>{msg.text}</Markdown>
                          </div>
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                        )}

                        <div className="asst-meta">
                          <span className="asst-time">{msg.time}</span>
                          {!isUser && (
                            <span className="asst-meta-actions">
                              {ttsSupported && (
                                <button
                                  className={`asst-meta-btn ${speakingId === msg.id ? 'active' : ''}`}
                                  onClick={() => speakText(msg.text, msg.id)}
                                  title={speakingId === msg.id ? 'Stop reading' : 'Read aloud'}
                                  aria-label={speakingId === msg.id ? 'Stop reading' : 'Read aloud'}
                                >
                                  <i className={`fa-solid ${speakingId === msg.id ? 'fa-stop' : 'fa-volume-high'}`} />
                                </button>
                              )}
                              <button
                                className={`asst-meta-btn ${copiedId === msg.id ? 'active' : ''}`}
                                onClick={() => handleCopy(msg)}
                                title={copiedId === msg.id ? 'Copied!' : 'Copy'}
                                aria-label="Copy message"
                              >
                                <i className={`fa-solid ${copiedId === msg.id ? 'fa-check' : 'fa-copy'}`} />
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {sending && (
                <div className="asst-row">
                  {showAvatar && (
                    <div className="asst-avatar-sm">
                      <img src={talkAI1} alt="" />
                    </div>
                  )}
                  <div className="asst-bubble asst-bubble-bot asst-typing">
                    <span className="asst-dot" style={{ animationDelay: '0ms' }} />
                    <span className="asst-dot" style={{ animationDelay: '150ms' }} />
                    <span className="asst-dot" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {!atBottom && (
            <button className="asst-scroll-btn" onClick={scrollToBottom} aria-label="Scroll to latest">
              <i className="fa-solid fa-arrow-down" />
            </button>
          )}
        </div>
      )}

      {user && attachments.length > 0 && (
        <div className="asst-attach-bar">
          <div className="asst-attach-inner">
            {attachments.map((att) => (
              <span key={att.id} className="asst-attach-chip">
                <i className="fa-solid fa-file-lines" />
                <span className="asst-attach-name">{att.name}</span>
                {att.file_size != null && <span className="asst-attach-size">{humanSize(att.file_size)}</span>}
                <button
                  className="asst-attach-x"
                  onClick={() => handleRemoveAttachment(att)}
                  title="Remove"
                  aria-label={`Remove ${att.name}`}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="asst-composer">
        {speechError && (
          <div className="asst-speech-error" role="alert">
            <i className="fa-solid fa-triangle-exclamation" />
            {speechError}
          </div>
        )}
        <div className="asst-composer-inner">
          {user && (
            <>
              <input ref={fileRef} type="file" accept={ACCEPTED} onChange={handleUpload} style={{ display: 'none' }} />
              <button
                className="asst-icon-btn"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                title="Upload file (PDF, DOCX, TXT, MD, CSV…)"
                aria-label="Upload file"
              >
                <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-paperclip'}`} />
              </button>
            </>
          )}

          <textarea
            ref={inputRef}
            rows={1}
            className="asst-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={busy ? 'Working…' : (humanize ? 'Speak or type…' : (isFullscreen ? 'Message your assistant…' : 'Type a message…'))}
            disabled={busy}
          />

          {user && speechSupported && (
            <button
              className={`asst-icon-btn ${listening ? 'asst-icon-btn-rec' : ''}`}
              onClick={toggleListening}
              disabled={busy}
              title={listening ? 'Stop listening' : 'Speak your message'}
              aria-label={listening ? 'Stop listening' : 'Speak your message'}
            >
              <i className="fa-solid fa-microphone" />
            </button>
          )}

          <button
            className="asst-send-btn"
            onClick={() => handleSend()}
            disabled={busy || !input.trim()}
            aria-label="Send message"
          >
            <i className="fa-solid fa-paper-plane" />
          </button>
        </div>
      </div>
    </>
  );

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Floating launcher ── */}
      {!isOpen && !embedded && (
        <button
          className="asst-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open assistant"
          title="Assistant"
        >
          <i className="fa-solid fa-robot" />
          <span className="asst-launcher-ping" />
        </button>
      )}

      {/* ── Chat window ── */}
      {isOpen && (
        <div
          className={`asst-window ${isDark ? 'asst-dark' : ''} ${embedded ? 'asst-embedded' : ''} ${isFullscreen ? 'asst-fullscreen' : ''}`}
          role="dialog"
          aria-label="Assistant"
        >
          {/* ═══ Header ═══ */}
          <header className="asst-header">
            <div className="asst-brand">
              <div className="asst-brand-avatar">
                <i className="fa-solid fa-robot" />
              </div>
              <div className="asst-brand-text">
                <div className="asst-brand-title">
                  {isFullscreen
                    ? (humanize ? 'Humanized Assistant' : activeTitle)
                    : (showSessions ? 'Your chats' : (humanize ? 'Humanized Assistant' : activeTitle))}
                </div>
                <div className="asst-brand-sub">
                  <span className="asst-status-dot" />
                  {user ? (humanize ? 'Voice · Avatar mode' : 'Creative Assistant') : 'Creative Assistant'}
                </div>
              </div>
            </div>

            <div className="asst-header-actions">
              <button className="asst-hbtn" onClick={handleNewSession} title="New chat" aria-label="New chat">
                <i className="fa-solid fa-plus" />
              </button>

              <button
                className={`asst-hbtn ${
                  (isFullscreen ? sidebarOpen : showSessions) ? 'asst-hbtn-active' : ''
                }`}
                onClick={() => {
                  if (isFullscreen) {
                    setSidebarOpen((v) => !v);
                  } else {
                    setShowSessions((v) => !v);
                    setShowMenu(false);
                  }
                }}
                title={
                  isFullscreen
                    ? (sidebarOpen ? 'Hide sidebar' : 'Show sidebar')
                    : (showSessions ? 'Back to chat' : 'Chat history')
                }
                aria-label={
                  isFullscreen
                    ? (sidebarOpen ? 'Hide sidebar' : 'Show sidebar')
                    : (showSessions ? 'Back to chat' : 'Chat history')
                }
              >
                {isFullscreen ? (
                  <i className="fa-solid fa-table-columns" />
                ) : (
                  <i className={`fa-solid ${showSessions ? 'fa-comment' : 'fa-clock-rotate-left'}`} />
                )}
              </button>

              <button
                className={`asst-hbtn ${showMenu ? 'asst-hbtn-active' : ''}`}
                onClick={() => setShowMenu((v) => !v)}
                title="Options"
                aria-label="Options"
                aria-expanded={showMenu}
              >
                <i className={`fa-solid ${showMenu ? 'fa-xmark' : 'fa-gear'}`} />
              </button>

              {!embedded && (
                <button
                  className={`asst-hbtn asst-hbtn-fullscreen ${isFullscreen ? 'asst-hbtn-active' : ''}`}
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  aria-pressed={isFullscreen}
                >
                  <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
                </button>
              )}

              <button
                className="asst-hbtn asst-hbtn-danger"
                onClick={handleCloseWidget}
                title={embedded ? 'Close' : 'Close'}
                aria-label="Close assistant"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* ═══ Settings dropdown ═══ */}
            {showMenu && (
              <div className="asst-menu" ref={menuRef}>
                <div className="asst-menu-heading">Preferences</div>

                <button
                  className="asst-menu-row"
                  onClick={toggleHumanize}
                  aria-pressed={humanize}
                >
                  <span className="asst-menu-row-icon">
                    <i className="fa-solid fa-wand-magic-sparkles" />
                  </span>
                  <span className="asst-menu-row-label">
                    Humanize mode
                    <span className="asst-menu-row-sub">Avatar + voice replies</span>
                  </span>
                  <span className={`asst-switch ${humanize ? 'on' : ''}`}><span /></span>
                </button>

                {!humanize && (
                  <button
                    className="asst-menu-row"
                    onClick={() => setShowAvatar((v) => !v)}
                    aria-pressed={showAvatar}
                  >
                    <span className="asst-menu-row-icon"><i className="fa-solid fa-user-astronaut" /></span>
                    <span className="asst-menu-row-label">Show assistant avatar</span>
                    <span className={`asst-switch ${showAvatar ? 'on' : ''}`}><span /></span>
                  </button>
                )}

                {ttsSupported && (
                  <button
                    className="asst-menu-row"
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
                    aria-pressed={autoSpeak}
                  >
                    <span className="asst-menu-row-icon">
                      <i className={`fa-solid ${autoSpeak ? 'fa-volume-high' : 'fa-volume-xmark'}`} />
                    </span>
                    <span className="asst-menu-row-label">Auto voice replies</span>
                    <span className={`asst-switch ${autoSpeak ? 'on' : ''}`}><span /></span>
                  </button>
                )}
              </div>
            )}
          </header>

          {/* ═══ Body ═══ */}
          {isFullscreen ? (
            <div className="asst-fs-body">
              {sidebarOpen && (
                <aside className="asst-sidebar" aria-label="Chat history">
                  <div className="asst-sidebar-head">
                    <span className="asst-sidebar-title">Chats</span>
                    <button
                      className="asst-sidebar-collapse"
                      onClick={() => setSidebarOpen(false)}
                      title="Collapse sidebar"
                      aria-label="Collapse sidebar"
                    >
                      <i className="fa-solid fa-angles-left" />
                    </button>
                  </div>

                  <button className="asst-sidebar-new" onClick={handleNewSession}>
                    <i className="fa-solid fa-plus" /> New chat
                  </button>

                  <div className="asst-sidebar-list">
                    {renderSessionRows()}
                  </div>
                </aside>
              )}

              <main className="asst-main">
                {renderChatBody()}
              </main>
            </div>
          ) : showSessions ? (
            <div className="asst-body asst-sessions">
              {renderSessionRows()}
            </div>
          ) : (
            renderChatBody()
          )}
        </div>
      )}

      {/* ── Styles ── */}
      <style>{`
        /* ---------- launcher ---------- */
        .asst-launcher {
          position: fixed; bottom: 24px; right: 24px;
          width: 58px; height: 58px; border-radius: 50%;
          background: linear-gradient(135deg, #00ced1, #0891b2);
          color: #fff; border: none; cursor: pointer;
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          box-shadow: 0 8px 22px rgba(8,145,178,0.42);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .asst-launcher:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 12px 28px rgba(8,145,178,0.5);
        }
        .asst-launcher-ping {
          position: absolute; top: -2px; right: -2px;
          width: 12px; height: 12px; border-radius: 50%;
          background: #22c55e; border: 2px solid #fff;
        }

        /* ---------- window ---------- */
        .asst-window {
          position: fixed; bottom: 24px; right: 24px;
          width: 400px; height: 620px;
          max-width: calc(100vw - 48px);
          max-height: calc(100vh - 48px);
          background: #fff;
          border-radius: 18px;
          border: 1px solid rgba(226,232,240,0.9);
          box-shadow: 0 24px 60px rgba(15,23,42,0.22), 0 6px 16px rgba(15,23,42,0.08);
          display: flex; flex-direction: column;
          z-index: 1000; overflow: hidden;
          animation: assistantSlideUp 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .asst-window.asst-fullscreen {
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw; height: 100vh;
          height: 100dvh;
          max-width: 100vw; max-height: 100vh;
          border-radius: 0; border: none;
          box-shadow: none;
          animation: asstFullscreenIn 0.24s cubic-bezier(0.16,1,0.3,1);
        }
        .asst-window.asst-fullscreen .asst-header {
          padding: 12px 20px;
          background: rgba(255,255,255,0.94);
          color: #0f172a;
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #eef2f7;
          box-shadow: none;
        }
        .asst-window.asst-fullscreen .asst-brand-avatar {
          background: linear-gradient(135deg, #00ced1, #0891b2);
          color: #fff;
        }
        .asst-window.asst-fullscreen .asst-brand-title { color: #0f172a; }
        .asst-window.asst-fullscreen .asst-brand-sub { color: #64748b; opacity: 1; }
        .asst-window.asst-fullscreen .asst-hbtn {
          background: #f1f5f9; color: #475569;
        }
        .asst-window.asst-fullscreen .asst-hbtn:hover { background: #e2e8f0; }
        .asst-window.asst-fullscreen .asst-hbtn-active {
          background: #e0f7fa; color: #0891b2;
        }
        .asst-window.asst-fullscreen .asst-hbtn-danger:hover {
          background: #fee2e2; color: #ef4444;
        }

        /* ---------- embedded (sidebar page) mode ---------- */
        .asst-window.asst-embedded,
        .asst-window.asst-embedded.asst-fullscreen {
          position: relative;
          top: auto; left: auto; right: auto; bottom: auto;
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          margin: 0;
          border-radius: 0;
          border: none;
          box-shadow: none;
          animation: none;
        }
        .asst-window.asst-embedded .asst-header,
        .asst-window.asst-embedded.asst-fullscreen .asst-header {
          padding: 12px 20px;
          background: #ffffff;
          color: #0f172a;
          border-bottom: 1px solid #eef2f7;
          box-shadow: none;
        }
        .asst-window.asst-dark.asst-embedded .asst-header,
        .asst-window.asst-dark.asst-embedded.asst-fullscreen .asst-header {
          background: #ffffff;
          color: #0f172a;
          border-bottom-color: #eef2f7;
        }
        .asst-window.asst-embedded .asst-brand-avatar {
          background: linear-gradient(135deg, #00ced1, #0891b2);
          color: #fff;
        }
        .asst-window.asst-dark.asst-embedded .asst-brand-avatar {
          background: linear-gradient(135deg, #00ced1, #0891b2);
          color: #fff;
        }
        .asst-window.asst-embedded .asst-brand-title,
        .asst-window.asst-dark.asst-embedded .asst-brand-title { color: #0f172a; }
        .asst-window.asst-embedded .asst-brand-sub,
        .asst-window.asst-dark.asst-embedded .asst-brand-sub { color: #64748b; opacity: 1; }
        .asst-window.asst-embedded .asst-hbtn,
        .asst-window.asst-dark.asst-embedded .asst-hbtn {
          background: #f1f5f9; color: #475569;
        }
        .asst-window.asst-embedded .asst-hbtn:hover,
        .asst-window.asst-dark.asst-embedded .asst-hbtn:hover { background: #e2e8f0; }
        .asst-window.asst-embedded .asst-hbtn-active,
        .asst-window.asst-dark.asst-embedded .asst-hbtn-active {
          background: #e0f7fa; color: #0891b2;
        }
        .asst-window.asst-embedded .asst-hbtn-danger:hover,
        .asst-window.asst-dark.asst-embedded .asst-hbtn-danger:hover {
          background: #fee2e2; color: #ef4444;
        }
        .asst-window.asst-embedded .asst-msgs {
          padding: 20px 24px 24px;
        }
        .asst-window.asst-embedded.asst-fullscreen .asst-composer {
          background: linear-gradient(to top, #fff 55%, rgba(255,255,255,0));
        }
        .asst-window.asst-dark.asst-embedded.asst-fullscreen .asst-composer {
          background: linear-gradient(to top, #0f172a 55%, rgba(15,23,42,0));
        }

        /* ---------- fullscreen layout ---------- */
        .asst-fs-body {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: row;
          overflow: hidden;
          background: #fff;
        }
        .asst-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ---------- sidebar ---------- */
        .asst-sidebar {
          width: 260px;
          flex-shrink: 0;
          background: #fafbfc;
          border-right: 1px solid #eef2f7;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: asstSidebarIn 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes asstSidebarIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .asst-sidebar-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 14px 8px;
        }
        .asst-sidebar-title {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #94a3b8;
        }
        .asst-sidebar-collapse {
          width: 26px; height: 26px; border-radius: 7px;
          border: none; background: transparent; color: #94a3b8;
          cursor: pointer; font-size: 11px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.14s ease;
        }
        .asst-sidebar-collapse:hover { background: #e2e8f0; color: #475569; }

        .asst-sidebar-new {
          display: flex; align-items: center; gap: 8px;
          margin: 0 12px 10px;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          background: #fff;
          border-radius: 10px;
          font-size: 13px; font-weight: 600; color: #0891b2;
          cursor: pointer;
          transition: all 0.14s ease;
        }
        .asst-sidebar-new:hover {
          background: #f0feff;
          border-color: #0891b2;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(8,145,178,0.12);
        }
        .asst-sidebar-new i { font-size: 11px; }

        .asst-sidebar-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px 8px 12px;
        }
        .asst-sidebar-list::-webkit-scrollbar { width: 6px; }
        .asst-sidebar-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

        .asst-sidebar .asst-session-row {
          border-radius: 9px;
          border-bottom: none;
          margin-bottom: 2px;
          padding: 9px 10px;
          background: transparent;
        }
        .asst-sidebar .asst-session-row:hover { background: #eef2f7; }
        .asst-sidebar .asst-session-row.active {
          background: #e0f7fa;
          box-shadow: inset 0 0 0 1px rgba(8,145,178,0.18);
        }
        .asst-sidebar .asst-session-icon {
          width: 28px; height: 28px; font-size: 11px;
          background: #eef2f7; color: #64748b;
        }
        .asst-sidebar .asst-session-row.active .asst-session-icon {
          background: linear-gradient(135deg, #00ced1, #0891b2); color: #fff;
          box-shadow: 0 2px 6px rgba(8,145,178,0.28);
        }
        .asst-sidebar .asst-session-title { font-size: 12.5px; }
        .asst-sidebar .asst-session-date { font-size: 10.5px; }
        .asst-sidebar .asst-empty { padding: 24px 14px; }
        .asst-sidebar .asst-empty-icon { width: 44px; height: 44px; font-size: 17px; }
        .asst-sidebar .asst-empty-title { font-size: 13px; }
        .asst-sidebar .asst-empty-sub { font-size: 11.5px; }
        .asst-sidebar .asst-empty-btn { padding: 8px 14px; font-size: 12px; }

        /* ---------- fullscreen chat column ---------- */
        .asst-window.asst-fullscreen .asst-msgs {
          padding: 32px 24px 24px;
          gap: 0;
        }
        .asst-window.asst-fullscreen .asst-msgs-inner {
          width: 100%;
          max-width: 768px;
          margin: 0 auto;
          display: flex; flex-direction: column;
          gap: 24px;
        }
        .asst-window.asst-fullscreen .asst-bubble-bot {
          background: transparent;
          padding: 4px 0;
          max-width: 100%;
          border-radius: 0;
        }
        .asst-window.asst-fullscreen .asst-bubble-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 12px 14px;
          border-radius: 12px;
        }
        .asst-window.asst-fullscreen .asst-bubble-user {
          max-width: 75%;
        }
        .asst-window.asst-fullscreen .asst-avatar-sm {
          width: 32px; height: 32px;
        }
        .asst-window.asst-fullscreen .asst-row {
          gap: 12px;
        }
        .asst-window.asst-fullscreen .asst-welcome {
          gap: 16px; padding: 40px 20px;
        }
        .asst-window.asst-fullscreen .asst-welcome-mascot {
          width: 180px; max-width: 42%;
        }
        .asst-window.asst-fullscreen .asst-welcome-title {
          font-size: 24px; letter-spacing: -0.01em;
        }
        .asst-window.asst-fullscreen .asst-welcome-sub {
          font-size: 14px; max-width: 520px; line-height: 1.6;
        }
        .asst-window.asst-fullscreen .asst-chips {
          max-width: 560px; gap: 8px; margin-top: 12px;
        }
        .asst-window.asst-fullscreen .asst-chip {
          padding: 9px 14px; font-size: 13px;
        }

        .asst-window.asst-fullscreen .asst-composer {
          padding: 16px 24px 24px;
          border-top: none;
          background: linear-gradient(to top, #fff 55%, rgba(255,255,255,0));
        }
        .asst-window.asst-fullscreen .asst-composer-inner {
          width: 100%;
          max-width: 768px;
          margin: 0 auto;
          padding: 8px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 26px;
          background: #fff;
          box-shadow: 0 6px 24px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .asst-window.asst-fullscreen .asst-composer-inner:focus-within {
          border-color: #0891b2;
          box-shadow: 0 6px 24px rgba(15,23,42,0.08), 0 0 0 3px rgba(8,145,178,0.12);
        }
        .asst-window.asst-fullscreen .asst-textarea {
          background: transparent;
          border: none;
          box-shadow: none;
          padding: 10px 8px 10px 6px;
          font-size: 14px;
        }
        .asst-window.asst-fullscreen .asst-textarea:focus {
          background: transparent; box-shadow: none;
        }
        .asst-window.asst-fullscreen .asst-icon-btn {
          background: transparent;
        }
        .asst-window.asst-fullscreen .asst-icon-btn:hover:not(:disabled) {
          background: #f1f5f9;
        }
        .asst-window.asst-fullscreen .asst-icon-btn-rec {
          background: #fee2e2; color: #ef4444;
        }
        .asst-window.asst-fullscreen .asst-send-btn {
          border-radius: 50%;
          width: 36px; height: 36px;
        }

        .asst-window.asst-fullscreen .asst-attach-bar {
          padding: 8px 24px;
          justify-content: center;
          background: transparent;
          border-top: none;
        }
        .asst-window.asst-fullscreen .asst-attach-inner {
          width: 100%;
          max-width: 768px;
          margin: 0 auto;
          display: flex; flex-wrap: wrap; gap: 6px;
        }
        .asst-attach-inner { display: contents; }

        .asst-window.asst-fullscreen .asst-human-body {
          padding: 24px;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 50% 40%, rgba(0,206,209,0.06), transparent 60%),
            #0a1020;
        }
        .asst-window.asst-fullscreen .asst-human-frame {
          flex: none;
          width: 100%;
          max-width: 768px;
          height: 100%;
          max-height: 100%;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(2,6,23,0.5), 0 8px 20px rgba(2,6,23,0.3);
          border: 1px solid rgba(255,255,255,0.08);
          isolation: isolate;
        }

        @media (max-width: 520px) {
          .asst-hbtn-fullscreen { display: none; }
        }
        @media (max-width: 520px) {
          .asst-window {
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw; height: 100vh;
            max-width: 100vw; max-height: 100vh;
            border-radius: 0; border: none;
          }
          .asst-launcher { bottom: 18px; right: 18px; }
        }

        /* ---------- header ---------- */
        .asst-header {
          position: relative;
          display: flex; align-items: center; gap: 8px;
          padding: 11px 12px;
          background: linear-gradient(135deg, #00ced1, #0891b2);
          color: #fff; flex-shrink: 0;
          box-shadow: 0 1px 0 rgba(0,0,0,0.06);
          z-index: 4;
          transition: background 0.2s ease, padding 0.2s ease, color 0.2s ease;
        }
        .asst-brand { display: flex; align-items: center; gap: 9px; flex: 1; min-width: 0; }
        .asst-brand-avatar {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          background: rgba(255,255,255,0.18);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          backdrop-filter: blur(4px);
          transition: background 0.2s ease;
        }
        .asst-brand-text { min-width: 0; }
        .asst-brand-title {
          font-size: 13.5px; font-weight: 700; line-height: 1.25;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .asst-brand-sub {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; opacity: 0.86; line-height: 1.2; margin-top: 1px;
        }
        .asst-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4ade80; box-shadow: 0 0 0 2px rgba(74,222,128,0.28);
        }
        .asst-header-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .asst-hbtn {
          width: 30px; height: 30px; border-radius: 9px; border: none;
          background: rgba(255,255,255,0.14); color: #fff;
          cursor: pointer; font-size: 12.5px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.14s ease, transform 0.14s ease, color 0.14s ease;
        }
        .asst-hbtn:hover { background: rgba(255,255,255,0.28); }
        .asst-hbtn:active { transform: scale(0.94); }
        .asst-hbtn-active { background: rgba(255,255,255,0.32); }
        .asst-hbtn-danger:hover { background: rgba(239,68,68,0.9); }

        /* ---------- settings menu ---------- */
        .asst-menu {
          position: absolute; top: calc(100% + 8px); right: 12px;
          width: 260px; z-index: 8;
          background: #fff; border-radius: 14px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 16px 40px rgba(15,23,42,0.18);
          padding: 6px; color: #1e293b;
          animation: asstPop 0.14s ease-out;
        }
        .asst-menu-heading {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: #94a3b8;
          padding: 8px 10px 6px;
        }
        .asst-menu-divider {
          height: 1px; background: #f1f5f9; margin: 4px 6px 2px;
        }
        .asst-menu-row {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 9px; border: none;
          background: transparent; cursor: pointer; text-align: left;
          font-size: 13px; color: #334155;
          transition: background 0.12s ease;
        }
        .asst-menu-row:hover { background: #f1f5f9; }
        .asst-menu-row-icon {
          width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
          background: #e0f7fa; color: #0891b2;
          display: flex; align-items: center; justify-content: center; font-size: 12px;
        }
        .asst-menu-row-label { flex: 1; display: block; }
        .asst-menu-row-sub {
          display: block; font-size: 10.5px; color: #94a3b8;
          margin-top: 1px; font-weight: 400;
        }
        .asst-switch {
          width: 34px; height: 19px; border-radius: 999px; flex-shrink: 0;
          background: #cbd5e1; position: relative; transition: background 0.16s ease;
        }
        .asst-switch span {
          position: absolute; top: 2px; left: 2px;
          width: 15px; height: 15px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
          transition: transform 0.16s ease;
        }
        .asst-switch.on { background: #0891b2; }
        .asst-switch.on span { transform: translateX(15px); }

        /* ---------- theme segmented control ---------- */
        .asst-theme-control {
          display: flex; gap: 3px; padding: 3px;
          background: #f1f5f9; border-radius: 11px;
          margin: 2px 6px 6px;
        }
        .asst-theme-btn {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 4px;
          padding: 8px 4px; border-radius: 8px; border: none;
          background: transparent; color: #64748b;
          font-size: 10.5px; font-weight: 600; cursor: pointer;
          transition: all 0.14s ease;
          font-family: inherit;
        }
        .asst-theme-btn i { font-size: 12px; }
        .asst-theme-btn:hover { color: #334155; }
        .asst-theme-btn.active {
          background: #fff; color: #0891b2;
          box-shadow: 0 1px 3px rgba(15,23,42,0.12);
        }

        /* ---------- body ---------- */
        .asst-body { flex: 1; min-height: 0; position: relative; display: flex; flex-direction: column; background: #fff; }
        .asst-msgs {
          flex: 1; overflow-y: auto; padding: 14px;
          scroll-behavior: smooth;
        }
        .asst-msgs-inner {
          display: flex; flex-direction: column; gap: 10px;
          min-height: 100%;
        }
        .asst-msgs::-webkit-scrollbar { width: 6px; }
        .asst-msgs::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .asst-msgs::-webkit-scrollbar-track { background: transparent; }

        /* ---------- humanize mode ---------- */
        .asst-human-body {
          display: flex;
          flex-direction: column;
          background: #060c18;
          animation: asstFadeIn 0.22s ease-out;
        }
        .asst-human-frame {
          position: relative;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          isolation: isolate;
        }
        .asst-human-gif {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          user-select: none;
          -webkit-user-drag: none;
          transition: filter 0.3s ease, transform 0.45s cubic-bezier(0.16,1,0.3,1);
          will-change: transform, filter;
          z-index: 0;
        }
        .asst-human-gif.talking {
          filter: brightness(1.06) saturate(1.08)
                  drop-shadow(0 0 26px rgba(0,206,209,0.35));
          transform: scale(1.03);
        }
        .asst-human-scrim {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background:
            linear-gradient(to bottom, rgba(6,12,24,0.55) 0%, rgba(6,12,24,0) 22%),
            linear-gradient(to top,    rgba(6,12,24,0.82) 0%, rgba(6,12,24,0) 42%);
        }
        .asst-human-top {
          position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
          z-index: 3;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          max-width: 90%;
        }
        .asst-human-status {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 13px; border-radius: 999px;
          background: rgba(255,255,255,0.94);
          color: #475569;
          font-size: 11.5px; font-weight: 600; line-height: 1;
          min-height: 26px;
          box-shadow: 0 4px 14px rgba(2,6,23,0.28);
          backdrop-filter: blur(6px);
        }
        .asst-human-status-error { background: rgba(254,242,242,0.96); color: #b91c1c; }
        .asst-human-status-hint {
          background: rgba(254,243,199,0.96); color: #b45309;
          border: none; cursor: pointer;
          transition: background 0.14s ease, transform 0.14s ease;
        }
        .asst-human-status-hint:hover { background: #fde68a; transform: translateY(-1px); }
        .asst-human-status i { font-size: 10px; }
        .asst-human-status .asst-dot { background: #64748b; }

        .asst-human-chips {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 3;
          display: flex; flex-wrap: wrap; gap: 6px;
          justify-content: center; align-content: center;
          max-width: 92%; padding: 12px;
          border-radius: 18px;
          background: rgba(6,12,24,0.42);
          border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(8px);
          box-shadow: 0 12px 34px rgba(2,6,23,0.4);
          animation: asstFadeIn 0.24s ease-out;
        }
        .asst-human-chips .asst-chip {
          background: rgba(255,255,255,0.94);
          border-color: rgba(255,255,255,0.5);
          color: #0f172a;
          backdrop-filter: blur(6px);
          box-shadow: 0 2px 8px rgba(2,6,23,0.18);
        }
        .asst-human-chips .asst-chip i { color: #0891b2; }
        .asst-human-chips .asst-chip:hover:not(:disabled) {
          background: #fff; border-color: #00ced1; color: #0891b2;
          transform: translateY(-1px);
        }

        .asst-subtitle {
          position: absolute;
          left: 14px; right: 14px; bottom: 16px;
          z-index: 3;
          padding: 11px 15px;
          border-radius: 14px;
          background: rgba(2,6,23,0.74);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          color: #f8fafc;
          font-size: 13px; line-height: 1.55; font-weight: 500;
          text-align: center;
          letter-spacing: 0.005em;
          text-shadow: 0 1px 3px rgba(0,0,0,0.75);
          max-height: 42%;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(2,6,23,0.45);
          animation: asstSubtitleIn 0.24s cubic-bezier(0.16,1,0.3,1);
        }
        .asst-subtitle::-webkit-scrollbar { width: 5px; }
        .asst-subtitle::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.28); border-radius: 3px; }

        /* ---------- welcome ---------- */
        .asst-welcome {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; gap: 8px; padding: 8px 6px 16px;
        }
        .asst-welcome-mascot {
          width: 120px; max-width: 60%; height: auto; margin-bottom: 2px;
          filter: drop-shadow(0 8px 18px rgba(8,145,178,0.22));
          animation: asstFloat 3.6s ease-in-out infinite;
        }
        .asst-welcome-title { font-size: 16px; font-weight: 700; color: #0f172a; }
        .asst-welcome-sub { font-size: 12.5px; color: #64748b; line-height: 1.55; max-width: 300px; }

        .asst-chips {
          display: flex; flex-wrap: wrap; gap: 6px;
          justify-content: center; margin-top: 8px; max-width: 320px;
        }
        .asst-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 11px; border-radius: 999px;
          border: 1px solid #e2e8f0; background: #fff; color: #334155;
          font-size: 12px; cursor: pointer;
          transition: all 0.14s ease;
        }
        .asst-chip i { color: #0891b2; font-size: 11px; }
        .asst-chip:hover:not(:disabled) {
          border-color: #0891b2; background: #f0feff; color: #0891b2;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(8,145,178,0.14);
        }
        .asst-chip:disabled { opacity: 0.55; cursor: default; }

        /* ---------- messages ---------- */
        .asst-row {
          display: flex; align-items: flex-end; gap: 7px;
          animation: asstFadeIn 0.22s ease-out;
        }
        .asst-row-user { justify-content: flex-end; }
        .asst-avatar-sm {
          width: 26px; height: 26px; border-radius: 50%;
          overflow: hidden; flex-shrink: 0; background: #e0f7fa;
          border: 1.5px solid #fff; box-shadow: 0 1px 4px rgba(15,23,42,0.14);
        }
        .asst-avatar-sm img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .asst-bubble {
          max-width: 82%; padding: 9px 13px;
          font-size: 13px; line-height: 1.55;
          word-break: break-word;
          position: relative;
        }
        .asst-bubble-bot {
          background: #f1f5f9; color: #334155;
          border-radius: 14px 14px 14px 4px;
        }
        .asst-bubble-user {
          background: linear-gradient(135deg, #00ced1, #0891b2);
          color: #fff;
          border-radius: 14px 14px 4px 14px;
          box-shadow: 0 2px 8px rgba(8,145,178,0.24);
        }
        .asst-bubble-error {
          background: #fef2f2; color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .asst-meta {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; margin-top: 5px; min-height: 14px;
        }
        .asst-bubble-user .asst-meta { justify-content: flex-end; }
        .asst-time { font-size: 10px; opacity: 0.62; }
        .asst-meta-actions { display: inline-flex; gap: 2px; opacity: 0; transition: opacity 0.14s ease; }
        .asst-bubble:hover .asst-meta-actions { opacity: 1; }
        @media (hover: none) { .asst-meta-actions { opacity: 1; } }
        .asst-meta-btn {
          border: none; background: none; cursor: pointer;
          font-size: 11px; line-height: 1; padding: 3px 4px;
          border-radius: 5px; color: #94a3b8;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.12s ease;
        }
        .asst-meta-btn:hover { background: rgba(148,163,184,0.18); color: #475569; }
        .asst-meta-btn.active { color: #0891b2; background: rgba(8,145,178,0.12); }

        .asst-typing { display: flex; align-items: center; gap: 4px; padding: 12px 14px; }
        .asst-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; opacity: 0.4;
          animation: asstBlink 1s infinite ease-in-out;
        }

        .asst-scroll-btn {
          position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
          width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid #e2e8f0; background: #fff; color: #0891b2;
          cursor: pointer; font-size: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(15,23,42,0.14);
          animation: asstPop 0.16s ease-out;
          z-index: 3;
        }
        .asst-scroll-btn:hover { background: #f0feff; }

        /* ---------- sessions ---------- */
        .asst-sessions { overflow-y: auto; background: #f8fafc; }
        .asst-sessions::-webkit-scrollbar { width: 6px; }
        .asst-sessions::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

        .asst-session-row {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 13px; cursor: pointer;
          border-bottom: 1px solid #eef2f7; background: #fff;
          transition: background 0.12s ease;
        }
        .asst-session-row:hover { background: #f1f5f9; }
        .asst-session-row.active { background: #e6fffd; }
        .asst-session-row.editing { cursor: default; background: #f8fafc; }
        .asst-session-icon {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          background: #e2e8f0; color: #64748b;
          display: flex; align-items: center; justify-content: center; font-size: 13px;
          transition: all 0.14s ease;
        }
        .asst-session-row.active .asst-session-icon {
          background: linear-gradient(135deg, #00ced1, #0891b2); color: #fff;
          box-shadow: 0 3px 8px rgba(8,145,178,0.28);
        }
        .asst-session-text { flex: 1; min-width: 0; }
        .asst-session-title {
          font-size: 13px; color: #1e293b; line-height: 1.3;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .asst-session-row.active .asst-session-title { font-weight: 600; }
        .asst-session-date { font-size: 11px; color: #94a3b8; margin-top: 2px; }

        /* inline rename */
        .asst-session-edit-input {
          width: 100%;
          padding: 5px 8px;
          border-radius: 7px;
          border: 1px solid #0891b2;
          background: #fff;
          color: #1e293b;
          font-size: 12.5px;
          font-family: inherit;
          font-weight: 500;
          outline: none;
          box-shadow: 0 0 0 3px rgba(8,145,178,0.14);
          transition: border-color 0.14s ease, box-shadow 0.14s ease;
        }
        .asst-session-edit-input:disabled { opacity: 0.7; }
        .asst-session-edit-hint {
          display: flex; align-items: center; gap: 4px;
          font-size: 10.5px; color: #94a3b8; margin-top: 3px;
          line-height: 1.2;
        }
        .asst-session-edit-error { color: #ef4444; display: inline-flex; align-items: center; gap: 4px; }

        /* row action buttons */
        .asst-session-actions {
          display: flex; gap: 3px; flex-shrink: 0;
          animation: asstPop 0.14s ease-out;
        }
        .asst-session-btn {
          width: 26px; height: 26px; border-radius: 7px; border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; flex-shrink: 0;
          transition: background 0.12s ease, transform 0.12s ease;
        }
        .asst-session-btn:active { transform: scale(0.92); }
        .asst-session-edit { background: #e0f7fa; color: #0891b2; }
        .asst-session-edit:hover { background: #b2ebf2; }
        .asst-session-del { background: #fee2e2; color: #ef4444; }
        .asst-session-del:hover { background: #fecaca; }

        .asst-session-confirm { display: flex; gap: 4px; flex-shrink: 0; animation: asstPop 0.14s ease-out; }
        .asst-confirm-yes, .asst-confirm-no {
          border: none; border-radius: 7px; padding: 5px 9px;
          font-size: 11px; font-weight: 600; cursor: pointer;
        }
        .asst-confirm-yes { background: #ef4444; color: #fff; }
        .asst-confirm-yes:hover { background: #dc2626; }
        .asst-confirm-no { background: #f1f5f9; color: #475569; }
        .asst-confirm-no:hover { background: #e2e8f0; }

        /* ---------- empty / skeleton ---------- */
        .asst-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 32px 20px; text-align: center; gap: 6px;
        }
        .asst-empty-icon {
          width: 56px; height: 56px; border-radius: 16px;
          background: #e0f7fa; color: #0891b2;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin-bottom: 6px;
        }
        .asst-empty-title { font-size: 14px; font-weight: 700; color: #1e293b; }
        .asst-empty-sub { font-size: 12px; color: #94a3b8; margin-bottom: 10px; }
        .asst-empty-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #00ced1, #0891b2); color: #fff;
          font-size: 12.5px; font-weight: 600; cursor: pointer;
          box-shadow: 0 4px 12px rgba(8,145,178,0.3);
          transition: transform 0.14s ease, box-shadow 0.14s ease;
        }
        .asst-empty-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(8,145,178,0.4); }

        .asst-skeleton-list { padding: 4px 0; }
        .asst-skeleton-row {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 13px; border-bottom: 1px solid #eef2f7; background: #fff;
        }
        .asst-skeleton-avatar {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          background: linear-gradient(90deg, #eef2f7 25%, #e2e8f0 37%, #eef2f7 63%);
          background-size: 400% 100%;
          animation: asstShimmer 1.3s ease infinite;
        }
        .asst-skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .asst-skeleton-line {
          height: 9px; border-radius: 5px;
          background: linear-gradient(90deg, #eef2f7 25%, #e2e8f0 37%, #eef2f7 63%);
          background-size: 400% 100%;
          animation: asstShimmer 1.3s ease infinite;
        }
        .asst-skeleton-line.w-70 { width: 70%; }
        .asst-skeleton-line.w-40 { width: 40%; }

        /* ---------- attachments ---------- */
        .asst-attach-bar {
          display: flex; flex-wrap: wrap; gap: 5px;
          padding: 7px 12px; background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          max-height: 74px; overflow-y: auto; flex-shrink: 0;
        }
        .asst-attach-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 6px 4px 9px; border-radius: 999px;
          background: #e0f7fa; color: #0891b2; font-size: 11px;
          line-height: 1; white-space: nowrap; max-width: 100%;
        }
        .asst-attach-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
        .asst-attach-size { opacity: 0.7; font-size: 10px; }
        .asst-attach-x {
          border: none; background: none; color: #0891b2;
          cursor: pointer; font-size: 10px; padding: 0 1px;
          opacity: 0.7; line-height: 1;
        }
        .asst-attach-x:hover { opacity: 1; }

        /* ---------- composer ---------- */
        .asst-composer {
          display: flex; flex-direction: column;
          padding: 0 12px 12px;
          border-top: 1px solid #f1f5f9;
          background: #fff; flex-shrink: 0;
        }
        .asst-speech-error {
          display: flex; align-items: center; gap: 7px;
          margin: 8px 0 0; padding: 7px 10px;
          border-radius: 9px; background: #fef3c7;
          border: 1px solid #fde68a;
          color: #92400e; font-size: 12px; line-height: 1.4;
        }
        .asst-speech-error i { color: #d97706; flex-shrink: 0; }
        .asst-composer-inner {
          display: flex; align-items: flex-end; gap: 6px;
          flex: 1; min-width: 0;
          padding-top: 10px;
        }
        .asst-textarea {
          flex: 1; min-width: 0;
          padding: 9px 13px; border-radius: 12px;
          border: 1px solid #e2e8f0; outline: none;
          font-size: 13px; line-height: 1.45; color: #334155;
          background: #f8fafc; resize: none; overflow-y: auto;
          max-height: 200px; font-family: inherit;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .asst-textarea::placeholder { color: #94a3b8; }
        .asst-textarea:focus {
          border-color: #0891b2; background: #fff;
          box-shadow: 0 0 0 3px rgba(8,145,178,0.12);
        }
        .asst-textarea:disabled { opacity: 0.65; }

        .asst-icon-btn {
          width: 36px; height: 36px; border-radius: 11px; border: none;
          background: #f1f5f9; color: #64748b; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .asst-icon-btn:hover:not(:disabled) { background: #e2e8f0; color: #334155; }
        .asst-icon-btn:disabled { cursor: default; opacity: 0.6; }
        .asst-icon-btn-rec {
          background: #fee2e2; color: #ef4444;
          animation: asstMicPulse 1.2s infinite ease-in-out;
        }

        .asst-send-btn {
          width: 38px; height: 38px; border-radius: 11px; border: none;
          background: #e2e8f0; color: #94a3b8;
          cursor: default; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          transition: all 0.16s ease;
        }
        .asst-send-btn:not(:disabled) {
          background: linear-gradient(135deg, #00ced1, #0891b2);
          color: #fff; cursor: pointer;
          box-shadow: 0 3px 10px rgba(8,145,178,0.34);
        }
        .asst-send-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(8,145,178,0.42); }
        .asst-send-btn:not(:disabled):active { transform: scale(0.95); }

        /* ---------- markdown ---------- */
        .asst-md p { margin: 2px 0; }
        .asst-md p:first-child { margin-top: 0; }
        .asst-md p:last-child { margin-bottom: 0; }
        .asst-md strong { font-weight: 700; }
        .asst-md em { font-style: italic; }
        .asst-md hr { border: none; border-top: 1px solid #e2e8f0; margin: 7px 0; }
        .asst-md a { color: #0891b2; text-decoration: underline; }
        .asst-window.asst-fullscreen .asst-md { font-size: 14px; line-height: 1.7; }
        .asst-window.asst-fullscreen .asst-md p { margin: 8px 0; }

        /* ═══════════════ DARK THEME OVERRIDES ═══════════════ */
        .asst-window.asst-dark {
          background: #0f172a;
          border-color: #1e293b;
          color-scheme: dark;
        }
        .asst-window.asst-dark.asst-fullscreen .asst-header {
          background: rgba(15,23,42,0.94);
          border-bottom-color: #1e293b;
          color: #f1f5f9;
        }
        .asst-window.asst-dark .asst-brand-title { color: inherit; }
        .asst-window.asst-dark.asst-fullscreen .asst-brand-title { color: #f1f5f9; }
        .asst-window.asst-dark.asst-fullscreen .asst-brand-sub { color: #94a3b8; opacity: 1; }
        .asst-window.asst-dark.asst-fullscreen .asst-hbtn {
          background: #1e293b; color: #cbd5e1;
        }
        .asst-window.asst-dark.asst-fullscreen .asst-hbtn:hover { background: #334155; }
        .asst-window.asst-dark.asst-fullscreen .asst-hbtn-active {
          background: #0c2731; color: #22d3ee;
        }
        .asst-window.asst-dark.asst-fullscreen .asst-hbtn-danger:hover {
          background: #7f1d1d; color: #fecaca;
        }
        .asst-window.asst-dark .asst-fs-body { background: #0f172a; }

        .asst-window.asst-dark .asst-menu {
          background: #1e293b;
          border-color: #334155;
          box-shadow: 0 16px 40px rgba(0,0,0,0.55);
          color: #e2e8f0;
        }
        .asst-window.asst-dark .asst-menu-heading { color: #64748b; }
        .asst-window.asst-dark .asst-menu-divider { background: #334155; }
        .asst-window.asst-dark .asst-menu-row { color: #cbd5e1; }
        .asst-window.asst-dark .asst-menu-row:hover { background: #334155; }
        .asst-window.asst-dark .asst-menu-row-icon { background: #0c2731; color: #22d3ee; }
        .asst-window.asst-dark .asst-menu-row-sub { color: #64748b; }
        .asst-window.asst-dark .asst-switch { background: #475569; }
        .asst-window.asst-dark .asst-switch.on { background: #06b6d4; }

        .asst-window.asst-dark .asst-theme-control { background: #0f172a; }
        .asst-window.asst-dark .asst-theme-btn { color: #64748b; }
        .asst-window.asst-dark .asst-theme-btn:hover { color: #cbd5e1; }
        .asst-window.asst-dark .asst-theme-btn.active {
          background: #334155; color: #22d3ee;
          box-shadow: 0 1px 3px rgba(0,0,0,0.45);
        }

        .asst-window.asst-dark .asst-body { background: #0f172a; }
        .asst-window.asst-dark .asst-msgs::-webkit-scrollbar-thumb { background: #334155; }
        .asst-window.asst-dark .asst-bubble-bot {
          background: #1e293b; color: #e2e8f0;
        }
        .asst-window.asst-dark.asst-fullscreen .asst-bubble-bot {
          background: transparent;
        }
        .asst-window.asst-dark .asst-bubble-error {
          background: #450a0a; color: #fecaca; border-color: #7f1d1d;
        }
        .asst-window.asst-dark .asst-time { opacity: 0.55; }
        .asst-window.asst-dark .asst-meta-btn { color: #64748b; }
        .asst-window.asst-dark .asst-meta-btn:hover { background: rgba(148,163,184,0.18); color: #cbd5e1; }
        .asst-window.asst-dark .asst-meta-btn.active { color: #22d3ee; background: rgba(34,211,238,0.14); }
        .asst-window.asst-dark .asst-typing { background: #1e293b; }
        .asst-window.asst-dark .asst-dot { background: #64748b; }
        .asst-window.asst-dark .asst-avatar-sm {
          background: #0c2731; border-color: #1e293b;
        }

        .asst-window.asst-dark .asst-composer {
          background: #0f172a; border-top-color: #1e293b;
        }
        .asst-window.asst-dark .asst-speech-error {
          background: #3b2f0f; border-color: #57534e;
          color: #fbbf24;
        }
        .asst-window.asst-dark .asst-speech-error i { color: #f59e0b; }
        .asst-window.asst-dark.asst-fullscreen .asst-composer {
          background: linear-gradient(to top, #0f172a 55%, rgba(15,23,42,0));
        }
        .asst-window.asst-dark .asst-composer-inner {
          background: #1e293b; border-color: #334155;
        }
        .asst-window.asst-dark.asst-fullscreen .asst-composer-inner {
          background: #1e293b; border-color: #334155;
          box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3);
        }
        .asst-window.asst-dark.asst-fullscreen .asst-composer-inner:focus-within {
          border-color: #22d3ee;
          box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 0 0 3px rgba(34,211,238,0.18);
        }
        .asst-window.asst-dark .asst-textarea {
          background: #1e293b; border-color: #334155; color: #e2e8f0;
        }
        .asst-window.asst-dark.asst-fullscreen .asst-textarea { background: transparent; border: none; }
        .asst-window.asst-dark .asst-textarea:focus {
          border-color: #22d3ee; background: #0f172a;
          box-shadow: 0 0 0 3px rgba(34,211,238,0.18);
        }
        .asst-window.asst-dark.asst-fullscreen .asst-textarea:focus { background: transparent; box-shadow: none; }
        .asst-window.asst-dark .asst-textarea::placeholder { color: #64748b; }
        .asst-window.asst-dark .asst-icon-btn { background: #1e293b; color: #94a3b8; }
        .asst-window.asst-dark .asst-icon-btn:hover:not(:disabled) { background: #334155; color: #e2e8f0; }
        .asst-window.asst-dark.asst-fullscreen .asst-icon-btn { background: transparent; }
        .asst-window.asst-dark.asst-fullscreen .asst-icon-btn:hover:not(:disabled) { background: #334155; }
        .asst-window.asst-dark .asst-icon-btn-rec { background: #450a0a; color: #f87171; }
        .asst-window.asst-dark .asst-send-btn {
          background: #334155; color: #64748b;
        }
        .asst-window.asst-dark .asst-send-btn:not(:disabled) {
          background: linear-gradient(135deg, #06b6d4, #0e7490);
          box-shadow: 0 3px 10px rgba(6,182,212,0.3);
        }

        .asst-window.asst-dark .asst-sessions { background: #0f172a; }
        .asst-window.asst-dark .asst-sessions::-webkit-scrollbar-thumb { background: #334155; }
        .asst-window.asst-dark .asst-session-row {
          background: #0f172a; border-bottom-color: #1e293b;
        }
        .asst-window.asst-dark .asst-session-row:hover { background: #1e293b; }
        .asst-window.asst-dark .asst-session-row.active { background: #0c2731; }
        .asst-window.asst-dark .asst-session-row.editing { background: #0b1220; }
        .asst-window.asst-dark .asst-session-icon { background: #1e293b; color: #94a3b8; }
        .asst-window.asst-dark .asst-session-title { color: #e2e8f0; }
        .asst-window.asst-dark .asst-session-date { color: #64748b; }
        .asst-window.asst-dark .asst-session-edit { background: #0c2731; color: #22d3ee; }
        .asst-window.asst-dark .asst-session-edit:hover { background: #164e63; }
        .asst-window.asst-dark .asst-session-del { background: #450a0a; color: #f87171; }
        .asst-window.asst-dark .asst-session-del:hover { background: #7f1d1d; }
        .asst-window.asst-dark .asst-session-edit-input {
          background: #0f172a; border-color: #22d3ee; color: #e2e8f0;
          box-shadow: 0 0 0 3px rgba(34,211,238,0.18);
        }
        .asst-window.asst-dark .asst-session-edit-hint { color: #64748b; }
        .asst-window.asst-dark .asst-session-edit-error { color: #f87171; }
        .asst-window.asst-dark .asst-confirm-yes { background: #dc2626; }
        .asst-window.asst-dark .asst-confirm-yes:hover { background: #b91c1c; }
        .asst-window.asst-dark .asst-confirm-no { background: #1e293b; color: #cbd5e1; }
        .asst-window.asst-dark .asst-confirm-no:hover { background: #334155; }

        .asst-window.asst-dark .asst-sidebar {
          background: #0b1220; border-right-color: #1e293b;
        }
        .asst-window.asst-dark .asst-sidebar-title { color: #64748b; }
        .asst-window.asst-dark .asst-sidebar-collapse { color: #64748b; }
        .asst-window.asst-dark .asst-sidebar-collapse:hover { background: #1e293b; color: #cbd5e1; }
        .asst-window.asst-dark .asst-sidebar-new {
          background: #1e293b; border-color: #334155; color: #22d3ee;
        }
        .asst-window.asst-dark .asst-sidebar-new:hover {
          background: #0c2731; border-color: #22d3ee;
        }
        .asst-window.asst-dark .asst-sidebar .asst-session-row { background: transparent; }
        .asst-window.asst-dark .asst-sidebar .asst-session-row:hover { background: #1e293b; }
        .asst-window.asst-dark .asst-sidebar .asst-session-row.active {
          background: #0c2731;
          box-shadow: inset 0 0 0 1px rgba(34,211,238,0.24);
        }
        .asst-window.asst-dark .asst-sidebar .asst-session-icon { background: #1e293b; color: #94a3b8; }
        .asst-window.asst-dark .asst-sidebar-list::-webkit-scrollbar-thumb { background: #334155; }

        .asst-window.asst-dark .asst-welcome-title { color: #f1f5f9; }
        .asst-window.asst-dark .asst-welcome-sub { color: #94a3b8; }
        .asst-window.asst-dark .asst-chip {
          background: #1e293b; border-color: #334155; color: #cbd5e1;
        }
        .asst-window.asst-dark .asst-chip:hover:not(:disabled) {
          background: #0c2731; border-color: #22d3ee; color: #22d3ee;
        }

        .asst-window.asst-dark .asst-empty-icon { background: #0c2731; color: #22d3ee; }
        .asst-window.asst-dark .asst-empty-title { color: #e2e8f0; }
        .asst-window.asst-dark .asst-empty-sub { color: #64748b; }
        .asst-window.asst-dark .asst-skeleton-row {
          background: #0f172a; border-bottom-color: #1e293b;
        }
        .asst-window.asst-dark .asst-skeleton-avatar,
        .asst-window.asst-dark .asst-skeleton-line {
          background: linear-gradient(90deg, #1e293b 25%, #334155 37%, #1e293b 63%);
          background-size: 400% 100%;
        }

        .asst-window.asst-dark .asst-attach-bar {
          background: #0f172a; border-top-color: #1e293b;
        }
        .asst-window.asst-dark .asst-attach-chip { background: #0c2731; color: #22d3ee; }
        .asst-window.asst-dark .asst-attach-x { color: #22d3ee; }

        .asst-window.asst-dark .asst-scroll-btn {
          background: #1e293b; border-color: #334155; color: #22d3ee;
        }
        .asst-window.asst-dark .asst-scroll-btn:hover { background: #334155; }

        .asst-window.asst-dark .asst-md hr { border-top-color: #334155; }
        .asst-window.asst-dark .asst-md a { color: #22d3ee; }

        /* ---------- animations ---------- */
        @keyframes assistantSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes asstFullscreenIn {
          from { opacity: 0.85; transform: scale(0.985); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes asstPop {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes asstFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes asstSubtitleIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes asstBlink {
          0%, 100% { opacity: 0.25; transform: translateY(0); }
          50%      { opacity: 1;    transform: translateY(-3px); }
        }
        @keyframes asstMicPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.45); }
          50%      { box-shadow: 0 0 0 7px rgba(239,68,68,0); }
        }
        @keyframes asstFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes asstShimmer {
          0%   { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .asst-window, .asst-row, .asst-menu, .asst-scroll-btn,
          .asst-welcome-mascot, .asst-human-gif, .asst-human-chips,
          .asst-subtitle, .asst-dot, .asst-icon-btn-rec,
          .asst-sidebar, .asst-skeleton-avatar, .asst-skeleton-line {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}

/* ─── local fallback (public route, no backend) ──────────────────────── */

function fallbackReply(text) {
  const lower = text.toLowerCase();
  if (lower.includes('prototype'))
    return { text: "I'll take you to the Prototype Requests page.", action: 'prototypes' };
  if (lower.includes('idea'))
    return { text: "Opening the Idea Hub for you.", action: 'ideas' };
  if (lower.includes('design') || lower.includes('bom'))
    return { text: "Taking you to the Design Log page.", action: 'designs' };
  if (lower.includes('leave'))
    return { text: "Opening the Leave request for you.", action: 'leaves' };
  if (lower.includes('report'))
    return { text: "Opening the Reports section.", action: 'report' };
  if (lower.includes('message') || lower.includes('chat'))
    return { text: "Here are your Messages.", action: 'messages' };
  if (lower.includes('notification'))
    return { text: "Here are your Notifications.", action: 'notifications' };
  if (lower.includes('note'))
    return { text: "Taking you to your Notes.", action: 'notes' };
  if (lower.includes('setting') || lower.includes('profile'))
    return { text: "Opening Settings for you.", action: 'settings' };
  if (lower.includes('help') || lower.includes('what can you do'))
    return {
      text: "I can help you navigate the dashboard quickly! Try asking me to:\n• Open prototype requests\n• View ideas\n• Check the design log\n• See reports\n• Open messages\n• And more!",
    };
  return { text: "I can help you navigate the dashboard. Try asking about prototypes, ideas, designs, reports, or messages!" };
}