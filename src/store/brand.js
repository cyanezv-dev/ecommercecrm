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
      set({
        name: (d && d.name) ? String(d.name).trim() : BRAND_DEFAULTS.name,
        logoUrl: d && d.logoUrl && String(d.logoUrl).trim() ? String(d.logoUrl).trim() : null,
        faviconUrl:
          d && d.faviconUrl && String(d.faviconUrl).trim() ? String(d.faviconUrl).trim() : null,
        legalName: (d && d.legalName) ? String(d.legalName).trim() : BRAND_DEFAULTS.legalName,
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
