import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function looksLikePlaceholderApiUrl(v) {
  const t = String(v || '').trim().toLowerCase()
  if (!t) return true
  return (
    t.includes('tu_dominio') ||
    t.includes('reemplaza') ||
    t.includes('tudominio') ||
    /^https?:\/\/example\.com/i.test(t)
  )
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET?.trim() || 'http://localhost:3001'

  if (mode === 'production') {
    const api = env.VITE_API_URL?.trim()
    if (looksLikePlaceholderApiUrl(api)) {
      console.warn(
        '\n[ecommercecrm] VITE_API_URL no está definida o sigue siendo un placeholder.\n' +
          'En el hosting (build) asigna la URL HTTPS del servidor Leadflow, por ejemplo\n' +
          '  https://TU-SERVICIO.up.railway.app/api\n' +
          'o publica dist/api-config.json con {"apiBaseUrl":"…"} y vuelve a desplegar.\n' +
          'Sin eso el bundle usará /api y en un sitio estático verás 404 en el catálogo.\n',
      )
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') }
    },
    server: {
      port: 5174,
      proxy: {
        '/api': { target: apiProxyTarget, changeOrigin: true }
      }
    },
    // Mismo proxy que `npm run dev`, para `npm run preview` con build que tenía localhost en env.
    preview: {
      port: 4174,
      proxy: {
        '/api': { target: apiProxyTarget, changeOrigin: true }
      }
    }
  }
})
