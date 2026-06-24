(function(){

// Translations
const TRANSLATIONS = {
    en: {
        toastCopied: "Copied VX Link",
        btnVX: "VX"
    },
    zh: {
        toastCopied: "已复制 VX 链接",
        btnVX: "VX"
    }
};

// Default settings
const DEFAULT_SETTINGS = {
    language: "system"
};

// Current language strings
let strings = TRANSLATIONS.en;

// Get system language
function getSystemLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith("zh")) {
        return "zh";
    }
    return "en";
}

// Get current language from storage
function getCurrentLanguage() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["language"], (result) => {
            let lang = (result && result.language) || DEFAULT_SETTINGS.language;
            if (lang === "system") {
                lang = getSystemLanguage();
            }
            resolve(lang);
        });
    });
}

// Update translations based on stored language
async function updateLanguage() {
    const language = await getCurrentLanguage();
    strings = TRANSLATIONS[language] || TRANSLATIONS.en;
}

// Settings cache
let settings = {
    sites: {
        x: true,
        reddit: true,
        bilibili: true,
        pixiv: true
    }
};

// Load settings from storage
function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(null, (result) => {
            const defaults = {
                sites: {
                    x: true,
                    reddit: true,
                    bilibili: true,
                    pixiv: true
                }
            };
            
            settings = {
                sites: {
                    x: result?.sites?.x !== undefined ? result.sites.x : defaults.sites.x,
                    reddit: result?.sites?.reddit !== undefined ? result.sites.reddit : defaults.sites.reddit,
                    bilibili: result?.sites?.bilibili !== undefined ? result.sites.bilibili : defaults.sites.bilibili,
                    pixiv: result?.sites?.pixiv !== undefined ? result.sites.pixiv : defaults.sites.pixiv
                }
            };
            resolve();
        });
    });
}

// Listen for settings changes and re-run injection logic
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync") {
        if (changes.sites) {
            settings.sites = {
                x: changes.sites.newValue?.x !== undefined ? changes.sites.newValue.x : settings.sites.x,
                reddit: changes.sites.newValue?.reddit !== undefined ? changes.sites.newValue.reddit : settings.sites.reddit,
                bilibili: changes.sites.newValue?.bilibili !== undefined ? changes.sites.newValue.bilibili : settings.sites.bilibili,
                pixiv: changes.sites.newValue?.pixiv !== undefined ? changes.sites.newValue.pixiv : settings.sites.pixiv
            };
            run();
        }
        if (changes.language) {
            updateLanguage().then(run);
        }
    }
});

function convert(url){

    try{

        const u = new URL(url, location.href);

        u.hash = "";

        const h =
            u.hostname.replace(
                /^www\./,
                ""
            );

        [
            "spm_id_from",
            "from_spmid",
            "vd_source",
            "share_source",
            "share_medium",
            "share_plat",
            "share_session_id",
            "share_tag",
            "unique_k",
            "timestamp",
            "bbid",
            "s",
            "t",
            "mx",
            "ref_src"
        ].forEach(
            p => u.searchParams.delete(p)
        );

        if(
            h === "x.com" ||
            h === "twitter.com"
        ){
            u.hostname = "vxtwitter.com";
        }
        else if(
            h === "reddit.com"
        ){
            u.hostname = "vxreddit.com";
        }
        else if(
            h === "pixiv.net"
        ){
            u.hostname = "phixiv.net";
        }
        else if(
            h === "bilibili.com" ||
            h.endsWith(".bilibili.com") ||
            h === "b23.tv"
        ){
            u.hostname = "vxbilibili.com";
        }

        return u.toString().replace(/\/+$/, "");

    }catch(e){

        return url;

    }
}

async function copyCurrent(){

    await navigator.clipboard.writeText(
        convert(location.href)
    );

    toast(
        strings.toastCopied
    );
}

function toast(msg){

    const d =
        document.createElement("div");

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

    setTimeout(
        () => d.remove(),
        1500
    );
}

function makeBtn(txt){

    const b =
        document.createElement("button");

    b.textContent = txt;

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

    b.addEventListener(
        "mouseenter",
        () => b.style.opacity = "1"
    );

    b.addEventListener(
        "mouseleave",
        () => b.style.opacity = ".65"
    );

    b.addEventListener(
        "click",
        e => {

            e.preventDefault();
            e.stopPropagation();

            copyCurrent();

        }
    );

    return b;
}

