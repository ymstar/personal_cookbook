import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HTML = `file://${ROOT}/scripts/icon.html`;

const SIZES = [
  { size: 512, name: "icon-512.png" },
  { size: 192, name: "icon-192.png" },
  { size: 180, name: "apple-touch-icon.png" },
];

const browser = await chromium.launch();
for (const { size, name } of SIZES) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 2, // retina quality
  });
  await page.goto(HTML);
  await page.screenshot({
    path: path.join(ROOT, "public", name),
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: false,
  });
  console.log(`✅ ${name} (${size}x${size})`);
  await page.close();
}
await browser.close();
