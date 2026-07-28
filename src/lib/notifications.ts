import { toast } from "sonner";
import { formatPhoneDisplay, type Retailer } from "./catalog";
import { useDropStore, type AlertChannel } from "./store";

function uid() {
  return `al_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export async function ensurePushPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return reg;
  } catch {
    return null;
  }
}

async function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg?.showNotification) {
      await reg.showNotification(title, {
        body,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        tag: "dropagent-alert",
        requireInteraction: true,
        data: { url: "/" },
      });
      return true;
    }
  } catch {
    // fall through
  }

  try {
    new Notification(title, { body, tag: "dropagent-alert" });
    return true;
  } catch {
    return false;
  }
}

function vibratePhone() {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([80, 40, 80, 40, 160]);
    }
  } catch {
    // ignore
  }
}

export type NotifyPayload = {
  title: string;
  body: string;
  productId?: string;
  retailer?: Retailer;
  kind: "drop" | "snipe" | "miss" | "test" | "scan";
};

export async function dispatchAlert(payload: NotifyPayload) {
  const { alerts, pushAlert } = useDropStore.getState();

  if (alerts.quietHours && payload.kind !== "test") return;

  if (payload.kind === "drop" && !alerts.alertOnDrop) return;
  if (payload.kind === "snipe" && !alerts.alertOnSnipe) return;
  if (payload.kind === "miss" && !alerts.alertOnMiss) return;

  const channels: { channel: AlertChannel; enabled: boolean }[] = [
    { channel: "inapp", enabled: alerts.inAppEnabled },
    { channel: "push", enabled: alerts.pushEnabled },
    { channel: "sms", enabled: alerts.smsEnabled },
  ];

  for (const { channel, enabled } of channels) {
    if (!enabled && payload.kind !== "test") continue;
    // For test, fire all enabled channels even if kind filters would block

    if (channel === "inapp") {
      if (payload.kind === "snipe") {
        toast.success(payload.title, { description: payload.body });
      } else if (payload.kind === "miss") {
        toast.error(payload.title, { description: payload.body });
      } else {
        toast.message(payload.title, { description: payload.body });
      }
      pushAlert({
        id: uid(),
        channel: "inapp",
        title: payload.title,
        body: payload.body,
        at: Date.now(),
        productId: payload.productId,
        retailer: payload.retailer,
        status: "sent",
      });
      continue;
    }

    if (channel === "push") {
      const ok = await showBrowserNotification(payload.title, payload.body);
      if (ok) vibratePhone();
      pushAlert({
        id: uid(),
        channel: "push",
        title: payload.title,
        body: payload.body,
        at: Date.now(),
        productId: payload.productId,
        retailer: payload.retailer,
        status: ok ? "sent" : "failed",
      });
      continue;
    }

    if (channel === "sms") {
      const digits = alerts.phone.replace(/\D/g, "");
      const valid = digits.length >= 10;
      // Simulated SMS — production would call Twilio / carrier API
      pushAlert({
        id: uid(),
        channel: "sms",
        title: valid
          ? `SMS → ${formatPhoneDisplay(digits)}`
          : "SMS not sent",
        body: valid
          ? payload.body
          : "Add a 10-digit phone number to receive SMS alerts",
        at: Date.now(),
        productId: payload.productId,
        retailer: payload.retailer,
        status: valid ? "sent" : "failed",
      });
      if (valid && payload.kind === "test") {
        toast.success("Demo SMS queued", {
          description: `Would send to ${formatPhoneDisplay(digits)}`,
        });
      }
    }
  }
}

export async function sendTestAlert() {
  const perm = await ensurePushPermission();
  await registerServiceWorker();
  await dispatchAlert({
    title: "DropAgent test alert",
    body:
      perm === "granted"
        ? "Phone/browser notifications are enabled. You'll get this on restocks."
        : "Enable notifications when prompted — or add a phone for demo SMS logs.",
    kind: "test",
  });
}
