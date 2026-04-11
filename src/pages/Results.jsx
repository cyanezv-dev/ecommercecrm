import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSessionStore } from '@/store/session'
import { fetchProducts, fetchWorkshops } from '@/utils/api'
import { fmtPrice, disponibilidadLabel } from '@/utils/format'
import styles from './Results.module.css'

const TIERS = ['Premium', 'Conveniencia', 'Económico']

function DisponibilidadBadge({ horas }) {
  const { label, color } = disponibilidadLabel(horas)
  return <span className={`${styles.badge} ${styles['badge_' + color]}`}>{label}</span>
}

function ProductCard({ producto, cantidad, onSelect, onFavorite, isFav }) {
  const total = (producto.price_offer || producto.precioOferta || 0) * cantidad
  const unitario = producto.price_offer || producto.precioOferta || 0
  const tiempoHoras = producto.availability?.fuente_optima?.tiempo_entrega_horas
    ?? producto.tiempoEntregaHoras ?? 24
  const foto = producto.photo_url || producto.foto || ''

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        {foto
          ? <img src={foto} alt={producto.name || producto.titulo} className={styles.cardImg} />
          : <div className={styles.cardImgPlaceholder}>🚗</div>
        }
        <button
          className={`${styles.favBtn} ${isFav ? styles.favActive : ''}`}
          onClick={() => onFavorite(producto)}
          title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
          {isFav ? '♥' : '♡'}
        </button>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardBrand}>{producto.brand || producto.marca}</div>
        <div className={styles.cardModel}>{producto.name || producto.titulo}</div>
        <div className={styles.cardMedida}>{producto.custom_fields?.medida || producto.medida}</div>

        <div className={styles.cardPriceRow}>
          <div>
            <div className={styles.cardUnit}>{fmtPrice(unitario)} c/u</div>
            {cantidad > 1 && (
              <div className={styles.cardTotal}>{fmtPrice(total)} · {cantidad} un.</div>
            )}
          </div>
          {(producto.price_normal || producto.precioNormal) > unitario && (
            <span className={styles.descuento}>
              -{Math.round((1 - unitario / (producto.price_normal || producto.precioNormal)) * 100)}%
            </span>
          )}
        </div>

        <DisponibilidadBadge horas={tiempoHoras} />
      </div>

      <div className={styles.cardFooter}>
        <button className={styles.selectBtn} onClick={() => onSelect(producto)}>
          Seleccionar →
        </button>
      </div>
    </div>
  )
}

