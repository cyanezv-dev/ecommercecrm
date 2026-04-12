import axios from 'axios'
import { searchComunas } from './comunas'

function isLoopbackHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function browsingLocalhost() {
  return (
    typeof window !== 'undefined' &&
    isLoopbackHost(window.location.hostname)
  )
}

/**
 * Base del API:
 * - Si `VITE_API_URL` apunta a localhost y abrís el front desde localhost (dev o
 *   `vite preview`), usamos `/api` para pasar por el proxy de Vite → Leadflow.
 * - En prod en un dominio real, se usa la URL embebida (p. ej. HTTPS en DigitalOcean).
 */
function resolveApiBase() {
  const raw = import.meta.env.VITE_API_URL?.trim()
  const localBrowser = browsingLocalhost()

  if (raw) {
    try {
      const u = new URL(raw)
      if (isLoopbackHost(u.hostname) && localBrowser) {
        return '/api'
      }
    } catch {
      /* URL inválida */
    }
  }

  if (import.meta.env.DEV) {
    if (!raw) return '/api'
    try {
      const u = new URL(raw)
      if (isLoopbackHost(u.hostname)) return '/api'
    } catch {
      /* */
    }
    return raw
  }

  return raw || '/api'
}

/** Seteado en runtime por `loadPublicApiConfig()` (p. ej. desde `public/api-config.json`). */
function getApiBase() {
  if (typeof window !== 'undefined' && window.__ECOMM_API_BASE__) {
    const w = String(window.__ECOMM_API_BASE__).trim()
    if (w) {
      try {
        const u = new URL(w)
        if (isLoopbackHost(u.hostname) && browsingLocalhost()) {
          return '/api'
        }
      } catch {
        /* */
      }
      return w.replace(/\/$/, '')
    }
  }
  return resolveApiBase()
}

const API_BASE = resolveApiBase()

export const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const b = getApiBase()
  if (b) config.baseURL = b
  return config
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

function looksLikeProductRow(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false
  const keys = Object.keys(o)
  if (keys.length >= 6) return true
  const lower = keys.map((k) => k.toLowerCase())
  const hints = [
    'id',
    'sku',
    'codigo',
    'product',
    'name',
    'nombre',
    'titulo',
    'marca',
    'brand',
    'price',
    'precio',
    'ancho',
    'medida',
    'stock',
    'modelo',
    'fabricante',
    'valor',
    'title',
  ]
  for (const h of hints) {
    if (lower.some((k) => k === h || k.includes(h) || h.includes(k))) return true
  }
  return false
}

/** Recorre JSON del API buscando el primer array de objetos tipo producto (respuestas anidadas tipo Leadflow). */
function findProductArrayInPayload(root, seen = new WeakSet(), depth = 0) {
  if (depth > 10 || root == null || typeof root !== 'object') return null
  if (seen.has(root)) return null
  seen.add(root)
  if (Array.isArray(root)) {
    const sample = root.find((x) => x && typeof x === 'object' && !Array.isArray(x))
    if (sample && looksLikeProductRow(sample)) return root
    for (const item of root) {
      if (item && typeof item === 'object') {
        const inner = findProductArrayInPayload(item, seen, depth + 1)
        if (inner) return inner
      }
    }
    return null
  }
  for (const v of Object.values(root)) {
    if (v && typeof v === 'object') {
      const inner = findProductArrayInPayload(v, seen, depth + 1)
      if (inner) return inner
    }
  }
  return null
}

/** Convierte `{ "12": { ... }, "34": { ... } }` en array de filas. */
function recordMapToArray(val) {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return null
  const values = Object.values(val)
  if (
    values.length > 0 &&
    values.every((v) => v && typeof v === 'object' && !Array.isArray(v))
  ) {
    return values
  }
  return null
}

/** Último recurso: el array de objetos más largo (evita arrays de strings). */
function findLargestObjectArray(root, seen = new WeakSet(), depth = 0) {
  let best = null
  function walk(node, d) {
    if (d > 12 || node == null || typeof node !== 'object') return
    if (seen.has(node)) return
    seen.add(node)
    if (Array.isArray(node)) {
      const objs = node.filter((x) => x && typeof x === 'object' && !Array.isArray(x))
      if (objs.length === 0) {
        for (const item of node) walk(item, d + 1)
        return
      }
      const sample = objs[0]
      if (looksLikeProductRow(sample) && (!best || objs.length > best.length)) {
        best = objs
      }
      for (const item of node) walk(item, d + 1)
      return
    }
    for (const v of Object.values(node)) walk(v, d + 1)
  }
  walk(root, depth)
  return best
}

