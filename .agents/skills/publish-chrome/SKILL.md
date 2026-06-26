---
name: publish-chrome
description: Guide and checklist for packaging and publishing the extension to the Google Chrome Web Store.
---

# Publishing to Chrome Web Store

This skill provides the packaging commands, checklists, and submission steps to publish the VXLinkShare extension to the Chrome Web Store.

## 📦 Packaging

To prepare the extension for Chrome, build the project and create a zip file of the `chrome/` directory.

### Commands

1. **Build the extension**:
   ```bash
   ./build.sh
   ```
2. **Zip the build assets**:
   * **macOS / Linux**:
     ```bash
     cd chrome && zip -r ../vx-link-share-chrome.zip * && cd ..
     ```
   * **Windows (PowerShell)**:
     ```powershell
     Compress-Archive -Path chrome\* -DestinationPath vx-link-share-chrome.zip -Force
     ```

---

## 📝 Pre-Submission Checklist

- [ ] Run automated tests via `test.html` and verify all tests pass.
- [ ] Run fixture tests via `node scripts/verify-content-fixtures.js` and verify it passes.
- [ ] Verify the version number in `chrome/manifest.json` is updated.
- [ ] Ensure the zip file contains `manifest.json` at the root level (not nested inside a `chrome/` subfolder in the zip).
- [ ] Prepare at least one promotional screenshot (dimensions: 1280x800 or 640x400).
- [ ] Prepare the Privacy Policy URL (since the extension accesses storage and host content).

---

## 🚀 Submission Steps

1. Log in to the [Chrome Developer Dashboard](https://developer.chrome.com/dashboard). (Requires a one-time $5 USD registration fee if this is a new account).
2. Click **Add new item** and upload `vx-link-share-chrome.zip`.
3. Complete the **Store Listing**:
   - **Description**: Add a clear, functional description of what the extension does (e.g., cleans tracking params and rewrites links to embed-friendly domains).
   - **Icons & Screenshots**: Upload store assets.
4. Complete the **Privacy** section:
   - State that the extension does **not** collect or transmit user data. Everything runs locally inside the browser.
   - Provide a link to your public Privacy Policy page.
5. Provide **Permissions Justification** for the requested permissions:
   - `contextMenus`: Required to show the "Copy Clean VX Link" option when right-clicking links.
   - `storage`: Required to save user preferences/options.
   - `scripting`: Required to inject cleaner mechanisms.
   - `activeTab`: Required to interact with the current tab upon explicit user gesture (context menu action).
   - *Host Permissions* (`*://*.x.com/*`, etc.): Required to run content scripts to inject the "VX" copy buttons directly on supported pages.
6. Submit the extension for review.
