import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET?.trim() || 'http://localhost:3001'

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
