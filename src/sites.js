// VX Link Share - Site definitions.
//
// Loaded after common.js in every context. Each site is ONE self-contained
// VX.registerSite({...}) block; adding/removing/editing a site touches only its
// own block here (and the load-list wiring — see AGENTS.md). The core (common.js)
// never references a specific site.
//
// Site contract:
//   key          unique id, also the settings.sites key
//   match(h, u)  convert(): does this handler own host h? (h = hostname minus "www.")
//   rewrite(u,h,opts) convert(): mutate the URL object for domain replacement
//   clean(u,h)    convert(): optional site-specific tracking cleanup
//   contentMatch(host)  content script: should we inject the VX button on this host?
//   inject(ctx)  content script: place the VX button (ctx = { strings, makeBtn,
//                toast, copyUrl, convert })
//   meta         { defaultEnabled, domains, label{lang}, credit{name,url,desc{lang}} }

(function () {
    "use strict";
    const VX = (typeof globalThis !== "undefined" && globalThis.VX) || require("./common.js");

    // ---------------------------------------------------------------- X / Twitter
    VX.registerSite({
        key: "x",
        match: (h) => h === "x.com" || h === "twitter.com"
            || h === "mobile.x.com" || h === "mobile.twitter.com",
        rewrite: (u) => {
            u.hostname = "vxtwitter.com";
        },
        clean: (u) => {
            u.searchParams.delete("t"); // tracking token on X/Twitter share links
        },
        contentMatch: (host) => host.includes("x.com") || host.includes("twitter.com"),
        inject: (ctx) => {
            const tweetUrlFor = (article) => {
                if (!article) return location.href;
                for (const link of article.querySelectorAll('a[href*="/status/"]')) {
                    const href = link.getAttribute("href");
                    if (href && /\/status\/\d+/.test(href)) {
                        return new URL(href, location.origin).href;
                    }
                }
                const tweetId = article.getAttribute("data-tweet-id");
                if (tweetId && /^\d+$/.test(tweetId)) {
                    const pathMatch = location.pathname.match(/^\/([^/]+)\/status\//);
                    const handle = pathMatch ? pathMatch[1] : "i";
                    return new URL(`/${handle}/status/${tweetId}`, location.origin).href;
                }
                return location.href;
            };

            const insertionAnchorFor = (anchor) => {
                const label = (anchor.getAttribute("aria-label") || "").trim().toLowerCase();
                if (label !== "bookmark" || !anchor.parentElement) return anchor;

                // X wraps the bookmark icon and count in a hover group. Inserting VX
                // inside that group makes bookmark and VX highlight together. Place VX
                // after the whole action item instead: bookmark icon + count -> VX -> share.
                const actionItem = anchor.closest("div.inline-flex");
                if (actionItem && actionItem.parentElement) return actionItem;
                return anchor;
            };

            const addButton = (anchor) => {
                const article = anchor.closest("article");
                const scope = article || anchor.parentElement || document;
                const insertionAnchor = insertionAnchorFor(anchor);
                if (!insertionAnchor.parentElement || scope.querySelector("[data-vxbtn]")) return;
                const b = ctx.makeBtn(ctx.strings.btnVX, () => ctx.copyUrl(tweetUrlFor(article)));
                b.setAttribute("data-vxbtn", "1");
                // X/Twitter does not reliably expose its font stack through inheritance
                // to injected buttons. Match the computed tweet text fallback stack so
                // VX does not fall back to Times New Roman on Chrome/Firefox.
                b.style.fontFamily = 'TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
                insertionAnchor.insertAdjacentElement("afterend", b);
            };

            // Logged-in X currently exposes a data-testid bookmark button. Logged-out
            // permalink pages use only accessible-label buttons and place the share
            // control at the end of the action row, so fall back to those selectors.
            document.querySelectorAll("article").forEach((article) => {
                const anchor = article.querySelector('button[data-testid="bookmark"]')
                    || article.querySelector('button[aria-label="Bookmark" i]')
                    || article.querySelector('button[aria-label="Share" i]');
                if (anchor) addButton(anchor);
            });

            // Last-resort fallback for non-article layouts.
            if (document.querySelector("[data-vxbtn]")) return;
            const fallback = document.querySelector('button[data-testid="bookmark"]')
                || document.querySelector('button[aria-label="Bookmark" i]')
                || document.querySelector('button[aria-label="Share" i]');
            if (fallback) addButton(fallback);
        },
        meta: {
            defaultEnabled: true,
            domains: "twitter.com, x.com",
            replacementDomains: { vx: "vxtwitter.com" },
            label: { en: "X / Twitter", zh: "X / 推特", "zh-TW": "X / 推特" },
            credit: {
                name: "VXTwitter",
                url: "https://vxtwitter.com",
                desc: {
                    en: "Enhanced Twitter/X link viewer",
                    zh: "增强型 Twitter/X 链接查看器",
                    "zh-TW": "增強型 Twitter/X 連結檢視器",
                    es: "Visor mejorado de enlaces de Twitter/X",
                    ar: "عارض محسّن لروابط Twitter/X",
                    pt: "Visualizador aprimorado de links do Twitter/X",
                    fr: "Lecteur de liens Twitter/X amélioré",
                    ja: "Twitter/X リンクの強化ビューア"
                }
            }
        }
    });

    // ---------------------------------------------------------------------- Reddit
    VX.registerSite({
        key: "reddit",
        // All reddit subdomains (old., new., np., i., m., ...) serve the same paths.
        match: (h) => h === "reddit.com" || h.endsWith(".reddit.com"),
        rewrite: (u, h, opts = {}) => {
            u.hostname = opts.replacement === "rx" ? "rxddit.com" : "vxreddit.com";
        },
        contentMatch: (host) => host.includes("reddit.com"),
        inject: (ctx) => {
            const postUrl = (post) => {
                const permalink = post.getAttribute("permalink") || post.getAttribute("data-permalink");
                if (permalink) return new URL(permalink, location.origin).href;

                const link = post.querySelector('a[href*="/comments/"]');
                const href = link && link.getAttribute("href");
                return href ? new URL(href, location.origin).href : location.href;
            };

            const hasButton = (scope) => !!(
                scope.querySelector("[data-rxbtn]")
                || scope.shadowRoot?.querySelector("[data-rxbtn]")
            );

            const isShareControl = (el) => {
                if (!el) return false;
                const name = (el.getAttribute("aria-label") || el.textContent || "").trim().toLowerCase();
                return /\bshare\b/.test(name) && !/\bshared\b/.test(name);
            };

            const addButton = (anchor, url, scope) => {
                if (!anchor || hasButton(scope)) return;
                const b = ctx.makeBtn(ctx.strings.btnVX, () => ctx.copyUrl(url));
                b.setAttribute("data-rxbtn", "1");
                b.style.cssText += `
                    display:inline-flex;
                    align-items:center;
                    justify-content:center;
                    min-height:32px;
                    padding:0 8px;
                    margin-left:8px;
                    border-radius:999px;
                    background:var(--color-secondary-background, rgba(255,255,255,.10));
                    color:var(--color-neutral-content-strong, currentColor);
                    font-size:0.75rem;
                    font-weight:600;
                    opacity:1;
                    position:relative;
                    z-index:4;
                    pointer-events:auto;
                `;
                b.addEventListener("mouseenter", () => { b.style.opacity = "1"; });
                b.addEventListener("mouseleave", () => { b.style.opacity = "1"; });
                anchor.insertAdjacentElement("afterend", b);
            };

            const hasPostShareButton = (el) => !!(
                el && (
                    el.matches?.("shreddit-post-share-button")
                    || el.querySelector?.("shreddit-post-share-button")
                )
            );

            const slotHasShare = (slot) => {
                if (hasPostShareButton(slot)) return true;
                const assigned = typeof slot.assignedElements === "function"
                    ? slot.assignedElements({ flatten: true })
                    : [];
                return assigned.some(hasPostShareButton);
            };

            const feedShareSlot = (post) => {
                const roots = [post.shadowRoot, post].filter(Boolean);
                for (const root of roots) {
                    const slots = [...root.querySelectorAll(".shreddit-post-container > slot")];
                    const shareSlot = slots.find(slotHasShare)
                        // Reddit home feed exposes the bottom action row inside the
                        // post shadow root; the share control is the fourth slot.
                        || root.querySelector(".shreddit-post-container > slot:nth-child(4)");
                    if (shareSlot) return shareSlot;
                }
                return null;
            };

            // New Reddit feed/permalink pages render each post as <shreddit-post>.
            // Keep the permalink-page insertion point on the post's own button (the
            // original correct placement), while homepage/feed cards expose their share
            // control through a slot under .shreddit-post-container. Scope per post so
            // one button on the feed does not block injection on later posts, and so
            // copied URLs point at the individual post instead of reddit.com/.
            document.querySelectorAll("shreddit-post").forEach((post) => {
                const share = post.querySelector('rpl-dropdown[slot="ssr-share-button"] button')
                    || post.querySelector('button[aria-label="Share" i]')
                    || feedShareSlot(post)
                    || post.querySelector("shreddit-post-share-button")
                    || post.querySelector('button[data-testid="share"]')
                    || [...post.querySelectorAll("button, a")].find(isShareControl)
                    // Home feed SSR can omit the action/share row entirely; the
                    // per-post overflow menu is still present and is a stable,
                    // item-scoped anchor, similar to X/Twitter's per-article
                    // button selector strategy.
                    || post.querySelector('shreddit-post-overflow-menu button[aria-label="Open user actions" i]');
                addButton(share, postUrl(post), post);
            });

            // Old Reddit / other layouts: first control whose accessible name is exactly
            // "share" (not "shared by ...", a username containing "share", etc.).
            if (document.querySelector("[data-rxbtn]")) return;
            const legacyShare = [...document.querySelectorAll("button, a")].find((el) => {
                const name = (el.getAttribute("aria-label") || el.textContent || "").trim().toLowerCase();
                return name === "share";
            });
            addButton(legacyShare, location.href, document);
        },
        meta: {
            defaultEnabled: true,
            domains: "reddit.com",
            replacementDomains: { vx: "vxreddit.com", rx: "rxddit.com" },
            label: { en: "Reddit", zh: "Reddit" },
            credit: {
                name: "VXReddit",
                url: "https://vxreddit.com",
                desc: {
                    en: "Enhanced Reddit link viewer",
                    zh: "增强型 Reddit 链接查看器",
                    "zh-TW": "增強型 Reddit 連結檢視器",
                    es: "Visor mejorado de enlaces de Reddit",
                    ar: "عارض محسّن لروابط Reddit",
                    pt: "Visualizador aprimorado de links do Reddit",
                    fr: "Lecteur de liens Reddit amélioré",
                    ja: "Reddit リンクの強化ビューア"
                }
            },
            extraCredits: [
                {
                    name: "RXddit",
                    url: "https://rxddit.com",
                    desc: {
                        en: "Alternative enhanced Reddit link viewer",
                        zh: "另一种增强型 Reddit 链接查看器",
                        "zh-TW": "另一種增強型 Reddit 連結檢視器",
                        es: "Visor alternativo mejorado de enlaces de Reddit",
                        ar: "عارض بديل محسّن لروابط Reddit",
                        pt: "Visualizador alternativo aprimorado de links do Reddit",
                        fr: "Lecteur alternatif amélioré de liens Reddit",
                        ja: "Reddit リンクの代替強化ビューア"
                    }
                }
            ]
        }
    });

    // ----------------------------------------------------------------------- Pixiv
    VX.registerSite({
        key: "pixiv",
        // Exact: subdomains (sketch., dic., ...) are separate products phixiv can't render.
        match: (h) => h === "pixiv.net",
        rewrite: (u) => { u.hostname = "phixiv.net"; },
        contentMatch: (host) => host.includes("pixiv.net"),
        inject: (ctx) => {
            // The Pixiv share button is a text-less SVG; locate it by its path data.
            const share = document
                .querySelector('button svg path[d*="M25,17 L25,24"]')
                ?.closest("button");
            if (!share || document.querySelector("[data-phbtn]")) return;
            const b = ctx.makeBtn(ctx.strings.btnVX, () => ctx.copyUrl(location.href));
            b.setAttribute("data-phbtn", "1");
            share.insertAdjacentElement("afterend", b);
        },
        meta: {
            defaultEnabled: true,
            domains: "pixiv.net",
            replacementDomains: { vx: "phixiv.net" },
            label: { en: "Pixiv", zh: "Pixiv" },
            credit: {
                name: "PhiXiv",
                url: "https://phixiv.net",
                desc: {
                    en: "Enhanced Pixiv link viewer",
                    zh: "增强型 Pixiv 链接查看器",
                    "zh-TW": "增強型 Pixiv 連結檢視器",
                    es: "Visor mejorado de enlaces de Pixiv",
                    ar: "عارض محسّن لروابط Pixiv",
                    pt: "Visualizador aprimorado de links do Pixiv",
                    fr: "Lecteur de liens Pixiv amélioré",
                    ja: "Pixiv リンクの強化ビューア"
                }
            }
        }
    });

    // -------------------------------------------------------------------- Bilibili
    const BILI_ALLOWED = new Set([
        "p",          // video part index
        "t",          // timestamp start parameter
        "ep_id",      // episode ID
        "season_id",  // season ID
        "ssid",       // season ID alias
        "cid",        // video component ID
        "aid",        // video ID (avid)
        "bvid"        // video ID (bvid)
    ]);
    VX.registerSite({
        key: "bilibili",
        match: (h) => h === "bilibili.com" || h.endsWith(".bilibili.com"),
        rewrite: (u) => {
            u.hostname = "vxbilibili.com";
        },
        clean: (u) => {
            // Whitelist: keep only params that identify the video/episode.
            // Firefox content scripts can expose URLSearchParams#keys() as a
            // non-iterable object, so collect keys via forEach instead of
            // spreading keys().
            const keys = [];
            u.searchParams.forEach((_, k) => keys.push(k));
            keys.forEach((k) => {
                if (!BILI_ALLOWED.has(k)) u.searchParams.delete(k);
            });
        },
        contentMatch: (host) => host.includes("bilibili.com"),
        inject: (ctx) => {
            const shareItem = document
                .querySelector("#share-btn-outer")
                ?.closest(".toolbar-left-item-wrap");
            if (!shareItem) {
                console.debug("[VX DEBUG][bilibili] inject skipped", {
                    hasShareItem: false,
                    href: location.href
                });
                return;
            }
            if (document.querySelector("[data-vxbtn-bili]")) return;
            const injectDetails = ctx.debugConvert(location.href);
            console.debug("[VX DEBUG][bilibili] injecting VX button", {
                debugBuildId: ctx.debugBuildId,
                href: location.href,
                converted: ctx.convert(location.href),
                convertSummary: injectDetails.summary,
                convertDetails: injectDetails,
                shareItemClass: shareItem.className || ""
            });

            const wrapper = document.createElement("div");
            wrapper.className = shareItem.className || "toolbar-left-item-wrap";
            wrapper.setAttribute("data-vxbtn-bili", "1");

            const shareBtn = document.createElement("button");
            shareBtn.textContent = ctx.strings.btnVX;
            shareBtn.id = "vx-share-btn";
            shareBtn.type = "button";
            shareBtn.style.cssText = `
                display:inline-flex;
                align-items:center;
                justify-content:center;
                cursor:pointer;
                opacity:1;
                color:inherit;
                background:transparent;
                border:0;
                padding:0;
                font:inherit;
            `;
            shareBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
                const raw = location.href;
                const converted = ctx.convert(raw);
                const convertDetails = ctx.debugConvert(raw);
                console.debug("[VX DEBUG][bilibili] VX click", {
                    debugBuildId: ctx.debugBuildId,
                    raw,
                    converted,
                    convertSummary: convertDetails.summary,
                    convertDetails
                });
                Promise.resolve(ctx.copyUrl(converted))
                    .then((written) => console.debug("[VX DEBUG][bilibili] copyUrl resolved", { written }))
                    .catch((error) => console.error("[VX DEBUG][bilibili] copyUrl failed", error));
            }, true);

            wrapper.appendChild(shareBtn);
            shareItem.insertAdjacentElement("afterend", wrapper);
        },
        meta: {
            defaultEnabled: true,
            domains: "bilibili.com",
            replacementDomains: { vx: "vxbilibili.com" },
            label: { en: "Bilibili", zh: "哔哩哔哩", "zh-TW": "嗶哩嗶哩" },
            credit: {
                name: "VXBilibili",
                url: "https://vxbilibili.com",
                desc: {
                    en: "Enhanced Bilibili link viewer",
                    zh: "增强型哔哩哔哩链接查看器",
                    "zh-TW": "增強型嗶哩嗶哩連結檢視器",
                    es: "Visor mejorado de enlaces de Bilibili",
                    ar: "عارض محسّن لروابط Bilibili",
                    pt: "Visualizador aprimorado de links do Bilibili",
                    fr: "Lecteur de liens Bilibili amélioré",
                    ja: "Bilibili リンクの強化ビューア"
                }
            }
        }
    });
})();
