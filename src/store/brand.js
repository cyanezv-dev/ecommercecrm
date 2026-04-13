import { create } from 'zustand'
import { BRAND_DEFAULTS } from '@/config/brandDefaults'
import api from '@/utils/api'

export const useBrandStore = create((set, get) => ({
  name: BRAND_DEFAULTS.name,
  logoUrl: BRAND_DEFAULTS.logoUrl,
  faviconUrl: BRAND_DEFAULTS.faviconUrl,
  legalName: BRAND_DEFAULTS.legalName,
  loaded: false,
  error: null,

  /** `force=true` vuelve a pedir al backend (útil tras subir logo o favicon). */
  async hydrate(force = false) {
    if (get().loaded && !force) return
    try {
      const d = await api.get('/site-brand')
      const logoRaw = d?.logoUrl ?? d?.logo_url ?? d?.company_logo_url
      const nameRaw = d?.name ?? d?.company_name
      const favRaw = d?.faviconUrl ?? d?.favicon_url ?? d?.company_favicon_url
      const legalRaw = d?.legalName ?? d?.legal_name ?? d?.company_legal_name
      set({
        name: nameRaw != null && String(nameRaw).trim() ? String(nameRaw).trim() : BRAND_DEFAULTS.name,
        logoUrl:
          logoRaw != null && String(logoRaw).trim() ? String(logoRaw).trim() : null,
        faviconUrl:
          favRaw != null && String(favRaw).trim() ? String(favRaw).trim() : null,
        legalName:
          legalRaw != null && String(legalRaw).trim()
            ? String(legalRaw).trim()
            : BRAND_DEFAULTS.legalName,
        loaded: true,
        error: null,
      })
    } catch (e) {
      set({
        loaded: true,
        error: e?.message || 'brand',
      })
    }
  },
}))
