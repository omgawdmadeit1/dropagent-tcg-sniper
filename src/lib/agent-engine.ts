import { toast } from "sonner";
import { getProduct, formatMoney, type Product } from "./catalog";
import { dispatchAlert } from "./notifications";
import {
  successChance,
  speedMs,
  useDropStore,
  type DropEvent,
  type Order,
  type CheckoutStage,
} from "./store";

const STAGE_FLOW: { stage: CheckoutStage; progress: number; message: string }[] =
  [
    { stage: "detect", progress: 12, message: "Drop detected — locking session…" },
    { stage: "session", progress: 28, message: "Warming retailer session…" },
    { stage: "cart", progress: 52, message: "Adding to cart…" },
    { stage: "payment", progress: 74, message: "Submitting vaulted payment…" },
    { stage: "confirm", progress: 90, message: "Confirming order…" },
  ];

let engineStarted = false;
const running = new Set<string>();

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

function pickWatchedProducts(): Product[] {
  const { watchlist, agent } = useDropStore.getState();
  return watchlist
    .map((id) => getProduct(id))
    .filter((p): p is Product => !!p)
    .filter((p) => agent.retailers.includes(p.retailer));
}

export function emitSimulatedDrop(forced?: Product) {
  const state = useDropStore.getState();
  if (state.feedPaused && !forced) return;

  const pool = pickWatchedProducts();
  const product =
    forced ??
    (pool.length
      ? pool[Math.floor(Math.random() * pool.length)]!
      : undefined);
  if (!product) return;

  // Avoid duplicate live drops for same product
  if (
    state.drops.some(
      (d) => d.productId === product.id && d.status === "live",
    )
  ) {
    return;
  }

  const drop: DropEvent = {
    id: uid("drop"),
    productId: product.id,
    retailer: product.retailer,
    message: `${product.name} is live at ${product.retailer}`,
    at: Date.now(),
    status: "live",
  };

  state.pushDrop(drop);

  void dispatchAlert({
    title: `LIVE · ${product.retailer}`,
    body: `${product.name} · ${formatMoney(product.price)} — snipe now`,
    productId: product.id,
    retailer: product.retailer,
    kind: "drop",
  });

  maybeAutoSnipe(drop, product);

  window.setTimeout(() => {
    const current = useDropStore.getState().drops.find((d) => d.id === drop.id);
    if (current && current.status === "live") {
      useDropStore.getState().markDrop(drop.id, "gone");
    }
  }, 28000);
}

function maybeAutoSnipe(drop: DropEvent, product: Product) {
  const { agent, wallet, snipes } = useDropStore.getState();
  if (!agent.armed) return;
  if (!agent.retailers.includes(product.retailer)) return;
  if (product.price > agent.maxPrice) return;
  if (product.price * agent.maxQty > wallet.balance) return;
  if (wallet.spentToday + product.price > wallet.spendingCap) return;
  if (snipes.some((s) => s.productId === product.id && s.stage !== "failed"))
    return;

  runSnipe(drop, product);
}

export function runSnipe(drop: DropEvent, product: Product) {
  if (running.has(drop.id)) return;
  running.add(drop.id);

  const store = useDropStore.getState();
  store.startSnipe(drop, product);

  const stepMs = speedMs(store.agent.speed);
  let i = 0;

  const tick = () => {
    const s = useDropStore.getState();
    if (!s.snipes.find((x) => x.dropId === drop.id)) {
      running.delete(drop.id);
      return;
    }

    if (i < STAGE_FLOW.length) {
      const step = STAGE_FLOW[i]!;
      s.updateSnipe(drop.id, {
        stage: step.stage,
        progress: step.progress,
        message: step.message,
      });
      i += 1;
      window.setTimeout(tick, stepMs);
      return;
    }

    const chance = successChance(
      s.agent.speed,
      product.stockExpected,
      s.agent.successRateBoost,
    );
    const ok = Math.random() < chance;
    const qty = Math.min(s.agent.maxQty, 2);
    const total = product.price * qty;

    if (ok && total <= s.wallet.balance) {
      const order: Order = {
        id: uid("ord"),
        productId: product.id,
        retailer: product.retailer,
        qty,
        total,
        at: Date.now(),
        status: "success",
      };
      s.updateSnipe(drop.id, {
        stage: "success",
        progress: 100,
        message: `Order confirmed · ${order.id}`,
        orderId: order.id,
      });
      window.setTimeout(() => {
        useDropStore.getState().finishSnipe(drop.id, order);
        void dispatchAlert({
          title: "Snipe secured",
          body: `${product.name} · ${formatMoney(total)} at ${product.retailer}`,
          productId: product.id,
          retailer: product.retailer,
          kind: "snipe",
        });
        running.delete(drop.id);
      }, 500);
    } else {
      const reason =
        total > s.wallet.balance
          ? "Insufficient wallet balance"
          : "Out of stock during payment";
      const order: Order = {
        id: uid("ord"),
        productId: product.id,
        retailer: product.retailer,
        qty,
        total: 0,
        at: Date.now(),
        status: "failed",
        reason,
      };
      s.updateSnipe(drop.id, {
        stage: "failed",
        progress: 100,
        message: reason,
      });
      window.setTimeout(() => {
        useDropStore.getState().finishSnipe(drop.id, order);
        void dispatchAlert({
          title: "Snipe missed",
          body: `${product.name} — ${reason}`,
          productId: product.id,
          retailer: product.retailer,
          kind: "miss",
        });
        // keep toast for miss if inapp disabled
        if (!useDropStore.getState().alerts.inAppEnabled) {
          toast.error("Snipe missed", { description: reason });
        }
        running.delete(drop.id);
      }, 500);
    }
  };

  window.setTimeout(tick, 200);
}

export function startAgentEngine() {
  if (engineStarted || typeof window === "undefined") return;
  engineStarted = true;

  const seed = () => {
    const pool = pickWatchedProducts();
    if (!pool.length) return;
    for (let i = 0; i < 3; i++) {
      const product = pool[i % pool.length]!;
      const drop: DropEvent = {
        id: uid("seed"),
        productId: product.id,
        retailer: product.retailer,
        message: `${product.name} restock window closed`,
        at: Date.now() - (i + 1) * 1000 * 60 * (8 + i * 3),
        status: i === 0 ? "gone" : Math.random() > 0.5 ? "gone" : "failed",
      };
      useDropStore.getState().pushDrop(drop);
    }
  };
  seed();

  // Drops primarily come from multi-retailer scanner;
  // keep a light fallback cadence so demo stays lively
  window.setTimeout(() => emitSimulatedDrop(), 4000);

  const loop = () => {
    const delay = 16000 + Math.random() * 18000;
    window.setTimeout(() => {
      emitSimulatedDrop();
      loop();
    }, delay);
  };
  loop();
}

export function manualSnipe(dropId: string) {
  const drop = useDropStore.getState().drops.find((d) => d.id === dropId);
  if (!drop || drop.status !== "live") return;
  const product = getProduct(drop.productId);
  if (!product) return;
  runSnipe(drop, product);
}

export function forceDrop(productId: string) {
  const product = getProduct(productId);
  if (!product) return;
  emitSimulatedDrop(product);
}
