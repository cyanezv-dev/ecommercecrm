import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Car, Wrench, FileText, HelpCircle, Circle } from 'lucide-react'
import { useSessionStore } from '@/store/session'
import { fetchComunas } from '@/utils/api'
import { searchComunas, bestComunaMatchFromGeocoderText } from '@/utils/comunas'
import { loadGoogleMapsScript } from '@/utils/googleMapsLoader'
import { comunaFromGooglePlace } from '@/utils/googlePlaceToComuna'
import { parseMedida } from '@/utils/format'
import { useBrandStore } from '@/store/brand'
import styles from './Wizard.module.css'

const STEPS = ['cantidad', 'necesidad', 'medida', 'comuna', 'fecha', 'email']

const STEP_LABELS = {
  cantidad:  'Cantidad',
  necesidad: 'Necesidad',
  medida:    'Medida',
  comuna:    'Comuna',
  fecha:     'Fecha',
  email:     'Email',
}

const NECESIDADES = [
  { key: 'neumaticos',    label: 'Solo neumáticos',          desc: 'Los compro y los instalo por mi cuenta',        icon: <Circle    size={22} /> },
  { key: 'instalacion',   label: 'Neumáticos + instalación', desc: 'Quiero instalación en taller o a domicilio',    icon: <Wrench    size={22} /> },
  { key: 'cotizacion',    label: 'Solo cotizar',             desc: 'Quiero ver precios sin compromiso',             icon: <FileText  size={22} /> },
  { key: 'recomendacion', label: 'Necesito recomendación',   desc: 'No sé qué neumático necesito',                  icon: <HelpCircle size={22} /> },
]

const FECHAS = [
  { key: 'hoy',         label: 'Hoy mismo',   icon: '⚡' },
  { key: 'manana',      label: 'Mañana',       icon: '📅' },
  { key: 'esta semana', label: 'Esta semana',  icon: '🗓️' },
  { key: 'flexible',    label: 'Soy flexible', icon: '😌' },
]

const MEDIDAS_COMUNES = [
  '175/70R13', '185/65R15', '195/65R15', '195/60R15',
  '205/55R16', '205/60R16', '215/55R17', '225/45R17',
  '225/40R18', '235/35R19',
]

