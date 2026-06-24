// VX Link Helper V3 - Chrome MV3 Service Worker
// 使用 chrome.scripting.executeScript + active tab 寫入剪貼板
// (active tab 具有完整 DOM 與用戶焦點, navigator.clipboard.writeText 可靠)

function convert(url) {
    try {
        const u = new URL(url);
        u.hash = "";
        u.search = "";
        const h = u.hostname.replace(/^www\./, "");

        if (h === "x.com" || h === "twitter.com") {
            u.hostname = "vxtwitter.com";
        } else if (h === "reddit.com") {
            u.hostname = "vxreddit.com";
        } else if (h === "pixiv.net") {
            u.hostname = "phixiv.net";
        } else if (h === "bilibili.com" || h === "b23.tv") {
            u.hostname = "vxbilibili.com";
        }

        return u.toString();
    } catch (e) {
        return url;
    }
}

// 建立右键菜单
chrome.contextMenus.create({
    id: "copy-vx-link",
    title: "复制 VX 链接",
    contexts: ["link"]
});

chrome.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId !== "copy-vx-link") return;

    const text = convert(info.linkUrl);

    // 透過 active tab 執行剪貼板寫入
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) return;

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [text],
            func: (t) => navigator.clipboard.writeText(t)
        });
    } catch (e) {
        console.error("[VX Link Helper] clipboard write failed:", e);
    }
});