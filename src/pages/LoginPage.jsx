import { useState } from 'react'
import api from '../services/apiClient.js'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
      const authBase = import.meta.env.VITE_AUTH_BASE_URL || apiBase.replace(/\/api\/?$/, '')

      const { data } = await api.post('/auth/login', { username, password }, { baseURL: authBase })
      const token = data?.access_token || data?.token
      if (!token) {
        throw new Error('Token no encontrado en la respuesta')
      }
      localStorage.setItem('token', token)
      alert('Login exitoso')
    } catch (e) {
      const status = e?.response?.status
      const backendError = e?.response?.data?.error

      if (status === 401) {
        setError('Credenciales invalidas')
        return
      }

      if (status === 404) {
        setError('Endpoint /auth/login no encontrado. Revisa VITE_AUTH_BASE_URL.')
        return
      }

      if (backendError) {
        setError(`Error del servidor: ${backendError}`)
        return
      }

      setError('Servidor no disponible o configuracion incorrecta')
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <div className="grid cols-2">
        <div>
          <label>Usuario</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Contraseña</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
      <button className="btn primary" style={{ marginTop: 12 }}>
        Ingresar
      </button>
    </form>
  )
}
