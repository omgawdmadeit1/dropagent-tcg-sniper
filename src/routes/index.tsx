import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Bot,
  Crosshair,
  LayoutGrid,
  Wallet,
  History,
  Info,
  Radar,
  Plus,
  Search,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import {
  CATALOG,
  RETAILERS,
  getAllProducts,
  type Retailer,
} from "@/lib/catalog";
import { startAgentEngine } from "@/lib/agent-engine";
import { startRetailerScanner } from "@/lib/scanner";
import { registerServiceWorker } from "@/lib/notifications";
import { useDropStore } from "@/lib/store";
import { ProductCard } from "@/components/product-card";
import { LiveFeed } from "@/components/feed";
import {
  AgentPanel,
  WalletPanel,
  OrdersPanel,
} from "@/components/agent-panel";
import { AlertsPanel, RetailerRadar } from "@/components/alerts-panel";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({
  component: DropAgentApp,
});

type Tab = "scan" | "alerts" | "catalog" | "agent" | "wallet" | "orders";

function DropAgentApp() {
  const [tab, setTab] = useState<Tab>("scan");
  const agent = useDropStore((s) => s.agent);
  const wallet = useDropStore((s) => s.wallet);
  const watchlist = useDropStore((s) => s.watchlist);
  const snipes = useDropStore((s) => s.snipes);
  const orders = useDropStore((s) => s.orders);
  const alerts = useDropStore((s) => s.alerts);
  const scannerRunning = useDropStore((s) => s.scannerRunning);
  const customProducts = useDropStore((s) => s.customProducts);
  const setHydrated = useDropStore((s) => s.setHydrated);
  const hydrated = useDropStore((s) => s.hydrated);

  useEffect(() => {
    if (useDropStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    startAgentEngine();
    startRetailerScanner();
    void registerServiceWorker();
  }, [setHydrated]);

  const wins = orders.filter((o) => o.status === "success").length;
  const phoneReady = alerts.phone.length >= 10;

  return (
    <div className="min-h-dvh bg-bg">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in oklab, var(--color-border) 55%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in oklab, var(--color-border) 55%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto flex min-h-dvh max-w-7xl flex-col px-3 pb-28 pt-4 sm:px-5 sm:pb-8 sm:pt-6">
        <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-elevated">
                <Crosshair className="h-4 w-4 text-live" />
              </div>
              <span className="font-semibold tracking-tight">DropAgent</span>
              <Badge tone="info">Demo</Badge>
              {scannerRunning ? (
                <Badge tone="live">
                  <span className="h-1.5 w-1.5 rounded-full bg-live pulse-live" />
                  Scanning {agent.retailers.length}/{RETAILERS.length}
                </Badge>
              ) : (
                <Badge tone="neutral">Scanner off</Badge>
              )}
              {agent.armed ? (
                <Badge tone="live">
                  Agent armed · max ${agent.maxPrice}
                </Badge>
              ) : (
                <Badge tone="neutral">Agent off</Badge>
              )}
            </div>
            <h1 className="max-w-xl text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              Multi-retailer snipe alerts
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-muted">
              Add any SKU, set price caps, and get push alerts when stock goes
              live across major retailers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <StatChip
              label="Balance"
              value={hydrated ? `$${wallet.balance.toFixed(0)}` : "—"}
            />
            <StatChip label="Watching" value={String(watchlist.length)} />
            <StatChip
              label="Custom SKUs"
              value={String(customProducts.length)}
            />
            <StatChip label="Max $" value={`$${agent.maxPrice}`} />
            <StatChip label="Secured" value={String(wins)} />
            {snipes.length > 0 && (
              <StatChip
                label="Racing"
                value={String(snipes.length)}
                highlight
              />
            )}
          </div>
        </header>

        <div className="mb-4 flex gap-3 rounded-[var(--radius-lg)] border border-border bg-elevated/80 px-3 py-2.5 sm:px-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <p className="text-xs leading-relaxed text-muted sm:text-sm">
            <span className="font-medium text-fg">New: </span>
            Paste a retailer SKU in Catalog to track it. Set min/max price on the
            Agent tab — drops over your max are skipped automatically.
            {!phoneReady && " Add a phone number in Alerts for demo SMS logs."}
          </p>
        </div>

        <div className="hidden min-h-0 flex-1 gap-4 lg:grid lg:grid-cols-12">
          <div className="flex min-h-[680px] flex-col gap-4 lg:col-span-4">
            <div className="min-h-[320px] flex-1">
              <RetailerRadar />
            </div>
            <div className="min-h-[280px] flex-[0.9]">
              <LiveFeed />
            </div>
          </div>
          <div className="flex min-h-0 flex-col gap-4 lg:col-span-5">
            <CatalogGrid compact />
          </div>
          <div className="flex min-h-0 flex-col gap-4 lg:col-span-3">
            <AlertsPanel />
            <AgentPanel />
            <WalletPanel />
            <div className="min-h-[180px] flex-1">
              <OrdersPanel />
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:hidden">
          {tab === "scan" && (
            <>
              <div className="min-h-[360px]">
                <RetailerRadar />
              </div>
              <div className="min-h-[360px]">
                <LiveFeed />
              </div>
            </>
          )}
          {tab === "alerts" && <AlertsPanel />}
          {tab === "catalog" && <CatalogGrid />}
          {tab === "agent" && <AgentPanel />}
          {tab === "wallet" && <WalletPanel />}
          {tab === "orders" && (
            <div className="min-h-[480px]">
              <OrdersPanel />
            </div>
          )}
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-around">
            <NavBtn
              active={tab === "scan"}
              onClick={() => setTab("scan")}
              icon={<Radar className="h-5 w-5" />}
              label="Scan"
            />
            <NavBtn
              active={tab === "alerts"}
              onClick={() => setTab("alerts")}
              icon={<Bell className="h-5 w-5" />}
              label="Alerts"
            />
            <NavBtn
              active={tab === "catalog"}
              onClick={() => setTab("catalog")}
              icon={<LayoutGrid className="h-5 w-5" />}
              label="Catalog"
            />
            <NavBtn
              active={tab === "agent"}
              onClick={() => setTab("agent")}
              icon={<Bot className="h-5 w-5" />}
              label="Agent"
            />
            <NavBtn
              active={tab === "wallet"}
              onClick={() => setTab("wallet")}
              icon={<Wallet className="h-5 w-5" />}
              label="Wallet"
            />
            <NavBtn
              active={tab === "orders"}
              onClick={() => setTab("orders")}
              icon={<History className="h-5 w-5" />}
              label="Orders"
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

function CatalogGrid({ compact }: { compact?: boolean }) {
  const watchlist = useDropStore((s) => s.watchlist);
  const customProducts = useDropStore((s) => s.customProducts);
  const filters = useDropStore((s) => s.filters);
  const setFilters = useDropStore((s) => s.setFilters);
  const agent = useDropStore((s) => s.agent);
  const addCustomSku = useDropStore((s) => s.addCustomSku);
  const [filter, setFilter] = useState<"all" | "watched" | "custom">("all");
  const [sku, setSku] = useState("");
  const [skuName, setSkuName] = useState("");
  const [skuPrice, setSkuPrice] = useState("54.99");
  const [skuMax, setSkuMax] = useState("");
  const [skuRetailer, setSkuRetailer] = useState<Retailer>("Target");
  const [showAdd, setShowAdd] = useState(false);

  const catalog = useMemo(
    () => getAllProducts(customProducts),
    [customProducts],
  );

  const items = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return catalog.filter((p) => {
      if (filter === "watched" && !watchlist.includes(p.id)) return false;
      if (filter === "custom" && !p.custom) return false;
      if (p.price < filters.minPrice) return false;
      if (p.price > filters.maxPrice) return false;
      if (filters.onlyUnderCap && p.price > agent.maxPrice) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.set.toLowerCase().includes(q) ||
        p.retailer.toLowerCase().includes(q)
      );
    });
  }, [catalog, filter, watchlist, filters, agent.maxPrice]);

  const submitSku = (e: FormEvent) => {
    e.preventDefault();
    const result = addCustomSku({
      sku,
      name: skuName || undefined,
      retailer: skuRetailer,
      price: Number(skuPrice),
      maxPrice: skuMax ? Number(skuMax) : undefined,
    });
    if (!result.ok) {
      toast.error(result.error ?? "Could not add SKU");
      return;
    }
    toast.success(
      result.error ?? `Watching SKU ${sku.trim().toUpperCase()}`,
    );
    setSku("");
    setSkuName("");
    setSkuMax("");
    setShowAdd(false);
    setFilter("watched");
  };

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="space-y-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Product catalog
            </h2>
            <p className="text-xs text-muted">
              {items.length} shown · {customProducts.length} custom SKUs ·{" "}
              {RETAILERS.length} retailers
            </p>
          </div>
          <Button
            size="sm"
            variant={showAdd ? "secondary" : "live"}
            onClick={() => setShowAdd((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" />
            {showAdd ? "Close" : "Add SKU"}
          </Button>
        </div>

        {showAdd && (
          <form
            onSubmit={submitSku}
            className="space-y-2 rounded-[var(--radius-md)] border border-live/25 bg-live-dim/20 p-3"
          >
            <p className="text-xs font-medium text-live">
              Add SKU to search & watchlist
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block text-[11px] uppercase tracking-wider text-subtle">
                SKU / DPCI / ASIN
                <input
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. 086-01-1234"
                  className="mt-1 h-10 w-full rounded-[var(--radius-sm)] border border-border bg-elevated px-3 font-mono text-sm text-fg outline-none focus:border-border-strong"
                />
              </label>
              <label className="block text-[11px] uppercase tracking-wider text-subtle">
                Name (optional)
                <input
                  value={skuName}
                  onChange={(e) => setSkuName(e.target.value)}
                  placeholder="Pitch Black ETB"
                  className="mt-1 h-10 w-full rounded-[var(--radius-sm)] border border-border bg-elevated px-3 text-sm text-fg outline-none focus:border-border-strong"
                />
              </label>
              <label className="block text-[11px] uppercase tracking-wider text-subtle">
                Retailer
                <select
                  value={skuRetailer}
                  onChange={(e) => setSkuRetailer(e.target.value as Retailer)}
                  className="mt-1 h-10 w-full rounded-[var(--radius-sm)] border border-border bg-elevated px-3 text-sm text-fg outline-none focus:border-border-strong"
                >
                  {RETAILERS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] uppercase tracking-wider text-subtle">
                Expected price
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-subtle">
                    $
                  </span>
                  <input
                    required
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={skuPrice}
                    onChange={(e) => setSkuPrice(e.target.value)}
                    className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-elevated pl-7 pr-3 font-mono text-sm text-fg outline-none focus:border-border-strong"
                  />
                </div>
              </label>
              <label className="block text-[11px] uppercase tracking-wider text-subtle sm:col-span-2">
                Max pay for this SKU (optional)
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-subtle">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={skuMax}
                    onChange={(e) => setSkuMax(e.target.value)}
                    placeholder={`Defaults to agent max $${agent.maxPrice}`}
                    className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-elevated pl-7 pr-3 font-mono text-sm text-fg outline-none focus:border-border-strong"
                  />
                </div>
              </label>
            </div>
            <Button type="submit" size="sm" variant="live" className="w-full sm:w-auto">
              <Plus className="h-3.5 w-3.5" /> Add & watch SKU
            </Button>
          </form>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              value={filters.query}
              onChange={(e) => setFilters({ query: e.target.value })}
              placeholder="Search name, SKU, set, retailer…"
              className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-elevated pl-9 pr-3 text-sm text-fg outline-none focus:border-border-strong"
            />
          </div>
          <div className="flex gap-1 rounded-[var(--radius-md)] border border-border bg-elevated p-1">
            {(["all", "watched", "custom"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "secondary" : "ghost"}
                className={cn(filter === f && "bg-raised")}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f === "watched" ? "Watched" : "Custom"}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="text-[11px] uppercase tracking-wider text-subtle">
            Min $
            <div className="relative mt-1">
              <DollarSign className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
              <input
                type="number"
                min={0}
                max={500}
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters({ minPrice: Number(e.target.value) || 0 })
                }
                className="h-9 w-24 rounded-[var(--radius-sm)] border border-border bg-elevated pl-7 pr-2 font-mono text-sm text-fg outline-none focus:border-border-strong"
              />
            </div>
          </label>
          <label className="text-[11px] uppercase tracking-wider text-subtle">
            Max $
            <div className="relative mt-1">
              <DollarSign className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
              <input
                type="number"
                min={0}
                max={500}
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters({ maxPrice: Number(e.target.value) || 0 })
                }
                className="h-9 w-24 rounded-[var(--radius-sm)] border border-border bg-elevated pl-7 pr-2 font-mono text-sm text-fg outline-none focus:border-border-strong"
              />
            </div>
          </label>
          <button
            type="button"
            onClick={() =>
              setFilters({ onlyUnderCap: !filters.onlyUnderCap })
            }
            className={cn(
              "h-9 rounded-full border px-3 text-xs font-medium transition-colors",
              filters.onlyUnderCap
                ? "border-live/30 bg-live-dim text-live"
                : "border-border bg-elevated text-muted hover:text-fg",
            )}
          >
            Under agent max (${agent.maxPrice})
          </button>
          <button
            type="button"
            onClick={() =>
              setFilters({
                query: "",
                minPrice: 0,
                maxPrice: 500,
                onlyUnderCap: false,
              })
            }
            className="h-9 text-xs text-muted hover:text-fg"
          >
            Reset filters
          </button>
        </div>
      </header>
      <div
        className={cn(
          "grid flex-1 content-start gap-3 overflow-y-auto p-3 sm:p-4",
          compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
        )}
      >
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {items.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted">
            No products match. Add a SKU or loosen price filters.
          </p>
        )}
      </div>
      <span className="sr-only">{CATALOG.length}</span>
    </section>
  );
}

function StatChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border px-3 py-2",
        highlight ? "border-live/30 bg-live-dim" : "border-border bg-surface",
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-subtle">
        {label}
      </p>
      <p
        className={cn(
          "font-mono text-sm font-semibold tabular",
          highlight ? "text-live" : "text-fg",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function NavBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[var(--radius-sm)] px-1 py-2 text-[10px] font-medium transition-colors sm:text-[11px]",
        active ? "text-fg" : "text-subtle hover:text-muted",
      )}
    >
      <span className={cn(active ? "text-live" : "")}>{icon}</span>
      {label}
    </button>
  );
}
