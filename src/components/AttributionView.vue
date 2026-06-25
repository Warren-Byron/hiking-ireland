<template>
  <div class="attr-view">
    <div class="attr-content">

      <div class="attr-hero">
        <span class="attr-hero-icon">⛰️</span>
        <h1 class="attr-hero-title">Ireland Hikes</h1>
        <p class="attr-hero-sub">A personal tracker for the top 50 hikes in Ireland</p>
      </div>

      <!-- Save your data -->
      <section class="attr-section">
        <h2 class="attr-section-title">Save Your Progress</h2>
        <p class="attr-section-note">
          Ratings, notes, and completion dates are saved in your browser. To back them up permanently — or sync to another device — copy the JSON below and commit it to the repo as <code class="inline-code">public/personal.json</code>.
        </p>
        <div class="attr-card export-card">
          <div class="export-header">
            <span class="export-label">personal.json</span>
            <div class="export-actions">
              <button class="export-btn" @click="copyJson">
                {{ copied ? '✓ Copied!' : '📋 Copy' }}
              </button>
              <button class="export-btn" @click="downloadJson">⬇ Download</button>
            </div>
          </div>
          <pre class="export-pre"><code>{{ jsonPreview }}</code></pre>
        </div>

        <div class="attr-card" style="margin-top: 10px;">
          <div class="attr-item">
            <div class="attr-item-icon" style="background:#f0fdf4">📷</div>
            <div class="attr-item-body">
              <div class="attr-item-name">Adding photos via the repo</div>
              <div class="attr-item-desc">
                Drag photos into <code class="inline-code">public/photos/{hikeId}/</code> via the GitHub web UI, commit, then add an entry to <code class="inline-code">public/hike-photos.json</code>. They appear on the map and in the hike modal automatically.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Hiking source -->
      <section class="attr-section">
        <h2 class="attr-section-title">Hiking Data Source</h2>
        <div class="attr-card">
          <div class="attr-item">
            <div class="attr-item-icon book-icon">📖</div>
            <div class="attr-item-body">
              <div class="attr-item-name">The Hike Life</div>
              <div class="attr-item-desc">All hike routes, distances, elevations, difficulty ratings, pit stops, and OSi map references are sourced from <em>The Hike Life</em> — a comprehensive guide to Ireland's top 50 mountain and coastal walks.</div>
              <a href="https://www.instagram.com/thehikelife/" target="_blank" rel="noopener" class="attr-link">thehikelife.ie</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Open source software -->
      <section class="attr-section">
        <h2 class="attr-section-title">Open Source Software</h2>
        <div class="attr-card">
          <div v-for="lib in libraries" :key="lib.name" class="attr-item">
            <div class="attr-item-icon" :style="{ background: lib.color }">{{ lib.icon }}</div>
            <div class="attr-item-body">
              <div class="attr-item-name">
                {{ lib.name }}
                <span class="attr-version">{{ lib.version }}</span>
                <span class="attr-license">{{ lib.license }}</span>
              </div>
              <div class="attr-item-desc">{{ lib.desc }}</div>
              <a :href="lib.url" target="_blank" rel="noopener" class="attr-link">{{ lib.url.replace('https://', '') }}</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Map data -->
      <section class="attr-section">
        <h2 class="attr-section-title">Map Data</h2>
        <div class="attr-card">
          <div class="attr-item">
            <div class="attr-item-icon" style="background: #7ecefd; color: #1a3a5c;">🗺️</div>
            <div class="attr-item-body">
              <div class="attr-item-name">OpenStreetMap <span class="attr-license">ODbL</span></div>
              <div class="attr-item-desc">Map tiles and geographic data © OpenStreetMap contributors, available under the Open Database Licence.</div>
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" class="attr-link">openstreetmap.org/copyright</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Photography -->
      <section class="attr-section">
        <h2 class="attr-section-title">Cover Photography</h2>
        <p class="attr-section-note">All cover photos are sourced from <a href="https://unsplash.com" target="_blank" rel="noopener" class="attr-link">Unsplash</a> and used under the <a href="https://unsplash.com/license" target="_blank" rel="noopener" class="attr-link">Unsplash License</a> (free to use, no attribution required — we credit anyway).</p>
        <div class="attr-card photo-grid">
          <div v-for="credit in photoCredits" :key="credit.photographer" class="photo-credit-item">
            <img :src="credit.sampleUrl" class="photo-credit-thumb" :alt="credit.photographer" />
            <div class="photo-credit-body">
              <div class="photo-credit-name">{{ credit.photographer }}</div>
              <div class="photo-credit-hikes">{{ credit.hikes.join(', ') }}</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useHikeState } from '../composables/useHikeState.js'

