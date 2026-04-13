import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft, Phone, ShieldCheck, Car, MapPin, ChevronDown, Check, Truck, Home, Store, Circle, Clock, Navigation, RotateCcw, X, Calendar, Zap, Settings2, CreditCard, Lock, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useBrandStore } from "@/store/brand"
import { comunasAutocompleteOptions } from "@/utils/comunasOptions"
export type CatalogBadgeVariant = "ext" | "oem" | "runflat"

export interface Tire {
  id: string
  name: string
  /** Línea bajo la marca (catálogo CRM: familia / modelo). */
  familia: string
  modelo: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  badge?: string
  rating: number
  reviews: number
  size: string
  features: string[]
  /** Homologación OEM / EXT / RunFlat desde `custom_fields` del catálogo (misma idea que el panel CRM). */
  catalogBadges?: { label: string; variant: CatalogBadgeVariant }[]
  category: "premium" | "conveniencia" | "economico"
  /** Producto original del catálogo / CRM (no mostrar en UI) */
  crmProduct?: Record<string, unknown>
}

export interface Workshop {
  id: string
  name: string
  address: string
  comuna: string
  distance: string
  rating: number
  reviews: number
  availableSlots: number
  openUntil: string
  /** Taller original del API CRM */
  crmWorkshop?: Record<string, unknown>
}

const quantityOptions = [1, 2, 3, 4, 5, 6]

const deliveryOptions = [
  { id: "despacho", label: "Despacho a domicilio", icon: <Truck className="w-4 h-4" /> },
  { id: "instalacion-domicilio", label: "Instalación a domicilio", icon: <Home className="w-4 h-4" /> },
  { id: "serviteca", label: "Serviteca", icon: <Store className="w-4 h-4" /> },
]

// Custom refined category icons
function PremiumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" />
    </svg>
  )
}

function ConvenienceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7V12L15 14" />
      <path d="M8 16L6 18" />
      <path d="M16 16L18 18" />
    </svg>
  )
}

function EconomicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3V21" />
      <path d="M16 7H10C8.34 7 7 8.34 7 10C7 11.66 8.34 13 10 13H14C15.66 13 17 14.34 17 16C17 17.66 15.66 19 14 19H7" />
    </svg>
  )
}

// Logos de marcas de neumáticos
function BrandLogo({ brand, className }: { brand: string; className?: string }) {
  const logos: Record<string, React.ReactNode> = {
    "Michelin": (
      <svg className={className} viewBox="0 0 80 20" fill="currentColor">
        <path d="M10 2C6 2 3 5 3 9s3 7 7 7c2 0 4-1 5-2v2h3V2h-3v2c-1-1-3-2-5-2zm0 3c2.5 0 5 2 5 4s-2.5 4-5 4-5-2-5-4 2.5-4 5-4z"/>
        <circle cx="10" cy="9" r="2" fill="currentColor"/>
        <text x="22" y="14" fontSize="10" fontWeight="bold" fontFamily="Arial">MICHELIN</text>
      </svg>
    ),
    "Bridgestone": (
      <svg className={className} viewBox="0 0 90 20" fill="currentColor">
        <path d="M3 4h6c3 0 5 1.5 5 4s-2 4-5 4H6v5H3V4zm3 6h2.5c1.5 0 2.5-.5 2.5-2s-1-2-2.5-2H6v4z"/>
        <text x="16" y="14" fontSize="9" fontWeight="bold" fontFamily="Arial">BRIDGESTONE</text>
      </svg>
    ),
    "Goodyear": (
      <svg className={className} viewBox="0 0 80 20" fill="currentColor">
        <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 10c0-1.5 1.5-3 3-3s3 1.5 3 3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <text x="20" y="14" fontSize="10" fontWeight="bold" fontFamily="Arial">GOODYEAR</text>
      </svg>
    ),
    "Continental": (
      <svg className={className} viewBox="0 0 90 20" fill="currentColor">
        <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M10 5v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <text x="20" y="14" fontSize="9" fontWeight="bold" fontFamily="Arial">CONTINENTAL</text>
      </svg>
    ),
    "Pirelli": (
      <svg className={className} viewBox="0 0 70 20" fill="currentColor">
        <path d="M3 4h6c3 0 5 1.5 5 4s-2 4-5 4H6v5H3V4zm3 6h2.5c1.5 0 2.5-.5 2.5-2s-1-2-2.5-2H6v4z"/>
        <text x="16" y="14" fontSize="10" fontWeight="bold" fontFamily="Arial">PIRELLI</text>
      </svg>
    ),
    "Yokohama": (
      <svg className={className} viewBox="0 0 80 20" fill="currentColor">
        <path d="M5 4l5 6 5-6h3l-7 8v5h-3v-5L1 4h4z"/>
        <text x="22" y="14" fontSize="9" fontWeight="bold" fontFamily="Arial">YOKOHAMA</text>
      </svg>
    ),
  }

  return logos[brand] || <span className="text-sm font-semibold">{brand}</span>
}

const categoryInfo = {
  premium: {
    title: "Premium",
    description: "Las mejores marcas con tecnología de punta",
    icon: <PremiumIcon className="w-5 h-5" />,
    color: "bg-amber-50 text-amber-800 border-amber-200/60"
  },
  conveniencia: {
    title: "Conveniencia",
    description: "Excelente relación calidad-precio",
    icon: <ConvenienceIcon className="w-5 h-5" />,
    color: "bg-slate-50 text-slate-700 border-slate-200/60"
  },
  economico: {
    title: "Económicos",
    description: "Los mejores precios del mercado",
    icon: <EconomicIcon className="w-5 h-5" />,
    color: "bg-emerald-50 text-emerald-800 border-emerald-200/60"
  }
}

