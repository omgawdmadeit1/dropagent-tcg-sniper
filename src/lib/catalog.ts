export type Retailer =
  | "Target"
  | "Walmart"
  | "Best Buy"
  | "Pokémon Center"
  | "GameStop"
  | "Amazon"
  | "Costco"
  | "Sam's Club"
  | "Barnes & Noble"
  | "CVS";

export type ProductKind =
  | "ETB"
  | "Booster Bundle"
  | "Booster Display"
  | "Blister"
  | "Collection"
  | "Figure";

export type Product = {
  id: string;
  name: string;
  set: string;
  kind: ProductKind;
  retailer: Retailer;
  price: number;
  msrp: number;
  stockExpected: "ultra-low" | "low" | "moderate";
  sku: string;
  href: string;
  imageHue: number;
};

export const RETAILERS: Retailer[] = [
  "Target",
  "Walmart",
  "Best Buy",
  "Pokémon Center",
  "GameStop",
  "Amazon",
  "Costco",
  "Sam's Club",
  "Barnes & Noble",
  "CVS",
];

export const RETAILER_META: Record<
  Retailer,
  { short: string; color: string; searchUrl: string }
> = {
  Target: {
    short: "TGT",
    color: "hsl(0 72% 48%)",
    searchUrl: "https://www.target.com/s?searchTerm=pokemon+tcg",
  },
  Walmart: {
    short: "WMT",
    color: "hsl(205 90% 40%)",
    searchUrl: "https://www.walmart.com/search?q=pokemon+tcg",
  },
  "Best Buy": {
    short: "BBY",
    color: "hsl(45 95% 45%)",
    searchUrl: "https://www.bestbuy.com/site/searchpage.jsp?st=pokemon+tcg",
  },
  "Pokémon Center": {
    short: "PC",
    color: "hsl(210 80% 50%)",
    searchUrl: "https://www.pokemoncenter.com/",
  },
  GameStop: {
    short: "GME",
    color: "hsl(0 0% 55%)",
    searchUrl: "https://www.gamestop.com/search/?q=pokemon",
  },
  Amazon: {
    short: "AMZ",
    color: "hsl(36 90% 50%)",
    searchUrl: "https://www.amazon.com/s?k=pokemon+tcg",
  },
  Costco: {
    short: "COS",
    color: "hsl(205 70% 35%)",
    searchUrl: "https://www.costco.com/CatalogSearch?keyword=pokemon",
  },
  "Sam's Club": {
    short: "SAM",
    color: "hsl(210 60% 40%)",
    searchUrl: "https://www.samsclub.com/s/pokemon",
  },
  "Barnes & Noble": {
    short: "B&N",
    color: "hsl(150 40% 35%)",
    searchUrl: "https://www.barnesandnoble.com/s/pokemon+tcg",
  },
  CVS: {
    short: "CVS",
    color: "hsl(350 70% 45%)",
    searchUrl: "https://www.cvs.com/search?searchTerm=pokemon",
  },
};

