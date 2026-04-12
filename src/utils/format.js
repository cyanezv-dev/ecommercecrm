/** Formatea precio en CLP */
export const fmtPrice = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0)

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

/** Convierte fecha "hoy" / "mañana" / "esta semana" a ISO */
export function fechaToISO(valor) {
  const d = new Date()
  if (valor === 'hoy')         return d.toISOString().split('T')[0]
  if (valor === 'manana')      { d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }
  if (valor === 'esta semana') { d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0] }
  return valor || d.toISOString().split('T')[0]
}
