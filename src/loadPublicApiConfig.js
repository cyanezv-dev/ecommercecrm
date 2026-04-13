import { normalizeLeadflowApiBase } from '@/utils/api'

/**
 * En producción lee `public/api-config.json` (mismo origen que el static site).
 * Si trae `apiBaseUrl`, define `window.__ECOMM_API_BASE__` y **pisa** la URL embebida
 * en el build (`VITE_API_URL`): sirve para corregir despliegues sin rebuild.
 *
 * DigitalOcean: el `build_command` puede escribir este JSON desde un secreto.
 */
export async function loadPublicApiConfig() {
  if (import.meta.env.DEV) return

  const path = `${import.meta.env.BASE_URL}api-config.json`.replace(/\/{2,}/g, '/')
  try {
    const r = await fetch(path, { cache: 'no-store' })
    if (!r.ok) return
    const j = await r.json()
    const url = typeof j?.apiBaseUrl === 'string' ? j.apiBaseUrl.trim() : ''
    if (url) {
      window.__ECOMM_API_BASE__ = normalizeLeadflowApiBase(url) || url.replace(/\/$/, '')
    }
  } catch {
    /* sin archivo o JSON inválido: se usa resolveApiBase() en api.js */
  }
}
