# Publishing Maddy New Tab 1.0.0 on the Chrome Web Store

This is the end-to-end checklist for this specific extension. Everything that can
be prepared in advance is marked ✅; items you must create while logged into your
own accounts are marked ⬜.

Official docs used for this guide:
[register](https://developer.chrome.com/docs/webstore/register) ·
[account setup](https://developer.chrome.com/docs/webstore/set-up-account) ·
[prepare](https://developer.chrome.com/docs/webstore/prepare) ·
[publish](https://developer.chrome.com/docs/webstore/publish) ·
[store listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) ·
[privacy tab](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) ·
[distribution](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution) ·
[images](https://developer.chrome.com/docs/webstore/images) ·
[review process](https://developer.chrome.com/docs/webstore/review-process) ·
[2-Step Verification](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification) ·
[trader FAQ](https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq)

---

## 0. What you are uploading

| Item | Value |
| --- | --- |
| Package | `maddy-new-tab-1.0.0.zip` (in the project root, ~93 KB) |
| Contents | `manifest.json` at the zip root + 10 asset files, nothing else |
| Manifest | MV3, name `Maddy New Tab`, version `1.0.0` |
| Permissions | `favicon`, `search` (no host permissions, no remote code) |
| Minimum Chrome | 111 |
| New tab override | `newtab.html` |
| Icon | `icons/icon128.png` — 128×128 PNG, 96×96 artwork, transparent padding (meets the Store's icon spec) |
| Accessibility/network | No remote scripts, no analytics, no network requests of its own |

Do **not** upload the project folder, `tools/`, the source HTML or the Markdown
docs. Only the zip.

---

## 1. Assets checklist

| Asset | Status | Requirement |
| --- | --- | --- |
| Extension zip | ✅ | `maddy-new-tab-1.0.0.zip`, manifest at root |
| Store icon | ✅ | 128×128 PNG (taken from the package) |
| Screenshots | ⬜ | **At least 1**, max 5. 1280×800 preferred (or 640×400). Full bleed, square corners, no transparency. Must show the real UI. |
| Small promo tile | ⬜ (recommended) | 440×280 PNG/JPEG. Listings without one are shown after listings that have one. |
| Marquee promo | ⬜ (optional) | 1400×560 PNG/JPEG, needed only for marquee placement. |
| Privacy policy URL | ⬜ | Public, stable URL (not a local file). See §3. |
| Support URL / homepage | ⬜ (optional) | GitHub repo/issues or a simple page. |
| YouTube video | ⬜ (optional) | Public video URL. |

### How to capture the screenshots

1. Install the extension unpacked and open `chrome-extension://<id>/newtab.html`
   (or press Ctrl+T after loading it).
2. Open DevTools (F12) → toggle the device toolbar (Ctrl+Shift+M) → set the
   viewport to **1280×800** → DevTools menu (⋮) → **Capture screenshot**.
   That produces a full-bleed 1280×800 image of the page, without browser chrome
   or padding.
3. Take 3–5 shots that show real behaviour, for example:
   - the dashboard with a few numbered shortcuts (dark theme),
   - the same page in light theme,
   - the command palette open (Ctrl+K) with the “Search the web for …” row,
   - the deadlines panel with a natural-language deadline,
   - the settings panel (theme/accent/search engine).
4. Use demo data only (no personal names, emails or private sites). PNG or JPEG,
   24-bit, no transparency.

Promo tile tip: fill the entire 440×280 canvas, use the dark background and the
blue check from the icon, avoid text, and make sure it still reads at half size.

---

## 2. One-time account setup

1. Choose the Google account you want to keep. **The account email cannot be
   changed later**, and it receives all review/takedown mail. A dedicated
   account is a good idea.
2. Enable **2-Step Verification** on that Google account. Chrome Web Store
   requires it before you can publish or update an item:
   <https://myaccount.google.com/security/signinoptions/two-step-verification/enroll-welcome>
3. Open the [Developer Dashboard](https://chrome.google.com/webstore/devconsole),
   accept the developer agreement and pay the **one-time registration fee**
   (US $5; local taxes may apply). It is not a subscription.
4. On the **Account** page:
   - Set a **Publisher name** (shown publicly as “Offered by:”).
   - Add and **verify a contact email** (shown to users).
   - Optionally add **trusted tester** emails.
   - Complete the **Trader / Non-Trader declaration** (EU DSA). Every publisher
     must declare. A trader must provide a legal name, address and SMS-verified
     phone number, and **that information is shown publicly on the listing**.
     A non-trader does not publish that information. Make the legal
     determination for yourself; if you publish as a hobby, “non-trader” is the
     usual choice, but this is your declaration.
   - Complete any identity/payment-profile prompts the dashboard asks for.
5. Note the new-publisher limit: **a new publisher can have at most two
   published extensions**. The dashboard shows your limit and an option to
   request an increase if needed.
6. Registration is only available in supported countries/regions. If the
   dashboard refuses registration, contact One Stop Support.

---

## 3. Publish the privacy policy

The Store requires a **public URL** for the policy; a file on your computer is
not accepted. The policy must explain what data is handled, how, and with whom
it is shared.

Fastest route with GitHub Pages:

1. Create a public GitHub repository (e.g. `maddy-new-tab-site`).
2. Add a file named `privacy.html` containing the text of
   `PRIVACY_POLICY.md` converted to HTML (or add `index.md` and let Pages
   render it).
3. Repository **Settings → Pages → Deploy from a branch → `main` / root → Save**.
4. Wait for the URL, e.g. `https://<username>.github.io/maddy-new-tab-site/privacy.html`.
5. Open it in a private window to confirm it loads without login. Use that URL
   in the dashboard and keep it live for as long as the extension is listed.

The policy must stay consistent with the answers in the Privacy tab. Ours says:
data stays in the browser on the device; nothing is collected, transmitted or
sold; no analytics; the `favicon` permission uses Chrome's built-in icon cache;
the `search` permission hands queries to Chrome's default engine.

---

## 4. Pre-upload test on your machine

1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
   select the `extension` folder.
2. Confirm there are **no manifest errors or warnings**, and the details page
   shows “Replace the page you see when opening a new tab”.
3. Open a new tab (Ctrl+T). Confirm the dashboard, handwriting font, favicons,
   shortcuts, groups, drag and drop, todo, deadlines, settings, theme,
   export/import and search all work, and that the console is clean.
4. Add a deadline due a few minutes in the past (still today): the toolbar badge
   appears, and the title becomes “(1) New Tab”.
5. Search once with “Browser default” and confirm the browser's default engine
   opens the result.
6. Close and reopen Chrome and confirm the data is still there.

> Note from testing: the automated Chrome build used for verification does not
> route `chrome://newtab/` to sideloaded overrides, so the override was verified
> via its registration rather than by pressing Ctrl+T in that automation
> profile. Do this manual Ctrl+T check with your normal Chrome before
> uploading.

---

## 5. Create the item and upload the zip

1. In the [Developer Dashboard](https://chrome.google.com/webstore/devconsole),
   click **Add new item**.
2. Choose **`maddy-new-tab-1.0.0.zip`** and upload it. The maximum package size
   is 2 GB; ours is far below that.
3. The **Package** tab is read-only after upload. If you find a typo in the
   manifest name/description/version, edit the manifest, increase the version,
   re-zip and upload again (or delete the draft item and start over before the
   first submission).
4. If the upload fails, the usual cause is malformed JSON (comments or trailing
   commas) or a missing file. The package has been validated by the test suite.

---

## 6. Store listing tab

Use these values.

- **Item name:** `Maddy New Tab`
- **Short description (summary):** taken from `manifest.json` — it is 78
  characters, under the 132 limit:
  > Shortcuts, groups, a todo list and deadlines on a calm, personal new tab page.
- **Category:** `Productivity` (alternatively `Tools`; do not use “Search Tools”,
  the extension is not a search provider)
- **Language:** `English (United States)`
- **Store icon:** `extension/icons/icon128.png` (if the dashboard asks for one;
  otherwise it comes from the package)
- **Screenshots:** upload the 1–5 1280×800 images from §1
- **Small promo tile:** the 440×280 image, if you made one
- **Marquee:** optional 1400×560
- **YouTube video:** leave empty unless you have one
- **Homepage URL / Support URL:** optional. A GitHub repo or Issues page is fine.
- **Official URL:** leave empty unless you have verified the site in Google
  Search Console; it is for verified publishers only.
- **Mature content:** No.

Detailed description — paste this plain text (the dashboard does not render
Markdown, so use this version, not the `STORE_LISTING.md` markdown):

```
Maddy New Tab turns the page you see when you open a new tab into a quiet dashboard for the things you actually use.

SHORTCUTS AND GROUPS
Pin your most-used sites as tiles, arrange them on a grid, and press 1-9 to open the first nine. Drag tiles between cells to reorder them, or drop them into groups to keep things tidy. Use the ⋯ button on a tile to edit or remove a shortcut.

TODO LIST
Keep a lightweight task list beside your shortcuts: add, check off, and clear finished items without leaving the page.

DEADLINES
Type dates the way you think - "report friday 5pm", "pay rent on dec 1" - and they are understood and saved. The tab title shows how many are recently overdue, and the toolbar badge shows how many are due today.

SEARCH THE WAY YOU LIKE
Search from the hero box or the command palette. The default "Browser default" option uses the search engine you have configured in Chrome; Google, DuckDuckGo, Bing and Brave are also available if you prefer. Typed addresses still open directly.

MAKE IT YOURS
Light and dark themes, six accent colours, a personal greeting, optional clock and date, shortcut labels and number keys, and a handwriting or system font - all saved locally.

PRIVATE BY DESIGN
Everything you create stays in your browser on your own device. There is no account, no sync, no analytics and no network request made by the extension itself. Export your data to a JSON backup file any time and import it again later.

HANDWRITING WITHOUT THE WIRE
The hand-drawn look uses the bundled Virgil font, so it renders instantly and works offline.
```

Do not stuff the description with repeated keywords; that is a common rejection
reason (“keyword spam”).

---

## 7. Privacy practices tab

### Single purpose description

```
Maddy New Tab replaces Chrome's new tab page with a personal dashboard for shortcuts, groups, a todo list and deadlines.
```

### Permission justifications

**favicon**

```
Displays the icon next to each shortcut. The extension calls Chrome's built-in favicon service via chrome.runtime.getURL('/_favicon/?pageUrl=...&size=32'); it makes no network requests of its own and stores no favicon data. A letter tile is shown if no icon is available.
```

**search**

```
Powers the "Browser default" search option. When selected, the text the user submits is passed to chrome.search.query({ text, disposition: "CURRENT_TAB" }) so Chrome performs the search with the user's configured default search engine. This is required by Chrome Web Store policy for new tab extensions that offer web search; the extension itself sends no query anywhere.
```

If the dashboard lists any other permission, it should only be
`chrome_url_overrides` / host access — there are no host permissions. Delete
nothing from the manifest to satisfy the form; it already requests the minimum.

### Remote code

Select **“No, I am not using remote code.”** The package contains only local
files; there is no eval, no `new Function`, no remote script and no CDN.

### Data usage

The extension stores the user's own shortcuts, todos, deadlines and settings in
`localStorage` on the device. It does **not transmit anything**, has no host
permissions and makes no network requests of its own. Under the Store's
definition, that means:

- **Data collected:** select **none** of the data-type checkboxes. (Do not tick
  “Website content”, “Web history”, “User activity”, etc.; nothing leaves the
  device.)
- **Certifications (limited use):** tick the statements that you do not sell
  data, do not use it for unrelated purposes, and do not use it for
  creditworthiness/lending. These must match the privacy policy.
- If you ever add analytics, sync or any network call, you must update both the
  policy and these answers before shipping that version.

### Privacy policy

Paste the public URL from §3. If the Account page also asks for a privacy
policy URL, use the same one.

---

## 8. Distribution tab

- **Visibility:** `Public` for launch.
  - For a pre-launch smoke test you can choose `Private` and add trusted testers
    (or a Google Group) on the item's visibility screen. Private items go
    through the same review; you can switch to Public later.
  - `Unlisted` gives you a working store URL without a public listing.
- **Regions:** All regions (or restrict if you have a reason).
- **Pricing:** Free. No payments, no in-app purchases, no physical address
  required.

---

## 9. Test instructions tab (recommended)

This is optional, but it speeds up review, especially for the `search`
permission. Paste:

```
No account or credentials are required.

1. Install the extension and open a new tab (Ctrl+T / Cmd+T). The dashboard appears.
2. Add a shortcut with the + button, create a group from the dock, and drag a tile between cells or into a group.
3. Add a todo and a deadline; try a natural-language date such as "report friday 5pm".
4. Open Settings to switch theme, accent and search engine.
5. With "Browser default" selected, search from the hero box or the command palette (Ctrl+K). Chrome performs the search with the browser's default engine.
6. Use Export/Import in Settings to back up and restore the data.

All data stays in the browser's localStorage. The extension has no host permissions, makes no network requests, and uses Chrome's built-in favicon service for icons.
```

---

## 10. Submit for review

1. Click **Submit for review** and confirm.
2. Choose whether the item publishes automatically when approved, or uncheck
   the box to **defer publishing** and publish manually later. A deferred
   submission stays publishable for **30 days**; after that it reverts to a
   draft and must be reviewed again.
3. Review is a mix of automated checks and manual review. Most items are
   reviewed **within a few days**, but it can take **up to a few weeks**.
   New developers, new items and sensitive permissions get closer scrutiny.
   This extension has no host permissions, no remote code and readable
   unminified source, which keeps review simpler.
4. Enable “staged/reviewed item” email notifications on the **Account** page so
   you know when it is approved or rejected.
5. If it is still “pending review” after three weeks, contact developer support.

### If it is rejected

- The email names the policy and gives appeal instructions; the rejection does
  not remove or change an already-published version.
- Fix the issue, **increase the version number**, re-zip, upload and resubmit.
  You cannot change the manifest metadata of an uploaded package.
- If you believe the decision is wrong, use the **Appeal** button on the item
  page. Do not resubmit identical code expecting a different result.
- While a submission is pending, you can cancel the review if you spot a bug,
  upload a fixed package and resubmit.

### Common rejection risks to avoid

- Privacy policy URL missing or unreachable; policy inconsistent with the data
  disclosures.
- Vague permission justifications. Use the specific texts in §7.
- Asking for permissions the extension does not need (ours asks for two).
- Remote code or obfuscated/minified code (ours is plain, readable source).
- Keyword spam or a description that does not match the actual features.
- Screenshots that are mockups rather than the real UI, or contain personal data.
- Implying Google/Chrome affiliation; do not use Google logos or “Chrome” in the
  item name.
- For new tab extensions: routing search through a custom URL instead of
  `chrome.search` — ours uses the API for the default engine.

---

## 11. After it is published

1. Open the public listing, install it in a clean profile from the Store (not
   unpacked), open Ctrl+T, and repeat the §4 smoke test. Confirm the toolbar
   icon opens a new tab and the badge appears.
2. Keep the privacy policy URL live and keep the support channel monitored; the
   Store provides a built-in **Support hub** for user feedback.
3. To ship an update:
   - edit the code,
   - increase `version` in `manifest.json` (e.g. `1.0.1`),
   - rebuild the zip with `manifest.json` at the root,
   - upload it on the item's **Package** tab,
   - submit for review. The listing, item ID, ratings and user data are
     preserved. Local extension data (shortcuts, todos, deadlines, settings)
     survives normal updates.
4. Do not upload a package with the same version twice; the Store requires a
   strictly higher version.
5. Keep a copy of each submitted zip and the matching source, so a future
   reviewer question can be answered quickly.

---

## 12. Final pre-submission checklist

- [ ] Registered developer account, fee paid, 2-Step Verification enabled.
- [ ] Publisher name and verified contact email set.
- [ ] Trader/Non-Trader declared; identity/payment prompts completed.
- [ ] Privacy policy hosted at a public URL and matching the Privacy tab.
- [ ] 1–5 screenshots at 1280×800 (real UI, no personal data).
- [ ] 440×280 small promo tile prepared (recommended).
- [ ] Manual test: Load unpacked → Ctrl+T override works, console clean.
- [ ] `maddy-new-tab-1.0.0.zip` uploaded, manifest at root, no extra files.
- [ ] Store listing filled: name, summary from manifest, description, category,
      language, icon, screenshots.
- [ ] Privacy tab: single purpose, both permission justifications, no remote
      code, no data collected, certifications ticked, policy URL.
- [ ] Distribution: Public, all regions, free.
- [ ] Test instructions added.
- [ ] Submitted for review; notifications enabled.
- [ ] After approval: install from the Store and repeat the smoke test.
