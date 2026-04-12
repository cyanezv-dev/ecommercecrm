/**
 * Valores por defecto en el front si el backend no responde o falla `GET /api/site-brand`.
 *
 * En el backend (leadflow) la marca vive en `settings` y en env. Para imagen desde el servidor:
 *   POST /api/site-brand/logo   — multipart, campo `logo` (jpg/png/svg/webp, máx. 2MB)
 *   PUT  /api/site-brand         — JSON: `{ "name": "...", "legalName": "...", "logoUrl": "https://..." }`
 *   DELETE /api/site-brand/logo  — quita la URL guardada
 *
 * Desde el front (panel propio): `uploadSiteBrandLogo(file)`, `updateSiteBrand({...})` en `@/utils/api`.
 */
export const BRAND_DEFAULTS = {
  name: 'TireMax',
  logoUrl: null,
  legalName: 'TireMax SpA',
}
