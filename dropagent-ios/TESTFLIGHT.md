# DropAgent → TestFlight

Native Expo (React Native) app with the same core features as the web demo:

- Multi-retailer scanner feed  
- Custom **SKU adder** (DPCI / ASIN / retailer / price / max pay)  
- **Price limits** + enforce toggle  
- Agent wallet arm / disarm (simulated snipes)  
- Push notification permission + local drop alerts  

Bundle ID: `com.lvlltd.dropagent`  
App name: **DropAgent**

## Prerequisites

1. [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)  
2. Free [Expo](https://expo.dev) account  
3. Node 20+ on your machine (Mac **not** required — EAS builds in the cloud)

## One-time setup

```bash
cd dropagent-ios
npm install
npm i -g eas-cli
eas login
eas init   # links project; paste projectId into app.json extra.eas.projectId
```

In [App Store Connect](https://appstoreconnect.apple.com):

1. **My Apps → + → New App**  
2. Name: DropAgent · Bundle ID: `com.lvlltd.dropagent`  
3. Copy the numeric **Apple ID** (App Store Connect app id) into `eas.json` → `submit.production.ios.ascAppId`  
4. Set `appleId` (your Apple ID email) and `appleTeamId` (Membership details)

## Build + TestFlight

```bash
# Production iOS binary (cloud)
eas build --platform ios --profile production

# When build finishes, submit to TestFlight
eas submit --platform ios --latest --profile production
```

Then in App Store Connect → TestFlight:

- Wait for processing (~5–30 min)  
- Add internal testers (up to 100, no review)  
- Or external group (Beta App Review once)

## Local preview (this sandbox / any browser)

```bash
npm run web -- --port 8080 --host 0.0.0.0
```

## Web companion

https://dropagent.lvlltd.com

## Notes

- Purchases are **simulated** (demo agent). Do not claim real retailer checkout in App Review notes.  
- Use App Review note: *“Demo multi-retailer restock radar for TCG products. No real payments or retailer accounts.”*  
- After first submit, increment version/build via `eas build` (`autoIncrement` is on for production).
