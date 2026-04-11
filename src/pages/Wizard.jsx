import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSessionStore } from '@/store/session'
import { fetchComunas } from '@/utils/api'
import { parseMedida } from '@/utils/format'
import styles from './Wizard.module.css'

// ── Constantes de pasos ────────────────────────────────────────
const STEPS = ['cantidad', 'necesidad', 'medida', 'comuna', 'fecha', 'email']

const NECESIDADES = [
  { key: 'neumaticos',    label: 'Solo neumáticos',             desc: 'Los compro y los instalo por mi cuenta' },
  { key: 'instalacion',   label: 'Neumáticos + instalación',    desc: 'Quiero instalación en taller o a domicilio' },
  { key: 'cotizacion',    label: 'Solo cotizar',                desc: 'Quiero ver precios sin compromiso' },
  { key: 'recomendacion', label: 'Necesito recomendación',      desc: 'No sé qué neumático necesito' },
]

const FECHAS = [
  { key: 'hoy',         label: 'Hoy mismo',    icon: '⚡' },
  { key: 'manana',      label: 'Mañana',        icon: '📅' },
  { key: 'esta semana', label: 'Esta semana',   icon: '🗓️' },
  { key: 'flexible',    label: 'Soy flexible',  icon: '😌' },
]

const MEDIDAS_COMUNES = [
  '175/70R13', '185/65R15', '195/65R15', '195/60R15',
  '205/55R16', '205/60R16', '215/55R17', '225/45R17',
  '225/40R18', '235/35R19',
]

