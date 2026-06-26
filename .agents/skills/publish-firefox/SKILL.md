---
name: publish-firefox
description: Guide and checklist for packaging and publishing the extension to Mozilla Add-ons (AMO).
---

# Publishing to Mozilla Add-ons (AMO)

This skill provides the packaging commands, checklists, and submission steps to publish the VXLinkShare extension to Mozilla Add-ons (AMO).

## 📦 Packaging

Mozilla Firefox uses Manifest V2 in this repository. You must package the built `firefox/` directory.

### Commands

1. **Build the extension**:
   ```bash
   ./build.sh
   ```
2. **Zip the build assets**:
   * **macOS / Linux**:
     ```bash
     cd firefox && zip -r ../vx-link-share-firefox.zip * && cd ..
     ```
   * **Windows (PowerShell)**:
     ```powershell
     Compress-Archive -Path firefox\* -DestinationPath vx-link-share-firefox.zip -Force
     ```

---

## 📝 Pre-Submission Checklist

- [ ] Run automated tests via `test.html` and verify all tests pass.
- [ ] Run fixture tests via `node scripts/verify-content-fixtures.js` and verify it passes.
- [ ] Verify the version number in `firefox/manifest.json` is updated.
- [ ] Ensure the zip file contains `manifest.json` at the root level.
- [ ] Prepare store listing descriptions, category choice, and screenshots.

---

## 🚀 Submission Steps

1. Log in to the [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/). (Registration is free).
2. Click **Submit a New Add-on**.
3. Choose distribution method:
   - **On this site (AMO)**: Lists the extension publicly on Mozilla's directory.
   - **On your own**: Provides a signed `.xpi` file for you to distribute manually.
4. Upload `vx-link-share-firefox.zip`.
5. **Source Code Disclosure**: Firefox asks if your extension uses minified, compiled, or transpiled code.
   - Select **No**, as this project consists of dependency-free vanilla JavaScript copied directly from the `src/` folder.
6. Provide **Permissions Justification**:
   - `clipboardWrite`: Required to write the cleaned link directly to the user's clipboard from the background script.
7. Fill out the store listing details (listing name, summary, description, screenshots).
8. Submit for review.
