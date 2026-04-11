import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
})

const api = {
  get:    (url, cfg)  => http.get(url, cfg).then(r => r.data),
  post:   (url, data) => http.post(url, data).then(r => r.data),
  put:    (url, data) => http.put(url, data).then(r => r.data),
  patch:  (url, data) => http.patch(url, data).then(r => r.data),
  delete: (url)       => http.delete(url).then(r => r.data),
}

export default api

// ── Helpers de dominio ────────────────────────────────────────

/** Busca productos del catálogo según medida descompuesta */
export const fetchProducts = ({ ancho, perfil, aro, search, limit = 60 }) => {
  let url = `/catalog?active=true&availability=true&limit=${limit}`
  if (ancho)  url += `&ancho=${ancho}`
  if (perfil) url += `&perfil=${perfil}`
  if (aro)    url += `&aro=${aro}`
  if (search) url += `&search=${encodeURIComponent(search)}`
  return api.get(url)
}

/** Talleres disponibles para instalación */
export const fetchWorkshops = ({ fecha, aro, lat, lng } = {}) => {
  let url = `/attention/workshops?`
  if (fecha) url += `fecha=${fecha}&`
  if (aro)   url += `aro=${aro}&`
  if (lat)   url += `lat=${lat}&lng=${lng}&`
  return api.get(url)
}

/** Regla de entrega para una comuna */
export const fetchDeliveryRule = (comunaCodigo) =>
  api.get(`/delivery-rules/lookup?comuna_codigo=${comunaCodigo}`)

/** Autocompletar comunas */
export const fetchComunas = (q) =>
  api.get(`/comunas?search=${encodeURIComponent(q)}&limit=8`)

/** Guardar cotización en CRM */
export const saveQuote = (payload) =>
  api.post('/webhook/quote', payload)

/** Guardar orden en CRM */
export const saveOrder = (payload) =>
  api.post('/webhook/agent', payload)
