/**
 * @typedef {Object} Producto
 * @property {string}  id
 * @property {string}  marca
 * @property {string}  titulo
 * @property {string}  medida
 * @property {string}  tier           - 'Premium' | 'Conveniencia' | 'Económico'
 * @property {number}  precioNormal
 * @property {number}  precioOferta
 * @property {number}  descuento
 * @property {number}  stock
 * @property {string}  foto
 * @property {string}  modelo
 * @property {Object}  availability   - fuente óptima + stock total
 * @property {string}  fuenteTipo     - 'bodega' | 'sucursal' | 'taller' | 'proveedor'
 * @property {number}  tiempoEntregaHoras
 */

/**
 * @typedef {Object} Taller
 * @property {string}  id
 * @property {string}  nombre_comercial
 * @property {string}  direccion
 * @property {string}  comuna
 * @property {number}  lat
 * @property {number}  lng
 * @property {number}  distancia_km
 * @property {boolean} disponible
 * @property {Array}   precios
 */

/**
 * @typedef {Object} EntregaOpcion
 * @property {string}  tipo           - 'taller' | 'domicilio' | 'despacho' | 'retiro'
 * @property {string}  label
 * @property {number}  horasEstimadas
 * @property {boolean} disponible
 */

/**
 * @typedef {Object} WizardData
 * @property {number}  cantidad
 * @property {string}  necesidad      - 'neumaticos' | 'instalacion' | 'cotizacion' | 'recomendacion'
 * @property {string}  medida         - ej. "205/55R16"
 * @property {string}  ancho
 * @property {string}  perfil
 * @property {string}  aro
 * @property {string}  comuna
 * @property {string}  comunaCodigo
 * @property {string}  fecha          - 'hoy' | 'manana' | 'esta semana' | ISO date
 * @property {string}  email
 */

/**
 * @typedef {Object} CartItem
 * @property {Producto} producto
 * @property {number}   cantidad
 * @property {Taller|null}     taller
 * @property {EntregaOpcion|null} entrega
 * @property {string|null}     fecha
 * @property {string|null}     direccion
 */

export {}
