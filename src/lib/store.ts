import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CATALOG,
  RETAILERS,
  retailerSearchUrl,
  type Product,
  type ProductKind,
  type Retailer,
} from "./catalog";

export type DropEvent = {
  id: string;
  productId: string;
  retailer: Retailer;
  message: string;
  at: number;
  status: "live" | "gone" | "sniped" | "failed" | "skipped";
};

export type CheckoutStage =
  | "idle"
  | "detect"
  | "session"
  | "cart"
  | "payment"
  | "confirm"
  | "success"
  | "failed";

export type ActiveSnipe = {
  dropId: string;
  productId: string;
  stage: CheckoutStage;
  progress: number;
  startedAt: number;
  message: string;
  orderId?: string;
};

export type Order = {
  id: string;
  productId: string;
  retailer: Retailer;
  qty: number;
  total: number;
  at: number;
  status: "success" | "failed";
  reason?: string;
};

export type Wallet = {
  balance: number;
  cardLast4: string;
  cardBrand: "Visa" | "Mastercard" | "Amex";
  holder: string;
  spendingCap: number;
  spentToday: number;
};

export type AgentConfig = {
  armed: boolean;
  maxPrice: number;
  minPrice: number;
  maxQty: number;
  retailers: Retailer[];
  speed: "safe" | "balanced" | "aggressive";
  autoConfirm: boolean;
  successRateBoost: number;
  /** Skip drops above maxPrice (show as skipped instead of sniping) */
  enforcePriceLimit: boolean;
};

export type AlertChannel = "push" | "sms" | "inapp";

export type AlertPrefs = {
  phone: string;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHours: boolean;
  alertOnDrop: boolean;
  alertOnSnipe: boolean;
  alertOnMiss: boolean;
};

export type AlertLog = {
  id: string;
  channel: AlertChannel;
  title: string;
  body: string;
  at: number;
  productId?: string;
  retailer?: Retailer;
  status: "sent" | "failed" | "pending";
};

export type RetailerScanStatus = {
  retailer: Retailer;
  status: "idle" | "scanning" | "ok" | "stock" | "error";
  lastCheck: number;
  lastMessage: string;
  latencyMs: number;
  hitsToday: number;
};

export type CatalogFilters = {
  query: string;
  minPrice: number;
  maxPrice: number;
  onlyUnderCap: boolean;
};

export type AddSkuInput = {
  sku: string;
  name?: string;
  retailer: Retailer;
  price: number;
  maxPrice?: number;
  set?: string;
  kind?: ProductKind;
};

type State = {
  watchlist: string[];
  customProducts: Product[];
  drops: DropEvent[];
  wallet: Wallet;
  agent: AgentConfig;
  snipes: ActiveSnipe[];
  orders: Order[];
  feedPaused: boolean;
  hydrated: boolean;
  alerts: AlertPrefs;
  alertLog: AlertLog[];
  scans: RetailerScanStatus[];
  scannerRunning: boolean;
  lastGlobalScan: number;
  filters: CatalogFilters;

  setHydrated: (v: boolean) => void;
  toggleWatch: (productId: string) => void;
  setAgent: (partial: Partial<AgentConfig>) => void;
  setWallet: (partial: Partial<Wallet>) => void;
  setAlerts: (partial: Partial<AlertPrefs>) => void;
  setFilters: (partial: Partial<CatalogFilters>) => void;
  topUp: (amount: number) => void;
  addCustomSku: (input: AddSkuInput) => { ok: boolean; error?: string; id?: string };
  removeCustomSku: (id: string) => void;
  setProductMaxPrice: (id: string, maxPrice: number | undefined) => void;
  pushDrop: (drop: DropEvent) => void;
  markDrop: (id: string, status: DropEvent["status"]) => void;
  startSnipe: (drop: DropEvent, product: Product) => void;
  updateSnipe: (dropId: string, patch: Partial<ActiveSnipe>) => void;
  finishSnipe: (dropId: string, order: Order) => void;
  clearSnipes: () => void;
  setFeedPaused: (v: boolean) => void;
  pushAlert: (alert: AlertLog) => void;
  updateScan: (retailer: Retailer, patch: Partial<RetailerScanStatus>) => void;
  setScannerRunning: (v: boolean) => void;
  setLastGlobalScan: (t: number) => void;
  resetDemo: () => void;
};

