// =============================================
// AI AGENT MODULE - Vector AI Assistant Chat
// Faithful vanilla-JS port of FrontDesk FloatingAssistant (embedded view)
// =============================================

const AI_API_URL = (window.AI_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');
const AI_IMG_ROOT = 'imgs/';

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function rowTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return nowTime();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
    text: "Hi! I'm your machine operation assistant. I can look up orders, reports, schedules, machines and more, or navigate to a module. How can I help?",
  };
}

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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── markdown → html (GFM subset mirroring front-desk .asst-md) ─── */

function inlineMd(text) {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return s;
}

function mdToHtml(text) {
  let src = String(text || '');
  const html = [];
  const codeBlocks = [];
  src = src.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const key = `\u0000CODE${codeBlocks.length}\u0000`;
    codeBlocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
    return key;
  });

  const lines = src.split('\n');
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listTag = 'ul';
  let listItemsOpen = false;

  function flushList() {
    if (!inList) return;
    html.push(`</${listTag}>`);
    inList = false;
    listItemsOpen = false;
  }
  function flushTable() {
    if (!inTable) return;
    let cells = tableRows[0] || [];
    let head = cells.map((c) => `<th>${inlineMd(c)}</th>`).join('');
    let body = tableRows.slice(1).map((r) =>
      `<tr>${r.map((c) => `<td>${inlineMd(c)}</td>`).join('')}</tr>`
    ).join('');
    html.push(`<div style="overflow-x:auto;margin:4px 0"><table>${head ? `<thead><tr>${head}</tr></thead>` : ''}${body ? `<tbody>${body}</tbody>` : ''}</table></div>`);
    inTable = false;
    tableRows = [];
  }

  for (let line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') || (inTable && trimmed.includes('|'))) {
      if (!inTable) { inTable = true; tableRows = []; }
      let cells = trimmed.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c.replace(/\s/g, '')))) continue; // separator
      tableRows.push(cells);
      continue;
    }
    if (inTable) flushTable();

    flushList();

    if (trimmed === '') { html.push(''); continue; }

    if (/^#{1,6}\s/.test(trimmed)) {
      const level = trimmed.match(/^#+/)[0].length;
      html.push(`<h${level}>${inlineMd(trimmed.replace(/^#+\s*/, ''))}</h${level}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) { html.push('<hr>'); continue; }
    if (/^>\s?/.test(trimmed)) {
      html.push(`<blockquote>${inlineMd(trimmed.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }
    if (/^[-*]\s/.test(trimmed)) {
      if (!inList) { inList = true; listTag = 'ul'; html.push('<ul>'); }
      html.push(`<li>${inlineMd(trimmed.replace(/^[-*]\s/, ''))}</li>`);
      continue;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) { inList = true; listTag = 'ol'; html.push('<ol>'); }
      html.push(`<li>${inlineMd(trimmed.replace(/^\d+\.\s/, ''))}</li>`);
      continue;
    }
    html.push(`<p>${inlineMd(trimmed)}</p>`);
  }
  flushList();
  flushTable();

  let out = html.join('\n');
  out = out.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => codeBlocks[Number(i)]);
  return out;
}

/* ─── API helpers ─── */

