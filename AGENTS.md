# AGENTS.md

The rules and contracts for working in this repository — what must stay **true**, not a snapshot
of how the code currently looks. If the code and this document disagree, that is a defect:
reconcile it deliberately (fix the code, or change the rule on purpose), don't let it drift.

**Context.** VXLinkShare ("VX Link Helper", v3.0) is a cross-browser extension (Chrome, Firefox,
Safari) that cleans shared links — strips tracking params and rewrites supported hosts to
`vx`-style preview domains. Supported sites (the in-scope set the rules below refer to):

| Original host                | Rewritten to     |
| ---------------------------- | ---------------- |
| `x.com` / `twitter.com`      | `vxtwitter.com`  |
| `reddit.com`                 | `vxreddit.com`   |
| `pixiv.net`                  | `phixiv.net`     |
| `bilibili.com`               | `vxbilibili.com` |

*Matching also covers the obvious content subdomains (`old.`/`np.`/`m.`/… for Reddit, `mobile.`
for X/Twitter); Pixiv stays exact (its `sketch.`/`dic.` subdomains are different products).
The precise rules live in each site's `match`/`rewrite` in `sites.js`, not here.*

---

## 1. Architecture contract

- **`src/` is the only place you write runtime extension code.** Test utilities may live under
  `scripts/`, checked-in fixtures under `tests/fixtures/`, and test specs under `tests/`. The
  `chrome/`, `firefox/`, and `safari/` folders hold exactly one hand-maintained file each — their
  `manifest.json`. Everything else there is copied from `src/` by the build and is gitignored.
  Never hand-edit a generated copy; never commit one.
- **No toolchain creep.** The project MUST stay buildable by file copy alone (`build.sh` is just
  `cp`). Do not introduce npm packages, bundlers, transpilers, TypeScript, or UI frameworks.
  Runtime code is dependency-free vanilla JS/HTML/CSS.
- **Layered, one-way dependencies.** Load order in every context is `common.js` → `sites.js` →
  (`background.js` | `content.js` | `options.js`):
  - `common.js` — the core framework and `VX` global (settings, i18n base, storage, the site
    **registry**, the generic `convert()`, background + clipboard). Knows **nothing** about any
    specific site. Depends on nothing; keep it free of top-level side effects beyond defining `VX`.
  - `sites.js` — every supported site as a self-contained `VX.registerSite({...})` block (§8).
    Depends only on `VX`.
  - `content.js` / `background.js` / `options.js` — entry points; depend on `VX` + the registry.
  No layer may depend on a layer above it, and nothing references a specific site by name.
- **Loading is wired by hand (no bundler).** With no build step, every script must be listed
  explicitly: the three `manifest.json` (`content_scripts.js`, plus Firefox `background.scripts`),
  `background.js`'s `importScripts`, `options.html`, `test.html`, and `build`/`clean` scripts.
  Adding a **new** top-level `src/*.js` means adding it to all of those (a one-time, append-only,
  conflict-free step).

## 2. `VX` is the public API — keep it stable

`common.js` exposes a single global, `VX`, consumed by background/content/options **and** by
`test.html`. Treat its surface as a contract; if you change a member's signature or behavior,
update every call site and `test.html` in the same change.

| Member                              | Contract                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| `convert(url, settings?)`           | Pure URL transform using optional normalized settings — see §3.       |
| `sites` / `registerSite(def)`       | The site registry — see §8. Site defs live in `sites.js`, never in core. |
| `getSiteLabel` / `getCreditDesc`    | Resolve a site's localized label / credit (options page).            |
| `GLOBAL_TRACKERS` / `SITE_TRACKERS` | Param blacklists used by `convert()` (any-host vs supported-host-only). |
| `DEFAULT_SETTINGS`                  | Schema + fallback; `sites` is filled by `registerSite()` (§7).        |
| `loadSettings` / `saveSettings`     | The only sanctioned read/write path to settings (§7).                |
| `getCurrentLanguage` / `getStrings` | The only sanctioned way to resolve common i18n strings (§6).         |
| `initBackground` / `writeToClipboard` | Background entry + cross-MV clipboard write (§4).                   |

## 3. `convert(url)` behavioral contract

This is the core of the product. It MUST:

- be **pure** — no I/O, no storage, no global mutation; output depends only on the input string;
- **never throw** — on any parse/processing failure, return the original `url` unchanged;
- be **idempotent** — `convert(convert(x)) === convert(x)`;
- **preserve link identity** — it may only (a) strip known tracking params and (b) rewrite a
  supported host to its `vx` equivalent. It MUST NOT change the path or drop any parameter that
  changes *which* content the link points to. When a host needs to keep certain params, use an
  explicit allow-list (as Bilibili does, in its `sites.js` block) — never guess;
