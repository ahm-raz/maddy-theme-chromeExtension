# Maddy New Tab

A calm, personal Chrome new tab page with shortcuts, groups, a todo list and deadlines.

Manifest V3 · vanilla JavaScript · no build step · no analytics · all data stays in your browser.

Maddy New Tab replaces Chrome's default new tab page with a quiet dashboard for the
things you actually use. Pin your most-used sites as numbered tiles, keep them in
groups, track a lightweight todo list, and add deadlines in plain language such as
"report friday 5pm". Search from the hero box or the command palette using the
browser's own default engine, switch between light and dark themes, and back
everything up to a JSON file when you want. There is no account, no sync, no
tracking and no network request made by the extension itself.

<!-- Add a 1280x800 screenshot here once available:
![Maddy New Tab](docs/screenshot.png)
-->

## Features

- **Shortcut tiles** — add, edit and remove shortcuts; drag tiles between grid
  cells to reorder them; press `1`–`9` to open the first nine.
- **Groups** — create groups from the dock and drag tiles into them to keep the
  desk tidy; open a group to see and edit its items.
- **Todo list** — add tasks, check them off and clear finished items without
  leaving the page.
- **Deadlines** — natural-language dates ("report friday 5pm", "pay rent on
  dec 1") are parsed and saved, with optional daily/weekly/monthly repeats and
  one-tap snooze. The tab title shows the number of recently overdue deadlines,
  and the toolbar badge counts deadlines due by the end of the day.
- **Search** — the hero search box and the command palette. The default
  "Browser default" option uses `chrome.search.query`, so Chrome performs the
  search with your configured engine; Google, DuckDuckGo, Bing and Brave are
  available if you prefer. Typed addresses still open directly.
- **Command palette** — `Ctrl`/`Cmd`+`K` or `/` to search the web or jump to
  your shortcuts, todos and deadlines.
- **Themes and layout** — light/dark or follow your system, six accent colours,
  an optional greeting with your name, 12- or 24-hour clock, date, search box,
  shortcut labels and number keys, and either the handwriting font or your
  system font.
- **Backup** — export shortcuts, groups, todos, deadlines, theme and settings to
  a JSON file and import it again later.
- **Offline** — the hand-drawn Virgil font is bundled, so it renders instantly
  with no font download.
- **Local-first** — shortcuts, todos, deadlines and settings live in the
  profile's `localStorage`.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `1` … `9` | Open the corresponding shortcut |
| `Ctrl`/`Cmd` + `K`, `/` | Open the command palette |
| `t` | New todo |
| `d` | New deadline |
| `s` | New shortcut |
| `g` | New group |
| `,` | Settings |
| `?` | Help |
| `Esc` | Close the dialog/panel/card |

## Privacy and permissions

Everything you create stays in your browser on your device. There is no account,
no sync, no analytics, no telemetry and no remote code. The extension has no host
permissions and no content scripts, and makes no network requests of its own.

- `favicon` — draws each shortcut's icon from Chrome's built-in favicon service
  (`chrome.runtime.getURL('/_favicon/?pageUrl=…&size=32')`). No icon data is sent
  anywhere; a letter tile is shown when no icon is available.
- `search` — used only for the "Browser default" option: queries are passed to
  `chrome.search.query({ text, disposition: "CURRENT_TAB" })` and Chrome performs
  the search with your default engine.

Read the full [privacy policy](PRIVACY_POLICY.md). It is also suitable for
hosting as a public page (e.g. GitHub Pages) for the Chrome Web Store listing.

## Install

### Chrome Web Store

Add the store listing URL here once the extension is published.

### From source (unpacked)

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the `extension/` folder.
5. Open a new tab (`Ctrl`/`Cmd`+`T`).

Requires Chrome 111 or newer (the `favicon` and `search` permissions and
`chrome.search` need it).

## Website

The landing page in [`maddy-new-tab/`](maddy-new-tab/README.md) is a minimal
Vite + React site for the extension. It includes the MNT lockup, a CSS-built
product mockup, a styled privacy policy at `/privacy-policy.html` and the
store-ready zip for download. It is static, has no analytics and is ready for
Vercel:

```sh
cd maddy-new-tab
npm install
npm run dev
```

To deploy, import the repository in Vercel and either set the **Root Directory**
to `maddy-new-tab`, or use the included root [`vercel.json`](vercel.json) as-is.

## Repository layout

```
extension/            The shipped extension — this is what gets zipped
  manifest.json
  newtab.html
  newtab.css
  newtab.js
  background.js
  fonts/Virgil.woff2
  fonts/OFL.txt
  icons/icon16.png, icon32.png, icon48.png, icon128.png
newTabByClaude.html   Original single-file version, kept for reference
maddy-new-tab/        Landing page (Vite + React) for the extension
tools/                Build/test helpers (not part of the extension)
  extract.mjs         First-pass split of the single-file page + font decode
  make-icons.mjs      Generates the icon PNGs and tools/icon.svg
  browser-test.mjs    Real-Chrome verification harness
  site-shot.mjs       Landing-page screenshot/QA helper
PRIVACY_POLICY.md
STORE_LISTING.md      Store copy, short description, permission justifications
TESTING.md            Verified test checklist and results
PUBLISHING.md         Step-by-step Chrome Web Store submission guide
maddy-new-tab-1.0.0.zip   Store-ready package
vercel.json           Vercel config for deploying the site from the repo root
```

## Packaging for the Chrome Web Store

There is no build step. Zip the **contents** of `extension/` so that
`manifest.json` sits at the zip root:

```sh
cd extension
zip -r ../maddy-new-tab-1.0.0.zip \
  manifest.json newtab.html newtab.css newtab.js background.js fonts icons
```

For an update, increase `version` in `manifest.json` first (for example to
`1.0.1`), rebuild the zip and upload it. See [PUBLISHING.md](PUBLISHING.md) for
the full store checklist.

## Testing

`TESTING.md` contains the verified checklist. The automated harness in
`tools/browser-test.mjs` installs the unpacked extension in a real Chrome
profile over CDP and exercises the UI, search API, toolbar action, badge,
persistence and packaging; the latest run passed **44/44 checks**.

```sh
node tools/browser-test.mjs
```

The harness is development-only and is not included in the extension package.

## Changes from the original single-file page

The app was converted from `newTabByClaude.html` with its UI, behaviour, data
format and `localStorage` keys kept identical. The only changes:

1. **Split the file.** The `<style>` block became `newtab.css` (linked in
   `<head>`); the `<script>` block became `newtab.js` (loaded at the end of
   `<body>`). MV3 forbids inline scripts. No inline handlers, `eval`,
   `new Function` or remote scripts exist.
2. **Title.** The document title is now declared as `<title>New Tab</title>`;
   the existing code still switches it to `(n) New Tab` when deadlines are
   recently overdue.
3. **Font.** The base64 data URI in `@font-face` was decoded programmatically to
   `fonts/Virgil.woff2` (not retyped or regenerated) and the CSS now points at
   that file. Added the SIL OFL 1.1 text with the credit for Ellinor Rapp.
4. **Manifest and background.** Added `manifest.json` (MV3, `favicon` and
   `search` permissions only, new tab override, icons) and `background.js`,
   whose `chrome.action.onClicked` handler opens a new tab with
   `chrome.tabs.create({})`.
5. **Search API.** Added “Browser default” as the first engine and the default
   in `DEFAULT_CFG`; when selected, the hero box and palette call
   `chrome.search.query({ text, disposition: 'CURRENT_TAB' })` instead of
   building a URL. The hero placeholder becomes “Search or type a URL” and the
   palette row reads ‘Search the web for “…”’. Typed URLs still open directly.
6. **Navigation helper.** Added `go(url)`: http/https go through
   `location.href`, while `chrome://` and `file://` go through
   `chrome.tabs.update({ url })` because extension pages cannot navigate to
   them directly. It is used by the `1`–`9` keys, the palette, the hero box and
   clicks on non-http(s) shortcut tiles.
7. **Favicons.** Kept the `chrome.runtime.getURL('/_favicon/?pageUrl=…&size=32')`
   path, removed the Google `s2/favicons` fallback (so the extension makes no
   network requests of its own); the letter icon remains the error fallback.
8. **Packaging.** Added the original icon set, the zip and the privacy, store
   listing, testing and publishing documents. `localStorage` usage,
   export/import and the toolbar badge (`syncToolbar()`) are unchanged.

## Credits

- **Virgil** handwriting font by Ellinor Rapp, licensed under the SIL Open Font
  License 1.1. See [`extension/fonts/OFL.txt`](extension/fonts/OFL.txt).
- Built with plain HTML, CSS and JavaScript — the extension has no frameworks,
  bundlers or runtime dependencies. The landing page in `maddy-new-tab/` uses
  React + Vite and builds to static files.

## License

No license file is included yet. The extension code is © its author; add a
`LICENSE` file (for example MIT) if you want others to reuse it. The bundled
Virgil font remains under the SIL Open Font License 1.1.
