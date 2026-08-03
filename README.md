# DropAgent

Multi-retailer Pokémon TCG restock / snipe demo with SKU adder, price limits, agent wallet, and drop alerts.

**Live:** https://dropagent.lvlltd.com  

## TestFlight (same path as Come Through)

Native iOS shell via **Capacitor + Fastlane + GitHub Actions** — no Mac required.

1. Copy Apple secrets from [come-through](https://github.com/omgawdmadeit1/come-through) → this repo’s Actions secrets  
2. Create ASC app **DropAgent** / bundle `com.lvlltd.dropagent` if needed  
3. Actions → **iOS TestFlight** → Run workflow  

Details: [APP_STORE.md](./APP_STORE.md)

## Repo layout

| Path | Purpose |
| --- | --- |
| `public/` / `docs/` | Live GitHub Pages SPA |
| `ios/` | Capacitor Xcode project |
| `capacitor.config.ts` | Loads https://dropagent.lvlltd.com |
| `fastlane/` | Archive + TestFlight upload |
| `.github/workflows/ios-testflight.yml` | macOS CI (same as Come Through) |
| `dropagent-ios/` | Optional Expo RN companion |

## Local web

```bash
# static demo (or open the live domain)
python3 -m http.server 8080 -d public
```
