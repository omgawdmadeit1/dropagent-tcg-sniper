import {
  CATALOG,
  RETAILERS,
  getProduct,
  type Product,
  type Retailer,
} from "./catalog";
import { emitSimulatedDrop } from "./agent-engine";
import { useDropStore } from "./store";

let scannerStarted = false;
let scanTimer: number | undefined;

const SCAN_MESSAGES = [
  "Checking inventory endpoints…",
  "Polling product API…",
  "Reading availability flags…",
  "Validating SKU map…",
  "No change — still OOS",
  "Cart probe clean",
  "Region stock matrix OK",
];

function latencyFor(retailer: Retailer): number {
  const base: Record<Retailer, number> = {
    Target: 180,
    Walmart: 220,
    "Best Buy": 200,
    "Pokémon Center": 260,
    GameStop: 240,
    Amazon: 150,
    Costco: 300,
    "Sam's Club": 280,
    "Barnes & Noble": 320,
    CVS: 350,
  };
  return base[retailer] + Math.floor(Math.random() * 120);
}

function productsForRetailer(retailer: Retailer): Product[] {
  const { watchlist, agent, customProducts } = useDropStore.getState();
  return watchlist
    .map((id) => getProduct(id, customProducts) ?? CATALOG.find((p) => p.id === id))
    .filter((p): p is Product => !!p && p.retailer === retailer)
    .filter((p) => agent.retailers.includes(p.retailer));
}

async function scanRetailer(retailer: Retailer) {
  const store = useDropStore.getState();
  if (!store.scannerRunning) return;
  if (!store.agent.retailers.includes(retailer)) {
    store.updateScan(retailer, {
      status: "idle",
      lastMessage: "Disabled in agent filters",
    });
    return;
  }

  const start = Date.now();
  store.updateScan(retailer, {
    status: "scanning",
    lastMessage: SCAN_MESSAGES[Math.floor(Math.random() * 3)]!,
  });

  const latency = latencyFor(retailer);
  await new Promise((r) => window.setTimeout(r, Math.min(latency, 480)));

  const watched = productsForRetailer(retailer);
  const hit =
    watched.length > 0 &&
    !store.feedPaused &&
    Math.random() < 0.08;

  if (hit) {
    const product = watched[Math.floor(Math.random() * watched.length)]!;
    store.updateScan(retailer, {
      status: "stock",
      lastCheck: Date.now(),
      lastMessage: `IN STOCK · ${product.name} · SKU ${product.sku}`,
      latencyMs: Date.now() - start,
      hitsToday:
        (store.scans.find((s) => s.retailer === retailer)?.hitsToday ?? 0) + 1,
    });
    emitSimulatedDrop(product);
    return;
  }

  const msg =
    watched.length === 0
      ? "No watched SKUs for this retailer"
      : SCAN_MESSAGES[3 + Math.floor(Math.random() * 4)]!;

  store.updateScan(retailer, {
    status: Math.random() < 0.03 ? "error" : "ok",
    lastCheck: Date.now(),
    lastMessage:
      Math.random() < 0.03 ? "Rate limited — backing off" : msg,
    latencyMs: Date.now() - start,
  });
}

async function scanCycle() {
  const store = useDropStore.getState();
  if (!store.scannerRunning) return;

  store.setLastGlobalScan(Date.now());

  const enabled = RETAILERS.filter((r) =>
    store.agent.retailers.includes(r),
  );
  if (!enabled.length) return;

  const shuffled = [...enabled].sort(() => Math.random() - 0.5);
  const batch = shuffled.slice(0, 3);

  await Promise.all(batch.map((r) => scanRetailer(r)));
}

export function startRetailerScanner() {
  if (scannerStarted || typeof window === "undefined") return;
  scannerStarted = true;

  void (async () => {
    for (const r of RETAILERS) {
      await scanRetailer(r);
      await new Promise((res) => window.setTimeout(res, 120));
    }
  })();

  const loop = () => {
    scanTimer = window.setTimeout(() => {
      void scanCycle().finally(loop);
    }, 2200 + Math.random() * 1800);
  };
  loop();
}

export function stopRetailerScanner() {
  if (scanTimer) window.clearTimeout(scanTimer);
  scannerStarted = false;
}

export async function forceFullScan() {
  const store = useDropStore.getState();
  store.setScannerRunning(true);
  store.setLastGlobalScan(Date.now());
  for (const r of RETAILERS) {
    if (store.agent.retailers.includes(r)) {
      await scanRetailer(r);
    }
  }
}
