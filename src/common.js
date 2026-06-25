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

    // Clean tracking query parameters and convert URL to sharing format.
    // Scoping matters: on a recognized (rewritten) host we clean aggressively, but on
    // any other URL we only strip unambiguous global trackers and otherwise leave the
    // link untouched (functional params and #fragment preserved) so we never break it.
    convert(url) {
        try {
            const u = new URL(url);

            const h = u.hostname.replace(/^www\./, "");
            const isX = (h === "x.com" || h === "twitter.com");
            const isReddit = (h === "reddit.com");
            const isPixiv = (h === "pixiv.net");
            const isBili = (h === "bilibili.com" || h.endsWith(".bilibili.com") || h === "b23.tv");
            const isSupported = isX || isReddit || isPixiv || isBili;

            // Global trackers: unambiguous tracking/campaign params, safe to strip from
            // ANY URL — they carry no content identity and never act as functional keys.
            [
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
            ].forEach(p => u.searchParams.delete(p));

            // Generic-but-risky params: these names are commonly used as FUNCTIONAL keys
            // on arbitrary sites (search, redirects, sessions...), so only strip them once
            // we've recognized the host as a supported, rewritten site.
            if (isSupported) {
                [
                    "s", "from", "goto", "forward", "intro", "network", "platform",
                    "session_id", "timestamp", "ts", "fr", "nm", "mx", "attach",
                    "argv", "extension", "screenName", "seid", "plat_id", "webid",
                    "bbid", "unique_k", "is_story_h5", "auto_play", "wifiAutoPlay",
                    "preview_template", "mobile_pkg"
                ].forEach(p => u.searchParams.delete(p));

                // The fragment carries no share-relevant information on these sites.
                u.hash = "";
            }

            if (isX) {
                u.hostname = "vxtwitter.com";
                u.searchParams.delete("t"); // tracking token on X/Twitter share links
            } else if (isReddit) {
                u.hostname = "vxreddit.com";
            } else if (isPixiv) {
                u.hostname = "phixiv.net";
            } else if (isBili) {
                u.hostname = "vxbilibili.com";
                // Whitelist: keep only params that identify the video/episode.
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

            // Normalize trailing slashes only on rewritten hosts; leave arbitrary
            // links' paths exactly as given.
            let out = u.toString();
            if (isSupported) out = out.replace(/\/+$/, "");
            return out;
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
        apis.contextMenus.onClicked.addListener(async (info) => {
            if (info.menuItemId !== "copy-vx-link") return;
            const text = VX.convert(info.linkUrl);
            await VX.writeToClipboard(text);
        });

        // Initialize context menu with translated title
        updateContextMenu();
    },

    // Write text to clipboard in a platform-compatible way
    async writeToClipboard(text) {
        const apis = typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : null);
        if (!apis) return;

        if (apis.scripting) {
            // MV3 Service Worker (Chrome)
            try {
                const [tab] = await apis.tabs.query({ active: true, currentWindow: true });
                if (!tab || !tab.id) return;

                await apis.scripting.executeScript({
                    target: { tabId: tab.id },
                    args: [text],
                    func: (t) => navigator.clipboard.writeText(t)
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
    }
};

// Expose VX globally in different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VX;
} else if (typeof globalThis !== 'undefined') {
    globalThis.VX = VX;
}
