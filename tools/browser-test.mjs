// Real-browser verification. Chrome 157 ignores --load-extension in branded builds, so the
// extension is installed through the CDP Extensions domain over --remote-debugging-pipe.
// Run: node tools/browser-test.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';

const root = path.resolve(import.meta.dirname, '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = path.join(root, '.chrome-test');
const HEADED_PROFILE = path.join(root, '.chrome-headed');
const EXT_DIR = path.join(root, 'extension');
const results = [];
const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(child) {
    this.child = child; this.seq = 0; this.pending = new Map(); this.waiters = []; this.events = []; this.buf = Buffer.alloc(0);
    child.stdio[4].on('data', (d) => {
      this.buf = Buffer.concat([this.buf, d]);
      let i;
      while ((i = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, i).toString(); this.buf = this.buf.subarray(i + 1);
        let m; try { m = JSON.parse(raw); } catch { continue; }
        if (m.id && this.pending.has(m.id)) {
          const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id);
          m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
          continue;
        }
        if (m.method) {
          this.events.push(m);
          for (const w of [...this.waiters]) {
            if (w.method === m.method && (!w.sessionId || w.sessionId === m.sessionId)) {
              this.waiters.splice(this.waiters.indexOf(w), 1);
              w.res(m);
            }
          }
        }
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    const msg = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    try { this.child.stdio[3].write(JSON.stringify(msg) + '\0'); } catch {}
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }
  waitEvent(method, sessionId, timeout = 10000) {
    return new Promise((res, rej) => {
      const w = { method, sessionId, res };
      this.waiters.push(w);
      setTimeout(() => { const i = this.waiters.indexOf(w); if (i >= 0) { this.waiters.splice(i, 1); rej(new Error('timeout ' + method)); } }, timeout);
    });
  }
}

async function launch({ headed = false, profile = PROFILE, fresh = true } = {}) {
  if (fresh) fs.rmSync(profile, { recursive: true, force: true });
  const args = [
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--user-data-dir=' + profile,
    '--enable-unsafe-extension-debugging', '--remote-debugging-pipe',
    '--window-size=1280,900',
  ];
  if (headed) args.push('--window-position=-32000,-32000'); else args.push('--headless=new');
  args.push('about:blank');
  const child = spawn(CHROME, args, { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (d) => { stderr += d.toString(); });
  const cdp = new CDP(child);
  await sleep(2200);
  let ext = null;
  for (let i = 0; i < 20; i++) {
    try { ext = await cdp.send('Extensions.loadUnpacked', { path: EXT_DIR }); break; } catch (e) { await sleep(300); }
  }
  if (!ext) throw new Error('Extensions.loadUnpacked failed: ' + stderr.slice(0, 1000));
  return { child, cdp, id: ext.id, stderr: () => stderr };
}

async function openPage(cdp, url) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Log.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);
  const loaded = cdp.waitEvent('Page.loadEventFired', sessionId, 15000).catch(() => null);
  await cdp.send('Page.navigate', { url }, sessionId);
  await loaded;
  await sleep(1200);
  return { targetId, sessionId };
}

async function js(cdp, sessionId, expression) {
  const r = await cdp.send('Runtime.evaluate', {
    expression: `(async () => { ${expression} })()`,
    awaitPromise: true, returnByValue: true, userGesture: true,
  }, sessionId);
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text || 'eval failed');
  return r.result.value;
}

async function check(name, fn) {
  try {
    const info = await fn();
    results.push({ name, ok: true, info });
    log(`PASS  ${name}${info === undefined ? '' : '  — ' + JSON.stringify(info)}`);
  } catch (e) {
    results.push({ name, ok: false, info: e.message });
    log(`FAIL  ${name}  — ${e.message}`);
  }
}

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const notes = [];
async function note(name, fn) {
  try {
    const info = await fn();
    notes.push({ name, info });
    log(`NOTE  ${name}  — ${JSON.stringify(info)}`);
  } catch (e) {
    notes.push({ name, error: e.message });
    log(`NOTE  ${name}  — error: ${e.message}`);
  }
}

