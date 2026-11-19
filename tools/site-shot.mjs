// Dev-only screenshot/QA helper for the landing page.
// Usage: node tools/site-shot.mjs <url> <out.png> <light|dark> <width> [height]
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const url = process.argv[2] || 'http://127.0.0.1:5173/'
const out = path.resolve(process.argv[3] || 'maddy-new-tab/screenshot-full.png')
const scheme = process.argv[4] === 'dark' ? 'dark' : 'light'
const width = Number(process.argv[5] || 1440)
const height = Number(process.argv[6] || 1000)

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mnt-site-'))
const child = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] },
)

const wsUrl = await new Promise((resolve, reject) => {
  let buffered = ''
  const timer = setTimeout(() => reject(new Error('Chrome did not start')), 15000)
  child.stderr.on('data', (chunk) => {
    buffered += chunk.toString()
    const match = buffered.match(/DevTools listening on (ws:\/\/\S+)/)
    if (match) {
      clearTimeout(timer)
      resolve(match[1])
    }
  })
  child.on('exit', (code) => reject(new Error(`Chrome exited (${code})`)))
})

const ws = new WebSocket(wsUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let nextId = 0
const pending = new Map()
const waiters = []
const events = []

ws.addEventListener('message', (message) => {
  const data = JSON.parse(message.data)
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id)
    pending.delete(data.id)
    if (data.error) reject(new Error(data.error.message))
    else resolve(data.result)
    return
  }
  if (!data.method) return
  events.push(data)
  for (let i = waiters.length - 1; i >= 0; i -= 1) {
    const waiter = waiters[i]
    if (waiter.method === data.method && waiter.sessionId === data.sessionId) {
      waiters.splice(i, 1)
      clearTimeout(waiter.timer)
      waiter.resolve(data.params)
    }
  }
})

function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
}

function waitFor(method, sessionId, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeout)
    waiters.push({ method, sessionId, resolve, timer })
  })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

  await send('Page.enable', {}, sessionId)
  await send('Runtime.enable', {}, sessionId)
  await send('Log.enable', {}, sessionId)
  await send(
    'Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: 1, mobile: width < 600 },
    sessionId,
  )
  await send(
    'Emulation.setEmulatedMedia',
    { features: [{ name: 'prefers-color-scheme', value: scheme }] },
    sessionId,
  )

  const loaded = waitFor('Page.loadEventFired', sessionId)
  await send('Page.navigate', { url }, sessionId)
  await loaded
  await send(
    'Runtime.evaluate',
    {
      expression:
        'document.fonts.ready.then(() => new Promise(r => setTimeout(r, 600)))',
      awaitPromise: true,
    },
    sessionId,
  )

  const { result } = await send(
    'Runtime.evaluate',
    {
      expression: `(() => {
        const doc = document.documentElement;
        return {
          title: document.title,
          innerWidth: window.innerWidth,
          scrollWidth: doc.scrollWidth,
          scrollHeight: doc.scrollHeight,
          fonts: document.fonts.check('16px Virgil'),
          h1: document.querySelector('h1')?.getBoundingClientRect().height,
          scheme: getComputedStyle(doc).colorScheme,
        };
      })()`,
      returnByValue: true,
    },
    sessionId,
  )

  const metrics = await send('Page.getLayoutMetrics', {}, sessionId)
  const pageHeight = Math.min(Math.ceil(metrics.cssContentSize.height), 8000)
  const shot = await send(
    'Page.captureScreenshot',
    {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height: pageHeight, scale: 1 },
    },
    sessionId,
  )
  fs.writeFileSync(out, Buffer.from(shot.data, 'base64'))

  const problems = events
    .filter(
      (event) =>
        (event.method === 'Runtime.consoleAPICalled' &&
          event.params.type === 'error') ||
        (event.method === 'Log.entryAdded' &&
          event.params.entry.level === 'error') ||
        event.method === 'Runtime.exceptionThrown',
    )
    .map((event) => event.method)

  console.log(
    JSON.stringify(
      {
        out,
        scheme,
        width,
        ...result.value,
        pageHeight,
        consoleErrors: problems,
        overflowX: result.value.scrollWidth > result.value.innerWidth,
      },
      null,
      2,
    ),
  )
} finally {
  try {
    await send('Browser.close')
  } catch {}
  ws.close()
  await new Promise((resolve) => {
    child.on('exit', resolve)
    setTimeout(resolve, 2000)
  })
  fs.rmSync(profile, { recursive: true, force: true })
}
