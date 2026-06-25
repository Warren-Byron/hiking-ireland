<template>
  <div class="list-view">
    <div class="list-controls">
      <input v-model="search" type="search" placeholder="Search hikes…" class="search-input" />
      <select v-model="filterStatus" class="filter-select">
        <option value="all">All status</option>
        <option value="done">Completed</option>
        <option value="todo">Not done</option>
      </select>
      <select v-model="filterDifficulty" class="filter-select">
        <option value="all">All difficulties</option>
        <option value="easy">Easy</option>
        <option value="easy-to-moderate">Easy–Moderate</option>
        <option value="moderate">Moderate</option>
        <option value="moderate-to-hard">Moderate–Hard</option>
        <option value="hard">Hard</option>
        <option value="very-hard">Very Hard</option>
      </select>
      <select v-model="filterProvince" class="filter-select">
        <option value="all">All provinces</option>
        <option value="Connacht">Connacht</option>
        <option value="Leinster">Leinster</option>
        <option value="Munster">Munster</option>
        <option value="Ulster">Ulster</option>
      </select>
      <select v-model="filterCounty" class="filter-select">
        <option value="all">All counties</option>
        <option v-for="c in counties" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="filterDog" class="filter-select">
        <option value="all">All</option>
        <option value="yes">Dog friendly</option>
      </select>
      <span class="result-count">{{ filtered.length }} / {{ hikes.length }}</span>
    </div>

    <div class="table-wrap">
      <table class="hike-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key"
              class="th-sortable" :class="{ active: sortKey === col.key }"
              @click="setSort(col.key)">
              {{ col.label }}
              <span class="sort-arrow">{{ sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="hike in filtered" :key="hike.id"
            class="hike-row" :class="{ completed: hike.completed }"
            @click="selectHike(hike.id)">
            <td class="td-rank">#{{ hike.id }}</td>
            <td class="td-name">
              <span class="hike-name">{{ hike.name }}</span>
              <span v-if="hike.irish_name" class="hike-irish">{{ hike.irish_name }}</span>
            </td>
            <td>{{ hike.county ?? '—' }}</td>
            <td>{{ hike.province }}</td>
            <td>
              <span :class="['diff-badge', hike.difficulty]">{{ DIFFICULTY_LABEL[hike.difficulty] }}</span>
            </td>
            <td class="td-num">{{ hike.distance_km != null ? hike.distance_km + ' km' : '—' }}</td>
            <td class="td-num">{{ hike.approx_time ?? '—' }}</td>
            <td>
              <span class="info-icon">{{ hike.dog_friendly ? '✓' : '—' }}</span>
            </td>
            <td class="td-status">
              <span v-if="hike.completed" class="done-tick">✅</span>
              <span v-else class="todo-dash">—</span>
            </td>
            <td class="td-rating">{{ hike.rating != null ? '⭐ ' + hike.rating : '—' }}</td>
            <td class="td-date">{{ hike.date_completed ?? '—' }}</td>
          </tr>
        </tbody>
      </table>

      <p v-if="filtered.length === 0" class="empty-state">No hikes match your filters.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useHikeState } from '../composables/useHikeState.js'
import { DIFFICULTY_ORDER, DIFFICULTY_LABEL } from '../data/hikes.js'

const { hikes, selectHike } = useHikeState()

const search           = ref('')
const filterStatus     = ref('all')
const filterDifficulty = ref('all')
const filterProvince   = ref('all')
const filterCounty     = ref('all')
const filterDog        = ref('all')
const sortKey          = ref('id')
const sortDir          = ref('asc')

// Sorted unique counties derived from hike data
const counties = computed(() =>
  [...new Set(hikes.value.map(h => h.county).filter(Boolean))].sort()
)

const columns = [
  { key: 'id',             label: '#' },
  { key: 'name',           label: 'Name' },
  { key: 'county',         label: 'County' },
  { key: 'province',       label: 'Province' },
  { key: 'difficulty',     label: 'Difficulty' },
  { key: 'distance_km',    label: 'Distance' },
  { key: 'approx_time',    label: 'Time' },
  { key: 'dog_friendly',   label: '🐕' },
  { key: 'completed',      label: 'Status' },
  { key: 'rating',         label: 'Rating' },
  { key: 'date_completed', label: 'Date' },
]

const filtered = computed(() => {
  let list = hikes.value.filter(h => {
    if (search.value) {
      const q = search.value.toLowerCase()
      if (!h.name.toLowerCase().includes(q) &&
          !(h.irish_name ?? '').toLowerCase().includes(q) &&
          !h.province.toLowerCase().includes(q)) return false
    }
    if (filterStatus.value === 'done' && !h.completed) return false
    if (filterStatus.value === 'todo' && h.completed) return false
    if (filterDifficulty.value !== 'all' && h.difficulty !== filterDifficulty.value) return false
    if (filterProvince.value !== 'all' && h.province !== filterProvince.value) return false
    if (filterCounty.value !== 'all' && h.county !== filterCounty.value) return false
    if (filterDog.value === 'yes' && !h.dog_friendly) return false
    return true
  })

  return [...list].sort((a, b) => {
    let av = a[sortKey.value]
    let bv = b[sortKey.value]

    if (sortKey.value === 'difficulty') {
      av = DIFFICULTY_ORDER[av] ?? 0
      bv = DIFFICULTY_ORDER[bv] ?? 0
    }
    if (sortKey.value === 'completed') { av = av ? 1 : 0; bv = bv ? 1 : 0 }
    if (sortKey.value === 'dog_friendly') { av = av ? 1 : 0; bv = bv ? 1 : 0 }
    if (av == null) av = sortDir.value === 'asc' ? Infinity : -Infinity
    if (bv == null) bv = sortDir.value === 'asc' ? Infinity : -Infinity
    if (av < bv) return sortDir.value === 'asc' ? -1 : 1
    if (av > bv) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
})

function setSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}
</script>

<style scoped>
.list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.list-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 140px;
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
}
.search-input:focus { outline: none; border-color: var(--green-500); }

.filter-select {
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
}

.result-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.table-wrap { flex: 1; overflow: auto; }

.hike-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.hike-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--surface);
}