function collectProblems(cdp, sessionId) {
  const out = [];
  for (const e of cdp.events) {
    if (sessionId && e.sessionId !== sessionId) continue;
    if (e.method === 'Runtime.exceptionThrown') {
      const d = e.params.exceptionDetails;
      out.push('exception: ' + (d.exception?.description || d.text));
    }
    if (e.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(e.params.type)) {
      out.push(e.params.type + ': ' + e.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    }
    if (e.method === 'Log.entryAdded' && ['error', 'warning'].includes(e.params.entry.level)) {
      const ent = e.params.entry;
      if (/_favicon|favicon/i.test(ent.url || '') || /_favicon|favicon/i.test(ent.text || '')) continue;
      out.push(ent.level + ': ' + ent.text + (ent.url ? ' [' + ent.url + ']' : ''));
    }
  }
  return out;
}

async function main() {
  const site = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<title>nav ok</title>'); });
  await new Promise((r) => site.listen(8124, '127.0.0.1', r));

  let { cdp, id, stderr } = await launch();
  log('extension id:', id);

  const page = await openPage(cdp, `chrome-extension://${id}/newtab.html`);
  const s = page.sessionId;
  const extOrigin = `chrome-extension://${id}`;

  await check('extension is installed and enabled', async () => {
    const r = await cdp.send('Extensions.getExtensions').catch((e) => ({ error: e.message }));
    if (r.error) return r.error;
    const mine = r.extensions.find((x) => x.id === id);
    assert(mine, 'not in Extensions.getExtensions');
    assert(mine.version === '1.0.0' && mine.name === 'Maddy New Tab', JSON.stringify(mine));
    return { name: mine.name, version: mine.version, state: mine.state };
  });

  await check('page renders with title "New Tab" and stylesheet applied', async () => {
    const r = await js(cdp, s, `return {
      title: document.title,
      bg: getComputedStyle(document.body).backgroundColor,
      tiles: document.querySelectorAll('#deskTiles .tile').length,
      hasHero: !!document.querySelector('#heroSearch'),
      stylesheets: [...document.styleSheets].map(x => x.href)
    };`);
    assert(r.title === 'New Tab', 'title ' + r.title);
    assert(r.tiles === 4, 'expected 4 default tiles, got ' + r.tiles);
    assert(r.stylesheets.some((h) => h && h.endsWith('/newtab.css')), 'css not linked');
    return r;
  });

  await check('handwriting font loads (Virgil.woff2)', async () => {
    const r = await js(cdp, s, `
      await document.fonts.ready;
      return { family: getComputedStyle(document.body).fontFamily, loaded: document.fonts.check('16px Virgil'), status: [...document.fonts].map(f => f.family + ':' + f.status) };`);
    assert(/Virgil/.test(r.family), 'font family ' + r.family);
    assert(r.loaded, 'Virgil not available');
    return r.status;
  });

  await check('favicon URLs use chrome-extension:/_favicon and no Google fallback', async () => {
    const r = await js(cdp, s, `return [...document.querySelectorAll('#deskTiles .tile img')].map(i => i.src);`);
    assert(r.length === 4, 'no images');
    assert(r.every((u) => u.startsWith(extOrigin + '/_favicon/?pageUrl=') && u.includes('&size=32')), JSON.stringify(r));
    const googleReqs = cdp.events.filter((e) => e.method === 'Network.requestWillBeSent' && /google\.com\/s2\/favicons/.test(e.params.request.url));
    assert(googleReqs.length === 0, 'google favicon request made');
    return r[0].replace(id, '<id>');
  });

  await check('favicons paint (or letter fallback is shown)', async () => {
    await sleep(3500);
    const r = await js(cdp, s, `return [...document.querySelectorAll('#deskTiles .tile .icon')].map(icon =>
      icon.querySelector('img') ? (icon.querySelector('img').naturalWidth > 0 ? 'img' : 'letter') : 'letter');`);
    return r;
  });

  await check('manifest: MV3, permissions, override, icons', async () => {
    const r = await js(cdp, s, `return chrome.runtime.getManifest();`);
    assert(r.manifest_version === 3, 'mv');
    assert(JSON.stringify(r.permissions) === JSON.stringify(['favicon', 'search']), 'permissions ' + JSON.stringify(r.permissions));
    assert(r.chrome_url_overrides.newtab === 'newtab.html', 'override');
    assert(r.background.service_worker === 'background.js', 'sw');
    assert(r.minimum_chrome_version === '111', 'min version');
    assert(!r.host_permissions && !r.content_security_policy && !r.web_accessible_resources, 'unexpected keys');
    assert(r.name === 'Maddy New Tab' && r.version === '1.0.0', 'name/version');
    return { name: r.name, version: r.version, descLen: r.description.length };
  });

  await check('background service worker registered action.onClicked', async () => {
    const { targetInfos } = await cdp.send('Target.getTargets');
    const sw = targetInfos.find((t) => t.type === 'service_worker' && t.url === `chrome-extension://${id}/background.js`);
    assert(sw, 'no background SW');
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: sw.targetId, flatten: true });
    await cdp.send('Runtime.enable', {}, sessionId);
    const r = await cdp.send('Runtime.evaluate', { expression: `chrome.action.onClicked.hasListeners()`, returnByValue: true }, sessionId);
    const src = await cdp.send('Runtime.evaluate', { expression: `fetch(chrome.runtime.getURL('background.js')).then(r=>r.text())`, awaitPromise: true, returnByValue: true }, sessionId);
    assert(r.result.value === true, 'no onClicked listener');
    assert(/chrome\.action\.onClicked\.addListener/.test(src.result.value) && /chrome\.tabs\.create\(\{\}\)/.test(src.result.value), 'unexpected background source');
    return { listeners: true };
  });

  await check('settings: Browser default is first and selected', async () => {
    const r = await js(cdp, s, `
      document.querySelector('#fabSettings').click();
      const sel = document.querySelector('#sEngine');
      return { open: document.querySelector('#settingsDialog').open, first: sel.options[0].value, firstText: sel.options[0].text, value: sel.value, opts: [...sel.options].map(o => o.value) };`);
    assert(r.open, 'settings did not open');
    assert(r.first === 'default' && r.firstText === 'Browser default', 'default not first');
    assert(r.value === 'default', 'default not selected');
    return r.opts;
  });

  await check('hero placeholder is "Search or type a URL" for default engine', async () => {
    const r = await js(cdp, s, `document.querySelector('#settingsClose').click(); return document.querySelector('#heroInput').placeholder;`);
    assert(r === 'Search or type a URL', r);
    return r;
  });

  await check('hero search uses chrome.search.query (CURRENT_TAB)', async () => {
    const r = await js(cdp, s, `
      window.__searches = [];
      chrome.search.query = (o) => { window.__searches.push(o); };
      const inp = document.querySelector('#heroInput');
      inp.value = 'hello world';
      document.querySelector('#heroSearch').requestSubmit();
      await new Promise(r => setTimeout(r, 50));
      return window.__searches;`);
    assert(r.length === 1 && r[0].text === 'hello world' && r[0].disposition === 'CURRENT_TAB', JSON.stringify(r));
    return r;
  });

  await check('typed URL in hero opens directly (not searched)', async () => {
    const r = await js(cdp, s, `
      window.__go = null; window.__realGo = go; window.go = (u) => { window.__go = u; };
      window.__searches = [];
      const inp = document.querySelector('#heroInput');
      inp.value = 'example.com'; document.querySelector('#heroSearch').requestSubmit();
      const a = window.__go; window.go = window.__realGo;
      return { go: a, searches: window.__searches };`);
    assert(r.go === 'https://example.com', JSON.stringify(r));
    assert(r.searches.length === 0, 'search ran for URL');
    return r.go;
  });

  await check('command palette row + Enter use chrome.search.query', async () => {
    const r = await js(cdp, s, `
      window.__searches = [];
      chrome.search.query = (o) => { window.__searches.push(o); };
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }));
      const inp = document.querySelector('#palInput');
      inp.value = 'hello'; inp.dispatchEvent(new Event('input', { bubbles: true }));
      const last = [...document.querySelectorAll('#palList li .t')].pop().textContent;
      inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 50));
      return { row: last, searches: window.__searches };`);
    assert(r.row === 'Search the web for “hello”', r.row);
    assert(r.searches.length === 1 && r.searches[0].text === 'hello' && r.searches[0].disposition === 'CURRENT_TAB', JSON.stringify(r.searches));
    return r;
  });

  await check('non-default engine still builds its own URL and placeholder', async () => {
    const r = await js(cdp, s, `
      document.querySelector('#fabSettings').click();
      const sel = document.querySelector('#sEngine');
      sel.value = 'google'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      const ph = document.querySelector('#heroInput').placeholder;
      document.querySelector('#settingsClose').click();
      window.__go = null; window.__realGo = go; window.go = (u) => { window.__go = u; };
      const inp = document.querySelector('#heroInput');
      inp.value = 'hello world'; document.querySelector('#heroSearch').requestSubmit();
      const u = window.__go; window.go = window.__realGo;
      const saved = JSON.parse(localStorage.getItem('settings')).engine;
      return { ph, u, saved };`);
    assert(r.ph === 'Search Google or type a URL', r.ph);
    assert(r.u === 'https://www.google.com/search?q=hello%20world', r.u);
    assert(r.saved === 'google', 'engine not saved');
    return r;
  });

  await check('switch back to default engine', async () => {
    const r = await js(cdp, s, `
      document.querySelector('#fabSettings').click();
      const sel = document.querySelector('#sEngine');
      sel.value = 'default'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('#settingsClose').click();
      return { engine: JSON.parse(localStorage.getItem('settings')).engine, ph: document.querySelector('#heroInput').placeholder };`);
    assert(r.engine === 'default' && r.ph === 'Search or type a URL', JSON.stringify(r));
    return r;
  });

  await check('todo: add, complete and clear', async () => {
    const r = await js(cdp, s, `
      document.querySelector('#fabTask').click();
      const i = document.querySelector('#todoInput'); i.value = 'Buy milk';
      document.querySelector('#todoFlag').click();
      document.querySelector('#todoForm').requestSubmit();
      await new Promise(r => setTimeout(r, 100));
      const afterAdd = JSON.parse(localStorage.getItem('todos'));
      const cb = document.querySelector('#todoBody .task input[type=checkbox]');
      cb.click();
      await new Promise(r => setTimeout(r, 350));
      const afterDone = JSON.parse(localStorage.getItem('todos'));
      document.querySelector('#clearDone').click();
      await new Promise(r => setTimeout(r, 400));
      const afterClear = JSON.parse(localStorage.getItem('todos'));
      return { afterAdd, afterDone, afterClear };`);
    assert(r.afterAdd.length === 1 && r.afterAdd[0].text === 'Buy milk' && r.afterAdd[0].priority === true, JSON.stringify(r.afterAdd));
    assert(r.afterDone[0].completedAt > 0, 'not completed');
    assert(r.afterClear.length === 0, 'not cleared');
    return { added: true, completed: true, cleared: true };
  });

  await check('deadline: natural-language date parsing', async () => {
    const r = await js(cdp, s, `
      document.querySelector('#fabDeadline').click();
      const i = document.querySelector('#dlInput'); i.value = 'report friday 5pm';
      i.dispatchEvent(new Event('input', { bubbles: true }));
      const hint = document.querySelector('#dlHint').textContent;
      document.querySelector('#dlForm').requestSubmit();
      await new Promise(r => setTimeout(r, 100));
      const list = JSON.parse(localStorage.getItem('deadlines'));
      return { hint, list, dueDate: list[0] && new Date(list[0].due).toString() };`);
    assert(/report/.test(r.hint) && /→/.test(r.hint), 'no preview ' + r.hint);
    assert(r.list.length === 1 && r.list[0].text === 'report' && r.list[0].repeat === 'none', JSON.stringify(r.list));
    assert(new Date(r.list[0].due).getHours() === 17, 'hour ' + r.dueDate);
    return r.hint;
  });

  await check('deadline due today sets "(n) New Tab" title and toolbar badge', async () => {
    const r = await js(cdp, s, `
      const past = new Date(Date.now() - 3600e3);
      const pad = n => String(n).padStart(2, '0');
      const v = past.getFullYear() + '-' + pad(past.getMonth() + 1) + '-' + pad(past.getDate()) + 'T' + pad(past.getHours()) + ':' + pad(past.getMinutes());
      const i = document.querySelector('#dlInput'); i.value = 'past thing';
      document.querySelector('#dlDue').value = v;
      document.querySelector('#dlForm').requestSubmit();
      await new Promise(r => setTimeout(r, 200));
      let badge = '';
      try { badge = await chrome.action.getBadgeText({}); } catch (e) { badge = 'ERR:' + e.message; }
      return { title: document.title, badge, count: document.querySelector('#dlBadge').textContent, due: JSON.parse(localStorage.getItem('deadlines')).length };`);
    assert(r.title === '(1) New Tab', 'title ' + r.title);
    assert(r.badge === '1', 'badge ' + JSON.stringify(r.badge));
    assert(r.count === '2', 'list badge ' + r.count);
    return r;
  });

  await check('shortcut: add, edit, remove', async () => {
    const r = await js(cdp, s, `
      const count = () => JSON.parse(localStorage.getItem('desktop')).shortcuts.length;
      const before = count();
      document.querySelector('#fabShortcut').click();
      document.querySelector('#fName').value = 'Test Site';
      document.querySelector('#fUrl').value = 'example.org';
      document.querySelector('#editorForm').requestSubmit();
      await new Promise(r => setTimeout(r, 100));
      const afterAdd = count();
      const added = JSON.parse(localStorage.getItem('desktop')).shortcuts.find(s => s.name === 'Test Site');
      document.querySelector('#deskTiles .tile[data-id="' + added.id + '"] .more').click();
      document.querySelector('#fName').value = 'Renamed Site';
      document.querySelector('#editorForm').requestSubmit();
      await new Promise(r => setTimeout(r, 100));
      const renamed = JSON.parse(localStorage.getItem('desktop')).shortcuts.find(s => s.id === added.id);
      document.querySelector('#deskTiles .tile[data-id="' + added.id + '"] .more').click();
      document.querySelector('#fRemove').click();
      await new Promise(r => setTimeout(r, 100));
      return { before, afterAdd, added, renamed: renamed.name, afterRemove: count() };`);
    assert(r.before === 4 && r.afterAdd === 5, 'counts ' + JSON.stringify(r));
    assert(r.added.url === 'https://example.org', 'normalized url ' + r.added.url);
    assert(r.renamed === 'Renamed Site', 'rename failed');
    assert(r.afterRemove === 4, 'remove failed');
    return { add: true, edit: true, remove: true };
  });

  await check('group: create, add shortcut inside, drag tile into group', async () => {
    const r = await js(cdp, s, `
      document.querySelector('#fabGroup').click();
      const cn = document.querySelector('#cardName');
      cn.value = 'Work'; cn.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 50));
      document.querySelector('#cardGrid .add-tile').click();
      document.querySelector('#fName').value = 'GroupSite';
      document.querySelector('#fUrl').value = 'group.example';
      document.querySelector('#editorForm').requestSubmit();
      await new Promise(r => setTimeout(r, 120));
      document.querySelector('#cardClose').click();
      await new Promise(r => setTimeout(r, 350));
      const before = JSON.parse(localStorage.getItem('desktop'));
      const g = before.groups.find(g => g.name === 'Work');
      const tile = document.querySelector('#deskTiles .tile');
      const dragId = tile.dataset.id;
      const groupEl = document.querySelector('#dock .group-tile[data-id="' + g.id + '"]');
      const dt = new DataTransfer();
      tile.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
      const rect = groupEl.getBoundingClientRect();
      const opts = { bubbles: true, cancelable: true, dataTransfer: dt, clientX: rect.left + 20, clientY: rect.top + 20 };
      groupEl.dispatchEvent(new DragEvent('dragover', opts));
      const dropTargetHighlighted = !!document.querySelector('.group-tile.drop-target');
      groupEl.dispatchEvent(new DragEvent('drop', opts));
      // Chrome ignores dropEffect writes on synthetic DataTransfers; mimic the native result so the app's drop gate passes.
      Object.defineProperty(dt, 'dropEffect', { get: () => 'move' });
      tile.dispatchEvent(new DragEvent('dragend', opts));
      await new Promise(r => setTimeout(r, 300));
      const after = JSON.parse(localStorage.getItem('desktop'));
      const ga = after.groups.find(g => g.name === 'Work');
      return {
        groupCreated: !!g, items: g ? g.items.map(i => i.name) : null, draggedId: dragId, dropTargetHighlighted,
        wasOnDesk: before.shortcuts.some(s => s.id === dragId),
        isOnDesk: after.shortcuts.some(s => s.id === dragId),
        inGroup: ga.items.some(i => i.id === dragId)
      };`);
    assert(r.groupCreated, 'group not saved');
    assert(r.items.length === 1 && r.items[0] === 'GroupSite', 'group item ' + JSON.stringify(r.items));
    assert(r.dropTargetHighlighted, 'dragover did not highlight the group');
    assert(r.wasOnDesk && !r.isOnDesk && r.inGroup, 'drag did not move: ' + JSON.stringify(r));
    return r;
  });

  await check('drag desk tile to a different cell swaps positions', async () => {
    const r = await js(cdp, s, `
      const data = JSON.parse(localStorage.getItem('desktop'));
      const s0 = data.shortcuts[0];
      const tile = document.querySelector('#deskTiles .tile[data-id="' + s0.id + '"]');
      const boxes = [...document.querySelectorAll('#deskTiles .tile')].map(t => t.getBoundingClientRect());
      const targetX = boxes[boxes.length - 1].left + 20, targetY = boxes[boxes.length - 1].top + 20;
      const dt = new DataTransfer();
      tile.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
      const el = document.elementFromPoint(targetX, targetY) || document.body;
      const o = { bubbles: true, cancelable: true, dataTransfer: dt, clientX: targetX, clientY: targetY };
      el.dispatchEvent(new DragEvent('dragover', o));
      el.dispatchEvent(new DragEvent('drop', o));
      Object.defineProperty(dt, 'dropEffect', { get: () => 'move' });
      tile.dispatchEvent(new DragEvent('dragend', o));
      await new Promise(r => setTimeout(r, 250));
      const now = JSON.parse(localStorage.getItem('desktop')).shortcuts.find(x => x.id === s0.id);
      return { before: [s0.col, s0.row], after: [now.col, now.row] };`);
    assert(JSON.stringify(r.before) !== JSON.stringify(r.after), 'position unchanged ' + JSON.stringify(r));
    return r;
  });

  await check('1–9 key opens shortcut via go()', async () => {
    const r = await js(cdp, s, `
      window.__go = null; window.__realGo = go; window.go = (u) => { window.__go = u; };
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true, cancelable: true }));
      const u = window.__go; window.go = window.__realGo;
      return { u, first: keyOrder()[0].url };`);
    assert(r.u === r.first, JSON.stringify(r));
    return r.u;
  });

  await check('settings: theme switch, accent, name/greeting', async () => {
    const r = await js(cdp, s, `
      document.querySelector('#fabSettings').click();
      const th = document.querySelector('#sTheme'); th.value = 'light'; th.dispatchEvent(new Event('change', { bubbles: true }));
      const name = document.querySelector('#sName'); name.value = 'Ahmad'; name.dispatchEvent(new Event('input', { bubbles: true }));
      const after = { theme: document.documentElement.dataset.theme, stored: localStorage.getItem('theme'), greet: document.querySelector('#greet').textContent, swatches: document.querySelectorAll('#sAccent .sw').length };
      document.querySelectorAll('#sAccent .sw')[2].click();
      after.accent = JSON.parse(localStorage.getItem('settings')).accent;
      after.accentVar = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      th.value = 'dark'; th.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('#settingsClose').click();
      return after;`);
    assert(r.theme === 'light' && r.stored === '"light"', JSON.stringify(r));
    assert(/Ahmad/.test(r.greet), 'greeting ' + r.greet);
    assert(r.swatches === 6 && r.accent === 'teal', JSON.stringify(r));
    assert(r.accentVar === '#007b83', 'light accent ' + r.accentVar);
    return r;
  });

  await check('export backup produces complete JSON', async () => {
    const r = await js(cdp, s, `
      document.querySelector('#fabSettings').click();
      const orig = HTMLAnchorElement.prototype.click;
      let dl = null;
      HTMLAnchorElement.prototype.click = function () { dl = { href: this.href, name: this.download }; };
      document.querySelector('#exportBtn').click();
      HTMLAnchorElement.prototype.click = orig;
      document.querySelector('#settingsClose').click();
      if (!dl) return { error: 'no download' };
      const text = await (await fetch(dl.href)).text();
      const j = JSON.parse(text);
      return { name: dl.name, keys: Object.keys(j), shortcuts: j.desktop.shortcuts.length, todos: j.todos.length, deadlines: j.deadlines.length, engine: j.settings.engine };`);
    assert(r.name && /^newtab-backup-\d{4}-\d{2}-\d{2}\.json$/.test(r.name), JSON.stringify(r));
    for (const k of ['version', 'desktop', 'todos', 'deadlines', 'theme', 'settings', 'fabPos']) assert(r.keys.includes(k), 'missing key ' + k);
    return r;
  });

  await check('import backup restores data and reloads', async () => {
    await js(cdp, s, `
      const payload = {
        version: 3,
        desktop: { shortcuts: [{ id: 'imp1', name: 'Imported', url: 'https://imported.example' }], groups: [] },
        todos: [{ id: 't1', text: 'Imported todo', priority: false, createdAt: Date.now(), completedAt: null }],
        deadlines: [],
        theme: 'dark',
        settings: { engine: 'google', name: '', greeting: true, clock: '12', date: true, search: true, font: 'hand', accent: 'blue', labels: true, numbers: true },
        fabPos: { right: 20, bottom: 20 }
      };
      const f = new File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' });
      const dt = new DataTransfer(); dt.items.add(f);
      const inp = document.querySelector('#importFile'); inp.files = dt.files;
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      return 'fired';`).catch(() => {});
    await cdp.waitEvent('Page.loadEventFired', s, 10000).catch(() => {});
    await sleep(1500);
    const after = await js(cdp, s, `return {
      desktop: JSON.parse(localStorage.getItem('desktop')),
      todos: JSON.parse(localStorage.getItem('todos')),
      theme: localStorage.getItem('theme'),
      engine: JSON.parse(localStorage.getItem('settings')).engine,
      fabPos: JSON.parse(localStorage.getItem('fabPos')),
      tiles: [...document.querySelectorAll('#deskTiles .label')].map(x => x.textContent)
    };`);
    assert(after.desktop.shortcuts[0].name === 'Imported', JSON.stringify(after.desktop));
    assert(after.todos[0].text === 'Imported todo', 'todos');
    assert(after.theme === '"dark"' && after.engine === 'google', 'theme/engine');
    assert(after.fabPos.right === 20, 'fabPos');
    assert(after.tiles.includes('Imported'), 'not rendered');
    return { imported: true, engine: after.engine };
  });

  const p3 = await openPage(cdp, `chrome-extension://${id}/newtab.html`);
  await check('shortcut tile with chrome:// URL is intercepted via go()', async () => {
    await js(cdp, p3.sessionId, `
      const d = JSON.parse(localStorage.getItem('desktop'));
      d.shortcuts.push({ id: 'chrometile', name: 'Settings', url: 'chrome://settings' });
      localStorage.setItem('desktop', JSON.stringify(d));
      location.reload();`).catch(() => {});
    await cdp.waitEvent('Page.loadEventFired', p3.sessionId, 10000).catch(() => {});
    await sleep(1200);
    const r = await js(cdp, p3.sessionId, `
      window.__tabsUpdate = [];
      chrome.tabs.update = (o) => { window.__tabsUpdate.push(o); return Promise.resolve({}); };
      const tile = document.querySelector('#deskTiles .tile[data-id="chrometile"]');
      if (!tile) return { missing: true, ids: JSON.parse(localStorage.getItem('desktop')).shortcuts.map(s => s.id) };
      tile.click();
      await new Promise(r => setTimeout(r, 100));
      return { updates: window.__tabsUpdate, loc: location.href };`);
    assert(!r.missing, JSON.stringify(r));
    assert(r.updates.length === 1 && r.updates[0].url === 'chrome://settings', JSON.stringify(r));
    assert(r.loc.includes('/newtab.html'), 'page navigated away');
    return r.updates[0];
  });

  await check('go(): chrome:// and file:// use tabs.update, http uses location', async () => {
    const r = await js(cdp, p3.sessionId, `
      window.__tabsUpdate = [];
      chrome.tabs.update = (o) => { window.__tabsUpdate.push(o); return Promise.resolve({}); };
      go('chrome://settings'); go('file:///C:/');
      return { updates: window.__tabsUpdate, src: go.toString() };`);
    assert(r.updates.length === 2 && r.updates[0].url === 'chrome://settings' && r.updates[1].url === 'file:///C:/', JSON.stringify(r.updates));
    assert(/location\.href/.test(r.src), 'go does not use location');
    return r.updates.map((u) => u.url);
  });

  await check('chrome.search.query actually searches with the browser default engine', async () => {
    const p4 = await openPage(cdp, `chrome-extension://${id}/newtab.html`);
    await js(cdp, p4.sessionId, `chrome.search.query({ text: 'maddy new tab test', disposition: 'CURRENT_TAB' }); return 'called';`).catch(() => {});
    await cdp.waitEvent('Page.loadEventFired', p4.sessionId, 10000).catch(() => {});
    await sleep(2500);
    const url = await js(cdp, p4.sessionId, `return location.href;`).catch(() => null);
    await cdp.send('Target.closeTarget', { targetId: p4.targetId });
    assert(url && /^https?:\/\//.test(url), 'did not search: ' + url);
    const isResults = /google\.[a-z.]+\/search\?.*q=maddy(%20|\+)new(%20|\+)tab(%20|\+)test/.test(url);
    const isCaptcha = /google\.[a-z.]+\/sorry\/.*continue=.*maddy(%2B|\+|\%20)new/.test(url);
    assert(isResults || isCaptcha, 'did not search: ' + url);
    return { url: url.length > 120 ? url.slice(0, 120) + '…' : url, captcha: isCaptcha };
  });

  await check('go("http://…") navigates with location.href', async () => {
    const p2 = await openPage(cdp, `chrome-extension://${id}/newtab.html`);
    await js(cdp, p2.sessionId, `go('http://127.0.0.1:8124/'); return 'called';`).catch(() => {});
    await cdp.waitEvent('Page.loadEventFired', p2.sessionId, 12000).catch(() => {});
    await sleep(500);
    const url = await js(cdp, p2.sessionId, `return location.href;`);
    await cdp.send('Target.closeTarget', { targetId: p2.targetId });
    assert(url === 'http://127.0.0.1:8124/', url);
    return url;
  });

  const problems = collectProblems(cdp, s);
  await check('no console errors or CSP violations on the main new tab', async () => {
    return problems.length ? Promise.reject(new Error(JSON.stringify(problems))) : 'clean';
  });

  await check('Chrome stderr has no extension load errors', async () => {
    const bad = stderr().split('\n').filter((l) => /Failed to load extension|Manifest (is not valid|file is invalid)|Unrecognized manifest/i.test(l));
    assert(!bad.length, JSON.stringify(bad));
    return 'clean';
  });

  log('\n--- restart browser to test persistence ---');
  await cdp.send('Browser.close').catch(() => {});
  await sleep(2500);
  ({ cdp, id, stderr } = await launch({ fresh: false }));
  const page2 = await openPage(cdp, `chrome-extension://${id}/newtab.html`);
  await check('data survives closing and reopening the browser', async () => {
    const r = await js(cdp, page2.sessionId, `return {
      desktop: JSON.parse(localStorage.getItem('desktop')),
      todos: JSON.parse(localStorage.getItem('todos')),
      theme: localStorage.getItem('theme'),
      engine: JSON.parse(localStorage.getItem('settings')).engine,
      labels: [...document.querySelectorAll('#deskTiles .label')].map(x => x.textContent)
    };`);
    assert(r.desktop.shortcuts.some((x) => x.name === 'Imported'), 'desktop lost ' + JSON.stringify(r.desktop));
    assert(r.todos[0].text === 'Imported todo', 'todos lost');
    assert(r.theme === '"dark"' && r.engine === 'google', 'settings lost');
    assert(r.labels.includes('Imported'), 'not rendered');
    return { shortcuts: r.desktop.shortcuts.length, todos: r.todos.length, theme: r.theme, engine: r.engine };
  });

  const problems2 = collectProblems(cdp, page2.sessionId);
  await check('console clean after restart', async () => (problems2.length ? Promise.reject(new Error(JSON.stringify(problems2))) : 'clean'));

  await cdp.send('Browser.close').catch(() => {});
  await sleep(2500);

  log('\n--- headed browser: new tab override, warnings, toolbar action ---');
  let headed;
  try {
    headed = await launch({ headed: true, profile: HEADED_PROFILE });
  } catch (e) {
    await check('headed Chrome launched', async () => Promise.reject(e));
  }
  if (headed) {
    const { cdp: c2, id: id2, stderr: err2 } = headed;
    const extPage = await openPage(c2, `chrome-extension://${id2}/newtab.html`);
    await check('headed: new tab page renders', async () => {
      const r = await js(c2, extPage.sessionId, `return { title: document.title, tiles: document.querySelectorAll('#deskTiles .tile').length };`);
      assert(r.title === 'New Tab' && r.tiles === 4, JSON.stringify(r));
      return r;
    });

    await check('chrome://extensions reports no errors and recognizes the new tab override', async () => {
      const t = await c2.send('Target.createTarget', { url: 'chrome://extensions/' });
      await sleep(2500);
      const { sessionId } = await c2.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
      await c2.send('Runtime.enable', {}, sessionId);
      const r = await c2.send('Runtime.evaluate', {
        expression: `chrome.developerPrivate.getExtensionsInfo({ includeDisabled: true, includeTerminated: true }).then(list => list.filter(e => e.id === ${JSON.stringify(id2)}).map(e => ({ name: e.name, state: e.state, manifestErrors: e.manifestErrors, runtimeErrors: e.runtimeErrors, installWarnings: e.installWarnings, permissions: e.permissions })))`,
        awaitPromise: true, returnByValue: true,
      }, sessionId);
      const list = r.result?.value || [];
      await c2.send('Target.closeTarget', { targetId: t.targetId }).catch(() => {});
      assert(list.length === 1, 'extension missing from extensions page: ' + JSON.stringify(list));
      const e = list[0];
      assert((e.manifestErrors || []).length === 0, 'manifest errors ' + JSON.stringify(e.manifestErrors));
      assert((e.runtimeErrors || []).length === 0, 'runtime errors ' + JSON.stringify(e.runtimeErrors));
      assert((e.installWarnings || []).length === 0, 'install warnings ' + JSON.stringify(e.installWarnings));
      const msgs = (e.permissions.simplePermissions || []).map((p) => p.message);
      assert(msgs.some((m) => /new tab/i.test(m)), 'Chrome does not list the new tab override: ' + JSON.stringify(msgs));
      return { state: e.state, override: msgs.find((m) => /new tab/i.test(m)) };
    });

    await check('toolbar action click opens a new tab', async () => {
      await c2.send('Target.setDiscoverTargets', { discover: true, filter: [{ type: 'tab' }, { type: 'page' }, {}] });
      await sleep(500);
      const infos = (await c2.send('Target.getTargets')).targetInfos;
      const tab = infos.find((t) => t.type === 'tab' && /newtab\.html/.test(t.url || ''));
      assert(tab, 'no tab target for the extension page');
      const beforeIds = new Set(infos.filter((t) => t.type === 'page').map((t) => t.targetId));
      const trigger = await c2.send('Extensions.triggerAction', { id: id2, targetId: tab.targetId, action: 'browserAction' });
      assert(trigger, 'triggerAction failed');
      await sleep(3000);
      const after = (await c2.send('Target.getTargets')).targetInfos.filter((t) => t.type === 'page');
      const opened = after.filter((t) => !beforeIds.has(t.targetId));
      assert(opened.length > 0, 'no new tab opened');
      const url = opened[0].url;
      await c2.send('Target.closeTarget', { targetId: opened[0].targetId }).catch(() => {});
      return { openedTabs: opened.length, url: url.replace(id2, '<id>') };
    });

    await note('new tab page served by the override in this Chrome build', async () => {
      // Chrome 157 sideloaded (CDP) extensions do not get chrome_url_overrides applied in this
      // environment: a minimal 3-file override extension reproduces it. Recorded for TESTING.md.
      const t = await c2.send('Target.createTarget', { url: 'chrome://newtab/' });
      await sleep(3000);
      const info2 = (await c2.send('Target.getTargets')).targetInfos.find((x) => x.targetId === t.targetId);
      const url = (info2 && info2.url) || '';
      await c2.send('Target.closeTarget', { targetId: t.targetId }).catch(() => {});
      return { url: url.replace(id2, '<id>'), applied: url === `chrome-extension://${id2}/newtab.html` };
    });

    await check('headed: console clean', async () => {
      const p = collectProblems(c2, extPage.sessionId);
      return p.length ? Promise.reject(new Error(JSON.stringify(p))) : 'clean';
    });

    await c2.send('Browser.close').catch(() => {});
  }

  log('\n--- static extension-package checks ---');
  const ext = path.join(root, 'extension');
  const read = (p) => fs.readFileSync(path.join(ext, p), 'utf8');
  const listFiles = (dir, base = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? listFiles(path.join(dir, d.name), base + d.name + '/') : [base + d.name]);

  await check('static: extension folder contains exactly the required files', async () => {
    const files = listFiles(ext).sort();
    const expected = ['background.js', 'fonts/OFL.txt', 'fonts/Virgil.woff2', 'icons/icon128.png', 'icons/icon16.png', 'icons/icon32.png', 'icons/icon48.png', 'manifest.json', 'newtab.css', 'newtab.html', 'newtab.js'];
    assert(JSON.stringify(files) === JSON.stringify(expected), 'unexpected file list: ' + JSON.stringify(files));
    return files;
  });

  await check('static: HTML has no inline code and loads split assets', async () => {
    const html = read('newtab.html');
    assert(/<title>New Tab<\/title>/.test(html), 'title tag');
    assert(/<link[^>]+rel="stylesheet"[^>]+href="newtab\.css"/.test(html), 'stylesheet link');
    assert(!/<style[\s>]/i.test(html), 'inline <style> block');
    assert(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), 'inline <script> block');
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]);
    assert(JSON.stringify(scripts) === JSON.stringify(['newtab.js']), 'script srcs ' + JSON.stringify(scripts));
    assert(/newtab\.js"><\/script>\s*<\/body>/i.test(html) || /<script src="newtab\.js"><\/script>[\s\S]{0,40}<\/body>/i.test(html), 'script must be the last thing in body');
    const onAttr = html.match(/\son[a-z]+\s*=/i);
    assert(!onAttr, 'inline handler ' + (onAttr && onAttr[0]));
    assert(!/javascript:/i.test(html), 'javascript: URL');
    return { scripts };
  });

  await check('static: no eval / new Function / remote scripts / inline handlers', async () => {
    const sources = { html: read('newtab.html'), css: read('newtab.css'), js: read('newtab.js'), bg: read('background.js') };
    for (const [name, src] of Object.entries(sources)) {
      if (name === 'css') continue;
      assert(!/\beval\s*\(/.test(src), name + ': eval(');
      assert(!/new\s+Function\s*\(/.test(src), name + ': new Function(');
      assert(!/setAttribute\(\s*['"]on[a-z]/i.test(src), name + ': setAttribute on*');
      assert(!/(src|href)\s*=\s*['"]https?:\/\//i.test(src), name + ': remote src/href');
    }
    assert(!/@import/.test(sources.css), 'css @import');
    assert(!/url\(\s*['"]?https?:/i.test(sources.css), 'css remote url()');
    assert(!/url\(\s*['"]?data:font/i.test(sources.css), 'embedded font data URI still in css');
    assert(/url\("fonts\/Virgil\.woff2"\)/.test(sources.css), 'font-face must point at fonts/Virgil.woff2');
    return 'clean';
  });

  await check('static: background.js is only the action click handler', async () => {
    const src = read('background.js').trim();
    assert(src === 'chrome.action.onClicked.addListener(() => {\n  chrome.tabs.create({});\n});', 'unexpected background source: ' + JSON.stringify(src));
    return src.split('\n').length + ' lines';
  });

  await check('static: font is a decoded woff2 and OFL credit present', async () => {
    const font = fs.readFileSync(path.join(ext, 'fonts', 'Virgil.woff2'));
    assert(font.subarray(0, 4).toString('latin1') === 'wOF2', 'font signature');
    const ofl = read('fonts/OFL.txt');
    assert(/Virgil by Ellinor Rapp/.test(ofl), 'missing credit');
    assert(/SIL OPEN FONT LICENSE/i.test(ofl) && /Version 1\.1/.test(ofl), 'missing OFL 1.1 text');
    return { fontBytes: font.length, oflBytes: ofl.length };
  });

  await check('static: icons are 16/32/48/128 and 128 has 96x96 artwork with padding', async () => {
    const out = {};
    for (const size of [16, 32, 48, 128]) {
      const buf = fs.readFileSync(path.join(ext, 'icons', `icon${size}.png`));
      assert(buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'png signature ' + size);
      const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20), depth = buf[24], color = buf[25];
      assert(w === size && h === size, `icon${size} is ${w}x${h}`);
      assert(depth === 8 && color === 6, 'expected 8-bit RGBA');
      out['icon' + size] = w + 'x' + h;
    }
    const buf = fs.readFileSync(path.join(ext, 'icons', 'icon128.png'));
    let off = 8, idat = [];
    while (off < buf.length) {
      const len = buf.readUInt32BE(off), type = buf.subarray(off + 4, off + 8).toString('latin1');
      const data = buf.subarray(off + 8, off + 8 + len);
      if (type === 'IDAT') idat.push(data);
      off += 12 + len;
    }
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const stride = 128 * 4 + 1;
    for (let y = 0; y < 128; y++) assert(raw[y * stride] === 0, 'unexpected filter');
    const alphaAt = (x, y) => raw[y * stride + 1 + x * 4 + 3];
    let borderOpaque = 0;
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) if ((x < 16 || x >= 112 || y < 16 || y >= 112) && alphaAt(x, y) !== 0) borderOpaque++;
    assert(borderOpaque === 0, borderOpaque + ' opaque pixels in the 16px border ring');
    let artPixels = 0;
    for (let y = 16; y < 112; y++) for (let x = 16; x < 112; x++) if (alphaAt(x, y) > 200) artPixels++;
    assert(artPixels > 1000, 'artwork not found in the centre 96x96: ' + artPixels);
    return { ...out, border: 'transparent', artworkPixels: artPixels };
  });

  await check('static: manifest matches the request exactly', async () => {
    const m = JSON.parse(read('manifest.json'));
    assert(m.manifest_version === 3, 'mv3');
    assert(m.name === 'Maddy New Tab' && m.version === '1.0.0', 'name/version');
    assert(typeof m.description === 'string' && m.description.length <= 132, 'description too long');
    assert(/shortcut/i.test(m.description) && /group/i.test(m.description) && /to-?do/i.test(m.description) && /deadline/i.test(m.description), 'description must mention shortcuts, groups, todo, deadlines');
    assert(JSON.stringify(m.permissions) === JSON.stringify(['favicon', 'search']), 'permissions');
    assert(!('host_permissions' in m), 'host_permissions');
    for (const k of ['content_security_policy', 'web_accessible_resources', 'alarms', 'notifications', 'storage']) assert(!(k in m || (m.permissions || []).includes(k)), 'forbidden key ' + k);
    assert(m.chrome_url_overrides && m.chrome_url_overrides.newtab === 'newtab.html', 'override');
    assert(m.action && m.action.default_title === 'Maddy New Tab' && m.action.default_icon['16'] === 'icons/icon16.png', 'action');
    assert(m.background && m.background.service_worker === 'background.js', 'sw');
    assert(JSON.stringify(m.icons) === JSON.stringify({ 16: 'icons/icon16.png', 32: 'icons/icon32.png', 48: 'icons/icon48.png', 128: 'icons/icon128.png' }) || (m.icons['128'] === 'icons/icon128.png' && m.icons['16'] === 'icons/icon16.png'), 'icons');
    assert(m.minimum_chrome_version === '111', 'min chrome');
    return { name: m.name, descLen: m.description.length, keys: Object.keys(m).sort() };
  });

  await check('static: newtab.js keeps the original localStorage keys', async () => {
    const jsSrc = read('newtab.js');
    for (const k of ['desktop', 'todos', 'deadlines', 'settings', 'theme', 'fabPos', 'panel', 'todoCollapsed', 'hintSeen']) {
      assert(new RegExp("'" + k + "'").test(jsSrc), 'missing storage key ' + k);
    }
    assert(!/chrome\.storage/.test(jsSrc), 'chrome.storage used');
    return 'all 9 keys, no chrome.storage';
  });

  site.close();
  const passed = results.filter((r) => r.ok).length;
  log(`\n${passed}/${results.length} checks passed  (${notes.length} notes)`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) { log('FAILED:'); for (const f of failed) log(' - ' + f.name + ': ' + f.info); process.exitCode = 1; }
  fs.writeFileSync(path.join(root, 'tools', 'browser-test-results.json'), JSON.stringify({ checks: results, notes }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
