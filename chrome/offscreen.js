// Offscreen document 脚本: 接收 background 的消息, 在有 DOM 的环境下写入剪贴板
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "vx-copy-to-clipboard") {
        navigator.clipboard.writeText(msg.text)
            .then(() => sendResponse({ ok: true }))
            .catch((err) => sendResponse({ ok: false, error: err && err.message }));
        return true; // 保持消息通道开放以等待异步 sendResponse
    }
});
