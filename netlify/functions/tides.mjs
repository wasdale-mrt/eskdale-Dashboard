// Tide times for Tarn Point from the ADMIRALTY UK Tidal API (Discovery tier).
//
// The API key never reaches anyone's browser. It is read from the Netlify
// environment variable UKHO_API_KEY, which you set in:
//   Netlify > your site > Site configuration > Environment variables
//
// Netlify's CDN caches each answer for 3 hours, so the UKHO API is called
// only a handful of times a day however many phones and screens are open.

const BASE = "https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations";
const STATION_NAME = "Tarn Point";
// Used only if no station is called "Tarn Point": pick the nearest one to the Esk estuary.
const NEAR = { lat: 54.34, lon: -3.41 };

export default async () => {
  const key = process.env.UKHO_API_KEY;
  if (!key) return reply({ error: "not_configured" }, 503, 60);

  const headers = { "Ocp-Apim-Subscription-Key": key };
  try {
    let id = process.env.UKHO_STATION_ID || "";
    let name = STATION_NAME;

    if (!id) {
      const station = await findStation(headers);
      id = station.id;
      name = station.name;
    }

    const r = await fetch(`${BASE}/${encodeURIComponent(id)}/TidalEvents?duration=7`, { headers });
    if (r.status === 401 || r.status === 403) return reply({ error: "bad_key" }, 502, 300);
    if (!r.ok) throw new Error(`tidal events HTTP ${r.status}`);
    const raw = await r.json();

    const events = (Array.isArray(raw) ? raw : [])
      .filter(e => e && e.DateTime && typeof e.Height === "number")
      .map(e => ({
        type: /high/i.test(e.EventType) ? "high" : "low",
        // UKHO times are GMT/UTC. Mark them as such so browsers convert to UK local time.
        time: /[zZ]|[+-]\d\d:?\d\d$/.test(e.DateTime) ? e.DateTime : e.DateTime + "Z",
        height: Math.round(e.Height * 100) / 100,
        approx: !!(e.IsApproximateTime || e.IsApproximateHeight),
      }));

    return reply({ station: { id, name }, fetchedAt: new Date().toISOString(), events }, 200, 3 * 3600);
  } catch (err) {
    if (/rejected the API key/.test(String(err && err.message))) return reply({ error: "bad_key" }, 502, 300);
    return reply({ error: "upstream", detail: String(err && err.message || err) }, 502, 300);
  }
};

async function findStation(headers) {
  // Try a name search first, then fall back to the full list.
  for (const url of [`${BASE}?name=${encodeURIComponent(STATION_NAME)}`, BASE]) {
    const r = await fetch(url, { headers });
    if (r.status === 401 || r.status === 403) throw new Error("UKHO rejected the API key");
    if (!r.ok) continue;
    const j = await r.json();
    const features = (j && j.features) || [];
    const exact = features.find(f => f.properties && /tarn\s*point/i.test(f.properties.Name || ""));
    if (exact) return { id: exact.properties.Id, name: exact.properties.Name };
    if (url === BASE && features.length) {
      let best = null, bestD = Infinity;
      for (const f of features) {
        const c = f.geometry && f.geometry.coordinates;
        if (!c) continue;
        const d = (c[1] - NEAR.lat) ** 2 + ((c[0] - NEAR.lon) * Math.cos(NEAR.lat * Math.PI / 180)) ** 2;
        if (d < bestD) { bestD = d; best = f; }
      }
      if (best) return { id: best.properties.Id, name: best.properties.Name };
    }
  }
  throw new Error("Could not find a tide station for Tarn Point");
}

function reply(body, status, cdnSeconds) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=600",
      "netlify-cdn-cache-control": `public, s-maxage=${cdnSeconds}, durable`,
    },
  });
}

export const config = { path: "/api/tides" };
