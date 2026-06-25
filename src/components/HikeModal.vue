<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="hike" class="modal-overlay" @click.self="closeModal">
        <div class="modal">

          <!-- Cover photo -->
          <div v-if="hike.coverPhoto" class="modal-cover">
            <img :src="hike.coverPhoto" :alt="hike.name" class="modal-cover-img" />
            <div class="modal-cover-gradient"></div>
          </div>

          <!-- Header -->
          <div class="modal-header">
            <div class="modal-rank">#{{ hike.id }}</div>
            <div class="modal-title-block">
              <h2 class="modal-name">{{ hike.name }}</h2>
              <p v-if="hike.subtitle" class="modal-subtitle">{{ hike.subtitle }}</p>
              <p v-if="hike.irish_name" class="modal-irish">
                <em>{{ hike.irish_name }}</em>
                <span v-if="hike.irish_meaning" class="modal-meaning"> — {{ hike.irish_meaning }}</span>
                <button
                  class="speak-btn"
                  :class="{ speaking: speaking }"
                  :title="hasIrishVoice === false ? 'Speak (no Irish voice installed — using default)' : 'Speak Irish name'"
                  @click="speak(hike.irish_name)"
                  aria-label="Pronounce Irish name"
                >{{ speaking ? '⏹' : '🔊' }}</button>
              </p>
              <p class="modal-province">
                <span v-if="hike.county">{{ hike.county }}, </span>{{ hike.province }}
              </p>
            </div>
            <span :class="['diff-badge', diffClass(hike.difficulty)]">{{ diffLabel(hike.difficulty) }}</span>
            <button class="close-btn" @click="closeModal" aria-label="Close">×</button>
          </div>

          <!-- Stats -->
          <div class="modal-stats">
            <div v-if="hike.distance_km != null" class="stat-item">
              <span class="stat-icon">📏</span>
              <span class="stat-value">{{ hike.distance_km }}</span>
              <span class="stat-unit">km</span>
            </div>
            <div v-if="hike.height_m != null" class="stat-item">
              <span class="stat-icon">🏔️</span>
              <span class="stat-value">{{ hike.height_m }}</span>
              <span class="stat-unit">m peak</span>
            </div>
            <div v-if="hike.elevation_m != null" class="stat-item">
              <span class="stat-icon">⬆️</span>
              <span class="stat-value">{{ hike.elevation_m }}</span>
              <span class="stat-unit">m gain</span>
            </div>
            <div v-if="hike.approx_time" class="stat-item">
              <span class="stat-icon">⏱️</span>
              <span class="stat-value">{{ hike.approx_time }}</span>
            </div>
          </div>

          <!-- Info badges -->
          <div class="modal-badges">
            <span v-if="hike.route_type" class="info-badge">🔁 {{ hike.route_type }}</span>
            <span class="info-badge" :class="hike.dog_friendly ? 'badge-yes' : 'badge-no'">
              🐕 {{ hike.dog_friendly ? 'Dog friendly' + (hike.dog_friendly_notes ? ' (' + hike.dog_friendly_notes + ')' : '') : 'No dogs' }}
            </span>
            <span v-if="hike.fee && hike.fee !== false" class="info-badge badge-fee">
              💰 {{ hike.fee === true ? 'Fee applies' : hike.fee }}
            </span>
            <span v-else class="info-badge badge-yes">💰 Free</span>
          </div>

          <!-- Starting point -->
          <div v-if="hike.starting_point" class="modal-start">
            <span class="start-label">📍 Start</span>
            <span class="start-text">{{ hike.starting_point }}</span>
          </div>

          <!-- Notes -->
          <div v-if="hike.special_notes || hike.difficulty_notes" class="modal-notes-row">
            <p v-if="hike.special_notes" class="modal-note special">⚠️ {{ hike.special_notes }}</p>
            <p v-if="hike.difficulty_notes" class="modal-note difficulty">🧗 Difficulty: {{ hike.difficulty_notes }}</p>
          </div>

          <!-- Complete toggle -->
          <div class="complete-section">
            <label class="toggle-row">
              <span class="toggle-label-text">Mark as complete</span>
              <div class="toggle-switch" :class="{ on: localCompleted }" @click="toggleCompleted">
                <div class="toggle-thumb"></div>
              </div>
            </label>
            <Transition name="fade">
              <div v-if="localCompleted" class="date-row">
                <label class="date-label">Date completed</label>
                <input v-model="localDate" type="date" class="date-input" :max="today" @change="saveDate" />
              </div>
            </Transition>
          </div>

          <!-- Your take: rating + notes -->
          <div class="your-take-section">
            <h3 class="section-title">Your take</h3>
            <div class="rating-row">
              <label class="rating-label">Rating</label>
              <div class="rating-input-wrap">
                <input
                  v-model.number="localRating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  class="rating-input"
                  placeholder="—"
                  @change="saveRating"
                />
                <span class="rating-suffix">/ 10</span>
              </div>
            </div>
            <textarea
              v-model="localNotes"
              class="notes-textarea"
              placeholder="Add your notes about this hike…"
              rows="3"
              @change="saveNotes"
            ></textarea>
          </div>

          <!-- Pit stops -->
          <div v-if="hasPitStops" class="pitstops-section">
            <h3 class="section-title">Pit stops</h3>
            <div class="pitstops-grid">
              <div v-if="hike.pit_stops?.eat?.length" class="pitstop-col">
                <p class="pitstop-heading">🍽 Eat</p>
                <ul class="pitstop-list">
                  <li v-for="item in hike.pit_stops.eat" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div v-if="hike.pit_stops?.swim?.length" class="pitstop-col">
                <p class="pitstop-heading">🏊 Swim</p>
                <ul class="pitstop-list">
                  <li v-for="item in hike.pit_stops.swim" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div v-if="hike.pit_stops?.visit?.length" class="pitstop-col">
                <p class="pitstop-heading">👀 Visit</p>
                <ul class="pitstop-list">
                  <li v-for="item in hike.pit_stops.visit" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Photos -->
          <div class="photos-section">
            <div class="photos-header">
              <h3 class="section-title" style="margin:0">Photos</h3>
              <label class="upload-btn" :class="{ disabled: pendingPhotos.length > 0 }">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style="display:none"
                  :disabled="pendingPhotos.length > 0"
                  @change="handleFileSelect"
                />
                + Add photos
              </label>
            </div>

            <!-- Pending review -->
            <Transition name="fade">
              <div v-if="pendingPhotos.length" class="pending-panel">
                <div class="pending-panel-header">
                  <span class="pending-panel-title">Review {{ pendingPhotos.length }} photo{{ pendingPhotos.length !== 1 ? 's' : '' }}</span>
                  <div class="pending-panel-actions">
                    <button class="pending-cancel-btn" @click="cancelPending">Discard</button>
                    <button class="pending-save-btn" :disabled="saving" @click="savePending">
                      {{ saving ? 'Saving…' : `Save ${pendingPhotos.length}` }}
                    </button>
                  </div>
                </div>
                <div v-for="(p, idx) in pendingPhotos" :key="idx" class="pending-item">
                  <img :src="p.previewUrl" class="pending-thumb" />
                  <div class="pending-info">
                    <span class="pending-filename">{{ p.name }}</span>
                    <span class="pending-gps-source" :class="p.gpsSource">
                      {{ p.gpsSource === 'exif' ? '📍 GPS detected from photo' : '📍 No GPS — using hike location' }}
                    </span>
                    <div class="coord-row">
                      <label class="coord-label">Lat</label>
                      <input v-model.number="p.lat" type="number" step="0.000001" class="coord-input" />
                      <label class="coord-label">Lng</label>
                      <input v-model.number="p.lng" type="number" step="0.000001" class="coord-input" />
                    </div>
                  </div>
                  <button class="pending-remove-btn" @click="removePending(idx)">×</button>
                </div>
              </div>
            </Transition>

            <div v-if="loading && !saving" class="photos-loading">Loading…</div>
            <div v-else-if="photos.length === 0 && !pendingPhotos.length" class="photos-empty">
              No photos yet.
            </div>
            <div v-else-if="photos.length" class="photos-grid">
              <div v-for="photo in photos" :key="photo.id" class="photo-thumb" @click="openLightbox(photo)">
                <img :src="photo.dataUrl" :alt="photo.name" />
                <button class="photo-delete" @click.stop="removePhoto(photo.id)">×</button>
                <div v-if="photo.lat != null" class="photo-coords">
                  📍 {{ photo.lat.toFixed(4) }}, {{ photo.lng.toFixed(4) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Book reference -->
          <div class="book-ref">
            <span>📖 p.{{ hike.book_page }}</span>
            <span v-if="hike.osi_map">· OSi Map {{ hike.osi_map }}</span>
          </div>
        </div>

        <!-- Lightbox -->
        <Transition name="fade">
          <div v-if="lightboxPhoto" class="lightbox" @click="lightboxPhoto = null">
            <img :src="lightboxPhoto.dataUrl" class="lightbox-img" />
            <button class="lightbox-close" @click="lightboxPhoto = null">×</button>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { gps as extractGps } from 'exifr'
import { useHikeState } from '../composables/useHikeState.js'
import { usePhotoDB } from '../composables/usePhotoDB.js'
import { useSpeech } from '../composables/useSpeech.js'
import { DIFFICULTY_LABEL } from '../data/hikes.js'

const emit = defineEmits(['photos-changed'])

const { selectedHikeId, getHike, updatePersonal, closeModal } = useHikeState()
const { addPhoto, getPhotosForHike, deletePhoto } = usePhotoDB()
const { speak, speaking, hasIrishVoice } = useSpeech()

const hike = computed(() =>
  selectedHikeId.value != null ? getHike(selectedHikeId.value) : null
)

const localCompleted = ref(false)
const localDate      = ref('')
const localRating    = ref(null)
const localNotes     = ref('')
const photos         = ref([])
const loading        = ref(false)
const saving         = ref(false)
const lightboxPhoto  = ref(null)
const pendingPhotos  = ref([])
const today = new Date().toISOString().split('T')[0]

watch(hike, async newHike => {
  window.speechSynthesis?.cancel()
  if (!newHike) return
  localCompleted.value = newHike.completed
  localDate.value      = newHike.date_completed ?? today
  localRating.value    = newHike.rating
  localNotes.value     = newHike.notes ?? ''
  cancelPending()
  await loadPhotos()
})

const hasPitStops = computed(() => {
  const ps = hike.value?.pit_stops
  return ps && (ps.eat?.length || ps.swim?.length || ps.visit?.length)
})

async function loadPhotos() {
  if (!hike.value) return
  loading.value = true
  try { photos.value = await getPhotosForHike(hike.value.id) }
  finally { loading.value = false }
}

function toggleCompleted() {
  localCompleted.value = !localCompleted.value
  updatePersonal(hike.value.id, {
    completed: localCompleted.value,
    date_completed: localCompleted.value ? (localDate.value || today) : null,
  })
}

function saveDate() {
  if (localCompleted.value) {
    updatePersonal(hike.value.id, { date_completed: localDate.value })
  }
}

function saveRating() {
  updatePersonal(hike.value.id, { rating: localRating.value })
}

function saveNotes() {
  updatePersonal(hike.value.id, { notes: localNotes.value })
}

async function handleFileSelect(e) {
  const files = Array.from(e.target.files)
  e.target.value = ''
  for (const file of files) {
    const previewUrl = URL.createObjectURL(file)
    let lat = hike.value.lat, lng = hike.value.lng, gpsSource = 'hike'
    try {
      const coords = await extractGps(file)
      if (coords?.latitude != null) { lat = coords.latitude; lng = coords.longitude; gpsSource = 'exif' }
    } catch {}
    pendingPhotos.value.push({ file, previewUrl, name: file.name, lat, lng, gpsSource })
  }
}

async function savePending() {
  saving.value = true
  try {
    for (const p of pendingPhotos.value) {
      await addPhoto(hike.value.id, p.file, p.lat, p.lng)
      URL.revokeObjectURL(p.previewUrl)
    }
    pendingPhotos.value = []
    await loadPhotos()
    emit('photos-changed')
  } finally { saving.value = false }
}

function cancelPending() {
  pendingPhotos.value.forEach(p => URL.revokeObjectURL(p.previewUrl))
  pendingPhotos.value = []
}

function removePending(idx) {
  URL.revokeObjectURL(pendingPhotos.value[idx].previewUrl)
  pendingPhotos.value.splice(idx, 1)
}

async function removePhoto(id) {
  await deletePhoto(id)
  photos.value = photos.value.filter(p => p.id !== id)
  emit('photos-changed')
}

function openLightbox(photo) { lightboxPhoto.value = photo }

function diffClass(d) { return d }
function diffLabel(d) { return DIFFICULTY_LABEL[d] ?? d }
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--bg);
  border-radius: 16px;
  width: 100%;
  max-width: 620px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* Cover photo */
.modal-cover {
  position: relative;
  width: 100%;
  height: 220px;
  flex-shrink: 0;
  overflow: hidden;
}
.modal-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.modal-cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35) 100%);
}

/* Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 22px 22px 14px;
  border-bottom: 1px solid var(--border);
}

.modal-rank {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--surface-raised);
  padding: 4px 9px;
  border-radius: 99px;
  white-space: nowrap;
  margin-top: 3px;
  flex-shrink: 0;
}

.modal-title-block { flex: 1; min-width: 0; }

.modal-name {
  font-size: 19px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 1px;
  line-height: 1.2;
}

.modal-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0 0 2px;
}

.modal-irish {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 2px 0 0;
}

.modal-meaning { color: var(--text-muted); }

.speak-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface-raised);
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  vertical-align: middle;
  transition: background 0.15s, transform 0.15s;
  padding: 0;
}
.speak-btn:hover { background: var(--border); }
.speak-btn.speaking {
  background: rgba(var(--green-rgb), 0.15);
  border-color: var(--green-500);
  animation: pulse-ring 1.2s ease-in-out infinite;
}
@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--green-rgb), 0.4); }
  50%       { box-shadow: 0 0 0 5px rgba(var(--green-rgb), 0); }
}

.modal-province {
  font-size: 12px;
  color: var(--text-muted);
  margin: 3px 0 0;
}

.close-btn {
  background: none; border: none;
  font-size: 24px; line-height: 1;
  color: var(--text-muted); cursor: pointer; padding: 0 4px;
}
.close-btn:hover { color: var(--text); }

/* Stats */
.modal-stats {
  display: flex;
  padding: 14px 22px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  gap: 0;
}

