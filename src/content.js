(function(){

// Current language strings
let strings = VX.getStrings("en");

// Settings cache
let settings = {
    sites: {
        x: true,
        reddit: true,
        bilibili: true,
        pixiv: true
    }
};

// Update translations based on stored language
async function updateLanguage() {
    const language = await VX.getCurrentLanguage();
    strings = VX.getStrings(language);
}

// Load settings from storage
async function loadSettings() {
    const s = await VX.loadSettings();
    settings.sites = s.sites;
}

// Listen for settings changes and re-run injection logic
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync") {
        if (changes.sites) {
            const defaults = VX.DEFAULT_SETTINGS.sites;
            settings.sites = {
                x: changes.sites.newValue?.x !== undefined ? changes.sites.newValue.x : defaults.x,
                reddit: changes.sites.newValue?.reddit !== undefined ? changes.sites.newValue.reddit : defaults.reddit,
                bilibili: changes.sites.newValue?.bilibili !== undefined ? changes.sites.newValue.bilibili : defaults.bilibili,
                pixiv: changes.sites.newValue?.pixiv !== undefined ? changes.sites.newValue.pixiv : defaults.pixiv
            };
            run();
        }
        if (changes.language) {
            updateLanguage().then(run);
        }
    }
});

async function copyCurrent(){
    await navigator.clipboard.writeText(
        VX.convert(location.href)
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
                            VX.convert(url)
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
