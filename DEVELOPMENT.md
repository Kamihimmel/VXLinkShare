# VXLinkShare Developer Documentation

Welcome to the VXLinkShare developer documentation. This document explains the architecture of the project and guides you through building, loading, and testing the browser extension.

---

## Repository Architecture

To prevent duplicate code, this extension uses a shared source system:

*   **`src/` (Single Source of Truth)**: Contains all the shared components of the extension:
    *   `src/common.js`: The core framework and `VX` global — default settings, common translations, storage helpers, the **site registry**, and the generic `convert()` link cleaner. Knows nothing about any specific site.
    *   `src/sites.js`: Every supported site as a self-contained `VX.registerSite({...})` block (host matching, URL rewrite/allow-list, content-script button injection, and per-site metadata). Adding a site = add one block here. Loaded right after `common.js` in every context.
    *   `src/background.js`: The shared background entry point that initializes the context menu and handles clipboard writing.
    *   `src/content.js`: The shared content script — page-side machinery that dispatches to each matching site's injector from the registry.
    *   `src/options/`: Shared options page styles, layout, and logic (toggles and credits are generated from the registry).
    *   `src/icon128.png`: Extension logo.
*   **`chrome/`, `firefox/` & `safari/`**: Contain browser-specific files (such as `manifest.json` files). 
*   **`.gitignore`**: Configured to ignore all compiled build files in `chrome/`, `firefox/`, and `safari/` to maintain a clean Git history.

---

## 🛠️ Building & Cleaning the Extension

To run or distribute the extensions, you must sync the shared source code to the browser-specific folders.

### Build Steps
1.  Open your terminal in the root of the project.
2.  Run the platform-specific build script to copy the shared assets from `src/` into the browser extension target directories (`chrome/`, `firefox/`, `safari/`):
    *   **macOS / Linux**:
        ```bash
        ./build.sh
        ```
    *   **Windows**:
        ```cmd
        build.cmd
        ```

### Cleaning Up Generated Files
To remove the copied files from the browser-specific directories (leaving only the source manifests), run the platform-specific clean script:
*   **macOS / Linux**:
    ```bash
    ./clean.sh
    ```
*   **Windows**:
    ```cmd
    clean.cmd
    ```

---

## 🔌 Loading the Unpacked Extension

Once the build is complete, you can load the extensions directly into your browser:

### Google Chrome (or Chromium-based browsers)
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** using the toggle switch in the top right corner.
3.  Click the **Load unpacked** button in the top left.
4.  Select the **`chrome/`** directory of this repository.

### Mozilla Firefox
1.  Open Firefox and navigate to `about:debugging`.
2.  Click on **This Firefox** in the left sidebar.
3.  Click the **Load Temporary Add-on...** button.
4.  Navigate to the **`firefox/`** directory of this repository and select the `manifest.json` file.

### Apple Safari (macOS)
1.  Enable the **Develop** menu in Safari:
    *   Open Safari and go to **Settings > Advanced**.
    *   Check **Show Develop menu in menu bar** (or **Show features for web developers** in newer macOS versions).
2.  Allow unsigned extensions:
    *   Click the **Developer** menu in Safari's menu bar and check **Allow Unsigned Extensions**.
3.  Load the extension temporarily:
    *   Click the **Developer** menu in Safari's menu bar and select **Web Extension Developer Resources...** (or **Extension Developer...**).
    *   Click **Add Temporary Extension...**, select the **`safari/`** directory of this repository

---

## 🧪 Running Automated Unit Tests

A suite of unit tests is provided to verify that URL parameters are correctly cleaned and domains are properly redirected.

To run the test suite:
1. Open the [`test.html`](file:///Users/howietang/gitrepos/VXLinkShare/test.html) file in any web browser (e.g., double-click the file or open it via your browser's "Open File" menu).
2. The browser will run the tests automatically and display a visual dashboard showing which test cases passed or failed.

The test runner tests conversion rules for **X/Twitter, Reddit, Bilibili, Pixiv**, and general link cleaner safety checks.

## 🧩 Running Content Injection Fixture Tests

For site-specific content-script selectors and feed/list regressions, use checked-in HTML fixtures
instead of relying on live external pages during normal verification.

```bash
node scripts/verify-content-fixtures.js
```

The runner loads fixture specs from `tests/content-fixtures.json`, parses each static page under
`tests/fixtures/`, runs the matching site's `inject(ctx)` function, and verifies that:

1. the expected number of VX buttons is inserted;
2. running the injector twice is idempotent;
3. copied URLs match the item-specific permalink after `VX.convert()`.

To refresh or create a fixture from a live page without adding npm dependencies:

```bash
node scripts/capture-fixture.js https://www.reddit.com/ tests/fixtures/reddit-home-feed.html
```

`capture-fixture.js` saves raw server-rendered HTML. For pages that are mostly client-rendered,
trim or edit the captured file into the smallest relevant static DOM before committing it.
