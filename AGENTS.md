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
| `bilibili.com` / `b23.tv`    | `vxbilibili.com` |

---

## 1. Architecture contract

- **`src/` is the only place you write code.** The `chrome/`, `firefox/`, and `safari/` folders
  hold exactly one hand-maintained file each — their `manifest.json`. Everything else there is
  copied from `src/` by the build and is gitignored. Never hand-edit a generated copy; never
  commit one.
- **No toolchain creep.** The project MUST stay buildable by file copy alone (`build.sh` is just
  `cp`). Do not introduce npm packages, bundlers, transpilers, TypeScript, or UI frameworks.
  Runtime code is dependency-free vanilla JS/HTML/CSS.
- **One-way dependencies.** `common.js` (the `VX` global) is the shared library: it MUST NOT
  depend on `background.js`, `content.js`, or `options/`. Everything depends on `VX`; `VX` depends
  on nothing. It loads first in every context, so keep it free of top-level side effects beyond
  defining `VX`.

## 2. `VX` is the public API — keep it stable

`common.js` exposes a single global, `VX`, consumed by background/content/options **and** by
`test.html`. Treat its surface as a contract; if you change a member's signature or behavior,
update every call site and `test.html` in the same change.

| Member                              | Contract                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| `convert(url)`                      | Pure URL transform — see §3.                                          |
| `DEFAULT_SETTINGS`                  | The schema + fallback for all settings; every key has a default.     |
| `loadSettings` / `saveSettings`     | The only sanctioned read/write path to settings (§7).                |
| `getCurrentLanguage` / `getStrings` | The only sanctioned way to resolve i18n strings (§6).                |
| `initBackground` / `writeToClipboard` | Background entry + cross-MV clipboard write (§4).                   |

## 3. `convert(url)` behavioral contract

This is the core of the product. It MUST:

- be **pure** — no I/O, no storage, no global mutation; output depends only on the input string;
- **never throw** — on any parse/processing failure, return the original `url` unchanged;
- be **idempotent** — `convert(convert(x)) === convert(x)`;
- **preserve link identity** — it may only (a) strip known tracking params and (b) rewrite a
  supported host to its `vx` equivalent. It MUST NOT change the path or drop any parameter that
  changes *which* content the link points to. When a host needs to keep certain params, use an
  explicit allow-list (as Bilibili does) — never guess;
- stay **scoped** — only hosts in the supported-sites table get rewritten; every other URL
  receives generic tracking-param cleanup only.

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

- No hardcoded user-facing text. Every visible string flows through `VX.TRANSLATIONS`, referenced
  by a `data-i18n` attribute in HTML or `getStrings()` in JS.
- A string added for one language MUST be added for **all** languages.
- Adding a language = add entries to `TRANSLATIONS` and `LANGUAGE_DISPLAY` only; the options
  dropdown auto-populates from them, so don't hand-edit the option markup.

## 7. Settings & storage contract

- Settings live in `chrome.storage.sync` and are ALWAYS read via `VX.loadSettings()`, merged
  against `DEFAULT_SETTINGS`. Never assume a key exists on the raw storage object.
- Schema changes stay backward compatible: a new setting needs a default in `DEFAULT_SETTINGS`
  and a fallback at every read site, so older synced data keeps working.

## 8. Consistency contract: a "supported site" is defined in many places

A site is not "added" until all of these agree (and `./build.sh` has run):

`convert()` rewrite + any allow-list · `DEFAULT_SETTINGS.sites` · `TRANSLATIONS` (label + credit) ·
`content.js` inject function wired into `run()` behind its `sites.<key>` flag · `options.html` +
`options.js` toggle · all three `manifest.json` (`host_permissions`/`permissions` +
`content_scripts.matches`) · `test.html` cases. Removing a site means removing it from all of them.

## 9. Definition of done

1. Edited only under `src/` (+ manifests); ran `./build.sh` so platform copies match source.
2. `convert()`/params changed → `test.html` updated and fully green.
3. New feature works on Chrome, Firefox, and Safari; manifests in sync (§4).
4. New/changed user-facing text covers every language (§6).
5. Any doc this change makes false (README / DEVELOPMENT / this file) is updated in the same change.
6. No generated files under `chrome/` / `firefox/` / `safari/` were committed.
