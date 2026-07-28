import { Bot, Crosshair, Shield, Zap } from "lucide-react";
import { RETAILERS, formatMoney, getProduct } from "@/lib/catalog";
import { useDropStore, type AgentConfig } from "@/lib/store";
import { Badge, Button, Progress, Segmented, Switch } from "@/components/ui";
import { cn } from "@/lib/cn";

export function AgentPanel() {
  const agent = useDropStore((s) => s.agent);
  const setAgent = useDropStore((s) => s.setAgent);
  const snipes = useDropStore((s) => s.snipes);
  const watchlist = useDropStore((s) => s.watchlist);
  const customProducts = useDropStore((s) => s.customProducts);

  const toggleRetailer = (r: (typeof RETAILERS)[number]) => {
    const next = agent.retailers.includes(r)
      ? agent.retailers.filter((x) => x !== r)
      : [...agent.retailers, r];
    if (next.length === 0) return;
    setAgent({ retailers: next });
  };

  return (
    <section className="panel flex flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border",
              agent.armed
                ? "border-live/30 bg-live-dim text-live"
                : "border-border bg-elevated text-muted",
            )}
          >
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Sniper agent</h2>
            <p className="text-xs text-muted">
              {agent.armed
                ? `Armed · ${watchlist.length} watched · max ${formatMoney(agent.maxPrice)}`
                : "Disarmed — manual snipes only"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted sm:inline">
            {agent.armed ? "Armed" : "Off"}
          </span>
          <Switch
            checked={agent.armed}
            onCheckedChange={(v) => setAgent({ armed: v })}
            label="Arm agent"
          />
        </div>
      </header>

      <div className="space-y-5 p-4 sm:p-5">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-subtle">
            Speed mode
          </label>
          <Segmented<AgentConfig["speed"]>
            value={agent.speed}
            onChange={(speed) => setAgent({ speed })}
            options={[
              { value: "safe", label: "Safe" },
              { value: "balanced", label: "Balanced" },
              { value: "aggressive", label: "Aggressive" },
            ]}
          />
          <p className="mt-2 text-xs text-muted">
            {agent.speed === "aggressive" &&
              "Fastest checkout race. Higher hit rate, more retail friction."}
            {agent.speed === "balanced" &&
              "Default cadence for most Target / Walmart windows."}
            {agent.speed === "safe" &&
              "Slower steps. Better for high-risk accounts (demo)."}
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-border bg-elevated p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Price limits</p>
              <p className="text-xs text-muted">
                Skip snipes outside your min/max range
              </p>
            </div>
            <Switch
              checked={agent.enforcePriceLimit}
              onCheckedChange={(v) => setAgent({ enforcePriceLimit: v })}
              label="Enforce price limit"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="min-price"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-subtle"
              >
                Min price
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-subtle">
                  $
                </span>
                <input
                  id="min-price"
                  type="number"
                  min={0}
                  max={500}
                  step={1}
                  value={agent.minPrice}
                  onChange={(e) =>
                    setAgent({
                      minPrice: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-surface pl-7 pr-3 font-mono text-sm text-fg outline-none focus:border-border-strong"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="max-price"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-subtle"
              >
                Max price
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-subtle">
                  $
                </span>
                <input
                  id="max-price"
                  type="number"
                  min={5}
                  max={500}
                  step={1}
                  value={agent.maxPrice}
                  onChange={(e) =>
                    setAgent({ maxPrice: Number(e.target.value) || 0 })
                  }
                  className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-surface pl-7 pr-3 font-mono text-sm text-fg outline-none focus:border-border-strong"
                />
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-subtle">
            Agent only auto-snipes between {formatMoney(agent.minPrice)}–
            {formatMoney(agent.maxPrice)}
            {agent.enforcePriceLimit ? " (enforced)" : " (advisory)"}.
          </p>
        </div>

        <div>
          <label
            htmlFor="max-qty"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-subtle"
          >
            Max qty
          </label>
          <input
            id="max-qty"
            type="number"
            min={1}
            max={4}
            value={agent.maxQty}
            onChange={(e) =>
              setAgent({
                maxQty: Math.min(4, Math.max(1, Number(e.target.value) || 1)),
              })
            }
            className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-elevated px-3 font-mono text-sm text-fg outline-none focus:border-border-strong"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-subtle">
            Retailers
          </label>
          <div className="flex flex-wrap gap-1.5">
            {RETAILERS.map((r) => {
              const on = agent.retailers.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRetailer(r)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    on
                      ? "border-live/30 bg-live-dim text-live"
                      : "border-border bg-elevated text-muted hover:text-fg",
                  )}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-elevated px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted" />
            <div>
              <p className="text-sm font-medium">Auto-confirm</p>
              <p className="text-xs text-muted">Skip manual approval on snipe</p>
            </div>
          </div>
          <Switch
            checked={agent.autoConfirm}
            onCheckedChange={(v) => setAgent({ autoConfirm: v })}
            label="Auto-confirm"
          />
        </div>

        {snipes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-subtle">
              Active races
            </p>
            {snipes.map((snipe) => {
              const product = getProduct(snipe.productId, customProducts);
              return (
                <div
                  key={snipe.dropId}
                  className="rounded-[var(--radius-md)] border border-live/25 bg-live-dim/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {product?.name ?? snipe.productId}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{snipe.message}</p>
                    </div>
                    <Badge tone="live">
                      <Crosshair className="h-3 w-3" />
                      {snipe.stage}
                    </Badge>
                  </div>
                  <Progress value={snipe.progress} className="mt-3" />
                </div>
              );
            })}
          </div>
        )}

        {!agent.armed && (
          <Button
            variant="live"
            className="w-full"
            onClick={() => setAgent({ armed: true })}
          >
            <Zap className="h-4 w-4" /> Arm agent
          </Button>
        )}
      </div>
    </section>
  );
}

export function WalletPanel() {
  const wallet = useDropStore((s) => s.wallet);
  const setWallet = useDropStore((s) => s.setWallet);
  const topUp = useDropStore((s) => s.topUp);
  const resetDemo = useDropStore((s) => s.resetDemo);

  const capPct = Math.min(
    100,
    (wallet.spentToday / Math.max(1, wallet.spendingCap)) * 100,
  );

  return (
    <section className="panel flex flex-col overflow-hidden">
      <header className="border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold tracking-tight">Demo wallet</h2>
        <p className="text-xs text-muted">
          Simulated vault — not a real payment instrument
        </p>
      </header>

      <div className="space-y-4 p-4 sm:p-5">
        <div
          className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border p-4"
          style={{
            background:
              "linear-gradient(135deg, #1a1a22 0%, #121218 50%, #0e1620 100%)",
          }}
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-info/10 blur-2xl" />
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Available balance
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular">
            {formatMoney(wallet.balance)}
          </p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-sm tracking-widest text-fg">
                •••• •••• •••• {wallet.cardLast4}
              </p>
              <p className="mt-1 text-xs text-muted">
                {wallet.cardBrand} · {wallet.holder}
              </p>
            </div>
            <Badge tone="info">Vaulted</Badge>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted">Daily spend cap</span>
            <span className="font-mono tabular text-fg">
              {formatMoney(wallet.spentToday)} / {formatMoney(wallet.spendingCap)}
            </span>
          </div>
          <Progress value={capPct} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2 text-xs font-medium uppercase tracking-wider text-subtle">
            Spending cap
            <input
              type="number"
              min={50}
              max={2000}
              value={wallet.spendingCap}
              onChange={(e) =>
                setWallet({ spendingCap: Number(e.target.value) || 0 })
              }
              className="mt-1.5 h-10 w-full rounded-[var(--radius-sm)] border border-border bg-elevated px-3 font-mono text-sm text-fg outline-none focus:border-border-strong"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {[50, 100, 250].map((amt) => (
            <Button key={amt} size="sm" variant="secondary" onClick={() => topUp(amt)}>
              +{formatMoney(amt)}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => resetDemo()}>
            Reset demo
          </Button>
        </div>
      </div>
    </section>
  );
}

export function OrdersPanel() {
  const orders = useDropStore((s) => s.orders);
  const customProducts = useDropStore((s) => s.customProducts);

  return (
    <section className="panel flex min-h-0 flex-col overflow-hidden">
      <header className="border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold tracking-tight">Order history</h2>
        <p className="text-xs text-muted">Simulated snipes only</p>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
        {orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No orders yet. Arm the agent or hit Snipe now on a live drop.
          </p>
        ) : (
          orders.map((order) => {
            const product = getProduct(order.productId, customProducts);
            return (
              <div
                key={order.id}
                className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-elevated p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {product?.name ?? order.productId}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {order.retailer} · qty {order.qty} ·{" "}
                    <span className="font-mono">{order.id.slice(0, 14)}</span>
                  </p>
                  {order.reason && (
                    <p className="mt-1 text-xs text-danger">{order.reason}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <Badge tone={order.status === "success" ? "live" : "danger"}>
                    {order.status === "success" ? "Secured" : "Failed"}
                  </Badge>
                  {order.status === "success" && (
                    <p className="mt-1 font-mono text-sm tabular">
                      {formatMoney(order.total)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
