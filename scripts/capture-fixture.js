#!/usr/bin/env node
/*
 * Capture a raw HTML fixture without adding project dependencies.
 *
 * Usage:
 *   node scripts/capture-fixture.js https://www.reddit.com/ tests/fixtures/reddit-home-feed.html
 *
 * This fetches the server-rendered HTML only. For heavily client-rendered pages,
 * use it as a starting point and trim/check in the minimal DOM needed by the
 * content fixture runner.
 */
const fs = require("fs");
const path = require("path");

async function main() {
    const [, , url, outPath] = process.argv;
    if (!url || !outPath) {
        console.error("Usage: node scripts/capture-fixture.js <url> <output.html>");
        process.exit(2);
    }

    if (typeof fetch !== "function") {
        console.error("This script requires Node.js with global fetch support (Node 18+).");
        process.exit(2);
    }

    const response = await fetch(url, {
        headers: {
            "user-agent": "Mozilla/5.0 VXLinkShareFixtureCapture/1.0",
            "accept": "text/html,application/xhtml+xml"
        }
    });

    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const resolved = path.resolve(outPath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, html);
    console.log(`Captured ${html.length} bytes from ${url} -> ${resolved}`);
}

main().catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