function injectX(){

    document
        .querySelectorAll(
            'button[data-testid="bookmark"]'
        )
        .forEach(el => {

            const parent =
                el.parentElement;

            if(!parent)
                return;

            if(
                parent.querySelector(
                    "[data-vxbtn]"
                )
            ){
                return;
            }

            let tweetUrl = null;

            const article =
                el.closest("article");

            if(article){

                const links =
                    article.querySelectorAll(
                        'a[href*="/status/"]'
                    );

                for(const link of links){

                    const href =
                        link.getAttribute(
                            "href"
                        );

                    if(
                        href &&
                        /\/status\/\d+/.test(
                            href
                        )
                    ){

                        tweetUrl =
                            new URL(
                                href,
                                location.origin
                            ).href;

                        break;
                    }
                }
            }

            const b =
                document.createElement(
                    "button"
                );

            b.textContent = strings.btnVX;

            b.setAttribute(
                "data-vxbtn",
                "1"
            );

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

            b.addEventListener(
                "mouseenter",
                () => b.style.opacity = "1"
            );

            b.addEventListener(
                "mouseleave",
                () => b.style.opacity = ".65"
            );

            b.addEventListener(
                "click",
                async e => {

                    e.preventDefault();
                    e.stopPropagation();

                    const url =
                        tweetUrl ||
                        location.href;

                    await navigator
                        .clipboard
                        .writeText(
                            convert(url)
                        );

                    toast(
                        strings.toastCopied
                    );
                }
            );

            el.insertAdjacentElement(
                "afterend",
                b
            );

        });
}

function injectBili(){

    const shareItem =
        document
            .querySelector(
                "#share-btn-outer"
            )
            ?.closest(
                ".toolbar-left-item-wrap"
            );

    if(!shareItem)
        return;

    if(
        document.querySelector(
            "[data-vxbtn-bili]"
        )
    ){
        return;
    }

    const clone =
        shareItem.cloneNode(
            true
        );

    clone.setAttribute(
        "data-vxbtn-bili",
        "1"
    );

    clone
        .querySelectorAll(
            ".van-popover"
        )
        .forEach(
            e => e.remove()
        );

    const shareBtn =
        clone.querySelector(
            "#share-btn-outer"
        );

    if(!shareBtn)
        return;

    shareBtn.id =
        "vx-share-btn";

    shareBtn.removeAttribute(
        "aria-describedby"
    );

    const text =
        shareBtn.querySelector(
            ".video-share-info-text"
        );

    if(text){

        text.textContent =
            strings.btnVX;

    }

    const icon =
        shareBtn.querySelector(
            "svg"
        );

    if(icon){

        icon.remove();

    }

    shareBtn.style.cursor =
        "pointer";

    shareBtn.addEventListener(
        "click",
        async e => {

            e.preventDefault();
            e.stopPropagation();

            await copyCurrent();

        }
    );

    shareItem.insertAdjacentElement(
        "afterend",
        clone
    );
}

function injectReddit(){

    const share =
        [...document.querySelectorAll(
            "button,a"
        )].find(
            el =>
                /share/i.test(
                    el.textContent || ""
                )
        );

    if(!share)
        return;

    if(
        document.querySelector(
            "[data-rxbtn]"
        )
    ){
        return;
    }

    const b =
        makeBtn(strings.btnVX);

    b.setAttribute(
        "data-rxbtn",
        "1"
    );

    share.insertAdjacentElement(
        "afterend",
        b
    );
}

function injectPixiv(){

    // Pixiv 分享按鈕是純 SVG 圖示無文字，用 SVG path 特徵定位
    const shareSvg = document.querySelector(
        'button svg path[d*="M25,17 L25,24"]'
    );

    const share =
        shareSvg
            ?.closest("button");

    if(!share)
        return;

    if(
        document.querySelector(
            "[data-phbtn]"
        )
    ){
        return;
    }

    const b =
        makeBtn(strings.btnVX);

    b.setAttribute(
        "data-phbtn",
        "1"
    );

    share.insertAdjacentElement(
        "afterend",
        b
    );
}

function run(){

    const host =
        location.hostname;

    if(
        (host.includes("x.com") ||
        host.includes("twitter.com")) &&
        settings.sites.x
    ){

        injectX();

    }
    else if(
        host.includes("bilibili.com") &&
        settings.sites.bilibili
    ){

        injectBili();

    }
    else if(
        host.includes("reddit.com") &&
        settings.sites.reddit
    ){

        injectReddit();

    }
    else if(
        host.includes("pixiv.net") &&
        settings.sites.pixiv
    ){

        injectPixiv();

    }
}

// Load settings and language first, then initialize observers and run
Promise.all([
    loadSettings(),
    updateLanguage()
]).then(() => {
    new MutationObserver(
        run
    ).observe(
        document.documentElement,
        {
            childList:true,
            subtree:true
        }
    );
    run();
});

})();