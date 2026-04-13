import { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSessionStore } from '@/store/session'
import {
  fetchProducts,
  fetchWorkshops,
  axiosRequestDisplayUrl,
  apiBaseLooksSameOriginAsStorefront,
  getResolvedApiBase,
} from '@/utils/api'
import { parseMedida } from '@/utils/format'
import { Button } from '@/components/ui/button'
import { ResultsPage } from '@/components/results/ResultsPage'
import { COMUNAS_CL } from '@/utils/comunas'
import { buildComunaFilterOptions } from '@/utils/comunasOptions'
import {
  mapCatalogProductToTire,
  mapApiWorkshopToResultsWorkshop,
  wizardDeliveryToV0,
  medidaFilterFromWizard,
  v0DeliveryToWizardNecesidad,
} from '@/utils/catalogToResults'

function medidaTripletKey(w) {
  if (w.ancho && w.perfil && w.aro) {
    return `${w.ancho}/${w.perfil}/${w.aro}`
  }
  const p = parseMedida(w.medida || '')
  if (p.ancho && p.perfil && p.aro) return `${p.ancho}/${p.perfil}/${p.aro}`
  return ''
}

function labelToMedidaKey(label) {
  const p = parseMedida(String(label || '').trim())
  if (p.ancho && p.perfil && p.aro) return `${p.ancho}/${p.perfil}/${p.aro}`
  return ''
}

/** Medida del wizard + medidas distintas que vienen en la respuesta del catálogo. */
function buildSizeFilterOptions(wizard, tires) {
  const current = medidaFilterFromWizard(wizard)
  const seen = new Set()
  const list = []
  for (const t of tires) {
    const label = (t.size || '').trim()
    if (!label || label === '—') continue
    const row = {
      id: label.replace(/\s+/g, '-').replace(/\//g, '-'),
      label,
    }
    if (seen.has(row.id)) continue
    seen.add(row.id)
    list.push(row)
  }
  list.sort((a, b) =>
    a.label.localeCompare(b.label, 'es', { numeric: true, sensitivity: 'base' }),
  )
  if (!seen.has(current.id)) {
    list.unshift(current)
  } else {
    const idx = list.findIndex((x) => x.id === current.id)
    if (idx > 0) {
      const [row] = list.splice(idx, 1)
      list.unshift(row)
    }
  }
  return list.length ? list : [current]
}

function asWorkshopList(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.data)) return raw.data
  if (Array.isArray(raw.workshops)) return raw.workshops
  if (Array.isArray(raw.items)) return raw.items
  return []
}

