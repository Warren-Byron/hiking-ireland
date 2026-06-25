<template>
  <div class="gallery-view">

    <!-- ═══════════════════════════════════════════════
         SCREEN 1 — Hike cards landing
    ════════════════════════════════════════════════ -->
    <template v-if="screen === 'cards'">

      <div class="gallery-toolbar">
        <span class="gallery-count">
          <template v-if="loading">Loading…</template>
          <template v-else-if="allPhotos.length === 0">No photos yet</template>
          <template v-else>{{ allPhotos.length }} photos · {{ hikeCount }} hike{{ hikeCount !== 1 ? 's' : '' }}</template>
        </span>
      </div>

      <div v-if="loading" class="gallery-loading">
        <div class="spinner"></div>
      </div>

      <div v-else-if="allPhotos.length === 0" class="gallery-empty">
        <div class="empty-icon">📸</div>
        <p class="empty-title">No photos yet</p>
        <p class="empty-hint">
          Open any hike and tap <strong>+ Add photos</strong> to upload your shots,<br>
          or commit photos to <code>public/photos/{hikeId}/</code> in the repo.
        </p>
      </div>

      <div v-else class="cards-scroll">
        <div class="cards-grid">

          <!-- All Photos card -->
          <div class="hike-card all-card" @click="openAll">
            <img :src="allCardImage" alt="Ireland Hikes" class="card-img" />
            <div class="card-overlay all-overlay">
              <div class="card-top-row">
                <span class="all-badge">All Hikes</span>
              </div>
              <div class="card-body">
                <h3 class="card-name">Ireland's Top 50</h3>
                <p class="card-meta">{{ allPhotos.length }} photos · {{ hikeCount }} hike{{ hikeCount !== 1 ? 's' : '' }}</p>
              </div>
            </div>
          </div>

          <!-- Per-hike cards -->
          <div
            v-for="g in hikesWithPhotosData"
            :key="g.hike.id"
            class="hike-card"
            @click="openHike(g.hike.id)"
          >
            <img
              :src="g.hike.coverPhoto || fallbackImg"
              :alt="g.hike.name"
              class="card-img"
            />
            <div class="card-overlay">
              <div class="card-top-row">
                <span :class="['diff-badge', g.hike.difficulty]">{{ diffLabel(g.hike.difficulty) }}</span>
                <span class="card-rank">#{{ g.hike.id }}</span>
              </div>
              <div class="card-body">
                <h3 class="card-name">{{ g.hike.name }}</h3>
                <p class="card-meta">
                  <span v-if="g.hike.county">{{ g.hike.county }} · </span>{{ g.photos.length }} photo{{ g.photos.length !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════════
         SCREEN 2 — Photo grid / lightbox
    ════════════════════════════════════════════════ -->
    <template v-else>

      <div class="gallery-toolbar">
        <button class="back-btn" @click="screen = 'cards'">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 3L5.5 8l5 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Back
        </button>

        <span class="toolbar-title">
          {{ selectedHikeId ? hikeMap[selectedHikeId]?.name : 'All Photos' }}
          <span class="toolbar-count">{{ filteredPhotos.length }}</span>
        </span>

        <button class="map-btn" @click="emit('go-to-map')" title="Back to map">
          🗺️ Map
        </button>

        <div v-if="!selectedHikeId" class="view-toggle">
          <button :class="['vt-btn', { active: viewMode === 'grid' }]" @click="viewMode = 'grid'" title="Masonry grid">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="4" rx="1"/>
              <rect x="0" y="9" width="7" height="4" rx="1"/><rect x="9" y="6" width="7" height="7" rx="1"/>
            </svg>
          </button>
          <button :class="['vt-btn', { active: viewMode === 'grouped' }]" @click="viewMode = 'grouped'" title="Grouped by hike">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <rect x="0" y="0" width="16" height="2" rx="1"/><rect x="0" y="5" width="5" height="5" rx="1"/>
              <rect x="6" y="5" width="5" height="5" rx="1"/><rect x="11" y="5" width="5" height="5" rx="1"/>
              <rect x="0" y="12" width="16" height="2" rx="1"/>
            </svg>
          </button>
        </div>
        <div v-else style="width:66px"></div>
      </div>

      <!-- Masonry grid -->
      <div v-if="viewMode === 'grid' || selectedHikeId" class="gallery-scroll">
        <div class="masonry">
          <div
            v-for="(photo, idx) in filteredPhotos"
            :key="photo.id"
            class="masonry-tile"
            @click="openLightbox(filteredPhotos, idx)"
          >
            <img :src="photo.dataUrl" :alt="photo.name" class="masonry-img" loading="lazy" />
            <div class="tile-overlay">
              <span v-if="!selectedHikeId" class="tile-hike">{{ hikeMap[photo.hikeId]?.name }}</span>
              <span v-if="photo.name" class="tile-caption">{{ photo.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Grouped by hike -->
      <div v-else class="gallery-scroll">
        <div v-for="group in allGrouped" :key="group.hike.id" class="hike-group">
          <div class="group-header" @click="openHike(group.hike.id); screen = 'photos'">
            <div class="group-title-block">
              <span class="group-rank">#{{ group.hike.id }}</span>
              <span class="group-name">{{ group.hike.name }}</span>
              <span v-if="group.hike.county" class="group-county">{{ group.hike.county }}</span>
            </div>
            <span class="group-pill">{{ group.photos.length }} photo{{ group.photos.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="group-strip">
            <div
              v-for="(photo, idx) in group.photos"
              :key="photo.id"
              class="strip-tile"
              @click="openLightbox(group.photos, idx)"
            >
              <img :src="photo.dataUrl" :alt="photo.name" class="strip-img" loading="lazy" />
              <div class="tile-overlay">
                <span v-if="photo.name" class="tile-caption">{{ photo.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- ═══════════════════════════════════════════════
         Lightbox (shared)
    ════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="lb">
        <div v-if="lightboxPhoto" class="lightbox" @click.self="closeLightbox">

          <button class="lb-close" @click="closeLightbox" aria-label="Close">×</button>

          <button v-if="lightboxIdx > 0" class="lb-nav lb-prev" @click="stepLightbox(-1)" aria-label="Previous">‹</button>
          <button v-if="lightboxIdx < lightboxPool.length - 1" class="lb-nav lb-next" @click="stepLightbox(1)" aria-label="Next">›</button>

          <div class="lb-stage">
            <Transition name="lb-img" mode="out-in">
              <img :src="lightboxPhoto.dataUrl" :key="lightboxPhoto.id" class="lb-img" />
            </Transition>
          </div>

          <div class="lb-footer">
            <div class="lb-info">
              <button class="lb-hike-btn" @click="jumpToHike(lightboxPhoto.hikeId)">
                {{ hikeMap[lightboxPhoto.hikeId]?.name }}
                <span v-if="hikeMap[lightboxPhoto.hikeId]?.county" class="lb-county"> · {{ hikeMap[lightboxPhoto.hikeId].county }}</span>
                <span class="lb-arrow">→</span>
              </button>
              <span v-if="lightboxPhoto.name" class="lb-caption">{{ lightboxPhoto.name }}</span>
              <div class="lb-meta-row">
                <span v-if="lightboxPhoto.lat != null" class="lb-coords">📍 {{ lightboxPhoto.lat.toFixed(5) }}, {{ lightboxPhoto.lng.toFixed(5) }}</span>
                <span v-if="lightboxPhoto.createdAt" class="lb-date">{{ formatDate(lightboxPhoto.createdAt) }}</span>
              </div>
            </div>
            <span class="lb-counter">{{ lightboxIdx + 1 }} / {{ lightboxPool.length }}</span>
          </div>

        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { usePhotoDB } from '../composables/usePhotoDB.js'
import { useHikeState } from '../composables/useHikeState.js'
import { DIFFICULTY_LABEL } from '../data/hikes.js'

const emit = defineEmits(['go-to-map'])

const { getAllPhotos } = usePhotoDB()
const { hikes, selectHike } = useHikeState()

const allPhotos      = ref([])
const loading        = ref(true)
const screen         = ref('cards')     // 'cards' | 'photos'
const selectedHikeId = ref(null)        // null = all
const viewMode       = ref('grid')

const lightboxPool = ref([])
const lightboxIdx  = ref(null)
const lightboxFromMap = ref(false)

const hikeMap = computed(() => {
  const m = {}
  hikes.value.forEach(h => { m[h.id] = h })
  return m
})

// Hike 14 = Carrauntoohil, highest peak in Ireland — used for the All card
const allCardImage = computed(() =>
  hikes.value.find(h => h.id === 14)?.coverPhoto ?? fallbackImg
)
const fallbackImg = 'https://images.unsplash.com/photo-1598124080581-420a180d9884?auto=format&fit=crop&w=800&q=80'

const hikeCount = computed(() => new Set(allPhotos.value.map(p => p.hikeId)).size)

const hikesWithPhotosData = computed(() => {
  const ids = new Set(allPhotos.value.map(p => p.hikeId))
  return hikes.value
    .filter(h => ids.has(h.id))
    .map(hike => ({ hike, photos: allPhotos.value.filter(p => p.hikeId === hike.id) }))
})

const filteredPhotos = computed(() =>
  selectedHikeId.value === null
    ? allPhotos.value
    : allPhotos.value.filter(p => p.hikeId === selectedHikeId.value)
)

const allGrouped = computed(() =>
  hikesWithPhotosData.value
)

const lightboxPhoto = computed(() =>
  lightboxIdx.value !== null ? lightboxPool.value[lightboxIdx.value] ?? null : null
)

function openAll() {
  selectedHikeId.value = null
  viewMode.value = 'grid'
  screen.value = 'photos'
}

function openHike(id) {
  selectedHikeId.value = id
  screen.value = 'photos'
  viewMode.value = 'grid'
}

async function openPhoto(hikeId, photoId) {
  selectedHikeId.value = hikeId
  screen.value = 'photos'
  viewMode.value = 'grid'
  await nextTick()
  const pool = filteredPhotos.value
  const idx  = pool.findIndex(p => p.id === photoId)
  if (idx >= 0) {
    openLightbox(pool, idx)
    lightboxFromMap.value = true
  }
}

function openLightbox(pool, idx) {
  lightboxPool.value = pool
  lightboxIdx.value  = idx
  lightboxFromMap.value = false
}

function closeLightbox() {
  lightboxIdx.value = null
  if (lightboxFromMap.value) {
    lightboxFromMap.value = false
    emit('go-to-map')
  }
}

function stepLightbox(dir) {
  const next = lightboxIdx.value + dir
  if (next >= 0 && next < lightboxPool.value.length) lightboxIdx.value = next
}

function jumpToHike(hikeId) {
  closeLightbox()
  selectHike(hikeId)
}

function diffLabel(d) { return DIFFICULTY_LABEL[d] ?? d }

function formatDate(str) {
  if (!str) return ''
  try { return new Date(str).toLocaleDateString('en-IE', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return str }
}

function onKeydown(e) {
  if (lightboxIdx.value === null) return
  if (e.key === 'Escape')     closeLightbox()
  if (e.key === 'ArrowLeft')  stepLightbox(-1)
  if (e.key === 'ArrowRight') stepLightbox(1)
}

async function refresh() {
  allPhotos.value = await getAllPhotos()
}

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  await refresh()
  loading.value = false
})

onUnmounted(() => document.removeEventListener('keydown', onKeydown))

defineExpose({ refresh, openHike, openPhoto })
</script>

<style scoped>
.gallery-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ── Toolbar ── */
.gallery-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  flex-shrink: 0;
  gap: 12px;
  min-height: 49px;
}

.gallery-count {
  font-size: 13px;
  color: var(--text-muted);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  padding: 5px 12px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.back-btn:hover { background: var(--surface-raised); color: var(--text); }

.toolbar-title {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-count {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.map-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 11px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.map-btn:hover { background: var(--surface-raised); color: var(--text); }

.view-toggle {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.vt-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  background: var(--surface);
  color: var(--text-muted);
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.vt-btn + .vt-btn { border-left: 1px solid var(--border); }
.vt-btn:hover { background: var(--surface-raised); color: var(--text); }
.vt-btn.active { background: var(--green-600); color: white; }

/* ── Loading / empty ── */
.gallery-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--green-600);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.gallery-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-muted);
}
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-title { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.empty-hint { font-size: 14px; line-height: 1.6; }
.empty-hint code { background: var(--surface-raised); padding: 1px 5px; border-radius: 4px; font-size: 12px; }

/* ── Cards landing ── */
.cards-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.hike-card {
  position: relative;
  aspect-ratio: 3 / 2;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  background: var(--surface-raised);
  box-shadow: 0 2px 12px rgba(0,0,0,0.10);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.hike-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 8px 28px rgba(0,0,0,0.18);
}

.all-card {
  grid-column: span 2;
  aspect-ratio: 16 / 7;
}
@media (max-width: 560px) {
  .all-card { grid-column: span 1; aspect-ratio: 3 / 2; }
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.hike-card:hover .card-img { transform: scale(1.06); }

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 14px;
}

.all-overlay {
  background: linear-gradient(160deg, rgba(22,101,52,0.55) 0%, rgba(0,0,0,0.78) 100%);
}

.card-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.all-badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 3px 9px;
  border-radius: 99px;
  backdrop-filter: blur(4px);
}

.diff-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
  white-space: nowrap;
}
.diff-badge.easy             { background: rgba(22,163,74,.85);  color: white; }
.diff-badge.easy-to-moderate { background: rgba(101,163,13,.85); color: white; }
.diff-badge.moderate         { background: rgba(217,119,6,.85);  color: white; }
.diff-badge.moderate-to-hard { background: rgba(234,88,12,.85);  color: white; }
.diff-badge.hard             { background: rgba(220,38,38,.85);  color: white; }
.diff-badge.very-hard        { background: rgba(124,58,237,.85); color: white; }

.card-rank {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.65);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.card-name {
  font-size: 15px;
  font-weight: 800;
  color: white;
  line-height: 1.2;
  text-shadow: 0 1px 4px rgba(0,0,0,0.4);
  margin: 0;
}
.all-card .card-name { font-size: 20px; }

.card-meta {
  font-size: 11px;
  color: rgba(255,255,255,0.72);
  font-weight: 500;
}

/* ── Photo grid (screen 2) ── */
.gallery-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 24px;
}

.masonry {
  columns: 4;
  column-gap: 10px;
}
@media (max-width: 1200px) { .masonry { columns: 3; } }
@media (max-width: 800px)  { .masonry { columns: 2; } }

.masonry-tile {
  break-inside: avoid;
  margin-bottom: 10px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: var(--surface);
}
.masonry-img {
  width: 100%;
  display: block;
  transition: transform 0.3s ease;
}
.masonry-tile:hover .masonry-img { transform: scale(1.03); }

/* ── Grouped strips ── */
.hike-group { margin-bottom: 28px; }

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 2px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
  cursor: pointer;
}
.group-header:hover .group-name { color: var(--green-600); }
.group-title-block { display: flex; align-items: center; gap: 8px; }
.group-rank {
  font-size: 11px; font-weight: 700; color: var(--text-muted);
  background: var(--surface-raised); padding: 2px 7px; border-radius: 99px;
}
.group-name { font-size: 15px; font-weight: 700; color: var(--text); transition: color 0.15s; }
.group-county { font-size: 12px; color: var(--text-muted); }
.group-pill { font-size: 12px; color: var(--text-muted); white-space: nowrap; }

.group-strip { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.group-strip::-webkit-scrollbar { height: 4px; }
.group-strip::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }

.strip-tile {
  flex-shrink: 0;
  width: 180px; height: 130px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: var(--surface);
}
.strip-img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  transition: transform 0.3s ease;
}
.strip-tile:hover .strip-img { transform: scale(1.05); }

/* ── Tile overlay ── */
.tile-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%);
  padding: 20px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  opacity: 0;
  transition: opacity 0.2s;
}
.masonry-tile:hover .tile-overlay,
.strip-tile:hover .tile-overlay { opacity: 1; }
.tile-hike { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.9); line-height: 1.2; }
.tile-caption { font-size: 10px; color: rgba(255,255,255,0.7); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── Lightbox ── */
.lightbox {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.92);
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.lb-close {
  position: absolute; top: 16px; right: 20px;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  color: white; width: 40px; height: 40px; border-radius: 50%;
  font-size: 24px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s; z-index: 1;
}
.lb-close:hover { background: rgba(255,255,255,0.2); }
.lb-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  color: white; width: 48px; height: 48px; border-radius: 50%;
  font-size: 28px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s; z-index: 1;
}
.lb-nav:hover { background: rgba(255,255,255,0.22); }
.lb-prev { left: 20px; }
.lb-next { right: 20px; }
.lb-stage {
  flex: 1; display: flex; align-items: center; justify-content: center;
  width: 100%; padding: 60px 80px 0; min-height: 0;
}
.lb-img {
  max-width: 100%; max-height: 100%; object-fit: contain;
  border-radius: 6px; box-shadow: 0 8px 40px rgba(0,0,0,0.5);
}
.lb-footer {
  width: 100%; display: flex; align-items: flex-start;
  justify-content: space-between; padding: 14px 80px 20px; flex-shrink: 0;
}
.lb-info { display: flex; flex-direction: column; gap: 3px; }
.lb-hike-btn {
  background: none; border: none; color: rgba(255,255,255,0.9);
  font-size: 15px; font-weight: 700; cursor: pointer; padding: 0;
  text-align: left; transition: color 0.15s;
}
.lb-hike-btn:hover { color: #74c69d; }
.lb-county { font-weight: 400; color: rgba(255,255,255,0.6); }
.lb-arrow { margin-left: 4px; font-size: 13px; }
.lb-caption { font-size: 13px; color: rgba(255,255,255,0.65); }
.lb-meta-row { display: flex; gap: 14px; }
.lb-coords, .lb-date { font-size: 11px; color: rgba(255,255,255,0.45); }
.lb-counter { font-size: 13px; color: rgba(255,255,255,0.5); white-space: nowrap; align-self: flex-end; }

/* ── Transitions ── */
.lb-enter-active, .lb-leave-active { transition: opacity 0.2s; }
.lb-enter-from, .lb-leave-to { opacity: 0; }
.lb-img-enter-active, .lb-img-leave-active { transition: opacity 0.12s; }
.lb-img-enter-from, .lb-img-leave-to { opacity: 0; }
</style>
