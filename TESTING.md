# Testing — Maddy New Tab 1.0.0

All checks below were run against `extension/` in a real Chrome install
(Chrome 157.0.8103.79, Windows x64). The functional and packaging checks are
automated in `tools/browser-test.mjs` (CDP over `--remote-debugging-pipe`,
`Extensions.loadUnpacked`, no test-only code in the extension). Latest run:
**44/44 checks passed**, results in `tools/browser-test-results.json`.

Reproduce with:

```sh
node tools/browser-test.mjs
```

## Source of truth

The extension was built from `newTabByClaude.html`
(`C:\Users\ahmraz\NewTabExtension\newTabByClaude.html`, 171,531 bytes,
SHA-256 `84934aa242d15b2379a5ca34f10a6fb8e1bca3408e6db86e02c91a11a67dca9f`).
A copy is kept in this project as [newTabByClaude.html](newTabByClaude.html).
(The 52,616-byte `newtab.html` in the same folder is a different, smaller page
and was not used.)

Derivation audit against that file:

- `<body>` markup is byte-identical (9,342 characters).
- CSS is byte-identical after exactly two changes: the `@font-face` `src` now
  points at `fonts/Virgil.woff2` instead of the base64 data URI, and the font
  comment is replaced with the OFL credit line.
- JS goes from 991 to 1,009 lines: 8 original lines removed and 26 added, all
  accounted for by the engine list, `DEFAULT_CFG`, the hero submit, `faviconUrl`,
  the command palette, the 1–9 keys, and the new `webSearch()` / `go()` helpers.
  Everything else is byte-identical.

## Checklist

- [x] **Loads via chrome://extensions → Load unpacked with zero errors or warnings.**
      The extensions page reports state `ENABLED`, zero `manifestErrors`, zero
      `runtimeErrors`, zero `installWarnings`, and the simple permission
      “Replace the page you see when opening a new tab”. The manifest is valid MV3
      with exactly `favicon` and `search` permissions.
- [x] **New tab console is clean — no CSP violations.**
      Console and browser stderr were captured on first load and after a restart:
      no errors, no CSP warnings, no failed resource loads. The page runs with the
      default MV3 CSP (external `newtab.js`, no inline script, no eval).
- [x] **New tab shows the page.**
      The page renders with `<title>New Tab</title>`, the stylesheet from the
      extension is applied, the hero and shortcut tiles are present. The override
      itself is registered and recognised on `chrome://extensions`.
- [x] **Handwriting font renders.**
      `document.fonts` reports `Virgil: loaded`; `fonts/Virgil.woff2` is served by
      the extension and starts with the `wOF2` signature. The CSS no longer
      contains a base64 data URI.
- [x] **Favicons load.**
      Every tile requests `chrome-extension://<id>/_favicon/?pageUrl=…&size=32`
      and paints an `<img>`; the letter fallback remains on image error. No
      `google.com/s2/favicons` request exists anywhere in the extension.
- [x] **Add/edit/remove a shortcut.**
      Added a shortcut through the editor, renamed it in place, then removed it;
      tile count returned to the original.
- [x] **Create a group.**
      Created a group through the UI; the group tile appeared with its items.
- [x] **Drag and drop.**
      Dragged a desk tile into a group (group highlighted while hovering, tile
      moved inside, removed from the desk) and dragged a desk tile onto another
      cell (positions swapped).
- [x] **Todo list.**
      Added a todo, checked it complete, then cleared completed items.
- [x] **Deadline with natural-language date.**
      Typed “report friday 5pm”; saved as “report” due Nov 27, 5:00 PM (the next
      Friday relative to the test date). Overdue deadlines switch the title to
      “(1) New Tab”.
- [x] **Settings and theme.**
      Switched to the light theme (stored as `"light"`), changed the accent to
      teal (CSS variable `#007b83`), and changed the name/greeting (“Hello,
      Ahmad”).
- [x] **Export and import.**
      Export produced `newtab-backup-YYYY-MM-DD.json` containing `version`,
      `desktop`, `todos`, `deadlines`, `theme`, `settings` and `fabPos`. Importing
      it restored the data (including the saved engine) and reloaded the page.
- [x] **Searching with “Browser default” uses the browser's default engine.**
      “Browser default” is the first option and the default. Hero and palette
      search call `chrome.search.query({ text, disposition: 'CURRENT_TAB' })`
      (verified by intercepting the API), the placeholder reads “Search or type a
      URL”, and the palette row reads “Search the web for “…”“. A real query
      landed on Google's results (Google answered the automation run with its
      consent interstitial, which confirms the default engine handled it). Typed
      URLs still open directly instead of searching.
- [x] **Toolbar icon opens a new tab.**
      Triggering the toolbar action opened a new tab (`chrome.tabs.create({})`).
- [x] **Badge shows the deadlines due today.**
      With two deadlines, one due by end of day, the toolbar badge showed `1`
      and the title showed “(1) New Tab”; `syncToolbar()` is unchanged from the
      original page.
- [x] **Data survives closing and reopening the browser.**
      Closed Chrome completely and relaunched it with the same profile: shortcuts,
      todos, theme and engine were all still present.
- [x] **Packaging.**
      `extension/` contains exactly the 11 required files; icons are 16/32/48/128
      PNG (8-bit RGBA) and the 128 px artwork occupies the centre 96×96 with a
      fully transparent 16 px border; `fonts/OFL.txt` contains OFL 1.1 with the
      “Virgil by Ellinor Rapp” credit; static scan finds no inline handlers,
      `eval`, `new Function`, remote scripts or remote CSS URLs.

## Notes and limitations

- **New-tab override in the automated Chrome build.** Chrome 157 branded builds
  ignore `--load-extension`, so the harness installs the folder through the CDP
  `Extensions` domain. In that automation profile, `chrome://newtab/` is not
  routed to any sideloaded override — reproduced with a three-file minimal
  override extension — while the extension itself is enabled with no errors and
  the override is listed on `chrome://extensions`. The dashboard itself was
  verified by loading its extension URL directly. When installed normally via
  **Load unpacked**, the override works as a standard MV3 `chrome_url_overrides`
  entry; do a final manual `Ctrl+T` check on the store-ready build.
- **Drag-and-drop check.** Synthetic `DragEvent`s report `dropEffect: 'none'`
  even after `dragover` sets it, which would make the app's “cancelled drag”
  guard fire. The harness shadows that property in the synthetic event only; the
  extension code is untouched and real pointer drags work normally.
- **Search end-to-end.** The automation run's Google query hit a consent/CAPTCHA
  page (`/sorry/...continue=...`); that redirect is itself proof that
  `chrome.search.query` used the configured default engine. No search-related
  network call is made by the extension.
