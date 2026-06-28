# VXLinkShare

**VXLinkShare** (a.k.a. **VX Link Helper**) is a cross-browser extension that turns
social-media links into clean, **embed-friendly** links. It rewrites supported sites to
community “fix-up” preview domains so links show better image/video previews when pasted into
Discord, Telegram, and other chat apps — and it can strip tracking parameters along the way.

Everything runs locally in the browser. The extension does not send your links to a server.

## Supported sites

| You copy a link from | Default enhanced preview domain | Notes |
| --- | --- | --- |
| X / Twitter (`x.com`, `twitter.com`, mobile subdomains) | `vxtwitter.com` | Also removes X/Twitter share token noise such as `t`. |
| Reddit (`reddit.com`, including `old.`, `np.`, `m.`, …) | `vxreddit.com` | Reddit can also use the alternate `rxddit.com` domain from settings. |
| Bilibili (`bilibili.com` subdomains) | `vxbilibili.com` | Keeps only video/episode-identifying parameters such as `p`, `t`, `aid`, `bvid`, `cid`, `season_id`. |
| Pixiv (`pixiv.net`) | `phixiv.net` | Exact main-domain support; Pixiv product subdomains are left alone. |

## How to use

- **Right-click any link → “Copy VX Link.”** The cleaned, embed-friendly link is copied to the clipboard.
- **Click the in-page “VX” button** injected next to supported sites’ native share/bookmark controls.
  On feed pages, VXLinkShare tries to copy the individual post URL rather than the feed page URL.
- **Click the toolbar icon** to open the settings page.

A short toast confirms successful copy operations.

## Settings

The options page supports:

- **Language selection**: system default plus English, 简体中文, 繁體中文, Español, العربية, Português, Français, 日本語.
- **Per-site domain replacement**: enable/disable preview-domain rewriting independently for each supported site.
- **Per-site tracking cleanup**: clean known tracking parameters independently from domain replacement.
- **Reddit preview-domain choice**: choose `vxreddit.com`, choose `rxddit.com`, or keep the original Reddit domain while still allowing tracking cleanup.
- **Project website link**: opens the official VX Link Helper site.

Settings are stored in `chrome.storage.sync` / browser sync storage where supported. Older boolean per-site settings are normalized automatically to the current split settings model.

## What it cleans

- On supported sites, VXLinkShare can remove known tracking parameters and, if enabled, rewrite the host to the selected preview domain.
- On unrelated sites, it removes only unambiguous tracking/campaign parameters such as `utm_*`, `share_*`, `spm_*`, `ref_src`, etc., and otherwise preserves the URL, including functional parameters and hash-based routes.
- `convert()` is designed to be pure, never throw, preserve link identity, and be idempotent.

## Privacy and permissions

- Conversion and clipboard operations run locally in the browser.
- The extension makes no runtime network requests.
- Host permissions are limited to the supported sites.
- Firefox declares `data_collection_permissions.required = ["none"]` for AMO submission.

## Browsers

- Google Chrome / Chromium / Microsoft Edge compatible target (Manifest V3, `chrome/` build output)
- Mozilla Firefox (Manifest V2, `firefox/` build output)
- Apple Safari (Manifest V3, `safari/` build output)

All three browser manifests share the same source files and localized extension metadata.

## Install & build

This repository ships unpacked extension targets for developer-mode loading. The shared source lives in
`src/` and is copied into the per-browser folders by the build scripts.

```bash
# macOS / Linux
./build.sh
./clean.sh

# Windows
build.cmd
clean.cmd
```

See **[DEVELOPMENT.md](DEVELOPMENT.md)** for build, loading, and test instructions, and
**[AGENTS.md](AGENTS.md)** for the architecture and contribution rules.

```text
src/                         # single source of truth (shared JS/HTML/CSS/assets)
  common.js                  # core framework, i18n, settings, convert(), clipboard
  sites.js                   # one self-contained block per supported site
  content.js                 # generic content-script dispatcher
  background.js              # context menu + toolbar action entry point
  options/                   # shared settings page
  _locales/                  # store/manifest localization copied into build targets
  icon32.png ... icon128.png # packaged icons
chrome/ firefox/ safari/     # hand-maintained manifests + generated build output
scripts/                     # verification/capture utilities
tests/fixtures/              # checked-in DOM fixtures for content-script behavior
test.html                    # browser conversion test runner
```

## Testing

Useful checks include:

```bash
./build.sh
node scripts/verify-content-fixtures.js
```

For conversion rules, open `test.html` in a browser, or run an equivalent Node harness against the same `testCases` defined in `test.html`.

## Roadmap

- More supported sites, each as one `VX.registerSite({...})` block in `src/sites.js` plus manifest/test updates.
- Keep store-ready `_locales` metadata, icons, and browser package targets in sync.
- Distribution through Chrome Web Store / Microsoft Edge Add-ons / Firefox Add-ons and Safari packaging.

## Credits

Built on these preview services and community projects:

- **VXTwitter**
- **VXReddit**
- **RXddit**
- **VXBilibili**
- **PhiXiv**

## License

VX Link Helper is open source under the **Mozilla Public License 2.0**. See
[LICENSE](LICENSE) for the full license text.

The project name and logo are trademarks of the maintainers. The MPL-2.0 license covers
the source code, but it does not grant permission to present unofficial builds as the
official VX Link Helper release.
