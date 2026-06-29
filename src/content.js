// VX Link Share - Content script (generic).
// Owns the page-side machinery (toast, button factory, clipboard write) and
// dispatches to the matching site's inject() from the registry. All site-specific
// DOM logic lives in sites.js.
(function () {

    let strings = VX.getStrings("en");
    let currentLang = "en";
    let settings = { sites: {} };

    // Load language + per-site toggles from storage.
    async function refresh() {
        settings = await VX.loadSettings();
        currentLang = await VX.getCurrentLanguage();
        strings = VX.getStrings(currentLang);
    }

    function toast(msg) {
        const rtl = VX.isRTL(currentLang);
        const d = document.createElement("div");
        d.textContent = msg;
        d.dir = rtl ? "rtl" : "ltr";
        d.style.cssText = `
            position:fixed;
            ${rtl ? "left" : "right"}:20px;
            bottom:20px;
            z-index:2147483647;
            background:rgba(0,0,0,.85);
            color:white;
            padding:8px 12px;
            border-radius:8px;
            font-size:13px;
            pointer-events:none;
        `;
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 1500);
    }

    // Create a styled "VX" button wired to an onClick handler.
    function makeBtn(label, onClick) {
        const b = document.createElement("button");
        b.textContent = label;
        b.style.cssText = `
            background:transparent;
            border:none;
            outline:none;
            box-shadow:none;
            padding:0 8px;
            margin-left:8px;
            cursor:pointer;
            font:inherit;
            color:inherit;
            opacity:.65;
        `;
        b.addEventListener("mouseenter", () => b.style.opacity = "1");
        b.addEventListener("mouseleave", () => b.style.opacity = ".65");
        b.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
        });
        return b;
    }

    // Context handed to each site's inject().
    const ctx = {
        get strings() { return strings; },
        get debugBuildId() { return VX.DEBUG_BUILD_ID; },
        convert: (url) => VX.convert(url, settings),
        debugConvert: (url) => VX.debugConvertDetails(url, settings),
        debugConvertSummary: (url) => VX.debugConvertDetails(url, settings).summary,
        toast,
        makeBtn,
        async copyUrl(url) {
            const converted = VX.convert(url, settings);
            if (/bilibili|vxbilibili|b23\.tv|vxb23\.tv/i.test(`${url} ${converted}`)) {
                const convertDetails = VX.debugConvertDetails(url, settings);
                console.debug("[VX DEBUG] copyUrl prepared", {
                    input: String(url),
                    converted,
                    debugBuildId: VX.DEBUG_BUILD_ID,
                    bilibiliSettings: settings && settings.sites && settings.sites.bilibili,
                    convertSummary: convertDetails.summary,
                    convertDetails,
                    settings
                });
            }
            await navigator.clipboard.writeText(converted);
            if (/bilibili|vxbilibili|b23\.tv|vxb23\.tv/i.test(`${url} ${converted}`)) {
                try {
                    const clipboardText = await navigator.clipboard.readText();
                    console.debug("[VX DEBUG] clipboard after write", { clipboardText });
                } catch (e) {
                    console.debug("[VX DEBUG] clipboard readback unavailable", String(e && e.message || e));
                }
            }
            toast(strings.toastCopied);
            return converted;
        }
    };

    function siteHasActiveAction(site) {
        const siteSettings = VX.normalizeSiteSettings(site, settings.sites && settings.sites[site.key]);
        return !!siteSettings.cleanTracking || !!VX.getActiveReplacementKey(site, siteSettings);
    }

    // Inject the VX button for every site whose host matches and has at least one
    // active action (domain replacement or tracking cleanup) enabled.
    function run() {
        const host = location.hostname;
        for (const site of VX.sites) {
            if (site.inject && site.contentMatch
                && site.contentMatch(host) && siteHasActiveAction(site)) {
                try { site.inject(ctx); } catch (e) { /* a flaky site selector must not break others */ }
            }
        }
    }

    // Coalesce bursts of DOM mutations. SPAs (X/Reddit/Bilibili feeds) mutate the
    // DOM constantly; calling run() per mutation would re-scan hundreds of times a
    // second. Instead queue at most one run per ~200ms, aligned to a frame. run() is
    // idempotent (each site bails once its button exists), so re-scanning after the
    // DOM settles is enough — and a trailing run always fires, so nothing is missed.
    const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
    let pending = false;
    let lastRun = 0;
    function scheduleRun() {
        if (pending) return;
        pending = true;
        const wait = Math.max(0, 200 - (now() - lastRun));
        setTimeout(() => requestAnimationFrame(() => {
            pending = false;
            lastRun = now();
            run();
        }), wait);
    }

    // React to settings changes (toggles / language) without a reload.
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync" && (changes.sites || changes.language)) {
            refresh().then(run);
        }
    });

    // Load settings/language first, then observe and run.
    refresh().then(() => {
        new MutationObserver(scheduleRun).observe(document.documentElement, {
            childList: true,
            subtree: true
        });
        run();
    });

})();
