import { reactive, computed } from 'vue'
import { HIKES } from '../data/hikes.js'

const STORAGE_KEY = 'ireland-hikes-v2'

// ── Bootstrap ──────────────────────────────────────────────────────────────
// Priority: localStorage (in-session edits) → public/personal.json (committed
// data) → ireland_hikes.json defaults.
//
// personal.json is only fetched when localStorage is empty — i.e. first visit
// or after a browser-data clear. After that, localStorage is authoritative and
// renders instantly with no network wait.

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

// Then try to upgrade the state from the best available source.
;(async () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try { Object.assign(userState, JSON.parse(raw)); return } catch {}
  }

  // localStorage empty — seed from the committed personal.json in the repo.
  try {
    const res = await fetch('/personal.json')
    if (res.ok) {
      const data = await res.json()
      // Merge: only overwrite hikes that actually have personal data in the file.
      Object.entries(data).forEach(([id, val]) => {
        userState[Number(id)] = { ...userState[Number(id)], ...val }
      })
    }
  } catch {}

  persist(userState)
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
