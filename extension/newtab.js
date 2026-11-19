
  const $ = (s) => document.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 10);
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const key = (c, r) => c + ',' + r;
  const isInt = Number.isInteger;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---------- Icons (Lucide-style, inline so they work offline in an extension) ----------
  const I = {
    'check-square': '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    'alarm-clock': '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/>',
    'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    'folder': '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    'folder-plus': '<path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    'list-plus': '<path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9v6"/><path d="M21 12h-6"/>',
    'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
    'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'trash': '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    'flag': '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'dots': '<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>',
    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'keyboard': '<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>',
    'sliders': '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'globe': '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>',
  };
  const ic = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[n] || ''}</svg>`;
  document.querySelectorAll('[data-i]').forEach((n) => { n.innerHTML = ic(n.dataset.i, +n.dataset.s || 18); });

  // ---------- Animation helpers ----------
  const EASE = 'cubic-bezier(.2, .8, .2, 1)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anim = (node, frames, opts) => (reduceMotion || !node ? null : node.animate(frames, { easing: EASE, ...opts }));

  function snapshot(container) {
    const m = new Map();
    for (const c of container.children) {
      if (!c.dataset.id) continue;
      const r = c.getBoundingClientRect();
      if (r.width) m.set(c.dataset.id, r);
    }
    return m;
  }
  function flip(container, before, { enter = true, settleId = null, skip = null } = {}) {
    for (const c of container.children) {
      const id = c.dataset.id;
      if (!id || c === skip) continue;
      if (id === settleId) { anim(c, [{ transform: 'scale(.85)' }, { transform: 'none' }], { duration: 260 }); continue; }
      const a = before.get(id);
      if (!a) { if (enter) anim(c, [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], { duration: 220 }); continue; }
      const b = c.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) anim(c, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 260 });
    }
  }

  // ---------- Storage ----------
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(k, value) { try { localStorage.setItem(k, JSON.stringify(value)); } catch {} },
  };

  // ---------- Personal settings ----------
  const ENGINES = {
    default: ['Browser default', null],
    google: ['Google', 'https://www.google.com/search?q='],
    duckduckgo: ['DuckDuckGo', 'https://duckduckgo.com/?q='],
    bing: ['Bing', 'https://www.bing.com/search?q='],
    brave: ['Brave', 'https://search.brave.com/search?q='],
  };
  // name: [colour on dark, colour on light]
  const ACCENTS = {
    blue: ['#8ab4f8', '#1a73e8'], green: ['#81c995', '#188038'], teal: ['#78d9ec', '#007b83'],
    purple: ['#c58af9', '#8430ce'], pink: ['#ff8bcb', '#d01884'], orange: ['#fcad70', '#b85c00'],
  };
  const DEFAULT_CFG = { name: '', greeting: true, clock: '12', date: true, search: true, engine: 'default',
    font: 'hand', accent: 'blue', labels: true, numbers: true };
  function loadCfg() {
    const saved = store.get('settings', null);
    const c = { ...DEFAULT_CFG, ...(saved && typeof saved === 'object' ? saved : {}) };
    if (!ENGINES[c.engine]) c.engine = DEFAULT_CFG.engine;
    if (!ACCENTS[c.accent]) c.accent = DEFAULT_CFG.accent;
    if (!['off', '12', '24'].includes(c.clock)) c.clock = DEFAULT_CFG.clock;
    if (!['hand', 'system'].includes(c.font)) c.font = DEFAULT_CFG.font;
    c.name = String(c.name || '').slice(0, 24);
    return c;
  }
  let cfg = loadCfg();
  const saveCfg = () => store.set('settings', cfg);
  const searchUrl = (q) => ENGINES[cfg.engine][1] + encodeURIComponent(q);
  // New tab pages must use Chrome's search API when the user picked "Browser default".
  function webSearch(q) {
    if (cfg.engine === 'default') { chrome.search.query({ text: q, disposition: 'CURRENT_TAB' }); return; }
    go(searchUrl(q));
  }

  // ---------- Theme (follows system until you pick one) + accent colour ----------
  let theme = store.get('theme', null);
  if (theme !== 'light' && theme !== 'dark') theme = null;
  const sysLight = window.matchMedia('(prefers-color-scheme: light)');
  function applyTheme() {
    const t = theme || (sysLight.matches ? 'light' : 'dark');
    const root = document.documentElement, shade = t === 'light' ? 1 : 0;
    root.dataset.theme = t;
    root.style.setProperty('--accent', ACCENTS[cfg.accent][shade]);
    $('#sAccent').replaceChildren(...Object.keys(ACCENTS).map((name) => {
      const b = el('button', 'sw');
      b.type = 'button'; b.title = name[0].toUpperCase() + name.slice(1);
      b.setAttribute('aria-label', b.title + ' accent'); b.setAttribute('aria-pressed', String(cfg.accent === name));
      b.style.background = ACCENTS[name][shade];
      b.addEventListener('click', () => { cfg.accent = name; saveCfg(); applyTheme(); });
      return b;
    }));
  }
  sysLight.addEventListener?.('change', applyTheme);
  applyTheme();

  // ---------- Hero: clock, greeting, date ----------
  function tick() {
    const now = new Date(), h = now.getHours();
    const set = (sel, text) => { const n = $(sel); if (n.textContent !== text) n.textContent = text; };
    if (cfg.clock !== 'off') set('#clock', now.toLocaleTimeString(undefined, cfg.clock === '24'
      ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : { hour: 'numeric', minute: '2-digit', hour12: true }));
    if (cfg.greeting) set('#greet', (h < 5 ? 'Hello' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + (cfg.name ? ', ' + cfg.name : ''));
    if (cfg.date) set('#date', now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }));
  }
  function applySettings() {
    document.documentElement.dataset.font = cfg.font;
    document.body.classList.toggle('no-labels', !cfg.labels);
    document.body.classList.toggle('no-numbers', !cfg.numbers);
    $('#clock').hidden = cfg.clock === 'off';
    $('#greet').hidden = !cfg.greeting;
    $('#date').hidden = !cfg.date;
    $('#heroSearch').hidden = !cfg.search;
    $('#hero').hidden = cfg.clock === 'off' && !cfg.greeting && !cfg.date && !cfg.search;
    $('#heroInput').placeholder = cfg.engine === 'default' ? 'Search or type a URL' : 'Search ' + ENGINES[cfg.engine][0] + ' or type a URL';
    tick();
  }
  $('#heroSearch').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('#heroInput').value.trim();
    if (!q) return;
    const looksLikeUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(q) || /^[^\s.]+(\.[^\s.]+)*\.[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(q);
    const url = looksLikeUrl && normalizeUrl(q);
    if (url) go(url); else webSearch(q);
  });

  // ---------- Toast with Undo ----------
  let toastTimer = 0, toastUndo = null;
  function toast(msg, undo) {
    $('#toastMsg').textContent = msg;
    toastUndo = undo || null;
    $('#toastUndo').hidden = !undo;
    $('#toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('#toast').hidden = true; toastUndo = null; }, 6000);
  }
  $('#toastUndo').addEventListener('click', () => { const u = toastUndo; $('#toast').hidden = true; toastUndo = null; u && u(); });

  // ---------- Shortcut data ----------
  const DEFAULT_SHORTCUTS = [
    { name: 'GitHub', url: 'https://github.com' }, { name: 'ChatGPT', url: 'https://chatgpt.com' },
    { name: 'WhatsApp', url: 'https://web.whatsapp.com' }, { name: 'Slack', url: 'https://app.slack.com' },
  ];
  function loadData() {
    const saved = store.get('desktop', null);
    if (saved && Array.isArray(saved.shortcuts) && Array.isArray(saved.groups)) return saved;
    const home = store.get('home', null);
    if (Array.isArray(home)) return {
      shortcuts: home.filter((x) => !x.folder).map(({ id, name, url }) => ({ id, name, url })),
      groups: home.filter((x) => x.folder).map(({ id, name, items }) => ({ id, name, items })),
    };
    return { shortcuts: DEFAULT_SHORTCUTS.map((s) => ({ id: uid(), ...s })), groups: [] };
  }
  let data = loadData();
  let openGroupId = null;
  const save = () => store.set('desktop', data);
  const findGroup = (id) => data.groups.find((g) => g.id === id);

  function faviconUrl(url) {
    return chrome.runtime.getURL('/_favicon/?pageUrl=' + encodeURIComponent(url) + '&size=32');
  }
  // http(s) can be navigated to directly; chrome:// and file:// cannot from an extension page,
  // so hand those to the tabs API instead.
  function go(url) {
    if (/^https?:\/\//i.test(url)) { location.href = url; return; }
    chrome.tabs.update({ url });
  }
  function normalizeUrl(u) {
    u = u.trim();
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) u = 'https://' + u;
    try { return ['http:', 'https:', 'chrome:', 'file:'].includes(new URL(u).protocol) ? u : null; } catch { return null; }
  }
  function nameFromUrl(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } }
  function letterIcon(name) { const s = el('span', 'letter'); s.textContent = (name || '?').trim().charAt(0).toUpperCase(); return s; }

  // ---------- Box grid geometry ----------
  const CELL = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell'), 10) || 112;
  const desk = $('#desk'), deskTiles = $('#deskTiles'), gridlines = $('#gridlines'), cellHl = $('#cellHl');
  const dock = $('#dock'), fab = $('#fab'), overlay = $('#overlay'), cardGrid = $('#cardGrid'), hero = $('#hero');
  let cols = 1, rows = 1, offX = 0, offY = 0;
  let blocked = new Set(), occupied = new Map(), shown = new Map();

  function layout() {
    const W = window.innerWidth, H = Math.max(CELL, window.innerHeight - dock.offsetHeight);
    desk.style.height = H + 'px';
    cols = Math.max(1, Math.floor((W - 32) / CELL));
    rows = Math.max(1, Math.floor((H - 32) / CELL));
    offX = Math.floor((W - cols * CELL) / 2);
    offY = Math.floor((H - rows * CELL) / 2);
    Object.assign(gridlines.style, { left: offX + 'px', top: offY + 'px', width: cols * CELL + 'px', height: rows * CELL + 'px' });
    blocked = new Set();
    // Cells under the pills, the action bar and the clock/search block can't hold shortcuts.
    const covers = [$('#topRight'), fab, hero].map((n) => n.getBoundingClientRect()).filter((r) => r.width && r.height);
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const x = offX + col * CELL, y = offY + row * CELL;
      if (covers.some((r) => x < r.right + 4 && x + CELL > r.left - 4 && y < r.bottom + 4 && y + CELL > r.top - 4)) blocked.add(key(col, row));
    }
  }
  const isFree = (c, r) => !blocked.has(key(c, r)) && !occupied.has(key(c, r));
  function nearestFree(c0, r0) {
    let best = null, bestD = Infinity;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!isFree(c, r)) continue;
      const d = (c - c0) ** 2 + 2 * (r - r0) ** 2;
      if (d < bestD) { bestD = d; best = { col: c, row: r }; }
    }
    return best;
  }
  function cellAt(x, y) {
    const col = Math.floor((x - offX) / CELL), row = Math.floor((y - offY) / CELL);
    if (col < 0 || row < 0 || col >= cols || row >= rows || blocked.has(key(col, row))) return null;
    return { col, row };
  }
  function place() {
    occupied = new Map(); shown = new Map();
    const put = (s, c, r) => { occupied.set(key(c, r), s); shown.set(s.id, { col: c, row: r }); };
    const later = [];
    for (const s of data.shortcuts) {
      if (isInt(s.col) && isInt(s.row) && s.col < cols && s.row < rows && isFree(s.col, s.row)) put(s, s.col, s.row); else later.push(s);
    }
    const fresh = later.filter((s) => !isInt(s.col));
    // New shortcuts start in the middle of the free space (below the clock/search block if it is on).
    const freeRows = []; for (let r = 0; r < rows; r++) { let n = 0; for (let c = 0; c < cols; c++) if (!blocked.has(key(c, r))) n++; if (n > cols / 2) freeRows.push(r); }
    const cc = Math.floor((cols - 1) / 2), cr = freeRows.length ? freeRows[Math.floor((freeRows.length - 1) / 2)] : Math.floor((rows - 1) / 2);
    let changed = false;
    for (const s of later) {
      const isNew = !isInt(s.col);
      const want = isNew ? { col: cc - Math.floor((fresh.length - 1) / 2) + fresh.indexOf(s), row: cr } : { col: Math.min(s.col, cols - 1), row: Math.min(s.row, rows - 1) };
      const p = nearestFree(want.col, want.row);
      if (!p) continue;
      put(s, p.col, p.row);
      if (isNew) { s.col = p.col; s.row = p.row; changed = true; }
    }
    if (changed) save();
  }
  // Reading order (row, then column) – used for the 1-9 keys and the little numbers on tiles.
  const keyOrder = () => data.shortcuts.filter((s) => shown.has(s.id)).sort((a, b) => {
    const A = shown.get(a.id), B = shown.get(b.id); return A.row - B.row || A.col - B.col;
  });

  // ---------- Rendering ----------
  let firstRender = true;
  function render(settleId = null) {
    const before = { desk: snapshot(deskTiles), dock: snapshot(dock), card: snapshot(cardGrid) };
    renderDock(); layout(); place(); renderDesk();
    if (openGroupId) renderCard();
    if (firstRender) {
      firstRender = false;
      [...deskTiles.children, ...dock.children].forEach((t, i) => anim(t, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: Math.min(i * 25, 300), fill: 'backwards' }));
      return;
    }
    flip(deskTiles, before.desk, { settleId });
    flip(dock, before.dock, { settleId });
    if (openGroupId) flip(cardGrid, before.card, { settleId });
  }
  function renderDesk() {
    const order = keyOrder().map((s) => s.id);
    deskTiles.replaceChildren(...data.shortcuts.filter((s) => shown.has(s.id)).map((s) => {
      const t = buildTile(s, data.shortcuts, 'desk');
      const p = shown.get(s.id), n = order.indexOf(s.id);
      if (n < 9) t.dataset.n = n + 1;
      t.style.left = offX + p.col * CELL + 'px';
      t.style.top = offY + p.row * CELL + 'px';
      return t;
    }));
  }
  function renderDock() { dock.replaceChildren(...data.groups.map(buildGroupTile)); }
  function renderCard() {
    const g = findGroup(openGroupId);
    if (!g) return closeCard();
    if (document.activeElement !== $('#cardName')) $('#cardName').value = g.name;
    const add = el('button', 'tile add-tile');
    add.innerHTML = '<div class="icon">' + ic('plus', 22) + '</div><span class="label">Add shortcut</span>';
    add.addEventListener('click', () => openEditor(g.items, -1));
    cardGrid.replaceChildren(...g.items.map((s) => buildTile(s, g.items, 'card')), add);
  }
  function buildTile(s, list, kind) {
    const a = el('a', 'tile');
    a.href = s.url; a.title = s.name + '\n' + s.url; a.draggable = true; a.dataset.id = s.id;
    const icon = el('div', 'icon'), img = el('img');
    img.alt = ''; img.draggable = false; img.src = faviconUrl(s.url);
    img.onerror = () => img.replaceWith(letterIcon(s.name));
    icon.append(img);
    const label = el('span', 'label'); label.textContent = s.name;
    const more = el('button', 'more');
    more.title = 'Edit shortcut'; more.setAttribute('aria-label', 'Edit shortcut'); more.innerHTML = ic('dots', 16);
    more.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openEditor(list, list.indexOf(s)); });
    a.append(icon, label, more);
    a.addEventListener('dragstart', (e) => startDrag(e, kind, s.id, a, s.url));
    // chrome:// and file:// links are blocked inside extension pages, so route those through go().
    a.addEventListener('click', (e) => {
      if (/^https?:\/\//i.test(s.url)) return;
      e.preventDefault(); go(s.url);
    });
    return a;
  }
  function buildGroupTile(g) {
    const t = el('div', 'tile group-tile');
    t.tabIndex = 0; t.setAttribute('role', 'button'); t.title = g.name || 'Untitled'; t.dataset.id = g.id;
    const icon = el('div', 'icon' + (g.items.length ? ' mini' : ''));
    if (g.items.length) g.items.slice(0, 4).forEach((s) => {
      const img = el('img'); img.alt = ''; img.draggable = false; img.src = faviconUrl(s.url);
      img.onerror = () => { img.style.visibility = 'hidden'; }; icon.append(img);
    }); else icon.innerHTML = ic('folder', 22);
    const label = el('span', 'label'); label.textContent = g.name || 'Untitled';
    t.append(icon, label);
    t.addEventListener('click', () => { if (!groupDragJustEnded) openCard(g.id); });
    t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(g.id); } });
    enableGroupReorder(t);
    return t;
  }

  let groupDragJustEnded = false;
  const dockLeft = (node) => dock.getBoundingClientRect().left + node.offsetLeft;
  function enableGroupReorder(t) {
    t.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const startX = e.clientX, startY = e.clientY;
      let active = false, grabDX = 0;
      const onMove = (ev) => {
        if (!active) {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 5) return;
          active = true; grabDX = startX - dockLeft(t);
          t.classList.add('lifting'); dock.classList.add('reordering');
        }
        const x = ev.clientX;
        const ref = [...dock.children].find((o) => o !== t && x < dockLeft(o) + o.offsetWidth / 2) || null;
        if (t.nextSibling !== ref) { const before = snapshot(dock); dock.insertBefore(t, ref); flip(dock, before, { enter: false, skip: t }); }
        const r = dock.getBoundingClientRect();
        const left = clamp(x - grabDX, r.left + 8, r.right - t.offsetWidth - 8);
        t.style.transform = `translateX(${left - dockLeft(t)}px)`;
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (!active) return;
        groupDragJustEnded = true; setTimeout(() => { groupDragJustEnded = false; }, 0);
        dock.classList.remove('reordering'); commitDockOrder(); save(); render();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    });
  }

  // ---------- Group popup ----------
  let lastFocus = null;
  function openCard(id) {
    lastFocus = document.activeElement; openGroupId = id; renderCard();
    overlay.getAnimations().forEach((a) => a.cancel());
    overlay.style.pointerEvents = ''; overlay.hidden = false;
  }
  function closeCard() {
    openGroupId = null; render();
    if (lastFocus && lastFocus.isConnected) lastFocus.focus?.();
    const out = anim(overlay, [{ opacity: 1 }, { opacity: 0 }], { duration: 140 });
    anim(overlay.firstElementChild, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 140 });
    if (!out) { overlay.hidden = true; return; }
    overlay.style.pointerEvents = 'none';
    out.finished.then(() => { if (!openGroupId) overlay.hidden = true; overlay.style.pointerEvents = ''; }).catch(() => {});
  }
  $('#cardClose').addEventListener('click', closeCard);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCard(); });
  $('#cardName').addEventListener('input', () => { const g = findGroup(openGroupId); if (!g) return; g.name = $('#cardName').value.trim(); save(); });
  $('#cardName').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#cardName').blur(); });
  $('#removeGroup').addEventListener('click', () => {
    const snap = JSON.stringify(data);
    const i = data.groups.findIndex((g) => g.id === openGroupId);
    if (i < 0) return closeCard();
    const [g] = data.groups.splice(i, 1);
    data.shortcuts.push(...g.items.map(({ id, name, url }) => ({ id, name, url })));
    save(); closeCard();
    toast('Group removed', () => { data = JSON.parse(snap); save(); render(); });
  });
  function newGroup() {
    const g = { id: uid(), name: 'New group', items: [] };
    data.groups.push(g); save(); render(); openCard(g.id);
    $('#cardName').focus(); $('#cardName').select();
  }

  // ---------- Drag & drop ----------
  let drag = null, target = null, targetEl = null;
  function startDrag(e, kind, id, node, text) {
    drag = { kind, id, el: node };
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.clearData(); e.dataTransfer.setData('text/plain', text);
    document.body.classList.add('is-dragging', 'dragging-shortcut');
    requestAnimationFrame(() => node.classList.add('dragging'));
  }
  function setTarget(t, groupEl) {
    target = t;
    if (targetEl !== groupEl) {
      if (targetEl) targetEl.classList.remove('drop-target');
      targetEl = groupEl || null;
      if (targetEl) targetEl.classList.add('drop-target');
    }
    if (t && t.type === 'cell') { cellHl.style.left = offX + t.col * CELL + 'px'; cellHl.style.top = offY + t.row * CELL + 'px'; cellHl.hidden = false; }
    else cellHl.hidden = true;
  }
  function liveReorder(container, e, selector, skip) {
    const move = (ref) => { const before = snapshot(container); container.insertBefore(drag.el, ref); flip(container, before, { enter: false }); };
    const over = e.target.closest(selector);
    if (!over || over === drag.el || !container.contains(over)) {
      if (skip && e.target.closest('.add-tile') && drag.el.nextSibling !== skip) move(skip);
      return;
    }
    const p = over.offsetParent;
    const left = (p ? p.getBoundingClientRect().left + p.clientLeft : 0) + over.offsetLeft;
    const ref = e.clientX < left + over.offsetWidth / 2 ? over : over.nextSibling;
    if (ref !== drag.el && drag.el.nextSibling !== ref) move(ref);
  }
  document.addEventListener('dragover', (e) => {
    if (!drag) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    if (!overlay.hidden) {
      if (drag.kind !== 'card') return;
      if (e.target.closest('.card')) { liveReorder(cardGrid, e, '.tile[data-id]', cardGrid.lastElementChild); return; }
      overlay.hidden = true;
    }
    const groupEl = e.target.closest('.group-tile');
    if (groupEl) { setTarget({ type: 'group', id: groupEl.dataset.id }, groupEl); return; }
    const c = cellAt(e.clientX, e.clientY);
    setTarget(c && e.clientY < desk.offsetHeight ? { type: 'cell', ...c } : null);
  });
  document.addEventListener('drop', (e) => { if (drag) e.preventDefault(); });
  document.addEventListener('dragend', (e) => {
    if (!drag) return;
    const d = drag, t = target;
    const cancelled = e.dataTransfer.dropEffect === 'none';
    const cardVisible = !overlay.hidden;
    drag = null; setTarget(null);
    document.body.classList.remove('is-dragging', 'dragging-shortcut');
    if (!cancelled) { if (d.kind === 'card' && cardVisible) commitCardOrder(); else if (t) dropShortcut(d, t); save(); }
    if (!cardVisible) openGroupId = null;
    render(cancelled ? null : d.id);
  });
  function commitDockOrder() { const byId = new Map(data.groups.map((g) => [g.id, g])); data.groups = [...dock.children].map((t) => byId.get(t.dataset.id)).filter(Boolean); }
  function commitCardOrder() {
    const g = findGroup(openGroupId); if (!g) return;
    const byId = new Map(g.items.map((s) => [s.id, s]));
    g.items = [...cardGrid.children].filter((t) => t.dataset.id).map((t) => byId.get(t.dataset.id));
  }
  function dropShortcut(d, t) {
    const fromGroup = d.kind === 'card' ? findGroup(openGroupId) : null;
    const list = fromGroup ? fromGroup.items : data.shortcuts;
    const idx = list.findIndex((s) => s.id === d.id);
    if (idx < 0) return;
    const item = list[idx], plain = { id: item.id, name: item.name, url: item.url };
    if (t.type === 'group') {
      if (fromGroup && fromGroup.id === t.id) return;
      const g = findGroup(t.id); if (!g) return;
      list.splice(idx, 1); g.items.push(plain); return;
    }
    const occupant = occupied.get(key(t.col, t.row));
    if (!fromGroup) {
      if (occupant && occupant !== item) { const from = shown.get(item.id); occupant.col = from.col; occupant.row = from.row; }
      item.col = t.col; item.row = t.row;
    } else {
      list.splice(idx, 1);
      const p = occupant ? nearestFree(t.col, t.row) : t;
      data.shortcuts.push(p ? { ...plain, col: p.col, row: p.row } : plain);
    }
  }

  // ---------- Floating action bar ----------
  let fabPos = store.get('fabPos', null), fabSuppressClick = false;
  function applyFab() {
    if (!fabPos) return;
    const w = fab.offsetWidth, h = fab.offsetHeight;
    fab.style.right = clamp(fabPos.right, 8, window.innerWidth - w - 8) + 'px';
    fab.style.bottom = clamp(fabPos.bottom, 8, window.innerHeight - h - 8) + 'px';
  }
  fab.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY }, r = fab.getBoundingClientRect();
    let moved = false;
    const onMove = (ev) => {
      const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      if (!moved) { moved = true; fab.classList.add('moving'); }
      const left = clamp(r.left + dx, 8, window.innerWidth - r.width - 8), top = clamp(r.top + dy, 8, window.innerHeight - r.height - 8);
      fabPos = { right: window.innerWidth - left - r.width, bottom: window.innerHeight - top - r.height };
      applyFab();
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
      if (!moved) return;
      fab.classList.remove('moving'); fabSuppressClick = true; store.set('fabPos', fabPos); render();
    };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
  });
  fab.addEventListener('click', (e) => { if (fabSuppressClick) { fabSuppressClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
  fab.addEventListener('pointerdown', () => { fabSuppressClick = false; }, true);

  // ---------- Shortcut editor ----------
  let editing = { list: data.shortcuts, index: -1 };
  function openEditor(list, index) {
    editing = { list, index };
    const item = index >= 0 ? list[index] : null;
    $('#editorTitle').textContent = item ? 'Edit shortcut' : 'Add shortcut';
    $('#fName').value = item ? item.name : ''; $('#fUrl').value = item ? item.url : '';
    $('#fUrl').setCustomValidity('');
    $('#fRemove').style.display = item ? '' : 'none';
    $('#editor').showModal(); $('#fName').focus();
  }
  $('#fUrl').addEventListener('input', () => $('#fUrl').setCustomValidity(''));
  $('#editorForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = normalizeUrl($('#fUrl').value);
    if (!url) { $('#fUrl').setCustomValidity('Enter a valid web address'); $('#fUrl').reportValidity(); return; }
    const name = $('#fName').value.trim() || nameFromUrl(url);
    const { list, index } = editing;
    if (index >= 0) Object.assign(list[index], { name, url }); else list.push({ id: uid(), name, url });
    save(); render(); $('#editor').close();
  });
  $('#fRemove').addEventListener('click', () => {
    const snap = JSON.stringify(data);
    editing.list.splice(editing.index, 1);
    save(); render(); $('#editor').close();
    toast('Shortcut removed', () => { data = JSON.parse(snap); save(); render(); });
  });
  $('#fCancel').addEventListener('click', () => $('#editor').close());
  for (const d of document.querySelectorAll('dialog')) {
    d.addEventListener('mousedown', (e) => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
  }

  // ---------- Tasks + Deadlines data ----------
  // task: { id, text, priority, createdAt, completedAt }   deadline: { id, text, due, repeat, createdAt, completedAt }
  const loadTodos = () => store.get('todos', []).map((t) => ({
    id: t.id || uid(), text: t.text, priority: !!t.priority, createdAt: t.createdAt || Date.now(),
    completedAt: t.completedAt !== undefined ? t.completedAt : (t.done ? Date.now() : null),
  }));
  const loadDeadlines = () => store.get('deadlines', []).filter((d) => d && d.text && Number.isFinite(d.due))
    .map((d) => ({ id: d.id || uid(), text: d.text, due: d.due, repeat: d.repeat || 'none', createdAt: d.createdAt || Date.now(), completedAt: d.completedAt || null }));
  let todos = loadTodos(), deadlines = loadDeadlines();
  let collapsed = store.get('todoCollapsed', {});
  const isCollapsed = (id) => (id in collapsed ? collapsed[id] : id === 'missed');
  const saveAll = () => { store.set('todos', todos); store.set('deadlines', deadlines); };

  // Keep every open new tab in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === 'desktop' && !drag) { data = loadData(); render(); }
    if (e.key === 'todos' || e.key === 'deadlines') { todos = loadTodos(); deadlines = loadDeadlines(); renderLists(); }
    if (e.key === 'settings' || e.key === 'theme') {
      cfg = loadCfg(); theme = store.get('theme', null);
      applyTheme(); applySettings(); if (!drag) render();
      if ($('#settingsDialog').open) fillSettings();
    }
  });

  // ---------- Time helpers ----------
  const dayStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  function dayLabel(ts) {
    const diff = Math.round((dayStart(Date.now()) - dayStart(ts)) / 864e5);
    if (diff === 0) return 'Today'; if (diff === 1) return 'Yesterday'; if (diff === -1) return 'Tomorrow';
    const d = new Date(ts);
    if (diff > 0 && diff < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
    const opts = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString(undefined, opts);
  }
  const timeLabel = (ts) => new Date(ts).toLocaleTimeString(undefined, cfg.clock === '24'
    ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : { hour: 'numeric', minute: '2-digit' });
  const dateTime = (ts) => dayLabel(ts) + ', ' + timeLabel(ts);
  function span(ms) {
    const m = Math.floor(Math.abs(ms) / 6e4), h = Math.floor(m / 60), d = Math.floor(h / 24);
    return d ? d + 'd ' + (h % 24) + 'h' : h ? h + 'h ' + (m % 60) + 'm' : Math.max(m, 1) + 'm';
  }
  const MISSED_AFTER = 3 * 864e5;
  const dlState = (t) => {
    if (t.completedAt) return '';
    const ms = t.due - Date.now();
    return ms < -MISSED_AFTER ? ' overdue missed' : ms < 0 ? ' overdue' : ms < 864e5 ? ' soon' : '';
  };
  const dlMeta = (t) => 'Due ' + dateTime(t.due) + (t.repeat !== 'none' ? '  ·  repeats ' + t.repeat : '');
  const pad = (n) => String(n).padStart(2, '0');
  const toLocalInput = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  function advance(due, r) {
    const d = new Date(due);
    do { if (r === 'daily') d.setDate(d.getDate() + 1); else if (r === 'weekly') d.setDate(d.getDate() + 7); else d.setMonth(d.getMonth() + 1); } while (d.getTime() < Date.now());
    return d.getTime();
  }

  // Natural-language dates: "report friday 5pm", "call mom tomorrow 3pm", "send in 2 hours", "pay rent tonight"
  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  function parseWhen(input) {
    let s = ' ' + input + ' ';
    const clean = (x) => x.replace(/\s+/g, ' ').trim().replace(/\b(by|due|on|at|for)$/i, '').trim() || input;
    let m = s.match(/\sin\s+(\d+)\s*(minutes?|mins?|hours?|hrs?|days?|weeks?)\b/i);
    if (m) return { text: clean(s.replace(m[0], ' ')), due: Date.now() + (+m[1]) * { m: 6e4, h: 36e5, d: 864e5, w: 6048e5 }[m[2][0].toLowerCase()] };
    const dm = s.match(new RegExp('\\s(today|tonight|tomorrow|next week|(?:next\\s+)?(?:' + DAYS.join('|') + '))\\b', 'i'));
    const tm = s.match(/\s(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\s(?:at\s+)?(\d{1,2}):(\d{2})\b/i);
    let h = null, min = 0;
    if (tm) {
      if (tm[1]) { h = (+tm[1]) % 12 + (tm[3].toLowerCase() === 'pm' ? 12 : 0); min = +(tm[2] || 0); } else { h = +tm[4]; min = +tm[5]; }
      s = s.replace(tm[0], ' ');
    }
    if (!dm && h === null) return null;
    const d = new Date();
    if (dm) {
      const w = dm[1].toLowerCase().replace(/^next\s+/, ''); s = s.replace(dm[0], ' ');
      if (w === 'tomorrow') d.setDate(d.getDate() + 1);
      else if (w === 'week') d.setDate(d.getDate() + 7);
      else if (w === 'tonight') { if (h === null) h = 20; }
      else if (w !== 'today') d.setDate(d.getDate() + ((DAYS.indexOf(w) - d.getDay() + 7) % 7 || 7));
    }
    d.setHours(h === null ? (dm && /today/i.test(dm[1]) ? 18 : 9) : h, min, 0, 0);
    if (d.getTime() < Date.now()) {
      if (!dm) d.setDate(d.getDate() + 1);                                      // "5pm" after 5pm → tomorrow
      else if (!tm && /today|tonight/i.test(dm[1])) d.setHours(23, 59, 0, 0);   // "today" late in the day → end of today, not already overdue
    }
    return { text: clean(s), due: d.getTime() };
  }

  // ---------- Panels (Todo + Deadlines share one shell) ----------
  let panel = null;
  function setPanel(name) {
    panel = name;
    document.body.classList.toggle('panel-open', !!name);
    document.body.dataset.panel = name || '';
    $('#todoPanel').inert = name !== 'todo';
    $('#dlPanel').inert = name !== 'dl';
    store.set('panel', name);
  }
  function openPanel(name, focusSel) {
    setPanel(name);
    if (focusSel) requestAnimationFrame(() => { $(focusSel).focus(); });
  }
  const closePanel = () => { setPanel(null); if (document.activeElement) document.activeElement.blur(); };
  // Click anywhere outside an open sidebar to close it (dialogs, the action bar and the undo toast are exempt).
  document.addEventListener('pointerdown', (e) => {
    if (!panel || e.button !== 0) return;
    if (e.target.closest('.panel, dialog, .fab, .toast, .overlay')) return;
    closePanel();
  });
  $('#todoToggle').addEventListener('click', () => openPanel('todo', '#todoInput'));
  $('#dlToggle').addEventListener('click', () => openPanel('dl', '#dlInput'));
  $('#todoClose').addEventListener('click', closePanel);
  $('#dlClose').addEventListener('click', closePanel);

  // ---------- Shared item logic ----------
  function setFlag(btn, on) { btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.title = on ? 'Priority (click to unmark)' : 'Mark as priority'; }
  $('#todoFlag').innerHTML = ic('flag', 15);
  $('#todoFlag').addEventListener('click', () => setFlag($('#todoFlag'), $('#todoFlag').getAttribute('aria-pressed') !== 'true'));

  const popIn = (id) => anim(document.querySelector(`.task[data-id="${id}"]`), [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 220 });

  function addTask(text, priority) {
    const t = { id: uid(), text, priority, createdAt: Date.now(), completedAt: null };
    todos.push(t); saveAll(); renderLists(); popIn(t.id);
  }
  function addDeadline(text, due, repeat) {
    const d = { id: uid(), text, due, repeat: repeat || 'none', createdAt: Date.now(), completedAt: null };
    deadlines.push(d); saveAll(); renderLists(); popIn(d.id);
  }
  function updateTask(t, change) {
    const li = document.querySelector(`.panel .task[data-id="${t.id}"]`);
    if (li && li.dataset.busy) return;
    if (li) li.dataset.busy = '1';
    const out = anim(li, [{ opacity: 1 }, { opacity: 0 }], { duration: 140 });
    const apply = () => { change(); saveAll(); renderLists(); popIn(t.id); };
    out ? out.finished.then(apply, apply) : apply();
  }
  function removeTasks(list) {
    const prevT = [...todos], prevD = [...deadlines];
    const outs = list.map((t) => anim(document.querySelector(`.task[data-id="${t.id}"]`), [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(24px)' }], { duration: 160 }));
    const finish = () => {
      const ids = new Set(list.map((t) => t.id));
      todos = todos.filter((t) => !ids.has(t.id)); deadlines = deadlines.filter((t) => !ids.has(t.id));
      saveAll(); renderLists();
      toast(list.length === 1 ? 'Deleted' : 'Deleted ' + list.length + ' items', () => { todos = prevT; deadlines = prevD; saveAll(); renderLists(); });
    };
    outs.some(Boolean) ? Promise.allSettled(outs.filter(Boolean).map((a) => a.finished)).then(finish) : finish();
  }

  function buildTask(t, meta) {
    const isDl = t.due !== undefined;
    const li = el('li', 'task' + (isDl ? ' deadline' + dlState(t) : t.priority ? ' priority' : '') + (t.completedAt ? ' done' : ''));
    li.dataset.id = t.id;
    const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!t.completedAt;
    cb.title = t.completedAt ? 'Mark as not done' : 'Mark as done';
    cb.addEventListener('change', () => updateTask(t, () => {
      t.completedAt = cb.checked ? Date.now() : null;
      if (!isDl || t.repeat === 'none') return;
      if (cb.checked) {                                  // recurring: spawn the next one
        const next = { id: uid(), text: t.text, due: advance(t.due, t.repeat), repeat: t.repeat, createdAt: Date.now(), completedAt: null };
        t.nextId = next.id; deadlines.push(next);
      } else if (t.nextId) {                             // un-ticked again: take the spawned copy back so it isn't doubled
        deadlines = deadlines.filter((d) => d.id !== t.nextId || d.completedAt); delete t.nextId;
      }
    }));
    const main = el('div', 'task-main'), text = el('span', 'text'), m = el('span', 'meta');
    text.textContent = t.text; m.textContent = meta;
    if (isDl && !t.completedAt) { text.classList.add('link'); text.title = 'Click to edit'; text.addEventListener('click', () => openDlEditor(t)); }
    main.append(text, m); li.append(cb, main);
    if (isDl && !t.completedAt) { const c = el('span', 'chip'), ms = t.due - Date.now(); c.textContent = ms < 0 ? span(ms) + ' late' : span(ms); li.append(c); }
    const btn = (cls, icon, title, fn) => { const b = el('button', 'task-btn ' + cls); b.innerHTML = ic(icon, 15); b.title = title; b.setAttribute('aria-label', title); b.addEventListener('click', fn); li.append(b); };
    if (!isDl) btn('flag', 'flag', t.priority ? 'Remove priority' : 'Mark as priority', () => updateTask(t, () => { t.priority = !t.priority; }));
    else if (!t.completedAt) btn('snooze', 'clock', 'Snooze 1 day', () => updateTask(t, () => { t.due = Math.max(t.due, Date.now()) + 864e5; }));
    btn('del', 'trash', isDl ? 'Delete deadline' : 'Delete task', () => removeTasks([t]));
    return li;
  }
  function buildSection(id, title, items, cls) {
    const sec = el('section', 'tsec' + (cls ? ' ' + cls : '') + (isCollapsed(id) ? ' collapsed' : ''));
    const head = el('button', 'tsec-head');
    head.innerHTML = ic('chevron-down', 12);
    const name = el('span'); name.textContent = title;
    const count = el('span', 'count'); count.textContent = items.length;
    head.append(name, count);
    head.addEventListener('click', () => { collapsed[id] = !isCollapsed(id); store.set('todoCollapsed', collapsed); sec.classList.toggle('collapsed', collapsed[id]); });
    const body = el('div', 'tsec-body'), ul = el('ul');
    ul.append(...items.map(([t, meta]) => buildTask(t, meta)));
    body.append(ul); sec.append(head, body);
    return sec;
  }
  const emptyState = (html) => { const e = el('div', 'empty'); e.innerHTML = html; return e; };

  function renderTodos() {
    const active = todos.filter((t) => !t.completedAt);
    const done = todos.filter((t) => t.completedAt).sort((a, b) => b.completedAt - a.completedAt);
    const priority = active.filter((t) => t.priority).sort((a, b) => b.createdAt - a.createdAt);
    const normal = active.filter((t) => !t.priority).sort((a, b) => b.createdAt - a.createdAt);
    const sections = [];
    if (priority.length) sections.push(buildSection('priority', 'Priority', priority.map((t) => [t, 'Added ' + dateTime(t.createdAt)]), 'priority'));
    const byDay = new Map();
    for (const t of normal) { const k = dayStart(t.createdAt); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(t); }
    for (const [k, list] of byDay) sections.push(buildSection('d' + k, dayLabel(k), list.map((t) => [t, 'Added ' + timeLabel(t.createdAt)])));
    if (done.length) sections.push(buildSection('completed', 'Completed', done.map((t) => [t, 'Added ' + dateTime(t.createdAt) + '  ·  Done ' + dateTime(t.completedAt)])));
    if (!sections.length) sections.push(emptyState('No tasks yet.<br>Press <kbd>T</kbd> to add one.'));
    $('#todoBody').replaceChildren(...sections);
    $('#todoCount').textContent = active.length + (active.length === 1 ? ' task left' : ' tasks left');
    $('#todoBadge').textContent = active.length || '';
    $('#todoBadge').classList.toggle('urgent', priority.length > 0);
    $('#clearDone').style.visibility = done.length ? 'visible' : 'hidden';
  }

  function renderDeadlines() {
    const now = Date.now();
    const active = deadlines.filter((t) => !t.completedAt).sort((a, b) => a.due - b.due);
    const done = deadlines.filter((t) => t.completedAt).sort((a, b) => b.completedAt - a.completedAt);
    const over = active.filter((t) => t.due < now && now - t.due <= MISSED_AFTER);
    const missed = active.filter((t) => now - t.due > MISSED_AFTER);
    const upcoming = active.filter((t) => t.due >= now);
    const sections = [];
    if (over.length) sections.push(buildSection('over', 'Overdue', over.map((t) => [t, dlMeta(t)]), 'over'));
    if (upcoming.length) sections.push(buildSection('upcoming', 'Upcoming', upcoming.map((t) => [t, dlMeta(t)])));
    if (missed.length) sections.push(buildSection('missed', 'Missed', missed.map((t) => [t, dlMeta(t)]), 'over'));
    if (done.length) sections.push(buildSection('dcompleted', 'Completed', done.map((t) => [t, 'Due ' + dateTime(t.due) + '  ·  Done ' + dateTime(t.completedAt)])));
    if (!sections.length) sections.push(emptyState('No deadlines.<br>Press <kbd>D</kbd> and type e.g. <em>report friday 5pm</em>.'));
    $('#dlBody').replaceChildren(...sections);
    const n = over.length + upcoming.length;
    $('#dlCount').textContent = n + (n === 1 ? ' deadline left' : ' deadlines left') + (missed.length ? ' · ' + missed.length + ' missed' : '');
    $('#dlBadge').textContent = active.length || '';
    $('#dlToggle').classList.toggle('alert', over.length > 0);
    document.title = over.length ? '(' + over.length + ') New Tab' : 'New Tab';
    $('#dlClearDone').style.visibility = done.length ? 'visible' : 'hidden';
    syncToolbar(active);
  }
  // Toolbar badge: number of deadlines due today or overdue (works when opened as the extension's new tab page).
  function syncToolbar(active) {
    try {
      if (!(window.chrome && chrome.action)) return;
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const n = active.filter((t) => t.due <= end.getTime()).length;
      chrome.action.setBadgeText({ text: n ? String(n) : '' });
      chrome.action.setBadgeBackgroundColor({ color: '#f28b82' });
    } catch {}
  }
  function renderLists() { renderTodos(); renderDeadlines(); }

  // Forms
  $('#todoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('#todoInput').value.trim();
    if (!text) return;
    addTask(text, $('#todoFlag').getAttribute('aria-pressed') === 'true');
    $('#todoInput').value = ''; setFlag($('#todoFlag'), false);
  });
  $('#dlForm').addEventListener('submit', (e) => {
    e.preventDefault();
    let text = $('#dlInput').value.trim(), due = $('#dlDue').value ? new Date($('#dlDue').value).getTime() : NaN;
    if (!text) return;
    if (!Number.isFinite(due)) {                       // no date picked → try to read it from the text
      const p = parseWhen(text);
      if (p) { text = p.text; due = p.due; }
    }
    if (!Number.isFinite(due)) { $('#dlDue').focus(); $('#dlDue').showPicker?.(); toast('Pick a date, or type one (e.g. “friday 5pm”)'); return; }
    addDeadline(text, due, $('#dlRepeat').value);
    $('#dlInput').value = ''; $('#dlDue').value = ''; $('#dlRepeat').value = 'none';
    $('#dlInput').focus(); updHint();
  });
  // Live preview of the date typed into the deadline box
  function updHint() {
    const h = $('#dlHint'), v = $('#dlInput').value.trim();
    h.classList.remove('ok');
    if ($('#dlDue').value) { h.textContent = ''; return; }
    const pr = v && parseWhen(v);
    if (pr) { h.textContent = '→ “' + pr.text + '” · ' + dateTime(pr.due); h.classList.add('ok'); }
    else h.textContent = v ? 'No date found. Try “friday 5pm”, “tomorrow 9am”, “in 2 hours”.' : '';
  }
  $('#dlInput').addEventListener('input', updHint);
  $('#dlDue').addEventListener('input', updHint);
  $('#clearDone').addEventListener('click', () => removeTasks(todos.filter((t) => t.completedAt)));
  $('#dlClearDone').addEventListener('click', () => removeTasks(deadlines.filter((t) => t.completedAt)));

  // Edit deadline dialog
  let editingDl = null;
  function openDlEditor(t) {
    editingDl = t;
    $('#eText').value = t.text; $('#eDue').value = toLocalInput(t.due); $('#eRepeat').value = t.repeat;
    $('#dlDialog').showModal(); $('#eText').focus();
  }
  $('#dlEditForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const due = new Date($('#eDue').value).getTime(), text = $('#eText').value.trim();
    if (!editingDl || !text || !Number.isFinite(due)) return;
    Object.assign(editingDl, { text, due, repeat: $('#eRepeat').value });
    saveAll(); renderLists(); $('#dlDialog').close();
  });
  $('#eCancel').addEventListener('click', () => $('#dlDialog').close());

  // ---------- Search / command palette ----------
  let palItems = [], palIdx = 0;
  function paletteItems(raw) {
    raw = raw.trim();
    const q = raw.toLowerCase();
    const links = [...data.shortcuts.map((s) => ({ k: 'link', t: s.name, s: nameFromUrl(s.url), url: s.url })),
      ...data.groups.flatMap((g) => g.items.map((s) => ({ k: 'link', t: s.name, s: g.name, url: s.url })))];
    const dls = deadlines.filter((t) => !t.completedAt).sort((a, b) => a.due - b.due).map((t) => ({ k: 'dl', t: t.text, s: 'Due ' + dateTime(t.due) }));
    const tks = todos.filter((t) => !t.completedAt).map((t) => ({ k: 'task', t: t.text, s: 'Task' }));
    const all = [...links, ...dls, ...tks];
    const hits = q ? all.filter((x) => (x.t + ' ' + x.s).toLowerCase().includes(q)).slice(0, 29) : links.slice(0, 8);
    if (q) hits.push({ k: 'web', t: (cfg.engine === 'default' ? 'Search the web for “' : 'Search ' + ENGINES[cfg.engine][0] + ' for “') + raw + '”', s: '', q: raw });
    return hits;
  }
  const KIND_ICON = { link: 'link', dl: 'alarm-clock', task: 'check-square', web: 'globe' };
  function renderPalette() {
    palItems = paletteItems($('#palInput').value);
    palIdx = clamp(palIdx, 0, Math.max(0, palItems.length - 1));
    $('#palList').replaceChildren(...palItems.map((x, i) => {
      const li = el('li', i === palIdx ? 'on' : '');
      li.innerHTML = ic(KIND_ICON[x.k], 18);
      const t = el('span', 't'), s = el('span', 's'); t.textContent = x.t; s.textContent = x.s;
      li.append(t, s);
      li.addEventListener('mousemove', () => { if (palIdx !== i) { palIdx = i; renderPalette(); } });
      li.addEventListener('click', () => runPalette(x));
      return li;
    }));
    $('#palList').querySelector('.on')?.scrollIntoView({ block: 'nearest' });
  }
  function runPalette(x) {
    if (!x) return;
    $('#palette').close();
    if (x.k === 'dl') openPanel('dl'); else if (x.k === 'task') openPanel('todo'); else if (x.k === 'web') webSearch(x.q); else go(x.url);
  }
  function openPalette() { $('#palInput').value = ''; palIdx = 0; renderPalette(); $('#palette').showModal(); $('#palInput').focus(); }
  $('#palInput').addEventListener('input', () => { palIdx = 0; renderPalette(); });
  $('#palInput').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palIdx = Math.min(palIdx + 1, palItems.length - 1); renderPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palIdx = Math.max(palIdx - 1, 0); renderPalette(); }
    else if (e.key === 'Enter') { e.preventDefault(); runPalette(palItems[palIdx]); }
  });

  // ---------- Settings dialog ----------
  const SWITCHES = { sGreeting: 'greeting', sDate: 'date', sSearch: 'search', sLabels: 'labels', sNumbers: 'numbers' };
  const SELECTS = { sClock: 'clock', sEngine: 'engine', sFont: 'font' };
  $('#sEngine').replaceChildren(...Object.entries(ENGINES).map(([id, [name]]) => { const o = el('option'); o.value = id; o.textContent = name; return o; }));
  function fillSettings() {
    $('#sName').value = cfg.name;
    for (const [id, k] of Object.entries(SWITCHES)) $('#' + id).checked = !!cfg[k];
    for (const [id, k] of Object.entries(SELECTS)) $('#' + id).value = cfg[k];
    $('#sTheme').value = theme || 'system';
  }
  // Every change is saved and shown straight away; the grid is re-laid because the clock/search block may change size.
  const settingsChanged = () => { saveCfg(); applySettings(); render(); renderLists(); };
  $('#sName').addEventListener('input', () => { cfg.name = $('#sName').value.trim(); settingsChanged(); });
  for (const [id, k] of Object.entries(SWITCHES)) $('#' + id).addEventListener('change', () => { cfg[k] = $('#' + id).checked; settingsChanged(); });
  for (const [id, k] of Object.entries(SELECTS)) $('#' + id).addEventListener('change', () => { cfg[k] = $('#' + id).value; settingsChanged(); });
  $('#sTheme').addEventListener('change', () => { const v = $('#sTheme').value; theme = v === 'system' ? null : v; store.set('theme', theme); applyTheme(); });
  function openSettings() { fillSettings(); $('#settingsDialog').showModal(); $('#settingsDialog').scrollTop = 0; }
  $('#settingsClose').addEventListener('click', () => $('#settingsDialog').close());

  // ---------- Help, export, import ----------
  $('#helpClose').addEventListener('click', () => $('#helpDialog').close());
  $('#exportBtn').addEventListener('click', () => {
    const out = { version: 3, desktop: data, todos, deadlines, theme, settings: cfg, fabPos };
    const a = el('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    a.download = 'newtab-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', async () => {
    const f = $('#importFile').files[0]; $('#importFile').value = '';
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (!j.desktop || !Array.isArray(j.desktop.shortcuts) || !Array.isArray(j.desktop.groups)) throw new Error('bad file');
      store.set('desktop', j.desktop);
      store.set('todos', Array.isArray(j.todos) ? j.todos : []);
      store.set('deadlines', Array.isArray(j.deadlines) ? j.deadlines : []);
      if ('theme' in j) store.set('theme', j.theme);
      if (j.settings && typeof j.settings === 'object') store.set('settings', j.settings);
      if (j.fabPos && typeof j.fabPos === 'object') store.set('fabPos', j.fabPos);
      location.reload();
    } catch { toast('That file is not a valid backup'); }
  });

  // ---------- Keyboard shortcuts ----------
  function newShortcut() { openEditor(data.shortcuts, -1); }
  $('#fabTask').addEventListener('click', () => openPanel('todo', '#todoInput'));
  $('#fabDeadline').addEventListener('click', () => openPanel('dl', '#dlInput'));
  $('#fabShortcut').addEventListener('click', newShortcut);
  $('#fabGroup').addEventListener('click', newGroup);
  $('#fabSearch').addEventListener('click', openPalette);
  $('#fabSettings').addEventListener('click', openSettings);
  $('#fabHelp').addEventListener('click', () => $('#helpDialog').showModal());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.querySelector('dialog[open]')) return;      // the dialog closes itself first
      if (!overlay.hidden) closeCard();
      else if (panel) closePanel();
      else if (document.activeElement === $('#heroInput')) $('#heroInput').blur();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (!document.querySelector('dialog[open]')) openPalette();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (document.querySelector('dialog[open]') || !overlay.hidden) return;
    const k = e.key.toLowerCase();
    const run = {
      t: () => openPanel('todo', '#todoInput'),
      d: () => openPanel('dl', '#dlInput'),
      s: newShortcut,
      g: newGroup,
      '/': openPalette,
      ',': openSettings,
      '?': () => $('#helpDialog').showModal(),
    }[k];
    if (run) { e.preventDefault(); run(); return; }
    if (/^[1-9]$/.test(k)) {
      const s = keyOrder()[+k - 1];
      if (s) { e.preventDefault(); go(s.url); }
    }
  });

  // ---------- Init ----------
  setInterval(tick, 1000);
  setInterval(() => { if (!document.hidden && deadlines.some((t) => !t.completedAt)) renderDeadlines(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); renderLists(); } });
  let resizeQueued = false;
  window.addEventListener('resize', () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; applyFab(); if (!drag) render(); });
  });
  if (store.get('hintSeen', false)) $('#hint').hidden = true;
  else {
    const hideHint = () => { store.set('hintSeen', true); $('#hint').hidden = true; };
    document.addEventListener('keydown', hideHint, { once: true });
    setTimeout(hideHint, 15000);
  }
  applySettings();
  applyFab();
  renderLists();
  const p = store.get('panel', null);
  setPanel(p === 'todo' || p === 'dl' ? p : null);
  render();
  // The handwriting font can change text widths once it has loaded – lay the grid out once more.
  document.fonts?.ready.then(() => { if (!drag) render(); });
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('no-anim')));