- stay **scoped** — `convert()` strips `GLOBAL_TRACKERS` from any URL, then asks the registry for
  the site whose `match(h, u)` owns the host; only on a match does it strip `SITE_TRACKERS`, clear
  the fragment, and apply that site's `rewrite`. Per-site host/path/allow-list logic lives in
  `sites.js`, never in core. Every other URL gets generic tracking-param cleanup only.

**Any** change to `convert()` or its param lists REQUIRES new/updated cases in `test.html`, and
`test.html` must be fully green before the change is considered done.

## 4. Cross-browser parity contract

- Every user-facing feature MUST work on all three targets: Chrome (MV3), Firefox (MV2),
  Safari (MV3).
- **Branch on capability, not on browser name** (e.g. `if (apis.scripting)`), and resolve the API
  namespace the way `common.js` does: `chrome` first, else `browser`.
- The three manifests MUST stay in sync except for the documented MV2↔MV3 differences
  (V2: `background.scripts`, `clipboardWrite` permission; V3: `background.service_worker`,
  `scripting` permission, `host_permissions`). A permission or host added to one is added to all,
  in the correct form.

## 5. Permissions & security contract

- **Least privilege.** `host_permissions` / `permissions` / `content_scripts.matches` are limited
  to the supported sites. Never broaden to `<all_urls>` or `*://*/*`; add specific hosts only.
- **Local-only.** The extension makes no network requests and ships no remote or `eval`'d code.
  Don't add runtime calls to external services. (The only external reference today is the Google
  Fonts stylesheet in `options.html`; keep new external resources out of runtime code paths.)

## 6. i18n contract

- **Supported languages** (keys): `en`, `zh` (Simplified), `zh-TW` (Traditional), `es`, `ar`, `pt`,
  `fr`, `ja`. `zh` stays the Simplified key for back-compat with stored settings. `TRANSLATIONS` key
  order is the options-dropdown order. `getSystemLanguage()` maps the browser locale to one of these
  (Traditional variants → `zh-TW`).
- No hardcoded user-facing text. Common UI strings flow through `VX.TRANSLATIONS`, referenced by a
  `data-i18n` attribute in HTML or `getStrings()` in JS.
- **Per-site** labels and credit text live in that site's `meta` (in `sites.js`), not in
  `TRANSLATIONS`; the options page renders them via `getSiteLabel` / `getCreditDesc`. So adding a
  site adds no keys to `TRANSLATIONS`.
- **Completeness:** every `TRANSLATIONS` key and every per-site `credit.desc` MUST exist in **all**
  supported languages. A per-site `label` MAY omit languages — it falls back to `en` (labels are
  usually brand names).
- **RTL:** `VX.RTL_LANGUAGES` / `VX.isRTL(lang)` drives `dir="rtl"` on the options page and the
  toast; keep new UI direction-agnostic (use logical CSS or branch on `isRTL`) rather than assuming
  left-to-right.
### Adding or changing a UI string

- **Common string** (`TRANSLATIONS`): add/rename the key in **every** language block — not just
  `en` — and reference it via a `data-i18n` attribute (HTML) or `getStrings()` (JS). Never inline a
  literal. If you can't translate a language yet, still add the key (English placeholder is better
  than a missing key, which would render the raw key or fall back unpredictably).
- **Per-site string**: edit that site's `meta` in `sites.js` — `credit.desc` for **every** language;
  `label` only if it differs from the brand name (it falls back to `en`).
- Don't leave a key present in some languages and absent in others (see **Completeness** above).

### Adding a new language

1. Add a full `TRANSLATIONS["<code>"]` block with **every** existing key translated.
2. Add its **native** name to `LANGUAGE_DISPLAY["<code>"]` (this is the dropdown label; order
   follows `TRANSLATIONS`).
3. Fill each site's `meta.credit.desc["<code>"]` in `sites.js`.
4. If it reads right-to-left, add the code to `RTL_LANGUAGES`.
5. Make sure `getSystemLanguage()` can map a relevant browser locale to it.

The options dropdown auto-populates from `TRANSLATIONS`, so never hand-edit the `<option>` markup.

## 7. Settings & storage contract

- Settings live in `chrome.storage.sync` and are ALWAYS read via `VX.loadSettings()`, merged
  against `DEFAULT_SETTINGS`. Never assume a key exists on the raw storage object.
- `DEFAULT_SETTINGS.sites` is filled by `registerSite()` from each site's metadata. Each site stores
  an object of independent booleans: `replaceDomain`, `cleanTracking`, plus optional alternate
  replacement toggles such as Reddit's `replaceDomainRx`. Adding a site needs no core edit unless it
  introduces a new setting kind.
