<template>
  <div class="app">
    <!-- Header -->
    <header class="app-header">
      <div class="header-left">
        <span class="logo-icon">⛰️</span>
        <div>
          <h1 class="app-title">Ireland Hikes</h1>
          <p class="app-sub">Top 50 Tracker</p>
        </div>
      </div>

      <div class="header-progress">
        <span class="progress-label">{{ completedCount }} / {{ hikes.length }} completed</span>
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: progressPct + '%' }"
          ></div>
        </div>
        <span class="progress-pct">{{ progressPct }}%</span>
      </div>

      <nav class="view-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeView === tab.id }"
          @click="activeView = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <!-- Views -->
    <main class="app-main">
      <MapView
        v-show="activeView === 'map'"
        ref="mapViewRef"
      />
      <ListView v-show="activeView === 'list'" />
      <GalleryView v-show="activeView === 'gallery'" ref="galleryViewRef" @go-to-map="activeView = 'map'" />
      <AttributionView v-show="activeView === 'attribution'" />
    </main>

    <!-- Modal -->
    <HikeModal />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import MapView from './components/MapView.vue'
import ListView from './components/ListView.vue'
import HikeModal from './components/HikeModal.vue'
import AttributionView from './components/AttributionView.vue'
import GalleryView from './components/GalleryView.vue'
import { useHikeState } from './composables/useHikeState.js'

const { hikes, completedCount } = useHikeState()

const activeView    = ref('map')
const mapViewRef    = ref(null)
const galleryViewRef = ref(null)

function onOpenGalleryPhoto(e) {
  activeView.value = 'gallery'
  galleryViewRef.value?.openPhoto(e.detail.hikeId, e.detail.photoId)
}

onMounted(() => window.addEventListener('gallery:open-photo', onOpenGalleryPhoto))
onUnmounted(() => window.removeEventListener('gallery:open-photo', onOpenGalleryPhoto))

const tabs = [
  { id: 'map',         label: '🗺️ Map' },
  { id: 'list',        label: '📋 List' },
  { id: 'gallery',     label: '📸 Gallery' },
  { id: 'attribution', label: '📜 Credits' },
]

const progressPct = computed(() =>
  hikes.value.length ? Math.round((completedCount.value / hikes.value.length) * 100) : 0
)

</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 24px;
  height: 60px;
  background: var(--green-800);
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

@media (max-width: 640px) {
  .app-header {
    flex-wrap: wrap;
    height: auto;
    padding: 10px 14px 0;
    gap: 8px 12px;
  }
  .header-left { flex-shrink: 0; }
  .header-progress { flex: 1; min-width: 0; }
  .progress-track { max-width: none; }
  .progress-label { font-size: 12px; }
  .view-tabs {
    width: 100%;
    border-top: 1px solid rgba(255,255,255,0.12);
    padding: 6px 0;
    gap: 2px;
  }
  .tab-btn {
    flex: 1;
    padding: 7px 4px;
    font-size: 11px;
    border-radius: 6px;
    text-align: center;
  }
  .logo-icon { font-size: 20px; }
  .app-title { font-size: 15px; }
  .app-sub { display: none; }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.logo-icon { font-size: 24px; }

.app-title {
  font-size: 17px;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.1;
}

.app-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  margin: 0;
  font-weight: 500;
}

.header-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.progress-label {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  white-space: nowrap;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.2);
  border-radius: 3px;
  overflow: hidden;
  min-width: 80px;
  max-width: 200px;
}

.progress-fill {
  height: 100%;
  background: #74c69d;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.progress-pct {
  font-size: 13px;
  font-weight: 700;
  color: #74c69d;
  white-space: nowrap;
}

.view-tabs {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.tab-btn {
  padding: 6px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  background: transparent;
  color: rgba(255,255,255,0.75);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover { background: rgba(255,255,255,0.1); color: white; }
.tab-btn.active { background: rgba(255,255,255,0.18); color: white; border-color: rgba(255,255,255,0.4); }

.app-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.app-main > * {
  position: absolute;
  inset: 0;
}
</style>
