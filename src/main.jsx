import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { loadPublicApiConfig } from '@/loadPublicApiConfig'

async function bootstrap() {
  await loadPublicApiConfig()
  const { useBrandStore } = await import('@/store/brand')
  await useBrandStore.getState().hydrate().catch(() => {
    /* sin API o error de red: la app sigue con valores por defecto y BrandBootstrap puede reintentar */
  })
  const { default: App } = await import('./App.jsx')
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap().catch((err) => {
  console.error(err)
  document.getElementById('root').innerHTML =
    '<p style="font-family:system-ui;padding:2rem">No se pudo iniciar la aplicación.</p>'
})
