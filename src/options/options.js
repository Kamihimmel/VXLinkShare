// VX Link Share - Options page (generic over the site registry).
// Site settings and credits are generated from VX.sites; adding a site needs no
// edit here unless it introduces a new kind of per-site option.

const NO_REPLACEMENT_VALUE = "none";

function siteSettingId(siteKey, settingKey) {
    return `site-${siteKey}-${settingKey}`;
}

function siteReplacementRadioId(siteKey, replacementKey) {
    return `site-${siteKey}-replacement-${replacementKey}`;
}

function siteReplacementRadioName(siteKey) {
    return `site-${siteKey}-replacement`;
}

function cloneDefaultSites() {
    const sites = {};
    VX.sites.forEach((site) => {
        sites[site.key] = { ...VX.DEFAULT_SETTINGS.sites[site.key] };
    });
    return sites;
}

function getReplacementSettingKey(replacementKey) {
    return replacementKey === "vx"
        ? "replaceDomain"
        : "replaceDomain" + replacementKey.charAt(0).toUpperCase() + replacementKey.slice(1);
}

function getReplacementDefinitions(site) {
    const domains = VX.getReplacementDomains(site);
    return Object.keys(domains).map((replacementKey) => ({
        key: getReplacementSettingKey(replacementKey),
        type: "replacement",
        replacementKey,
        domain: domains[replacementKey]
    }));
}

function hasMultipleReplacementDomains(site) {
    return getReplacementDefinitions(site).length > 1;
}

function getSiteSettingDefinitions(site) {
    const defs = [];
    if (!hasMultipleReplacementDomains(site)) {
        defs.push(...getReplacementDefinitions(site));
    }
    defs.push({ key: "cleanTracking", type: "clean" });
    return defs;
}

function getSettingLabel(def, strings) {
    if (def.type === "replacement") {
        return VX.formatString(strings.replaceDomainLabel, { domain: def.domain });
    }
    if (def.type === "noReplacement") {
        return strings.noReplacementLabel;
    }
    return strings.cleanTrackingLabel;
}

function getSelectedReplacementKey(site, siteSettings) {
    return VX.getActiveReplacementKey(site, siteSettings) || NO_REPLACEMENT_VALUE;
}

function setReplacementChoice(site, siteSettings, replacementKey) {
    getReplacementDefinitions(site).forEach((def) => {
        siteSettings[def.key] = false;
    });
    if (replacementKey !== NO_REPLACEMENT_VALUE) {
        const selected = getReplacementDefinitions(site).find((def) => def.replacementKey === replacementKey);
        if (selected) siteSettings[selected.key] = true;
    }
}

