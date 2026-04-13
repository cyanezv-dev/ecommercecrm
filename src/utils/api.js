import axios from 'axios'
import { searchComunas } from './comunas'
import { canonicalMedidaFilterId } from './format.js'
import { extractMedidaLabelFromCatalogProduct } from './catalogToResults'

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
 * Leadflow expone rutas bajo `/api/...`. Si la URL pública es solo el origen
 * (ej. `https://mi-servidor.railway.app`), axios + `/site-brand` pegaría en
 * `/site-brand` y responde 404. Se añade `/api` solo cuando el path es `/` o vacío.
 */
function looksLikePlaceholderApiUrl(v) {
  const t = String(v || '').trim().toLowerCase()
  if (!t) return false
  return (
    t.includes('tu_dominio') ||
    t.includes('reemplaza') ||
    t.includes('tudominio') ||
    /^https?:\/\/example\.com/i.test(t)
  )
}

let warnedPlaceholderApiUrl = false

/**
 * Normaliza la base del API Leadflow (axios `baseURL`).
 *
 * Si la base es solo el origen (`https://host`) sin path, axios resuelve
 * `GET /catalog` como `https://host/catalog` (Express: «Cannot GET /catalog»).
 * La base correcta termina en `/api` para que la petición sea `…/api/catalog`.
 *
 * También corrige el error típico de pegar la URL del listado (`…/catalog`)
 * como si fuera la base del API.
 */
export function normalizeLeadflowApiBase(input) {
  const s = String(input || '').trim()
  if (!s) return ''
  if (s.startsWith('/')) {
    const t = s.replace(/\/+$/, '')
    return t || '/'
  }
  try {
    const u = new URL(s)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return s.replace(/\/$/, '')
    let path = (u.pathname || '/').replace(/\/+$/, '') || ''
    if (path === '/catalog' || path.endsWith('/catalog')) {
      path = path.replace(/\/catalog$/u, '') || ''
      path = path.replace(/\/+$/, '') || ''
    }
    if (path === '' || path === '/') {
      u.pathname = '/api'
    } else {
      u.pathname = path.startsWith('/') ? path : `/${path}`
    }
    return u.toString().replace(/\/$/, '')
  } catch {
    return s.replace(/\/$/, '')
  }
}

/**
 * Base del API:
 * - Si `VITE_API_URL` apunta a localhost y abrís el front desde localhost (dev o
 *   `vite preview`), usamos `/api` para pasar por el proxy de Vite → Leadflow.
 * - En prod en un dominio real, se usa la URL embebida (p. ej. HTTPS en DigitalOcean).
 */
function resolveApiBase() {
  let raw = import.meta.env.VITE_API_URL?.trim()
  if (import.meta.env.PROD && raw && looksLikePlaceholderApiUrl(raw)) {
    if (typeof window !== 'undefined' && !warnedPlaceholderApiUrl) {
      warnedPlaceholderApiUrl = true
      console.warn(
        '[Leadflow] VITE_API_URL parece un placeholder; ignorando. ' +
          'Configura la URL real del API en el build o en api-config.json (apiBaseUrl).',
      )
    }
    raw = ''
  }
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
    return normalizeLeadflowApiBase(raw) || '/api'
  }

  return (raw ? normalizeLeadflowApiBase(raw) : '') || '/api'
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
      return normalizeLeadflowApiBase(w) || w.replace(/\/$/, '')
    }
  }
  return resolveApiBase()
}

/** Base del API tal como la usa axios (útil para mensajes de error en UI). */
export function getResolvedApiBase() {
  return getApiBase()
}

/**
 * URL completa aproximada de un request fallido (axios pone `config.baseURL` + `config.url`).
 */
