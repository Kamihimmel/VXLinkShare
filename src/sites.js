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
//   rewrite(u,h) convert(): mutate the URL object in place (host swap, path, whitelist)
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
            u.searchParams.delete("t"); // tracking token on X/Twitter share links
        },
        contentMatch: (host) => host.includes("x.com") || host.includes("twitter.com"),
        inject: (ctx) => {
            document.querySelectorAll('button[data-testid="bookmark"]').forEach((el) => {
                const parent = el.parentElement;
                if (!parent || parent.querySelector("[data-vxbtn]")) return;

                // Find this article's own tweet permalink so the button copies the
                // specific tweet, not just the current page.
                let tweetUrl = null;
                const article = el.closest("article");
                if (article) {
                    for (const link of article.querySelectorAll('a[href*="/status/"]')) {
                        const href = link.getAttribute("href");
                        if (href && /\/status\/\d+/.test(href)) {
                            tweetUrl = new URL(href, location.origin).href;
                            break;
                        }
                    }
                }

                const b = ctx.makeBtn(ctx.strings.btnVX, () => ctx.copyUrl(tweetUrl || location.href));
                b.setAttribute("data-vxbtn", "1");
                el.insertAdjacentElement("afterend", b);
            });
        },
        meta: {
            defaultEnabled: true,
            domains: "twitter.com, x.com",
            label: { en: "X / Twitter", zh: "X / 推特" },
            credit: {
                name: "VXTwitter",
                url: "https://vxtwitter.com",
                desc: { en: "Enhanced Twitter/X link viewer", zh: "增强型 Twitter/X 链接查看器" }
            }
        }
    });

    // ---------------------------------------------------------------------- Reddit
    VX.registerSite({
        key: "reddit",
        // All reddit subdomains (old., new., np., i., m., ...) serve the same paths.
        match: (h) => h === "reddit.com" || h.endsWith(".reddit.com"),
        rewrite: (u) => { u.hostname = "vxreddit.com"; },
        contentMatch: (host) => host.includes("reddit.com"),
        inject: (ctx) => {
            const share = [...document.querySelectorAll("button,a")]
                .find((el) => /share/i.test(el.textContent || ""));
            if (!share || document.querySelector("[data-rxbtn]")) return;
            const b = ctx.makeBtn(ctx.strings.btnVX, () => ctx.copyUrl(location.href));
            b.setAttribute("data-rxbtn", "1");
            share.insertAdjacentElement("afterend", b);
        },
        meta: {
            defaultEnabled: true,
            domains: "reddit.com",
            label: { en: "Reddit", zh: "Reddit" },
            credit: {
                name: "VXReddit",
                url: "https://vxreddit.com",
                desc: { en: "Enhanced Reddit link viewer", zh: "增强型 Reddit 链接查看器" }
            }
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
            label: { en: "Pixiv", zh: "Pixiv" },
            credit: {
                name: "PhiXiv",
                url: "https://phixiv.net",
                desc: { en: "Enhanced Pixiv link viewer", zh: "增强型 Pixiv 链接查看器" }
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
    // b23.tv short paths we can expand client-side (id is already in the path).
    const B23_ID = /^\/(BV[0-9A-Za-z]{10}|av\d+)\/?$/;

    VX.registerSite({
        key: "bilibili",
        match: (h, u) => {
            if (h === "bilibili.com" || h.endsWith(".bilibili.com")) return true;
            // b23.tv is a shortener; only own it when the path carries a video id.
            // Opaque codes (b23.tv/mUkdytX) can't be expanded without following the
            // redirect (a network call convert() must not make), so we leave them.
            if (h === "b23.tv") return B23_ID.test(u.pathname);
            return false;
        },
        rewrite: (u, h) => {
            u.hostname = "vxbilibili.com";
            if (h === "b23.tv") {
                const id = u.pathname.match(B23_ID)[1];
                u.pathname = "/video/" + id;
            }
            // Whitelist: keep only params that identify the video/episode.
            [...u.searchParams.keys()].forEach((k) => {
                if (!BILI_ALLOWED.has(k)) u.searchParams.delete(k);
            });
        },
        contentMatch: (host) => host.includes("bilibili.com"),
        inject: (ctx) => {
            const shareItem = document
                .querySelector("#share-btn-outer")
                ?.closest(".toolbar-left-item-wrap");
            if (!shareItem || document.querySelector("[data-vxbtn-bili]")) return;

            const clone = shareItem.cloneNode(true);
            clone.setAttribute("data-vxbtn-bili", "1");
            clone.querySelectorAll(".van-popover").forEach((e) => e.remove());

            const shareBtn = clone.querySelector("#share-btn-outer");
            if (!shareBtn) return;
            shareBtn.id = "vx-share-btn";
            shareBtn.removeAttribute("aria-describedby");

            const text = shareBtn.querySelector(".video-share-info-text");
            if (text) text.textContent = ctx.strings.btnVX;
            const icon = shareBtn.querySelector("svg");
            if (icon) icon.remove();

            shareBtn.style.cursor = "pointer";
            shareBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                ctx.copyUrl(location.href);
            });

            shareItem.insertAdjacentElement("afterend", clone);
        },
        meta: {
            defaultEnabled: true,
            domains: "bilibili.com, b23.tv",
            label: { en: "Bilibili", zh: "哔哩哔哩" },
            credit: {
                name: "VXBilibili",
                url: "https://vxbilibili.com",
                desc: { en: "Enhanced Bilibili link viewer", zh: "增强型哔哩哔哩链接查看器" }
            }
        }
    });
})();