const defaultWallet: Wallet = {
  balance: 500,
  cardLast4: "4242",
  cardBrand: "Visa",
  holder: "Demo Hunter",
  spendingCap: 300,
  spentToday: 0,
};

const defaultAgent: AgentConfig = {
  armed: true,
  maxPrice: 160,
  minPrice: 0,
  maxQty: 1,
  retailers: [...RETAILERS],
  speed: "aggressive",
  autoConfirm: true,
  successRateBoost: 0,
  enforcePriceLimit: true,
};

const defaultAlerts: AlertPrefs = {
  phone: "",
  pushEnabled: true,
  smsEnabled: true,
  inAppEnabled: true,
  quietHours: false,
  alertOnDrop: true,
  alertOnSnipe: true,
  alertOnMiss: false,
};

const defaultFilters: CatalogFilters = {
  query: "",
  minPrice: 0,
  maxPrice: 500,
  onlyUnderCap: false,
};

function initialScans(): RetailerScanStatus[] {
  return RETAILERS.map((retailer) => ({
    retailer,
    status: "idle" as const,
    lastCheck: 0,
    lastMessage: "Waiting for first scan",
    latencyMs: 0,
    hitsToday: 0,
  }));
}

function slugSku(sku: string) {
  return sku
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export const useDropStore = create<State>()(
  persist(
    (set, get) => ({
      watchlist: CATALOG.slice(0, 8).map((p) => p.id),
      customProducts: [],
      drops: [],
      wallet: defaultWallet,
      agent: defaultAgent,
      snipes: [],
      orders: [],
      feedPaused: false,
      hydrated: false,
      alerts: defaultAlerts,
      alertLog: [],
      scans: initialScans(),
      scannerRunning: true,
      lastGlobalScan: 0,
      filters: defaultFilters,

      setHydrated: (v) => set({ hydrated: v }),

      toggleWatch: (productId) =>
        set((s) => ({
          watchlist: s.watchlist.includes(productId)
            ? s.watchlist.filter((id) => id !== productId)
            : [...s.watchlist, productId],
        })),

      setAgent: (partial) =>
        set((s) => ({ agent: { ...s.agent, ...partial } })),

      setWallet: (partial) =>
        set((s) => ({ wallet: { ...s.wallet, ...partial } })),

      setAlerts: (partial) =>
        set((s) => ({ alerts: { ...s.alerts, ...partial } })),

      setFilters: (partial) =>
        set((s) => ({ filters: { ...s.filters, ...partial } })),

      topUp: (amount) =>
        set((s) => ({
          wallet: { ...s.wallet, balance: s.wallet.balance + amount },
        })),

      addCustomSku: (input) => {
        const sku = input.sku.trim().toUpperCase();
        if (sku.length < 3) {
          return { ok: false, error: "SKU must be at least 3 characters" };
        }
        const price = Number(input.price);
        if (!Number.isFinite(price) || price <= 0) {
          return { ok: false, error: "Enter a valid price" };
        }
        const state = get();
        const all = [...state.customProducts, ...CATALOG];
        if (all.some((p) => p.sku.toUpperCase() === sku)) {
          // If it already exists, just watch it
          const existing = all.find((p) => p.sku.toUpperCase() === sku)!;
          if (!state.watchlist.includes(existing.id)) {
            set({ watchlist: [...state.watchlist, existing.id] });
          }
          return {
            ok: true,
            id: existing.id,
            error: "SKU already in catalog — added to watchlist",
          };
        }

        const id = `custom-${slugSku(sku)}-${Date.now().toString(36)}`;
        const product: Product = {
          id,
          name: (input.name?.trim() || `SKU ${sku}`).slice(0, 80),
          set: (input.set?.trim() || "Custom watch").slice(0, 60),
          kind: input.kind ?? "Custom SKU",
          retailer: input.retailer,
          price,
          msrp: price,
          stockExpected: "ultra-low",
          sku,
          href: retailerSearchUrl(input.retailer, sku),
          imageHue: Math.floor(Math.random() * 360),
          custom: true,
          maxPrice:
            input.maxPrice != null && input.maxPrice > 0
              ? input.maxPrice
              : undefined,
        };

        set((s) => ({
          customProducts: [product, ...s.customProducts],
          watchlist: s.watchlist.includes(id)
            ? s.watchlist
            : [id, ...s.watchlist],
        }));
        return { ok: true, id };
      },

      removeCustomSku: (id) =>
        set((s) => ({
          customProducts: s.customProducts.filter((p) => p.id !== id),
          watchlist: s.watchlist.filter((w) => w !== id),
        })),

      setProductMaxPrice: (id, maxPrice) =>
        set((s) => ({
          customProducts: s.customProducts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  maxPrice:
                    maxPrice != null && maxPrice > 0 ? maxPrice : undefined,
                }
              : p,
          ),
        })),

      pushDrop: (drop) =>
        set((s) => ({
          drops: [drop, ...s.drops].slice(0, 40),
        })),

      markDrop: (id, status) =>
        set((s) => ({
          drops: s.drops.map((d) => (d.id === id ? { ...d, status } : d)),
        })),

      startSnipe: (drop, _product) => {
        const existing = get().snipes.find((x) => x.dropId === drop.id);
        if (existing) return;
        set((s) => ({
          snipes: [
            {
              dropId: drop.id,
              productId: drop.productId,
              stage: "detect",
              progress: 5,
              startedAt: Date.now(),
              message: "Drop detected — locking session…",
            },
            ...s.snipes,
          ],
        }));
      },

      updateSnipe: (dropId, patch) =>
        set((s) => ({
          snipes: s.snipes.map((x) =>
            x.dropId === dropId ? { ...x, ...patch } : x,
          ),
        })),

      finishSnipe: (dropId, order) =>
        set((s) => ({
          snipes: s.snipes.filter((x) => x.dropId !== dropId),
          orders: [order, ...s.orders].slice(0, 50),
          drops: s.drops.map((d) =>
            d.id === dropId
              ? {
                  ...d,
                  status: order.status === "success" ? "sniped" : "failed",
                }
              : d,
          ),
          wallet:
            order.status === "success"
              ? {
                  ...s.wallet,
                  balance: Math.max(0, s.wallet.balance - order.total),
                  spentToday: s.wallet.spentToday + order.total,
                }
              : s.wallet,
        })),

      clearSnipes: () => set({ snipes: [] }),

      setFeedPaused: (v) => set({ feedPaused: v }),

      pushAlert: (alert) =>
        set((s) => ({
          alertLog: [alert, ...s.alertLog].slice(0, 60),
        })),

      updateScan: (retailer, patch) =>
        set((s) => ({
          scans: s.scans.map((sc) =>
            sc.retailer === retailer ? { ...sc, ...patch } : sc,
          ),
        })),

      setScannerRunning: (v) => set({ scannerRunning: v }),

      setLastGlobalScan: (t) => set({ lastGlobalScan: t }),

      resetDemo: () =>
        set({
          watchlist: CATALOG.slice(0, 8).map((p) => p.id),
          customProducts: [],
          drops: [],
          wallet: defaultWallet,
          agent: defaultAgent,
          snipes: [],
          orders: [],
          feedPaused: false,
          alerts: defaultAlerts,
          alertLog: [],
          scans: initialScans(),
          scannerRunning: true,
          lastGlobalScan: 0,
          filters: defaultFilters,
        }),
    }),
    {
      name: "dropagent-v3",
      partialize: (s) => ({
        watchlist: s.watchlist,
        customProducts: s.customProducts,
        wallet: s.wallet,
        agent: s.agent,
        orders: s.orders,
        alerts: s.alerts,
        alertLog: s.alertLog.slice(0, 20),
        filters: s.filters,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function speedMs(speed: AgentConfig["speed"]): number {
  if (speed === "aggressive") return 420;
  if (speed === "balanced") return 700;
  return 1100;
}

export function successChance(
  speed: AgentConfig["speed"],
  stock: Product["stockExpected"],
  boost: number,
): number {
  let base = speed === "aggressive" ? 0.72 : speed === "balanced" ? 0.62 : 0.5;
  if (stock === "ultra-low") base -= 0.18;
  if (stock === "low") base -= 0.08;
  return Math.min(0.95, Math.max(0.12, base + boost));
}
