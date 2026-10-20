# Eskdale Conditions – version 2

A web app for Outward Bound Eskdale that shows, on one screen:

- Flood warnings and alerts within 20 km (Environment Agency)
- River Esk at Cropple How: latest level, rising/falling, normal range and a 5-day graph (Environment Agency)
- Valley forecast for Eskdale Green: now, next 24 hours and 3 days (Open-Meteo, Met Office UK model)
- Fell-top forecast for Scafell Pike, 978 m (Open-Meteo)
- **New in v2:** Tarn Point tides – rising or falling, next high/low water, heights and a 24-hour tide curve (UK Hydrographic Office)
- Links to the MWIS and Met Office mountain forecasts
- A placeholder for the predicted river level

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The dashboard |
| `netlify/functions/tides.mjs` | The tide service. It fetches Tarn Point tides from the UKHO using your API key, so the key never reaches anyone's browser |
| `netlify.toml` | Tells Netlify where the tide service is |
| `manifest.webmanifest`, `sw.js`, icons | Phone "Add to Home Screen" support |

## Setting up the tides (once)

The tide service is a small program that runs on Netlify. Netlify only runs it when the site is deployed from GitHub (or the Netlify command-line tool); a plain drag-and-drop upload publishes the dashboard but not the tide service.

### 1. Put the files on GitHub

1. Create a free account at https://github.com and choose **New repository**. Name it `eskdale-conditions`. It can be **Private**.
2. On the new repository page, click **uploading an existing file**.
3. Drag in **everything in this folder**, including the `netlify` folder and `netlify.toml`. Use Chrome or Edge so the folder structure is kept.
4. Click **Commit changes**.

### 2. Link your Netlify site to GitHub

This keeps the same web address you've already sent Jack.

1. In Netlify, open your site, then **Site configuration → Build & deploy → Continuous deployment → Link repository** (the wording may be "Link site to Git").
2. Choose **GitHub**, allow Netlify access, and pick `eskdale-conditions`.
3. Leave the build command **empty**. The publish directory is set by `netlify.toml`.

### 3. Add the API key to Netlify

1. In Netlify: **Site configuration → Environment variables → Add a variable**.
2. Key: `UKHO_API_KEY`
   Value: your UK Tidal API (Discovery) primary key.
3. Save it, then go to **Deploys → Trigger deploy → Deploy site**. New variables only apply after a fresh deploy.

The key lives only in Netlify's settings. Don't put it in any file, email or chat.

### 4. Check it works

Open `https://YOUR-SITE.netlify.app/api/tides`. You should see tide times for Tarn Point. Then open the dashboard: the Tides panel shows the next high and low waters.

Compare the times once against EasyTide (https://easytide.admiralty.co.uk/, search for Tarn Point). They should match.

If the Tides panel shows a message instead:

| Message | What to do |
|---|---|
| "The tide service isn't running on this site yet" | The site isn't being deployed from GitHub yet (step 2), or the `netlify` folder is missing from the repository |
| "…the UKHO API key hasn't been added in Netlify yet" | Add `UKHO_API_KEY` (step 3) and redeploy |
| "The UKHO API key was rejected" | Check the key was copied fully, and that the Discovery subscription is active on the ADMIRALTY developer portal |

The tide service asks the UKHO for 7 days of tides and Netlify keeps each answer for 3 hours, so the API is called only a few times a day, well within the free tier. The Discovery subscription lasts a year: put a reminder in the calendar to renew it.

## Updating the dashboard later

Once GitHub is linked, upload the changed files to the repository (**Add file → Upload files**). Netlify republishes automatically within a minute, and the link stays the same. Then change `VERSION` in `sw.js` (for example `eskdale-v2` to `eskdale-v3`) so phones fetch the new version on their next visit.

## Reception screen and phones

- Reception screen: add `?screen` to the address, for example `https://eskdale-conditions.netlify.app/?screen`. It uses the dark theme, fits everything on screen, keeps the display awake where the browser allows it, and reloads itself every 12 hours.
- Phones: open the address in Safari (iPhone) or Chrome (Android) and choose **Add to Home Screen**.

Opening `index.html` straight from a laptop still works for the river and weather, but tides only appear when the site is online.

## Credits and terms

- River and flood data: Environment Agency, Open Government Licence v3.0
- Tides: UK Hydrographic Office, ADMIRALTY UK Tidal API
- Weather data by Open-Meteo.com (CC BY 4.0), free for non-commercial use

This is a briefing aid. It does not replace official forecasts and warnings or the centre's own procedures.
