import { useState } from 'react'
import { site } from './config'
import './App.css'

const YEAR = new Date().getFullYear()

const browsers = {
  chrome: {
    label: 'Chrome',
    page: 'chrome://extensions',
    devMode: 'Use the Developer mode switch in the top-right corner.',
  },
  edge: {
    label: 'Edge',
    page: 'edge://extensions',
    devMode:
      'Use the Developer mode switch in the left sidebar. In a narrow window, open the ☰ menu first.',
  },
  brave: {
    label: 'Brave',
    page: 'brave://extensions',
    devMode: 'Use the Developer mode switch in the top-right corner.',
  },
}

function detectBrowser() {
  try {
    if (navigator.brave) return 'brave'
    if (/\bEdg\//.test(navigator.userAgent)) return 'edge'
  } catch {
    // Fall through to Chrome.
  }
  return 'chrome'
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!navigator.clipboard) return
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      })
      .catch(() => {})
  }

  return (
    <button type="button" className="copy-btn" onClick={copy}>
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

function InstallGuide() {
  const [browserKey, setBrowserKey] = useState(detectBrowser)
  const browser = browsers[browserKey]
  const folder = site.zipUrl.split('/').pop().replace(/\.zip$/, '')

  return (
    <div className="install-guide">
      <p className="guide-label" id="browser-label">
        Your browser
      </p>
      <div
        className="browser-switch"
        role="group"
        aria-labelledby="browser-label"
      >
        {Object.entries(browsers).map(([key, b]) => (
          <button
            key={key}
            type="button"
            aria-pressed={key === browserKey}
            onClick={() => setBrowserKey(key)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <ol className="steps">
        <li>
          <span className="step-n">1</span>
          <div>
            <strong>Download and unzip</strong>
            <p>
              <a href={site.zipUrl} download>
                Download the .zip
              </a>
              , then unzip it. On Windows, right-click it and choose{' '}
              <em>Extract All</em>; on a Mac, double-click it.
            </p>
          </div>
        </li>
        <li>
          <span className="step-n">2</span>
          <div>
            <strong>Put the folder somewhere permanent</strong>
            <p>
              Move the <code>{folder}</code> folder to a place you won’t
              clean up, such as <em>Documents</em>. {browser.label} runs the
              extension from this folder, so deleting or moving it removes
              the extension.
            </p>
          </div>
        </li>
        <li>
          <span className="step-n">3</span>
          <div>
            <strong>Open the extensions page</strong>
            <p>
              Paste <code>{browser.page}</code>
              <CopyButton text={browser.page} /> into the address bar and
              press Enter. Websites can’t link to this page, so it has to be
              typed or pasted.
            </p>
          </div>
        </li>
        <li>
          <span className="step-n">4</span>
          <div>
            <strong>Turn on Developer mode</strong>
            <p>{browser.devMode}</p>
          </div>
        </li>
        <li>
          <span className="step-n">5</span>
          <div>
            <strong>Load the extension</strong>
            <p>
              Click <em>Load unpacked</em> and select the{' '}
              <code>{folder}</code> folder, the one that directly contains{' '}
              <code>manifest.json</code>. If you see another folder inside it,
              go one level deeper.
            </p>
          </div>
        </li>
        <li>
          <span className="step-n">6</span>
          <div>
            <strong>Open a new tab</strong>
            <p>
              Press <code>Ctrl</code>+<code>T</code> (<code>⌘</code>+
              <code>T</code> on a Mac). If {browser.label} asks whether you
              meant to change your new tab page, keep the change.
            </p>
          </div>
        </li>
      </ol>

      <div className="tips">
        <h3>Good to know</h3>
        <div>
          <strong>Updating</strong>
          <p>
            Use <em>Export</em> in Maddy’s settings to save a backup first.
            Then replace the files in the same folder with the new version and
            click the reload ↻ icon on Maddy’s card in{' '}
            <code>{browser.page}</code>. Keeping the same folder keeps your
            shortcuts and todos.
          </p>
        </div>
        <div>
          <strong>Developer mode notice</strong>
          <p>
            {browser.label} may remind you that a developer-mode extension is
            on. That only means it wasn’t installed from a store; it’s safe to
            keep.
          </p>
        </div>
        <div>
          <strong>Removing it</strong>
          <p>
            Click <em>Remove</em> on Maddy’s card in{' '}
            <code>{browser.page}</code>. This deletes your Maddy data, so
            export a backup first if you want to keep it.
          </p>
        </div>
      </div>
    </div>
  )
}

const iconPaths = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  folder: (
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  ),
  todo: (
    <>
      <path d="m9 11 3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  deadline: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 3 2 6" />
      <path d="m22 6-3-3" />
      <path d="M6.38 18.7 4 21" />
      <path d="M17.64 18.67 20 21" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  arrow: (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
}

function Icon({ name, size = 24, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}

function Mark({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      aria-hidden="true"
    >
      <rect
        x="0.5"
        y="0.5"
        width="95"
        height="95"
        rx="23.5"
        fill="var(--mark-bg)"
        stroke="var(--mark-ring)"
      />
      <path
        d="M27 51c3.6 4.8 7.4 8.8 12.2 13.2 7.5-11.8 14-20.2 26.6-32.4"
        fill="none"
        stroke="#8ab4f8"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="70.5" cy="26" r="5.2" fill="#f28b82" />
    </svg>
  )
}

const features = [
  {
    icon: 'grid',
    title: 'Shortcuts, one keystroke away',
    text: 'Pin the sites you use most, drag them into place, then press 1–9 to open one without reaching for the mouse.',
  },
  {
    icon: 'folder',
    title: 'Groups that stay out of the way',
    text: 'Drop related shortcuts into a group. The dock stays short; the things you need stay close.',
  },
  {
    icon: 'todo',
    title: 'A todo list, not a project manager',
    text: 'Add a task, tick it off, clear what is done. It lives beside your shortcuts and never asks for an account.',
  },
  {
    icon: 'deadline',
    title: 'Deadlines in plain language',
    text: 'Type “report friday 5pm” and it is understood. The tab title and toolbar badge keep a quiet count.',
  },
  {
    icon: 'search',
    title: 'Search the way Chrome does',
    text: 'Use your browser’s default engine through Chrome’s search API, or pick Google, DuckDuckGo, Bing or Brave.',
  },
  {
    icon: 'lock',
    title: 'Private by design',
    text: 'Everything is stored locally in your Chrome profile. No analytics, no network calls, no data leaving your device.',
  },
]

const tiles = [
  { label: 'Code', letter: 'C', tone: 'slate' },
  { label: 'Notes', letter: 'N', tone: 'sand' },
  { label: 'Design', letter: 'D', tone: 'clay' },
  { label: 'Mail', letter: 'M', tone: 'sky' },
  { label: 'Plans', letter: 'P', tone: 'sage' },
  { label: 'Docs', letter: 'D', tone: 'lilac' },
  { label: 'Read', letter: 'R', tone: 'rose' },
]

function Screen() {
  return (
    <div className="mockup" aria-hidden="true">
      <div className="browser">
        <div className="browser-bar">
          <span className="traffic" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="address">
            <Icon name="lock" size={11} />
            New Tab
          </span>
          <span className="browser-more" aria-hidden="true">
            •••
          </span>
        </div>

        <div className="screen">
          <div className="screen-top">
            <p className="screen-clock">09:41</p>
            <p className="screen-greet">Good morning, Maddy</p>
          </div>

          <div className="screen-search">
            <Icon name="search" size={17} />
            <span>Search or type a URL</span>
            <kbd>⌘K</kbd>
          </div>

          <div className="screen-tiles">
            {tiles.map((tile) => (
              <div className="app-tile" key={tile.label}>
                <span className={`app-icon tone-${tile.tone}`}>{tile.letter}</span>
                <span className="app-label">{tile.label}</span>
              </div>
            ))}
            <div className="app-tile">
              <span className="app-icon group-icon" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="app-label">Work</span>
            </div>
          </div>

          <div className="screen-chips">
            <span className="pill todo-pill">
              <span className="pill-check">
                <Icon name="check" size={11} />
              </span>
              Water the plants
            </span>
            <span className="pill due-pill">
              <span className="pill-dot" />
              Ship the landing page <em>today</em>
            </span>
          </div>
        </div>
      </div>

      <div className="key-row">
        {Array.from({ length: 9 }, (_, i) => (
          <span className="key" key={i}>
            {i + 1}
          </span>
        ))}
        <span className="key-caption">Open a shortcut</span>
      </div>
    </div>
  )
}

function App() {
  const installHref = site.storeUrl || '#install'
  const primaryLabel = site.storeUrl ? 'Add to Chrome' : 'Get the extension'

  return (
    <div className="page">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label={`${site.name} — home`}>
          <Mark size={38} />
          <span className="brand-word">{site.shortName}</span>
        </a>

        <nav className="site-nav" aria-label="Main">
          <a href="#features">Features</a>
          <a href="#privacy">Privacy</a>
          <a href="#install">Install</a>
          {site.githubUrl && (
            <a href={site.githubUrl} target="_blank" rel="noreferrer">
              Source
            </a>
          )}
        </nav>

        <a className="btn btn-small" href={installHref}>
          {primaryLabel}
        </a>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">Maddy New Tab for Chrome</p>
            <h1 className="display">
              A quieter{' '}
              <br />
              place{' '}
              <span className="scribble-wrap">
                to start
                <svg
                  className="scribble"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M3 14c52-8 104-9 156-6 40 2 80 1 138-5" />
                </svg>
              </span>
              .
            </h1>
            <p className="hero-lede">
              Shortcuts, groups, a todo list and deadlines, on a new tab that
              feels like yours. No account, no analytics — everything stays in
              your browser.
            </p>
            <div className="cta-row">
              <a
                className="btn"
                href={installHref}
                {...(site.storeUrl
                  ? { target: '_blank', rel: 'noreferrer' }
                  : {})}
              >
                {primaryLabel}
                <Icon name="arrow" size={17} />
              </a>
              <a className="btn btn-ghost" href="#features">
                See what’s inside
              </a>
            </div>
            <p className="hero-meta">Free · Chrome 111+ · Manifest V3 · Offline</p>
          </div>

          <div className="hero-art">
            <Screen />
          </div>
        </section>

        <section className="section" id="features">
          <div className="section-head">
            <p className="eyebrow">What’s inside</p>
            <h2 className="h2">
              Everything you keep close,{' '}
              <br />
              <span className="hand">in one quiet place.</span>
            </h2>
            <p className="section-lede">
              No dashboards to configure, no feeds to check. Just the few tools
              that help you begin.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article
                className={`feature${feature.icon === 'lock' ? ' feature-quiet' : ''}`}
                key={feature.title}
              >
                <span className="feature-icon">
                  <Icon name={feature.icon} size={21} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                {feature.icon === 'lock' && (
                  <a className="text-link" href="/privacy-policy.html">
                    Read the privacy policy
                    <Icon name="arrow" size={14} />
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="privacy-band" id="privacy">
          <div className="privacy-inner">
            <div className="privacy-copy">
              <p className="eyebrow eyebrow-light">Privacy</p>
              <h2 className="privacy-title">
                Yours means <span className="hand">yours.</span>
              </h2>
              <p className="privacy-lede">
                Everything you create stays in your browser, on your device.
                Nothing is collected, transmitted or sold — and there are no
                analytics, tracking or remote servers.
              </p>
              <a className="text-link text-link-light" href="/privacy-policy.html">
                Read the full policy
                <Icon name="arrow" size={14} />
              </a>
            </div>

            <dl className="privacy-stats">
              <div>
                <dt className="hand">0</dt>
                <dd>accounts</dd>
              </div>
              <div>
                <dt className="hand">0</dt>
                <dd>analytics</dd>
              </div>
              <div>
                <dt className="hand">2</dt>
                <dd>permissions</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="install" id="install">
          <div className="install-copy">
            <p className="eyebrow">Install</p>
            <h2 className="h2">
              One tab <span className="hand">from now.</span>
            </h2>
            <p className="section-lede">
              {site.storeUrl
                ? 'Maddy New Tab opens with every new tab. Add it from the Chrome Web Store, or load the packaged extension yourself.'
                : 'Maddy New Tab opens with every new tab. Install it yourself from the zip in about a minute: no account, no store, nothing to sign up for.'}
            </p>

            <div className="cta-row">
              {site.storeUrl ? (
                <a
                  className="btn"
                  href={site.storeUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Add to Chrome
                  <Icon name="arrow" size={17} />
                </a>
              ) : (
                <a className="btn" href={site.zipUrl} download>
                  Download .zip
                  <Icon name="download" size={17} />
                </a>
              )}
              {site.githubUrl && (
                <a
                  className="btn btn-ghost"
                  href={site.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View source
                </a>
              )}
            </div>

            <p className="note">
              Version {site.version} · Chrome 111+, Edge and Brave on a
              computer. Phone browsers don’t support extensions.
            </p>
          </div>

          <InstallGuide />
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <a className="brand" href="#top" aria-label={`${site.name} — back to top`}>
            <Mark size={32} />
            <span className="brand-word brand-word-small">{site.shortName}</span>
          </a>
          <p className="footer-tag hand">Made for quiet mornings.</p>
        </div>

        <div className="footer-bottom">
          <nav className="footer-nav" aria-label="Footer">
            <a href="/privacy-policy.html">Privacy</a>
            {site.githubUrl && (
              <a href={site.githubUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
            )}
            {site.storeUrl && (
              <a href={site.storeUrl} target="_blank" rel="noreferrer">
                Chrome Web Store
              </a>
            )}
          </nav>
          <p>
            © {YEAR} Maddy New Tab · Virgil by Ellinor Rapp (OFL)
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
