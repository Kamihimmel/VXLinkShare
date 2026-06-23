// VX Link Helper V3 - Chrome MV3 Service Worker
// Firefox 的 browser.* 替换为 chrome.*
// MV3 service worker 无法直接访问 navigator.clipboard.writeText (无 focused document)
// 改用 offscreen document 完成剪贴板写入

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

// 创建右键菜单 (service worker 顶层执行, 等同于 Firefox background 的初始执行)
chrome.contextMenus.create({
    id: "copy-vx-link",
    title: "复制 VX 链接",
    contexts: ["link"]
});

chrome.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId !== "copy-vx-link") return;

    const text = convert(info.linkUrl);
    await copyToClipboardViaOffscreen(text);
});

/**
 * 通过 offscreen document 写入剪贴板
 * MV3 service worker 没有 DOM, navigator.clipboard.writeText 会失败
 * offscreen document 是 Chrome 官方推荐的解决方案
 */
async function copyToClipboardViaOffscreen(text) {
    try {
        // 检查是否已有 offscreen document (避免重复创建报错)
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ["OFFSCREEN_DOCUMENT"]
        });

        if (existingContexts.length === 0) {
            await chrome.offscreen.createDocument({
                url: "offscreen.html",
                reasons: ["CLIPBOARD"],
                justification: "Write converted VX link to clipboard"
            });
        }

        await chrome.runtime.sendMessage({
            type: "vx-copy-to-clipboard",
            text: text
        });
    } catch (e) {
        console.error("[VX Link Helper] clipboard write failed:", e);
    }
}