// Build the site settings and credits from the registry (run once on load).
function renderSites() {
    const grid = document.getElementById("toggle-grid");
    const credits = document.getElementById("credits-list");
    grid.innerHTML = "";
    credits.innerHTML = "";

    VX.sites.forEach((site) => {
        const meta = site.meta || {};

        // --- settings card ---
        const item = document.createElement("div");
        item.className = "toggle-item";

        const title = document.createElement("h3");
        title.className = "site-label site-title";
        title.dataset.siteKey = site.key;
        title.textContent = VX.getSiteLabel(site, "en");
        item.appendChild(title);

        const desc = document.createElement("p");
        desc.className = "site-desc";
        desc.textContent = meta.domains || "";
        item.appendChild(desc);

        const options = document.createElement("div");
        options.className = "site-options";

        if (hasMultipleReplacementDomains(site)) {
            const group = document.createElement("div");
            group.className = "replacement-choice-group";
            group.dataset.siteKey = site.key;

            const hint = document.createElement("p");
            hint.className = "site-option-hint";
            hint.dataset.siteKey = site.key;
            hint.textContent = VX.getStrings("en").replacementChoiceDesc;
            group.appendChild(hint);

            const noneDef = { key: "noReplacement", type: "noReplacement", replacementKey: NO_REPLACEMENT_VALUE };
            [noneDef, ...getReplacementDefinitions(site)].forEach((def) => {
                const row = document.createElement("div");
                row.className = "toggle-header site-option";

                const input = document.createElement("input");
                input.type = "radio";
                input.id = siteReplacementRadioId(site.key, def.replacementKey);
                input.name = siteReplacementRadioName(site.key);
                input.className = "site-replacement-radio";
                input.value = def.replacementKey;
                input.dataset.siteKey = site.key;

                const label = document.createElement("label");
                label.setAttribute("for", input.id);
                label.className = "site-option-label replacement-option-label";
                label.dataset.siteKey = site.key;
                label.dataset.replacementKey = def.replacementKey;
                label.textContent = getSettingLabel(def, VX.getStrings("en"));

                row.appendChild(input);
                row.appendChild(label);
                group.appendChild(row);
            });
            options.appendChild(group);
        }

        getSiteSettingDefinitions(site).forEach((def) => {
            const row = document.createElement("div");
            row.className = "toggle-header site-option";

            const input = document.createElement("input");
            input.type = "checkbox";
            input.id = siteSettingId(site.key, def.key);
            input.className = "site-setting-toggle";
            input.dataset.siteKey = site.key;
            input.dataset.settingKey = def.key;

            const label = document.createElement("label");
            label.setAttribute("for", input.id);
            label.className = "site-option-label";
            label.dataset.siteKey = site.key;
            label.dataset.settingKey = def.key;
            label.textContent = getSettingLabel(def, VX.getStrings("en"));

            row.appendChild(input);
            row.appendChild(label);
            options.appendChild(row);
        });
        item.appendChild(options);
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

    // Per-site labels, option labels, and credit descriptions from the registry
    VX.sites.forEach((site) => {
        const label = document.querySelector(`.site-title[data-site-key="${site.key}"]`);
        if (label) label.textContent = VX.getSiteLabel(site, language);

        const hint = document.querySelector(`.site-option-hint[data-site-key="${site.key}"]`);
        if (hint) hint.textContent = strings.replacementChoiceDesc;

        const noneLabel = document.querySelector(
            `.replacement-option-label[data-site-key="${site.key}"][data-replacement-key="${NO_REPLACEMENT_VALUE}"]`
        );
        if (noneLabel) noneLabel.textContent = getSettingLabel({ type: "noReplacement" }, strings);

        getReplacementDefinitions(site).forEach((def) => {
            const replacementLabel = document.querySelector(
                `.replacement-option-label[data-site-key="${site.key}"][data-replacement-key="${def.replacementKey}"]`
            );
            if (replacementLabel) replacementLabel.textContent = getSettingLabel(def, strings);
        });

        getSiteSettingDefinitions(site).forEach((def) => {
            const optionLabel = document.querySelector(
                `.site-option-label[data-site-key="${site.key}"][data-setting-key="${def.key}"]`
            );
            if (optionLabel) optionLabel.textContent = getSettingLabel(def, strings);
        });

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

    // Set each site setting checkbox/radio from settings (listeners are attached after).
    VX.sites.forEach((site) => {
        const siteSettings = VX.normalizeSiteSettings(site, settings.sites[site.key]);
        if (hasMultipleReplacementDomains(site)) {
            const selected = getSelectedReplacementKey(site, siteSettings);
            const radio = document.getElementById(siteReplacementRadioId(site.key, selected));
            if (radio) radio.checked = true;
        }
        getSiteSettingDefinitions(site).forEach((def) => {
            const cb = document.getElementById(siteSettingId(site.key, def.key));
            if (cb) cb.checked = !!siteSettings[def.key];
        });
    });

    attachInputListeners();
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

// Save a single site setting and show status
async function saveSiteSetting(siteKey, settingKey, checked) {
    try {
        const settings = await VX.loadSettings();
        const site = VX.sites.find((candidate) => candidate.key === siteKey);
        if (!site) return;
        settings.sites[siteKey] = VX.normalizeSiteSettings(site, settings.sites[siteKey]);
        settings.sites[siteKey][settingKey] = checked;
        await VX.saveSettings(settings);
        const strings = VX.getStrings(await VX.getCurrentLanguage());
        await showStatus(strings.savedSuccess);
    } catch (error) {
        console.error(`Error saving site-${siteKey}-${settingKey} setting:`, error);
    }
}

async function saveReplacementChoice(siteKey, replacementKey) {
    try {
        const settings = await VX.loadSettings();
        const site = VX.sites.find((candidate) => candidate.key === siteKey);
        if (!site) return;
        settings.sites[siteKey] = VX.normalizeSiteSettings(site, settings.sites[siteKey]);
        setReplacementChoice(site, settings.sites[siteKey], replacementKey);
        await VX.saveSettings(settings);
        const strings = VX.getStrings(await VX.getCurrentLanguage());
        await showStatus(strings.savedSuccess);
    } catch (error) {
        console.error(`Error saving site-${siteKey} replacement choice:`, error);
    }
}

// Attach change handlers to every site setting input (idempotent: clone-replace first).
function attachInputListeners() {
    document.querySelectorAll(".site-setting-toggle").forEach((input) => {
        const fresh = input.cloneNode(true);
        input.parentNode.replaceChild(fresh, input);
        fresh.checked = input.checked;
        fresh.addEventListener("change", (e) => {
            saveSiteSetting(e.target.dataset.siteKey, e.target.dataset.settingKey, e.target.checked);
        });
    });

    document.querySelectorAll(".site-replacement-radio").forEach((input) => {
        const fresh = input.cloneNode(true);
        input.parentNode.replaceChild(fresh, input);
        fresh.checked = input.checked;
        fresh.addEventListener("change", (e) => {
            if (e.target.checked) saveReplacementChoice(e.target.dataset.siteKey, e.target.value);
        });
    });
}

// Reset button handler
document.getElementById("reset-button").addEventListener("click", async () => {
    if (confirm("Are you sure you want to reset to default settings?")) {
        try {
            await VX.saveSettings({
                language: VX.DEFAULT_SETTINGS.language,
                sites: cloneDefaultSites()
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
