import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/store/session'
import { saveQuote, fetchComunas } from '@/utils/api'
import { fmtPrice } from '@/utils/format'
import styles from './Checkout.module.css'

const ENTREGAS = [
  { key: 'taller',     label: 'Instalación en taller',   icon: '🔧', desc: 'Lleva tus neumáticos al taller seleccionado' },
  { key: 'domicilio',  label: 'Instalación a domicilio',  icon: '🏠', desc: 'Un técnico va a tu domicilio' },
  { key: 'despacho',   label: 'Despacho a domicilio',     icon: '📦', desc: 'Te lo enviamos sin instalación' },
  { key: 'retiro',     label: 'Retiro en local',          icon: '🏪', desc: 'Retiras en nuestro local' },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { wizard, cart, setCart, setPendingOrder, setConfirmacion, clearFavorites } = useSessionStore()

  const [cliente, setCliente] = useState({ nombre: '', telefono: '', email: wizard.email || '' })
  const [entrega, setEntrega] = useState(cart.entrega?.tipo || (cart.taller ? 'taller' : ''))
  const [direccion, setDireccion] = useState(cart.direccion || '')
  const [comunaInput, setComunaInput] = useState(wizard.comunaNombre || '')
  const [comunaList, setComunaList] = useState([])
  const [accion, setAccion] = useState('') // 'pagar' | 'cotizar'
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const producto = cart.producto
  const taller   = cart.taller

  if (!producto) {
    navigate('/resultados')
    return null
  }

  const cantidad = wizard.cantidad || 4
  const precio   = producto.price_offer || producto.precioOferta || 0
  const total    = precio * cantidad
  const medida   = producto.custom_fields?.medida || producto.medida

  const handleDireccionComuna = async (val) => {
    setComunaInput(val)
    if (val.length < 2) { setComunaList([]); return }
    const d = await fetchComunas(val).catch(() => [])
    setComunaList(d || [])
  }

  const validate = () => {
    const e = {}
    if (!cliente.nombre.trim())   e.nombre   = 'Ingresa tu nombre'
    if (!cliente.telefono.trim()) e.telefono = 'Ingresa tu teléfono'
    if (!entrega)                 e.entrega  = 'Elige una forma de entrega'
    if ((entrega === 'domicilio' || entrega === 'despacho') && !direccion.trim())
      e.direccion = 'Ingresa la dirección'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const buildPayload = (tipo) => ({
    contact_phone: cliente.telefono,
    contact_name:  cliente.nombre,
    contact_email: cliente.email || wizard.email,
    channel:       'Ecommerce',
    agent_name:    'Ecommerce - Web',
    medida,
    marca:   producto.brand || producto.marca,
    modelo:  producto.name  || producto.titulo,
    cantidad,
    precio_unitario: precio,
    total,
    tipo_servicio:   entrega,
    direccion:       entrega === 'taller' ? taller?.direccion : direccion,
    comuna:          wizard.comunaNombre || wizard.comuna,
    taller_id:       taller?.id,
    taller_nombre:   taller?.nombre_comercial,
    fecha_entrega:   wizard.fecha,
    source:          tipo === 'cotizar' ? 'ecommerce_quote' : 'ecommerce_order',
  })

  const handleIrAlPago = () => {
    if (!validate()) return
    const payload = buildPayload('pagar')
    setPendingOrder({ payload, producto, cantidad, total, entrega, taller, direccion, cliente, fecha: wizard.fecha })
    navigate('/pago')
  }

  const handleCotizar = async () => {
    if (!validate()) return
    setAccion('cotizar')
    setLoading(true)
    try {
      const payload = buildPayload('cotizar')
      const res = await saveQuote({
        ...payload,
        items: [{ product: producto.name || producto.titulo, quantity: cantidad, unit_price: precio, total }]
      }).catch(() => null)
      const ref = res?.nro_cot || `COT-${Date.now().toString().slice(-6)}`
      setConfirmacion({ tipo: 'cotizar', ref, producto, cantidad, total, entrega, taller, direccion, cliente, fecha: wizard.fecha })
      clearFavorites()
      navigate('/confirmacion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/resultados')}>← Volver</button>
        <span className={styles.title}>Finalizar pedido</span>
      </header>

      <main className={styles.main}>
        {/* Resumen producto */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Tu selección</div>
          <div className={styles.productResumen}>
            {(producto.photo_url || producto.foto) && (
              <img src={producto.photo_url || producto.foto} alt={medida} className={styles.productThumb} />
            )}
            <div className={styles.productInfo}>
              <div className={styles.productBrand}>{producto.brand || producto.marca}</div>
              <div className={styles.productName}>{producto.name || producto.titulo}</div>
              <div className={styles.productMedida}>{medida}</div>
              <div className={styles.productPricing}>
                <span className={styles.productUnit}>{fmtPrice(precio)} c/u</span>
                <span className={styles.productQty}>× {cantidad}</span>
                <span className={styles.productTotal}>{fmtPrice(total)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Forma de entrega */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Forma de entrega</div>
          {errors.entrega && <div className={styles.error}>{errors.entrega}</div>}
          <div className={styles.entregaGrid}>
            {ENTREGAS.map(e => (
              <button key={e.key}
                className={`${styles.entregaCard} ${entrega === e.key ? styles.entregaActive : ''}`}
                onClick={() => { setEntrega(e.key); setCart({ entrega: e }) }}>
                <span className={styles.entregaIcon}>{e.icon}</span>
                <span className={styles.entregaLabel}>{e.label}</span>
                <span className={styles.entregaDesc}>{e.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Taller o dirección */}
        {entrega === 'taller' && taller && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Taller seleccionado</div>
            <div className={styles.tallerResumen}>
              <div className={styles.tallerName}>{taller.nombre_comercial}</div>
              <div className={styles.tallerAddr}>{taller.direccion} · {taller.comuna}</div>
              <button className={styles.changeTaller} onClick={() => navigate('/resultados')}>Cambiar →</button>
            </div>
          </section>
        )}

        {(entrega === 'domicilio' || entrega === 'despacho') && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Dirección de entrega</div>
            <input
              className={`${styles.input} ${errors.direccion ? styles.inputError : ''}`}
              placeholder="Calle, número, depto..."
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
            />
            {errors.direccion && <div className={styles.error}>{errors.direccion}</div>}
            <div className={styles.comunaWrap} style={{ position: 'relative', marginTop: 8 }}>
              <input
                className={styles.input}
                placeholder="Comuna..."
                value={comunaInput}
                onChange={e => handleDireccionComuna(e.target.value)}
              />
              {comunaList.length > 0 && (
                <div className={styles.comunaDrop}>
                  {comunaList.map(c => (
                    <button key={c.codigo} className={styles.comunaItem}
                      onClick={() => { setComunaInput(c.nombre); setComunaList([]) }}>
                      {c.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Fecha */}
        {wizard.fecha && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Fecha requerida</div>
            <div className={styles.fechaTag}>
              {wizard.fecha === 'hoy' ? '⚡ Hoy'
               : wizard.fecha === 'manana' ? '📅 Mañana'
               : wizard.fecha === 'esta semana' ? '🗓️ Esta semana'
               : wizard.fecha === 'flexible' ? '😌 Flexible'
               : wizard.fecha}
            </div>
          </section>
        )}

        {/* Datos del cliente */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Tus datos</div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Nombre *</label>
              <input
                className={`${styles.input} ${errors.nombre ? styles.inputError : ''}`}
                placeholder="Tu nombre completo"
                value={cliente.nombre}
                onChange={e => setCliente(c => ({ ...c, nombre: e.target.value }))}
              />
              {errors.nombre && <div className={styles.error}>{errors.nombre}</div>}
            </div>
            <div className={styles.field}>
              <label>Teléfono *</label>
              <input
                className={`${styles.input} ${errors.telefono ? styles.inputError : ''}`}
                placeholder="+56 9 XXXX XXXX"
                value={cliente.telefono}
                onChange={e => setCliente(c => ({ ...c, telefono: e.target.value }))}
              />
              {errors.telefono && <div className={styles.error}>{errors.telefono}</div>}
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="tu@email.com"
                value={cliente.email}
                onChange={e => setCliente(c => ({ ...c, email: e.target.value }))}
              />
            </div>
          </div>
        </section>

        {/* Total */}
        <div className={styles.totalBar}>
          <div>
            <div className={styles.totalLabel}>Total</div>
            <div className={styles.totalAmount}>{fmtPrice(total)}</div>
          </div>
          <div className={styles.totalDetail}>{cantidad} un. × {fmtPrice(precio)}</div>
        </div>

        {/* CTAs */}
        <div className={styles.ctaGroup}>
          <button
            className={styles.btnPrimary}
            disabled={loading}
            onClick={handleIrAlPago}>
            Ir al pago →
          </button>
          <button
            className={`${styles.btnSecondary} ${loading && accion === 'cotizar' ? styles.btnLoading : ''}`}
            disabled={loading}
            onClick={handleCotizar}>
            {loading && accion === 'cotizar' ? <span className={styles.spinner} /> : null}
            Generar cotización
          </button>
        </div>
      </main>
    </div>
  )
}
