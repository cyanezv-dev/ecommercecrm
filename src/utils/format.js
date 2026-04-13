/** IVA Chile — mismo criterio que el catálogo Leadflow (precio neto × 1.19) */
export const IVA = 1.19
export const withIva = (n) => Math.round((parseFloat(String(n)) || 0) * IVA)

/** Formatea precio en CLP */
export const fmtPrice = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0)

/**
 * Precio unitario mostrado al cliente (con IVA): oferta si existe y es menor que lista; si no, lista.
 * Acepta filas del API `/catalog` (price_normal / price_offer como número o string).
 */
export function unitPriceWithIva(producto) {
  if (!producto || typeof producto !== 'object') return 0
  const rawN =
    parseFloat(
      String(
        producto.price_normal ??
          producto.precioNormal ??
          producto.precio_lista ??
          producto.precio ??
          producto.price ??
          0,
      ),
    ) || 0
  const rawO = parseFloat(String(producto.price_offer ?? producto.precioOferta ?? 0)) || 0
  if (rawN <= 0 && rawO > 0) return withIva(rawO)
  if (rawO > 0 && rawO < rawN) return withIva(rawO)
  return withIva(rawN)
}

/** Precio de lista con IVA (para tachar cuando hay oferta) */
export function listPriceWithIva(producto) {
  const rawN =
    parseFloat(
      String(
        producto?.price_normal ??
          producto?.precioNormal ??
          producto?.precio_lista ??
          producto?.precio ??
          producto?.price ??
          0,
      ),
    ) || 0
  return withIva(rawN)
}

/** Etiqueta de disponibilidad a partir de horas */
export function disponibilidadLabel(horas) {
  if (!horas) return { label: 'Disponible', color: 'green' }
  if (horas <= 4)  return { label: 'Hoy',         color: 'green'  }
  if (horas <= 24) return { label: '24 horas',     color: 'green'  }
  if (horas <= 48) return { label: '48 horas',     color: 'orange' }
  if (horas <= 72) return { label: '3 días',       color: 'orange' }
  return               { label: 'Esta semana',   color: 'yellow' }
}

/** Descompone medida tipo 205/55R16 (también 205-55-15, 205/55 R16, etc.) */
export function parseMedida(medida) {
  if (!medida) return { ancho: '', perfil: '', aro: '', raw: '' }
  const m = medida.toString().trim()
  // Ancho 2–3 dígitos (casi siempre 3 en autos livianos)
  const re =
    /(\d{2,3})\s*[\/\-]\s*(\d{2})\s*(?:[\/\-]\s*)?[Rr]?\s*(\d{2})\b/
  const match = m.match(re)
  if (match) return { ancho: match[1], perfil: match[2], aro: match[3], raw: m }
  return { ancho: '', perfil: '', aro: '', raw: m }
}

/**
 * Id estable para el filtro de medida: misma medida nominal → mismo id aunque el
 * texto varíe (205/55R16 vs 205/55 R16 vs 205-55-R-16). Evita que el filtro se
 * “salte” a otra opción al recargar opciones desde el catálogo.
 */
export function canonicalMedidaFilterId(label) {
  const p = parseMedida(String(label ?? '').trim())
  if (p.ancho && p.perfil && p.aro) return `${p.ancho}-${p.perfil}-${p.aro}`
  const s = String(label ?? '').trim()
  if (!s) return ''
  return s.replace(/\s+/g, '-').replace(/\//g, '-').replace(/_/g, '-')
}

/** Convierte fecha "hoy" / "mañana" / "esta semana" a ISO */
export function fechaToISO(valor) {
  const d = new Date()
  if (valor === 'hoy')         return d.toISOString().split('T')[0]
  if (valor === 'manana')      { d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }
  if (valor === 'esta semana') { d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0] }
  return valor || d.toISOString().split('T')[0]
}
