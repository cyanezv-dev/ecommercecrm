import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSessionStore } from '@/store/session'
import { fetchProducts, fetchWorkshops } from '@/utils/api'
import { ResultsPage } from '@/components/results/ResultsPage'
import {
  mapCatalogProductToTire,
  mapApiWorkshopToResultsWorkshop,
  wizardDeliveryToV0,
  medidaFilterFromWizard,
} from '@/utils/catalogToResults'

export default function Results() {
  const navigate = useNavigate()
  const { wizard, setCart, setWizard } = useSessionStore()

  const { data: catalogData = {}, isLoading } = useQuery({
    queryKey: ['catalog-results', wizard.ancho, wizard.perfil, wizard.aro],
    queryFn: () =>
      fetchProducts({
        ancho: wizard.ancho,
        perfil: wizard.perfil,
        aro: wizard.aro,
        search: wizard.medida,
      }),
    enabled: !!(wizard.ancho || wizard.medida),
  })

  const { data: workshopsRaw = [] } = useQuery({
    queryKey: ['workshops-results', wizard.aro],
    queryFn: () => fetchWorkshops({ aro: wizard.aro }),
    enabled: wizard.necesidad === 'instalacion',
  })

  const products = catalogData.products || []

  const tires = useMemo(
    () => products.map((p) => mapCatalogProductToTire(p)),
    [products],
  )

  const workshops = useMemo(
    () => workshopsRaw.map((w) => mapApiWorkshopToResultsWorkshop(w)),
    [workshopsRaw],
  )

  const { id: sizeId, label: sizeLabel } = medidaFilterFromWizard(wizard)
  const sizeFilterOptions = [{ id: sizeId, label: sizeLabel }]

  const comunaLabel = wizard.comunaNombre || wizard.comuna || 'Tu zona'
  const comunaFilterOptions = [{ id: 'wizard-comuna', label: comunaLabel }]

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

  return (
    <ResultsPage
      onStartOver={() => navigate('/')}
      tires={tires}
      workshops={workshops}
      isLoading={isLoading}
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
