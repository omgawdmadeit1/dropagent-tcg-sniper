import { useEffect, useState, type ReactNode } from "react";
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
} from "lucide-react";
import { CATALOG, RETAILERS } from "@/lib/catalog";
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
                <Badge tone="live">Agent armed</Badge>
              ) : (
                <Badge tone="neutral">Agent off</Badge>
              )}
            </div>
            <h1 className="max-w-xl text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              Multi-retailer snipe alerts
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-muted">
              Continuous stock checks across major retailers. Get push alerts on
              your phone when a watched product goes live — then race checkout
              with the sniper agent.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <StatChip
              label="Balance"
              value={hydrated ? `$${wallet.balance.toFixed(0)}` : "—"}
            />
            <StatChip label="Watching" value={String(watchlist.length)} />
            <StatChip label="Retailers" value={String(agent.retailers.length)} />
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
            <span className="font-medium text-fg">Get alerts on your phone: </span>
            Open{" "}
            <button
              type="button"
              className="font-medium text-fg underline-offset-2 hover:underline"
              onClick={() => setTab("alerts")}
            >
              Alerts
            </button>
            , enable browser notifications (works on mobile), and add your number
            for demo SMS logs.
            {!phoneReady && " Add a phone number to complete SMS setup."} Stock
            checks are simulated against all major retailers — real live inventory
            APIs require store partnerships or compliant monitor infrastructure.
          </p>
        </div>

        {/* Desktop */}
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

        {/* Mobile */}
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
  const [filter, setFilter] = useState<"all" | "watched">("all");

  const items =
    filter === "watched"
      ? CATALOG.filter((p) => watchlist.includes(p.id))
      : CATALOG;

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            Product catalog
          </h2>
          <p className="text-xs text-muted">
            {items.length} products · {RETAILERS.length} retailers
          </p>
        </div>
        <div className="flex gap-1 rounded-[var(--radius-md)] border border-border bg-elevated p-1">
          <Button
            size="sm"
            variant={filter === "all" ? "secondary" : "ghost"}
            className={cn(filter === "all" && "bg-raised")}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filter === "watched" ? "secondary" : "ghost"}
            className={cn(filter === "watched" && "bg-raised")}
            onClick={() => setFilter("watched")}
          >
            Watched
          </Button>
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
            No watched products. Switch to All and add some.
          </p>
        )}
      </div>
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
