#!/usr/bin/env node
/**
 * After `npx cap add ios` / `npx cap sync ios`, patch Info.plist usage strings.
 * Safe to re-run.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const plistPath = path.join(root, "ios/App/App/Info.plist");

const pairs = {
  NSUserNotificationsUsageDescription:
    "DropAgent sends alerts when watched TCG SKUs restock at major retailers.",
};

if (!fs.existsSync(plistPath)) {
  console.error("ios/App/App/Info.plist not found. Run: npx cap add ios");
  process.exit(1);
}

let xml = fs.readFileSync(plistPath, "utf8");

// Display name
xml = xml.replace(
  /<key>CFBundleDisplayName<\/key>\s*<string>[\s\S]*?<\/string>/,
  "<key>CFBundleDisplayName</key>\n        <string>DropAgent</string>",
);

for (const [key, value] of Object.entries(pairs)) {
  const re = new RegExp(
    `<key>${key}<\\/key>\\s*<string>[\\s\\S]*?<\\/string>`,
  );
  const block = `<key>${key}</key>\n\t<string>${value}</string>`;
  if (re.test(xml)) {
    xml = xml.replace(re, block);
  } else {
    xml = xml.replace(
      /<\/dict>\s*<\/plist>\s*$/,
      `\t${block}\n</dict>\n</plist>\n`,
    );
  }
}
// Export compliance: only standard HTTPS / OS crypto (no custom encryption)
if (!xml.includes("ITSAppUsesNonExemptEncryption")) {
  xml = xml.replace(
    /<\/dict>\s*<\/plist>\s*$/,
    "\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>\n</dict>\n</plist>\n",
  );
}

fs.writeFileSync(plistPath, xml);
console.log("Patched", plistPath);
