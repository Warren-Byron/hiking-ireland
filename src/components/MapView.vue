<template>
  <div class="map-view">
    <aside class="map-sidebar">
      <div class="sidebar-section">
        <h3 class="sidebar-heading">Filters</h3>
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <select v-model="filters.status" class="filter-select">
            <option value="all">All hikes</option>
            <option value="done">Completed</option>
            <option value="todo">Not done</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Difficulty</label>
          <select v-model="filters.difficulty" class="filter-select">
            <option value="all">All</option>
            <option value="easy">Easy</option>
            <option value="easy-to-moderate">Easy–Moderate</option>
            <option value="moderate">Moderate</option>
            <option value="moderate-to-hard">Moderate–Hard</option>
            <option value="hard">Hard</option>
            <option value="very-hard">Very Hard</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Province</label>
          <select v-model="filters.province" class="filter-select">
            <option value="all">All</option>
            <option value="Connacht">Connacht</option>
            <option value="Leinster">Leinster</option>
            <option value="Munster">Munster</option>
            <option value="Ulster">Ulster</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">County</label>
          <select v-model="filters.county" class="filter-select">
            <option value="all">All</option>
            <option v-for="c in counties" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <button class="reset-btn" @click="resetFilters">Reset</button>
      </div>

      <div class="sidebar-section">
        <h3 class="sidebar-heading">Legend</h3>
        <div class="legend-item">
          <span class="legend-marker diff-easy done">✓</span>
          <span>Completed</span>
        </div>
        <div class="legend-item">
          <span class="legend-marker diff-hard">42</span>
          <span>Not done (colour = difficulty)</span>
        </div>
        <div class="legend-item">
          <span class="legend-marker photo">📷</span>
          <span>Photo pinned</span>
        </div>
      </div>

      <div class="sidebar-section">
        <h3 class="sidebar-heading">By difficulty</h3>
        <div class="breakdown">
          <div v-for="row in difficultyBreakdown" :key="row.label" class="breakdown-row">
            <span class="breakdown-label">
              <span :class="['diff-dot', row.cls]"></span>
              {{ row.label }}
            </span>
            <span class="breakdown-frac">{{ row.done }}/{{ row.total }}</span>
          </div>
        </div>
      </div>
    </aside>

    <div ref="mapEl" class="map-container"></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useHikeState } from '../composables/useHikeState.js'
import { usePhotoDB } from '../composables/usePhotoDB.js'
import { DIFFICULTY_ORDER, DIFFICULTY_LABEL } from '../data/hikes.js'

const { hikes, selectHike } = useHikeState()
const { getAllPhotos } = usePhotoDB()

const mapEl = ref(null)
let map = null
const hikeMarkers = {}
const photoMarkerLayer = L.layerGroup()

const filters = reactive({ status: 'all', difficulty: 'all', province: 'all', county: 'all' })

const counties = computed(() =>
  [...new Set(hikes.value.map(h => h.county).filter(Boolean))].sort()
)

const filteredIds = computed(() => new Set(
  hikes.value
    .filter(h => {
      if (filters.status === 'done' && !h.completed) return false
      if (filters.status === 'todo' && h.completed) return false
      if (filters.difficulty !== 'all' && h.difficulty !== filters.difficulty) return false
      if (filters.province !== 'all' && h.province !== filters.province) return false
      if (filters.county !== 'all' && h.county !== filters.county) return false
      return true
    })
    .map(h => h.id)
))

const DIFF_ROWS = [
  { key: 'easy',             label: 'Easy',            cls: 'easy' },
  { key: 'easy-to-moderate', label: 'Easy–Moderate',   cls: 'easy-to-moderate' },
  { key: 'moderate',         label: 'Moderate',        cls: 'moderate' },
  { key: 'moderate-to-hard', label: 'Moderate–Hard',   cls: 'moderate-to-hard' },
  { key: 'hard',             label: 'Hard',            cls: 'hard' },
  { key: 'very-hard',        label: 'Very Hard',       cls: 'very-hard' },
]

const difficultyBreakdown = computed(() =>
  DIFF_ROWS
    .map(r => {
      const group = hikes.value.filter(h => h.difficulty === r.key)
      return { ...r, total: group.length, done: group.filter(h => h.completed).length }
    })
    .filter(r => r.total > 0)
)

