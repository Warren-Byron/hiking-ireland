<template>
  <div class="gallery-view">

    <!-- Toolbar -->
    <div class="gallery-toolbar">
      <span class="gallery-count">
        <template v-if="loading">Loading…</template>
        <template v-else-if="allPhotos.length === 0">No photos yet</template>
        <template v-else>
          {{ filteredPhotos.length }} photo{{ filteredPhotos.length !== 1 ? 's' : '' }}
          <template v-if="filterHike === 'all'"> · {{ hikeCount }} hike{{ hikeCount !== 1 ? 's' : '' }}</template>
        </template>
      </span>

      <div class="toolbar-right">
        <select v-model="filterHike" class="hike-select" :disabled="loading || allPhotos.length === 0">
          <option value="all">All hikes</option>
          <option v-for="h in hikesWithPhotos" :key="h.id" :value="String(h.id)">
            #{{ h.id }} {{ h.name }}
          </option>
        </select>

        <div class="view-toggle">
          <button :class="['vt-btn', { active: viewMode === 'grid' }]" @click="viewMode = 'grid'" title="Masonry grid">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="4" rx="1"/>
              <rect x="0" y="9" width="7" height="4" rx="1"/><rect x="9" y="6" width="7" height="7" rx="1"/>
            </svg>
          </button>
          <button :class="['vt-btn', { active: viewMode === 'grouped' }]" @click="viewMode = 'grouped'" title="Grouped by hike">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="0" y="0" width="16" height="2" rx="1"/><rect x="0" y="5" width="5" height="5" rx="1"/>
              <rect x="6" y="5" width="5" height="5" rx="1"/><rect x="11" y="5" width="5" height="5" rx="1"/>
              <rect x="0" y="12" width="16" height="2" rx="1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="gallery-loading">
      <div class="spinner"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="allPhotos.length === 0" class="gallery-empty">
      <div class="empty-icon">📸</div>
      <p class="empty-title">No photos yet</p>
      <p class="empty-hint">
        Open any hike and tap <strong>+ Add photos</strong> to upload your shots,<br>
        or commit photos to <code>public/photos/{hikeId}/</code> in the repo.
      </p>
    </div>

    <!-- Masonry grid -->
    <div v-else-if="viewMode === 'grid'" class="gallery-scroll">
      <div v-if="filteredPhotos.length === 0" class="gallery-empty">
        <p class="empty-hint">No photos for this hike.</p>
      </div>
      <div v-else class="masonry">
        <div
          v-for="(photo, idx) in filteredPhotos"
          :key="photo.id"
          class="masonry-tile"
          @click="openLightbox(filteredPhotos, idx)"
        >
          <img :src="photo.dataUrl" :alt="photo.name" class="masonry-img" loading="lazy" />
          <div class="tile-overlay">
            <span class="tile-hike">{{ hikeMap[photo.hikeId]?.name }}</span>
            <span v-if="photo.name" class="tile-caption">{{ photo.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Grouped view -->
    <div v-else class="gallery-scroll">
      <div v-if="filteredGrouped.length === 0" class="gallery-empty">
        <p class="empty-hint">No photos for this hike.</p>
      </div>
      <template v-else>
        <div v-for="group in filteredGrouped" :key="group.hike.id" class="hike-group">
          <div class="group-header" @click="jumpToHike(group.hike.id)">
            <div class="group-title-block">
              <span class="group-rank">#{{ group.hike.id }}</span>
              <span class="group-name">{{ group.hike.name }}</span>
              <span v-if="group.hike.county" class="group-county">{{ group.hike.county }}</span>
            </div>
            <span class="group-pill">{{ group.photos.length }} photo{{ group.photos.length !== 1 ? 's' : '' }} →</span>
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
      </template>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="lb">
        <div v-if="lightboxPhoto" class="lightbox" @click.self="closeLightbox">

          <button class="lb-close" @click="closeLightbox" aria-label="Close">×</button>

          <button
            v-if="lightboxIdx > 0"
            class="lb-nav lb-prev"
            @click="stepLightbox(-1)"
            aria-label="Previous photo"
          >‹</button>

          <button
            v-if="lightboxIdx < lightboxPool.length - 1"
            class="lb-nav lb-next"
            @click="stepLightbox(1)"
            aria-label="Next photo"
          >›</button>

          <div class="lb-stage">
            <Transition name="lb-img" mode="out-in">
              <img :src="lightboxPhoto.dataUrl" :key="lightboxPhoto.id" class="lb-img" />
            </Transition>
          </div>

          <div class="lb-footer">
            <div class="lb-info">
              <button class="lb-hike-btn" @click="jumpToHike(lightboxPhoto.hikeId)">
                {{ hikeMap[lightboxPhoto.hikeId]?.name }}
                <span class="lb-county" v-if="hikeMap[lightboxPhoto.hikeId]?.county">
                  · {{ hikeMap[lightboxPhoto.hikeId].county }}
                </span>
                <span class="lb-arrow">→</span>
              </button>
              <span v-if="lightboxPhoto.name" class="lb-caption">{{ lightboxPhoto.name }}</span>
              <div class="lb-meta-row">
                <span v-if="lightboxPhoto.lat != null" class="lb-coords">
                  📍 {{ lightboxPhoto.lat.toFixed(5) }}, {{ lightboxPhoto.lng.toFixed(5) }}
                </span>
                <span v-if="lightboxPhoto.createdAt" class="lb-date">
                  {{ formatDate(lightboxPhoto.createdAt) }}
                </span>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePhotoDB } from '../composables/usePhotoDB.js'
import { useHikeState } from '../composables/useHikeState.js'

const { getAllPhotos } = usePhotoDB()
const { hikes, selectHike } = useHikeState()

const allPhotos  = ref([])
const loading    = ref(true)
const filterHike = ref('all')
const viewMode   = ref('grid')

const lightboxPool = ref([])
const lightboxIdx  = ref(null)

const hikeMap = computed(() => {
  const m = {}
  hikes.value.forEach(h => { m[h.id] = h })
  return m
})

const filteredPhotos = computed(() => {
  if (filterHike.value === 'all') return allPhotos.value
  return allPhotos.value.filter(p => String(p.hikeId) === filterHike.value)
})

const hikesWithPhotos = computed(() => {
  const ids = new Set(allPhotos.value.map(p => p.hikeId))
  return hikes.value.filter(h => ids.has(h.id))
})

const hikeCount = computed(() => new Set(allPhotos.value.map(p => p.hikeId)).size)

const filteredGrouped = computed(() =>
  hikesWithPhotos.value
    .filter(h => filterHike.value === 'all' || String(h.id) === filterHike.value)
    .map(hike => ({ hike, photos: allPhotos.value.filter(p => p.hikeId === hike.id) }))
    .filter(g => g.photos.length > 0)
)

const lightboxPhoto = computed(() =>
  lightboxIdx.value !== null ? lightboxPool.value[lightboxIdx.value] ?? null : null
)

function openLightbox(pool, idx) {
  lightboxPool.value = pool
  lightboxIdx.value  = idx
}

function closeLightbox() { lightboxIdx.value = null }

function stepLightbox(dir) {
  const next = lightboxIdx.value + dir
  if (next >= 0 && next < lightboxPool.value.length) lightboxIdx.value = next
}

function jumpToHike(hikeId) {
  closeLightbox()
  selectHike(hikeId)
}

function formatDate(str) {
  if (!str) return ''
  try { return new Date(str).toLocaleDateString('en-IE', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return str }
}

function onKeydown(e) {
  if (lightboxIdx.value === null) return
  if (e.key === 'Escape')      closeLightbox()
  if (e.key === 'ArrowLeft')   stepLightbox(-1)
  if (e.key === 'ArrowRight')  stepLightbox(1)
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

defineExpose({ refresh })
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
}

.gallery-count {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hike-select {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  max-width: 200px;
}
.hike-select:focus { outline: none; border-color: var(--green-500); }

.view-toggle {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
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

/* ── States ── */
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

/* ── Scrollable content ── */
.gallery-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 24px;
}

/* ── Masonry grid ── */
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

/* ── Grouped view ── */
.hike-group { margin-bottom: 28px; }

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 2px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
  cursor: pointer;
  user-select: none;
}
.group-header:hover .group-name { color: var(--green-600); }

.group-title-block { display: flex; align-items: center; gap: 8px; }

.group-rank {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--surface-raised);
  padding: 2px 7px;
  border-radius: 99px;
}
.group-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  transition: color 0.15s;
}
.group-county {
  font-size: 12px;
  color: var(--text-muted);
}
.group-pill {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.group-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.group-strip::-webkit-scrollbar { height: 4px; }
.group-strip::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }

