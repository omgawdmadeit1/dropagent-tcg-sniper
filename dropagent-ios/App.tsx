import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const C = {
  bg: "#08080a",
  surface: "#111114",
  elevated: "#18181c",
  raised: "#1f1f24",
  fg: "#f2f2f4",
  muted: "#9b9ba6",
  subtle: "#6b6b76",
  border: "#2a2a32",
  live: "#3ecf8e",
  liveDim: "#1a3d2e",
  info: "#6b9ef0",
  danger: "#ef6b6b",
  warn: "#f0c36b",
};

const RETAILERS = [
  "Target",
  "Walmart",
  "Best Buy",
  "Amazon",
  "Costco",
  "Pokémon Center",
  "GameStop",
  "Sam's Club",
  "Barnes & Noble",
  "Meijer",
] as const;

type Retailer = (typeof RETAILERS)[number];

type Sku = {
  id: string;
  name: string;
  sku: string;
  retailer: Retailer;
  price: number;
  maxPay?: number;
  watching: boolean;
  custom?: boolean;
};

type FeedItem = {
  id: string;
  html: string;
  t: string;
  kind: "stock" | "skip" | "secure" | "info";
};

type PersistState = {
  skus: Sku[];
  minPrice: number;
  maxPrice: number;
  enforce: boolean;
  wallet: number;
  armed: boolean;
  secured: number;
  feed: FeedItem[];
  phone: string;
};

const CATALOG: Sku[] = [
  {
    id: "t1",
    name: "Prismatic Evolutions ETB",
    sku: "085-10-3599",
    retailer: "Target",
    price: 54.99,
    watching: true,
  },
  {
    id: "t2",
    name: "Surging Sparks Booster Bundle",
    sku: "085-10-3601",
    retailer: "Target",
    price: 26.99,
    watching: true,
  },
  {
    id: "w1",
    name: "Stellar Crown Booster Box",
    sku: "581234567",
    retailer: "Walmart",
    price: 144.99,
    watching: true,
  },
  {
    id: "a1",
    name: "151 Ultra-Premium Collection",
    sku: "B0CXYZ151",
    retailer: "Amazon",
    price: 119.99,
    watching: false,
  },
  {
    id: "p1",
    name: "Paldean Fates ETB",
    sku: "PC-PF-ETB",
    retailer: "Pokémon Center",
    price: 49.99,
    watching: true,
  },
  {
    id: "b1",
    name: "Twilight Masquerade ETB",
    sku: "6421234",
    retailer: "Best Buy",
    price: 49.99,
    watching: true,
  },
  {
    id: "c1",
    name: "Scarlet & Violet Booster Tin 3pk",
    sku: "COSTCO-SV3",
    retailer: "Costco",
    price: 29.99,
    watching: false,
  },
  {
    id: "g1",
    name: "Shrouded Fable Mini Tin",
    sku: "GS-SF-MT",
    retailer: "GameStop",
    price: 14.99,
    watching: true,
  },
];

const STORAGE_KEY = "dropagent-ios-v1";

