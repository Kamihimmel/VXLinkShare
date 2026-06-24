const VX = require('./src/common.js');
const assert = require('assert');

const testCases = [
    {
        name: "Twitter clean & convert",
        input: "https://twitter.com/user/status/12345?s=20&t=abc",
        expected: "https://vxtwitter.com/user/status/12345"
    },
    {
        name: "X.com clean & convert",
        input: "https://x.com/user/status/67890?spm_id_from=123&from_spmid=456",
        expected: "https://vxtwitter.com/user/status/67890"
    },
    {
        name: "Reddit clean & convert",
        input: "https://www.reddit.com/r/pics/comments/xyz/?utm_source=share&ref_src=twsrc",
        expected: "https://vxreddit.com/r/pics/comments/xyz"
    },
    {
        name: "Bilibili blacklist param removal and whitelist retention",
        input: "https://www.bilibili.com/video/BV12345/?spm_id_from=333.788&vd_source=abc&p=2&t=45&some_garbage=123",
        expected: "https://vxbilibili.com/video/BV12345/?p=2&t=45"
    },
    {
        name: "Pixiv clean & convert",
        input: "https://www.pixiv.net/artworks/123456?utm_medium=referral&share_plat=ios",
        expected: "https://phixiv.net/artworks/123456"
    },
    {
        name: "Unrelated sites cleaning generic trackers",
        input: "https://example.com/page?q=hello&spm_id_from=some_tracker&ref_src=direct",
        expected: "https://example.com/page?q=hello"
    }
];

let failed = 0;
console.log("Running VXLinkShare conversion tests...");
testCases.forEach((tc, idx) => {
    try {
        const actual = VX.convert(tc.input);
        assert.strictEqual(actual, tc.expected);
        console.log(`✅ [PASS] ${tc.name}`);
    } catch (e) {
        console.error(`❌ [FAIL] ${tc.name}`);
        console.error(`   Input:    ${tc.input}`);
        console.error(`   Expected: ${tc.expected}`);
        console.error(`   Actual:   ${e.actual || VX.convert(tc.input)}`);
        failed++;
    }
});

if (failed > 0) {
    console.error(`\nTest run failed: ${failed} tests failed.`);
    process.exit(1);
} else {
    console.log("\nAll tests passed successfully!");
    process.exit(0);
}
