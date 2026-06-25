// VX Link Share - Options page (generic over the site registry).
// Site toggles and credits are generated from VX.sites; adding a site needs no
// edit here.

// Build the site toggles and credits from the registry (run once on load).
function renderSites() {
    const grid = document.getElementById("toggle-grid");
    const credits = document.getElementById("credits-list");
    grid.innerHTML = "";
    credits.innerHTML = "";

    VX.sites.forEach((site) => {
        const meta = site.meta || {};

        // --- toggle ---
        const item = document.createElement("div");
        item.className = "toggle-item";
        const header = document.createElement("div");
        header.className = "toggle-header";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = "site-" + site.key;
        input.className = "site-toggle";
        input.dataset.siteKey = site.key;
        const label = document.createElement("label");
        label.setAttribute("for", input.id);
        label.className = "site-label";
        label.textContent = VX.getSiteLabel(site, "en");
        header.appendChild(input);
        header.appendChild(label);
        const desc = document.createElement("p");
        desc.className = "site-desc";
        desc.textContent = meta.domains || "";
        item.appendChild(header);
        item.appendChild(desc);
        grid.appendChild(item);

        // --- credit ---
        const credit = meta.credit;
        if (credit) {
            const card = document.createElement("div");
            card.className = "credit-item";
            const h3 = document.createElement("h3");
            h3.textContent = credit.name || site.key;
            const p = document.createElement("p");
            p.className = "credit-desc";
            p.dataset.siteKey = site.key;
            p.textContent = VX.getCreditDesc(site, "en");
            card.appendChild(h3);
            card.appendChild(p);
            if (credit.url) {
                const a = document.createElement("a");
                a.href = credit.url;
                a.target = "_blank";
                a.textContent = credit.url.replace(/^https?:\/\//, "");
                card.appendChild(a);
            }
            credits.appendChild(card);
        }
    });
}

// Update UI based on current language
async function updateUILanguage(languageOverride = null) {
    let language = languageOverride;
    if (!language) {
        language = await VX.getCurrentLanguage();
    } else if (language === "system") {
        language = VX.getSystemLanguage();
    }

    // Reflect language + reading direction on the page (RTL for Arabic).
    document.documentElement.lang = language;
    document.documentElement.dir = VX.isRTL(language) ? "rtl" : "ltr";

    const strings = VX.getStrings(language);

    document.title = strings.title;

    // Common strings via data-i18n
    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.getAttribute("data-i18n");
        if (strings[key]) {
            element.textContent = strings[key];
        }
    });

    // Per-site labels + credit descriptions from the registry
    VX.sites.forEach((site) => {
        const label = document.querySelector(`label[for="site-${site.key}"]`);
        if (label) label.textContent = VX.getSiteLabel(site, language);
        const cdesc = document.querySelector(`.credit-desc[data-site-key="${site.key}"]`);
        if (cdesc) cdesc.textContent = VX.getCreditDesc(site, language);
    });
}

// Dynamically populate language options from VX.TRANSLATIONS
function populateLanguageOptions() {
    const select = document.getElementById("language");
    const currentValue = select.value;

    while (select.options.length > 1) {
        select.remove(1);
    }

    Object.keys(VX.TRANSLATIONS).forEach((key) => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = VX.LANGUAGE_DISPLAY[key] || key;
        select.appendChild(option);
    });

    select.value = currentValue;
}

// Load and display current settings
async function displaySettings() {
    const settings = await VX.loadSettings();

    document.getElementById("language").value = settings.language || VX.DEFAULT_SETTINGS.language;

    // Set each site toggle from settings (listeners are (re)attached after).
    VX.sites.forEach((site) => {
        const cb = document.getElementById("site-" + site.key);
        if (cb) cb.checked = !!settings.sites[site.key];
    });

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

// Save a single site toggle and show status
async function saveSiteSetting(siteKey, checked) {
    try {
        const settings = await VX.loadSettings();
        settings.sites[siteKey] = checked;
        await VX.saveSettings(settings);
        const strings = VX.getStrings(await VX.getCurrentLanguage());
        await showStatus(strings.savedSuccess);
    } catch (error) {
        console.error(`Error saving site-${siteKey} setting:`, error);
    }
}

// Attach change handlers to every site toggle (idempotent: clone-replace first).
function attachCheckboxListeners() {
    VX.sites.forEach((site) => {
        const cb = document.getElementById("site-" + site.key);
        if (!cb) return;
        const fresh = cb.cloneNode(true);
        cb.parentNode.replaceChild(fresh, cb);
        fresh.checked = cb.checked;
        fresh.addEventListener("change", (e) => saveSiteSetting(site.key, e.target.checked));
    });
}

// Reset button handler
document.getElementById("reset-button").addEventListener("click", async () => {
    if (confirm("Are you sure you want to reset to default settings?")) {
        try {
            await VX.saveSettings({
                language: VX.DEFAULT_SETTINGS.language,
                sites: { ...VX.DEFAULT_SETTINGS.sites }
            });
            await displaySettings();
            const strings = VX.getStrings(await VX.getCurrentLanguage());
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
        const settings = await VX.loadSettings();
        settings.language = selectedLanguage;
        await VX.saveSettings(settings);
        const displayLanguage = selectedLanguage === "system" ? VX.getSystemLanguage() : selectedLanguage;
        await updateUILanguage(displayLanguage);
    } catch (error) {
        console.error("Error changing language:", error);
    }
});

// Initialize: build site UI from registry, then settings, then localize.
document.addEventListener("DOMContentLoaded", async () => {
    renderSites();
    populateLanguageOptions();
    await displaySettings();
    await updateUILanguage();
});