- In the options UI, sites with more than one enhanced viewer/replacement domain MUST present those
  domains as a radio group with an explicit “do not replace domain” choice. Single-domain sites can
  keep a checkbox. Always explain near the radio group that choosing no replacement keeps the
  original domain while other independent actions such as tracking cleanup can still run.
- Schema changes stay backward compatible: a new setting needs a default in `DEFAULT_SETTINGS`
  and a fallback at every read site, so older synced data keeps working.

## 8. Site module contract: one self-contained block per site

Every supported site is a single `VX.registerSite({...})` block in `src/sites.js`. The core never
names a site — it only iterates the registry. A block provides these fields:

| Field                | Purpose                                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| `key`                | Unique id; also the `settings.sites` key.                                        |
| `match(h, u)`        | `convert()`: does this site own host `h` (www-stripped)? `u` is the `URL` object. |
| `rewrite(u, h, opts)` | `convert()`: mutate the URL in place for domain replacement (host swap and any replacement-only path changes). |
| `clean(u, h)`       | `convert()`: optional site-specific cleanup beyond the shared tracker lists.       |
| `contentMatch(host)` | Content script: inject the VX button on this host?                               |
| `inject(ctx)`        | Content script: place the button using `ctx` = `{ strings, makeBtn, toast, copyUrl, convert }`. |
| `meta`               | `{ defaultEnabled, domains, replacementDomains?, label{lang}, credit{name,url,desc{lang}} }` — drives default settings, options labels, credits, and i18n. |

Each function has a **behavioral contract** — meeting the field list is not enough:

- **`match(h, u)`** — pure and cheap; decide ownership from the host `h` only (use `u` solely to
  inspect the path, as Bilibili does for `b23.tv`). Must not throw, and must be mutually exclusive
  with every other site's `match` (one host resolves to one site).
- **`rewrite(u, h)`** — runs *inside* `convert()`, so it inherits §3: pure, never throws, preserves
  link identity, and keeps any required params via an explicit **allow-list** (never guesses).
  Mutate `u` in place; don't return a value.
- **`inject(ctx)`** — runs in the content script on a **throttled, repeated** cadence, so it MUST be
  cheap and idempotent:
  - mark your button with a **unique `data-*` attribute** and **check it first — bail before any DOM
    query** (e.g. `if (document.querySelector("[data-mybtn]")) return;`);
  - use the **narrowest selector** that finds the anchor element. Scanning the whole document
    (`querySelectorAll("button, a")` then matching text) is a defect — prefer site-specific
    containers/attributes;
  - touch the page only through `ctx` (`strings`, `makeBtn`, `toast`, `copyUrl`, `convert`); don't
    reach into `content.js` internals;
  - fail soft: a missing element means `return`, not throw.
- **`meta`** — fill `label` and `credit.desc` for **every** language (§6); set `defaultEnabled`.

### Adding a new site

Do exactly these — and nothing in the core, content, options, defaults, or `TRANSLATIONS` changes:

1. Add one `VX.registerSite({...})` block to `src/sites.js` honoring the contracts above.
2. Add the site's hosts to **all three** `manifest.json` — both `host_permissions` **and**
   `content_scripts.matches` — in the correct MV2/MV3 form and kept in sync (§4, §5). This step is
   **required**: the content script (and thus the in-page button) only runs where the manifest
   grants it, and `convert()` via the context menu needs the host reachable too.
3. Add `convert()` cases for the new host(s) to `test.html` (§3); keep it green.
4. Run `./build.sh` so the platform folders match `src/`.

You do **not** touch `convert()`, `content.js`, `options.*`, `DEFAULT_SETTINGS`, or `TRANSLATIONS`
— they all read the registry. Removing a site = delete its block and its manifest hosts. Keep
blocks self-contained so they never conflict with each other or the core. (Only if you split
`sites.js` into one file per site do you also touch the load lists — see §1.)

## 9. Definition of done

1. Edited runtime code only under `src/` (+ manifests), with test scripts/fixtures under `scripts/` or
   `tests/` when needed; ran `./build.sh` so platform copies match source.
2. `convert()`/params/site rules changed → `test.html` updated and fully green.
3. Site-specific content injection changed → add/update a checked-in fixture under `tests/fixtures/`
   and run `node scripts/verify-content-fixtures.js`.
4. New site = a `sites.js` block + its hosts in all three manifests + `test.html` cases (§8); no
   edits to core / content / options / `DEFAULT_SETTINGS` / `TRANSLATIONS`.
5. New feature works on Chrome, Firefox, and Safari; manifests + load lists in sync (§1, §4).
6. New/changed user-facing text covers every language (§6).
7. Any doc this change makes false (README / DEVELOPMENT / this file) is updated in the same change.
8. No generated files under `chrome/` / `firefox/` / `safari/` were committed.
