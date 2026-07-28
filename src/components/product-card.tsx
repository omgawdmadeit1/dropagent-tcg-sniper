import { Eye, EyeOff, ExternalLink, Trash2, Zap } from "lucide-react";
import {
  formatMoney,
  stockLabel,
  effectiveMaxPrice,
  type Product,
} from "@/lib/catalog";
import { forceDrop } from "@/lib/agent-engine";
import { useDropStore } from "@/lib/store";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";

export function ProductThumb({
  hue,
  kind,
  className,
}: {
  hue: number;
  kind: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-[4/5] w-full items-end overflow-hidden rounded-[var(--radius-md)] border border-border",
        className,
      )}
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 28% 18%) 0%, hsl(${hue} 40% 8%) 55%, #0c0c10 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, hsl(${hue} 70% 55% / 0.35), transparent 45%),
            radial-gradient(circle at 80% 80%, hsl(${(hue + 40) % 360} 50% 40% / 0.2), transparent 40%)`,
        }}
      />
      <div className="absolute left-2 top-2 rounded-[var(--radius-xs)] bg-bg/70 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted backdrop-blur-sm">
        {kind}
      </div>
      <div className="relative w-full p-2.5">
        <div className="h-1 w-8 rounded-full bg-fg/20" />
        <div className="mt-1.5 h-1 w-12 rounded-full bg-fg/10" />
      </div>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const watchlist = useDropStore((s) => s.watchlist);
  const toggleWatch = useDropStore((s) => s.toggleWatch);
  const removeCustomSku = useDropStore((s) => s.removeCustomSku);
  const agent = useDropStore((s) => s.agent);
  const watched = watchlist.includes(product.id);
  const cap = effectiveMaxPrice(product, agent.maxPrice);
  const overCap = product.price > cap;

  return (
    <article className="panel flex flex-col gap-3 p-3 sm:p-4 enter">
      <div className="flex gap-3">
        <div className="w-20 shrink-0 sm:w-24">
          <ProductThumb hue={product.imageHue} kind={product.kind} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{product.retailer}</Badge>
            {product.custom && <Badge tone="info">Custom</Badge>}
            <Badge
              tone={
                product.stockExpected === "ultra-low"
                  ? "danger"
                  : product.stockExpected === "low"
                    ? "warn"
                    : "info"
              }
            >
              {stockLabel(product.stockExpected)}
            </Badge>
            {overCap && <Badge tone="warn">Over cap</Badge>}
          </div>
          <h3 className="mt-2 text-[15px] font-semibold leading-snug tracking-tight text-fg">
            {product.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted">{product.set}</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-base font-semibold tabular text-fg">
              {formatMoney(product.price)}
            </span>
            <span className="font-mono text-xs text-subtle">
              SKU {product.sku}
            </span>
            {product.maxPrice != null && (
              <span className="font-mono text-xs text-info">
                max {formatMoney(product.maxPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={watched ? "secondary" : "primary"}
          onClick={() => toggleWatch(product.id)}
          aria-pressed={watched}
        >
          {watched ? (
            <>
              <Eye className="h-3.5 w-3.5" /> Watching
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5" /> Watch
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="live"
          onClick={() => forceDrop(product.id)}
          title="Simulate a drop for this product"
        >
          <Zap className="h-3.5 w-3.5" /> Simulate drop
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            window.open(product.href, "_blank", "noopener,noreferrer")
          }
        >
          <ExternalLink className="h-3.5 w-3.5" /> Retailer
        </Button>
        {product.custom && (
          <Button
            size="sm"
            variant="danger"
            onClick={() => removeCustomSku(product.id)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Button>
        )}
      </div>
    </article>
  );
}