export default function Wizard() {
  const navigate = useNavigate()
  const { wizard, setWizard, resetWizard } = useSessionStore()
  const [step, setStep] = useState(0)
  const [dir, setDir]   = useState(1) // 1=adelante -1=atrás
  const [medidaInput, setMedidaInput] = useState(wizard.medida || '')
  const [comunaInput, setComunaInput] = useState(wizard.comunaNombre || '')
  const [comunaList, setComunaList]   = useState([])
  const [fechaCustom, setFechaCustom] = useState('')
  const inputRef = useRef(null)

  // Foco automático al cambiar paso
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [step])

  // Autocompletar comunas
  useEffect(() => {
    if (comunaInput.length < 2) { setComunaList([]); return }
    fetchComunas(comunaInput).then(d => setComunaList(d || [])).catch(() => setComunaList([]))
  }, [comunaInput])

  const goNext = () => {
    setDir(1)
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else handleFinish()
  }
  const goBack = () => {
    if (step === 0) return
    setDir(-1)
    setStep(s => s - 1)
  }

  const handleFinish = () => {
    navigate('/resultados')
  }

  const canContinue = () => {
    switch (STEPS[step]) {
      case 'cantidad':   return wizard.cantidad >= 1
      case 'necesidad':  return !!wizard.necesidad
      case 'medida':     return wizard.ancho && wizard.perfil && wizard.aro
      case 'comuna':     return !!wizard.comuna
      case 'fecha':      return !!wizard.fecha
      case 'email':      return true // email es opcional
      default:           return true
    }
  }

  // ── Renders de cada paso ─────────────────────────────────────

  function StepCantidad() {
    const qty = wizard.cantidad || 4
    return (
      <div className={styles.stepContent}>
        <div className={styles.question}>¿Cuántos neumáticos necesitas?</div>
        <div className={styles.subtitle}>Selecciona la cantidad o escríbela</div>
        <div className={styles.qtyRow}>
          {[1, 2, 3, 4].map(n => (
            <button key={n}
              className={`${styles.qtyBtn} ${qty === n ? styles.qtyActive : ''}`}
              onClick={() => { setWizard({ cantidad: n }); setTimeout(goNext, 150) }}>
              {n}
            </button>
          ))}
        </div>
        <div className={styles.qtyCustom}>
          <input
            ref={inputRef}
            type="number" min="1" max="20"
            className={styles.input}
            placeholder="Otra cantidad..."
            value={qty > 4 ? qty : ''}
            onChange={e => setWizard({ cantidad: parseInt(e.target.value) || 1 })}
            onKeyDown={e => e.key === 'Enter' && canContinue() && goNext()}
          />
        </div>
      </div>
    )
  }

  function StepNecesidad() {
    return (
      <div className={styles.stepContent}>
        <div className={styles.question}>¿Qué necesitas?</div>
        <div className={styles.subtitle}>Cuéntanos qué buscas</div>
        <div className={styles.optList}>
          {NECESIDADES.map(n => (
            <button key={n.key}
              className={`${styles.optCard} ${wizard.necesidad === n.key ? styles.optActive : ''}`}
              onClick={() => { setWizard({ necesidad: n.key }); setTimeout(goNext, 150) }}>
              <span className={styles.optLabel}>{n.label}</span>
              <span className={styles.optDesc}>{n.desc}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  function StepMedida() {
    const handleMedida = (m) => {
      const p = parseMedida(m)
      setMedidaInput(m)
      setWizard({ medida: m, ancho: p.ancho, perfil: p.perfil, aro: p.aro })
    }
    return (
      <div className={styles.stepContent}>
        <div className={styles.question}>¿Qué medida necesitas?</div>
        <div className={styles.subtitle}>Está en el flanco del neumático. Ej: 205/55R16</div>
        <input
          ref={inputRef}
          type="text"
          className={`${styles.input} ${styles.inputLg}`}
          placeholder="205/55R16"
          value={medidaInput}
          onChange={e => handleMedida(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && canContinue() && goNext()}
        />
        {wizard.ancho && (
          <div className={styles.medidaParsed}>
            <span>Ancho <strong>{wizard.ancho}</strong></span>
            <span>Perfil <strong>{wizard.perfil}</strong></span>
            <span>Aro <strong>R{wizard.aro}</strong></span>
          </div>
        )}
        <div className={styles.medidaList}>
          <div className={styles.medidaListLabel}>Medidas frecuentes:</div>
          <div className={styles.medidaChips}>
            {MEDIDAS_COMUNES.map(m => (
              <button key={m} className={`${styles.chip} ${wizard.medida === m ? styles.chipActive : ''}`}
                onClick={() => { handleMedida(m); setTimeout(goNext, 200) }}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function StepComuna() {
    return (
      <div className={styles.stepContent}>
        <div className={styles.question}>¿Dónde necesitas los neumáticos?</div>
        <div className={styles.subtitle}>Ciudad o comuna para instalación o despacho</div>
        <div className={styles.comunaWrap}>
          <input
            ref={inputRef}
            type="text"
            className={`${styles.input} ${styles.inputLg}`}
            placeholder="Buscar comuna..."
            value={comunaInput}
            onChange={e => setComunaInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canContinue() && goNext()}
          />
          {comunaList.length > 0 && (
            <div className={styles.comunaDropdown}>
              {comunaList.map(c => (
                <button key={c.codigo} className={styles.comunaItem}
                  onClick={() => {
                    setComunaInput(c.nombre)
                    setComunaList([])
                    setWizard({ comuna: c.codigo, comunaNombre: c.nombre })
                    setTimeout(goNext, 150)
                  }}>
                  <span>{c.nombre}</span>
                  <span className={styles.comunaRegion}>{c.region}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function StepFecha() {
    return (
      <div className={styles.stepContent}>
        <div className={styles.question}>¿Para cuándo los necesitas?</div>
        <div className={styles.subtitle}>Te ayuda a mostrarte las opciones más rápidas</div>
        <div className={styles.fechaGrid}>
          {FECHAS.map(f => (
            <button key={f.key}
              className={`${styles.fechaCard} ${wizard.fecha === f.key ? styles.fechaActive : ''}`}
              onClick={() => { setWizard({ fecha: f.key }); setTimeout(goNext, 150) }}>
              <span className={styles.fechaIcon}>{f.icon}</span>
              <span className={styles.fechaLabel}>{f.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.fechaCustomWrap}>
          <input
            type="date"
            className={styles.input}
            value={fechaCustom}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => {
              setFechaCustom(e.target.value)
              setWizard({ fecha: e.target.value })
            }}
          />
        </div>
      </div>
    )
  }

  function StepEmail() {
    return (
      <div className={styles.stepContent}>
        <div className={styles.question}>¿A dónde enviamos tu cotización?</div>
        <div className={styles.subtitle}>Opcional — te enviamos precios y disponibilidad</div>
        <input
          ref={inputRef}
          type="email"
          className={`${styles.input} ${styles.inputLg}`}
          placeholder="tu@email.com"
          value={wizard.email || ''}
          onChange={e => setWizard({ email: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && goNext()}
        />
        <button className={styles.skipBtn} onClick={goNext}>
          Omitir por ahora →
        </button>
      </div>
    )
  }

  const STEP_COMPONENTS = [
    <StepCantidad  key="cantidad"  />,
    <StepNecesidad key="necesidad" />,
    <StepMedida    key="medida"    />,
    <StepComuna    key="comuna"    />,
    <StepFecha     key="fecha"     />,
    <StepEmail     key="email"     />,
  ]

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.logoBtn} onClick={() => { resetWizard(); setStep(0) }}>
          <span className={styles.logoMark}>●</span>
          <span className={styles.logoText}>NeumaticosYa</span>
        </button>
        <div className={styles.stepMeta}>{step + 1} / {STEPS.length}</div>
      </header>

      {/* Barra de progreso */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Contenido del paso */}
      <main className={styles.main}>
        <div className={`${styles.stepWrapper} ${dir > 0 ? styles.slideIn : styles.slideBack}`} key={step}>
          {STEP_COMPONENTS[step]}
        </div>
      </main>

      {/* Footer con navegación */}
      <footer className={styles.footer}>
        {step > 0 && (
          <button className={styles.backBtn} onClick={goBack}>← Atrás</button>
        )}
        <button
          className={`${styles.nextBtn} ${!canContinue() ? styles.nextDisabled : ''}`}
          disabled={!canContinue()}
          onClick={goNext}>
          {step === STEPS.length - 1 ? 'Ver resultados →' : 'Continuar →'}
        </button>
      </footer>
    </div>
  )
}