// Framer-motion variants
const questionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -20 },
}
const containerVariants = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
}
const itemVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function Wizard() {
  const navigate = useNavigate()
  const { wizard, setWizard, resetWizard } = useSessionStore()
  const brandName = useBrandStore((s) => s.name)
  const brandLogoUrl = useBrandStore((s) => s.logoUrl)
  const [step, setStep]               = useState(0)
  const [dir, setDir]                 = useState(1)
  const [medidaInput, setMedidaInput] = useState(wizard.medida || '')
  const [comunaInput, setComunaInput] = useState(wizard.comunaNombre || '')
  const [comunaList, setComunaList]   = useState([])
  const [locLoading, setLocLoading]   = useState(false)
  const [locError, setLocError]       = useState('')
  const [fechaCustom, setFechaCustom] = useState('')
  const inputRef = useRef(null)
  const addressInputRef = useRef(null)
  const googleAutocompleteRef = useRef(null)
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  // Foco automático
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 350)
  }, [step])

  // Autocompletar comunas con debounce + auto-select coincidencia exacta (defensivo: API usa `comuna` u otros nombres)
  useEffect(() => {
    const q = comunaInput.trim()
    if (q.length < 2) {
      setComunaList([])
      return
    }
    const timer = setTimeout(() => {
      fetchComunas(q)
        .then((list) => {
          const raw = Array.isArray(list) ? list : []
          const safe = raw.filter((c) => c && (c.nombre || c.codigo))
          const qn = q.toLowerCase()
          const exact = safe.find((c) => (c.nombre || '').toLowerCase() === qn)
          if (exact && String(exact.codigo || '').length > 0) {
            setComunaList([])
            setWizard({
              comuna: String(exact.codigo),
              comunaNombre: exact.nombre || String(exact.codigo),
              direccionCliente: '',
            })
          } else {
            setComunaList(safe)
          }
        })
        .catch(() => setComunaList(searchComunas(q, 8)))
    }, 300)
    return () => clearTimeout(timer)
  }, [comunaInput, setWizard])

  useEffect(() => {
    if (!googleMapsKey || STEPS[step] !== 'comuna') {
      if (googleAutocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(googleAutocompleteRef.current)
        googleAutocompleteRef.current = null
      }
      return
    }

    let cancelled = false
    const raf = requestAnimationFrame(() => {
      const el = addressInputRef.current
      if (!el || cancelled) return

      loadGoogleMapsScript(googleMapsKey)
        .then(() => {
          if (cancelled || !addressInputRef.current) return
          const Autocomplete = window.google?.maps?.places?.Autocomplete
          if (!Autocomplete) return

          const ac = new Autocomplete(el, {
            componentRestrictions: { country: 'cl' },
            fields: ['address_components', 'formatted_address', 'geometry'],
          })
          googleAutocompleteRef.current = ac
          ac.addListener('place_changed', () => {
            const place = ac.getPlace()
            if (!place?.address_components?.length) {
              setLocError('No obtuvimos datos de esa dirección. Prueba otra o busca la comuna abajo.')
              return
            }
            const hit = comunaFromGooglePlace(place)
            if (hit?.codigo && hit?.nombre) {
              setComunaInput(hit.nombre)
              setComunaList([])
              setLocError('')
              setWizard({
                comuna: String(hit.codigo),
                comunaNombre: hit.nombre,
                direccionCliente: place.formatted_address || '',
              })
            } else {
              setLocError(
                'No pudimos asociar esa dirección a una comuna de Chile. Busca la comuna manualmente o prueba otra dirección.',
              )
            }
          })
        })
        .catch(() => {
          if (!cancelled) {
            setLocError(
              'No se pudo cargar el buscador de Google. Usa tu ubicación, escribe la comuna o revisa la clave en la configuración.',
            )
          }
        })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (googleAutocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(googleAutocompleteRef.current)
        googleAutocompleteRef.current = null
      }
    }
  }, [step, googleMapsKey, setWizard])

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      setLocError('Tu navegador no permite geolocalización.')
      return
    }
    setLocLoading(true)
    setLocError('')
    try {
      const pos = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: false,
          timeout: 18000,
          maximumAge: 120000,
        })
      })
      const { latitude, longitude } = pos.coords
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es&zoom=18`
      const resp = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!resp.ok) {
        setLocError('No pudimos consultar el mapa. Busca la comuna abajo.')
        return
      }
      const data = await resp.json()
      const addr = data.address || {}
      const cityLine =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        addr.city_district ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.hamlet ||
        ''

      const displayHints = String(data.display_name || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5)
        .join(' ')

      let found =
        bestComunaMatchFromGeocoderText(cityLine) ||
        bestComunaMatchFromGeocoderText([addr.suburb, addr.city || addr.town].filter(Boolean).join(' ')) ||
        bestComunaMatchFromGeocoderText(displayHints)

      if (!found && cityLine) {
        const remote = await fetchComunas(cityLine).catch(() => searchComunas(cityLine, 8))
        const list = Array.isArray(remote) ? remote : []
        if (list[0]?.codigo) found = list[0]
      }

      if (found) {
        setComunaInput(found.nombre)
        setComunaList([])
        setWizard({ comuna: String(found.codigo), comunaNombre: found.nombre, direccionCliente: '' })
        return
      }

      if (cityLine) setComunaInput(cityLine)
      setLocError('No encontramos esa zona en el listado de comunas. Prueba con otra búsqueda o más arriba.')
    } catch (e) {
      const code = typeof e?.code === 'number' ? e.code : null
      if (code === 1)
        setLocError('Ubicación bloqueada. Permite el acceso en el navegador o escribe la comuna.')
      else if (code === 2)
        setLocError('Ubicación no disponible. Escribe la comuna manualmente.')
      else if (code === 3)
        setLocError('Tiempo agotado. Intenta de nuevo o escribe la comuna.')
      else setLocError('No pudimos usar tu ubicación. Escribe la comuna.')
    } finally {
      setLocLoading(false)
    }
  }

  const goNext = () => {
    setDir(1)
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else navigate('/resultados')
  }
  const goBack = () => {
    if (step === 0) return
    setDir(-1)
    setStep(s => s - 1)
  }

  const canContinue = () => {
    switch (STEPS[step]) {
      case 'cantidad':  return wizard.cantidad >= 1
      case 'necesidad': return !!wizard.necesidad
      case 'medida':    return wizard.ancho && wizard.perfil && wizard.aro
      case 'comuna':    return !!wizard.comuna
      case 'fecha':     return !!wizard.fecha
      case 'email':     return true
      default:          return true
    }
  }

  // ── Paso: Cantidad ──────────────────────────────────────────
  function StepCantidad() {
    const qty = wizard.cantidad || 4
    return (
      <div className={styles.stepContent}>
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className={styles.numberGrid}
        >
          {[1, 2, 3, 4, 5, 6].map(n => (
            <motion.button key={n} variants={itemVariants}
              className={`${styles.numBtn} ${qty === n ? styles.numBtnActive : ''}`}
              onClick={() => { setWizard({ cantidad: n }); setTimeout(goNext, 300) }}>
              {n}
            </motion.button>
          ))}
        </motion.div>
        <motion.div variants={itemVariants} initial="initial" animate="animate" className={styles.qtyCustom}>
          <input
            ref={inputRef}
            type="number" min="1" max="20"
            className={styles.input}
            placeholder="Otra cantidad…"
            value={qty > 6 ? qty : ''}
            onChange={e => setWizard({ cantidad: parseInt(e.target.value) || 1 })}
            onKeyDown={e => e.key === 'Enter' && canContinue() && goNext()}
          />
        </motion.div>
      </div>
    )
  }

  // ── Paso: Necesidad ─────────────────────────────────────────
  function StepNecesidad() {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className={styles.optList}
      >
        {NECESIDADES.map(n => {
          const active = wizard.necesidad === n.key
          return (
            <motion.button key={n.key} variants={itemVariants}
              className={`${styles.optCard} ${active ? styles.optActive : ''}`}
              onClick={() => { setWizard({ necesidad: n.key }); setTimeout(goNext, 300) }}>
              <div className={styles.optLeft}>
                <div className={`${styles.optIcon} ${active ? styles.optIconActive : ''}`}>
                  {n.icon}
                </div>
                <div>
                  <span className={styles.optLabel}>{n.label}</span>
                  <span className={styles.optDesc}>{n.desc}</span>
                </div>
              </div>
              <div className={`${styles.optCheck} ${active ? styles.optCheckActive : ''}`}>
                {active && <Check size={14} />}
              </div>
            </motion.button>
          )
        })}
      </motion.div>
    )
  }

  // ── Paso: Medida ────────────────────────────────────────────
  function StepMedida() {
    const handleMedida = (m) => {
      const p = parseMedida(m)
      setMedidaInput(m)
      setWizard({ medida: m, ancho: p.ancho, perfil: p.perfil, aro: p.aro })
    }
    return (
      <div className={styles.stepContent}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <input
            ref={inputRef}
            type="text"
            className={`${styles.input} ${styles.inputLg}`}
            placeholder="205/55R16"
            value={medidaInput}
            onChange={e => handleMedida(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canContinue() && goNext()}
          />
        </motion.div>
        {wizard.ancho && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={styles.medidaParsed}>
            <span>Ancho <strong>{wizard.ancho}</strong></span>
            <span>Perfil <strong>{wizard.perfil}</strong></span>
            <span>Aro <strong>R{wizard.aro}</strong></span>
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className={styles.medidaListLabel}>Medidas frecuentes</div>
          <div className={styles.medidaChips}>
            {MEDIDAS_COMUNES.map((m, i) => (
              <motion.button key={m}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.03 }}
                className={`${styles.chip} ${wizard.medida === m ? styles.chipActive : ''}`}
                onClick={() => { handleMedida(m); setTimeout(goNext, 200) }}>
                {m}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Paso: Comuna ────────────────────────────────────────────
  function StepComuna() {
    const isSelected = !!wizard.comuna
    return (
      <div className={styles.stepContent}>
        {googleMapsKey ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className={styles.googleAddressBlock}
          >
            <p className={styles.addressHint}>
              Escribe la dirección desde donde estás (calle y número, comuna o referencia). Solo direcciones en Chile.
            </p>
            <input
              ref={addressInputRef}
              type="text"
              className={`${styles.input} ${styles.inputLg}`}
              placeholder="Ej: Av. Apoquindo 3000, Las Condes"
              autoComplete="off"
              name="direccion-chile-google"
              defaultValue=""
            />
          </motion.div>
        ) : null}

        <motion.button
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={styles.locBtn}
          onClick={handleUseLocation}
          disabled={locLoading}
          type="button">
          <span className={styles.locIcon}>{locLoading ? '⏳' : '📍'}</span>
          {locLoading ? 'Detectando tu ubicación…' : 'Usar mi ubicación actual'}
        </motion.button>

        {locError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.locError}>
            {locError}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className={styles.locDivider}>
          <span>o escribe la comuna</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className={styles.comunaWrap}>
          <input
            ref={inputRef}
            type="text"
            className={`${styles.input} ${styles.inputLg} ${isSelected ? styles.inputOk : ''}`}
            placeholder="Buscar comuna…"
            value={comunaInput}
            onChange={e => {
              setComunaInput(e.target.value)
              setLocError('')
              if (wizard.comuna) setWizard({ comuna: '', comunaNombre: '', direccionCliente: '' })
            }}
            onKeyDown={e => e.key === 'Enter' && canContinue() && goNext()}
          />
          {isSelected && <span className={styles.inputOkIcon}><Check size={18} /></span>}
          {comunaList.length > 0 && (
            <div className={styles.comunaDropdown}>
              {comunaList.map(c => (
                <button key={c.codigo} className={styles.comunaItem}
                  onClick={() => {
                    setComunaInput(c.nombre); setComunaList([])
                    setWizard({ comuna: c.codigo, comunaNombre: c.nombre, direccionCliente: '' })
                    setTimeout(goNext, 150)
                  }}>
                  <span>{c.nombre}</span>
                  <span className={styles.comunaRegion}>{c.region}</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  // ── Paso: Fecha ─────────────────────────────────────────────
  function StepFecha() {
    return (
      <div className={styles.stepContent}>
        <motion.div variants={containerVariants} initial="initial" animate="animate"
          className={styles.fechaGrid}>
          {FECHAS.map(f => (
            <motion.button key={f.key} variants={itemVariants}
              className={`${styles.fechaCard} ${wizard.fecha === f.key ? styles.fechaActive : ''}`}
              onClick={() => { setWizard({ fecha: f.key }); setTimeout(goNext, 300) }}>
              <span className={styles.fechaIcon}>{f.icon}</span>
              <span className={styles.fechaLabel}>{f.label}</span>
            </motion.button>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className={styles.fechaCustomWrap}>
          <input
            type="date"
            className={styles.input}
            value={fechaCustom}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => { setFechaCustom(e.target.value); setWizard({ fecha: e.target.value }) }}
          />
        </motion.div>
      </div>
    )
  }

  // ── Paso: Email ─────────────────────────────────────────────
  function StepEmail() {
    return (
      <div className={styles.stepContent}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <input
            ref={inputRef}
            type="email"
            className={`${styles.input} ${styles.inputLg}`}
            placeholder="tu@email.com"
            value={wizard.email || ''}
            onChange={e => setWizard({ email: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && goNext()}
          />
        </motion.div>
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className={styles.skipBtn} onClick={goNext}>
          Omitir por ahora
        </motion.button>
      </div>
    )
  }

  const renderStep = () => {
    switch (STEPS[step]) {
      case 'cantidad':  return StepCantidad()
      case 'necesidad': return StepNecesidad()
      case 'medida':    return StepMedida()
      case 'comuna':    return StepComuna()
      case 'fecha':     return StepFecha()
      case 'email':     return StepEmail()
      default:          return null
    }
  }

  const STEP_SUBTITLES = {
    cantidad:  'Selecciona la cantidad que quieres cotizar',
    necesidad: 'Selecciona el tipo de servicio que te interesa',
    medida:    'La puedes ver en el costado del neumático. Ejemplo: 205/55R16',
    comuna:    'Comuna o ciudad para instalación o despacho a domicilio',
    fecha:     'Así te mostramos las opciones más rápidas',
    email:     'Opcional: te mandamos precios y disponibilidad',
  }

  const STEP_QUESTIONS = {
    cantidad:  '¿Cuántos neumáticos necesitas?',
    necesidad: '¿Qué necesitas?',
    medida:    '¿Qué medida necesitas?',
    comuna:    '¿Dónde necesitas los neumáticos?',
    fecha:     '¿Para cuándo los necesitas?',
    email:     '¿A dónde enviamos tu cotización?',
  }

  const progress = ((step + 1) / STEPS.length) * 100
  const currentStepKey = STEPS[step]

  return (
    <div className={styles.page}>
      {/* Progress bar — fixed top, animated con framer-motion */}
      <div className={styles.progressBar}>
        <motion.div
          className={styles.progressFill}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Header fijo con backdrop blur */}
      <header className={styles.header}>
        <button
          className={`${styles.backBtn} ${step === 0 ? styles.backBtnHidden : ''}`}
          onClick={goBack}
          aria-label="Atrás">
          <ArrowLeft size={16} />
          Atrás
        </button>

        <button className={styles.logoBtn} onClick={() => { resetWizard(); setStep(0) }} type="button">
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt={brandName} className={styles.logoImg} />
          ) : (
            <>
              <Car size={18} className={styles.logoIcon} />
              <span className={styles.logoText}>{brandName}</span>
            </>
          )}
        </button>

        <span className={styles.stepMeta}>
          {step + 1} de {STEPS.length}
        </span>
      </header>

      {/* Contenido centrado verticalmente */}
      <main className={`${styles.main} ${currentStepKey === 'comuna' ? styles.mainComunaRoom : ''}`}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              initial: (d) => ({ opacity: 0, y: d > 0 ? 20 : -20 }),
              animate: { opacity: 1, y: 0 },
              exit:    (d) => ({ opacity: 0, y: d > 0 ? -20 : 20 }),
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={styles.stepWrapper}
          >
            {/* Question header */}
            <div className={styles.questionBlock}>
              <motion.h1
                className={styles.question}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}>
                {STEP_QUESTIONS[currentStepKey]}
              </motion.h1>
              <motion.p
                className={styles.subtitle}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}>
                {STEP_SUBTITLES[currentStepKey]}
              </motion.p>
            </div>

            {/* Step content */}
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer fijo con gradiente — solo cuando hay acción manual */}
      <AnimatePresence>
        {canContinue() && !['necesidad', 'fecha'].includes(currentStepKey) && (
          <motion.div
            key="footer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className={styles.footer}>
            <button
              className={styles.nextBtn}
              onClick={goNext}>
              {step === STEPS.length - 1 ? 'Ver resultados' : 'Continuar'}
              <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
