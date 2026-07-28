import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  BellRing,
  MessageSquare,
  Phone,
  Radar,
  RefreshCw,
  Send,
  Smartphone,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  formatPhoneDisplay,
  RETAILER_META,
  type Retailer,
} from "@/lib/catalog";
import {
  ensurePushPermission,
  registerServiceWorker,
  sendTestAlert,
} from "@/lib/notifications";
import { forceFullScan } from "@/lib/scanner";
import { useDropStore } from "@/lib/store";
import { Badge, Button, Switch } from "@/components/ui";
import { cn } from "@/lib/cn";

export function AlertsPanel() {
  const alerts = useDropStore((s) => s.alerts);
  const setAlerts = useDropStore((s) => s.setAlerts);
  const alertLog = useDropStore((s) => s.alertLog);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
    void registerServiceWorker();
  }, []);

  const enablePush = async () => {
    const result = await ensurePushPermission();
    setPerm(result);
    setAlerts({ pushEnabled: result === "granted" });
    await registerServiceWorker();
  };

  const onPhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    setAlerts({ phone: digits });
  };

  const onTest = async () => {
    setTesting(true);
    try {
      await sendTestAlert();
      if ("Notification" in window) setPerm(Notification.permission);
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="panel flex flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-live/30 bg-live-dim text-live">
            <BellRing className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Phone alerts</h2>
            <p className="text-xs text-muted">
              Push to device · demo SMS log
            </p>
          </div>
        </div>
        <Button size="sm" variant="live" onClick={onTest} disabled={testing}>
          <Send className="h-3.5 w-3.5" />
          {testing ? "Sending…" : "Test alert"}
        </Button>
      </header>

      <div className="space-y-5 p-4 sm:p-5">
        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-subtle"
          >
            <Phone className="h-3 w-3" />
            Mobile number
          </label>
          <div className="relative">
            <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="(404) 555-0100"
              value={formatPhoneDisplay(alerts.phone)}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="h-11 w-full rounded-[var(--radius-sm)] border border-border bg-elevated pl-10 pr-3 font-mono text-sm text-fg outline-none focus:border-border-strong"
            />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            SMS is simulated in this demo (logged below). Wire Twilio for real
            carrier SMS later.
          </p>
        </div>

        <div className="space-y-2">
          <ChannelRow
            icon={<Bell className="h-4 w-4" />}
            title="Browser / phone push"
            description={
              perm === "granted"
                ? "Enabled — alerts hit your notification shade"
                : perm === "denied"
                  ? "Blocked in browser settings"
                  : perm === "unsupported"
                    ? "Not supported in this browser"
                    : "Tap enable, then allow notifications"
            }
            checked={alerts.pushEnabled && perm === "granted"}
            onCheckedChange={async (v) => {
              if (v) await enablePush();
              else setAlerts({ pushEnabled: false });
            }}
            action={
              perm !== "granted" && perm !== "unsupported" ? (
                <Button size="sm" variant="secondary" onClick={enablePush}>
                  Enable
                </Button>
              ) : null
            }
          />
          <ChannelRow
            icon={<MessageSquare className="h-4 w-4" />}
            title="SMS (demo)"
            description={
              alerts.phone.length >= 10
                ? `Ready · ${formatPhoneDisplay(alerts.phone)}`
                : "Add a phone number above"
            }
            checked={alerts.smsEnabled}
            onCheckedChange={(v) => setAlerts({ smsEnabled: v })}
          />
          <ChannelRow
            icon={<BellRing className="h-4 w-4" />}
            title="In-app toasts"
            description="Live banner alerts inside DropAgent"
            checked={alerts.inAppEnabled}
            onCheckedChange={(v) => setAlerts({ inAppEnabled: v })}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-subtle">
            Notify me when
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["alertOnDrop", "Drop goes live"],
                ["alertOnSnipe", "Snipe secured"],
                ["alertOnMiss", "Snipe missed"],
              ] as const
            ).map(([key, label]) => {
              const on = alerts[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAlerts({ [key]: !on })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    on
                      ? "border-live/30 bg-live-dim text-live"
                      : "border-border bg-elevated text-muted",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-elevated px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Quiet hours</p>
            <p className="text-xs text-muted">Pause non-test alerts</p>
          </div>
          <Switch
            checked={alerts.quietHours}
            onCheckedChange={(v) => setAlerts({ quietHours: v })}
            label="Quiet hours"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-subtle">
            Alert log
          </p>
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {alertLog.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">
                No alerts yet. Enable push and hit Test alert.
              </p>
            ) : (
              alertLog.slice(0, 12).map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-2 rounded-[var(--radius-sm)] border border-border bg-elevated px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        tone={
                          a.status === "sent"
                            ? "live"
                            : a.status === "failed"
                              ? "danger"
                              : "warn"
                        }
                      >
                        {a.channel.toUpperCase()}
                      </Badge>
                      <span className="truncate text-xs font-medium text-fg">
                        {a.title}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {a.body}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-subtle tabular">
                    {formatDistanceToNow(a.at, { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChannelRow({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-elevated px-3 py-2.5">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5 text-muted">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">{title}</p>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          label={title}
        />
      </div>
    </div>
  );
}

export function RetailerRadar() {
  const scans = useDropStore((s) => s.scans);
  const scannerRunning = useDropStore((s) => s.scannerRunning);
  const setScannerRunning = useDropStore((s) => s.setScannerRunning);
  const lastGlobalScan = useDropStore((s) => s.lastGlobalScan);
  const agent = useDropStore((s) => s.agent);
  const setAgent = useDropStore((s) => s.setAgent);
  const [scanning, setScanning] = useState(false);

  const enabledCount = agent.retailers.length;
  const stockCount = scans.filter((s) => s.status === "stock").length;
  const scanningNow = scans.filter((s) => s.status === "scanning").length;

  const toggleRetailer = (r: Retailer) => {
    const next = agent.retailers.includes(r)
      ? agent.retailers.filter((x) => x !== r)
      : [...agent.retailers, r];
    if (next.length === 0) return;
    setAgent({ retailers: next });
  };

  const onFullScan = async () => {
    setScanning(true);
    try {
      await forceFullScan();
    } finally {
      setScanning(false);
    }
  };

  return (
    <section className="panel flex min-h-0 flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border",
              scannerRunning
                ? "border-live/30 bg-live-dim text-live"
                : "border-border bg-elevated text-muted",
            )}
          >
            <Radar
              className={cn("h-4 w-4", scannerRunning && "animate-spin")}
              style={{ animationDuration: "3s" }}
            />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Multi-retailer scanner
            </h2>
            <p className="text-xs text-muted">
              {enabledCount} retailers · {scanningNow} scanning
              {stockCount > 0 ? ` · ${stockCount} stock hits` : ""}
              {lastGlobalScan
                ? ` · last cycle ${formatDistanceToNow(lastGlobalScan, { addSuffix: true })}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onFullScan}
            disabled={scanning}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", scanning && "animate-spin")}
            />
            Scan all
          </Button>
          <Switch
            checked={scannerRunning}
            onCheckedChange={setScannerRunning}
            label="Scanner running"
          />
        </div>
      </header>

      <div className="grid flex-1 content-start gap-2 overflow-y-auto p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-1 xl:grid-cols-2">
        {scans.map((scan) => {
          const meta = RETAILER_META[scan.retailer];
          const enabled = agent.retailers.includes(scan.retailer);
          return (
            <button
              key={scan.retailer}
              type="button"
              onClick={() => toggleRetailer(scan.retailer)}
              className={cn(
                "flex items-start gap-3 rounded-[var(--radius-lg)] border p-3 text-left transition-colors",
                !enabled && "opacity-45",
                scan.status === "scanning" && "border-info/40 bg-info-dim/40",
                scan.status === "stock" && "border-live/40 bg-live-dim/50",
                scan.status === "error" && "border-danger/30 bg-danger-dim/30",
                (scan.status === "ok" || scan.status === "idle") &&
                  "border-border bg-elevated",
              )}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] font-mono text-[11px] font-semibold text-fg"
                style={{
                  background: `color-mix(in oklab, ${meta.color} 22%, #18181c)`,
                  border: `1px solid color-mix(in oklab, ${meta.color} 40%, transparent)`,
                }}
              >
                {meta.short}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">
                    {scan.retailer}
                  </p>
                  <ScanBadge status={scan.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {scan.lastMessage}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-subtle tabular">
                  {scan.lastCheck > 0 && (
                    <span>
                      {formatDistanceToNow(scan.lastCheck, { addSuffix: true })}
                    </span>
                  )}
                  {scan.latencyMs > 0 && <span>{scan.latencyMs}ms</span>}
                  <span>{scan.hitsToday} hits</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ScanBadge({
  status,
}: {
  status: "idle" | "scanning" | "ok" | "stock" | "error";
}) {
  if (status === "scanning")
    return (
      <Badge tone="info">
        <span className="h-1.5 w-1.5 rounded-full bg-info pulse-live" />
        Scan
      </Badge>
    );
  if (status === "stock") return <Badge tone="live">Stock</Badge>;
  if (status === "error") return <Badge tone="danger">Backoff</Badge>;
  if (status === "ok") return <Badge tone="neutral">OOS</Badge>;
  return <Badge tone="neutral">Idle</Badge>;
}
