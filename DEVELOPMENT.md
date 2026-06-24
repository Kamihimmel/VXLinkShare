# VXLinkShare Developer Documentation

Welcome to the VXLinkShare developer documentation. This document explains the architecture of the project and guides you through building, loading, and testing the browser extension.

---

## Repository Architecture

To prevent duplicate code, this extension uses a shared source system:

*   **`src/` (Single Source of Truth)**: Contains all the shared components of the extension:
    *   `src/common.js`: The core logic defining default settings, localized translations, storage wrapper helpers, and link cleanup rules.
    *   `src/background.js`: The shared background script entry point that initializes the context menu and handles clipboard writing.
    *   `src/content.js`: The shared UI script injected into pages.
    *   `src/options/`: Shared options page styles, layout, and logic.
    *   `src/icon128.png`: Extension logo.
*   **`chrome/`, `firefox/` & `safari/`**: Contain browser-specific files (such as `manifest.json` files). 
*   **`.gitignore`**: Configured to ignore all compiled build files in `chrome/`, `firefox/`, and `safari/` to maintain a clean Git history.

---

## 🛠️ Building the Extension

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