function hikeIcon(hike) {
  const inner = hike.completed ? '✓' : hike.id
  const cls   = `diff-${hike.difficulty}${hike.completed ? ' done' : ''}`
  return L.divIcon({
    html: `<div class="hike-marker ${cls}">${inner}</div>`,
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

function buildTooltip(hike) {
  const imgHtml = hike.coverPhoto
    ? `<img src="${hike.coverPhoto}" class="ht-img" />`
    : `<div class="ht-img ht-img-placeholder diff-${hike.difficulty}"></div>`
  return `
    <div class="ht-wrap">
      ${imgHtml}
      <div class="ht-body">
        <div class="ht-name">${hike.name}</div>
        <div class="ht-meta">${hike.county ?? hike.province} · ${hike.distance_km != null ? hike.distance_km + ' km' : ''}</div>
      </div>
    </div>`
}

function resetFilters() {
  filters.status = 'all'
  filters.difficulty = 'all'
  filters.province = 'all'
  filters.county = 'all'
}

onMounted(async () => {
  map = L.map(mapEl.value, { zoomControl: true }).setView([53.5, -7.8], 7)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map)

  photoMarkerLayer.addTo(map)

  hikes.value.forEach(hike => {
    if (hike.lat == null || hike.lng == null) return
    const marker = L.marker([hike.lat, hike.lng], { icon: hikeIcon(hike) })
    marker.on('click', () => selectHike(hike.id))
    marker.bindTooltip(buildTooltip(hike), {
      direction: 'right',
      offset: [14, 0],
      className: 'hike-hover-tooltip',
    })
    marker.addTo(map)
    hikeMarkers[hike.id] = marker
  })

  await refreshPhotoMarkers()
})

onBeforeUnmount(() => {
  if (map) map.remove()
  map = null
})

watch(hikes, newHikes => {
  newHikes.forEach(hike => {
    hikeMarkers[hike.id]?.setIcon(hikeIcon(hike))
  })
}, { deep: true })

watch(filteredIds, ids => {
  hikes.value.forEach(hike => {
    const m = hikeMarkers[hike.id]
    if (!m || !map) return
    if (ids.has(hike.id)) {
      if (!map.hasLayer(m)) m.addTo(map)
    } else {
      if (map.hasLayer(m)) map.removeLayer(m)
    }
  })
})

async function refreshPhotoMarkers() {
  if (!map) return
  photoMarkerLayer.clearLayers()

  const photos = await getAllPhotos()
  const hikeById = Object.fromEntries(hikes.value.map(h => [h.id, h]))

  photos.forEach(photo => {
    const hike = hikeById[photo.hikeId]
    if (!hike) return

    const lat = photo.lat ?? hike.lat
    const lng = photo.lng ?? hike.lng
    if (lat == null || lng == null) return

    const isPinned = photo.lat != null

    const icon = L.divIcon({
      html: `<div class="photo-pin-marker">📷</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    })

    const popup = L.popup({ maxWidth: 260 }).setContent(`
      <div class="photo-popup">
        <img src="${photo.dataUrl}" class="popup-img" />
        <div class="popup-meta">
          <strong>${hike.name}</strong>
          <span class="popup-coords">${isPinned ? `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}` : '📍 Trailhead (no GPS in photo)'}</span>
        </div>
      </div>
    `)

    const marker = L.marker([lat, lng], { icon })
    marker.bindPopup(popup)
    photoMarkerLayer.addLayer(marker)
  })
}

defineExpose({ refreshPhotoMarkers })
</script>

<style scoped>
.map-view {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.map-sidebar {
  width: 210px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.map-container { flex: 1; min-width: 0; }

.sidebar-section { display: flex; flex-direction: column; gap: 9px; }

.sidebar-heading {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0;
}

.filter-group { display: flex; flex-direction: column; gap: 3px; }
.filter-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
.filter-select {
  width: 100%; padding: 6px 8px;
  border: 1px solid var(--border); border-radius: 6px;
  background: var(--bg); color: var(--text); font-size: 12px; cursor: pointer;
}

.reset-btn {
  padding: 5px 10px; background: none;
  border: 1px solid var(--border); border-radius: 6px;
  color: var(--text-muted); font-size: 12px; cursor: pointer;
  transition: all 0.15s;
}
.reset-btn:hover { background: var(--border); color: var(--text); }

.legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text); }

.legend-marker {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.legend-marker.diff-easy             { background: #16a34a; border-color: #14532d; color: white; }
.legend-marker.diff-easy-to-moderate { background: #65a30d; border-color: #3f6212; color: white; }
.legend-marker.diff-moderate         { background: #d97706; border-color: #92400e; color: white; }
.legend-marker.diff-moderate-to-hard { background: #ea580c; border-color: #9a3412; color: white; }
.legend-marker.diff-hard             { background: #dc2626; border-color: #7f1d1d; color: white; }
.legend-marker.diff-very-hard        { background: #7c3aed; border-color: #4c1d95; color: white; }
.legend-marker.done { box-shadow: 0 0 0 2px white, 0 0 0 4px rgba(0,0,0,0.3); font-size: 13px; }
.legend-marker.photo { background: none; font-size: 16px; }

.breakdown { display: flex; flex-direction: column; gap: 5px; }
.breakdown-row { display: flex; align-items: center; justify-content: space-between; font-size: 11px; }
.breakdown-label { display: flex; align-items: center; gap: 6px; color: var(--text); }

.diff-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.diff-dot.easy             { background: #16a34a; }
.diff-dot.easy-to-moderate { background: #65a30d; }
.diff-dot.moderate         { background: #d97706; }
.diff-dot.moderate-to-hard { background: #ea580c; }
.diff-dot.hard             { background: #dc2626; }
.diff-dot.very-hard        { background: #7c3aed; }

.breakdown-frac { font-weight: 600; color: var(--text-muted); font-size: 11px; }
</style>