.th-sortable {
  padding: 9px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  border-bottom: 2px solid var(--border);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.th-sortable:hover { color: var(--text); }
.th-sortable.active { color: var(--green-600); }

.sort-arrow { margin-left: 3px; font-size: 10px; }

.hike-row {
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.1s;
}
.hike-row:hover { background: var(--surface); }
.hike-row.completed { background: rgba(var(--green-rgb), 0.04); }
.hike-row.completed:hover { background: rgba(var(--green-rgb), 0.08); }

.hike-row td {
  padding: 10px 12px;
  color: var(--text);
  vertical-align: middle;
}

.td-rank { font-weight: 700; color: var(--text-muted); width: 44px; }

.td-name { min-width: 180px; }
.hike-name { font-weight: 600; display: block; }
.hike-irish { font-size: 11px; color: var(--text-muted); font-style: italic; display: block; margin-top: 1px; }

.td-num { font-variant-numeric: tabular-nums; white-space: nowrap; }
.td-date { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.td-rating { font-size: 12px; white-space: nowrap; }

.info-icon { color: var(--text-muted); font-size: 13px; }

.diff-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.diff-badge.easy             { background: rgba(22,163,74,.12);  color: #16a34a; }
.diff-badge.easy-to-moderate { background: rgba(101,163,13,.12); color: #65a30d; }
.diff-badge.moderate         { background: rgba(217,119,6,.12);  color: #d97706; }
.diff-badge.moderate-to-hard { background: rgba(234,88,12,.12);  color: #ea580c; }
.diff-badge.hard             { background: rgba(220,38,38,.12);  color: #dc2626; }
.diff-badge.very-hard        { background: rgba(124,58,237,.12); color: #7c3aed; }

.td-status { text-align: center; width: 52px; }
.done-tick { font-size: 24px; line-height: 1; display: block; }
.todo-dash { font-size: 16px; color: var(--border-strong); display: block; text-align: center; }

.empty-state {
  padding: 48px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

@media (max-width: 640px) {
  .list-controls {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding: 8px 12px;
    gap: 6px;
    -webkit-overflow-scrolling: touch;
  }
  .list-controls::-webkit-scrollbar { display: none; }
  .search-input { min-width: 120px; font-size: 12px; padding: 6px 10px; }
  .filter-select { font-size: 12px; padding: 6px 8px; flex-shrink: 0; }
  .result-count { flex-shrink: 0; }

  /* Hide less essential columns on mobile */
  .hike-table th:nth-child(4),
  .hike-table td:nth-child(4),
  .hike-table th:nth-child(7),
  .hike-table td:nth-child(7),
  .hike-table th:nth-child(8),
  .hike-table td:nth-child(8),
  .hike-table th:nth-child(10),
  .hike-table td:nth-child(10),
  .hike-table th:nth-child(11),
  .hike-table td:nth-child(11) { display: none; }

  .hike-row td { padding: 9px 8px; }
  .td-name { min-width: 130px; }
  .hike-name { font-size: 12px; }
  .hike-irish { display: none; }
}
</style>
