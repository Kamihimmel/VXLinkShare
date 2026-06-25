// VX Link Share - Content script (generic).
// Owns the page-side machinery (toast, button factory, clipboard write) and
// dispatches to the matching site's inject() from the registry. All site-specific
// DOM logic lives in sites.js.
(function () {

    let strings = VX.getStrings("en");
    let settings = { sites: {} };

    // Load language + per-site toggles from storage.
    async function refresh() {
        settings = await VX.loadSettings();
        strings = VX.getStrings(await VX.getCurrentLanguage());
    }

    function toast(msg) {
        const d = document.createElement("div");
        d.textContent = msg;
        d.style.cssText = `
            position:fixed;
            right:20px;
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
        convert: (url) => VX.convert(url),
        toast,
        makeBtn,
        async copyUrl(url) {
            await navigator.clipboard.writeText(VX.convert(url));
            toast(strings.toastCopied);
        }
    };

    // Inject the VX button for every enabled site whose host matches.
    function run() {
        const host = location.hostname;
        for (const site of VX.sites) {
            if (site.inject && site.contentMatch
                && site.contentMatch(host) && settings.sites[site.key]) {
                try { site.inject(ctx); } catch (e) { /* a flaky site selector must not break others */ }
            }
        }
    }

    // React to settings changes (toggles / language) without a reload.
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync" && (changes.sites || changes.language)) {
            refresh().then(run);
        }
    });

    // Load settings/language first, then observe and run.
    refresh().then(() => {
        new MutationObserver(run).observe(document.documentElement, {
            childList: true,
            subtree: true
        });
        run();
    });

})();