.stat-item {
  flex: 1;
  min-width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 0 8px;
}
.stat-item + .stat-item { border-left: 1px solid var(--border); }

.stat-icon { font-size: 16px; }
.stat-value { font-size: 16px; font-weight: 700; color: var(--text); }
.stat-unit { font-size: 10px; color: var(--text-muted); font-weight: 500; text-align: center; }

/* Badges */
.modal-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 22px;
  border-bottom: 1px solid var(--border);
}

.info-badge {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 99px;
  background: var(--surface-raised);
  color: var(--text-secondary);
  white-space: nowrap;
}
.badge-yes { background: rgba(var(--green-rgb), 0.1); color: var(--green-600); }
.badge-no  { background: rgba(220,38,38,.08); color: #dc2626; }
.badge-fee { background: rgba(217,119,6,.1); color: #d97706; }

/* Starting point */
.modal-start {
  display: flex;
  gap: 8px;
  padding: 10px 22px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.start-label { color: var(--text-muted); white-space: nowrap; font-weight: 600; }
.start-text { color: var(--text-secondary); }

/* Notes */
.modal-notes-row {
  padding: 10px 22px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.modal-note {
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
}
.modal-note.special { background: rgba(217,119,6,.08); color: #92400e; }
.modal-note.difficulty { background: var(--surface); color: var(--text-secondary); }

/* Complete section */
.complete-section {
  padding: 14px 22px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.toggle-label-text { font-size: 14px; font-weight: 600; color: var(--text); }

.toggle-switch {
  width: 44px; height: 24px;
  border-radius: 12px;
  background: var(--border-strong);
  position: relative; cursor: pointer;
  transition: background 0.2s; flex-shrink: 0;
}
.toggle-switch.on { background: var(--green-600); }

.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 18px; height: 18px;
  border-radius: 50%; background: white;
  transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.toggle-switch.on .toggle-thumb { left: 23px; }

.date-row { display: flex; align-items: center; gap: 12px; }
.date-label { font-size: 13px; color: var(--text-muted); white-space: nowrap; }
.date-input {
  padding: 6px 10px; border: 1px solid var(--border);
  border-radius: 8px; background: var(--surface); color: var(--text); font-size: 13px;
}
.date-input:focus { outline: none; border-color: var(--green-500); }

/* Your take */
.your-take-section {
  padding: 14px 22px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0 0 2px;
}

.rating-row { display: flex; align-items: center; gap: 12px; }
.rating-label { font-size: 13px; color: var(--text-muted); }
.rating-input-wrap { display: flex; align-items: center; gap: 6px; }
.rating-input {
  width: 72px; padding: 5px 8px;
  border: 1px solid var(--border); border-radius: 8px;
  background: var(--surface); color: var(--text); font-size: 14px; font-weight: 600;
  text-align: center;
}
.rating-input:focus { outline: none; border-color: var(--green-500); }
.rating-suffix { font-size: 12px; color: var(--text-muted); }

.notes-textarea {
  width: 100%; padding: 8px 10px;
  border: 1px solid var(--border); border-radius: 8px;
  background: var(--surface); color: var(--text);
  font-size: 13px; font-family: inherit; line-height: 1.5;
  resize: vertical;
}
.notes-textarea:focus { outline: none; border-color: var(--green-500); }

/* Pit stops */
.pitstops-section {
  padding: 14px 22px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pitstops-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}

.pitstop-col { display: flex; flex-direction: column; gap: 6px; }
.pitstop-heading { font-size: 12px; font-weight: 700; color: var(--text-muted); margin: 0; }
.pitstop-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 4px;
}
.pitstop-list li {
  font-size: 12px; color: var(--text-secondary);
  padding: 3px 0;
  border-bottom: 1px solid var(--border);
  line-height: 1.35;
}
.pitstop-list li:last-child { border-bottom: none; }

/* Photos */
.photos-section {
  padding: 14px 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid var(--border);
}

.photos-header { display: flex; align-items: center; justify-content: space-between; }

.upload-btn {
  padding: 6px 14px; background: var(--green-600); color: white;
  border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
}
.upload-btn:hover { background: var(--green-700); }
.upload-btn.disabled { opacity: 0.5; cursor: not-allowed; }

.pending-panel {
  border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--surface);
}
.pending-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: var(--surface-raised); border-bottom: 1px solid var(--border);
}
.pending-panel-title { font-size: 13px; font-weight: 600; color: var(--text); }
.pending-panel-actions { display: flex; gap: 8px; }
.pending-cancel-btn {
  padding: 5px 12px; border: 1px solid var(--border); border-radius: 6px;
  background: none; color: var(--text-muted); font-size: 12px; cursor: pointer;
}
.pending-cancel-btn:hover { background: var(--border); }
.pending-save-btn {
  padding: 5px 12px; border: none; border-radius: 6px;
  background: var(--green-600); color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}
.pending-save-btn:hover:not(:disabled) { background: var(--green-700); }
.pending-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.pending-item {
  display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}
.pending-item:last-child { border-bottom: none; }
.pending-thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
.pending-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.pending-filename { font-size: 12px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pending-gps-source { font-size: 11px; font-weight: 500; }
.pending-gps-source.exif { color: var(--green-600); }
.pending-gps-source.hike { color: var(--text-muted); }
.coord-row { display: flex; align-items: center; gap: 6px; }
.coord-label { font-size: 11px; color: var(--text-muted); font-weight: 600; }
.coord-input { width: 110px; padding: 4px 7px; border: 1px solid var(--border); border-radius: 5px; background: var(--bg); color: var(--text); font-size: 12px; }
.coord-input:focus { outline: none; border-color: var(--green-500); }
.pending-remove-btn { background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 0 2px; }
.pending-remove-btn:hover { color: #dc2626; }

.photos-empty { font-size: 13px; color: var(--text-muted); text-align: center; padding: 16px; background: var(--surface); border-radius: 8px; border: 1px dashed var(--border); }
.photos-loading { font-size: 13px; color: var(--text-muted); text-align: center; padding: 16px; }

.photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; }

.photo-thumb { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; cursor: pointer; background: var(--surface); }
.photo-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
.photo-thumb:hover img { transform: scale(1.05); }
.photo-delete {
  position: absolute; top: 4px; right: 4px; width: 22px; height: 22px;
  border-radius: 50%; background: rgba(0,0,0,0.6); color: white; border: none;
  font-size: 16px; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.15s;
}
.photo-thumb:hover .photo-delete { opacity: 1; }
.photo-coords {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,0.72); color: white; font-size: 9px;
  padding: 4px 6px; opacity: 0; transition: opacity 0.15s;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.photo-thumb:hover .photo-coords { opacity: 1; }

/* Book reference */
.book-ref {
  padding: 10px 22px;
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  gap: 8px;
}

/* Lightbox */
.lightbox {
  position: fixed; inset: 0; background: rgba(0,0,0,0.9);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000; padding: 20px;
}
.lightbox-img { max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: 4px; }
.lightbox-close { position: absolute; top: 16px; right: 20px; background: none; border: none; color: white; font-size: 36px; cursor: pointer; line-height: 1; }

/* Difficulty badge */
.diff-badge {
  display: inline-block; padding: 3px 9px; border-radius: 99px;
  font-size: 11px; font-weight: 700; white-space: nowrap; margin-top: 3px; flex-shrink: 0;
}
.diff-badge.easy              { background: rgba(22,163,74,.12);  color: #16a34a; }
.diff-badge.easy-to-moderate  { background: rgba(101,163,13,.12); color: #65a30d; }
.diff-badge.moderate          { background: rgba(217,119,6,.12);  color: #d97706; }
.diff-badge.moderate-to-hard  { background: rgba(234,88,12,.12);  color: #ea580c; }
.diff-badge.hard              { background: rgba(220,38,38,.12);  color: #dc2626; }
.diff-badge.very-hard         { background: rgba(124,58,237,.12); color: #7c3aed; }

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s, transform 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
