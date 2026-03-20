import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import blueprintsService from '../../services/blueprintsService.js'

export const fetchAuthors = createAsyncThunk('blueprints/fetchAuthors', async () => {
  const data = await blueprintsService.getAll()
  // Expecting API returns array of {author, name, points}
  const authors = [...new Set(data.map((bp) => bp.author))]
  return authors
})

export const fetchByAuthor = createAsyncThunk('blueprints/fetchByAuthor', async (author) => {
  const data = await blueprintsService.getByAuthor(author)
  return { author, items: data }
})

export const fetchBlueprint = createAsyncThunk(
  'blueprints/fetchBlueprint',
  async ({ author, name }) => {
    return blueprintsService.getByAuthorAndName(author, name)
  },
)

export const createBlueprint = createAsyncThunk('blueprints/createBlueprint', async (payload) => {
  return blueprintsService.create(payload)
})

const slice = createSlice({
  name: 'blueprints',
  initialState: {
    authors: [],
    byAuthor: {},
    current: null,
    status: 'idle',
    byAuthorStatus: 'idle',
    currentStatus: 'idle',
    createStatus: 'idle',
    error: null,
  },
  reducers: {
    setCurrentBlueprint: (s, a) => {
      s.current = a.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthors.pending, (s) => {
        s.status = 'loading'
        s.error = null
      })
      .addCase(fetchAuthors.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.authors = a.payload.filter(Boolean)
      })
      .addCase(fetchAuthors.rejected, (s, a) => {
        s.status = 'failed'
        s.error = a.error.message
      })
      .addCase(fetchByAuthor.pending, (s) => {
        s.byAuthorStatus = 'loading'
        s.error = null
      })
      .addCase(fetchByAuthor.fulfilled, (s, a) => {
        s.byAuthorStatus = 'succeeded'
        const author = a.payload.author
        const serverItems = a.payload.items || []
        const previousItems = s.byAuthor[author] || []

        const merged = [...serverItems]
        for (const localItem of previousItems) {
          const idx = merged.findIndex((it) => it.name === localItem.name)
          if (idx === -1) {
            merged.push(localItem)
            continue
          }

          // Keep richer local data when server returns static/minimal shape.
          const serverItem = merged[idx]
          if ((localItem.points?.length || 0) > (serverItem.points?.length || 0)) {
            merged[idx] = { ...serverItem, ...localItem }
          }
        }

        s.byAuthor[author] = merged
      })
      .addCase(fetchByAuthor.rejected, (s, a) => {
        s.byAuthorStatus = 'failed'
        s.error = a.error.message
      })
      .addCase(fetchBlueprint.pending, (s) => {
        s.currentStatus = 'loading'
        s.error = null
      })
      .addCase(fetchBlueprint.fulfilled, (s, a) => {
        s.currentStatus = 'succeeded'
        const incoming = a.payload
        const current = s.current

        if (
          current &&
          current.author === incoming.author &&
          current.name === incoming.name &&
          (current.points?.length || 0) > (incoming.points?.length || 0)
        ) {
          s.current = { ...incoming, points: current.points }
          return
        }

        s.current = incoming
      })
      .addCase(fetchBlueprint.rejected, (s, a) => {
        s.currentStatus = 'failed'
        s.error = a.error.message
      })
      .addCase(createBlueprint.pending, (s) => {
        s.createStatus = 'loading'
        s.error = null
      })
      .addCase(createBlueprint.fulfilled, (s, a) => {
        s.createStatus = 'succeeded'
        const bp = a.payload
        if (!s.byAuthor[bp.author]) {
          s.byAuthor[bp.author] = []
        }

        const idx = s.byAuthor[bp.author].findIndex((it) => it.name === bp.name)
        if (idx === -1) {
          s.byAuthor[bp.author].push(bp)
        } else {
          s.byAuthor[bp.author][idx] = { ...s.byAuthor[bp.author][idx], ...bp }
        }
      })
      .addCase(createBlueprint.rejected, (s, a) => {
        s.createStatus = 'failed'
        s.error = a.error.message
      })
  },
})

export const { setCurrentBlueprint } = slice.actions

export default slice.reducer
