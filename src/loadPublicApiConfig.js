/**
 * En producción, si el build no definió `VITE_API_URL`, intentamos leer
 * `public/api-config.json` (mismo origen que el static site).
 * En Digital Ocean podés generar ese archivo en `build_command` desde un secreto.
 */
export async function loadPublicApiConfig() {
  if (import.meta.env.DEV) return
  if (import.meta.env.VITE_API_URL?.trim()) return

  const path = `${import.meta.env.BASE_URL}api-config.json`.replace(/\/{2,}/g, '/')
  try {
    const r = await fetch(path, { cache: 'no-store' })
    if (!r.ok) return
    const j = await r.json()
    const url = typeof j?.apiBaseUrl === 'string' ? j.apiBaseUrl.trim() : ''
    if (url) {
      window.__ECOMM_API_BASE__ = url.replace(/\/$/, '')
    }
  } catch {
    /* sin archivo o JSON inválido: se usa resolveApiBase() en api.js */
  }
}
