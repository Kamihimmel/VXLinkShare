---
name: publish-safari
description: Guide and checklist for packaging and publishing the extension to the Apple Mac App Store.
---

# Publishing to Apple Safari App Store

This skill provides the conversion command, Xcode packaging steps, and Apple Developer App Store Connect submission details for the Safari Web Extension.

## 📦 Conversion to Xcode Project

Safari Web Extensions are distributed inside a native macOS/iOS application wrapper. You must run the Apple command line conversion utility to generate the Xcode project:

### Pre-requisites
- **Xcode**: Install the full Xcode package from the Mac App Store (not just Command Line Tools).
- **Active Developer Directory**: Set your active directory to Xcode via:
  ```bash
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  ```

### Commands

1. **Build the extension**:
   ```bash
   ./build.sh
   ```
2. **Convert to Xcode project**:
   ```bash
   xcrun safari-web-extension-converter safari/ --project-name "VXLinkShare"
   ```
   *Note: This creates a new folder containing the native app wrapper and Xcode project.*

---

## 🛠️ Xcode Configuration & Packaging

1. **Open Xcode**: Open the generated `VXLinkShare.xcodeproj` or `VXLinkShare.xcworkspace`.
2. **Configure Signing & Capabilities**:
   - For both the **App** target and the **Extension** target, choose your Apple Developer Team.
   - Configure unique Bundle Identifiers for both targets.
3. **Local Testing**:
   - Click **Run** in Xcode to launch the wrapper application.
   - In Safari, navigate to **Settings > Advanced** (or **Develop** menu) and check **Allow Unsigned Extensions** (if testing a debug build).
4. **Archive the Application**:
   - Set the destination device in the scheme selector to **Any Mac Device** (or iOS device).
   - In the Xcode menu, select **Product > Archive**.
   - After building, click **Distribute App** in the Organizer window, selecting **App Store Connect**.

---

## 🚀 App Store Connect Submission

1. Log in to [App Store Connect](https://appstoreconnect.apple.com/). (Requires a paid $99 USD/year Apple Developer Account).
2. Create a **New App** listing and pair it with your Bundle ID.
3. Fill out the Store Page details, including App Description, Screenshots, and Category.
4. Set the Privacy policy URL and list the data collection disclosures (state that local storage is used for preferences and no telemetry data is collected).
5. Link your uploaded Xcode Archive build.
6. Submit the app for App Store Review.