export function axiosRequestDisplayUrl(err) {
  const c = err?.config
  if (!c?.url) return ''
  const base = String(c.baseURL || '').replace(/\/$/, '')
  const path = String(c.url || '')
  if (/^https?:\/\//i.test(path)) return path
  if (!base) return path
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * True si el API se está llamando en el mismo origen que la página (típico static site
 * sin proxy): `/api` relativo o `https://mitienda.com/api` mientras la tienda es mitienda.com.
 */
export function apiBaseLooksSameOriginAsStorefront() {
  if (typeof window === 'undefined') return false
  const b = getApiBase()
  if (!b || b.startsWith('/')) return true
  try {
    return new URL(b).origin === window.location.origin
  } catch {
    return false
  }
}

const API_BASE = resolveApiBase()

/**
 * Timeout por defecto de todas las llamadas al API.
 * El catálogo en producción puede superar fácilmente 15s (consultas / DB); si el
 * default fuera 15000, el usuario ve "timeout of 15000ms" aunque el servidor
 * termine respondiendo poco después.
 */
const HTTP_TIMEOUT_MS = 60000

/** Catálogo y medidas: mismo techo que el cliente (consultas pesadas). */
const CATALOG_HTTP_TIMEOUT_MS = HTTP_TIMEOUT_MS

export const http = axios.create({
  baseURL: API_BASE,
  timeout: HTTP_TIMEOUT_MS,
})

http.interceptors.request.use((config) => {
  const b = getApiBase()
  if (b) {
    config.baseURL = normalizeLeadflowApiBase(b) || b.replace(/\/$/, '')
  }
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

/** Actualiza nombre, razón social y/o URLs del logo y favicon (solo texto) en `settings`. */
export const updateSiteBrand = (body) => api.put('/site-brand', body)

/** Quita la URL del logo en settings (el archivo en servidor no se elimina). */
export const clearSiteBrandLogo = () => api.delete('/site-brand/logo')

/** Sube favicon del sitio → `settings.site_brand_favicon_url` (multipart campo `favicon`). */
export const uploadSiteBrandFavicon = (file) => {
  const fd = new FormData()
  fd.append('favicon', file)
  return http.post('/site-brand/favicon', fd, { timeout: 60000 }).then((r) => r.data)
}

/** Quita la URL del favicon en site_brand (sigue aplicando company_favicon_url si existe). */
export const clearSiteBrandFavicon = () => api.delete('/site-brand/favicon')

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
  const r1 = await http.get(url1, { timeout: CATALOG_HTTP_TIMEOUT_MS })
  const n1 = normalizeCatalogResponse(r1.data)
  if (n1.products?.length) return n1
  const url2 = buildCatalogQuery(params, { requireAvailability: false })
  const r2 = await http.get(url2, { timeout: CATALOG_HTTP_TIMEOUT_MS })
  const n2 = normalizeCatalogResponse(r2.data)
  if (n2.products?.length) return n2
  return attachEmptyDebug(n2, r2.config, r2.data)
}

/**
 * Convierte una fila o primitivo del API en texto de medida (p. ej. "205/55R16").
 */
function medidaLabelFromMedidasRow(row) {
  if (row == null) return ''
  if (typeof row === 'string' || typeof row === 'number') {
    const s = String(row).trim()
    return s && s !== '—' ? s : ''
  }
  if (typeof row !== 'object') return ''
  const o = row
  const s = String(
    o.medida ??
      o.medida_texto ??
      o.medidaTexto ??
      o.size ??
      o.tire_size ??
      o.tireSize ??
      o.label ??
      o.nombre ??
      o.name ??
      o.value ??
      o.glosa ??
      o.text ??
      o.codigo_medida ??
      o.codigoMedida ??
      '',
  ).trim()
  if (s && s !== '—') return s
  const a = String(o.ancho ?? o.width ?? o.Ancho ?? '').trim()
  const perf = String(o.perfil ?? o.profile ?? o.Perfil ?? '').trim()
  let ar = String(o.aro ?? o.diameter ?? o.Aro ?? '').trim()
  if (/^r/i.test(ar)) ar = ar.slice(1)
  if (a && perf && ar) return `${a}/${perf}R${ar}`
  return ''
}

/**
 * Algunos CRM devuelven medidas como mapa `{ "205/55R16": true, … }` en lugar de array.
 */
function medidasFromKeyedMap(node) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return null
  const keys = Object.keys(node)
  if (!keys.length) return null
  const looksLikeTireToken = (k) => {
    const t = String(k).trim()
    if (!t || t.length < 5) return false
    return /^\d{2,3}\s*[\/-]/.test(t) || /\d{2}\s*[Rr]\s*\d{2}\b/.test(t)
  }
  const scored = keys.filter(looksLikeTireToken)
  if (scored.length === 0) return null
  return scored.map((k) => String(k).trim())
}

/**
 * Unifica la respuesta de `GET /catalog/medidas` cuando el CRM no usa `{ medidas: [] }`:
 * array plano, `{ data: [] }`, filas `{ medida: "…" }`, mapas con claves tipo medida, etc.
 */
export function normalizeCatalogMedidasPayload(payload) {
  if (payload == null) return []
  if (typeof payload === 'string') {
    try {
      return normalizeCatalogMedidasPayload(JSON.parse(payload))
    } catch {
      return []
    }
  }
  if (Array.isArray(payload)) {
    const out = []
    for (const row of payload) {
      const label = medidaLabelFromMedidasRow(row)
      if (label) out.push(label)
    }
    return out
  }
  if (typeof payload !== 'object') return []

  const p = payload
  const tryArray = (node) => {
    if (!Array.isArray(node)) return null
    const out = []
    for (const row of node) {
      const label = medidaLabelFromMedidasRow(row)
      if (label) out.push(label)
    }
    return out.length ? out : null
  }

  const direct =
    tryArray(p.medidas) ||
    tryArray(p.distinct_medidas) ||
    tryArray(p.distinctMedidas) ||
    tryArray(p.sizes) ||
    tryArray(p.items) ||
    tryArray(p.results) ||
    tryArray(p.values) ||
    tryArray(p.rows) ||
    tryArray(p.records) ||
    tryArray(p.list) ||
    tryArray(p.content) ||
    tryArray(p.payload) ||
    tryArray(p.result)
  if (direct) return direct

  const fromMap =
    medidasFromKeyedMap(p.medidas) ||
    medidasFromKeyedMap(p.sizes) ||
    medidasFromKeyedMap(p.distinct_medidas) ||
    (p.data && typeof p.data === 'object' && !Array.isArray(p.data)
      ? medidasFromKeyedMap(p.data.medidas) || medidasFromKeyedMap(p.data.sizes)
      : null)
  if (fromMap) return fromMap

  if (p.data != null) {
    if (Array.isArray(p.data)) {
      const fromData = tryArray(p.data)
      if (fromData) return fromData
    } else if (typeof p.data === 'object') {
      const nested = p.data
      const fromNested =
        tryArray(nested.medidas) ||
        tryArray(nested.distinct_medidas) ||
        tryArray(nested.items) ||
        tryArray(nested.results) ||
        tryArray(nested.sizes) ||
        tryArray(nested.list) ||
        tryArray(nested.records)
      if (fromNested) return fromNested
    }
  }

  return []
}

function mergeMedidaStringListsDeduped(a, b) {
  const byId = new Map()
  const push = (label) => {
    const l = String(label || '').trim()
    if (!l || l === '—') return
    const id = canonicalMedidaFilterId(l) || l.replace(/\s+/g, '-').replace(/\//g, '-')
    if (!byId.has(id)) byId.set(id, l)
  }
  for (const x of a || []) push(x)
  for (const x of b || []) push(x)
  return [...byId.values()].sort((x, y) =>
    x.localeCompare(y, 'es', { numeric: true, sensitivity: 'base' }),
  )
}

/**
 * Si `/catalog/medidas` viene vacío o casi vacío, deduce medidas de una muestra amplia
 * de `/catalog` sin filtrar por medida (mismos productos que expone el CRM en listado general).
 */
async function fetchDistinctMedidasFromCatalogSample(limit) {
  const lim = Math.min(Math.max(Number(limit) || 250, 40), 500)
  const urls = [
    `/catalog?active=true&limit=${lim}&availability=false`,
    `/catalog?active=true&limit=${lim}&availability=true`,
  ]
  const byId = new Map()
  const push = (label) => {
    const l = String(label || '').trim()
    if (!l || l === '—') return
    const id = canonicalMedidaFilterId(l) || l.replace(/\s+/g, '-').replace(/\//g, '-')
    if (!byId.has(id)) byId.set(id, l)
  }
  for (const url of urls) {
    try {
      const r = await http.get(url, { timeout: CATALOG_HTTP_TIMEOUT_MS })
      const n = normalizeCatalogResponse(r.data)
      for (const p of n.products || []) {
        const m = extractMedidaLabelFromCatalogProduct(p)
        if (m) push(m)
      }
      if (byId.size > 30) break
    } catch {
      /* ignore */
    }
  }
  return [...byId.values()].sort((x, y) =>
    x.localeCompare(y, 'es', { numeric: true, sensitivity: 'base' }),
  )
}

/**
 * Medidas distintas desde `GET /catalog?search=…` (sin ancho/perfil/aro). Útil cuando
 * `/catalog/medidas?q=` no devuelve datos pero el listado de productos sí acepta `search`.
 */
export async function fetchDistinctMedidasFromCatalogSearch({ search, limit = 200 } = {}) {
  const q = String(search || '').trim()
  if (!q) return []
  const lim = Math.min(Math.max(Number(limit) || 200, 30), 500)
  const enc = encodeURIComponent(q)
  const tryUrls = [
    `/catalog?active=true&limit=${lim}&availability=false&search=${enc}`,
    `/catalog?active=true&limit=${lim}&availability=true&search=${enc}`,
  ]
  const byId = new Map()
  const push = (label) => {
    const l = String(label || '').trim()
    if (!l || l === '—') return
    const id = canonicalMedidaFilterId(l) || l.replace(/\s+/g, '-').replace(/\//g, '-')
    if (!byId.has(id)) byId.set(id, l)
  }
  for (const url of tryUrls) {
    try {
      const r = await http.get(url, { timeout: CATALOG_HTTP_TIMEOUT_MS })
      const n = normalizeCatalogResponse(r.data)
      for (const p of n.products || []) {
        const m = extractMedidaLabelFromCatalogProduct(p)
        if (m) push(m)
      }
      if (byId.size) {
        return [...byId.values()].sort((x, y) =>
          x.localeCompare(y, 'es', { numeric: true, sensitivity: 'base' }),
        )
      }
    } catch {
      /* ignore */
    }
  }
  return []
}

/** Lista de medidas distintas del catálogo (para filtro / autocomplete en resultados). */
export async function fetchCatalogMedidas({ q = '', limit = 300 } = {}) {
  const sp = new URLSearchParams()
  const qs = String(q || '').trim()
  if (qs) sp.set('q', qs)
  sp.set('limit', String(Math.min(Math.max(Number(limit) || 300, 10), 500)))
  const d = await http
    .get(`/catalog/medidas?${sp.toString()}`, { timeout: CATALOG_HTTP_TIMEOUT_MS })
    .then((r) => r.data)
  let medidas = mergeMedidaStringListsDeduped(normalizeCatalogMedidasPayload(d), [])
  /* Pocas medidas distintas: API duplicada, vacía o estructura rara → completar con muestra de /catalog */
  if (!qs && medidas.length < 12) {
    const sample = await fetchDistinctMedidasFromCatalogSample(
      Math.min(Math.max(Number(limit) || 300, 10), 500),
    )
    medidas = mergeMedidaStringListsDeduped(medidas, sample)
  }
  return { medidas }
}

/** Talleres disponibles para instalación */
export const fetchWorkshops = ({ fecha, aro, lat, lng } = {}) => {
  const q = new URLSearchParams()
  if (fecha) q.set('fecha', String(fecha))
  if (aro) q.set('aro', String(aro))
  if (lat != null && lat !== '' && lng != null && lng !== '') {
    q.set('lat', String(lat))
    q.set('lng', String(lng))
  }
  const qs = q.toString()
  return api.get(`/attention/workshops${qs ? `?${qs}` : ''}`)
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

  const local = searchComunas(trimmed, 60)

  return api
    .get(`/comunas?search=${encodeURIComponent(trimmed)}&limit=80`)
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
      return merged.slice(0, 80)
    })
    .catch(() => local)
}

/** Guardar cotización en CRM */
export const saveQuote = (payload) =>
  api.post('/webhook/quote', payload)

/** Guardar orden en CRM */
export const saveOrder = (payload) =>
  api.post('/webhook/agent', payload)
