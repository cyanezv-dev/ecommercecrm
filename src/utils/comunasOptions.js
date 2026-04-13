import { COMUNAS_CL, searchComunas } from './comunas'

function norm(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** Comuna actual del wizard + demás comunas de la misma región (para priorizar “cerca”). */
export function buildComunaFilterOptions(wizard) {
  const codigo = String(wizard.comuna || '').trim()
  const nombre = String(wizard.comunaNombre || '').trim()

  if (!codigo && !nombre) {
    return [{ id: '', label: 'Tu zona' }]
  }

  const match =
    (codigo && COMUNAS_CL.find((c) => c.codigo === codigo)) ||
    (nombre.length >= 2 ? searchComunas(nombre, 1)[0] : null)

  if (match?.codigo && match?.nombre) {
    const sameRegion = COMUNAS_CL.filter((c) => c.region === match.region)
    if (sameRegion.length) {
      const sorted = [...sameRegion].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es'),
      )
      const options = sorted.map((c) => ({ id: c.codigo, label: c.nombre }))
      const idx = options.findIndex((o) => o.id === match.codigo)
      if (idx > 0) {
        const cur = options[idx]
        return [cur, ...options.filter((_, i) => i !== idx)]
      }
      return options
    }
    return [{ id: match.codigo, label: match.nombre }]
  }

  if (codigo || nombre) {
    return [{ id: codigo || nombre, label: nombre || codigo || 'Tu zona' }]
  }

  return [{ id: '', label: 'Tu zona' }]
}

/**
 * Lista para autocomplete: sin búsqueda, comunas de la región (la del wizard primero);
 * con texto, coincidencias de esa región primero y luego todas las del país que calzan.
 */
export function comunasAutocompleteOptions(wizard, query) {
  const nearby = buildComunaFilterOptions(wizard)
  const q = String(query || '').trim()
  if (!q) return nearby

  const nq = norm(q)
  if (q.length < 2) {
    const filtered = nearby.filter(
      (o) => o.id && (norm(o.label).includes(nq) || norm(o.id).includes(nq)),
    )
    return filtered.length ? filtered : nearby
  }

  const seen = new Set()
  const out = []

  const matchesRow = (o) =>
    !!o.id &&
    (norm(o.label).includes(nq) || norm(String(o.id)).includes(nq))

  for (const o of nearby) {
    if (!matchesRow(o) || seen.has(o.id)) continue
    seen.add(o.id)
    out.push(o)
  }

  for (const c of searchComunas(q, 500)) {
    const id = String(c.codigo)
    if (seen.has(id)) continue
    seen.add(id)
    out.push({ id, label: c.nombre })
  }
  return out
}
