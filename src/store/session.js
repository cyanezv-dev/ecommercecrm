import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSessionStore = create(
  persist(
    (set, get) => ({
      // ── Datos del wizard ──────────────────────────────
      wizard: {
        cantidad: 4,
        necesidad: '',
        medida: '',
        ancho: '',
        perfil: '',
        aro: '',
        comuna: '',
        comunaNombre: '',
        fecha: '',
        email: '',
      },
      setWizard: (data) => set(s => ({ wizard: { ...s.wizard, ...data } })),
      resetWizard: () => set({
        wizard: { cantidad: 4, necesidad: '', medida: '', ancho: '', perfil: '', aro: '', comuna: '', comunaNombre: '', fecha: '', email: '' }
      }),

      // ── Favoritos ────────────────────────────────────
      favorites: [],
      toggleFavorite: (producto) => set(s => {
        const exists = s.favorites.some(f => f.id === producto.id)
        return { favorites: exists ? s.favorites.filter(f => f.id !== producto.id) : [...s.favorites, producto] }
      }),
      isFavorite: (id) => get().favorites.some(f => f.id === id),
      clearFavorites: () => set({ favorites: [] }),

      // ── Carrito / Selección ──────────────────────────
      cart: {
        producto: null,
        taller: null,
        entrega: null,
        fecha: '',
        direccion: '',
      },
      setCart: (data) => set(s => ({ cart: { ...s.cart, ...data } })),
      resetCart: () => set({ cart: { producto: null, taller: null, entrega: null, fecha: '', direccion: '' } }),

      // ── Confirmación ─────────────────────────────────
      confirmacion: null,
      setConfirmacion: (c) => set({ confirmacion: c }),
    }),
    {
      name: 'ecom-session',
      partialize: s => ({ wizard: s.wizard, favorites: s.favorites }),
    }
  )
)