export const CATALOG: Product[] = [
  {
    id: "pb-etb",
    name: "Pitch Black Elite Trainer Box",
    set: "Pitch Black",
    kind: "ETB",
    retailer: "Target",
    price: 54.99,
    msrp: 54.99,
    stockExpected: "ultra-low",
    sku: "TCG-PB-ETB-01",
    href: "https://www.target.com/s?searchTerm=pokemon+elite+trainer+box",
    imageHue: 220,
  },
  {
    id: "pb-bundle",
    name: "Pitch Black Booster Bundle",
    set: "Pitch Black",
    kind: "Booster Bundle",
    retailer: "Target",
    price: 26.99,
    msrp: 26.99,
    stockExpected: "ultra-low",
    sku: "TCG-PB-BB-02",
    href: "https://www.target.com/s?searchTerm=pokemon+booster+bundle",
    imageHue: 250,
  },
  {
    id: "pb-display",
    name: "Pitch Black Booster Display",
    set: "Pitch Black",
    kind: "Booster Display",
    retailer: "Target",
    price: 143.88,
    msrp: 143.88,
    stockExpected: "ultra-low",
    sku: "TCG-PB-BD-03",
    href: "https://www.target.com/s?searchTerm=pokemon+booster+box",
    imageHue: 200,
  },
  {
    id: "pb-blister",
    name: "Pitch Black 3-Pack Blister",
    set: "Pitch Black",
    kind: "Blister",
    retailer: "Target",
    price: 14.99,
    msrp: 14.99,
    stockExpected: "low",
    sku: "TCG-PB-BL-04",
    href: "https://www.target.com/s?searchTerm=pokemon+blister",
    imageHue: 190,
  },
  {
    id: "pe-spc",
    name: "Prismatic Evolutions Special Collection",
    set: "Prismatic Evolutions",
    kind: "Collection",
    retailer: "Target",
    price: 49.99,
    msrp: 49.99,
    stockExpected: "ultra-low",
    sku: "TCG-PE-SPC-05",
    href: "https://www.target.com/s?searchTerm=prismatic+evolutions",
    imageHue: 300,
  },
  {
    id: "cr-bundle",
    name: "Chaos Rising Booster Bundle",
    set: "Chaos Rising",
    kind: "Booster Bundle",
    retailer: "Target",
    price: 26.99,
    msrp: 26.99,
    stockExpected: "ultra-low",
    sku: "TCG-CR-BB-06",
    href: "https://www.target.com/s?searchTerm=pokemon+chaos",
    imageHue: 15,
  },
  {
    id: "mega-gren",
    name: "Mega Greninja ex Collection",
    set: "Special Collections",
    kind: "Collection",
    retailer: "Target",
    price: 29.99,
    msrp: 29.99,
    stockExpected: "low",
    sku: "TCG-MG-EX-07",
    href: "https://www.target.com/s?searchTerm=greninja+pokemon",
    imageHue: 210,
  },
  {
    id: "pb-etb-wm",
    name: "Pitch Black Elite Trainer Box",
    set: "Pitch Black",
    kind: "ETB",
    retailer: "Walmart",
    price: 54.99,
    msrp: 54.99,
    stockExpected: "ultra-low",
    sku: "TCG-PB-ETB-WM",
    href: "https://www.walmart.com/search?q=pokemon+elite+trainer+box",
    imageHue: 225,
  },
  {
    id: "pe-etb-pc",
    name: "Prismatic Evolutions ETB",
    set: "Prismatic Evolutions",
    kind: "ETB",
    retailer: "Pokémon Center",
    price: 59.99,
    msrp: 59.99,
    stockExpected: "ultra-low",
    sku: "TCG-PE-ETB-PC",
    href: "https://www.pokemoncenter.com/",
    imageHue: 310,
  },
  {
    id: "cr-display-bb",
    name: "Chaos Rising Booster Display",
    set: "Chaos Rising",
    kind: "Booster Display",
    retailer: "Best Buy",
    price: 143.88,
    msrp: 143.88,
    stockExpected: "low",
    sku: "TCG-CR-BD-BB",
    href: "https://www.bestbuy.com/site/searchpage.jsp?st=pokemon",
    imageHue: 25,
  },
  {
    id: "pb-bundle-gs",
    name: "Pitch Black Booster Bundle",
    set: "Pitch Black",
    kind: "Booster Bundle",
    retailer: "GameStop",
    price: 27.99,
    msrp: 26.99,
    stockExpected: "moderate",
    sku: "TCG-PB-BB-GS",
    href: "https://www.gamestop.com/search/?q=pokemon",
    imageHue: 255,
  },
  {
    id: "pe-blister-wm",
    name: "Prismatic Evolutions Tech Sticker Collection",
    set: "Prismatic Evolutions",
    kind: "Collection",
    retailer: "Walmart",
    price: 24.99,
    msrp: 24.99,
    stockExpected: "low",
    sku: "TCG-PE-TS-WM",
    href: "https://www.walmart.com/search?q=prismatic+evolutions",
    imageHue: 290,
  },
  {
    id: "pb-etb-amz",
    name: "Pitch Black Elite Trainer Box",
    set: "Pitch Black",
    kind: "ETB",
    retailer: "Amazon",
    price: 64.99,
    msrp: 54.99,
    stockExpected: "low",
    sku: "TCG-PB-ETB-AMZ",
    href: "https://www.amazon.com/s?k=pokemon+elite+trainer+box",
    imageHue: 35,
  },
  {
    id: "pe-bundle-amz",
    name: "Prismatic Evolutions Booster Bundle",
    set: "Prismatic Evolutions",
    kind: "Booster Bundle",
    retailer: "Amazon",
    price: 32.99,
    msrp: 26.99,
    stockExpected: "moderate",
    sku: "TCG-PE-BB-AMZ",
    href: "https://www.amazon.com/s?k=prismatic+evolutions+bundle",
    imageHue: 320,
  },
  {
    id: "pb-display-costco",
    name: "Pitch Black Booster Display",
    set: "Pitch Black",
    kind: "Booster Display",
    retailer: "Costco",
    price: 129.99,
    msrp: 143.88,
    stockExpected: "ultra-low",
    sku: "TCG-PB-BD-COS",
    href: "https://www.costco.com/CatalogSearch?keyword=pokemon",
    imageHue: 205,
  },
  {
    id: "cr-etb-sams",
    name: "Chaos Rising Elite Trainer Box",
    set: "Chaos Rising",
    kind: "ETB",
    retailer: "Sam's Club",
    price: 49.98,
    msrp: 54.99,
    stockExpected: "ultra-low",
    sku: "TCG-CR-ETB-SAM",
    href: "https://www.samsclub.com/s/pokemon",
    imageHue: 10,
  },
  {
    id: "pe-blister-bn",
    name: "Prismatic Evolutions 3-Pack Blister",
    set: "Prismatic Evolutions",
    kind: "Blister",
    retailer: "Barnes & Noble",
    price: 15.99,
    msrp: 14.99,
    stockExpected: "moderate",
    sku: "TCG-PE-BL-BN",
    href: "https://www.barnesandnoble.com/s/pokemon+tcg",
    imageHue: 160,
  },
  {
    id: "pb-blister-cvs",
    name: "Pitch Black Mini Tin",
    set: "Pitch Black",
    kind: "Collection",
    retailer: "CVS",
    price: 12.99,
    msrp: 12.99,
    stockExpected: "low",
    sku: "TCG-PB-MT-CVS",
    href: "https://www.cvs.com/search?searchTerm=pokemon",
    imageHue: 350,
  },
  {
    id: "cr-bundle-bb",
    name: "Chaos Rising Booster Bundle",
    set: "Chaos Rising",
    kind: "Booster Bundle",
    retailer: "Best Buy",
    price: 26.99,
    msrp: 26.99,
    stockExpected: "low",
    sku: "TCG-CR-BB-BBY",
    href: "https://www.bestbuy.com/site/searchpage.jsp?st=pokemon+booster",
    imageHue: 30,
  },
  {
    id: "pe-spc-pc",
    name: "Prismatic Evolutions Super-Premium Collection",
    set: "Prismatic Evolutions",
    kind: "Collection",
    retailer: "Pokémon Center",
    price: 119.99,
    msrp: 119.99,
    stockExpected: "ultra-low",
    sku: "TCG-PE-SPC-PC",
    href: "https://www.pokemoncenter.com/",
    imageHue: 280,
  },
];

export function getProduct(id: string): Product | undefined {
  return CATALOG.find((p) => p.id === id);
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function stockLabel(s: Product["stockExpected"]): string {
  if (s === "ultra-low") return "Ultra low stock";
  if (s === "low") return "Low stock";
  return "Moderate stock";
}

export function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
