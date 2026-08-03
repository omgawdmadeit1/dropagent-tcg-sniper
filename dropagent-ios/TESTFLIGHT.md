# DropAgent → TestFlight

**Preferred path (same as Come Through):** use the repo-root Capacitor + GitHub Actions pipeline.

See **[../APP_STORE.md](../APP_STORE.md)**

Quick:
1. Copy Apple secrets from come-through → dropagent-tcg-sniper  
2. Create ASC app DropAgent / `com.lvlltd.dropagent`  
3. https://github.com/omgawdmadeit1/dropagent-tcg-sniper/actions/workflows/ios-testflight.yml → Run  

This `dropagent-ios/` Expo project is an optional React Native companion. The shipping TestFlight binary is the Capacitor shell at repo root that loads https://dropagent.lvlltd.com.
