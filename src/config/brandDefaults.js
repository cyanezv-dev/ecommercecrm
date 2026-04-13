/**
 * Valores por defecto en el front si el backend no responde o falla `GET /api/site-brand`.
 *
 * En el backend (leadflow) la marca vive en `settings` y en env. Para imagen desde el servidor:
 *   POST /api/site-brand/logo     — multipart, campo `logo` (jpg/png/svg/webp, máx. 2MB)
 *   POST /api/site-brand/favicon — multipart, campo `favicon` (ico/png/svg/webp, máx. 512KB)
 *   PUT  /api/site-brand         — JSON: `{ name?, legalName?, logoUrl?, faviconUrl? }`
 *   DELETE /api/site-brand/logo | /api/site-brand/favicon
 *   GET mezcla `site_brand_*` con datos empresa en settings (`company_name`, `company_logo_url`, `company_favicon_url`).
 *
 * Desde el front (panel propio): `uploadSiteBrandLogo(file)`, `updateSiteBrand({...})` en `@/utils/api`.
 */
export const BRAND_DEFAULTS = {
  name: 'TireMax',
  logoUrl: null,
  faviconUrl: null,
  legalName: 'TireMax SpA',
}