.strip-tile {
  flex-shrink: 0;
  width: 180px;
  height: 130px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: var(--surface);
}

.strip-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
.strip-tile:hover .strip-img { transform: scale(1.05); }

/* ── Shared tile overlay ── */
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

.tile-hike {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  line-height: 1.2;
}
.tile-caption {
  font-size: 10px;
  color: rgba(255,255,255,0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Lightbox ── */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.92);
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.lb-close {
  position: absolute;
  top: 16px; right: 20px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  width: 40px; height: 40px;
  border-radius: 50%;
  font-size: 24px; line-height: 1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
  z-index: 1;
}
.lb-close:hover { background: rgba(255,255,255,0.2); }

.lb-nav {
  position: absolute;
  top: 50%; transform: translateY(-50%);
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  width: 48px; height: 48px;
  border-radius: 50%;
  font-size: 28px; line-height: 1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
  z-index: 1;
}
.lb-nav:hover { background: rgba(255,255,255,0.22); }
.lb-prev { left: 20px; }
.lb-next { right: 20px; }

.lb-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 60px 80px 0;
  min-height: 0;
}

.lb-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
}

.lb-footer {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 80px 20px;
  flex-shrink: 0;
}

.lb-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.lb-hike-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.9);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  text-align: left;
  transition: color 0.15s;
}
.lb-hike-btn:hover { color: #74c69d; }
.lb-county { font-weight: 400; color: rgba(255,255,255,0.6); }
.lb-arrow { margin-left: 4px; font-size: 13px; }

.lb-caption {
  font-size: 13px;
  color: rgba(255,255,255,0.65);
}

.lb-meta-row {
  display: flex;
  gap: 14px;
}
.lb-coords, .lb-date {
  font-size: 11px;
  color: rgba(255,255,255,0.45);
}

.lb-counter {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
  align-self: flex-end;
}

/* ── Transitions ── */
.lb-enter-active, .lb-leave-active { transition: opacity 0.2s; }
.lb-enter-from, .lb-leave-to { opacity: 0; }

.lb-img-enter-active, .lb-img-leave-active { transition: opacity 0.12s; }
.lb-img-enter-from, .lb-img-leave-to { opacity: 0; }
</style>
