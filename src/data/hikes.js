import hikesJson from '../../ireland_hikes.json'
import { COORDS } from './coords.js'
import { COVER_PHOTOS } from './coverPhotos.js'

// Merge static JSON data with coordinates and cover photos. Personal data lives in localStorage.
export const HIKES = hikesJson.hikes.map(h => ({
  ...h,
  lat:        COORDS[h.id]?.lat        ?? null,
  lng:        COORDS[h.id]?.lng        ?? null,
  coverPhoto: COVER_PHOTOS[h.id]       ?? null,
}))

export const DIFFICULTY_ORDER = {
  'easy': 1,
  'easy-to-moderate': 2,
  'moderate': 3,
  'moderate-to-hard': 4,
  'hard': 5,
  'very-hard': 6,
}

export const DIFFICULTY_LABEL = {
  'easy': 'Easy',
  'easy-to-moderate': 'Easy–Moderate',
  'moderate': 'Moderate',
  'moderate-to-hard': 'Moderate–Hard',
  'hard': 'Hard',
  'very-hard': 'Very Hard',
}
