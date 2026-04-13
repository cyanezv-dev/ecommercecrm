import { useEffect } from 'react'
import { useBrandStore } from '@/store/brand'

function applyFaviconHref(href, faviconUrl) {
  const link = document.getElementById('ecommerce-favicon-link')
  if (!link) return
  link.href = href
  const base = (faviconUrl || href).split('?')[0].toLowerCase()
  if (base.endsWith('.svg')) link.type = 'image/svg+xml'
  else if (base.endsWith('.ico')) link.type = 'image/x-icon'
  else link.type = 'image/png'
}

/** Carga `/api/site-brand` una vez al abrir la app y aplica favicon desde la API o datos de empresa. */
export default function BrandBootstrap() {
  const hydrate = useBrandStore((s) => s.hydrate)
  const faviconUrl = useBrandStore((s) => s.faviconUrl)
  const loaded = useBrandStore((s) => s.loaded)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!loaded) return
    const u = faviconUrl && String(faviconUrl).trim()
    if (!u) {
      applyFaviconHref(`${window.location.origin}/favicon.svg`, null)
      return
    }
    applyFaviconHref(u, u)
  }, [loaded, faviconUrl])

  return null
}