function WorkshopCard({ taller, selected, onSelect }) {
  return (
    <div className={`${styles.workshopCard} ${selected ? styles.workshopSelected : ''}`}>
      <div className={styles.wsName}>{taller.nombre_comercial}</div>
      <div className={styles.wsAddr}>{taller.direccion}</div>
      <div className={styles.wsMeta}>
        <span className={styles.wsComuna}>{taller.comuna}</span>
        {taller.distancia_km && <span className={styles.wsDist}>{taller.distancia_km.toFixed(1)} km</span>}
      </div>
      <button
        className={`${styles.wsBtn} ${selected ? styles.wsBtnActive : ''}`}
        onClick={() => onSelect(taller)}>
        {selected ? '✓ Seleccionado' : 'Elegir taller'}
      </button>
    </div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const { wizard, favorites, toggleFavorite, isFavorite, setCart, cart } = useSessionStore()
  const [showWorkshops, setShowWorkshops] = useState(false)
  const [showFavPanel, setShowFavPanel]   = useState(false)

  const { data: catalogData = {}, isLoading } = useQuery({
    queryKey: ['catalog-results', wizard.ancho, wizard.perfil, wizard.aro],
    queryFn: () => fetchProducts({
      ancho: wizard.ancho, perfil: wizard.perfil, aro: wizard.aro,
      search: wizard.medida
    }),
    enabled: !!(wizard.ancho || wizard.medida),
  })

  const { data: workshops = [] } = useQuery({
    queryKey: ['workshops-results', wizard.aro],
    queryFn: () => fetchWorkshops({ aro: wizard.aro }),
    enabled: wizard.necesidad === 'instalacion',
  })

  const products = catalogData.products || []

  // Agrupar por tier
  const porTier = useMemo(() => {
    const grp = { Premium: [], Conveniencia: [], Económico: [] }
    for (const p of products) {
      const cf = p.custom_fields || {}
      const tier = cf.tier || p.tier || 'Económico'
      const key = tier === 'Premium' ? 'Premium' : tier === 'Conveniencia' ? 'Conveniencia' : 'Económico'
      if (!grp[key]) grp[key] = []
      grp[key].push(p)
    }
    return grp
  }, [products])

  const handleSelect = (producto) => {
    setCart({ producto })
    if (wizard.necesidad === 'instalacion') setShowWorkshops(true)
    else navigate('/checkout')
  }

  const handleWorkshopSelect = (taller) => {
    setCart({ taller })
    navigate('/checkout')
  }

  const handleFavoritesQuote = () => {
    if (favorites.length > 0) {
      setCart({ producto: favorites[0] })
      navigate('/checkout')
    }
  }

  const medidaResumen = wizard.medida || `${wizard.ancho}/${wizard.perfil}R${wizard.aro}`

  return (
    <div className={styles.page}>
      {/* Barra fija superior */}
      <header className={styles.topBar}>
        <button className={styles.topBack} onClick={() => navigate('/')}>←</button>
        <div className={styles.topInfo}>
          <div className={styles.topTitle}>
            {wizard.cantidad} neumático{wizard.cantidad !== 1 ? 's' : ''} · {medidaResumen}
          </div>
          <div className={styles.topSub}>
            {wizard.comunaNombre || wizard.comuna}
            {wizard.fecha && ` · ${wizard.fecha}`}
          </div>
        </div>
        <button className={styles.topEdit} onClick={() => navigate('/')}>Editar</button>
      </header>

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.loadingDots}>
              <span /><span /><span />
            </div>
            <p>Buscando los mejores neumáticos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <div className={styles.emptyTitle}>Sin resultados para {medidaResumen}</div>
            <p className={styles.emptySub}>Prueba con una medida distinta o contáctanos</p>
            <button className={styles.emptyBtn} onClick={() => navigate('/')}>Modificar búsqueda</button>
          </div>
        ) : (
          <>
            <div className={styles.resultMeta}>
              {products.length} neumático{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
            </div>

            {TIERS.map(tier => {
              const items = porTier[tier] || []
              if (!items.length) return null
              return (
                <section key={tier} className={styles.tierSection}>
                  <div className={styles.tierHeader}>
                    <span className={`${styles.tierBadge} ${styles['tier_' + tier.toLowerCase()]}`}>
                      {tier === 'Premium' ? '⭐' : tier === 'Conveniencia' ? '✓' : '💰'} {tier}
                    </span>
                    <span className={styles.tierCount}>{items.length} opción{items.length !== 1 ? 'es' : ''}</span>
                  </div>
                  <div className={styles.cardGrid}>
                    {items.map(p => (
                      <ProductCard
                        key={p.id}
                        producto={p}
                        cantidad={wizard.cantidad || 4}
                        onSelect={handleSelect}
                        onFavorite={toggleFavorite}
                        isFav={isFavorite(p.id)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}

            {/* Panel talleres */}
            {showWorkshops && cart.producto && (
              <section className={styles.workshopsSection}>
                <div className={styles.tierHeader}>
                  <span className={styles.tierBadge}>🔧 Talleres disponibles</span>
                </div>
                {workshops.length === 0 ? (
                  <div className={styles.workshopEmpty}>No hay talleres disponibles para esta medida. Elige despacho a domicilio.</div>
                ) : (
                  <div className={styles.workshopList}>
                    {workshops.slice(0, 6).map(t => (
                      <WorkshopCard
                        key={t.id}
                        taller={t}
                        selected={cart.taller?.id === t.id}
                        onSelect={handleWorkshopSelect}
                      />
                    ))}
                  </div>
                )}
                <button className={styles.skipWorkshop} onClick={() => navigate('/checkout')}>
                  Prefiero despacho a domicilio →
                </button>
              </section>
            )}
          </>
        )}
      </main>

      {/* Botón flotante de favoritos */}
      {favorites.length > 0 && (
        <div className={styles.fabFav}>
          <button className={styles.fabBtn} onClick={() => setShowFavPanel(v => !v)}>
            ♥ {favorites.length} favorito{favorites.length !== 1 ? 's' : ''}
          </button>
          {showFavPanel && (
            <div className={styles.favPanel}>
              <div className={styles.favPanelTitle}>Tus favoritos</div>
              {favorites.map(p => (
                <div key={p.id} className={styles.favItem}>
                  <span className={styles.favItemName}>{p.brand || p.marca} {p.name || p.titulo}</span>
                  <span className={styles.favItemPrice}>{fmtPrice((p.price_offer || p.precioOferta) * (wizard.cantidad || 4))}</span>
                </div>
              ))}
              <button className={styles.favQuoteBtn} onClick={handleFavoritesQuote}>
                Cotizar favoritos →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
