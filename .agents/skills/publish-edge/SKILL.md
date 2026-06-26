---
name: publish-edge
description: Guide and checklist for packaging and publishing the extension to the Microsoft Edge Add-ons catalog.
---

# Publishing to Microsoft Edge Add-ons

This skill provides the packaging commands, checklists, and submission steps to publish the VXLinkShare extension to the Microsoft Edge Add-ons catalog.

## 📦 Packaging

Microsoft Edge uses the same Manifest V3 codebase as Google Chrome. You can package the built `chrome/` directory.

### Commands

1. **Build the extension**:
   ```bash
   ./build.sh
   ```
2. **Zip the build assets**:
   * **macOS / Linux**:
     ```bash
     cd chrome && zip -r ../vx-link-share-edge.zip * && cd ..
     ```
   * **Windows (PowerShell)**:
     ```powershell
     Compress-Archive -Path chrome\* -DestinationPath vx-link-share-edge.zip -Force
     ```

---

## 📝 Pre-Submission Checklist

- [ ] Run automated tests via `test.html` and verify all tests pass.
- [ ] Run fixture tests via `node scripts/verify-content-fixtures.js` and verify it passes.
- [ ] Verify the version number in `chrome/manifest.json` is updated.
- [ ] Ensure the zip file contains `manifest.json` at the root level (not nested inside a `chrome/` subfolder in the zip).
- [ ] Prepare at least one promotional screenshot (dimensions: 1280x800 or 640x400).
- [ ] Prepare the Privacy Policy URL.

---

## 🚀 Submission Steps

1. Log in to the [Microsoft Partner Center Developer Dashboard](https://partner.microsoft.com/dashboard/microsoftedge). (Registration is free).
2. Click **Create new extension** and upload the `vx-link-share-edge.zip` file.
3. Complete the **Properties**, **Availability**, and **Store Listing** sections:
   - Reuse the description, icons, and screenshots prepared for the Chrome Web Store.
4. Complete the data usage and privacy disclosures (identical to Chrome's local-only data policy).
5. Provide permissions justifications matching Chrome's list.
6. Submit the extension for certification.
