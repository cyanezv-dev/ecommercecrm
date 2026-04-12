import axios from 'axios'
import { searchComunas } from './comunas'

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

/** Sube el logo del sitio: el backend lo guarda en disco y en `settings.site_brand_logo_url` (campo `logo`). */
export const uploadSiteBrandLogo = (file) => {
  const fd = new FormData()
  fd.append('logo', file)
  return http.post('/site-brand/logo', fd, { timeout: 60000 }).then((r) => r.data)
}

/** Actualiza nombre, razón social y/o URL del logo (solo texto) en `settings`. */
export const updateSiteBrand = (body) => api.put('/site-brand', body)

/** Quita la URL del logo en settings (el archivo en servidor no se elimina). */
export const clearSiteBrandLogo = () => api.delete('/site-brand/logo')

// ── Helpers de dominio ────────────────────────────────────────

/** Busca productos del catálogo según medida descompuesta */
export const fetchProducts = ({ ancho, perfil, aro, search, limit = 60 }) => {
  let url = `/catalog?active=true&availability=true&limit=${limit}`
  if (ancho)  url += `&ancho=${ancho}`
  if (perfil) url += `&perfil=${perfil}`
  // La DB guarda el aro con prefijo R (ej: "R16"), parseMedida devuelve solo "16"
  if (aro)    url += `&aro=${/^R/i.test(String(aro)) ? aro : 'R' + aro}`
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

/** Normaliza fila del API (columnas varían: comuna, nombre, codigo, etc.) */
function normalizeComunaRow(row) {
  if (!row || typeof row !== 'object') return null
  const nombre = String(row.nombre ?? row.comuna ?? row.name ?? '').trim()
  const codigo = String(
    row.codigo ?? row.codigo_comuna ?? row.id ?? row.glosa_codigo ?? '',
  ).trim()
  const region = String(
    row.region ?? row.nom_region ?? row.region_nombre ?? row.nombre_region ?? '',
  ).trim()
  if (!nombre && !codigo) return null
  return {
    codigo: codigo || nombre,
    nombre: nombre || codigo,
    region,
  }
}

/**
 * Autocompletar comunas: lista local + API CRM unificadas.
 * El backend suele devolver `comuna` (no `nombre`); sin esto el wizard rompía al hacer `.nombre.toLowerCase()`.
 */
export const fetchComunas = (q) => {
  const trimmed = (q || '').trim()
  if (trimmed.length < 2) return Promise.resolve([])

  const local = searchComunas(trimmed, 12)

  return api
    .get(`/comunas?search=${encodeURIComponent(trimmed)}&limit=20`)
    .then((data) => {
      const arr = Array.isArray(data) ? data : []
      const remote = arr.map(normalizeComunaRow).filter(Boolean)
      if (!remote.length) return local

      const seen = new Set(local.map((c) => String(c.codigo)))
      const merged = [...local]
      for (const r of remote) {
        const k = String(r.codigo)
        if (!seen.has(k)) {
          seen.add(k)
          merged.push(r)
        }
      }
      return merged.slice(0, 12)
    })
    .catch(() => local)
}

/** Guardar cotización en CRM */
export const saveQuote = (payload) =>
  api.post('/webhook/quote', payload)

/** Guardar orden en CRM */
export const saveOrder = (payload) =>
  api.post('/webhook/agent', payload)
