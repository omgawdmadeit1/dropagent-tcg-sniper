# DropAgent — TestFlight / App Store (Windows + GitHub)

Same pipeline as **Come Through**. You ship from **Windows**. GitHub Actions (macOS runners) does the Xcode archive and TestFlight upload. No Mac on your desk required for the build.

**Live web app:** https://dropagent.lvlltd.com  
**Repo:** https://github.com/omgawdmadeit1/dropagent-tcg-sniper  
**Bundle ID:** `com.lvlltd.dropagent`  
**SKU:** `dropagent`

---

## One-time setup (about 10 minutes)

### 1. Copy Apple secrets from Come Through
You already have a working App Store Connect API key on **come-through**. Copy the **same four secrets** into this repo:

https://github.com/omgawdmadeit1/dropagent-tcg-sniper/settings/secrets/actions

| Secret | Value |
| --- | --- |
| `APPLE_TEAM_ID` | Same 10-char Team ID as come-through |
| `APPLE_API_KEY_ID` | Same Key ID |
| `APPLE_API_ISSUER_ID` | Same Issuer UUID |
| `APPLE_API_KEY_P8` | Same entire `.p8` file contents |

Optional (only if you already exported a distribution cert for come-through):
- `APPLE_DISTRIBUTION_P12_BASE64`
- `APPLE_DISTRIBUTION_P12_PASSWORD`

### 2. Create the App Store Connect app (once)
If the workflow says the app does not exist yet:

1. Open https://appstoreconnect.apple.com/apps  
2. **+ → New App**  
3. Platforms: **iOS**  
4. Name: **DropAgent**  
5. Primary Language: English (U.S.)  
6. Bundle ID: **com.lvlltd.dropagent** (register under Certificates, Identifiers & Profiles if missing)  
7. SKU: `dropagent`  
8. User Access: Full Access → Create  

Privacy Policy URL (when asked later): https://dropagent.lvlltd.com  

### 3. Register the Bundle ID (if not auto-created)
https://developer.apple.com/account/resources/identifiers/list  
- App ID → Explicit → `com.lvlltd.dropagent` → name DropAgent

---

## Ship a TestFlight build (Windows — same as Come Through)

1. Open **Actions → iOS TestFlight**  
   https://github.com/omgawdmadeit1/dropagent-tcg-sniper/actions/workflows/ios-testflight.yml  
2. **Run workflow** → short changelog → **Run**  
3. Wait ~15–25 minutes  
4. On your iPhone: **TestFlight** → install **DropAgent**

Or tag:
```text
git tag ios-v1.0.0
git push origin ios-v1.0.0
```

---

## What the workflow does
1. `npm ci` + Capacitor iOS sync  
2. Injects Team ID + notification privacy strings  
3. Fastlane archives with App Store Connect API signing  
4. Uploads IPA to TestFlight  
5. Saves IPA as a GitHub Actions artifact  

Files:
- `.github/workflows/ios-testflight.yml`
- `fastlane/Fastfile`
- `ios/` (Xcode project)
- `capacitor.config.ts` (loads https://dropagent.lvlltd.com)
- Store listing copy: `appstore/metadata/en-US/`

The iOS app is a native Capacitor shell that opens the live DropAgent site — scanner, SKU adder, price limits, and wallet stay in sync with production.

---

## After TestFlight is green
1. Fill listing from `appstore/metadata/en-US/`  
2. Support / Privacy: https://dropagent.lvlltd.com  
3. Submit the same build for App Review when ready  

Review notes:
```
DropAgent is a multi-retailer Pokémon TCG restock / snipe demo.
1. Open app → feed loads watched products
2. Add SKU (DPCI / ASIN) with min/max price
3. Arm agent wallet (simulated snipes)
4. Alerts when watched SKUs restock
No purchases. Demo snipes only. No login required.
```

---

## If a build fails
- Open the failed Actions run → share the red error lines  
- Common: missing secrets on this repo (must copy from come-through), bundle ID not registered, ASC app not created yet, API key role too low  