/**
 * Unifica la respuesta de `/catalog` (Leadflow u otros): suele variar entre
 * `{ products }`, `{ data: [] }`, `{ data: { products } }`, `items`, `catalog`, `productos` o un array plano.
 */
export function normalizeCatalogResponse(payload) {
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload)
      return normalizeCatalogResponse(parsed)
    } catch {
      return { products: [] }
    }
  }
  if (Array.isArray(payload)) {
    return { products: payload }
  }
  if (!payload || typeof payload !== 'object') {
    return { products: [] }
  }
  const p = payload
  let products = p.products
  if (!Array.isArray(products)) {
    const asArr = recordMapToArray(products)
    if (asArr) products = asArr
  }
  if (!Array.isArray(products) && p.data != null) {
    if (Array.isArray(p.data)) {
      products = p.data
    } else if (typeof p.data === 'object') {
      const nested = p.data.products ?? p.data.items ?? p.data.records ?? p.data.list
      if (Array.isArray(nested)) {
        products = nested
      } else {
        const fromMap = recordMapToArray(p.data)
        if (fromMap) products = fromMap
      }
    }
  }
  if (!Array.isArray(products)) {
    products =
      p.catalog ??
      p.items ??
      p.results ??
      p.productos ??
      p.rows ??
      p.list ??
      p.records ??
      p.content ??
      []
  }
  if (!Array.isArray(products)) {
    const fromMap = recordMapToArray(products)
    products = fromMap || []
  }
  if (products.length === 0) {
    const discovered = findProductArrayInPayload(p)
    if (discovered?.length) {
      products = discovered
    }
  }
  if (products.length === 0) {
    const loose = findLargestObjectArray(p)
    if (loose?.length) {
      products = loose
    }
  }
  return { ...p, products }
}

function buildCatalogQuery({ ancho, perfil, aro, search, limit = 60 }, { requireAvailability }) {
  let url = `/catalog?active=true&limit=${limit}`
  if (requireAvailability) url += `&availability=true`
  if (ancho) url += `&ancho=${encodeURIComponent(String(ancho))}`
  if (perfil) url += `&perfil=${encodeURIComponent(String(perfil))}`
  // La DB guarda el aro con prefijo R (ej: "R16"), parseMedida devuelve solo "16"
  if (aro) {
    const a = /^R/i.test(String(aro)) ? aro : `R${aro}`
    url += `&aro=${encodeURIComponent(String(a))}`
  }
  if (search) url += `&search=${encodeURIComponent(search)}`
  return url
}

function buildResolvedUrl(configUrl) {
  const rel = String(configUrl || '')
  if (rel.startsWith('http')) return rel
  const base = String(getApiBase() || '')
  try {
    if (base.startsWith('http')) {
      const root = base.endsWith('/') ? base : `${base}/`
      return new URL(rel.replace(/^\//, ''), root).href
    }
    if (typeof window !== 'undefined') {
      const path = `${base.replace(/\/$/, '')}/${rel.replace(/^\//, '')}`.replace(/\/+/g, '/')
      return new URL(path, window.location.origin).href
    }
  } catch {
    /* ignore */
  }
  return rel
}

function attachEmptyDebug(norm, axiosCfg, rawPayload) {
  if (norm.products?.length) return norm
  const keys =
    rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload)
      ? Object.keys(rawPayload)
      : Array.isArray(rawPayload)
        ? ['<array>']
        : [typeof rawPayload]
  return {
    ...norm,
    __catalogDebug: {
      requestUrl: buildResolvedUrl(axiosCfg?.url || ''),
      topLevelKeys: keys.slice(0, 40),
    },
  }
}

/** Busca productos del catálogo según medida descompuesta */
export async function fetchProducts({ ancho, perfil, aro, search, limit = 60 }) {
  const params = { ancho, perfil, aro, search, limit }
  const url1 = buildCatalogQuery(params, { requireAvailability: true })
  const r1 = await http.get(url1)
  const n1 = normalizeCatalogResponse(r1.data)
  if (n1.products?.length) return n1
  const url2 = buildCatalogQuery(params, { requireAvailability: false })
  const r2 = await http.get(url2)
  const n2 = normalizeCatalogResponse(r2.data)
  if (n2.products?.length) return n2
  return attachEmptyDebug(n2, r2.config, r2.data)
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
