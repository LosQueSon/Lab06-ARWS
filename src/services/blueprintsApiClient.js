import api from './apiClient.js'

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const normalizePoint = (point) => ({
  x: toNumber(point?.x),
  y: toNumber(point?.y),
})

const normalizePoints = (points) => {
  if (!Array.isArray(points)) return []
  return points.map(normalizePoint)
}

const normalizeBlueprint = (bp, fallbackAuthor = '') => ({
  author: bp?.author || fallbackAuthor || 'unknown',
  name: bp?.name || bp?.bpname || bp?.id || 'unnamed',
  points: normalizePoints(bp?.points),
  source: 'server',
})

const blueprintsApiClient = {
  async getAll() {
    const { data } = await api.get('/blueprints')
    if (!Array.isArray(data)) return []
    return data.map((bp) => normalizeBlueprint(bp))
  },

  async getByAuthor(author) {
    const { data } = await api.get(`/blueprints/${encodeURIComponent(author)}`)
    if (!Array.isArray(data)) return []

    const baseItems = data.map((bp) => normalizeBlueprint(bp, author))

    // Some backends return summary items without points in this endpoint.
    // Try to enrich each item with the detailed endpoint when needed.
    const enriched = await Promise.all(
      baseItems.map(async (bp) => {
        if (bp.points.length > 0 || !bp.name) return bp
        try {
          const detail = await blueprintsApiClient.getByAuthorAndName(author, bp.name)
          return {
            ...bp,
            ...detail,
            points: detail.points.length ? detail.points : bp.points,
          }
        } catch {
          return bp
        }
      }),
    )

    return enriched
  },

  async getByAuthorAndName(author, name) {
    const { data } = await api.get(
      `/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
    )
    return normalizeBlueprint(data, author)
  },

  async create(payload) {
    const requestPayload = {
      author: String(payload?.author || ''),
      name: String(payload?.name || ''),
      points: JSON.stringify(Array.isArray(payload?.points) ? payload.points : []),
    }

    const { data } = await api.post('/blueprints', requestPayload)
    const created = normalizeBlueprint(data, payload?.author)
    const fallbackPoints = normalizePoints(payload?.points)

    return {
      ...created,
      points: created.points.length ? created.points : fallbackPoints,
      source: 'local',
    }
  },
}

export default blueprintsApiClient