export default function Results() {
  const navigate = useNavigate()
  const { wizard, setCart, setWizard } = useSessionStore()

  const comunaFilterOptions = useMemo(() => buildComunaFilterOptions(wizard), [
    wizard.comuna,
    wizard.comunaNombre,
  ])

  const comunaWizardSlice = useMemo(
    () => ({ comuna: wizard.comuna, comunaNombre: wizard.comunaNombre }),
    [wizard.comuna, wizard.comunaNombre],
  )

  const initialComunaId = useMemo(() => {
    const c = String(wizard.comuna || '').trim()
    if (!c) return comunaFilterOptions[0]?.id || ''
    if (COMUNAS_CL.some((x) => x.codigo === c)) return c
    if (comunaFilterOptions.some((o) => o.id === c)) return c
    return comunaFilterOptions[0]?.id || ''
  }, [wizard.comuna, comunaFilterOptions])

  const medidaQuery = useMemo(() => {
    const w = wizard
    if (w.ancho && w.perfil && w.aro) {
      return {
        ancho: String(w.ancho),
        perfil: String(w.perfil),
        aro: String(w.aro),
        search: w.medida || '',
      }
    }
    const p = parseMedida(w.medida || '')
    if (p.ancho && p.perfil && p.aro) {
      return {
        ancho: p.ancho,
        perfil: p.perfil,
        aro: p.aro,
        search: w.medida || p.raw || '',
      }
    }
    return null
  }, [wizard])

  const {
    data: catalogData = {},
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      'catalog-results',
      medidaQuery?.ancho,
      medidaQuery?.perfil,
      medidaQuery?.aro,
      medidaQuery?.search,
    ],
    queryFn: () => {
      if (!medidaQuery) throw new Error('Medida no disponible')
      return fetchProducts(medidaQuery)
    },
    enabled: !!medidaQuery,
  })

  const workshopAro = medidaQuery?.aro || wizard.aro

  const { data: workshopsRaw } = useQuery({
    queryKey: ['workshops-results', workshopAro, wizard.comuna],
    queryFn: () => fetchWorkshops({ aro: workshopAro }),
    enabled: wizard.necesidad === 'instalacion' && !!workshopAro,
  })

  const workshopsList = useMemo(() => asWorkshopList(workshopsRaw), [workshopsRaw])

  const products = catalogData.products || []

  const tires = useMemo(
    () => products.map((p) => mapCatalogProductToTire(p)),
    [products],
  )

  const workshops = useMemo(
    () => workshopsList.map((w) => mapApiWorkshopToResultsWorkshop(w)),
    [workshopsList],
  )

  const sizeFilterOptions = useMemo(
    () => buildSizeFilterOptions(wizard, tires),
    [wizard.medida, wizard.ancho, wizard.perfil, wizard.aro, tires],
  )

  const initialSizeId = useMemo(() => {
    const { id } = medidaFilterFromWizard(wizard)
    if (sizeFilterOptions.some((o) => o.id === id)) return id
    return sizeFilterOptions[0]?.id || id
  }, [
    wizard.medida,
    wizard.ancho,
    wizard.perfil,
    wizard.aro,
    sizeFilterOptions,
  ])

  const syncFiltersToWizard = useCallback(
    (f) => {
      const necesidad = v0DeliveryToWizardNecesidad(f.delivery)
      const comunaOpt = comunaFilterOptions.find((c) => c.id === f.comuna)
      const nextComuna = String(f.comuna || '').trim()
      let nextNombre = String(comunaOpt?.label || '').trim()
      if (nextComuna && !nextNombre) {
        nextNombre =
          COMUNAS_CL.find((c) => c.codigo === nextComuna)?.nombre || ''
      }
      const sizeOpt = sizeFilterOptions.find((s) => s.id === f.size)
      const nextMedidaLabel = String(sizeOpt?.label || '').trim()
      const parsed = nextMedidaLabel ? parseMedida(nextMedidaLabel) : null

      const w = useSessionStore.getState().wizard
      const comunaIgual =
        nextComuna === ''
          ? !String(w.comuna || '').trim()
          : String(w.comuna || '').trim() === nextComuna &&
            String(w.comunaNombre || '').trim() === nextNombre
      const medidaIgual =
        !nextMedidaLabel ||
        medidaTripletKey(w) === labelToMedidaKey(nextMedidaLabel)

      if (
        w.cantidad === f.quantity &&
        w.necesidad === necesidad &&
        comunaIgual &&
        medidaIgual
      ) {
        return
      }

      const patch = { cantidad: f.quantity, necesidad }
      if (nextComuna) {
        patch.comuna = nextComuna
        patch.comunaNombre = nextNombre || w.comunaNombre
      }
      if (nextMedidaLabel) {
        patch.medida = nextMedidaLabel
        if (parsed?.ancho && parsed?.perfil && parsed?.aro) {
          patch.ancho = parsed.ancho
          patch.perfil = parsed.perfil
          patch.aro = parsed.aro
        }
      }
      setWizard(patch)
    },
    [setWizard, comunaFilterOptions, sizeFilterOptions],
  )

  const catalogMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message
  const catalogStatus = error?.response?.status
  const catalogAttemptUrl = axiosRequestDisplayUrl(error)
  const apiBaseHint = apiBaseLooksSameOriginAsStorefront()

  if (!medidaQuery) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-serif text-2xl text-foreground">Falta la medida</h1>
        <p className="text-muted-foreground text-sm max-w-md">
          No hay una medida válida guardada (ej. 205/55R16). Vuelve al asistente y completa el paso de medida.
        </p>
        <Button onClick={() => navigate('/')}>Ir al inicio</Button>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-serif text-2xl text-foreground">No pudimos cargar el catálogo</h1>
        <p className="text-muted-foreground text-sm max-w-md">
          El frontend no pudo hablar con la API de Leadflow (revisa{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_API_URL</code> en build o el proxy{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">/api</code> en desarrollo).
        </p>
        {catalogAttemptUrl && (
          <p className="text-muted-foreground text-xs max-w-xl break-all font-mono bg-muted/50 px-2 py-1.5 rounded text-left">
            URL intentada: {catalogAttemptUrl}
          </p>
        )}
        <p className="text-muted-foreground text-xs max-w-lg">
          Base del API en este build:{' '}
          <span className="font-mono break-all">{String(getResolvedApiBase())}</span>
        </p>
        {catalogStatus === 404 && apiBaseHint && (
          <p className="text-amber-700 dark:text-amber-200 text-sm max-w-lg">
            El navegador está llamando al <strong>mismo sitio</strong> que la tienda (o a{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">/api</code> en ese dominio). Un
            sitio estático no ejecuta Leadflow ahí: necesitás la URL del <strong>servicio Node</strong>{' '}
            (Railway, Render, droplet, App Platform componente &quot;Web Service&quot;, etc.), p. ej.{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">https://leadflow-xxx.up.railway.app</code>{' '}
            o un subdominio dedicado, y que termine en{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">/api</code> si el servidor expone
            rutas bajo <code className="text-xs bg-muted px-1 py-0.5 rounded">/api</code>.
          </p>
        )}
        {catalogStatus === 404 && !apiBaseHint && (
          <p className="text-muted-foreground text-sm max-w-lg">
            Error 404: esa URL no expone el catálogo Leadflow. Revisa que la base sea la del backend
            (rutas <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/catalog</code>, etc.) y
            que el servicio esté arriba. Puedes usar <code className="text-xs bg-muted px-1 py-0.5 rounded">api-config.json</code> con{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">apiBaseUrl</code> y redeploy.
          </p>
        )}
        {catalogMessage && (
          <p className="text-destructive text-sm max-w-lg break-words">{String(catalogMessage)}</p>
        )}
        <div className="flex gap-2">
          <Button onClick={() => refetch()}>Reintentar</Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  const handleCheckout = ({
    tire,
    quantity,
    deliveryType,
    workshopId,
    date,
    time,
  }) => {
    const product = tire.crmProduct
    if (!product) return

    const cartPatch = { producto: product }
    if (deliveryType === 'serviteca' && workshopId) {
      const w = workshops.find((x) => x.id === workshopId)
      if (w?.crmWorkshop) cartPatch.taller = w.crmWorkshop
    }
    setCart(cartPatch)

    if (date && time) {
      const slot = `${date} ${time === 'AM' ? '09:00–12:00' : '13:00–18:00'}`
      setWizard({ fecha: slot })
    }

    navigate('/checkout')
  }

  const catalogEmptyHint = catalogData.__catalogDebug || null

  return (
    <ResultsPage
      onStartOver={() => navigate('/')}
      tires={tires}
      workshops={workshops}
      isLoading={isLoading || isFetching}
      catalogEmptyHint={catalogEmptyHint}
      sizeFilterOptions={sizeFilterOptions}
      comunaWizard={comunaWizardSlice}
      initialQuantity={wizard.cantidad || 4}
      initialSizeId={initialSizeId}
      initialComunaId={initialComunaId}
      initialDelivery={wizardDeliveryToV0(wizard.necesidad)}
      onFiltersSync={syncFiltersToWizard}
      onCheckout={handleCheckout}
    />
  )
}
