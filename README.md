# VXLinkShare

**VXLinkShare** (a.k.a. *VX Link Helper*) is a cross-browser extension that turns
social-media links into clean, **embed-friendly** links. It rewrites supported sites to
community "fix-up" preview domains so the link shows a proper image/video preview when you
paste it into Discord, Telegram, and other chat apps — and it strips tracking parameters
along the way.

## Supported sites

| You copy a link from        | It becomes        |
| --------------------------- | ----------------- |
| X / Twitter (`x.com`, `twitter.com`) | `vxtwitter.com`  |
| Reddit (`reddit.com`, incl. `old.`, `np.`, …) | `vxreddit.com` |
| Bilibili (`bilibili.com`)  | `vxbilibili.com` |
| Pixiv (`pixiv.net`)         | `phixiv.net`      |

## How to use

- **Right-click any link → “Copy VX Link.”** The cleaned, embed-friendly link is placed on
  your clipboard, ready to paste.
- **Or click the “VX” button** that appears next to the share/bookmark control on a supported
  page to copy that page's VX link.

A short toast confirms the copy.

## What it cleans

- On a supported site, the link is rewritten to its preview domain and only the parameters
  that identify the content are kept.
- On any other link, VXLinkShare removes only **unambiguous tracking/campaign parameters**
  (`utm_*`, `share_*`, `spm_*`, …) and otherwise leaves the URL — including its `#fragment` —
  untouched, so it never breaks the destination.

## Privacy

Everything runs locally in your browser. The extension makes **no network requests** and
sends your links nowhere.

## Browsers

- Google Chrome / Chromium (Manifest V3)
- Mozilla Firefox (Manifest V2)
- Apple Safari (Manifest V3)

The options page offers per-site controls for domain replacement, tracking cleanup, Reddit's alternate `rxddit.com` domain, and a language switch.

## Install & build

This repo ships unpacked extensions you load in developer mode. The shared source lives in
`src/` and is copied into the per-browser folders by a build script. See
**[DEVELOPMENT.md](DEVELOPMENT.md)** for build, load, and test instructions, and
**[AGENTS.md](AGENTS.md)** for the architecture and contribution rules.

```
src/                     # single source of truth (shared JS/HTML/CSS)
  common.js              #   core framework + VX global
  sites.js               #   one self-contained block per supported site
  content.js, background.js, options/
chrome/  firefox/  safari/   # each holds its manifest.json; rest is built output
```

## Roadmap

- More supported sites (each is one block in `src/sites.js`).
- Bundle web fonts locally and keep store-ready `_locales` metadata in sync with the extension languages.
- Distribution via the Chrome Web Store / Firefox Add-ons.

## Credits

Built on these open-source preview services: **VXTwitter**, **VXReddit**, **RXddit**,
**VXBilibili**, and **PhiXiv**.

## License

VX Link Helper is open source under the **Mozilla Public License 2.0**. See
[LICENSE](LICENSE) for the full license text.

The project name and logo are trademarks of the maintainers. The MPL-2.0 license covers
the source code, but it does not grant permission to present unofficial builds as the
official VX Link Helper release.
