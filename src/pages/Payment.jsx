import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/store/session'
import { saveOrder } from '@/utils/api'
import { fmtPrice } from '@/utils/format'
import { useBrandStore } from '@/store/brand'
import styles from './Payment.module.css'

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

function detectBrand(num) {
  const d = num.replace(/\s/g, '')
  if (/^4/.test(d)) return 'visa'
  if (/^5[1-5]/.test(d)) return 'mastercard'
  if (/^3[47]/.test(d)) return 'amex'
  return null
}

export default function Payment() {
  const navigate = useNavigate()
  const { pendingOrder, clearPendingOrder, setConfirmacion, clearFavorites } = useSessionStore()
  const brandLegalName = useBrandStore((s) => s.legalName)

  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [method, setMethod] = useState('tarjeta') // 'tarjeta' | 'transferencia'
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  if (!pendingOrder) {
    navigate('/checkout')
    return null
  }

  const { payload, producto, cantidad, total, entrega, taller, direccion, cliente, fecha } = pendingOrder
  const brand = detectBrand(card.number)

  const validate = () => {
    const e = {}
    if (method === 'tarjeta') {
      if (card.number.replace(/\s/g, '').length < 16) e.number = 'Número de tarjeta inválido'
      if (card.expiry.length < 5) e.expiry = 'Fecha inválida'
      if (card.cvv.length < 3)   e.cvv    = 'CVV inválido'
      if (!card.name.trim())     e.name   = 'Ingresa el nombre del titular'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePay = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await saveOrder({ ...payload, order: { ...payload, status: 'pagado' } }).catch(() => null)
      const ref = res?.nro_orden || `ORD-${Date.now().toString().slice(-6)}`

      setConfirmacion({ tipo: 'pagar', ref, producto, cantidad, total, entrega, taller, direccion, cliente, fecha })
      clearPendingOrder()
      clearFavorites()
      navigate('/confirmacion')
    } finally {
      setLoading(false)
    }
  }

  const maskedNum = card.number
    ? card.number.replace(/\d(?=.{4})/g, '•')
    : '•••• •••• •••• ••••'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/checkout')}>← Volver</button>
        <span className={styles.title}>Pago seguro</span>
        <span className={styles.lock}>🔒</span>
      </header>

      <main className={styles.main}>
        {/* Resumen del pedido */}
        <section className={styles.orderBar}>
          <div className={styles.orderInfo}>
            <span className={styles.orderLabel}>Total a pagar</span>
            <span className={styles.orderTotal}>{fmtPrice(total)}</span>
          </div>
          <div className={styles.orderDetail}>
            {producto?.brand || producto?.marca} {producto?.name || producto?.titulo} · {cantidad} un.
          </div>
        </section>

        {/* Selector de método */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Método de pago</div>
          <div className={styles.methodGrid}>
            <button
              className={`${styles.methodBtn} ${method === 'tarjeta' ? styles.methodActive : ''}`}
              onClick={() => setMethod('tarjeta')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
              </svg>
              Tarjeta
            </button>
            <button
              className={`${styles.methodBtn} ${method === 'transferencia' ? styles.methodActive : ''}`}
              onClick={() => setMethod('transferencia')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Transferencia
            </button>
          </div>
        </section>

        {method === 'tarjeta' && (
          <>
            {/* Vista previa de la tarjeta */}
            <div className={styles.cardPreview}>
              <div className={styles.cardChip}>
                <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
                  <rect width="28" height="22" rx="3" fill="rgba(255,255,255,.25)"/>
                  <rect x="8" y="0" width="12" height="22" rx="0" fill="rgba(255,255,255,.1)"/>
                  <rect x="0" y="7" width="28" height="8" fill="rgba(255,255,255,.1)"/>
                </svg>
              </div>
              <div className={styles.cardNumber}>{maskedNum}</div>
              <div className={styles.cardMeta}>
                <div>
                  <div className={styles.cardMetaLabel}>Titular</div>
                  <div className={styles.cardMetaVal}>{card.name || 'TU NOMBRE'}</div>
                </div>
                <div>
                  <div className={styles.cardMetaLabel}>Vence</div>
                  <div className={styles.cardMetaVal}>{card.expiry || 'MM/AA'}</div>
                </div>
                {brand === 'visa' && (
                  <div className={styles.cardBrand}>VISA</div>
                )}
                {brand === 'mastercard' && (
                  <div className={styles.cardBrandMc}>
                    <span />
                    <span />
                  </div>
                )}
              </div>
            </div>

            {/* Formulario */}
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Datos de la tarjeta</div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Número de tarjeta</label>
                <input
                  className={`${styles.input} ${errors.number ? styles.inputError : ''}`}
                  placeholder="0000 0000 0000 0000"
                  value={card.number}
                  maxLength={19}
                  inputMode="numeric"
                  onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
                />
                {errors.number && <div className={styles.error}>{errors.number}</div>}
              </div>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Vencimiento</label>
                  <input
                    className={`${styles.input} ${errors.expiry ? styles.inputError : ''}`}
                    placeholder="MM/AA"
                    value={card.expiry}
                    maxLength={5}
                    inputMode="numeric"
                    onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                  />
                  {errors.expiry && <div className={styles.error}>{errors.expiry}</div>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>CVV</label>
                  <input
                    className={`${styles.input} ${errors.cvv ? styles.inputError : ''}`}
                    placeholder="•••"
                    value={card.cvv}
                    maxLength={4}
                    inputMode="numeric"
                    type="password"
                    onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  />
                  {errors.cvv && <div className={styles.error}>{errors.cvv}</div>}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre del titular</label>
                <input
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  placeholder="Como aparece en la tarjeta"
                  value={card.name}
                  onChange={e => setCard(c => ({ ...c, name: e.target.value.toUpperCase() }))}
                />
                {errors.name && <div className={styles.error}>{errors.name}</div>}
              </div>
            </section>
          </>
        )}

        {method === 'transferencia' && (
          <section className={styles.section}>
            <div className={styles.transferBox}>
              <div className={styles.transferRow}>
                <span>Banco</span><strong>Banco de Chile</strong>
              </div>
              <div className={styles.transferRow}>
                <span>Tipo de cuenta</span><strong>Cuenta Corriente</strong>
              </div>
              <div className={styles.transferRow}>
                <span>Número</span><strong>123-456-789</strong>
              </div>
              <div className={styles.transferRow}>
                <span>RUT</span><strong>76.543.210-K</strong>
              </div>
              <div className={styles.transferRow}>
                <span>Nombre</span><strong>{brandLegalName}</strong>
              </div>
              <div className={styles.transferRow}>
                <span>Email</span><strong>pagos@tiremax.cl</strong>
              </div>
              <div className={styles.transferRow}>
                <span>Monto</span><strong className={styles.transferTotal}>{fmtPrice(total)}</strong>
              </div>
              <p className={styles.transferNote}>
                Envía el comprobante al email indicado con el asunto <em>Pedido + tu nombre</em>. Te confirmaremos en menos de 2 horas hábiles.
              </p>
            </div>
          </section>
        )}

        {/* Seguridad */}
        <div className={styles.securityBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Pago protegido con cifrado SSL de 256 bits
        </div>

        {/* Botón pagar */}
        <button
          className={`${styles.payBtn} ${loading ? styles.btnLoading : ''}`}
          disabled={loading}
          onClick={handlePay}>
          {loading
            ? <><span className={styles.spinner} />Procesando...</>
            : <>{method === 'tarjeta' ? `Pagar ${fmtPrice(total)}` : `Confirmar transferencia`}</>
          }
        </button>
      </main>
    </div>
  )
}