const { exportPersonalJson } = useHikeState()

const copied     = ref(false)
const jsonPreview = computed(() => exportPersonalJson())

async function copyJson() {
  await navigator.clipboard.writeText(jsonPreview.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function downloadJson() {
  const blob = new Blob([jsonPreview.value], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'personal.json'; a.click()
  URL.revokeObjectURL(url)
}

const libraries = [
  {
    name: 'Vue.js',
    version: 'v3.4',
    license: 'MIT',
    icon: '💚',
    color: '#42b883',
    desc: 'The progressive JavaScript framework powering the entire UI — reactivity, components, and routing.',
    url: 'https://vuejs.org',
  },
  {
    name: 'Vite',
    version: 'v5',
    license: 'MIT',
    icon: '⚡',
    color: '#646cff',
    desc: 'Next-generation front-end build tool. Instant dev server with HMR and optimised production builds.',
    url: 'https://vitejs.dev',
  },
  {
    name: 'Leaflet',
    version: 'v1.9',
    license: 'BSD-2',
    icon: '🍃',
    color: '#3d9970',
    desc: 'Mobile-friendly interactive map library. Used for the Ireland map, hike markers, and photo pins.',
    url: 'https://leafletjs.com',
  },
  {
    name: 'exifr',
    version: 'v7',
    license: 'MIT',
    icon: '📸',
    color: '#e07b39',
    desc: 'Fast EXIF metadata parser for extracting GPS coordinates from uploaded trail photos.',
    url: 'https://mutiny.cz/exifr',
  },
]

const photoCredits = [
  {
    photographer: 'K. Mitch Hodge',
    sampleUrl: 'https://images.unsplash.com/photo-1620292770170-e770ff2cda9f?auto=format&fit=crop&w=120&q=70',
    hikes: ['Carrauntoohil', 'Binevenagh', 'Glenariff Forest', 'Cavehill Loop', 'Slieve Donard', 'Slieve Bearnagh', 'Slieve Doan', 'Slieve Binnian'],
  },
  {
    photographer: 'Rizby Mazumder',
    sampleUrl: 'https://images.unsplash.com/photo-1557920078-0b19fe969a72?auto=format&fit=crop&w=120&q=70',
    hikes: ['Benwee Head Cliff Walk', 'Nephin'],
  },
  {
    photographer: 'Francesca Fabian',
    sampleUrl: 'https://images.unsplash.com/photo-1757858939882-240d245632ab?auto=format&fit=crop&w=120&q=70',
    hikes: ['Maulin Mountain Loop', 'Blackstairs Mountain'],
  },
  {
    photographer: 'Sibeesh Venu',
    sampleUrl: 'https://images.unsplash.com/photo-1622391043793-2145ad80bd68?auto=format&fit=crop&w=120&q=70',
    hikes: ['Benbulbin Forest Walk', "Queen Maeve's Trail"],
  },
  {
    photographer: 'Elisabeth Arnold',
    sampleUrl: 'https://images.unsplash.com/photo-1571243827682-305f9c83051b?auto=format&fit=crop&w=120&q=70',
    hikes: ['Coumshingaun Loop', 'Cuilcagh'],
  },
  {
    photographer: 'Xavier von Erlach',
    sampleUrl: 'https://images.unsplash.com/photo-1693342563508-75ff43f43198?auto=format&fit=crop&w=120&q=70',
    hikes: ['Croaghaun'],
  },
  {
    photographer: 'Aldo De La Paz',
    sampleUrl: 'https://images.unsplash.com/photo-1509384658642-3f88b1291b3d?auto=format&fit=crop&w=120&q=70',
    hikes: ['Croagh Patrick'],
  },
  {
    photographer: 'Lou Goetzmann',
    sampleUrl: 'https://images.unsplash.com/photo-1509477317859-ce3f0c2ae7bb?auto=format&fit=crop&w=120&q=70',
    hikes: ['Mweelrea'],
  },
  {
    photographer: 'Nils Nedel',
    sampleUrl: 'https://images.unsplash.com/photo-1511219096939-ce77f5f44cc8?auto=format&fit=crop&w=120&q=70',
    hikes: ['Ben Creggan'],
  },
  {
    photographer: 'Sean Kuriyan',
    sampleUrl: 'https://images.unsplash.com/photo-1598124080581-420a180d9884?auto=format&fit=crop&w=120&q=70',
    hikes: ['Diamond Hill'],
  },
  {
    photographer: 'Kevin Bosc',
    sampleUrl: 'https://images.unsplash.com/photo-1564474909926-25216918aade?auto=format&fit=crop&w=120&q=70',
    hikes: ['Binn idir an dá Log'],
  },
  {
    photographer: 'Dannii Coughlan',
    sampleUrl: 'https://images.unsplash.com/photo-1616862982082-75fe14ea445c?auto=format&fit=crop&w=120&q=70',
    hikes: ['Errisbeg'],
  },
  {
    photographer: 'Dennis TM',
    sampleUrl: 'https://images.unsplash.com/photo-1710243456240-b39e7e3d3cfa?auto=format&fit=crop&w=120&q=70',
    hikes: ['Howth Cliff Walk'],
  },
  {
    photographer: 'jake stahl',
    sampleUrl: 'https://images.unsplash.com/photo-1571937146297-4a1aee898c60?auto=format&fit=crop&w=120&q=70',
    hikes: ['Lough Bray Loop'],
  },
  {
    photographer: 'Ving N',
    sampleUrl: 'https://images.unsplash.com/photo-1564657619769-5089a5877f1a?auto=format&fit=crop&w=120&q=70',
    hikes: ['Fairy Castle Loop, Ticknock'],
  },
  {
    photographer: 'Majestic Lukas',
    sampleUrl: 'https://images.unsplash.com/photo-1606646677475-fac8e6e4a98b?auto=format&fit=crop&w=120&q=70',
    hikes: ['Djouce via Ballinastoe Woods'],
  },
  {
    photographer: 'Max Krampe',
    sampleUrl: 'https://images.unsplash.com/photo-1653897684835-39a46b694c97?auto=format&fit=crop&w=120&q=70',
    hikes: ['Great and Little Sugarloaf'],
  },
  {
    photographer: 'Jean Vella',
    sampleUrl: 'https://images.unsplash.com/photo-1695051452554-b261ec028c97?auto=format&fit=crop&w=120&q=70',
    hikes: ['Tonelagee and Lough Ouler'],
  },
  {
    photographer: 'Hamed Alayoub',
    sampleUrl: 'https://images.unsplash.com/photo-1571609227120-1ec3adc4249a?auto=format&fit=crop&w=120&q=70',
    hikes: ['Glendalough Spinc & Glenealo Valley'],
  },
  {
    photographer: 'Elliot Voilmy',
    sampleUrl: 'https://images.unsplash.com/photo-1699450938809-71b9297e6db8?auto=format&fit=crop&w=120&q=70',
    hikes: ['Lugnaquilla'],
  },
  {
    photographer: 'Paul Imanuelsen',
    sampleUrl: 'https://images.unsplash.com/photo-1623257431770-022cf1387112?auto=format&fit=crop&w=120&q=70',
    hikes: ['Slieve Bloom'],
  },
  {
    photographer: 'Rebecca Williams',
    sampleUrl: 'https://images.unsplash.com/photo-1710092297909-84a6e9887aaf?auto=format&fit=crop&w=120&q=70',
    hikes: ['Slieve Foye'],
  },
  {
    photographer: 'Jesse Gardner',
    sampleUrl: 'https://images.unsplash.com/photo-1563998758806-365b5c9fe421?auto=format&fit=crop&w=120&q=70',
    hikes: ['Galtymore'],
  },
  {
    photographer: 'Valerie',
    sampleUrl: 'https://images.unsplash.com/photo-1697649943968-fc89fa607ebf?auto=format&fit=crop&w=120&q=70',
    hikes: ['Knockmealdown Mountain'],
  },
  {
    photographer: 'Brian Kelly',
    sampleUrl: 'https://images.unsplash.com/photo-1689006818153-e38f20cd5517?auto=format&fit=crop&w=120&q=70',
    hikes: ['Slievenamon'],
  },
  {
    photographer: 'Howard Walsh',
    sampleUrl: 'https://images.unsplash.com/photo-1776103094702-a122c4bef06c?auto=format&fit=crop&w=120&q=70',
    hikes: ['Dunmore East Cliff Walk'],
  },
  {
    photographer: 'Ulrike R. Donohue',
    sampleUrl: 'https://images.unsplash.com/photo-1702563033818-f92f0295ec80?auto=format&fit=crop&w=120&q=70',
    hikes: ['Mullaghmore Loop, the Burren'],
  },
  {
    photographer: 'Saad Chaudhry',
    sampleUrl: 'https://images.unsplash.com/photo-1570875450638-044bca38ec92?auto=format&fit=crop&w=120&q=70',
    hikes: ['Cliffs of Moher Coastal Trail'],
  },
  {
    photographer: 'Olivier Guillard',
    sampleUrl: 'https://images.unsplash.com/photo-1523013087624-4561c896e9db?auto=format&fit=crop&w=120&q=70',
    hikes: ['Mount Brandon'],
  },
  {
    photographer: 'Mark de Jong',
    sampleUrl: 'https://images.unsplash.com/photo-1601805824284-7f191dea8837?auto=format&fit=crop&w=120&q=70',
    hikes: ['Mount Eagle'],
  },
  {
    photographer: 'Tommy Bond',
    sampleUrl: 'https://images.unsplash.com/photo-1659983007421-5bdc0dd0a051?auto=format&fit=crop&w=120&q=70',
    hikes: ['Torc Waterfall and Mountain'],
  },
  {
    photographer: 'Tina Kuper',
    sampleUrl: 'https://images.unsplash.com/photo-1576659194010-4523961ba127?auto=format&fit=crop&w=120&q=70',
    hikes: ['Mangerton Mountain Loop'],
  },
  {
    photographer: 'Jamie O\'Sullivan',
    sampleUrl: 'https://images.unsplash.com/photo-1695941040290-c06d5b805d46?auto=format&fit=crop&w=120&q=70',
    hikes: ['Gougane Barra'],
  },
  {
    photographer: 'mana5280',
    sampleUrl: 'https://images.unsplash.com/photo-1766885330514-358d40f71cbb?auto=format&fit=crop&w=120&q=70',
    hikes: ["Sheep's Head Lighthouse Loop"],
  },
  {
    photographer: 'Elle Leontiev',
    sampleUrl: 'https://images.unsplash.com/photo-1628246935293-e68479e46589?auto=format&fit=crop&w=120&q=70',
    hikes: ['Slieve League'],
  },
  {
    photographer: 'Clay Banks',
    sampleUrl: 'https://images.unsplash.com/photo-1712431777300-f7d37c0a4d82?auto=format&fit=crop&w=120&q=70',
    hikes: ['An Port to Sturrall'],
  },
  {
    photographer: 'Phil Aicken',
    sampleUrl: 'https://images.unsplash.com/photo-1577972788144-3ee107c23f62?auto=format&fit=crop&w=120&q=70',
    hikes: ['Errigal'],
  },
  {
    photographer: 'Ben Allan',
    sampleUrl: 'https://images.unsplash.com/photo-1591635876512-8b8ba8d4d6c3?auto=format&fit=crop&w=120&q=70',
    hikes: ['Muckish'],
  },
  {
    photographer: 'Tianqi Yang',
    sampleUrl: 'https://images.unsplash.com/photo-1776439676493-b8c4aac3b25d?auto=format&fit=crop&w=120&q=70',
    hikes: ["Dunseverick to Giant's Causeway"],
  },
]
</script>

<style scoped>
.attr-view {
  height: 100%;
  overflow-y: auto;
  background: var(--bg);
}

.attr-content {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 24px 60px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* Hero */
.attr-hero {
  text-align: center;
  padding: 32px 0 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.inline-code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  background: var(--surface-raised);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--text-secondary);
}

.export-card { overflow: hidden; }

.export-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--surface-raised);
  border-bottom: 1px solid var(--border);
}

.export-label {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

.export-actions { display: flex; gap: 8px; }

.export-btn {
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.export-btn:hover { background: var(--green-600); color: white; border-color: var(--green-600); }

.export-pre {
  margin: 0;
  padding: 14px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-secondary);
  background: var(--bg);
  overflow-x: auto;
  max-height: 260px;
  overflow-y: auto;
}

.attr-hero-icon { font-size: 48px; }
.attr-hero-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
  margin: 0;
}
.attr-hero-sub {
  font-size: 15px;
  color: var(--text-muted);
  margin: 0;
}

/* Sections */
.attr-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attr-section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}

.attr-section-note {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Card */
.attr-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

/* Item row */
.attr-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
}
.attr-item + .attr-item {
  border-top: 1px solid var(--border);
}

.attr-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  background: var(--surface-raised);
}

.book-icon { background: rgba(217,119,6,.12); }

.attr-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attr-item-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.attr-version {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-raised);
  padding: 1px 6px;
  border-radius: 99px;
}

.attr-license {
  font-size: 10px;
  font-weight: 700;
  color: var(--green-600);
  background: rgba(var(--green-rgb), 0.1);
  padding: 1px 7px;
  border-radius: 99px;
  letter-spacing: 0.03em;
}

.attr-item-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.55;
}

.attr-link {
  font-size: 12px;
  color: var(--green-600);
  text-decoration: none;
  font-weight: 500;
}
.attr-link:hover { text-decoration: underline; }

/* Photo credits grid */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0;
}

.photo-credit-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
}
.photo-credit-item:nth-child(odd):last-child {
  grid-column: span 2;
}

.photo-credit-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--surface-raised);
}

.photo-credit-body {
  flex: 1;
  min-width: 0;
}

.photo-credit-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.photo-credit-hikes {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 2px;
}
</style>
