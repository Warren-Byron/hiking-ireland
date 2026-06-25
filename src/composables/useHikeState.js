import { reactive, computed } from 'vue'
import { HIKES } from '../data/hikes.js'

const STORAGE_KEY  = 'ireland-hikes-v2'
const VERSION_KEY  = 'ireland-hikes-personal-version'

// ── Bootstrap ──────────────────────────────────────────────────────────────
// 1. Apply localStorage immediately so the first render is instant.
// 2. Always fetch personal.json. If its _version is newer than the last
//    version we merged, apply it on top — this picks up new hikes you commit
//    to the repo without wiping in-browser edits for existing hikes.

function defaultState() {
  const s = {}
  HIKES.forEach(h => {
    s[h.id] = {
      completed:      h.personal?.completed      ?? false,
      date_completed: h.personal?.date_completed ?? null,
      rating:         h.personal?.rating         ?? null,
      notes:          h.personal?.notes          ?? null,
    }
  })
  return s
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// Start with defaults synchronously so the first render is never blank.
const userState      = reactive(defaultState())
const selectedHikeId = reactive({ value: null })

// Apply localStorage immediately (sync, no flash).
;(() => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) { try { Object.assign(userState, JSON.parse(raw)) } catch {} }
})()

// Then fetch personal.json and merge if its _version is newer.
;(async () => {
  try {
    const res = await fetch('./personal.json')
    if (!res.ok) return
    const data = await res.json()
    const jsonVersion   = data._version ?? ''
    const seenVersion   = localStorage.getItem(VERSION_KEY) ?? ''
    const hasLocalState = !!localStorage.getItem(STORAGE_KEY)

    if (jsonVersion > seenVersion || !hasLocalState) {
      Object.entries(data).forEach(([id, val]) => {
        if (id.startsWith('_')) return
        userState[Number(id)] = { ...userState[Number(id)], ...val }
      })
      localStorage.setItem(VERSION_KEY, jsonVersion)
      persist(userState)
    }
  } catch {}
})()

// ── Composable ─────────────────────────────────────────────────────────────

export function useHikeState() {
  const hikes = computed(() =>
    HIKES.map(h => ({
      ...h,
      completed:      userState[h.id]?.completed      ?? false,
      date_completed: userState[h.id]?.date_completed ?? null,
      rating:         userState[h.id]?.rating         ?? null,
      notes:          userState[h.id]?.notes          ?? null,
    }))
  )

  const completedCount = computed(() => hikes.value.filter(h => h.completed).length)

  function getHike(id) {
    return hikes.value.find(h => h.id === id)
  }

  function updatePersonal(hikeId, updates) {
    userState[hikeId] = { ...(userState[hikeId] ?? {}), ...updates }
    persist(userState)
  }

  function selectHike(id) { selectedHikeId.value = id }
  function closeModal()   { selectedHikeId.value = null }

  // Returns the current personal state as a formatted JSON string ready to
  // commit as public/personal.json in the GitHub repo.
  function exportPersonalJson() {
    const out = {}
    Object.entries(userState).forEach(([id, val]) => {
      if (val.completed || val.rating != null || val.notes || val.date_completed) {
        out[id] = val
      }
    })
    return JSON.stringify(out, null, 2)
  }

  return {
    hikes,
    completedCount,
    selectedHikeId,
    getHike,
    updatePersonal,
    selectHike,
    closeModal,
    exportPersonalJson,
  }
}
