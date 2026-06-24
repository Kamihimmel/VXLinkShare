// Default settings
const DEFAULT_SETTINGS = {
    language: "system",
    sites: {
        x: true,
        reddit: true,
        bilibili: true,
        pixiv: true
    }
};

// Translations
const TRANSLATIONS = {
    en: {
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
};

// Get system language
function getSystemLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith("zh")) {
        return "zh";
    }
    return "en";
}

// Get current language
function getCurrentLanguage() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["language"], (result) => {
            let lang = result.language || DEFAULT_SETTINGS.language;
            if (lang === "system") {
                lang = getSystemLanguage();
            }
            resolve(lang);
        });
    });
}

// Load settings from storage
function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(null, (result) => {
            const settings = result || {};
            
            // Merge with defaults to ensure all properties exist
            const mergedSettings = {
                language: settings.language || DEFAULT_SETTINGS.language,
                sites: {
                    x: settings.sites?.x !== undefined ? settings.sites.x : DEFAULT_SETTINGS.sites.x,
                    reddit: settings.sites?.reddit !== undefined ? settings.sites.reddit : DEFAULT_SETTINGS.sites.reddit,
                    bilibili: settings.sites?.bilibili !== undefined ? settings.sites.bilibili : DEFAULT_SETTINGS.sites.bilibili,
                    pixiv: settings.sites?.pixiv !== undefined ? settings.sites.pixiv : DEFAULT_SETTINGS.sites.pixiv
                }
            };
            
            resolve(mergedSettings);
        });
    });
}

// Save settings to storage
function saveSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.sync.set(settings, resolve);
    });
}

// Update UI based on current language
async function updateUILanguage(languageOverride = null) {
    // Use override language if provided (for immediate feedback), otherwise get from storage
    let language = languageOverride;
    
    if (!language) {
        language = await getCurrentLanguage();
    } else if (language === "system") {
        language = getSystemLanguage();
    }
    
    const strings = TRANSLATIONS[language] || TRANSLATIONS.en;

    // Update page title
    document.title = strings.title;

    // Update all elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.getAttribute("data-i18n");
        if (strings[key]) {
            element.textContent = strings[key];
        }
    });

    // Update site labels
    const siteLabels = {
        "site-x": strings.twitter,
        "site-reddit": strings.reddit,
        "site-bilibili": strings.bilibili,
        "site-pixiv": strings.pixiv
    };

    for (const [id, text] of Object.entries(siteLabels)) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) {
            label.textContent = text;
        }
    }
}

// Load and display current settings
async function displaySettings() {
    const settings = await loadSettings();

    // Set language dropdown
    document.getElementById("language").value = settings.language || DEFAULT_SETTINGS.language;

    // Temporarily store and clear listeners to prevent triggered saves during display
    const xCheckbox = document.getElementById("site-x");
    const redditCheckbox = document.getElementById("site-reddit");
    const bilibiliCheckbox = document.getElementById("site-bilibili");
    const pixivCheckbox = document.getElementById("site-pixiv");
    
    // Clone and replace to remove listeners
    [xCheckbox, redditCheckbox, bilibiliCheckbox, pixivCheckbox].forEach(checkbox => {
        const newCheckbox = checkbox.cloneNode(true);
        checkbox.parentNode.replaceChild(newCheckbox, checkbox);
    });

    // Set site toggles - use strict equality check with defaults
    document.getElementById("site-x").checked = settings.sites?.x === true || settings.sites?.x === undefined ? true : false;
    document.getElementById("site-reddit").checked = settings.sites?.reddit === true || settings.sites?.reddit === undefined ? true : false;
    document.getElementById("site-bilibili").checked = settings.sites?.bilibili === true || settings.sites?.bilibili === undefined ? true : false;
    document.getElementById("site-pixiv").checked = settings.sites?.pixiv === true || settings.sites?.pixiv === undefined ? true : false;
    
    // Re-attach listeners
    attachCheckboxListeners();
}

// Show status message
async function showStatus(message) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.className = "status-message success";

    setTimeout(() => {
        status.className = "status-message";
    }, 2000);
}

// Site toggle handlers - save immediately
function attachCheckboxListeners() {
    document.getElementById("site-x").addEventListener("change", async () => {
        const settings = await loadSettings();
        settings.sites.x = document.getElementById("site-x").checked;
        await saveSettings(settings);
        const language = await getCurrentLanguage();
        const strings = TRANSLATIONS[language] || TRANSLATIONS.en;
        await showStatus(strings.savedSuccess);
    });

    document.getElementById("site-reddit").addEventListener("change", async () => {
        const settings = await loadSettings();
        settings.sites.reddit = document.getElementById("site-reddit").checked;
        await saveSettings(settings);
        const language = await getCurrentLanguage();
        const strings = TRANSLATIONS[language] || TRANSLATIONS.en;
        await showStatus(strings.savedSuccess);
    });

    document.getElementById("site-bilibili").addEventListener("change", async () => {
        const settings = await loadSettings();
        settings.sites.bilibili = document.getElementById("site-bilibili").checked;
        await saveSettings(settings);
        const language = await getCurrentLanguage();
        const strings = TRANSLATIONS[language] || TRANSLATIONS.en;
        await showStatus(strings.savedSuccess);
    });

    document.getElementById("site-pixiv").addEventListener("change", async () => {
        const settings = await loadSettings();
        settings.sites.pixiv = document.getElementById("site-pixiv").checked;
        await saveSettings(settings);
        const language = await getCurrentLanguage();
        const strings = TRANSLATIONS[language] || TRANSLATIONS.en;
        await showStatus(strings.savedSuccess);
    });
}

// Reset button handler
document.getElementById("reset-button").addEventListener("click", async () => {
    if (confirm("Are you sure you want to reset to default settings?")) {
        await saveSettings(DEFAULT_SETTINGS);
        await displaySettings();
        const language = await getCurrentLanguage();
        const strings = TRANSLATIONS[language] || TRANSLATIONS.en;
        await showStatus(strings.resetSuccess);
        await updateUILanguage();
    }
});

// Language change handler
document.getElementById("language").addEventListener("change", async () => {
    const selectedLanguage = document.getElementById("language").value;
    
    // Get current settings and update language
    const settings = await loadSettings();
    settings.language = selectedLanguage;
    await saveSettings(settings);
    
    // Update UI immediately with selected language
    const displayLanguage = selectedLanguage === "system" ? getSystemLanguage() : selectedLanguage;
    await updateUILanguage(displayLanguage);
});

// Initialize page - display settings FIRST, then listeners will be attached by displaySettings
document.addEventListener("DOMContentLoaded", async () => {
    await displaySettings();
    await updateUILanguage();
});
