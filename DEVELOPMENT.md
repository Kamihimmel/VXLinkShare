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

For store uploads, use the automatic version bump so Firefox/AMO does not reject a package whose manifest version already exists:

```bash
./build.sh --auto-version patch
# or: VX_AUTO_VERSION=patch ./build.sh
```

On Windows:

```cmd
build.cmd --auto-version patch
```

The build output is intentionally minimal: it prints the current VXLinkShare version and the build trigger messages only.

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

---

## 🚀 Publishing to Extension Stores

To distribute the extension to the public, you need to package the built folders and submit them to each platform's respective web store. 

Ensure that you have run `./build.sh` (or `build.cmd` on Windows) so that the `chrome/`, `firefox/`, and `safari/` directories are completely up-to-date before packaging.

### Google Chrome (Chrome Web Store)

Chrome extensions are distributed via the [Chrome Developer Dashboard](https://developer.chrome.com/docs/webstore/publish/).

#### Packaging
Zip the contents of the built `chrome/` directory. Ensure the `manifest.json` is at the root of the zip archive.
*   **macOS / Linux**:
    ```bash
    cd chrome && zip -r ../vx-link-share-chrome.zip * && cd ..
    ```
*   **Windows (PowerShell)**:
    ```powershell
    Compress-Archive -Path chrome\* -DestinationPath vx-link-share-chrome.zip -Force
    ```

#### Submission Steps
1.  Log in to the [Chrome Developer Dashboard](https://developer.chrome.com/dashboard) (requires a one-time developer registration fee).
2.  Click **Add new item** and upload the `vx-link-share-chrome.zip` file.
3.  Fill out the **Store Listing** (description, icons, screenshots, category, and language).
4.  In the **Privacy** tab:
    *   Declare that the extension does **not** collect or use user data (it runs entirely locally and makes no network requests).
    *   Provide a link to your Privacy Policy.
5.  In the **Permissions Justification** section, justify the usage of permissions:
    *   `contextMenus`: Required to show the "Copy Clean VX Link" option in the right-click context menu.
    *   `storage`: Required to save user preferences (e.g., enabled/disabled sites, custom domains).
    *   `scripting`: Required to inject cleaner mechanisms.
    *   `activeTab`: Required to interact with the current tab upon explicit user gesture (context menu action).
    *   *Host Permissions* (`*://*.x.com/*`, `*://*.twitter.com/*`, `*://*.bilibili.com/*`, `*://*.reddit.com/*`, `*://*.pixiv.net/*`): Required to inject the "VX" copy buttons directly on supported pages.
6.  Submit for review.

---

### Microsoft Edge (Edge Add-ons)

Microsoft Edge extensions are published via the [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge). Edge uses the exact same Manifest V3 codebase as Chrome.

#### Packaging
Use the same zip archive generated for Chrome (`vx-link-share-chrome.zip`) or build a specific one:
*   **macOS / Linux**:
    ```bash
    cd chrome && zip -r ../vx-link-share-edge.zip * && cd ..
    ```
*   **Windows (PowerShell)**:
    ```powershell
    Compress-Archive -Path chrome\* -DestinationPath vx-link-share-edge.zip -Force
    ```

#### Submission Steps
1.  Log in to the [Microsoft Partner Center Developer Dashboard](https://partner.microsoft.com/dashboard/microsoftedge) (registration is free).
2.  Click **Create new extension** and upload the zip file.
3.  Fill in the **Properties**, **Availability**, and **Store Listing** details (you can reuse the descriptions, screenshots, and icons from Chrome Web Store).
4.  Provide the same justifications for permissions and data usage policies as Chrome.
5.  Submit the extension for certification.

---

### Mozilla Firefox (Add-ons for Firefox / AMO)

Firefox extensions are submitted via the [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/). Because Firefox uses Manifest V2 in this repository, you must package the `firefox/` directory.

#### Packaging
Zip the contents of the built `firefox/` directory:
*   **macOS / Linux**:
    ```bash
    cd firefox && zip -r ../vx-link-share-firefox.zip * && cd ..
    ```
*   **Windows (PowerShell)**:
    ```powershell
    Compress-Archive -Path firefox\* -DestinationPath vx-link-share-firefox.zip -Force
    ```

#### Submission Steps
1.  Log in to the [Add-on Developer Hub](https://addons.mozilla.org/developers/).
2.  Click **Submit a New Add-on**.
3.  Select **On this site (AMO)** to list it publicly, or **On your own** for self-distribution.
4.  Upload the `vx-link-share-firefox.zip` package.
5.  AMO reviews submissions for third-party libraries and transpiled code. Since this extension is written in dependency-free vanilla JS, select **No** when asked if your source code is minified, obfuscated, or needs compilation.
6.  Under **Permissions**, justify:
    *   `clipboardWrite`: Required to write the cleaned link directly to the user's clipboard from the background script.
7.  Complete the store profile and submit.

---

### Apple Safari (Mac App Store / App Store)

Safari Web Extensions must be packaged into a native app wrapper using Xcode before submission to the App Store.

#### Conversion to Xcode Project
Safari extensions require a macOS/iOS app wrapper. Run the converter tool using the built `safari/` directory:
```bash
xcrun safari-web-extension-converter safari/ --project-name "VXLinkShare"
```
*Note: This generates a new Xcode project folder containing native macOS and iOS wrapper applications.*

#### Packaging and Submission Steps
1.  Open the newly generated `.xcodeproj` or `.xcworkspace` in Xcode.
2.  Select the **VXLinkShare** target and configure **Signing & Capabilities**:
    *   Select your Apple Developer Account team (requires a paid Apple Developer Program membership).
    *   Set unique bundle identifiers for both the wrapper app and the extension target.
3.  Test the extension locally:
    *   Choose **Product > Run** to run the macOS app wrapper.
    *   Launch Safari, open Settings > Advanced, and ensure **Show features for web developers** / **Show Develop menu** is enabled.
    *   Check **Allow Unsigned Extensions** under the Develop menu.
4.  Prepare for App Store submission:
    *   In Xcode, select the active scheme as **Any Mac Device** (or iOS device if building for iOS).
    *   Select **Product > Archive**.
    *   Once archiving is complete, click **Distribute App** in the Organizer window and choose **App Store Connect**.
5.  Log in to [App Store Connect](https://appstoreconnect.apple.com/) and create a new App record matching your bundle ID.
6.  Fill out the App Store listing details, privacy policy, and screenshots.
7.  Select the uploaded archive build, configure permissions disclosures (declaring local storage usage), and submit the app for review.
