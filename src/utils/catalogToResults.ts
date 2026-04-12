import type { Tire, Workshop } from '@/components/results/ResultsPage'

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
}

function stableIdFromParts(...parts: string[]) {
  const s = parts.join('|').slice(0, 200)
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return `row-${Math.abs(h)}`
}

/**
 * Convierte un producto del API `/catalog` (CRM) al modelo de tarjeta que usa la UI V0.
 * Único lugar donde se traducen nombres de campos CRM → vista resultados.
 */
export function mapCatalogProductToTire(product: unknown): Tire {
  const p = asRecord(product)
  const cf = asRecord(p.custom_fields)
  const name = String(
    p.name ?? p.titulo ?? p.nombre ?? p.title ?? p.descripcion ?? p.modelo ?? '',
  ).trim()
  const brand = String(p.brand ?? p.marca ?? p.fabricante ?? '').trim()
  const medida = String(cf.medida ?? p.medida ?? p.medida_texto ?? '').trim()
  const idRaw = p.id ?? p.sku ?? p.codigo ?? p.product_id ?? p.internal_id ?? p.uuid
  let id = String(idRaw ?? '').trim()
  if (!id) {
    id = stableIdFromParts(name, brand, medida, JSON.stringify(Object.keys(p).sort()).slice(0, 80))
  }
  const unit = Number(
    p.price_offer ??
      p.precioOferta ??
      p.precio ??
      p.price ??
      p.valor ??
      p.precio_unitario ??
      0,
  )
  const normal = Number(p.price_normal ?? p.precioNormal ?? p.precio_lista ?? 0)
  const tierRaw = String(cf.tier ?? p.tier ?? 'Económico')
  let category: Tire['category'] = 'economico'
  if (tierRaw === 'Premium') category = 'premium'
  else if (tierRaw === 'Conveniencia') category = 'conveniencia'

  const availability = asRecord(p.availability)
  const fuente = asRecord(availability.fuente_optima)
  const horas = Number(
    fuente.tiempo_entrega_horas ?? p.tiempoEntregaHoras ?? 24,
  )

  let badge: string | undefined
  if (normal > unit && unit > 0) badge = `-${Math.round((1 - unit / normal) * 100)}%`

  const features: string[] = []
  if (horas <= 48) features.push(`~${Math.round(horas)} h entrega`)
  else features.push('Bajo pedido')
  if (cf.runflat) features.push('RunFlat')
  if (features.length < 2) features.push('Catálogo verificado')

  const img = String(p.photo_url ?? p.foto ?? p.image_url ?? p.imagen ?? '').trim()

  return {
    id,
    name,
    brand,
    price: Math.round(unit),
    originalPrice: normal > unit ? Math.round(normal) : undefined,
    image: img || 'https://placehold.co/600x450/eeeeee/666666?text=Sin+foto',
    badge,
    rating: 4.5,
    reviews: 0,
    size: medida || '—',
    features: features.slice(0, 3),
    category,
    crmProduct: p,
  }
}

/** Taller desde `/attention/workshops` → modelo lateral V0 */
export function mapApiWorkshopToResultsWorkshop(taller: unknown): Workshop {
  const t = asRecord(taller)
  const id = String(t.id ?? '')
  const dist = typeof t.distancia_km === 'number' ? t.distancia_km : null
  return {
    id,
    name: String(t.nombre_comercial ?? 'Taller'),
    address: String(t.direccion ?? ''),
    comuna: String(t.comuna ?? ''),
    distance: dist != null ? `${dist.toFixed(1)} km` : '—',
    rating: 4.7,
    reviews: 0,
    availableSlots: 4,
    openUntil: '19:00',
    crmWorkshop: t,
  }
}

export function wizardDeliveryToV0(necesidad: string): string {
  if (necesidad === 'instalacion') return 'serviteca'
  return 'despacho'
}

export function medidaFilterFromWizard(wizard: {
  medida: string
  ancho: string
  perfil: string
  aro: string
}): { id: string; label: string } {
  const label =
    wizard.medida?.trim() ||
    (wizard.ancho && wizard.perfil && wizard.aro
      ? `${wizard.ancho}/${wizard.perfil}R${wizard.aro}`
      : 'Medida')
  const id = label.replace(/\s+/g, '-').replace(/\//g, '-')
  return { id, label }
}