interface FilterDropdownProps {
  label: string
  value: string
  options: { id: string; label: string; icon?: React.ReactNode }[]
  onChange: (value: string) => void
  icon?: React.ReactNode
}

function FilterDropdown({ label, value, options, onChange, icon }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(o => o.id === value)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left min-w-[160px]",
          "hover:border-primary hover:bg-card",
          isOpen ? "border-primary bg-card shadow-md" : "border-border bg-card"
        )}
      >
        {icon && <span className="text-accent shrink-0">{icon}</span>}
        <div className="flex-1 min-w-0">
          <span className="block text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
          <span className="block text-sm font-medium text-foreground truncate">
            {selectedOption?.label || "Seleccionar"}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 py-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto"
            >
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onChange(option.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    "hover:bg-muted",
                    value === option.id && "bg-primary/5"
                  )}
                >
                  {option.icon && <span className="text-muted-foreground">{option.icon}</span>}
                  <span className="flex-1 text-sm text-foreground">{option.label}</span>
                  {value === option.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export interface ComunaWizardSlice {
  comuna?: string
  comunaNombre?: string
}

interface ComunaAutocompleteFilterProps {
  comunaWizard: ComunaWizardSlice
  value: string
  onChange: (value: string) => void
}

function ComunaAutocompleteFilter({ comunaWizard, value, onChange }: ComunaAutocompleteFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const nearbyRows = useMemo(
    () => comunasAutocompleteOptions(comunaWizard, ""),
    [comunaWizard.comuna, comunaWizard.comunaNombre],
  )

  const rows = useMemo(
    () => comunasAutocompleteOptions(comunaWizard, searchQuery),
    [comunaWizard.comuna, comunaWizard.comunaNombre, searchQuery],
  )

  const selectedLabel =
    nearbyRows.find((o) => o.id === value)?.label ||
    rows.find((o) => o.id === value)?.label ||
    String(comunaWizard.comunaNombre || "").trim() ||
    "Seleccionar"

  useEffect(() => {
    if (isOpen) setSearchQuery("")
  }, [isOpen])

  return (
    <div className="relative min-w-[200px] max-w-[min(100vw-3rem,320px)]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left w-full",
          "hover:border-primary hover:bg-card",
          isOpen ? "border-primary bg-card shadow-md" : "border-border bg-card",
        )}
      >
        <span className="text-accent shrink-0">
          <MapPin className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <span className="block text-xs text-muted-foreground uppercase tracking-wide">Comuna</span>
          <span className="block text-sm font-medium text-foreground truncate">{selectedLabel}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform shrink-0",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col max-h-80"
            >
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar comuna…"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    autoFocus
                  />
                </div>
                {!searchQuery.trim() && (
                  <p className="px-2 pt-2 text-[11px] text-muted-foreground">Primero tu región; escribe para ver todo Chile</p>
                )}
              </div>
              <div className="overflow-y-auto py-1 min-h-0">
                {rows.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground text-center">Sin coincidencias</p>
                ) : (
                  rows.map((option) => (
                    <button
                      key={option.id || option.label}
                      type="button"
                      disabled={!option.id}
                      onClick={() => {
                        if (!option.id) return
                        onChange(option.id)
                        setIsOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        option.id ? "hover:bg-muted" : "opacity-60 cursor-not-allowed",
                        value === option.id && "bg-primary/5",
                      )}
                    >
                      <span className="flex-1 text-sm text-foreground">{option.label}</span>
                      {value === option.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

interface QuantityFilterProps {
  value: number
  onChange: (value: number) => void
}

function QuantityFilter({ value, onChange }: QuantityFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left min-w-[140px]",
          "hover:border-primary hover:bg-card",
          isOpen ? "border-primary bg-card shadow-md" : "border-border bg-card"
        )}
      >
        <Circle className="w-4 h-4 text-accent shrink-0" />
        <div className="flex-1">
          <span className="block text-xs text-muted-foreground uppercase tracking-wide">Cantidad</span>
          <span className="block text-sm font-medium text-foreground">{value} neumáticos</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 p-3 bg-card border border-border rounded-xl shadow-lg z-50"
            >
              <div className="flex gap-2">
                {quantityOptions.map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      onChange(num)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-all",
                      "hover:border-primary hover:bg-muted",
                      value === num 
                        ? "border-primary bg-primary text-primary-foreground" 
                        : "border-border text-foreground"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

interface TireCardProps {
  tire: Tire
  quantity: number
  deliveryType: string
  deliveryLabel: string
  onSelect: (tire: Tire) => void
}

/** Quita "Neumatico MARCA " del título comercial cuando no hay familia/modelo en CRM. */
function tituloSinPrefijoComercial(name: string, brand: string) {
  let s = String(name || '').trim()
  if (!s) return ''
  s = s.replace(/^(neumático|neumatico)\s+/i, '').trim()
  const b = String(brand || '').trim()
  if (b) {
    const esc = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    s = s.replace(new RegExp(`^${esc}\\s+`, 'i'), '').trim()
  }
  return s
}

function tireFamiliaModeloLine(tire: Tire) {
  const parts = [tire.familia, tire.modelo].filter(Boolean)
  if (parts.length) return parts.join(' · ')
  const short = tituloSinPrefijoComercial(tire.name, tire.brand)
  return short || tire.size || '—'
}

function catalogBadgeClass(variant: CatalogBadgeVariant) {
  if (variant === "ext") return "bg-emerald-600 text-white"
  if (variant === "runflat") return "bg-emerald-700 text-white"
  return "bg-[#1e3a5f] text-white"
}

function TireCard({ tire, quantity, deliveryType, deliveryLabel, onSelect }: TireCardProps) {
  const subtotal = tire.price * quantity
  
  // Costos separados
  const despachoCost = deliveryType !== "serviteca" ? 5990 : 0
  const instalacionCost = deliveryType === "instalacion-domicilio" ? 19990 : 0
  
  const total = subtotal + despachoCost + instalacionCost
  const cuotas12 = Math.round(total / 12)
  
  return (
    <div className="group h-full flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden shrink-0" style={{ minHeight: '160px' }}>
        <img
          src={tire.image}
          alt={`${tire.brand} ${tire.name}`}
          className="absolute inset-0 h-full w-full object-contain object-center mix-blend-multiply"
        />
        {tire.badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
            {tire.badge}
          </span>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-auto">
          <div className="flex items-center gap-2 mb-1">
            <BrandLogo brand={tire.brand} className="h-4 w-auto text-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1 line-clamp-2">
            {tireFamiliaModeloLine(tire)}
          </p>
          <p className="text-xs text-muted-foreground mb-3">Medida: {tire.size}</p>
          
          <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
            {(tire.catalogBadges ?? []).map((b) => (
              <span
                key={`${b.variant}-${b.label}`}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded font-mono leading-none",
                  catalogBadgeClass(b.variant),
                )}
              >
                {b.label}
              </span>
            ))}
            {tire.features.slice(0, 2).map((feature, i) => (
              <span key={i} className="px-2 py-0.5 bg-muted text-xs text-muted-foreground rounded h-fit">
                {feature}
              </span>
            ))}
          </div>
        </div>
        
        <div className="border-t border-border pt-3 mb-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{quantity}x ${tire.price.toLocaleString("es-CL")}</span>
            <span className="text-foreground">${subtotal.toLocaleString("es-CL")}</span>
          </div>
          
          {/* Instalación */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Instalación</span>
            {deliveryType === "serviteca" ? (
              <span className="text-green-600 font-medium">Gratis</span>
            ) : deliveryType === "instalacion-domicilio" ? (
              <span className="text-foreground">+${instalacionCost.toLocaleString("es-CL")}</span>
            ) : (
              <span className="text-muted-foreground">No incluida</span>
            )}
          </div>
          
          {/* Despacho */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Despacho</span>
            {deliveryType === "serviteca" ? (
              <span className="text-muted-foreground">Retiro en taller</span>
            ) : (
              <span className="text-foreground">+${despachoCost.toLocaleString("es-CL")}</span>
            )}
          </div>
          
          <div className="flex justify-between pt-2 border-t border-dashed border-border">
            <span className="font-medium text-foreground">Total</span>
            <span className="text-lg font-bold text-foreground">${total.toLocaleString("es-CL")}</span>
          </div>
        </div>
        
        {/* Promociones */}
        <div className="space-y-2 mb-3">
          {/* Cuotas */}
          <div className="flex items-center gap-2.5 p-2.5 bg-muted/50 rounded-lg border border-border">
            <div className="shrink-0">
              <svg className="w-8 h-5" viewBox="0 0 32 20" fill="none">
                <rect width="32" height="20" rx="2" fill="#1A1F71"/>
                <path d="M12 14L14 6H16L14 14H12Z" fill="#F7B600"/>
                <path d="M17 6L15 14H17L18.5 8.5L20 14H22L20 6H17Z" fill="white"/>
                <circle cx="24" cy="10" r="3" fill="#EB001B"/>
                <circle cx="27" cy="10" r="3" fill="#F79E1B" fillOpacity="0.8"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">
                12 cuotas de ${cuotas12.toLocaleString("es-CL")}
              </p>
              <p className="text-[10px] text-muted-foreground">Sin interés</p>
            </div>
          </div>
          
          {/* Giftcard regalo */}
          <div className="flex items-center gap-2.5 p-2.5 bg-muted/50 rounded-lg border border-border">
            <div className="shrink-0">
              <svg className="w-8 h-5" viewBox="0 0 32 20" fill="none">
                <rect width="32" height="20" rx="3" fill="url(#giftGradient)"/>
                <rect x="0.5" y="0.5" width="31" height="19" rx="2.5" stroke="white" strokeOpacity="0.2"/>
                <path d="M16 4V16M10 10H22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="13" cy="7" r="2" fill="white" fillOpacity="0.9"/>
                <circle cx="19" cy="7" r="2" fill="white" fillOpacity="0.9"/>
                <defs>
                  <linearGradient id="giftGradient" x1="0" y1="0" x2="32" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#8B5CF6"/>
                    <stop offset="1" stopColor="#D946EF"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">
                Regalo GiftCard $50.000
              </p>
              <p className="text-[10px] text-muted-foreground">Por tu compra</p>
            </div>
          </div>
        </div>
        
        <Button className="w-full gap-2 shrink-0" size="sm" onClick={() => onSelect(tire)}>
          Seleccionar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// Modal de reserva
interface ReservationModalProps {
  tire: Tire | null
  quantity: number
  deliveryType: string
  workshops: Workshop[]
  comunaLabel: string
  onClose: () => void
  onChangeDelivery: () => void
  onConfirmCheckout: (payload: {
    workshopId: string | null
    date: string
    time: string
  }) => void
}

function ReservationModal({ tire, quantity, deliveryType, workshops, comunaLabel, onClose, onChangeDelivery, onConfirmCheckout }: ReservationModalProps) {
  const [selectedWorkshop, setSelectedWorkshop] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [showCheckout, setShowCheckout] = useState(false)
  const [needsInvoice, setNeedsInvoice] = useState(false)

  if (!tire) return null

  const subtotal = tire.price * quantity
  const despachoCost = deliveryType !== "serviteca" ? 5990 : 0
  const instalacionCost = deliveryType === "instalacion-domicilio" ? 19990 : 0
  const total = subtotal + despachoCost + instalacionCost

  

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Confirmar selección</h2>
            <p className="text-sm text-muted-foreground">Revisa tu pedido y agenda tu cita</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Producto seleccionado */}
          <div className="p-5 border-b border-border">
            <div className="flex gap-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                <img
                  src={tire.image}
                  alt={tire.name}
                  className="absolute inset-0 h-full w-full object-contain object-center mix-blend-multiply"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-accent font-medium">{tire.brand}</p>
                <p className="text-lg font-semibold text-foreground">{tireFamiliaModeloLine(tire)}</p>
                <p className="text-sm text-muted-foreground">Medida: {tire.size}</p>
                <p className="text-sm text-muted-foreground">Cantidad: {quantity} neumáticos</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">${total.toLocaleString("es-CL")}</p>
                <p className="text-xs text-muted-foreground">Total con {deliveryType === "serviteca" ? "instalación gratis" : "envío"}</p>
              </div>
            </div>
          </div>

          {/* Opción de reserva en taller */}
          {deliveryType === "serviteca" ? (
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Reserva tu cita</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedWorkshop ? "Selecciona fecha y hora" : `Selecciona un taller en ${comunaLabel}`}
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {/* Lista de talleres - solo visible si no hay taller seleccionado */}
                {!selectedWorkshop ? (
                  <motion.div
                    key="workshop-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <label className="text-sm font-medium text-foreground">Selecciona un taller</label>
                    <div className="grid gap-2">
                      {workshops.map((workshop) => (
                        <button
                          key={workshop.id}
                          onClick={() => setSelectedWorkshop(workshop.id)}
                          className="flex items-center justify-between p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left"
                        >
                          <div>
                            <p className="font-medium text-foreground">{workshop.name}</p>
                            <p className="text-sm text-muted-foreground">{workshop.address}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Navigation className="w-3 h-3" /> {workshop.distance}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Hasta {workshop.openUntil}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="workshop-schedule"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Taller seleccionado con opción de cambiar */}
                    {(() => {
                      const workshop = workshops.find(w => w.id === selectedWorkshop)
                      if (!workshop) return null
                      return (
                        <div className="flex items-center justify-between p-4 rounded-xl border-2 border-primary bg-primary/5">
                          <div>
                            <p className="font-medium text-foreground">{workshop.name}</p>
                            <p className="text-sm text-muted-foreground">{workshop.address}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWorkshop(null)
                              setSelectedDate("")
                              setSelectedTime("")
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Cambiar taller
                          </Button>
                        </div>
                      )
                    })()}

                    {/* Selección de fecha */}
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-3">Fecha de instalación</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(() => {
                          const dates = []
                          const today = new Date()
                          for (let i = 0; i < 8; i++) {
                            const date = new Date(today)
                            date.setDate(today.getDate() + i)
                            dates.push(date)
                          }
                          return dates.map((date, index) => {
                            const dateStr = date.toISOString().split('T')[0]
                            const isSelected = selectedDate === dateStr
                            const dayName = date.toLocaleDateString('es-CL', { weekday: 'short' })
                            const dayNum = date.getDate()
                            const monthName = date.toLocaleDateString('es-CL', { month: 'short' })
                            const isToday = index === 0
                            
                            return (
                              <button
                                key={dateStr}
                                onClick={() => {
                                  setSelectedDate(dateStr)
                                  setSelectedTime("")
                                }}
                                className={cn(
                                  "flex flex-col items-center p-3 rounded-xl border-2 transition-all",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border hover:border-primary/50 bg-card"
                                )}
                              >
                                <span className={cn(
                                  "text-[10px] uppercase font-medium",
                                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                                )}>
                                  {isToday ? "Hoy" : dayName}
                                </span>
                                <span className={cn(
                                  "text-xl font-semibold my-0.5",
                                  isSelected ? "text-primary-foreground" : "text-foreground"
                                )}>
                                  {dayNum}
                                </span>
                                <span className={cn(
                                  "text-[10px] uppercase",
                                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                                )}>
                                  {monthName}
                                </span>
                              </button>
                            )
                          })
                        })()}
                      </div>
                    </div>

                    {/* Selección de hora AM/PM */}
                    {selectedDate && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <label className="text-sm font-medium text-foreground block mb-2">Horario disponible</label>
                        <div className="grid grid-cols-2 gap-3">
                          {/* AM */}
                          <button
                            onClick={() => setSelectedTime("AM")}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all",
                              selectedTime === "AM"
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg font-semibold text-foreground">AM</span>
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                selectedTime === "AM" ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {selectedTime === "AM" && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">09:00 - 12:00</p>
                            <p className="text-xs text-muted-foreground mt-1">Mañana</p>
                          </button>
                          
                          {/* PM */}
                          <button
                            onClick={() => setSelectedTime("PM")}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all",
                              selectedTime === "PM"
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg font-semibold text-foreground">PM</span>
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                selectedTime === "PM" ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {selectedTime === "PM" && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">13:00 - 18:00</p>
                            <p className="text-xs text-muted-foreground mt-1">Tarde</p>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-5">
              <div className="bg-muted/50 rounded-xl p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Store className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">¿Prefieres instalación en taller?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cambia a Serviteca para obtener instalación gratis y reservar tu cita en uno de nuestros talleres en {comunaLabel}.
                </p>
                <Button variant="outline" onClick={onChangeDelivery} className="gap-2">
                  <Store className="w-4 h-4" />
                  Cambiar a Serviteca
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showCheckout && (
          <div className="p-5 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between gap-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                className="flex-1 gap-2"
                disabled={deliveryType === "serviteca" && (!selectedWorkshop || !selectedDate || !selectedTime)}
                onClick={() => setShowCheckout(true)}
              >
                {deliveryType === "serviteca" ? "Confirmar reserva" : "Continuar al pago"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Checkout View - Apple Style */}
        <AnimatePresence>
          {showCheckout && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0 bg-card flex flex-col"
            >
              {/* Checkout Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </button>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Pago seguro</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="max-w-md mx-auto p-6 space-y-6">
                  
                  {/* Order Summary */}
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground mb-1">Checkout</h2>
                    <p className="text-sm text-muted-foreground">Completa tu compra de forma segura</p>
                  </div>

                  {/* Product Card */}
                  <div className="bg-muted/30 rounded-2xl p-4">
                    <div className="flex gap-4">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                        <img src={tire.image} alt={tire.name} className="absolute inset-0 h-full w-full object-contain object-center mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-accent font-medium">{tire.brand}</p>
                        <p className="font-medium text-foreground">{tireFamiliaModeloLine(tire)}</p>
                        <p className="text-sm text-muted-foreground">{quantity} unidades</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">${total.toLocaleString("es-CL")}</p>
                      </div>
                    </div>
                    
                    {deliveryType === "serviteca" && selectedWorkshop && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-foreground">
                              {new Date(selectedDate).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                            </p>
                            <p className="text-muted-foreground">
                              {selectedTime === "AM" ? "09:00 - 12:00" : "13:00 - 18:00"} · {workshops.find(w => w.id === selectedWorkshop)?.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">Información de contacto</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="RUT (ej: 12.345.678-9)"
                        className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono"
                        className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Invoice Option */}
                  <div className="space-y-4">
                    <button
                      onClick={() => setNeedsInvoice(!needsInvoice)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all",
                        needsInvoice ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          needsInvoice ? "bg-primary/10" : "bg-muted"
                        )}>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M13 3v5a1 1 0 001 1h5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Necesito factura</p>
                          <p className="text-xs text-muted-foreground">Ingresa los datos de facturación</p>
                        </div>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        needsInvoice ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}>
                        {needsInvoice && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </button>

                    {/* Invoice Form */}
                    <AnimatePresence>
                      {needsInvoice && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 pt-2">
                            <input
                              type="text"
                              placeholder="RUT Empresa (ej: 76.123.456-7)"
                              className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                            <input
                              type="text"
                              placeholder="Razón Social"
                              className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                            <input
                              type="text"
                              placeholder="Giro"
                              className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                            <input
                              type="text"
                              placeholder="Dirección de facturación"
                              className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">Método de pago</h3>
                    <div className="space-y-2">
                      <button className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-primary bg-primary/5 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-background" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Tarjeta de crédito o débito</p>
                            <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
                          </div>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      </button>
                      
                      <button className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-border hover:border-primary/50 text-left transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Transferencia bancaria</p>
                            <p className="text-xs text-muted-foreground">Banco Estado, Santander, BCI</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </button>
                      
                      <button className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-border hover:border-primary/50 text-left transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold">
                            3x
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Pagar en cuotas</p>
                            <p className="text-xs text-muted-foreground">Hasta 12 cuotas sin interés</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Checkout Footer */}
              <div className="p-5 border-t border-border bg-card">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">${subtotal.toLocaleString("es-CL")}</span>
                  </div>
                  {despachoCost > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Despacho</span>
                      <span className="text-foreground">${despachoCost.toLocaleString("es-CL")}</span>
                    </div>
                  )}
                  {instalacionCost > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Instalación</span>
                      <span className="text-foreground">${instalacionCost.toLocaleString("es-CL")}</span>
                    </div>
                  )}
                  {deliveryType === "serviteca" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Instalación</span>
                      <span className="text-green-600 font-medium">Gratis</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="font-medium text-foreground">Total</span>
                    <span className="text-xl font-bold text-foreground">${total.toLocaleString("es-CL")}</span>
                  </div>
                  
                  <Button
                    type="button"
                    className="w-full h-14 text-base font-medium gap-2"
                    disabled={
                      deliveryType === "serviteca" &&
                      (!selectedWorkshop || !selectedDate || !selectedTime)
                    }
                    onClick={() =>
                      onConfirmCheckout({
                        workshopId: selectedWorkshop,
                        date: selectedDate,
                        time: selectedTime,
                      })
                    }
                  >
                    <Lock className="w-4 h-4" />
                    Continuar al checkout · ${total.toLocaleString("es-CL")}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Al completar tu compra aceptas nuestros términos y condiciones
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

interface WorkshopCardProps {
  workshop: Workshop
  onSelect: () => void
}

function WorkshopCard({ workshop, onSelect }: WorkshopCardProps) {
  return (
    <div className="p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors">
      <div className="mb-2">
        <h4 className="font-medium text-foreground">{workshop.name}</h4>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">{workshop.address}</p>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5" />
          {workshop.distance}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Hasta {workshop.openUntil}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          workshop.availableSlots > 3 
            ? "bg-green-100 text-green-700" 
            : workshop.availableSlots > 0 
              ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
        )}>
          {workshop.availableSlots} horarios disponibles
        </span>
        <Button variant="outline" size="sm" onClick={onSelect}>
          Reservar
        </Button>
      </div>
    </div>
  )
}

export interface ResultsPageProps {
  onStartOver: () => void
  /** Neumáticos ya mapeados desde el catálogo CRM */
  tires: Tire[]
  /** Talleres desde API CRM (mapeados a Workshop) */
  workshops: Workshop[]
  isLoading?: boolean
  /** Opciones del filtro medida (p. ej. una sola fila desde el wizard) */
  sizeFilterOptions: { id: string; label: string }[]
  /** Comuna del wizard (para priorizar región y autocomplete nacional) */
  comunaWizard: ComunaWizardSlice
  initialQuantity: number
  initialSizeId: string
  initialComunaId: string
  initialDelivery: string
  /** Al confirmar en el modal (checkout simulado V0) — llevar al checkout real del CRM */
  onCheckout: (payload: {
    tire: Tire
    quantity: number
    deliveryType: string
    workshopId: string | null
    date: string
    time: string
  }) => void
  /** Si el catálogo respondió vacío: URL llamada y claves del JSON (diagnóstico Leadflow). */
  catalogEmptyHint?: { requestUrl: string; topLevelKeys: string[] } | null
  /** Cuando cambian cantidad / entrega / etc., sincronizar con el wizard (checkout, talleres API). */
  onFiltersSync?: (filters: {
    quantity: number
    size: string
    comuna: string
    delivery: string
  }) => void
}

export function ResultsPage({
  onStartOver,
  tires,
  workshops: workshopsProp,
  isLoading,
  sizeFilterOptions,
  comunaWizard,
  initialQuantity,
  initialSizeId,
  initialComunaId,
  initialDelivery,
  onCheckout,
  catalogEmptyHint,
  onFiltersSync,
}: ResultsPageProps) {
  const brandName = useBrandStore((s) => s.name)
  const brandLogoUrl = useBrandStore((s) => s.logoUrl)

  const [filters, setFilters] = useState({
    quantity: initialQuantity,
    size: initialSizeId,
    comuna: initialComunaId,
    delivery: initialDelivery,
  })

  useEffect(() => {
    setFilters({
      quantity: initialQuantity,
      size: initialSizeId,
      comuna: initialComunaId,
      delivery: initialDelivery,
    })
  }, [initialQuantity, initialSizeId, initialComunaId, initialDelivery])

  useEffect(() => {
    onFiltersSync?.(filters)
  }, [filters, onFiltersSync])

  const [selectedTire, setSelectedTire] = useState<Tire | null>(null)

  const [urgency, setUrgency] = useState<string>("sin-apuro")
  const [tireType, setTireType] = useState<string>("ambos")
  const [homologations, setHomologations] = useState<string[]>([])

  const tiresByCategory = useMemo(() => {
    return {
      premium: tires.filter((t) => t.category === "premium"),
      conveniencia: tires.filter((t) => t.category === "conveniencia"),
      economico: tires.filter((t) => t.category === "economico"),
    }
  }, [tires])

  const workshops = workshopsProp

  const deliveryLabel = deliveryOptions.find((d) => d.id === filters.delivery)?.label || ""
  const comunaLabel = useMemo(() => {
    const rows = comunasAutocompleteOptions(comunaWizard, "")
    return (
      rows.find((c) => c.id === filters.comuna)?.label ||
      String(comunaWizard.comunaNombre || "").trim() ||
      ""
    )
  }, [comunaWizard.comuna, comunaWizard.comunaNombre, filters.comuna])
  const sizeLabel = sizeFilterOptions.find((s) => s.id === filters.size)?.label || ""

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="size-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="size-2.5 rounded-full bg-primary animate-bounce" />
        </div>
        <p className="text-muted-foreground text-sm">Buscando neumáticos en catálogo…</p>
      </div>
    )
  }

  if (!tires.length) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-4xl" aria-hidden>
          🔍
        </div>
        <h1 className="font-serif text-2xl text-foreground">Sin resultados</h1>
        <p className="text-muted-foreground text-sm max-w-md">
          No hay neumáticos en catálogo para la medida indicada. Prueba otra medida o vuelve al inicio.
        </p>
        {catalogEmptyHint?.requestUrl ? (
          <div className="mt-2 max-w-2xl w-full rounded-lg border border-border bg-muted/40 px-4 py-3 text-left text-xs text-muted-foreground space-y-2">
            <p>
              <span className="font-medium text-foreground">Última petición al API:</span>{" "}
              <span className="break-all">{catalogEmptyHint.requestUrl}</span>
            </p>
            {catalogEmptyHint.topLevelKeys?.length ? (
              <p>
                <span className="font-medium text-foreground">Claves en la respuesta:</span>{" "}
                {catalogEmptyHint.topLevelKeys.join(", ")}
              </p>
            ) : null}
            <p className="text-[11px] leading-relaxed">
              Si ves claves como <code className="rounded bg-background px-1">data</code> o{" "}
              <code className="rounded bg-background px-1">result</code> pero ningún listado, el formato del CRM no coincide con lo que espera el front: envía un ejemplo de JSON del endpoint{" "}
              <code className="rounded bg-background px-1">/catalog</code> para adaptar el parser.
            </p>
          </div>
        ) : null}
        <Button onClick={onStartOver}>Modificar búsqueda</Button>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {brandLogoUrl ? (
              <img src={brandLogoUrl} alt={brandName} className="h-8 w-auto max-w-[180px] object-contain" />
            ) : (
              <>
                <Car className="w-6 h-6 text-accent" />
                <h1 className="font-serif text-2xl text-foreground">{brandName}</h1>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="gap-2 hidden md:flex">
              <Phone className="w-4 h-4" />
              Llamar ahora
            </Button>
            <Button className="gap-2">
              <MapPin className="w-4 h-4" />
              Sucursales
            </Button>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="py-8 md:py-10 px-6 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary mb-4"
          >
            <ShieldCheck className="w-4 h-4" />
            Recomendaciones personalizadas
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-3xl md:text-4xl text-foreground mb-3 text-balance"
          >
            Encontramos {tires.length} neumáticos ideales para ti
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground text-base max-w-2xl mx-auto"
          >
            Ajusta los filtros para refinar tu búsqueda
          </motion.p>
        </div>
      </section>

      {/* Filters section */}
      <section className="py-5 px-6 border-b border-border bg-muted/30 sticky top-[73px] z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tus filtros</h2>
            <button 
              onClick={onStartOver}
              className="text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <QuantityFilter
              value={filters.quantity}
              onChange={(value) => setFilters(prev => ({ ...prev, quantity: value }))}
            />
            
            <FilterDropdown
              label="Medida"
              value={filters.size}
              options={sizeFilterOptions}
              onChange={(value) => setFilters(prev => ({ ...prev, size: value }))}
              icon={<Circle className="w-4 h-4" />}
            />
            
            <ComunaAutocompleteFilter
              comunaWizard={comunaWizard}
              value={filters.comuna}
              onChange={(value) => setFilters((prev) => ({ ...prev, comuna: value }))}
            />
            
            <FilterDropdown
              label="Entrega"
              value={filters.delivery}
              options={deliveryOptions}
              onChange={(value) => setFilters(prev => ({ ...prev, delivery: value }))}
              icon={deliveryOptions.find(d => d.id === filters.delivery)?.icon}
            />
          </div>

          {/* Summary */}
          <motion.div 
            layout
            className="mt-3 p-3 bg-card rounded-lg border border-border text-sm text-muted-foreground"
          >
            <span className="font-semibold text-foreground">{filters.quantity} neumáticos</span> medida <span className="font-semibold text-foreground">{sizeLabel}</span>
            {" | "}
            {filters.delivery === "serviteca" ? "Retiro en" : "Envío a"} <span className="font-semibold text-foreground">{comunaLabel}</span>
            {" | "}
            <span className="font-semibold text-foreground">{deliveryLabel}</span>
          </motion.div>
        </div>
      </section>

      {/* Main content with sidebars */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-60 shrink-0 hidden lg:block">
            <div className="lg:sticky lg:top-[220px] lg:self-start space-y-4 pb-8">
              
              {/* Disponibilidad / Urgencia */}
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-accent" />
                  <h3 className="font-medium text-sm text-foreground">Disponibilidad</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { id: "hoy", label: "Necesito hoy" },
                    { id: "manana", label: "Mañana" },
                    { id: "semana", label: "Esta semana" },
                    { id: "sin-apuro", label: "Sin apuro (mejor precio)" },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors",
                        urgency === option.id ? "bg-primary/5 border border-primary/20" : "hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                        urgency === option.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}>
                        {urgency === option.id && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                      </div>
                      <span className="text-sm text-foreground">{option.label}</span>
                      <input
                        type="radio"
                        name="urgency"
                        value={option.id}
                        checked={urgency === option.id}
                        onChange={(e) => setUrgency(e.target.value)}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Tecnología del neumático */}
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings2 className="w-4 h-4 text-accent" />
                  <h3 className="font-medium text-sm text-foreground">Tecnología</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { id: "runflat", label: "RunFlat solamente" },
                    { id: "convencional", label: "Convencional solamente" },
                    { id: "ambos", label: "Mostrar ambos" },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors",
                        tireType === option.id ? "bg-primary/5 border border-primary/20" : "hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                        tireType === option.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}>
                        {tireType === option.id && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                      </div>
                      <span className="text-sm text-foreground">{option.label}</span>
                      <input
                        type="radio"
                        name="tireType"
                        value={option.id}
                        checked={tireType === option.id}
                        onChange={(e) => setTireType(e.target.value)}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
                {tireType === "runflat" && (
                  <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200/60 rounded-lg">
                    <p className="text-xs text-amber-800">
                      Los neumáticos RunFlat permiten seguir conduciendo hasta 80km tras un pinchazo.
                    </p>
                  </div>
                )}
              </div>

              {/* Homologados para marcas premium */}
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4 text-accent" />
                  <h3 className="font-medium text-sm text-foreground">Homologados</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Para marcas premium</p>
                <div className="space-y-2">
                  {[
                    { id: "bmw", label: "BMW", code: "*" },
                    { id: "mercedes", label: "Mercedes", code: "MO / MOE" },
                    { id: "audi", label: "Audi", code: "AO" },
                    { id: "porsche", label: "Porsche", code: "N0/N1/N2" },
                    { id: "tesla", label: "Tesla", code: "T0/T1" },
                    { id: "jlr", label: "Jaguar / Land Rover", code: "JLR" },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors",
                        homologations.includes(option.id) ? "bg-primary/5 border border-primary/20" : "hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                        homologations.includes(option.id) ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}>
                        {homologations.includes(option.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground">{option.label}</span>
                        <span className="text-xs text-muted-foreground ml-1">({option.code})</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={homologations.includes(option.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setHomologations(prev => [...prev, option.id])
                          } else {
                            setHomologations(prev => prev.filter(h => h !== option.id))
                          }
                        }}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </aside>

          {/* Products by category */}
          <main className="flex-1 space-y-12 min-w-0">
            {(["premium", "conveniencia", "economico"] as const).map((category) => {
              const info = categoryInfo[category]
              const tires = tiresByCategory[category]
              
              return (
                <section key={category}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", info.color)}>
                      {info.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{info.title}</h2>
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
                    {tires.map((tire, index) => (
                      <motion.div
                        key={tire.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="h-full"
                      >
                        <TireCard
                          tire={tire}
                          quantity={filters.quantity}
                          deliveryType={filters.delivery}
                          deliveryLabel={deliveryLabel}
                          onSelect={setSelectedTire}
                        />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )
            })}
          </main>

          {/* Sidebar with workshops */}
          <aside className="lg:w-72 shrink-0 hidden lg:block">
            <div className="lg:sticky lg:top-[220px] lg:self-start space-y-4 pb-8">
              {/* Opción más económica */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <EconomicIcon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Opción más económica</h3>
                    <p className="text-xs text-muted-foreground">Optimiza tu compra</p>
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Retiro en Serviteca</span>
                    </div>
                    {filters.delivery === "serviteca" && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Seleccionado</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Instalación gratis
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Sin costo de envío
                    </span>
                  </div>
                  
                  {filters.delivery !== "serviteca" && (
                    <>
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-3">
                          Ahorra <span className="font-semibold text-foreground">$25.980</span> vs instalación a domicilio
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full"
                          onClick={() => setFilters(prev => ({ ...prev, delivery: "serviteca" }))}
                        >
                          Cambiar a Serviteca
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Talleres */}
              <div className="bg-muted/50 rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Store className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-foreground">Talleres en {comunaLabel}</h3>
                </div>
                
                {filters.delivery === "serviteca" ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {workshops.length} talleres disponibles cerca de ti
                    </p>
                    
                    <div className="space-y-3">
                      {workshops.map((workshop) => (
                        <WorkshopCard
                          key={workshop.id}
                          workshop={workshop}
                          onSelect={() => {}}
                        />
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border">
                      <Button variant="outline" className="w-full gap-2">
                        <MapPin className="w-4 h-4" />
                        Ver todos en mapa
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Truck className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Has seleccionado <span className="font-medium text-foreground">{deliveryLabel}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Si prefieres instalación en taller, cambia el filtro de entrega a &quot;Serviteca&quot;
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, delivery: "serviteca" }))}
                      className="gap-2"
                    >
                      <Store className="w-4 h-4" />
                      Cambiar a Serviteca
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* CTA section */}
      <section className="px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-primary text-primary-foreground rounded-2xl p-8 text-center"
          >
            <h3 className="font-serif text-2xl md:text-3xl mb-4">
              ¿Necesitas ayuda para elegir?
            </h3>
            <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
              Nuestros asesores están disponibles para ayudarte a tomar la mejor decisión.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" className="gap-2">
                <Phone className="w-5 h-5" />
                Hablar con un asesor
              </Button>
              <Button variant="outline" size="lg" className="gap-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                <MapPin className="w-5 h-5" />
                Agendar cita
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            {brandLogoUrl ? (
              <img src={brandLogoUrl} alt={brandName} className="h-7 w-auto max-w-[160px] object-contain" />
            ) : (
              <>
                <Car className="w-5 h-5 text-accent" />
                <p className="font-serif text-xl text-foreground">{brandName}</p>
              </>
            )}
          </div>
          <nav className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Sobre nosotros</a>
            <a href="#" className="hover:text-foreground transition-colors">Sucursales</a>
            <a href="#" className="hover:text-foreground transition-colors">Contacto</a>
            <a href="#" className="hover:text-foreground transition-colors">Garantías</a>
          </nav>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {brandName}. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Modal de reserva */}
      <AnimatePresence>
        {selectedTire && (
          <ReservationModal
            tire={selectedTire}
            quantity={filters.quantity}
            deliveryType={filters.delivery}
            workshops={workshops}
            comunaLabel={comunaLabel}
            onClose={() => setSelectedTire(null)}
            onChangeDelivery={() => {
              setFilters(prev => ({ ...prev, delivery: "serviteca" }))
            }}
            onConfirmCheckout={({ workshopId, date, time }) => {
              if (!selectedTire) return
              onCheckout({
                tire: selectedTire,
                quantity: filters.quantity,
                deliveryType: filters.delivery,
                workshopId,
                date,
                time,
              })
              setSelectedTire(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
