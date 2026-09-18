# Native Mobile App Conversion Guide (Capacitor)

This guide walks through converting this vanilla PWA Chess Game into production-ready native **Android** (`.apk` / `.aab`) and **iOS** (`.ipa`) applications using **Capacitor**.

---

## 1. Prerequisites

Ensure your machine has the necessary native SDKs installed:
- **Node.js**: v18 or newer
- **Android**: [Android Studio](https://developer.android.com/studio) with Android SDK and platform tools.
- **iOS** (macOS only): [Xcode](https://developer.apple.com/xcode/) with CocoaPods.

---

## 2. Step-by-Step Capacitor Setup

### Step 1: Install Capacitor Dependencies
Run the following commands in the project root:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

### Step 2: Initialize Capacitor
```bash
npx cap init "Grandmaster Chess" "com.grandmaster.chess" --web-dir "."
```

This creates a `capacitor.config.json` configuration file in the project root.

### Step 3: Recommended `capacitor.config.json`
Update your `capacitor.config.json` to optimize the WebView display:
```json
{
  "appId": "com.grandmaster.chess",
  "appName": "Grandmaster Chess",
  "webDir": ".",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  },
  "android": {
    "allowMixedContent": true,
    "backgroundColor": "#0f172a"
  },
  "ios": {
    "backgroundColor": "#0f172a",
    "contentInset": "always"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 1500,
      "backgroundColor": "#0f172a",
      "showSpinner": false
    },
    "StatusBar": {
      "style": "DARK",
      "backgroundColor": "#0f172a"
    }
  }
}
```

### Step 4: Add Mobile Platforms
```bash
npx cap add android
npx cap add ios
```

### Step 5: Sync Assets
Whenever you make changes to HTML, CSS, or JS, synchronize them with:
```bash
npx cap sync
```

---

## 3. Building for Android

1. Open the generated Android project in Android Studio:
   ```bash
   npx cap open android
   ```
2. In Android Studio:
   - Wait for Gradle sync to complete.
   - Connect an Android device or launch an Android Virtual Device (AVD).
   - Press **Run** (`Shift + F10`) to test the app.
3. **Generate Signed Bundle / APK for Google Play**:
   - Go to **Build** > **Generate Signed Bundle / APK**.
   - Choose **Android App Bundle** (`.aab`).
   - Select or create your Keystore credentials.
   - Choose the `release` build variant and click **Finish**.

---

## 4. Building for iOS (macOS required)

1. Open the Xcode project:
   ```bash
   npx cap open ios
   ```
2. In Xcode:
   - Select your project root in the left navigator.
   - In **Signing & Capabilities**, assign your Apple Developer Team.
   - Choose a target device or iOS Simulator (e.g., iPhone 15 Pro).
   - Press **Product** > **Run** (`Cmd + R`).
3. **App Store Archive**:
   - Select target device **Any iOS Device (arm64)**.
   - Choose **Product** > **Archive**.
   - Use the Xcode Organizer to validate and upload to App Store Connect.

---

## 5. Critical Codebase Rules for Native Wrappers

To maintain 100% compatibility with native WebViews without introducing runtime exceptions:
1. **Never use `window.open()` or `window.close()`**: WebViews block popups or terminate unexpectedly.
2. **Keep asset URLs relative**: Always reference `./src/css/styles.css` rather than absolute paths `/src/css/styles.css`, as local file protocols (`file://` or `capacitor://`) resolve root paths differently.
3. **Preserve `touch-action: none`**: This CSS property prevents Android and iOS WebViews from hijacking piece drags as page pan gestures.
4. **Use Web Audio API over remote media files**: Procedural synthesis eliminates network dependencies inside the container.
