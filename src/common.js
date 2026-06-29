// VX Link Share - Core framework (shared by background, content, options).
//
// This file is loaded FIRST in every execution context. It knows nothing about
// any specific site: site behavior lives in sites.js (loaded next), which calls
// VX.registerSite(). The core just dispatches to that registry.

const VX = {
    DEBUG_BUILD_ID: "bilibili-debug-v2-2026-06-29",

    // Default settings. `sites` is populated by registerSite() from each site's
    // metadata, so adding a site needs no edit here. Each site setting can
    // independently control domain replacement and tracking cleanup.
    DEFAULT_SETTINGS: {
        language: "system",
        sites: {}
    },

    // Native language display names (auto-populated in the options dropdown).
    // Dropdown order follows TRANSLATIONS key order.
    LANGUAGE_DISPLAY: {
        en: "English",
        zh: "简体中文",
        "zh-TW": "繁體中文",
        es: "Español",
        ar: "العربية",
        pt: "Português",
        fr: "Français",
        ja: "日本語"
    },

    // Right-to-left languages — drives dir="rtl" in the options page and toast.
    RTL_LANGUAGES: ["ar"],
    isRTL(lang) {
        return VX.RTL_LANGUAGES.indexOf(lang) !== -1;
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
            language: "Language",
            selectLanguage: "Select Language:",
            systemDefault: "System Default",
            enableSites: "Enable Sites",
            toggleDesc: "Control domain replacement and tracking cleanup for each site",
            replaceDomainLabel: "Replace domain with {domain}",
            noReplacementLabel: "Do not replace domain",
            replacementChoiceDesc: "Choose one replacement domain, or choose none to keep the original domain.",
            cleanTrackingLabel: "Clean tracking parameters",
            credits: "Credits & Thanks",
            creditsDesc: "This plugin relies on the following amazing open-source projects:",
            projectWebsite: "Project Website",
            projectWebsiteDesc: "Visit the official VX Link Helper website",
            projectWebsiteLink: "Open website",
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
            language: "语言",
            selectLanguage: "选择语言:",
            systemDefault: "系统默认",
            enableSites: "启用网站",
            toggleDesc: "分别控制每个网站的域名替换和追踪参数清理",
            replaceDomainLabel: "替换域名为 {domain}",
            noReplacementLabel: "不替换域名",
            replacementChoiceDesc: "选择一个替换域名；如果都不想替换，请选择不替换域名。",
            cleanTrackingLabel: "清理追踪参数",
            credits: "致谢",
            creditsDesc: "本插件依赖以下优秀的开源项目:",
            projectWebsite: "项目官网",
            projectWebsiteDesc: "访问 VX Link Helper 官方网站",
            projectWebsiteLink: "打开官网",
            resetBtn: "重置为默认值",
            saveBtn: "保存设置",
            savedSuccess: "设置保存成功!",
            resetSuccess: "设置已重置为默认值!"
        },
        "zh-TW": {
            menuTitle: "複製 VX 連結",
            toastCopied: "已複製 VX 連結",
            toastCopyFailed: "複製失敗",
            btnVX: "VX",
            title: "VX 連結助手 - 設定",
            language: "語言",
            selectLanguage: "選擇語言：",
            systemDefault: "系統預設",
            enableSites: "啟用網站",
            toggleDesc: "分別控制每個網站的網域替換與追蹤參數清理",
            replaceDomainLabel: "替換網域為 {domain}",
            noReplacementLabel: "不替換網域",
            replacementChoiceDesc: "選擇一個替換網域；如果都不想替換，請選擇不替換網域。",
            cleanTrackingLabel: "清理追蹤參數",
            credits: "致謝",
            creditsDesc: "本擴充功能依賴以下優秀的開源專案：",
            projectWebsite: "專案官網",
            projectWebsiteDesc: "前往 VX Link Helper 官方網站",
            projectWebsiteLink: "開啟官網",
            resetBtn: "重設為預設值",
            saveBtn: "儲存設定",
            savedSuccess: "設定儲存成功！",
            resetSuccess: "設定已重設為預設值！"
        },
        es: {
            menuTitle: "Copiar enlace VX",
            toastCopied: "Enlace VX copiado",
            toastCopyFailed: "Error al copiar",
            btnVX: "VX",
            title: "Configuración de VX Link Helper",
            language: "Idioma",
            selectLanguage: "Seleccionar idioma:",
            systemDefault: "Predeterminado del sistema",
            enableSites: "Activar sitios",
            toggleDesc: "Controla por separado el reemplazo de dominio y la limpieza de seguimiento por sitio",
            replaceDomainLabel: "Reemplazar dominio por {domain}",
            noReplacementLabel: "No reemplazar el dominio",
            replacementChoiceDesc: "Elige un dominio de reemplazo, o elige ninguno para conservar el dominio original.",
            cleanTrackingLabel: "Limpiar parámetros de seguimiento",
            credits: "Créditos y agradecimientos",
            creditsDesc: "Esta extensión se apoya en los siguientes excelentes proyectos de código abierto:",
            projectWebsite: "Sitio web del proyecto",
            projectWebsiteDesc: "Visita el sitio oficial de VX Link Helper",
            projectWebsiteLink: "Abrir sitio web",
            resetBtn: "Restablecer valores predeterminados",
            saveBtn: "Guardar configuración",
            savedSuccess: "¡Configuración guardada correctamente!",
            resetSuccess: "¡Configuración restablecida a los valores predeterminados!"
        },
        ar: {
            menuTitle: "نسخ رابط VX",
            toastCopied: "تم نسخ رابط VX",
            toastCopyFailed: "فشل النسخ",
            btnVX: "VX",
            title: "إعدادات VX Link Helper",
            language: "اللغة",
            selectLanguage: "اختر اللغة:",
            systemDefault: "افتراضي النظام",
            enableSites: "تفعيل المواقع",
            toggleDesc: "تحكم بشكل منفصل في استبدال النطاق وتنظيف معلمات التتبع لكل موقع",
            replaceDomainLabel: "استبدال النطاق بـ {domain}",
            noReplacementLabel: "عدم استبدال النطاق",
            replacementChoiceDesc: "اختر نطاق استبدال واحداً، أو اختر عدم الاستبدال للاحتفاظ بالنطاق الأصلي.",
            cleanTrackingLabel: "تنظيف معلمات التتبع",
            credits: "شكر وتقدير",
            creditsDesc: "يعتمد هذا الملحق على مشاريع المصدر المفتوح الرائعة التالية:",
            projectWebsite: "موقع المشروع",
            projectWebsiteDesc: "زر الموقع الرسمي لـ VX Link Helper",
            projectWebsiteLink: "فتح الموقع",
            resetBtn: "إعادة التعيين إلى الافتراضي",
            saveBtn: "حفظ الإعدادات",
            savedSuccess: "تم حفظ الإعدادات بنجاح!",
            resetSuccess: "تمت إعادة تعيين الإعدادات إلى الافتراضي!"
        },
        pt: {
            menuTitle: "Copiar link VX",
            toastCopied: "Link VX copiado",
            toastCopyFailed: "Falha ao copiar",
            btnVX: "VX",
            title: "Configurações do VX Link Helper",
            language: "Idioma",
            selectLanguage: "Selecionar idioma:",
            systemDefault: "Padrão do sistema",
            enableSites: "Ativar sites",
            toggleDesc: "Controle separadamente a substituição de domínio e a limpeza de rastreamento por site",
            replaceDomainLabel: "Substituir domínio por {domain}",
            noReplacementLabel: "Não substituir o domínio",
            replacementChoiceDesc: "Escolha um domínio de substituição, ou escolha nenhum para manter o domínio original.",
            cleanTrackingLabel: "Limpar parâmetros de rastreamento",
            credits: "Créditos e agradecimentos",
            creditsDesc: "Esta extensão depende dos seguintes excelentes projetos de código aberto:",
            projectWebsite: "Site do projeto",
            projectWebsiteDesc: "Visite o site oficial do VX Link Helper",
            projectWebsiteLink: "Abrir site",
            resetBtn: "Redefinir para o padrão",
            saveBtn: "Salvar configurações",
            savedSuccess: "Configurações salvas com sucesso!",
            resetSuccess: "Configurações redefinidas para o padrão!"
        },
        fr: {
            menuTitle: "Copier le lien VX",
            toastCopied: "Lien VX copié",
            toastCopyFailed: "Échec de la copie",
            btnVX: "VX",
            title: "Paramètres de VX Link Helper",
            language: "Langue",
            selectLanguage: "Choisir la langue :",
            systemDefault: "Par défaut du système",
            enableSites: "Activer les sites",
            toggleDesc: "Contrôlez séparément le remplacement de domaine et le nettoyage du suivi pour chaque site",
            replaceDomainLabel: "Remplacer le domaine par {domain}",
            noReplacementLabel: "Ne pas remplacer le domaine",
            replacementChoiceDesc: "Choisissez un domaine de remplacement, ou aucun pour conserver le domaine d’origine.",
            cleanTrackingLabel: "Nettoyer les paramètres de suivi",
            credits: "Crédits et remerciements",
            creditsDesc: "Cette extension s'appuie sur les excellents projets open source suivants :",
            projectWebsite: "Site du projet",
            projectWebsiteDesc: "Visiter le site officiel de VX Link Helper",
            projectWebsiteLink: "Ouvrir le site",
            resetBtn: "Réinitialiser",
            saveBtn: "Enregistrer les paramètres",
            savedSuccess: "Paramètres enregistrés avec succès !",
            resetSuccess: "Paramètres réinitialisés !"
        },
        ja: {
            menuTitle: "VXリンクをコピー",
            toastCopied: "VXリンクをコピーしました",
            toastCopyFailed: "コピーに失敗しました",
            btnVX: "VX",
            title: "VX Link Helper の設定",
            language: "言語",
            selectLanguage: "言語を選択:",
            systemDefault: "システムのデフォルト",
            enableSites: "サイトを有効化",
            toggleDesc: "サイトごとにドメイン置換と追跡パラメータ削除を個別に制御します",
            replaceDomainLabel: "ドメインを {domain} に置換",
            noReplacementLabel: "ドメインを置換しない",
            replacementChoiceDesc: "置換先ドメインを1つ選ぶか、元のドメインを保持するには置換しないを選択してください。",
            cleanTrackingLabel: "追跡パラメータを削除",
            credits: "クレジットと謝辞",
            creditsDesc: "この拡張機能は、以下の素晴らしいオープンソースプロジェクトを利用しています:",
            projectWebsite: "プロジェクト公式サイト",
            projectWebsiteDesc: "VX Link Helper の公式サイトを開きます",
            projectWebsiteLink: "サイトを開く",
            resetBtn: "デフォルトに戻す",
            saveBtn: "設定を保存",
            savedSuccess: "設定を保存しました！",
            resetSuccess: "設定をデフォルトに戻しました！"
        }
    },

    // ----- Site registry -----
    // Each entry is a self-contained definition: { key, match, rewrite,
    // contentMatch, inject, meta }. See sites.js and AGENTS.md for the contract.
    sites: [],
    registerSite(def) {
        VX.sites.push(def);
        if (def && def.key) {
            VX.DEFAULT_SETTINGS.sites[def.key] = VX.getDefaultSiteSettings(def);
        }
    },

    getReplacementDomains(site) {
        const meta = site && site.meta;
        if (meta && meta.replacementDomains) return meta.replacementDomains;
        const creditUrl = meta && meta.credit && meta.credit.url;
        if (!creditUrl) return {};
        try {
            return { vx: new URL(creditUrl).hostname };
        } catch (e) {
            return {};
        }
    },

    getDefaultSiteSettings(site) {
        const meta = site && site.meta;
        const on = meta && meta.defaultEnabled;
        const enabledByDefault = on === undefined ? true : !!on;
        const defaults = {
            replaceDomain: enabledByDefault,
            cleanTracking: enabledByDefault
        };
        const domains = VX.getReplacementDomains(site);
        Object.keys(domains).forEach((key) => {
            if (key !== "vx") {
                const settingKey = "replaceDomain" + key.charAt(0).toUpperCase() + key.slice(1);
                defaults[settingKey] = false;
            }
        });
        return defaults;
    },

    normalizeSiteSettings(site, saved) {
        const defaults = VX.getDefaultSiteSettings(site);
        if (typeof saved === "boolean") {
            // Backward compatibility with v3.0's single per-site toggle: false
            // disabled that site's conversion/button behavior, true enabled it.
            return {
                ...defaults,
                replaceDomain: saved,
                cleanTracking: saved
            };
        }
        if (saved && typeof saved === "object") {
            return { ...defaults, ...saved };
        }
        return defaults;
    },

    getActiveReplacementKey(site, siteSettings) {
        const settings = siteSettings || VX.getDefaultSiteSettings(site);
        const domains = VX.getReplacementDomains(site);
        const alternate = Object.keys(domains).find((key) => {
            if (key === "vx") return false;
            const settingKey = "replaceDomain" + key.charAt(0).toUpperCase() + key.slice(1);
            return !!settings[settingKey];
        });
        if (alternate) return alternate;
        return settings.replaceDomain ? "vx" : null;
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

    // Map the browser/system language to one of our supported keys.
    getSystemLanguage() {
        const raw = (navigator.language || navigator.userLanguage || "en").toLowerCase();
        if (raw.indexOf("zh") === 0) {
            // Traditional variants (zh-TW/HK/MO, *-Hant) -> zh-TW; the rest -> Simplified.
            return /(^zh-(tw|hk|mo))|hant/.test(raw) ? "zh-TW" : "zh";
        }
        const primary = raw.split("-")[0];
        const supported = { en: 1, es: 1, ar: 1, pt: 1, fr: 1, ja: 1 };
        return supported[primary] ? primary : "en";
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

    formatString(template, values = {}) {
        return String(template || "").replace(/\{(\w+)\}/g, (match, key) => (
            values[key] === undefined ? match : values[key]
        ));
    },

    // Load full settings merged with defaults (generic over registered sites)
    loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(null, (result) => {
                const stored = result || {};
                const sites = {};
                VX.sites.forEach((site) => {
                    const saved = stored.sites && stored.sites[site.key];
                    sites[site.key] = VX.normalizeSiteSettings(site, saved);
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
    // Scoping: supported-site URLs obey that site's independent settings;
    // unrelated URLs still receive generic unambiguous tracking cleanup.
    convert(url, settingsOverride = null) {
        try {
            const u = new URL(url);
            const h = u.hostname.replace(/^www\./, "");

            const site = VX.sites.find(s => {
                try { return s.match && s.match(h, u); } catch (e) { return false; }
            });

            if (site) {
                const siteSettings = VX.normalizeSiteSettings(
                    site,
                    settingsOverride && settingsOverride.sites && settingsOverride.sites[site.key]
                );
                if (siteSettings.cleanTracking) {
                    VX.GLOBAL_TRACKERS.forEach(p => u.searchParams.delete(p));
                    VX.SITE_TRACKERS.forEach(p => u.searchParams.delete(p));
                    if (site.clean) site.clean(u, h);
                    u.hash = ""; // no share-relevant fragment on supported sites
                }
                const replacementKey = VX.getActiveReplacementKey(site, siteSettings);
                if (replacementKey && site.rewrite) {
                    site.rewrite(u, h, { replacement: replacementKey });
                }
                const transformed = !!siteSettings.cleanTracking || !!replacementKey;
                const out = u.toString();
                return transformed ? out.replace(/\/+$/, "") : out;
            }

            VX.GLOBAL_TRACKERS.forEach(p => u.searchParams.delete(p));
            return u.toString();
        } catch (e) {
            return url;
        }
    },

    debugConvertDetails(url, settingsOverride = null) {
        const details = {
            buildId: VX.DEBUG_BUILD_ID,
            input: String(url),
            settingsOverride,
            registeredSites: VX.sites.map((site) => site && site.key),
            steps: []
        };
        try {
            const u = new URL(url);
            const h = u.hostname.replace(/^www\./, "");
            details.parsed = {
                href: u.href,
                hostname: u.hostname,
                normalizedHost: h,
                pathname: u.pathname,
                search: u.search
            };

            const site = VX.sites.find(s => {
                try {
                    const matched = !!(s.match && s.match(h, u));
                    details.steps.push({ siteKey: s.key, match: matched });
                    return matched;
                } catch (e) {
                    details.steps.push({ siteKey: s.key, match: false, error: String(e && e.message || e) });
                    return false;
                }
            });
            details.matchedSiteKey = site && site.key || null;

            if (site) {
                const rawSiteSettings = settingsOverride && settingsOverride.sites && settingsOverride.sites[site.key];
                const siteSettings = VX.normalizeSiteSettings(site, rawSiteSettings);
                details.rawSiteSettings = rawSiteSettings;
                details.normalizedSiteSettings = siteSettings;
                details.beforeClean = u.toString();
                if (siteSettings.cleanTracking) {
                    VX.GLOBAL_TRACKERS.forEach(p => u.searchParams.delete(p));
                    VX.SITE_TRACKERS.forEach(p => u.searchParams.delete(p));
                    if (site.clean) site.clean(u, h);
                    u.hash = "";
                }
                details.afterClean = u.toString();
                const replacementKey = VX.getActiveReplacementKey(site, siteSettings);
                details.replacementKey = replacementKey;
                if (replacementKey && site.rewrite) site.rewrite(u, h, { replacement: replacementKey });
                details.afterRewrite = u.toString();
                details.transformed = !!siteSettings.cleanTracking || !!replacementKey;
                details.output = details.transformed ? u.toString().replace(/\/+$/, "") : u.toString();
                return details;
            }

            details.beforeGlobalClean = u.toString();
            VX.GLOBAL_TRACKERS.forEach(p => u.searchParams.delete(p));
            details.output = u.toString();
            return details;
        } catch (e) {
            details.error = String(e && e.message || e);
            details.output = url;
            return details;
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

        const openOptionsPage = () => {
            if (apis.runtime && typeof apis.runtime.openOptionsPage === "function") {
                apis.runtime.openOptionsPage();
                return;
            }
            if (apis.tabs && apis.runtime && typeof apis.runtime.getURL === "function") {
                apis.tabs.create({ url: apis.runtime.getURL("options.html") });
            }
        };

        const toolbarAction = apis.action || apis.browserAction;
        if (toolbarAction && toolbarAction.onClicked) {
            toolbarAction.onClicked.addListener(openOptionsPage);
        }

        // Handle context menu clicks
        apis.contextMenus.onClicked.addListener(async (info, tab) => {
            if (info.menuItemId !== "copy-vx-link") return;
            const language = await VX.getCurrentLanguage();
            const strings = VX.getStrings(language);
            const settings = await VX.loadSettings();
            const text = VX.convert(info.linkUrl, settings);
            await VX.writeToClipboard(text, {
                tabId: tab && tab.id,
                toast: strings.toastCopied,
                toastFail: strings.toastCopyFailed,
                rtl: VX.isRTL(language)
            });
        });

        updateContextMenu();
    },

    // Write text to clipboard in a platform-compatible way.
    // opts: { tabId?: number, toast?: string, toastFail?: string, rtl?: boolean }
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
                    args: [text, opts.toast || "", opts.toastFail || "", !!opts.rtl],
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
    _copyAndToast: async function (text, okMsg, failMsg, rtl) {
        const showToast = (msg) => {
            if (!msg || !document.body) return;
            const d = document.createElement("div");
            d.textContent = msg;
            d.dir = rtl ? "rtl" : "ltr";
            d.style.cssText = "position:fixed;" + (rtl ? "left" : "right") + ":20px;bottom:20px;" +
                "z-index:2147483647;background:rgba(0,0,0,.85);color:#fff;padding:8px 12px;" +
                "border-radius:8px;font:13px sans-serif;pointer-events:none;";
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
