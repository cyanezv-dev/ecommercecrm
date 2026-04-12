import { useEffect } from 'react'
import { useBrandStore } from '@/store/brand'

/** Carga `/api/site-brand` una vez al abrir la app */
export default function BrandBootstrap() {
  const hydrate = useBrandStore((s) => s.hydrate)
  useEffect(() => {
    hydrate()
  }, [hydrate])
  return null
}
