import { Crosshair, ExternalLink, Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  getProduct,
  formatMoney,
  effectiveMaxPrice,
} from "@/lib/catalog";
import { manualSnipe } from "@/lib/agent-engine";
import { useDropStore } from "@/lib/store";
import { Badge, Button } from "@/components/ui";
import { ProductThumb } from "@/components/product-card";
import { cn } from "@/lib/cn";

export function LiveFeed() {
  const drops = useDropStore((s) => s.drops);
  const feedPaused = useDropStore((s) => s.feedPaused);
  const setFeedPaused = useDropStore((s) => s.setFeedPaused);
  const customProducts = useDropStore((s) => s.customProducts);
  const agent = useDropStore((s) => s.agent);

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "inline-flex h-2 w-2 rounded-full bg-live",
              !feedPaused && "pulse-live",
            )}
          />
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Live drop feed</h2>
            <p className="text-xs text-muted">
              {feedPaused ? "Paused" : "Monitoring watchlist retailers"}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setFeedPaused(!feedPaused)}
        >
          <Radio className="h-3.5 w-3.5" />
          {feedPaused ? "Resume" : "Pause"}
        </Button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
        {drops.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="rounded-full border border-border bg-elevated p-3">
              <Radio className="h-5 w-5 text-muted" />
            </div>
            <p className="text-sm font-medium text-fg">Waiting for restocks</p>
            <p className="max-w-xs text-xs text-muted">
              Drops appear here as they go live. Arm the agent to auto-snipe
              watched products.
            </p>
          </div>
        ) : (
          drops.map((drop) => {
            const product = getProduct(drop.productId, customProducts);
            if (!product) return null;
            const cap = effectiveMaxPrice(product, agent.maxPrice);
            const overCap = product.price > cap;
            return (
              <article
                key={drop.id}
                className={cn(
                  "flex gap-3 rounded-[var(--radius-lg)] border border-border bg-elevated p-3 transition-colors enter",
                  drop.status === "live" && "border-live/30 bg-live-dim/30",
                  drop.status === "skipped" && "border-warn/25 bg-warn-dim/20",
                )}
              >
                <div className="w-14 shrink-0">
                  <ProductThumb
                    hue={product.imageHue}
                    kind={product.kind}
                    className="rounded-[var(--radius-sm)]"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={drop.status} />
                    <span className="font-mono text-[11px] text-subtle tabular">
                      {formatDistanceToNow(drop.at, { addSuffix: true })}
                    </span>
                    {overCap && (
                      <Badge tone="warn">Over ${cap.toFixed(0)} cap</Badge>
                    )}
                  </div>
                  <h3 className="mt-1 truncate text-sm font-semibold text-fg">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted">
                    {drop.retailer} · {formatMoney(product.price)} · SKU{" "}
                    <span className="font-mono">{product.sku}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {drop.status === "live" && (
                      <Button
                        size="sm"
                        variant="live"
                        onClick={() => manualSnipe(drop.id)}
                      >
                        <Crosshair className="h-3.5 w-3.5" /> Snipe now
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        window.open(
                          product.href,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function StatusBadge({
  status,
}: {
  status: "live" | "gone" | "sniped" | "failed" | "skipped";
}) {
  if (status === "live")
    return (
      <Badge tone="live">
        <span className="h-1.5 w-1.5 rounded-full bg-live pulse-live" /> LIVE
      </Badge>
    );
  if (status === "sniped") return <Badge tone="live">Sniped</Badge>;
  if (status === "failed") return <Badge tone="danger">Missed</Badge>;
  if (status === "skipped") return <Badge tone="warn">Price skip</Badge>;
  return <Badge tone="neutral">Gone</Badge>;
}
