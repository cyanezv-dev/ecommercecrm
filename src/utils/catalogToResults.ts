import type { Tire, Workshop, CatalogBadgeVariant } from '@/components/results/ResultsPage'
import { canonicalMedidaFilterId, listPriceWithIva, unitPriceWithIva } from '@/utils/format'

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
function customFieldsRecord(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return asRecord(raw)
  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw) as unknown
      if (j && typeof j === 'object' && !Array.isArray(j)) return asRecord(j)
    } catch {
      /* */
    }
  }
  return {}
}

/** Misma lógica que el listado del CRM: homologación OEM (EXT verde, resto azul) + RunFlat. */
export function catalogBadgesFromCustomFields(cf: Record<string, unknown>): {
  label: string
  variant: CatalogBadgeVariant
}[] {
  const out: { label: string; variant: CatalogBadgeVariant }[] = []
  const hom = String(
    cf.homologacion_oem ?? cf.Homologacion_oem ?? cf.homologacion_OEM ?? '',
  ).trim()
  if (hom) {
    for (const raw of hom.split(',')) {
      const code = raw.trim().toUpperCase()
      if (!code) continue
      const variant: CatalogBadgeVariant = code === 'EXT' ? 'ext' : 'oem'
      out.push({ label: code, variant })
    }
  }
  const rf = cf.runflat ?? cf.Runflat ?? cf.RunFlat
  const rfStr = typeof rf === 'string' ? rf.trim().toLowerCase() : ''
  const runflatOn =
    rf === true ||
    rf === 'true' ||
    rf === 1 ||
    (typeof rf === 'string' &&
      rfStr.length > 0 &&
      rfStr !== 'false' &&
      rfStr !== 'no' &&
      rfStr !== '0' &&
      rfStr !== '—')
  if (runflatOn) {
    const lbl =
      typeof rf === 'string' &&
      rfStr &&
      !['true', 'si', 'sí', 'yes', '1', 'runflat'].includes(rfStr)
        ? String(rf).trim().toUpperCase()
        : 'RunFlat'
    out.push({ label: lbl.slice(0, 16), variant: 'runflat' })
  }
  return out
}

/** Texto de medida (p. ej. 205/55R16) desde una fila `/catalog` o `/catalog/medidas`. */
export function extractMedidaLabelFromCatalogProduct(product: unknown): string {
  const p = asRecord(product)
  const cf = customFieldsRecord(p.custom_fields)
  const direct = String(cf.medida ?? p.medida ?? p.medida_texto ?? cf.medida_texto ?? '').trim()
  if (direct && direct !== '—') return direct
  const a = String(cf.ancho ?? p.ancho ?? '').trim()
  const perf = String(cf.perfil ?? p.perfil ?? '').trim()
  let ar = String(cf.aro ?? p.aro ?? '').trim()
  if (/^r/i.test(ar)) ar = ar.slice(1)
  if (a && perf && ar) return `${a}/${perf}R${ar}`
  return ''
}

export function mapCatalogProductToTire(product: unknown): Tire {
  const p = asRecord(product)
  const cf = customFieldsRecord(p.custom_fields)
  const familia = String(
    cf.familia ?? cf.Familia ?? p.familia ?? '',
  ).trim()
  const modelo = String(
    cf.modelo_neumatico ?? cf.modelo ?? p.modelo_neumatico ?? p.modelo ?? '',
  ).trim()
  const name = String(
    p.name ?? p.titulo ?? p.nombre ?? p.title ?? p.modelo ?? '',
  ).trim()
  const brand = String(p.brand ?? p.marca ?? p.fabricante ?? '').trim()
  const medida = extractMedidaLabelFromCatalogProduct(product)
  const idRaw = p.id ?? p.sku ?? p.codigo ?? p.product_id ?? p.internal_id ?? p.uuid
  let id = String(idRaw ?? '').trim()
  if (!id) {
    id = stableIdFromParts(name, brand, medida, JSON.stringify(Object.keys(p).sort()).slice(0, 80))
  }
  const rawNormal =
    parseFloat(
      String(
        p.price_normal ?? p.precioNormal ?? p.precio_lista ?? p.precio ?? p.price ?? 0,
      ),
    ) || 0
  const rawOffer = parseFloat(String(p.price_offer ?? p.precioOferta ?? 0)) || 0
  const normalIva = listPriceWithIva(p)
  const unitIva = unitPriceWithIva(p)
  const tierRaw = String(cf.tier ?? p.tier ?? 'Económico')
  let category: Tire['category'] = 'economico'
  if (tierRaw === 'Premium') category = 'premium'
  else if (tierRaw === 'Conveniencia') category = 'conveniencia'

  let badge: string | undefined
  if (rawOffer > 0 && rawNormal > 0 && rawOffer < rawNormal) {
    badge = `-${Math.round((1 - rawOffer / rawNormal) * 100)}%`
  }

  const catalogBadges = catalogBadgesFromCustomFields(cf)

  const img = String(p.photo_url ?? p.foto ?? p.image_url ?? p.imagen ?? '').trim()

  return {
    id,
    name,
    familia,
    modelo,
    brand,
    price: unitIva,
    originalPrice:
      rawOffer > 0 && rawNormal > 0 && rawOffer < rawNormal ? normalIva : undefined,
    image: img || 'https://placehold.co/600x450/eeeeee/666666?text=Sin+foto',
    badge,
    rating: 4.5,
    reviews: 0,
    size: medida || '—',
    catalogBadges: catalogBadges.length ? catalogBadges : undefined,
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

/** Inverso de `wizardDeliveryToV0`: valor del filtro Entrega → `wizard.necesidad` */
export function v0DeliveryToWizardNecesidad(delivery: string): string {
  if (delivery === 'serviteca' || delivery === 'instalacion-domicilio') return 'instalacion'
  return 'neumaticos'
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
  const id = canonicalMedidaFilterId(label) || label.replace(/\s+/g, '-').replace(/\//g, '-')
  return { id, label }
}
