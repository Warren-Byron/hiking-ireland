// ── IndexedDB (uploaded photos, stored in browser) ─────────────────────────

const DB_NAME = 'IrelandHikesPhotos'
const STORE   = 'photos'
let dbInstance = null

async function getDB() {
  if (dbInstance) return dbInstance
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onerror     = () => reject(req.error)
    req.onsuccess   = () => { dbInstance = req.result; resolve(dbInstance) }
    req.onupgradeneeded = e => {
      const db    = e.target.result
      const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      store.createIndex('hikeId', 'hikeId')
    }
  })
}

function tx(db, mode = 'readonly') { return db.transaction(STORE, mode).objectStore(STORE) }
function run(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1400
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height / width) * MAX); width = MAX }
          else                { width  = Math.round((width  / height) * MAX); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Repo photos (committed to public/photos/{hikeId}/) ─────────────────────
// Format of public/hike-photos.json:
// {
//   "hikes": {
//     "14": [{ "id": "14-0", "filename": "summit.jpg", "lat": 52.96, "lng": -9.74, "caption": "" }]
//   }
// }

let repoPhotosCache = null

async function loadRepoPhotos() {
  if (repoPhotosCache) return repoPhotosCache
  try {
    const res = await fetch('/hike-photos.json')
    if (!res.ok) { repoPhotosCache = {}; return {} }
    const data = await res.json()
    repoPhotosCache = data.hikes ?? {}
  } catch {
    repoPhotosCache = {}
  }
  return repoPhotosCache
}

function repoPhotoToRecord(hikeId, p) {
  return {
    id:        `repo-${p.id ?? hikeId + '-' + p.filename}`,
    hikeId:    Number(hikeId),
    dataUrl:   `/photos/${hikeId}/${p.filename}`,
    name:      p.caption || p.filename,
    lat:       p.lat  ?? null,
    lng:       p.lng  ?? null,
    fromRepo:  true,
    createdAt: p.date ?? null,
  }
}

// ── Public composable ───────────────────────────────────────────────────────

export function usePhotoDB() {
  async function addPhoto(hikeId, file, lat = null, lng = null) {
    const db      = await getDB()
    const dataUrl = await compressImage(file)
    return run(tx(db, 'readwrite').add({
      hikeId, dataUrl, name: file.name, lat, lng,
      createdAt: new Date().toISOString(),
    }))
  }

  async function updatePhotoLocation(id, lat, lng) {
    const db    = await getDB()
    const photo = await run(tx(db).get(id))
    return run(tx(db, 'readwrite').put({ ...photo, lat, lng }))
  }

  async function getPhotosForHike(hikeId) {
    const db          = await getDB()
    const uploaded    = await run(tx(db).index('hikeId').getAll(hikeId))
    const repoAll     = await loadRepoPhotos()
    const repoForHike = (repoAll[hikeId] ?? []).map(p => repoPhotoToRecord(hikeId, p))
    return [...repoForHike, ...uploaded]
  }

  async function getAllPhotos() {
    const db       = await getDB()
    const uploaded = await run(tx(db).getAll())
    const repoAll  = await loadRepoPhotos()
    const repoFlat = Object.entries(repoAll).flatMap(([hikeId, photos]) =>
      photos.map(p => repoPhotoToRecord(hikeId, p))
    )
    return [...repoFlat, ...uploaded]
  }

  async function deletePhoto(id) {
    // Repo photos can't be deleted from the browser — only uploaded ones.
    if (String(id).startsWith('repo-')) return
    const db = await getDB()
    return run(tx(db, 'readwrite').delete(id))
  }

  return { addPhoto, updatePhotoLocation, getPhotosForHike, getAllPhotos, deletePhoto }
}
