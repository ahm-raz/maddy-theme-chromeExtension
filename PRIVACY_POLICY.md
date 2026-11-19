# Privacy Policy — Maddy New Tab

Last updated: 20 November 2026

Maddy New Tab is a Chrome extension that replaces the new tab page with a personal
dashboard for shortcuts, groups, a todo list and deadlines.

## Summary

- All data stays in your browser, on your device.
- Nothing is collected, transmitted or sold.
- There are no analytics, no tracking, no telemetry and no remote servers.

## What data the extension handles

The extension stores the content you create — shortcuts, groups, todo items,
deadlines, appearance settings, window/panel state and layout positions — in
`localStorage` inside your own Chrome profile. This data is written and read only
by the extension's new tab page and never leaves your device. Backups are files
you download yourself with the built-in Export button, and imports are files you
choose yourself; neither is uploaded anywhere.

Uninstalling the extension or clearing site data for it removes this data.

## What the extension does not do

- It does not collect, log, transmit or sell any personal data.
- It does not use analytics, crash reporting, advertising or fingerprinting.
- It does not make network requests of its own. It has no host permissions and no
  content scripts.
- It does not read your browsing history.

## Permissions and why they are needed

- **`favicon`** — draws the icon next to each shortcut. The extension asks Chrome's
  built-in favicon service for a cached site icon; the request stays inside Chrome
  and is not made by the extension. No icon data is stored or sent anywhere.
- **`search`** — used only when the “Browser default” search engine is selected.
  The query you type is passed to Chrome with `chrome.search.query`, and Chrome
  performs the search with the default search engine you have configured in
  Chrome. The extension never builds or contacts a search URL in that mode.
- **New tab override** (`chrome_url_overrides.newtab`) — this is the extension's
  whole visible function: show the dashboard when you open a new tab.

Nothing else is requested: no host permissions, no tabs access, no storage
permission, no alarms and no notifications.

## Third parties

The extension contains no third-party SDKs, analytics libraries or remote code.
The only third-party component is the bundled Virgil handwriting font, used under
the SIL Open Font License 1.1 (see `fonts/OFL.txt`); fonts are bundled locally and
are not downloaded at runtime.

## Changes

If this policy ever changes, the updated version will be published with the
extension listing and its “last updated” date will change.

## Contact

Questions about this policy can be raised through the support/contact channel
listed on the extension's Chrome Web Store page.
