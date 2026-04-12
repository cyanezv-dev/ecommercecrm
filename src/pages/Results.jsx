import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSessionStore } from '@/store/session'
import { fetchProducts, fetchWorkshops } from '@/utils/api'
import { parseMedida } from '@/utils/format'
import { Button } from '@/components/ui/button'
import { ResultsPage } from '@/components/results/ResultsPage'
import {
  mapCatalogProductToTire,
  mapApiWorkshopToResultsWorkshop,
  wizardDeliveryToV0,
  medidaFilterFromWizard,
} from '@/utils/catalogToResults'

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
    queryKey: ['workshops-results', workshopAro],
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

  const { id: sizeId, label: sizeLabel } = medidaFilterFromWizard(wizard)
  const sizeFilterOptions = [{ id: sizeId, label: sizeLabel }]

  const comunaLabel = wizard.comunaNombre || wizard.comuna || 'Tu zona'
  const comunaFilterOptions = [{ id: 'wizard-comuna', label: comunaLabel }]

  const catalogMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message

  if (!medidaQuery) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-serif text-2xl text-foreground">Falta la medida</h1>
        <p className="text-muted-foreground text-sm max-w-md">
          No hay una medida válida guardada (ej. 205/55R16). Volvé al asistente y completá el paso de medida.
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
          El frontend no pudo hablar con la API de Leadflow (revisá{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_API_URL</code> en build o el proxy{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">/api</code> en desarrollo).
        </p>
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
      comunaFilterOptions={comunaFilterOptions}
      initialQuantity={wizard.cantidad || 4}
      initialSizeId={sizeId}
      initialComunaId="wizard-comuna"
      initialDelivery={wizardDeliveryToV0(wizard.necesidad)}
      onCheckout={handleCheckout}
    />
  )
}
