// VX Link Share - Core framework (shared by background, content, options).
//
// This file is loaded FIRST in every execution context. It knows nothing about
// any specific site: site behavior lives in sites.js (loaded next), which calls
// VX.registerSite(). The core just dispatches to that registry.

const VX = {
    // Default settings. `sites` is populated by registerSite() from each site's
    // meta.defaultEnabled, so adding a site needs no edit here.
    DEFAULT_SETTINGS: {
        language: "system",
        sites: {}
    },

    // Language display names (auto-populated in the options dropdown).
    LANGUAGE_DISPLAY: {
        en: "English",
        zh: "中文"
    },

    // Common UI strings only. Per-site labels and credits live in each site's
    // meta (see sites.js), so this dictionary never grows when a site is added.
    TRANSLATIONS: {
        en: {
            menuTitle: "Copy VX Link",
            toastCopied: "Copied VX Link",
            toastCopyFailed: "Copy failed",
            btnVX: "VX",
            title: "VX Link Helper Settings",
            language: "Language / 语言",
            selectLanguage: "Select Language:",
            systemDefault: "System Default",
            enableSites: "Enable Sites",
            toggleDesc: "Toggle VX button appearance on each site",
            credits: "Credits & Thanks",
            creditsDesc: "This plugin relies on the following amazing open-source projects:",
            resetBtn: "Reset to Defaults",
            saveBtn: "Save Settings",
            savedSuccess: "Settings saved successfully!",
            resetSuccess: "Settings reset to defaults!"
        },
        zh: {
            menuTitle: "复制 VX 链接",
            toastCopied: "已复制 VX 链接",
            toastCopyFailed: "复制失败",
            btnVX: "VX",
            title: "VX 链接助手 - 设置",
            language: "语言选择",
            selectLanguage: "选择语言:",
            systemDefault: "系统默认",
            enableSites: "启用网站",
            toggleDesc: "在每个网站上切换 VX 按钮的显示",
            credits: "致谢",
            creditsDesc: "本插件依赖以下优秀的开源项目:",
            resetBtn: "重置为默认值",
            saveBtn: "保存设置",
            savedSuccess: "设置保存成功!",
            resetSuccess: "设置已重置为默认值!"
        }
    },

    // ----- Site registry -----
    // Each entry is a self-contained definition: { key, match, rewrite,
    // contentMatch, inject, meta }. See sites.js and AGENTS.md for the contract.
    sites: [],
    registerSite(def) {
        VX.sites.push(def);
        if (def && def.key) {
            const on = def.meta && def.meta.defaultEnabled;
            VX.DEFAULT_SETTINGS.sites[def.key] = on === undefined ? true : on;
        }
    },

    // Resolve a site's localized label / credit description, with fallbacks.
    getSiteLabel(site, lang) {
        const l = site.meta && site.meta.label;
        return (l && (l[lang] || l.en)) || site.key;
    },
    getCreditDesc(site, lang) {
        const c = site.meta && site.meta.credit;
        const d = c && c.desc;
        return (d && (d[lang] || d.en)) || "";
    },

    // ----- Tracking parameter lists used by convert() -----
    // Global: unambiguous trackers, safe to strip from ANY URL.
    GLOBAL_TRACKERS: [
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "utm_id", "utm_custom",
        "spm_id_from", "from_spmid", "from_spmid_from", "spmid", "spmid_from",
        "share_spmid", "vd_source", "buvid", "buvid_from",
        "share_source", "share_source_mutation", "share_medium", "share_plat",
        "share_session_id", "share_tag", "share_tag_id", "share_id",
        "share_medium_id", "share_plat_id", "share_channel", "share_token",
        "share_origin", "share_session",
        "ref_src", "refer_url", "mao2_medium", "mao2_source", "cover_shid",
        "shid", "track_id", "signCoverage", "msource", "bsource", "ssource",
        "csource", "vc_name", "vc_source", "ha_source", "ha_method",
        "camp_id", "promotion_id", "ttk_id", "union_source", "branch_pid",
        "fromsource"
    ],
    // Site-only: generic names that are often FUNCTIONAL on arbitrary sites, so
    // they are stripped only once a registered site has matched the host.
    SITE_TRACKERS: [
        "s", "from", "goto", "forward", "intro", "network", "platform",
        "session_id", "timestamp", "ts", "fr", "nm", "mx", "attach",
        "argv", "extension", "screenName", "seid", "plat_id", "webid",
        "bbid", "unique_k", "is_story_h5", "auto_play", "wifiAutoPlay",
        "preview_template", "mobile_pkg"
    ],

    // Get browser/system language
    getSystemLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.startsWith("zh")) {
            return "zh";
        }
        return "en";
    },

    // Get active language from sync storage
    getCurrentLanguage() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(["language"], (result) => {
                let lang = (result && result.language) || VX.DEFAULT_SETTINGS.language;
                if (lang === "system") {
                    lang = VX.getSystemLanguage();
                }
                resolve(lang);
            });
        });
    },

    // Get common translated strings
    getStrings(lang) {
        return VX.TRANSLATIONS[lang] || VX.TRANSLATIONS.en;
    },

    // Load full settings merged with defaults (generic over registered sites)
    loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(null, (result) => {
                const stored = result || {};
                const sites = {};
                VX.sites.forEach((site) => {
                    const saved = stored.sites && stored.sites[site.key];
                    sites[site.key] = saved !== undefined
                        ? saved
                        : VX.DEFAULT_SETTINGS.sites[site.key];
                });
                resolve({
                    language: stored.language || VX.DEFAULT_SETTINGS.language,
                    sites
                });
            });
        });
    },

    // Save settings to sync storage
    saveSettings(settings) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.set(settings, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    },

    // Clean tracking query parameters and convert URL to sharing format.
    // Scoping: on a recognized (rewritten) host we clean aggressively; on any
    // other URL we only strip unambiguous global trackers and otherwise leave
    // the link untouched (functional params and #fragment preserved).
    convert(url) {
        try {
            const u = new URL(url);
            const h = u.hostname.replace(/^www\./, "");

            VX.GLOBAL_TRACKERS.forEach(p => u.searchParams.delete(p));

            const site = VX.sites.find(s => {
                try { return s.match && s.match(h, u); } catch (e) { return false; }
            });

            if (site) {
                VX.SITE_TRACKERS.forEach(p => u.searchParams.delete(p));
                u.hash = ""; // no share-relevant fragment on supported sites
                site.rewrite(u, h);
                return u.toString().replace(/\/+$/, "");
            }

            return u.toString();
        } catch (e) {
            return url;
        }
    },

    // Initialize background context menu and storage listeners
    initBackground() {
        const apis = typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : null);
        if (!apis) return;

        const updateContextMenu = async () => {
            const language = await VX.getCurrentLanguage();
            const strings = VX.getStrings(language);

            apis.contextMenus.removeAll(() => {
                apis.contextMenus.create({
                    id: "copy-vx-link",
                    title: strings.menuTitle,
                    contexts: ["link"]
                });
            });
        };

        // Re-title the menu when the language changes
        apis.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === "sync" && changes.language) {
                updateContextMenu();
            }
        });

        // Handle context menu clicks
        apis.contextMenus.onClicked.addListener(async (info, tab) => {
            if (info.menuItemId !== "copy-vx-link") return;
            const strings = VX.getStrings(await VX.getCurrentLanguage());
            const text = VX.convert(info.linkUrl);
            await VX.writeToClipboard(text, {
                tabId: tab && tab.id,
                toast: strings.toastCopied,
                toastFail: strings.toastCopyFailed
            });
        });

        updateContextMenu();
    },

    // Write text to clipboard in a platform-compatible way.
    // opts: { tabId?: number, toast?: string, toastFail?: string }
    async writeToClipboard(text, opts = {}) {
        const apis = typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : null);
        if (!apis) return;

        if (apis.scripting) {
            // MV3 service worker (Chrome / Safari). Selecting the context-menu item
            // grants activeTab for the clicked tab, so executeScript succeeds even
            // when that tab's host is not in host_permissions. The injected helper
            // does the clipboard write in-page and shows a toast so it's never silent.
            try {
                let tabId = opts.tabId;
                if (tabId == null) {
                    const [tab] = await apis.tabs.query({ active: true, currentWindow: true });
                    tabId = tab && tab.id;
                }
                if (tabId == null) return;

                await apis.scripting.executeScript({
                    target: { tabId },
                    args: [text, opts.toast || "", opts.toastFail || ""],
                    func: VX._copyAndToast
                });
            } catch (e) {
                console.error("[VX Link Helper] MV3 clipboard write failed:", e);
            }
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            // MV2 background page (Firefox)
            try {
                await navigator.clipboard.writeText(text);
            } catch (e) {
                console.error("[VX Link Helper] MV2 clipboard write failed:", e);
            }
        } else {
            console.error("[VX Link Helper] Clipboard write not supported in this context");
        }
    },

    // Injected into the target tab by executeScript (MV3). MUST be fully
    // self-contained: it is serialized to source and runs in the page with no
    // access to VX or any closure. Copies text (Clipboard API, execCommand
    // fallback) and shows a brief toast.
    _copyAndToast: async function (text, okMsg, failMsg) {
        const showToast = (msg) => {
            if (!msg || !document.body) return;
            const d = document.createElement("div");
            d.textContent = msg;
            d.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483647;" +
                "background:rgba(0,0,0,.85);color:#fff;padding:8px 12px;border-radius:8px;" +
                "font:13px sans-serif;pointer-events:none;";
            document.body.appendChild(d);
            setTimeout(() => d.remove(), 1500);
        };

        try {
            await navigator.clipboard.writeText(text);
        } catch (e) {
            try {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                const ok = document.execCommand("copy");
                ta.remove();
                if (!ok) throw new Error("execCommand copy returned false");
            } catch (e2) {
                showToast(failMsg);
                return false;
            }
        }
        showToast(okMsg);
        return true;
    }
};

// Expose VX globally in different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VX;
} else if (typeof globalThis !== 'undefined') {
    globalThis.VX = VX;
}
