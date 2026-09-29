// Fetches every news feed listed in assets/feed.js and saves the headlines to data/feeds.json.
// Runs every 15 minutes on GitHub (see .github/workflows/update-data.yml). No packages needed: Node 18+.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import vm from "node:vm";

const here = new URL("..", import.meta.url);
const code = readFileSync(new URL("assets/feed.js", here), "utf8");
const sandbox = { window: {}, document: { body: null, createElement: () => ({}) }, console };
vm.runInNewContext(code, sandbox);
const SOURCES = sandbox.window.QHFeed.sources;

const decode1 = (s = "") => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/<[^>]+>/g, "")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .trim();
const decode = (s = "") => { let a = decode1(s), b = decode1(a); return b; };
const tag = (block, names) => {
  for (const n of names) {
    const m = block.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, "i"));
    if (m && decode(m[1])) return decode(m[1]);
  }
  return "";
};
export function parseFeed(xml) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map((b) => {
    let link = tag(b, ["link"]);
    if (!/^https?:/.test(link)) {
      const alt = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || b.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = alt ? alt[1] : tag(b, ["guid", "id"]);
    }
    return { title: tag(b, ["title"]), link: decode(link), pubDate: tag(b, ["pubDate", "published", "updated", "dc:date"]) };
  }).filter((i) => i.title && /^https?:/.test(i.link));
}

async function grab(src) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(src.url, { signal: ctl.signal, headers: { "user-agent": "queerham-feed/1.0 (+https://queerham.com)", accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const items = parseFeed(await r.text()).slice(0, 25).map((i) => ({ ...i, sourceId: src.id }));
    return { id: src.id, ok: true, n: items.length, items };
  } catch (e) {
    return { id: src.id, ok: false, error: String(e.message || e), items: [] };
  } finally { clearTimeout(t); }
}

if (process.argv[1] && process.argv[1].endsWith("update-data.mjs")) {
  const out = { generated: new Date().toISOString(), channels: {}, report: {} };
  for (const channel of Object.keys(SOURCES)) {
    const results = await Promise.all(SOURCES[channel].map(grab));
    out.channels[channel] = results.flatMap((r) => r.items);
    results.forEach((r) => { out.report[r.id] = r.ok ? r.n : "failed: " + r.error; });
  }
  mkdirSync(new URL("data/", here), { recursive: true });
  writeFileSync(new URL("data/feeds.json", here), JSON.stringify(out));
  console.table(out.report);
  const total = Object.values(out.channels).reduce((a, c) => a + c.length, 0);
  if (!total) { console.error("No headlines fetched from any source."); process.exit(1); }
}
