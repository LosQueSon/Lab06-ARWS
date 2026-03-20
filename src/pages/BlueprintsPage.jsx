import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  createBlueprint,
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  setCurrentBlueprint,
} from '../features/blueprints/blueprintsSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import BlueprintForm from '../components/BlueprintForm.jsx'

export default function BlueprintsPage() {
  const dispatch = useDispatch()
  const { byAuthor, current, status, byAuthorStatus, currentStatus, createStatus, error } = useSelector(
    (s) => s.blueprints,
  )
  const [authorInput, setAuthorInput] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [createMessage, setCreateMessage] = useState('')
  const items = byAuthor[selectedAuthor] || []

  useEffect(() => {
    dispatch(fetchAuthors())
  }, [dispatch])

  const totalPoints = useMemo(
    () => items.reduce((acc, bp) => acc + (bp.points?.length || 0), 0),
    [items],
  )

  const getBlueprints = () => {
    if (!authorInput) return
    setCreateMessage('')
    setSelectedAuthor(authorInput)
    dispatch(fetchByAuthor(authorInput))
  }

  const openBlueprint = (bp) => {
    dispatch(setCurrentBlueprint(bp))
    // Local-only blueprints are not available in the backend static list/detail endpoints.
    if (bp.source === 'local') return
    dispatch(fetchBlueprint({ author: bp.author, name: bp.name }))
  }

  const retryFetch = () => {
    if (!selectedAuthor) return
    dispatch(fetchByAuthor(selectedAuthor))
  }

  const handleCreate = async (payload) => {
    setCreateMessage('')
    try {
      const created = await dispatch(createBlueprint(payload)).unwrap()
      dispatch(setCurrentBlueprint(created))
      setCreateMessage('Blueprint creado correctamente')
    } catch (e) {
      setCreateMessage(`No se pudo crear el blueprint${e?.message ? `: ${e.message}` : ''}`)
    }
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '1.1fr 1.4fr', gap: 24 }}>
      <section className="grid" style={{ gap: 16 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Blueprints</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="input"
              placeholder="Author"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
            />
            <button className="btn primary" onClick={getBlueprints}>
              Get blueprints
            </button>
          </div>
          {status === 'loading' && <p style={{ marginBottom: 0 }}>Cargando autores...</p>}
          {status === 'failed' && <p style={{ color: '#f87171', marginBottom: 0 }}>{error}</p>}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            {selectedAuthor ? `${selectedAuthor}'s blueprints:` : 'Results'}
          </h3>
          {byAuthorStatus === 'loading' && <p>Cargando...</p>}
          {byAuthorStatus === 'failed' && (
            <div>
              <p style={{ color: '#f87171' }}>{error || 'Error consultando blueprints'}</p>
              <button className="btn" onClick={retryFetch}>
                Reintentar
              </button>
            </div>
          )}
          {!items.length && byAuthorStatus !== 'loading' && byAuthorStatus !== 'failed' && (
            <p>Sin resultados.</p>
          )}
          {!!items.length && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px',
                        borderBottom: '1px solid #334155',
                      }}
                    >
                      Blueprint name
                    </th>
                    <th
                      style={{
                        textAlign: 'right',
                        padding: '8px',
                        borderBottom: '1px solid #334155',
                      }}
                    >
                      Number of points
                    </th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #334155' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((bp) => (
                    <tr key={bp.name}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #1f2937' }}>
                        {bp.name}{' '}
                        {bp.source === 'local' && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginLeft: 6,
                              padding: '2px 6px',
                              borderRadius: 999,
                              fontSize: 11,
                              background: '#14532d',
                              color: '#dcfce7',
                            }}
                          >
                            local
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          textAlign: 'right',
                          borderBottom: '1px solid #1f2937',
                        }}
                      >
                        {bp.points?.length || 0}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #1f2937' }}>
                        <button className="btn" onClick={() => openBlueprint(bp)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ marginTop: 12, fontWeight: 700 }}>Total user points: {totalPoints}</p>
        </div>

        <BlueprintForm onSubmit={handleCreate} />
        {!!createMessage && (
          <p style={{ margin: 0, color: createMessage.includes('No se pudo') ? '#f87171' : '#4ade80' }}>
            {createMessage}
          </p>
        )}
        {createStatus === 'loading' && <p style={{ margin: 0 }}>Creando blueprint...</p>}
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Current blueprint: {current?.name || '—'}</h3>
        <BlueprintCanvas points={current?.points || []} />
        {currentStatus === 'loading' && <p>Cargando detalle del blueprint...</p>}
        {currentStatus === 'failed' && <p style={{ color: '#f87171' }}>{error}</p>}
      </section>
    </div>
  )
}
