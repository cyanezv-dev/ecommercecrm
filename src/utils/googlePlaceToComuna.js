import { bestComunaMatchFromGeocoderText } from './comunas'

/**
 * A partir de un resultado de Places (Google Maps), intenta obtener una comuna del listado local (Chile).
 * @param {{ address_components?: Array<{ types: string[], long_name?: string, short_name?: string }>, formatted_address?: string }} place
 * @returns {{ codigo: string, nombre: string, region: string } | null}
 */
export function comunaFromGooglePlace(place) {
  if (!place?.address_components?.length) return null

  const comps = place.address_components
  const short = (type) => comps.find((c) => c.types.includes(type))?.short_name
  const long = (type) => comps.find((c) => c.types.includes(type))?.long_name

  const country = short('country')
  if (country && country !== 'CL') return null

  const localityCandidates = [
    long('locality'),
    long('administrative_area_level_3'),
    long('sublocality_level_1'),
    long('sublocality_level_2'),
    long('neighborhood'),
    long('administrative_area_level_2'),
    long('administrative_area_level_1'),
  ].filter(Boolean)

  for (const text of localityCandidates) {
    const hit = bestComunaMatchFromGeocoderText(text)
    if (hit?.codigo && hit?.nombre) return hit
  }

  const combined = localityCandidates.join(' ')
  const hitCombined = bestComunaMatchFromGeocoderText(combined)
  if (hitCombined?.codigo && hitCombined?.nombre) return hitCombined

  if (place.formatted_address) {
    const hitAddr = bestComunaMatchFromGeocoderText(place.formatted_address)
    if (hitAddr?.codigo && hitAddr?.nombre) return hitAddr
  }

  return null
}
