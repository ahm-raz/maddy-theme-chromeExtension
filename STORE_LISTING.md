# Chrome Web Store listing — Maddy New Tab

## Name

Maddy New Tab

## Short description (132 characters max)

Shortcuts, groups, a todo list and deadlines on a calm, personal new tab page.

(The Store displays this from `manifest.json` → `description`; it is 78
characters. Editing it requires a manifest change and a new version upload.)

## Detailed description

Maddy New Tab turns the page you see when you open a new tab into a quiet
dashboard for the things you actually use.

**Shortcuts and groups.** Pin your most-used sites as tiles, arrange them on a
grid, and press 1–9 to open the first nine. Drag tiles between cells to reorder
them, or drop them into groups to keep things tidy. Use the ⋯ button on a tile
to edit or remove a shortcut.

**Todo list.** Keep a lightweight task list beside your shortcuts: add, check off,
and clear finished items without leaving the page.

**Deadlines.** Type dates the way you think — “report friday 5pm”, “pay rent on
dec 1” — and they are understood and saved. The tab title shows how many are
recently overdue, and the toolbar badge shows how many are due today.

**Search the way you like.** Search from the hero box or the command palette.
The default “Browser default” option uses the search engine you have configured
in Chrome; Google, DuckDuckGo, Bing and Brave are also available if you prefer.
Typed addresses still open directly.

**Make it yours.** Light and dark themes, six accent colours, a personal
greeting, optional clock and date, shortcut labels and number keys, and a
handwriting or system font — all saved locally.

**Private by design.** Everything you create stays in your browser on your own
device. There is no account, no sync, no analytics and no network request made
by the extension itself. Export your data to a JSON backup file any time and
import it again later.

**Handwriting without the wire.** The hand-drawn look uses the bundled Virgil
font, so it renders instantly and works offline.

## Single purpose

Replace Chrome's new tab page with a personal dashboard for shortcuts, groups, a
todo list and deadlines.

## Permission justifications

| Permission / manifest key | Why it is needed |
| --- | --- |
| `favicon` | Shows each shortcut's site icon. The extension asks Chrome's built-in favicon service for a cached icon (`chrome.runtime.getURL('/_favicon/?pageUrl=…&size=32')`); it makes no network request of its own and stores no icon data. |
| `search` | Powers the “Browser default” search option. When selected, queries are passed to `chrome.search.query` so Chrome performs the search with the user's configured default engine. Required by Chrome Web Store policy for new tab extensions that offer web search. |
| `chrome_url_overrides.newtab` | Displays the dashboard instead of the standard new tab page — the extension's single purpose. |
| `background.service_worker` (`background.js`) | The extension's only background behaviour: when the toolbar icon is clicked, it opens a new tab (`chrome.tabs.create({})`). No data is processed. |

No host permissions, content scripts, `tabs`, `storage`, `alarms`,
`notifications`, remote code or `web_accessible_resources` are requested.

## Category

Productivity / Tools

## Privacy

All data is stored in `localStorage` on the user's device. Nothing is collected,
transmitted or sold, and there are no analytics. See `PRIVACY_POLICY.md`.
