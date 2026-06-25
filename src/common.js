// VX Link Share - Shared Common Logic
// This file is loaded first in all execution contexts (background, content, options).

const VX = {
    // Default settings
    DEFAULT_SETTINGS: {
        language: "system",
        sites: {
            x: true,
            reddit: true,
            bilibili: true,
            pixiv: true
        }
    },

    // Language display names (auto-populated in options dropdown)
        LANGUAGE_DISPLAY: {
            en: "English",
            zh: "中文"
        },

        // Combined Translation dictionary
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
            resetSuccess: "Settings reset to defaults!",
            twitter: "X / Twitter",
            reddit: "Reddit",
            bilibili: "Bilibili",
            pixiv: "Pixiv",
            creditTwitterDesc: "Enhanced Twitter/X link viewer",
            creditRedditDesc: "Enhanced Reddit link viewer",
            creditBilibiliDesc: "Enhanced Bilibili link viewer",
            creditPixivDesc: "Enhanced Pixiv link viewer"
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
            resetSuccess: "设置已重置为默认值!",
            twitter: "X / 推特",
            reddit: "Reddit",
            bilibili: "哔哩哔哩",
            pixiv: "Pixiv",
            creditTwitterDesc: "增强型 Twitter/X 链接查看器",
            creditRedditDesc: "增强型 Reddit 链接查看器",
            creditBilibiliDesc: "增强型哔哩哔哩链接查看器",
            creditPixivDesc: "增强型 Pixiv 链接查看器"
        }
    },

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

    // Get standard translated strings for options/content script
    getStrings(lang) {
        return VX.TRANSLATIONS[lang] || VX.TRANSLATIONS.en;
    },

    // Load full settings merged with defaults
    loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(null, (result) => {
                const settings = result || {};
                const merged = {
                    language: settings.language || VX.DEFAULT_SETTINGS.language,
                    sites: {
                        x: settings.sites?.x !== undefined ? settings.sites.x : VX.DEFAULT_SETTINGS.sites.x,
                        reddit: settings.sites?.reddit !== undefined ? settings.sites.reddit : VX.DEFAULT_SETTINGS.sites.reddit,
                        bilibili: settings.sites?.bilibili !== undefined ? settings.sites.bilibili : VX.DEFAULT_SETTINGS.sites.bilibili,
                        pixiv: settings.sites?.pixiv !== undefined ? settings.sites.pixiv : VX.DEFAULT_SETTINGS.sites.pixiv
                    }
                };
                resolve(merged);
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

    // Clean tracking query parameters and convert URL to sharing format
    convert(url) {
        try {
            const u = new URL(url);
            u.hash = "";

            // General tracking parameter blacklist (applies to all sites)
            [
                "spm_id_from", "from_spmid", "vd_source", "share_source",
                "share_medium", "share_plat", "share_session_id", "share_tag",
                "unique_k", "timestamp", "bbid", "s", "mx", "ref_src",
                // Bilibili / General parameter extensions
                "buvid", "buvid_from", "is_story_h5", "spmid", "spmid_from",
                "share_spmid", "from", "fromsource", "seid", "plat_id", "ts",
                "track_id", "signCoverage", "msource", "bsource", "ssource",
                "mao2_medium", "mao2_source", "cover_shid", "shid", "refer_url",
                "share_id", "share_medium_id", "share_plat_id", "share_channel",
                "share_token", "share_origin", "share_session", "attach", "fr",
                "extension", "argv", "auto_play", "preview_template", "forward",
                "intro", "network", "platform", "wifiAutoPlay", "screenName", "nm",
                "goto", "mobile_pkg", "camp_id", "vc_name", "vc_source", "csource",
                "ha_source", "ha_method", "from_spmid_from", "share_source_mutation",
                "session_id", "share_tag_id", "promotion_id", "ttk_id",
                "union_source", "branch_pid", "webid",
                // Standard Google Analytics campaign parameters
                "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "utm_custom"
            ].forEach(p => u.searchParams.delete(p));

            const h = u.hostname.replace(/^www\./, "");
            let isBili = false;

            if (h === "x.com" || h === "twitter.com") {
                u.hostname = "vxtwitter.com";
                u.searchParams.delete("t"); // Strip t for X/Twitter specifically
            } else if (h === "reddit.com") {
                u.hostname = "vxreddit.com";
            } else if (h === "pixiv.net") {
                u.hostname = "phixiv.net";
            } else if (h === "bilibili.com" || h.endsWith(".bilibili.com") || h === "b23.tv") {
                u.hostname = "vxbilibili.com";
                isBili = true;
            }

            // Bilibili Whitelist logic (only keep necessary parameters)
            if (isBili) {
                const biliAllowed = new Set([
                    "p",          // video part index
                    "t",          // timestamp start parameter
                    "ep_id",      // episode ID
                    "season_id",  // season ID
                    "ssid",       // season ID alias
                    "cid",        // video component ID
                    "aid",        // video ID (avid)
                    "bvid"        // video ID (bvid)
                ]);
                [...u.searchParams.keys()].forEach(k => {
                    if (!biliAllowed.has(k)) u.searchParams.delete(k);
                });
            }

            // Standardize output URL structure (remove trailing slashes)
            return u.toString().replace(/\/+$/, "");
        } catch (e) {
            return url;
        }
    },

    // Initialize background script context menu and storage listeners
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

        // Listen for language changes in storage
        apis.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === "sync" && changes.language) {
                updateContextMenu();
            }
        });

        // Listen for context menu clicks
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

        // Initialize context menu with translated title
        updateContextMenu();
    },

    // Write text to clipboard in a platform-compatible way.
    // opts: { tabId?: number, toast?: string, toastFail?: string }
    async writeToClipboard(text, opts = {}) {
        const apis = typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : null);
        if (!apis) return;

        if (apis.scripting) {
            // MV3 service worker (Chrome / Safari). Selecting the context-menu item
            // grants activeTab for the clicked tab, so executeScript succeeds even when
            // that tab's host is not in host_permissions. The injected helper does the
            // clipboard write inside the page (where a user gesture + focus exist) and
            // shows a confirmation toast so the action is never silent.
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

    // Injected into the target tab by executeScript (MV3). MUST be fully self-contained:
    // it is serialized to source and runs in the page with no access to VX or any closure.
    // Copies `text` (Clipboard API, with an execCommand fallback) and shows a brief toast.
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
            // Fallback when the async Clipboard API is unavailable or blocked.
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