function money(n: number) {
  return `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;
}

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

async function ensurePushPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== "granted") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("drops", {
      name: "Drop alerts",
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  return true;
}

async function notifyLocal(title: string, body: string) {
  try {
    const ok = await ensurePushPermission();
    if (!ok) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {
    /* demo */
  }
}

type Tab = "radar" | "skus" | "agent" | "ship";

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("radar");
  const [skus, setSkus] = useState<Sku[]>(CATALOG);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(160);
  const [enforce, setEnforce] = useState(true);
  const [wallet, setWallet] = useState(500);
  const [armed, setArmed] = useState(false);
  const [secured, setSecured] = useState(0);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [phone, setPhone] = useState("");
  const [scanLine, setScanLine] = useState("Booting multi-retailer radar…");
  const [pushOn, setPushOn] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMax, setFilterMax] = useState("");
  const [skuInput, setSkuInput] = useState("");
  const [skuName, setSkuName] = useState("");
  const [skuRetailer, setSkuRetailer] = useState<Retailer>("Target");
  const [skuPrice, setSkuPrice] = useState("49.99");
  const [skuMax, setSkuMax] = useState("55");
  const [toast, setToast] = useState<string | null>(null);
  const ri = useRef(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  // hydrate
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw) as PersistState;
          if (s.skus?.length) setSkus(s.skus);
          if (typeof s.minPrice === "number") setMinPrice(s.minPrice);
          if (typeof s.maxPrice === "number") setMaxPrice(s.maxPrice);
          if (typeof s.enforce === "boolean") setEnforce(s.enforce);
          if (typeof s.wallet === "number") setWallet(s.wallet);
          if (typeof s.armed === "boolean") setArmed(s.armed);
          if (typeof s.secured === "number") setSecured(s.secured);
          if (s.feed?.length) setFeed(s.feed.slice(0, 40));
          if (s.phone) setPhone(s.phone);
        }
      } catch {
        /* ignore */
      }
      setReady(true);
    })();
  }, []);

  // persist
  useEffect(() => {
    if (!ready) return;
    const payload: PersistState = {
      skus,
      minPrice,
      maxPrice,
      enforce,
      wallet,
      armed,
      secured,
      feed: feed.slice(0, 40),
      phone,
    };
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    ready,
    skus,
    minPrice,
    maxPrice,
    enforce,
    wallet,
    armed,
    secured,
    feed,
    phone,
  ]);

  const pushFeed = useCallback(
    (html: string, kind: FeedItem["kind"]) => {
      setFeed((prev) =>
        [{ id: `${Date.now()}-${Math.random()}`, html, t: nowTime(), kind }, ...prev].slice(
          0,
          50,
        ),
      );
    },
    [],
  );

  const underLimit = useCallback(
    (p: Sku, price: number) => {
      if (!enforce) return true;
      const cap = Math.min(maxPrice, p.maxPay != null ? p.maxPay : maxPrice);
      return price >= minPrice && price <= cap;
    },
    [enforce, maxPrice, minPrice],
  );

  const emitDrop = useCallback(
    async (p: Sku, price?: number) => {
      const px = price ?? p.price;
      const ok = underLimit(p, px);
      if (!ok) {
        pushFeed(
          `Price skip · ${p.retailer} · ${p.name} at ${money(px)} (over max ${money(maxPrice)})`,
          "skip",
        );
        return;
      }
      pushFeed(
        `IN STOCK · ${p.retailer} · ${p.name} · ${money(px)} · SKU ${p.sku}`,
        "stock",
      );
      void notifyLocal("DropAgent · " + p.retailer, `${p.name} in stock at ${money(px)}`);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        /* web */
      }
      if (armed) {
        if (wallet >= px) {
          setWallet((w) => Math.round((w - px) * 100) / 100);
          setSecured((n) => n + 1);
          pushFeed(
            `SECURED · simulated buy · ${p.name} for ${money(px)}`,
            "secure",
          );
          void notifyLocal("DropAgent secured", `${p.name} · ${money(px)}`);
        } else {
          pushFeed(
            `Wallet skip · need ${money(px)}, have ${money(wallet)}`,
            "info",
          );
        }
      }
    },
    [armed, maxPrice, pushFeed, underLimit, wallet],
  );

  // scanner loop
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      ri.current = (ri.current + 1) % RETAILERS.length;
      const r = RETAILERS[ri.current];
      setScanLine(`Scanning ${r} · ${nowTime()}`);
      if (Math.random() < 0.36) {
        const watched = skus.filter((s) => s.watching);
        if (watched.length) {
          const p = watched[Math.floor(Math.random() * watched.length)];
          const jitter =
            Math.random() < 0.22
              ? p.price + Math.round((Math.random() * 40 + 5) * 100) / 100
              : p.price;
          void emitDrop(
            {
              ...p,
              retailer: Math.random() < 0.5 ? p.retailer : r,
            },
            jitter,
          );
        }
      }
    }, 2800);
    const boot = setTimeout(() => {
      const p = skus.find((s) => s.watching) || skus[0];
      if (p) void emitDrop(p);
    }, 1200);
    return () => {
      clearInterval(id);
      clearTimeout(boot);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, skus, emitDrop]);

  const watching = useMemo(() => skus.filter((s) => s.watching).length, [skus]);
  const customCount = useMemo(
    () => skus.filter((s) => s.custom).length,
    [skus],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const fmax = Number(filterMax) || 0;
    return skus.filter((s) => {
      if (
        q &&
        !(
          s.name.toLowerCase().includes(q) ||
          s.sku.toLowerCase().includes(q) ||
          s.retailer.toLowerCase().includes(q)
        )
      )
        return false;
      if (fmax && s.price > fmax) return false;
      if (minPrice && s.price < minPrice) return false;
      return true;
    });
  }, [filterMax, minPrice, search, skus]);

  const addSku = () => {
    const sku = skuInput.trim();
    if (sku.length < 3) {
      showToast("SKU must be at least 3 characters");
      return;
    }
    const price = Number(skuPrice);
    if (!price || price <= 0) {
      showToast("Enter a valid price");
      return;
    }
    const maxPay = skuMax ? Number(skuMax) : undefined;
    const item: Sku = {
      id: `c_${Date.now()}`,
      name: (skuName.trim() || `SKU ${sku}`).slice(0, 80),
      sku: sku.toUpperCase(),
      retailer: skuRetailer,
      price,
      maxPay: maxPay && maxPay > 0 ? maxPay : undefined,
      watching: true,
      custom: true,
    };
    setSkus((prev) => [item, ...prev]);
    setSkuInput("");
    setSkuName("");
    showToast(`Watching ${item.sku}`);
    pushFeed(
      `SKU added · ${item.retailer} · ${item.sku} · list ${money(price)}${maxPay ? ` · max pay ${money(maxPay)}` : ""}`,
      "info",
    );
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const enablePush = async () => {
    const ok = await ensurePushPermission();
    setPushOn(ok);
    showToast(ok ? "Push alerts enabled" : "Push permission denied");
    if (ok) {
      await notifyLocal("DropAgent ready", "Phone alerts armed for TCG drops");
    }
  };

  if (!ready) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={C.live} size="large" />
        <Text style={styles.muted}>Loading DropAgent…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>DA</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>DropAgent</Text>
              <Text style={styles.scan} numberOfLines={1}>
                {scanLine}
              </Text>
            </View>
            <View style={styles.pill}>
              <View style={styles.dot} />
              <Text style={styles.pillText}>10 retailers</Text>
            </View>
          </View>
          <View style={styles.stats}>
            <Stat label="Balance" value={money(wallet)} />
            <Stat label="Watching" value={String(watching)} />
            <Stat label="Max snipe" value={money(maxPrice)} />
            <Stat label="Custom" value={String(customCount)} />
            <Stat label="Secured" value={String(secured)} />
          </View>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          {tab === "radar" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Live drop feed</Text>
              <Text style={styles.hint}>
                Simulated multi-retailer radar · price limits enforced
              </Text>
              {feed.length === 0 ? (
                <Text style={[styles.muted, { marginTop: 16 }]}>
                  Waiting for restocks…
                </Text>
              ) : (
                feed.map((e) => (
                  <View
                    key={e.id}
                    style={[
                      styles.feedItem,
                      e.kind === "stock" && styles.feedLive,
                      e.kind === "skip" && styles.feedSkip,
                      e.kind === "secure" && styles.feedOk,
                    ]}
                  >
                    <View style={styles.feedTop}>
                      <Badge
                        label={
                          e.kind === "stock"
                            ? "LIVE"
                            : e.kind === "skip"
                              ? "Price skip"
                              : e.kind === "secure"
                                ? "Secured"
                                : "Info"
                        }
                        tone={
                          e.kind === "stock"
                            ? "live"
                            : e.kind === "skip"
                              ? "warn"
                              : e.kind === "secure"
                                ? "live"
                                : "neutral"
                        }
                      />
                      <Text style={styles.time}>{e.t}</Text>
                    </View>
                    <Text style={styles.feedText}>{e.html}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {tab === "skus" && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Add custom SKU</Text>
                <Field label="SKU / DPCI / ASIN">
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 085-10-3599"
                    placeholderTextColor={C.subtle}
                    value={skuInput}
                    onChangeText={setSkuInput}
                    autoCapitalize="characters"
                  />
                </Field>
                <Field label="Name (optional)">
                  <TextInput
                    style={styles.input}
                    placeholder="Prismatic Evolutions ETB"
                    placeholderTextColor={C.subtle}
                    value={skuName}
                    onChangeText={setSkuName}
                  />
                </Field>
                <Field label="Retailer">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {RETAILERS.map((r) => (
                        <Pressable
                          key={r}
                          onPress={() => setSkuRetailer(r)}
                          style={[
                            styles.chip,
                            skuRetailer === r && styles.chipOn,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              skuRetailer === r && styles.chipTextOn,
                            ]}
                          >
                            {r}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </Field>
                <View style={styles.row2}>
                  <Field label="List price $" style={{ flex: 1 }}>
                    <TextInput
                      style={styles.input}
                      keyboardType="decimal-pad"
                      value={skuPrice}
                      onChangeText={setSkuPrice}
                      placeholderTextColor={C.subtle}
                    />
                  </Field>
                  <Field label="Max pay $" style={{ flex: 1 }}>
                    <TextInput
                      style={styles.input}
                      keyboardType="decimal-pad"
                      value={skuMax}
                      onChangeText={setSkuMax}
                      placeholderTextColor={C.subtle}
                    />
                  </Field>
                </View>
                <Pressable style={styles.btnLive} onPress={addSku}>
                  <Text style={styles.btnLiveText}>Add SKU & watch</Text>
                </Pressable>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Price limits</Text>
                <View style={styles.row2}>
                  <Field label="Min $" style={{ flex: 1 }}>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={String(minPrice)}
                      onChangeText={(t) => setMinPrice(Number(t) || 0)}
                      placeholderTextColor={C.subtle}
                    />
                  </Field>
                  <Field label="Max snipe $" style={{ flex: 1 }}>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={String(maxPrice)}
                      onChangeText={(t) => setMaxPrice(Number(t) || 0)}
                      placeholderTextColor={C.subtle}
                    />
                  </Field>
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>
                    Enforce — skip drops over max
                  </Text>
                  <Switch
                    value={enforce}
                    onValueChange={setEnforce}
                    trackColor={{ false: C.border, true: C.liveDim }}
                    thumbColor={enforce ? C.live : C.muted}
                  />
                </View>
                <Text style={styles.hint}>
                  Agent only snipes {money(minPrice)}–{money(maxPrice)}
                  {enforce ? " (enforced)" : " (advisory)"}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Catalog & watchlist</Text>
                <Field label="Search">
                  <TextInput
                    style={styles.input}
                    placeholder="Name, SKU, retailer…"
                    placeholderTextColor={C.subtle}
                    value={search}
                    onChangeText={setSearch}
                  />
                </Field>
                <Field label="Filter max $">
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    placeholder="e.g. 100"
                    placeholderTextColor={C.subtle}
                    value={filterMax}
                    onChangeText={setFilterMax}
                  />
                </Field>
                {filtered.map((s) => {
                  const over = enforce && s.price > maxPrice;
                  return (
                    <View key={s.id} style={styles.skuRow}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={styles.chipRow}>
                          <Badge label={s.retailer} tone="neutral" />
                          {s.custom ? <Badge label="Custom" tone="info" /> : null}
                          {over ? <Badge label="Over cap" tone="warn" /> : null}
                          {s.watching ? (
                            <Badge label="Watching" tone="live" />
                          ) : null}
                        </View>
                        <Text style={styles.skuName}>{s.name}</Text>
                        <Text style={styles.meta}>
                          {s.sku} · {money(s.price)}
                          {s.maxPay ? ` · max ${money(s.maxPay)}` : ""}
                        </Text>
                      </View>
                      <Pressable
                        style={[styles.btnSec, !s.watching && styles.btnLiveSmall]}
                        onPress={() =>
                          setSkus((prev) =>
                            prev.map((x) =>
                              x.id === s.id
                                ? { ...x, watching: !x.watching }
                                : x,
                            ),
                          )
                        }
                      >
                        <Text
                          style={
                            s.watching ? styles.btnSecText : styles.btnLiveText
                          }
                        >
                          {s.watching ? "Unwatch" : "Watch"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {tab === "agent" && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Agent wallet</Text>
                <Field label="Balance $">
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={String(wallet)}
                    onChangeText={(t) => setWallet(Number(t) || 0)}
                    placeholderTextColor={C.subtle}
                  />
                </Field>
                <View style={styles.row2}>
                  <Pressable
                    style={[styles.btnLive, { flex: 1 }]}
                    onPress={() => {
                      setArmed(true);
                      showToast("Agent armed");
                      pushFeed(
                        "Agent armed · will simulate snipes under price limit",
                        "info",
                      );
                    }}
                  >
                    <Text style={styles.btnLiveText}>Arm agent</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btnDanger, { flex: 1 }]}
                    onPress={() => {
                      setArmed(false);
                      showToast("Agent disarmed");
                    }}
                  >
                    <Text style={styles.btnDangerText}>Disarm</Text>
                  </Pressable>
                </View>
                <Text style={styles.hint}>
                  {armed
                    ? `ARMED · max ${money(maxPrice)} · bal ${money(wallet)}`
                    : "Agent disarmed"}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Phone alerts</Text>
                <Field label="Mobile (demo SMS log)">
                  <TextInput
                    style={styles.input}
                    keyboardType="phone-pad"
                    placeholder="(404) 555-0100"
                    placeholderTextColor={C.subtle}
                    value={phone}
                    onChangeText={setPhone}
                  />
                </Field>
                <View style={styles.row2}>
                  <Pressable style={[styles.btnLive, { flex: 1 }]} onPress={enablePush}>
                    <Text style={styles.btnLiveText}>
                      {pushOn ? "Push on" : "Enable push"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btnSec, { flex: 1 }]}
                    onPress={() =>
                      void notifyLocal(
                        "DropAgent test alert",
                        `Max snipe ${money(maxPrice)} · watching ${watching}`,
                      ).then(() => showToast("Test alert sent"))
                    }
                  >
                    <Text style={styles.btnSecText}>Test alert</Text>
                  </Pressable>
                </View>
                <Text style={styles.hint}>
                  Demo agent — simulated purchases only. Not affiliated with
                  retailers.
                </Text>
              </View>
            </>
          )}

          {tab === "ship" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>TestFlight ship checklist</Text>
              <Text style={styles.bodyText}>
                This Expo app is ready for an iOS build and TestFlight. You need
                an Apple Developer account ($99/yr) and a free Expo account.
              </Text>
              <Step n={1} text="Install EAS CLI: npm i -g eas-cli" />
              <Step n={2} text="eas login  (Expo account)" />
              <Step n={3} text="cd dropagent-ios && eas init" />
              <Step
                n={4}
                text="eas build --platform ios --profile production"
              />
              <Step
                n={5}
                text="eas submit --platform ios --latest  → TestFlight"
              />
              <Text style={[styles.hint, { marginTop: 12 }]}>
                Bundle ID: com.lvlltd.dropagent · App name: DropAgent
              </Text>
              <Text style={styles.hint}>
                Web companion: https://dropagent.lvlltd.com
              </Text>
              <Pressable
                style={[styles.btnSec, { marginTop: 16 }]}
                onPress={() =>
                  Alert.alert(
                    "DropAgent",
                    "Run the EAS commands in a terminal with your Apple + Expo logins. Cloud build does not need a Mac.",
                  )
                }
              >
                <Text style={styles.btnSecText}>How cloud build works</Text>
              </Pressable>
              <Text style={[styles.meta, { marginTop: 16 }]}>
                SDK {Constants.expoConfig?.sdkVersion ?? "57"} · v
                {Constants.expoConfig?.version ?? "1.0.0"}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.tabBar}>
          {(
            [
              ["radar", "Radar"],
              ["skus", "SKUs"],
              ["agent", "Agent"],
              ["ship", "Ship"],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              style={[styles.tab, tab === id && styles.tabOn]}
              onPress={() => setTab(id)}
            >
              <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "live" | "warn" | "info" | "neutral";
}) {
  const bg =
    tone === "live"
      ? C.liveDim
      : tone === "warn"
        ? "#3d321a"
        : tone === "info"
          ? "#1a2840"
          : C.raised;
  const fg =
    tone === "live"
      ? C.live
      : tone === "warn"
        ? C.warn
        : tone === "info"
          ? C.info
          : C.muted;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.live,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#04140c", fontWeight: "800", fontSize: 15 },
  title: { color: C.fg, fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  scan: { color: C.muted, fontSize: 11, fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }), marginTop: 2 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.liveDim,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.25)",
  },
  pillText: { color: C.live, fontSize: 11, fontWeight: "600" },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.live,
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  stat: {
    backgroundColor: C.elevated,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: "30%",
    flexGrow: 1,
  },
  statLabel: {
    color: C.subtle,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  statValue: { color: C.fg, fontSize: 15, fontWeight: "700" },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 100, gap: 12 },
  card: {
    backgroundColor: C.surface,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 4,
  },
  cardTitle: {
    color: C.fg,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  hint: { color: C.subtle, fontSize: 12, lineHeight: 17, marginTop: 8 },
  muted: { color: C.muted, fontSize: 13 },
  bodyText: { color: C.muted, fontSize: 14, lineHeight: 21, marginBottom: 12 },
  feedItem: {
    backgroundColor: C.elevated,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  feedLive: {
    borderColor: "rgba(62,207,142,0.35)",
    backgroundColor: "rgba(26,61,46,0.35)",
  },
  feedSkip: {
    borderColor: "rgba(240,195,107,0.3)",
    backgroundColor: "rgba(61,50,26,0.35)",
  },
  feedOk: {
    borderColor: "rgba(62,207,142,0.45)",
  },
  feedTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  feedText: { color: C.fg, fontSize: 13, lineHeight: 18 },
  time: { color: C.subtle, fontSize: 11, fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }) },
  field: { marginBottom: 10 },
  fieldLabel: {
    color: C.subtle,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.elevated,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 10,
    color: C.fg,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
  },
  row2: { flexDirection: "row", gap: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  chip: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.elevated,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipOn: {
    borderColor: "rgba(62,207,142,0.4)",
    backgroundColor: C.liveDim,
  },
  chipText: { color: C.muted, fontSize: 12, fontWeight: "600" },
  chipTextOn: { color: C.live },
  btnLive: {
    backgroundColor: C.live,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnLiveSmall: { backgroundColor: C.live, borderColor: "transparent" },
  btnLiveText: { color: "#04140c", fontWeight: "700", fontSize: 14 },
  btnSec: {
    backgroundColor: C.elevated,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecText: { color: C.fg, fontWeight: "600", fontSize: 13 },
  btnDanger: {
    backgroundColor: "#3d1a1a",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(239,107,107,0.3)",
  },
  btnDangerText: { color: C.danger, fontWeight: "700", fontSize: 14 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 12,
  },
  switchLabel: { color: C.fg, fontSize: 13, flex: 1 },
  skuRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: C.elevated,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  skuName: { color: C.fg, fontSize: 14, fontWeight: "600", marginTop: 4 },
  meta: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
    paddingBottom: Platform.OS === "ios" ? 8 : 6,
    paddingTop: 6,
    paddingHorizontal: 8,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  tabOn: { backgroundColor: C.liveDim },
  tabText: { color: C.muted, fontWeight: "600", fontSize: 13 },
  tabTextOn: { color: C.live },
  toast: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: C.elevated,
    borderColor: C.border,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  toastText: { color: C.fg, fontSize: 13, fontWeight: "600" },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.liveDim,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { color: C.live, fontWeight: "700", fontSize: 12 },
  stepText: {
    color: C.fg,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
