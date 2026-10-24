// Predicted level for the River Esk (Brotherilkeld to Forge Bridge) from RiverPredictor.
//
// Owen at riverpredictor.uk agreed (Oct 2026) that the centre can use this data,
// asking for a "Powered by RiverPredictor" credit with a link, which the dashboard shows.
//
// The upstream JSON holds ~12 days of 15-minute observations plus an hourly forecast.
// Each entry has either "level" (observed) or "level_forecast", and "rain" or "rain_forecast".
// This function trims it to the last 36 hours plus the forecast, and Netlify's CDN caches
// the answer for 15 minutes, so RiverPredictor is called at most a few times an hour
// however many phones and screens are open. No key is needed.

const RIVER = "esk_lakes_brotherikeld_forge_bridge";
const URL_ = `https://riverpredictor.uk/api/river.php?river=${RIVER}`;
const KEEP_HOURS = 36;

export default async () => {
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 9000); // Netlify stops functions after 10 s
    let r;
    try { r = await fetch(URL_, { signal: ctl.signal, headers: { "user-agent": "EskdaleConditions/1 (Outward Bound Eskdale dashboard)" } }); }
    finally { clearTimeout(to); }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const raw = await r.json();
    const block = raw[RIVER] || Object.values(raw)[0];
    if (!block || !Array.isArray(block.levels)) throw new Error("unexpected format");

    const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
    const cal = {};
    for (const [k, v] of Object.entries(block.calibrations || {})) { const n = num(v); if (n != null) cal[k] = n; }

    const cutoff = Date.now() - KEEP_HOURS * 3600e3;
    const observed = [], forecast = [];
    for (const e of block.levels) {
      const t = Date.parse(e.time);
      if (!Number.isFinite(t)) continue;
      const lv = num(e.level), lf = num(e.level_forecast);
      if (lv != null && t >= cutoff) observed.push([e.time, lv, num(e.rain)]);
      if (lf != null) forecast.push([e.time, lf, num(e.rain_forecast)]);
    }
    const byTime = (a, b) => Date.parse(a[0]) - Date.parse(b[0]);
    observed.sort(byTime); forecast.sort(byTime);
    if (!observed.length && !forecast.length) return reply({ error: "empty" }, 502, 300);

    return reply({ source: "RiverPredictor", river: RIVER, fetchedAt: new Date().toISOString(),
      calibrations: cal, observed, forecast }, 200, 900);
  } catch (err) {
    return reply({ error: "upstream", detail: String(err && err.message || err) }, 502, 300);
  }
};

function reply(body, status, cdnSeconds) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "netlify-cdn-cache-control": `public, s-maxage=${cdnSeconds}, durable`,
    },
  });
}

export const config = { path: "/api/riverpredictor" };
