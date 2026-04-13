let loadPromise = null

/**
 * Carga una sola vez la API de Maps (librería places) para Autocomplete.
 * Requiere clave con Maps JavaScript API y Places habilitados en Google Cloud.
 */
export function loadGoogleMapsScript(apiKey) {
  if (typeof window === 'undefined') return Promise.reject(new Error('no-window'))
  if (window.google?.maps?.places) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.async = true
    s.defer = true
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=es&region=CL`
    s.onload = () => {
      if (window.google?.maps?.places) resolve()
      else {
        loadPromise = null
        reject(new Error('google-maps-no-places'))
      }
    }
    s.onerror = () => {
      loadPromise = null
      s.remove()
      reject(new Error('google-maps-script'))
    }
    document.head.appendChild(s)
  })

  return loadPromise
}
