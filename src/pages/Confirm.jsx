import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/store/session'
import { fmtPrice } from '@/utils/format'
import styles from './Confirm.module.css'

export default function Confirm() {
  const navigate = useNavigate()
  const { confirmacion, resetWizard, resetCart } = useSessionStore()

  if (!confirmacion) {
    navigate('/')
    return null
  }

  const { tipo, ref, producto, cantidad, total, entrega, taller, direccion, cliente, fecha } = confirmacion
  const esOrden = tipo === 'pagar'
  const medida  = producto?.custom_fields?.medida || producto?.medida || ''

  const handleReset = () => {
    resetWizard()
    resetCart()
    navigate('/')
  }

  const waMessage = encodeURIComponent(
    `Hola! Quiero confirmar mi ${esOrden ? 'pedido' : 'cotización'} ${ref}\n` +
    `${producto?.brand || producto?.marca} ${producto?.name || producto?.titulo}\n` +
    `${medida} · ${cantidad} unidades\n` +
    `Total: ${fmtPrice(total)}`
  )
  const waUrl = `https://wa.me/56900000000?text=${waMessage}`

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Ícono y encabezado */}
        <div className={styles.hero}>
          <div className={styles.checkCircle}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className={styles.heroTitle}>
            {esOrden ? '¡Pedido confirmado!' : '¡Cotización lista!'}
          </h1>
          <p className={styles.heroSub}>
            {esOrden
              ? 'Nos pondremos en contacto pronto para coordinar la entrega.'
              : 'Revisa tu email. Puedes convertir esta cotización en pedido cuando quieras.'}
          </p>
        </div>

        {/* Número de referencia */}
        <div className={styles.refCard}>
          <div className={styles.refLabel}>{esOrden ? 'Número de pedido' : 'Número de cotización'}</div>
          <div className={styles.refNum}>{ref}</div>
        </div>

        {/* Resumen */}
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Producto</span>
            <span>{producto?.brand || producto?.marca} {producto?.name || producto?.titulo}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Medida</span>
            <span>{medida}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Cantidad</span>
            <span>{cantidad} unidades</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Entrega</span>
            <span>
              {entrega === 'taller'    && (taller ? `Taller: ${taller.nombre_comercial}` : 'En taller')}
              {entrega === 'domicilio' && `Instalación en ${direccion || 'domicilio'}`}
              {entrega === 'despacho'  && `Despacho a ${direccion || 'domicilio'}`}
              {entrega === 'retiro'    && 'Retiro en local'}
            </span>
          </div>
          {fecha && (
            <div className={styles.summaryRow}>
              <span>Fecha</span>
              <span>
                {fecha === 'hoy' ? 'Hoy' : fecha === 'manana' ? 'Mañana' : fecha === 'esta semana' ? 'Esta semana' : fecha}
              </span>
            </div>
          )}
          {cliente.email && (
            <div className={styles.summaryRow}>
              <span>Email</span>
              <span>{cliente.email}</span>
            </div>
          )}
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span>Total</span>
            <span>{fmtPrice(total)}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className={styles.actions}>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.waBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Confirmar por WhatsApp
          </a>
          <button className={styles.newBtn} onClick={handleReset}>
            Nueva búsqueda
          </button>
        </div>
      </main>
    </div>
  )
}