async function callAI(path, body, method = 'GET') {
  const res = await fetch(`${AI_API_URL}${path}`, {
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
  const res = await fetch(`${AI_API_URL}/users/${user.id}/sessions/${sid}/attachments`, { method: 'POST', body: fd });
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
  const res = await fetch(`${AI_API_URL}/users/${user.id}/sessions/${sid}/attachments/${aid}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    const err = new Error(`Failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
}

/* ─── component state ─── */

const AIAgent = (function() {
  let root = null;
  let user = null;

  // ui state
  const S = {
    isOpen: true,
    isFullscreen: true,        // embedded starts fullscreen
    sidebarOpen: true,
    showSessions: false,
    showMenu: false,
    input: '',
    sending: false,
    uploading: false,
    messages: [greeting()],
    attachments: [],
    sessions: [],
    activeSid: null,
    confirmDeleteSid: null,
    loadingSessions: false,
    copiedId: null,
    atBottom: true,

    // rename
    editingSid: null,
    editTitle: '',
    savingEdit: false,
    editError: null,

    // voice
    listening: false,
    autoSpeak: true,
    speakingId: null,
    showAvatar: true,
    speechError: null,

    // humanize
    humanize: false,
  };

  const refs = {
    scrollBox: null,
    messagesEnd: null,
    input: null,
    file: null,
    recognition: null,
    sending: false,
    speechSupported: Boolean(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)),
    ttsSupported: typeof window !== 'undefined' && Boolean(window.speechSynthesis),
    freshSids: new Set(),
    loadedSid: null,
    sessionRef: null,
    speakingRef: null,
    listeningRef: null,
  };

  let sessionKey = null;
  let initPromise = null;

  async function ensureUser() {
    if (user) return user;
    const A = typeof Auth !== 'undefined' ? Auth : null;
    if (A?.initPromise) {
      try { await A.initPromise; } catch { /* ignore */ }
    }
    if (A?.isAuthenticated && !A.isAuthenticated()) return null;
    if (A?.getCurrentUser) user = A.getCurrentUser();
    if (user) {
      sessionKey = `ai_session_${user.id}`;
      const stored = localStorage.getItem(sessionKey);
      if (stored) refs.sessionRef = stored;
    }
    return user;
  }

  function setActiveSession(sid) {
    refs.sessionRef = sid;
    S.activeSid = sid;
    if (sessionKey && sid) localStorage.setItem(sessionKey, sid);
    else if (sessionKey) localStorage.removeItem(sessionKey);
  }

  /* ── data loaders ── */
  async function loadSessions() {
    if (!(await ensureUser())) return;
    S.loadingSessions = true;
    render();
    try {
      const list = await callAI(`/users/${user.id}/sessions`);
      if (!Array.isArray(list)) return;
      list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      S.sessions = list;
      if (refs.sessionRef && !list.find((s) => s.id === refs.sessionRef)) refs.sessionRef = null;
      if (!refs.sessionRef && list.length) await loadSessionData(list[0].id);
    } catch { /* keep empty */ }
    finally {
      S.loadingSessions = false;
      render();
    }
  }

  async function loadSessionData(sid) {
    if (!(await ensureUser()) || !sid) return;
    refs.loadedSid = sid;
    setActiveSession(sid);
    S.attachments = [];
    S.messages = [greeting()];
    render();
    try {
      const [rows, atts] = await Promise.all([
        callAI(`/users/${user.id}/sessions/${sid}/chats`).catch(() => []),
        callAI(`/users/${user.id}/sessions/${sid}/attachments`).catch(() => []),
      ]);
      if (refs.loadedSid !== sid) return;
      S.messages = (rows && rows.length)
        ? rows.map((r) => ({ id: r.id, role: r.role, text: r.content, time: rowTime(r.created_at) }))
        : [greeting()];
      S.attachments = Array.isArray(atts)
        ? atts.map((a) => ({ id: a.id, name: a.name, file_size: a.file_size, mime_type: a.mime_type }))
        : [];
    } catch {
      if (refs.loadedSid !== sid) return;
      S.messages = [greeting()];
    }
    render();
    scrollBottom();
  }

  async function newChat() {
    if (!(await ensureUser())) return;
    try {
      const s = await callAI(`/users/${user.id}/sessions`, { title: 'New Chat' }, 'POST');
      refs.freshSids.add(s.id);
      S.sessions = [s, ...S.sessions];
      S.showMenu = false;
      refs.loadedSid = null;
      S.messages = [greeting()];
      S.attachments = [];
      setActiveSession(s.id);
      render();
      scrollBottom();
      focusInput();
    } catch { /* silent */ }
  }

  function switchSession(sid) {
    if (sid === refs.sessionRef) return;
    S.messages = [greeting()];
    S.attachments = [];
    refs.loadedSid = null;
    loadSessionData(sid);
  }

  function startEdit(s, ev) {
    ev?.stopPropagation?.();
    S.confirmDeleteSid = null;
    S.editingSid = s.id;
    S.editTitle = s.title || '';
    S.editError = null;
    render();
    const el = document.getElementById('asst-edit-input');
    if (el) { el.focus(); el.select(); }
  }

  function cancelEdit() {
    S.editingSid = null;
    S.editTitle = '';
    S.editError = null;
    render();
  }

  async function saveEdit() {
    if (!(await ensureUser())) return;
    const sid = S.editingSid;
    if (!sid || S.savingEdit) return;
    const trimmed = S.editTitle.trim();
    const original = S.sessions.find((x) => x.id === sid)?.title || '';
    if (!trimmed || trimmed === original) { cancelEdit(); return; }
    S.savingEdit = true;
    S.editError = null;
    S.sessions = S.sessions.map((x) => (x.id === sid ? { ...x, title: trimmed } : x));
    render();
    try {
      const updated = await callAI(`/users/${user.id}/sessions/${sid}`, { title: trimmed }, 'PATCH');
      refs.freshSids.delete(sid);
      S.sessions = S.sessions.map((x) => (x.id === sid ? { ...x, ...(updated || {}), title: updated?.title ?? trimmed } : x));
      S.editingSid = null;
      S.editTitle = '';
    } catch (err) {
      S.sessions = S.sessions.map((x) => (x.id === sid ? { ...x, title: original } : x));
      S.editError = err.message || 'Rename failed';
    }
    finally {
      S.savingEdit = false;
      render();
    }
  }

  async function deleteSession(sid) {
    if (!(await ensureUser())) return;
    try {
      await callAI(`/users/${user.id}/sessions/${sid}`, undefined, 'DELETE');
      S.sessions = S.sessions.filter((x) => x.id !== sid);
      if (sid === refs.sessionRef) {
        refs.loadedSid = null;
        setActiveSession(null);
        S.messages = [greeting()];
        S.attachments = [];
      }
    } catch { /* silent */ }
    finally {
      S.confirmDeleteSid = null;
      render();
    }
  }

  function maybeTitleSession(sid, text) {
    if (!sid || !refs.freshSids.has(sid)) return;
    const title = String(text).trim().slice(0, 80);
    S.sessions = S.sessions.map((x) => (x.id === sid ? { ...x, title } : x));
    callAI(`/users/${user.id}/sessions/${sid}`, { title }, 'PATCH')
      .then((updated) => {
        refs.freshSids.delete(sid);
        S.sessions = S.sessions.map((x) => (x.id === sid ? updated : x));
        render();
      })
      .catch(() => {});
  }

  /* ── send ── */
  async function sendMessage() {
    const trimmed = S.input.trim();
    if (!trimmed || refs.sending) return;
    if (!(await ensureUser())) {
      S.sending = false;
      render();
      return;
    }
    refs.sending = true;

    S.messages = [...S.messages, { id: Date.now(), role: 'user', text: trimmed, time: nowTime() }];
    S.input = '';
    S.speechError = '';
    S.sending = true;
    if (S.listening) stopListen();
    window.speechSynthesis?.cancel();
    S.speakingId = null;
    render();
    scrollBottom();

    try {
      let sid = refs.sessionRef;
      if (!sid) {
        const s = await callAI(`/users/${user.id}/sessions`, { title: 'New Chat' }, 'POST');
        sid = s.id;
        setActiveSession(sid);
        refs.freshSids.add(sid);
        S.sessions = [s, ...S.sessions];
        refs.loadedSid = sid;
      }
      try {
        const exchange = await callAI(`/users/${user.id}/sessions/${sid}/chats`, { content: trimmed }, 'POST');
        maybeTitleSession(sid, trimmed);
        const replyId = Date.now() + 1;
        S.messages = [...S.messages, { id: replyId, role: 'assistant', text: exchange?.assistant_message?.content || "I couldn't form a reply.", time: nowTime() }];
        if (S.autoSpeak && refs.ttsSupported) autoSpeak(replyId);
      } catch (err) {
        if (err.status === 404) {
          refs.loadedSid = null;
          if (sessionKey) localStorage.removeItem(sessionKey);
          const fresh = await callAI(`/users/${user.id}/sessions`, { title: 'New Chat' }, 'POST');
          refs.loadedSid = fresh.id;
          setActiveSession(fresh.id);
          refs.freshSids.add(fresh.id);
          S.sessions = [fresh, ...S.sessions];
          const retry = await callAI(`/users/${user.id}/sessions/${fresh.id}/chats`, { content: trimmed }, 'POST');
          maybeTitleSession(fresh.id, trimmed);
          const retryId = Date.now() + 1;
          S.messages = [...S.messages, { id: retryId, role: 'assistant', text: retry?.assistant_message?.content || "I couldn't form a reply.", time: nowTime() }];
          if (S.autoSpeak && refs.ttsSupported) autoSpeak(retryId);
        } else {
          throw err;
        }
      }
    } catch (err) {
      S.messages = [...S.messages, { id: Date.now() + 1, role: 'assistant', text: `Sorry, I couldn't reach the assistant service. ${err.message}`, time: nowTime(), error: true }];
    } finally {
      S.sending = false;
      refs.sending = false;
      render();
      scrollBottom();
      focusInput();
    }
  }

  /* ── session open (row click) ── */
  function openSession(sid) {
    switchSession(sid);
  }

  /* ── attachment upload ── */
  async function handleUpload(file) {
    if (!file) return;
    if (!(await ensureUser())) return;
    S.uploading = true;
    render();
    try {
      let sid = refs.sessionRef;
      if (!sid) {
        const s = await callAI(`/users/${user.id}/sessions`, { title: 'New Chat' }, 'POST');
        sid = s.id;
        setActiveSession(sid);
        refs.freshSids.add(sid);
        S.sessions = [s, ...S.sessions];
      }
      const att = await uploadFile(user, sid, file);
      S.attachments = [...S.attachments, { id: att.id, name: att.name, file_size: att.file_size, mime_type: att.mime_type }];
      S.messages = [...S.messages, { id: Date.now(), role: 'assistant', text: `📎 Uploaded **${att.name}** (${humanSize(att.file_size)}). You can now ask me about it in this chat.`, time: nowTime() }];
    } catch (err) {
      S.messages = [...S.messages, { id: Date.now(), role: 'assistant', text: `Upload failed: ${err.message}`, time: nowTime(), error: true }];
    } finally {
      S.uploading = false;
      render();
      scrollBottom();
    }
  }

  async function removeAttachment(att) {
    if (!refs.sessionRef) return;
    if (!(await ensureUser())) return;
    try { await deleteAttachment(user, refs.sessionRef, att.id); } catch { /* remove anyway */ }
    S.attachments = S.attachments.filter((a) => a.id !== att.id);
    render();
  }

  /* ── voice ── */
  function speak(msg) {
    if (!refs.ttsSupported) return;
    const synth = window.speechSynthesis;
    if (refs.speakingRef === msg.id) {
      refs.speakingRef = null;
      S.speakingId = null;
      synth.cancel();
      render();
      return;
    }
    const clean = toPlainText(msg.text);
    if (!clean) return;
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1;
    utter.pitch = 1;
    const voices = synth.getVoices();
    const v = voices.find((x) => x.lang.startsWith('en') && x.name.includes('Google')) || voices.find((x) => x.lang.startsWith('en'));
    if (v) utter.voice = v;
    refs.speakingRef = msg.id;
    S.speakingId = msg.id;
    render();
    utter.onend = () => { if (refs.speakingRef === msg.id) { refs.speakingRef = null; S.speakingId = null; render(); } };
    utter.onerror = () => { if (refs.speakingRef === msg.id) { refs.speakingRef = null; S.speakingId = null; render(); } };
    synth.cancel();
    window.setTimeout(() => { try { synth.resume(); synth.speak(utter); } catch { /* keep */ } }, 60);
  }

  function autoSpeak(id) {
    const msg = S.messages.find((m) => m.id === id);
    if (msg) speak(msg);
  }

  function toggleHumanize() {
    S.humanize = !S.humanize;
    if (S.humanize && refs.ttsSupported && !S.autoSpeak) { S.autoSpeak = true; refs.autoSpeak = true; }
    render();
    scrollBottom();
  }

  function ensureRecognition() {
    if (refs.recognition || !refs.speechSupported) return;
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
      S.input = (finalTranscript + interim).trim();
      const ta = refs.input;
      if (ta) { ta.value = S.input; autoResize(ta); }
    };
    rec.onend = () => { refs.listeningRef = false; S.listening = false; render(); finalTranscript = ''; };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      console.warn('SpeechRecognition error:', e.error);
      S.listening = false;
      S.speechError = e.error === 'network'
        ? 'Voice recognition needs internet access — type your message instead.'
        : e.error === 'not-allowed'
          ? 'Microphone permission was blocked — allow it in your browser settings.'
          : 'Voice recognition failed — type your message instead.';
      render();
    };
    refs.recognition = rec;
  }

  function stopListen() {
    if (!refs.listeningRef) return;
    try { refs.recognition?.stop(); } catch { /* noop */ }
    S.listening = false;
    refs.listeningRef = null;
    render();
  }

  function toggleListen() {
    if (!refs.speechSupported) return;
    ensureRecognition();
    const rec = refs.recognition;
    if (S.listening) { try { rec.stop(); } catch { /* noop */ } S.listening = false; refs.listeningRef = null; render(); return; }
    window.speechSynthesis?.cancel();
    refs.speakingRef = null;
    S.speakingId = null;
    S.speechError = null;
    try {
      S.input = '';
      if (refs.input) { refs.input.value = ''; }
      rec.start();
      S.listening = true;
      refs.listeningRef = true;
      render();
    } catch (err) {
      console.warn('SpeechRecognition start failed:', err);
      S.listening = false;
      refs.listeningRef = null;
      render();
    }
  }

  /* ── helpers ── */
  function scrollBottom() {
    window.setTimeout(() => {
      const box = refs.scrollBox;
      if (box) box.scrollTop = box.scrollHeight;
    }, 30);
  }

  function focusInput() {
    window.setTimeout(() => refs.input?.focus(), 60);
  }

  function autoResize(ta) {
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, S.isFullscreen ? 200 : 120)}px`;
  }

  /* ── render ── */
  function sessionRowsHTML() {
    if (S.loadingSessions && S.sessions.length === 0) {
      return `<div class="asst-skeleton-list">
        ${[0, 1, 2].map(() => `<div class="asst-skeleton-row">
          <div class="asst-skeleton-avatar"></div>
          <div class="asst-skeleton-lines"><div class="asst-skeleton-line w-70"></div><div class="asst-skeleton-line w-40"></div></div>
        </div>`).join('')}
      </div>`;
    }
    if (!S.loadingSessions && S.sessions.length === 0) {
      return `<div class="asst-empty">
        <div class="asst-empty-icon"><i class="fa-regular fa-comments"></i></div>
        <div class="asst-empty-title">No chats yet</div>
        <div class="asst-empty-sub">Start a new conversation to see it here.</div>
        <button class="asst-empty-btn" onclick="AIAgent.newChat()"><i class="fa-solid fa-plus"></i> New chat</button>
      </div>`;
    }
    return S.sessions.map((s) => {
      const isActive = s.id === S.activeSid;
      const isEditing = S.editingSid === s.id;
      const isConfirming = S.confirmDeleteSid === s.id;
      const gt = sessionDate(s.updated_at);
      return `
      <div class="asst-session-row ${isActive ? 'active' : ''} ${isEditing ? 'editing' : ''}"
           data-sid="${s.id}"
           onclick="AIAgent.openSession('${s.id}')">
        <div class="asst-session-icon"><i class="fa-solid ${isActive ? 'fa-comment-dots' : 'fa-comment'}"></i></div>
        <div class="asst-session-text">
          ${isEditing ? `
            <input id="asst-edit-input" class="asst-session-edit-input" maxlength="120" value="${escapeHtml(S.editTitle)}" placeholder="Chat title" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()" onkeydown="AIAgent.editKey(event)" onblur="AIAgent.saveEdit()" />
            <div class="asst-session-edit-hint">
              ${S.editError
                ? `<span class="asst-session-edit-error"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(S.editError)}</span>`
                : S.savingEdit
                  ? `<span><i class="fa-solid fa-spinner fa-spin"></i> Saving…</span>`
                  : `<span>Enter to save · Esc to cancel</span>`}
            </div>`
          : `
            <div class="asst-session-title">${escapeHtml(s.title || 'Untitled')}</div>
            <div class="asst-session-date">${gt}</div>`}
        </div>
        ${!isEditing && !isConfirming ? `
          <div class="asst-session-actions">
            <button class="asst-session-btn asst-session-edit" data-sid="${s.id}" title="Rename chat" onclick="event.stopPropagation(); AIAgent.edit('${s.id}', event)"><i class="fa-solid fa-pen"></i></button>
            <button class="asst-session-btn asst-session-del" data-sid="${s.id}" title="Delete chat" onclick="event.stopPropagation(); AIAgent.confirmDel('${s.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>` : ''}
        ${isConfirming && !isEditing ? `
          <div class="asst-session-confirm" onclick="event.stopPropagation()">
            <button class="asst-confirm-yes" onclick="AIAgent.deleteSession('${s.id}')"><i class="fa-solid fa-check"></i></button>
            <button class="asst-confirm-no" onclick="AIAgent.cancelDel()"><i class="fa-solid fa-xmark"></i></button>
          </div>` : ''}
      </div>`;
    }).join('');
  }

  function chatBodyHTML() {
    if (S.humanize) {
      const talking = S.sending || Boolean(S.speakingId);
      const gif = S.sending ? 'talk-ai-3.gif' : S.speakingId ? 'talk-ai-1.gif' : 'talk-ai-2.gif';
      const lastMsg = S.messages[S.messages.length - 1];
      const speakingMsg = S.speakingId ? S.messages.find((m) => m.id === S.speakingId) : null;
      const subtitle = speakingMsg ? toPlainText(speakingMsg.text) : '';
      return `
      <div class="asst-body asst-human-body">
        <div class="asst-human-frame">
          <img class="asst-human-gif ${talking ? 'talking' : ''}" src="${AI_IMG_ROOT}${gif}" alt="" draggable="false" />
          <div class="asst-human-scrim"></div>
          ${S.listening ? `
            <div class="asst-human-top" style="top:auto;bottom:18px;">
              <div class="asst-human-status"><i class="fa-solid fa-microphone"></i> Listening…</div>
            </div>` : ''}
          ${S.sending ? `
            <div class="asst-human-top">
              <div class="asst-human-status"><span class="asst-dot"></span><span class="asst-dot"></span><span class="asst-dot"></span></div>
            </div>` : ''}
          ${!S.sending && lastMsg?.error ? `
            <div class="asst-human-top">
              <div class="asst-human-status asst-human-status-error"><i class="fa-solid fa-triangle-exclamation"></i> Something went wrong</div>
            </div>` : ''}
          ${S.speakingId && subtitle ? `<div class="asst-subtitle">${escapeHtml(subtitle)}</div>` : ''}
        </div>
      </div>`;
    }

    const showWelcome = !S.sending && S.messages.length === 1 && S.messages[0]?.id === 1;
    let msgsInner;
    if (showWelcome) {
      msgsInner = `
        <div class="asst-welcome">
          ${S.showAvatar ? `<img class="asst-welcome-mascot" src="${AI_IMG_ROOT}talk-ai-2.gif" alt="" />` : ''}
          <div class="asst-welcome-title">How can I help?</div>
          <div class="asst-welcome-sub">${escapeHtml(S.messages[0].text)}</div>
        </div>`;
    } else {
      msgsInner = S.messages.map((msg) => {
        const isUser = msg.role === 'user';
        return `
        <div class="asst-row ${isUser ? 'asst-row-user' : ''}">
          ${!isUser && S.showAvatar ? `
            <div class="asst-avatar-sm"><img src="${AI_IMG_ROOT}${S.speakingId === msg.id ? 'talk-ai-1.gif' : 'talk-ai-2.gif'}" alt="" /></div>` : ''}
          <div class="asst-bubble ${isUser ? 'asst-bubble-user' : 'asst-bubble-bot'} ${msg.error ? 'asst-bubble-error' : ''}">
            ${isUser ? `<div style="white-space:pre-wrap">${escapeHtml(msg.text)}</div>` : `<div class="asst-md">${mdToHtml(msg.text)}</div>`}
            <div class="asst-meta">
              <span class="asst-time">${msg.time}</span>
              ${!isUser ? `
                <span class="asst-meta-actions">
                  ${refs.ttsSupported ? `
                    <button class="asst-meta-btn ${S.speakingId === msg.id ? 'active' : ''}" onclick="AIAgent.speak('${msg.id}', ${S.speakingId === msg.id ? 0 : 1})" title="${S.speakingId === msg.id ? 'Stop reading' : 'Read aloud'}"><i class="fa-solid ${S.speakingId === msg.id ? 'fa-stop' : 'fa-volume-high'}"></i></button>` : ''}
                  <button class="asst-meta-btn ${S.copiedId === msg.id ? 'active' : ''}" onclick="AIAgent.copy('${msg.id}')" title="${S.copiedId === msg.id ? 'Copied!' : 'Copy'}"><i class="fa-solid ${S.copiedId === msg.id ? 'fa-check' : 'fa-copy'}"></i></button>
                </span>` : ''}
            </div>
          </div>
        </div>`;
      }).join('');
    }

    if (S.sending) {
      msgsInner += `
        <div class="asst-row">
          ${S.showAvatar ? `<div class="asst-avatar-sm"><img src="${AI_IMG_ROOT}talk-ai-1.gif" alt="" /></div>` : ''}
          <div class="asst-bubble asst-bubble-bot asst-typing"><span class="asst-dot"></span><span class="asst-dot"></span><span class="asst-dot"></span></div>
        </div>`;
    }

    return `
    <div class="asst-body">
      <div class="asst-msgs" id="asst-msgs">
        <div class="asst-msgs-inner">
          ${msgsInner}
          <div id="asst-msgs-end"></div>
        </div>
      </div>
      ${!S.atBottom ? `<button class="asst-scroll-btn" onclick="AIAgent.scrollToBottom()"><i class="fa-solid fa-arrow-down"></i></button>` : ''}
    </div>`;
  }

  function composerHTML() {
    const busy = S.sending || S.uploading;
    const placeholders = busy ? 'Working…' : (S.humanize ? 'Speak or type…' : 'Type a message…');
    return `
    <div class="asst-composer">
      ${S.speechError ? `
        <div class="asst-speech-error" role="alert"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(S.speechError)}</div>` : ''}
      <div class="asst-composer-inner">
        <input type="file" id="asst-file" accept=".pdf,.docx,.txt,.md,.csv,.json,.log,.html,.xml,.yml,.yaml,.py" style="display:none" />
        <button class="asst-icon-btn" onclick="window.AIAgent.openFile()" ${busy ? 'disabled' : ''} title="Upload file (PDF, DOCX, TXT, MD, CSV…)" aria-label="Upload file">
          <i class="fa-solid ${S.uploading ? 'fa-spinner fa-spin' : 'fa-paperclip'}"></i>
        </button>
        <textarea id="asst-input" rows="1" class="asst-textarea" placeholder="${placeholders}" ${busy ? 'disabled' : ''}></textarea>
        ${refs.speechSupported ? `
          <button class="asst-icon-btn ${S.listening ? 'asst-icon-btn-rec' : ''}" onclick="window.AIAgent.toggleListen()" ${busy ? 'disabled' : ''} title="${S.listening ? 'Stop listening' : 'Speak your message'}" aria-label="${S.listening ? 'Stop listening' : 'Speak your message'}">
            <i class="fa-solid fa-microphone"></i>
          </button>` : ''}
        <button class="asst-send-btn" id="asst-send" onclick="window.AIAgent.send()" ${(busy || !S.input.trim()) ? 'disabled' : ''} aria-label="Send message">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>`;
  }

  function renderHeaderHTML() {
    const activeTitle = S.sessions.find((s) => s.id === S.activeSid)?.title || 'Assistant';
    const brandTitle = S.humanize ? 'Humanized Assistant' : activeTitle;
    const brandSub = S.humanize ? 'Voice · Avatar mode' : 'ERP Assistant';
    return `
    <header class="asst-header">
      <div class="asst-brand">
        <div class="asst-brand-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="asst-brand-text">
          <div class="asst-brand-title">${escapeHtml(brandTitle)}</div>
          <div class="asst-brand-sub"><span class="asst-status-dot"></span>${escapeHtml(brandSub)}</div>
        </div>
      </div>

      <div class="asst-header-actions">
        <button class="asst-hbtn" onclick="AIAgent.newChat()" title="New chat"><i class="fa-solid fa-plus"></i></button>
        <button class="asst-hbtn ${S.sidebarOpen ? 'asst-hbtn-active' : ''}" onclick="AIAgent.toggleSidebar()" title="${S.sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}" aria-label="${S.sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}">
          <i class="fa-solid fa-table-columns"></i>
        </button>
        <button class="asst-hbtn ${S.showMenu ? 'asst-hbtn-active' : ''}" onclick="AIAgent.toggleMenu()" title="Options" aria-label="Options">
          <i class="fa-solid ${S.showMenu ? 'fa-xmark' : 'fa-gear'}"></i>
        </button>
        <button class="asst-hbtn asst-hbtn-danger" onclick="AIAgent.close()" title="Close" aria-label="Close assistant">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      ${S.showMenu ? `
        <div class="asst-menu">
          <div class="asst-menu-heading">Preferences</div>
          <button class="asst-menu-row" onclick="AIAgent.toggleHumanize()" aria-pressed="${S.humanize}">
            <span class="asst-menu-row-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
            <span class="asst-menu-row-label">Humanize mode<span class="asst-menu-row-sub">Avatar + voice replies</span></span>
            <span class="asst-switch ${S.humanize ? 'on' : ''}"><span></span></span>
          </button>
          ${!S.humanize ? `
            <button class="asst-menu-row" onclick="AIAgent.toggleAvatar()" aria-pressed="${S.showAvatar}">
              <span class="asst-menu-row-icon"><i class="fa-solid fa-user-astronaut"></i></span>
              <span class="asst-menu-row-label">Show assistant avatar</span>
              <span class="asst-switch ${S.showAvatar ? 'on' : ''}"><span></span></span>
            </button>` : ''}
          ${refs.ttsSupported ? `
            <button class="asst-menu-row" onclick="AIAgent.toggleAutoSpeak()" aria-pressed="${S.autoSpeak}">
              <span class="asst-menu-row-icon"><i class="fa-solid ${S.autoSpeak ? 'fa-volume-high' : 'fa-volume-xmark'}"></i></span>
              <span class="asst-menu-row-label">Auto voice replies</span>
              <span class="asst-switch ${S.autoSpeak ? 'on' : ''}"><span></span></span>
            </button>` : ''}
        </div>` : ''}
    </header>`;
  }

  function render() {
    if (!root) return;
    root.innerHTML = `
      <div class="asst-window asst-embedded asst-fullscreen" role="dialog" aria-label="Assistant">
        ${renderHeaderHTML()}
        <div class="asst-fs-body">
          ${S.sidebarOpen ? `
            <aside class="asst-sidebar" aria-label="Chat history">
              <div class="asst-sidebar-head">
                <span class="asst-sidebar-title">Chats</span>
                <button class="asst-sidebar-collapse" onclick="AIAgent.toggleSidebar()" title="Collapse sidebar"><i class="fa-solid fa-angles-left"></i></button>
              </div>
              <button class="asst-sidebar-new" onclick="AIAgent.newChat()"><i class="fa-solid fa-plus"></i> New chat</button>
              <div class="asst-sidebar-list" id="asst-sidebar-list">${sessionRowsHTML()}</div>
            </aside>` : ''}
          <main class="asst-main">
            ${chatBodyHTML()}
            ${user && S.attachments.length > 0 ? `
              <div class="asst-attach-bar">
                <div class="asst-attach-inner">
                  ${S.attachments.map((att) => `
                    <span class="asst-attach-chip">
                      <i class="fa-solid fa-file-lines"></i>
                      <span class="asst-attach-name">${escapeHtml(att.name)}</span>
                      ${att.file_size != null ? `<span class="asst-attach-size">${humanSize(att.file_size)}</span>` : ''}
                      <button class="asst-attach-x" onclick="AIAgent.removeAtt('${att.id}')" title="Remove"><i class="fa-solid fa-xmark"></i></button>
                    </span>`).join('')}
                </div>
              </div>` : ''}
            ${composerHTML()}
          </main>
        </div>
      </div>`;

    // wire refs
    refs.scrollBox = document.getElementById('asst-msgs') || null;
    refs.input = document.getElementById('asst-input') || null;
    if (refs.input) {
      refs.input.value = S.input;
      refs.input.addEventListener('input', () => { S.input = refs.input.value; autoResize(refs.input); renderSendState(); });
      refs.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      });
    }
    const sendBtn = document.getElementById('asst-send');
    if (sendBtn && !sendBtn.getAttribute('data-bound')) {
      sendBtn.setAttribute('data-bound', '1');
    }
    const fileBtn = document.getElementById('asst-file');
    if (fileBtn && !fileBtn.getAttribute('data-bound')) {
      fileBtn.setAttribute('data-bound', '1');
      fileBtn.addEventListener('change', (e) => {
        if (e.target.files?.[0]) handleUpload(e.target.files[0]);
        e.target.value = '';
      });
    }
    refs.messagesEnd = document.getElementById('asst-msgs-end') || null;
  }

  function renderSendState() {
    const sendBtn = document.getElementById('asst-send');
    if (sendBtn) sendBtn.disabled = S.sending || S.uploading || !S.input.trim();
    const ta = refs.input;
    if (ta) ta.disabled = S.sending || S.uploading;
  }

  function scrollToBottom() {
    const box = refs.scrollBox;
    if (box) { box.scrollTop = box.scrollHeight; S.atBottom = true; render(); }
  }

  /* ── public actions (inline onclick) ── */
  function openFile() {
    if (!user) return;
    const el = document.getElementById('asst-file');
    if (el) el.click();
  }

  function toggleSidebar() { S.sidebarOpen = !S.sidebarOpen; S.showMenu = false; render(); scrollBottom(); }
  function toggleMenu() { S.showMenu = !S.showMenu; render(); }
  function toggleAvatar() { S.showAvatar = !S.showAvatar; render(); }
  function toggleAutoSpeak() {
    S.autoSpeak = !S.autoSpeak;
    if (!S.autoSpeak) { window.speechSynthesis?.cancel(); refs.speakingRef = null; S.speakingId = null; }
    render();
  }
  function close() {
    // In embedded mode close collapses the tab back; fall back to removing the view if standalone
    if (typeof switchTab === 'function') {
      switchTab('dashboard');
    } else {
      root.innerHTML = '';
    }
  }
  function edit(sid, ev) { ev?.stopPropagation?.(); const s = S.sessions.find((x) => x.id === sid); if (s) startEdit(s, ev); }
  function confirmDel(sid) { S.confirmDeleteSid = sid; render(); }
  function cancelDel() { S.confirmDeleteSid = null; render(); }
  function editKey(e) {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
  }
  function copy(id) {
    const msg = S.messages.find((m) => m.id == id);
    if (!msg) return;
    navigator.clipboard.writeText(msg.text).then(() => {
      S.copiedId = id;
      render();
      setTimeout(() => { if (S.copiedId === id) { S.copiedId = null; render(); } }, 1500);
    }).catch(() => {});
  }
  function speak(id) {
    const msg = S.messages.find((m) => m.id == id);
    if (msg) speak(msg);
  }
  function quick(text) {
    S.input = text;
    if (refs.input) { refs.input.value = text; autoResize(refs.input); }
    send();
  }
  function send() { if (S.input.trim() && !refs.sending) sendMessage(); }
  function removeAtt(id) {
    const att = S.attachments.find((a) => a.id === id);
    if (att) removeAttachment(att);
  }

  /* ── init ── */
  async function init(container, currentUser) {
    root = container;
    if (currentUser) user = currentUser;
    if (!user) await ensureUser();
    if (user) {
      sessionKey = `ai_session_${user.id}`;
      const stored = localStorage.getItem(sessionKey);
      if (stored) refs.sessionRef = stored;
    }
    S.isFullscreen = true;
    S.isOpen = true;
    S.sidebarOpen = true;
    render();
    focusInput();
    if (user) await loadSessions();
  }

  return {
    init,
    // data
    loadSessions,
    newChat,
    deleteSession,
    // ui actions
    toggleSidebar,
    toggleMenu,
    toggleAvatar,
    toggleAutoSpeak,
    toggleHumanize,
    toggleListen,
    close,
    openSession,
    edit,
    confirmDel,
    cancelDel,
    editKey,
    send,
    copy,
    speak,
    quick,
    openFile,
    removeAtt,
    scrollToBottom,
    saveEdit,
  };
})();

window.AIAgent = AIAgent;