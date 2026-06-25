# Ireland Hikes — Top 50 Tracker

A personal hiking tracker for Ireland's top 50 hikes, built with Vue 3, Vite, and Leaflet. Track your completions, log dates and ratings, add photos, and explore every route on an interactive map.

Live at **[warren.byron.technology](https://warren.byron.technology)**

---

## Features

- **Interactive map** — all 50 hikes plotted on a Leaflet map with hover cards showing a cover photo, name, county, and distance
- **Filter & search** — filter by province, county, difficulty, or completion status
- **Hike detail modal** — full info including Irish/Gaelic name (with in-browser pronunciation via Web Speech API), distance, elevation, difficulty, and description
- **Personal tracking** — mark hikes complete, set the date, rate out of 5, and add notes — all stored locally in your browser
- **Photo gallery** — upload your own photos per hike (stored in IndexedDB); photos with GPS EXIF data are pinned to the map automatically
- **Repo photos** — commit photos into `public/photos/{hikeId}/` and list them in `public/hike-photos.json` to share them with anyone who forks the repo
- **Export / import** — export your personal data as JSON and commit it back to the repo so it seeds on any new device
- **Credits view** — attribution for all open-source libraries, map data, the source hiking book, and Unsplash photographers

---

## Forking for your own use

This project is designed to be forked. The hiking data and personal progress are kept separate so you can maintain your own copy.

### 1. Fork the repo

Click **Fork** on GitHub. Your fork will have its own GitHub Pages deployment.

### 2. Enable GitHub Pages

In your fork: **Settings → Pages → Source → GitHub Actions**

The deploy workflow runs automatically on every push to `main`.

### 3. Seed your personal data

Edit `public/personal.json` to pre-populate completed hikes, ratings, and notes. The format is sparse — only include hikes you have data for:

```json
{
  "14": {
    "completed": true,
    "date_completed": "2024-08-15",
    "rating": 5,
    "notes": "Brilliant day, very clear summit."
  },
  "22": {
    "completed": true,
    "date_completed": "2025-06-01",
    "rating": 4,
    "notes": null
  }
}
```

The app also has a **Save Your Progress** panel in the Credits tab — export your current state and paste it into this file, then commit.

### 4. Add your own photos

Place photos in `public/photos/{hikeId}/` (e.g. `public/photos/14/summit.jpg`) and register them in `public/hike-photos.json`:

```json
{
  "hikes": {
    "14": [
      {
        "id": "14-0",
        "filename": "summit.jpg",
        "caption": "Summit of Carrauntoohil",
        "lat": 51.9994,
        "lng": -9.7393,
        "date": "2024-08-15"
      }
    ]
  }
}
```

`lat`/`lng` are optional — omit or set to `null` if you don't have GPS coordinates. GitHub's file size limit is 100 MB per file; resize photos on your Mac before committing (Photos → Export → adjust resolution, or use `sips`).

---

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Personal data loads from `public/personal.json` on first run and is then persisted in `localStorage`.

---

## Tech stack

| Layer | Library |
|---|---|
| UI framework | [Vue 3](https://vuejs.org) (Composition API) |
| Build tool | [Vite 5](https://vitejs.dev) |
| Map | [Leaflet 1.9](https://leafletjs.com) |
| EXIF reading | [exifr](https://github.com/MikeKovarik/exifr) |
| Hosting | GitHub Pages (via GitHub Actions) |
| Photo storage | IndexedDB (browser-local) |
| Personal data | localStorage + `public/personal.json` |

---

## Data sources

- **Hiking routes** — *Ireland's Top 50 Walks* by David Herman (Collins Press)
- **Map tiles** — © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- **Cover photos** — [Unsplash](https://unsplash.com) (free to use under the [Unsplash License](https://unsplash.com/license))

---

## Project structure

```
public/
  personal.json       # your completion data — edit and commit to sync across devices
  hike-photos.json    # manifest for repo-committed photos
  photos/             # place your hike photos here, organised by hike ID
  CNAME               # custom domain for GitHub Pages

src/
  data/
    hikes.js          # all 50 hikes with coordinates, metadata, and cover photo URLs
    coverPhotos.js    # Unsplash cover photo mapping (hike ID → URL)
  composables/
    useHikeState.js   # singleton store: completions, ratings, notes, modal state
    usePhotoDB.js     # IndexedDB photo storage + repo photo loader
    useSpeech.js      # Web Speech API composable for Irish name pronunciation
  components/
    MapView.vue       # Leaflet map with markers, tooltips, and filters
    ListView.vue      # sortable / filterable hike list
    HikeModal.vue     # detail panel with tracking inputs and photo gallery
    AttributionView.vue # credits + data export
```

---

## License

MIT — fork freely, adapt for any hiking list, and share your progress.
