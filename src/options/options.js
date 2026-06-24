// Update UI based on current language
async function updateUILanguage(languageOverride = null) {
    // Use override language if provided (for immediate feedback), otherwise get from storage
    let language = languageOverride;
    
    if (!language) {
        language = await VX.getCurrentLanguage();
    } else if (language === "system") {
        language = VX.getSystemLanguage();
    }
    
    const strings = VX.getStrings(language);

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
    const settings = await VX.loadSettings();

    // Set language dropdown
    document.getElementById("language").value = settings.language || VX.DEFAULT_SETTINGS.language;

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
    document.getElementById("site-x").checked = settings.sites.x;
    document.getElementById("site-reddit").checked = settings.sites.reddit;
    document.getElementById("site-bilibili").checked = settings.sites.bilibili;
    document.getElementById("site-pixiv").checked = settings.sites.pixiv;
    
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

// Helper to save a single site setting and show status
async function saveSiteSetting(siteKey, checked) {
    try {
        const settings = await VX.loadSettings();
        settings.sites[siteKey] = checked;
        await VX.saveSettings(settings);
        const language = await VX.getCurrentLanguage();
        const strings = VX.getStrings(language);
        await showStatus(strings.savedSuccess);
    } catch (error) {
        console.error(`Error saving site-${siteKey} setting:`, error);
    }
}

// Site toggle handlers - save immediately
function attachCheckboxListeners() {
    document.getElementById("site-x").addEventListener("change", async (e) => {
        await saveSiteSetting("x", e.target.checked);
    });

    document.getElementById("site-reddit").addEventListener("change", async (e) => {
        await saveSiteSetting("reddit", e.target.checked);
    });

    document.getElementById("site-bilibili").addEventListener("change", async (e) => {
        await saveSiteSetting("bilibili", e.target.checked);
    });

    document.getElementById("site-pixiv").addEventListener("change", async (e) => {
        await saveSiteSetting("pixiv", e.target.checked);
    });
}

// Reset button handler
document.getElementById("reset-button").addEventListener("click", async () => {
    if (confirm("Are you sure you want to reset to default settings?")) {
        try {
            await VX.saveSettings(VX.DEFAULT_SETTINGS);
            await displaySettings();
            const language = await VX.getCurrentLanguage();
            const strings = VX.getStrings(language);
            await showStatus(strings.resetSuccess);
            await updateUILanguage();
        } catch (error) {
            console.error("Error resetting settings:", error);
        }
    }
});

// Language change handler
document.getElementById("language").addEventListener("change", async () => {
    try {
        const selectedLanguage = document.getElementById("language").value;
        
        // Get current settings and update language
        const settings = await VX.loadSettings();
        settings.language = selectedLanguage;
        await VX.saveSettings(settings);
        
        // Update UI immediately with selected language
        const displayLanguage = selectedLanguage === "system" ? VX.getSystemLanguage() : selectedLanguage;
        await updateUILanguage(displayLanguage);
    } catch (error) {
        console.error("Error changing language:", error);
    }
});

// Initialize page - display settings FIRST, then listeners will be attached by displaySettings
document.addEventListener("DOMContentLoaded", async () => {
    await displaySettings();
    await updateUILanguage();
});
