// Lista local de comunas de Chile — fallback cuando el backend no está disponible
export const COMUNAS_CL = [
  // Región Metropolitana
  { codigo: '13101', nombre: 'Santiago',            region: 'R. Metropolitana' },
  { codigo: '13102', nombre: 'Cerrillos',           region: 'R. Metropolitana' },
  { codigo: '13103', nombre: 'Cerro Navia',         region: 'R. Metropolitana' },
  { codigo: '13104', nombre: 'Conchalí',            region: 'R. Metropolitana' },
  { codigo: '13105', nombre: 'El Bosque',           region: 'R. Metropolitana' },
  { codigo: '13106', nombre: 'Estación Central',    region: 'R. Metropolitana' },
  { codigo: '13107', nombre: 'Huechuraba',          region: 'R. Metropolitana' },
  { codigo: '13108', nombre: 'Independencia',       region: 'R. Metropolitana' },
  { codigo: '13109', nombre: 'La Cisterna',         region: 'R. Metropolitana' },
  { codigo: '13110', nombre: 'La Florida',          region: 'R. Metropolitana' },
  { codigo: '13111', nombre: 'La Granja',           region: 'R. Metropolitana' },
  { codigo: '13112', nombre: 'La Pintana',          region: 'R. Metropolitana' },
  { codigo: '13113', nombre: 'La Reina',            region: 'R. Metropolitana' },
  { codigo: '13114', nombre: 'Las Condes',          region: 'R. Metropolitana' },
  { codigo: '13115', nombre: 'Lo Barnechea',        region: 'R. Metropolitana' },
  { codigo: '13116', nombre: 'Lo Espejo',           region: 'R. Metropolitana' },
  { codigo: '13117', nombre: 'Lo Prado',            region: 'R. Metropolitana' },
  { codigo: '13118', nombre: 'Macul',               region: 'R. Metropolitana' },
  { codigo: '13119', nombre: 'Maipú',               region: 'R. Metropolitana' },
  { codigo: '13120', nombre: 'Ñuñoa',               region: 'R. Metropolitana' },
  { codigo: '13121', nombre: 'Pedro Aguirre Cerda', region: 'R. Metropolitana' },
  { codigo: '13122', nombre: 'Peñalolén',           region: 'R. Metropolitana' },
  { codigo: '13123', nombre: 'Providencia',         region: 'R. Metropolitana' },
  { codigo: '13124', nombre: 'Pudahuel',            region: 'R. Metropolitana' },
  { codigo: '13125', nombre: 'Quilicura',           region: 'R. Metropolitana' },
  { codigo: '13126', nombre: 'Quinta Normal',       region: 'R. Metropolitana' },
  { codigo: '13127', nombre: 'Recoleta',            region: 'R. Metropolitana' },
  { codigo: '13128', nombre: 'Renca',               region: 'R. Metropolitana' },
  { codigo: '13129', nombre: 'San Joaquín',         region: 'R. Metropolitana' },
  { codigo: '13130', nombre: 'San Miguel',          region: 'R. Metropolitana' },
  { codigo: '13131', nombre: 'San Ramón',           region: 'R. Metropolitana' },
  { codigo: '13132', nombre: 'Vitacura',            region: 'R. Metropolitana' },
  { codigo: '13201', nombre: 'Puente Alto',         region: 'R. Metropolitana' },
  { codigo: '13202', nombre: 'Pirque',              region: 'R. Metropolitana' },
  { codigo: '13203', nombre: 'San José de Maipo',   region: 'R. Metropolitana' },
  { codigo: '13301', nombre: 'Colina',              region: 'R. Metropolitana' },
  { codigo: '13302', nombre: 'Lampa',               region: 'R. Metropolitana' },
  { codigo: '13303', nombre: 'Tiltil',              region: 'R. Metropolitana' },
  { codigo: '13401', nombre: 'San Bernardo',        region: 'R. Metropolitana' },
  { codigo: '13402', nombre: 'Buin',                region: 'R. Metropolitana' },
  { codigo: '13403', nombre: 'Calera de Tango',     region: 'R. Metropolitana' },
  { codigo: '13404', nombre: 'Paine',               region: 'R. Metropolitana' },
  { codigo: '13501', nombre: 'Melipilla',           region: 'R. Metropolitana' },
  { codigo: '13601', nombre: 'Talagante',           region: 'R. Metropolitana' },
  { codigo: '13602', nombre: 'El Monte',            region: 'R. Metropolitana' },
  { codigo: '13603', nombre: 'Isla de Maipo',       region: 'R. Metropolitana' },
  { codigo: '13604', nombre: 'Padre Hurtado',       region: 'R. Metropolitana' },
  { codigo: '13605', nombre: 'Peñaflor',            region: 'R. Metropolitana' },

  // Valparaíso (V)
  { codigo: '05101', nombre: 'Valparaíso',          region: 'Valparaíso' },
  { codigo: '05102', nombre: 'Casablanca',          region: 'Valparaíso' },
  { codigo: '05103', nombre: 'Juan Fernández',      region: 'Valparaíso' },
  { codigo: '05104', nombre: 'Puchuncaví',          region: 'Valparaíso' },
  { codigo: '05105', nombre: 'Quilpué',             region: 'Valparaíso' },
  { codigo: '05106', nombre: 'Quintero',            region: 'Valparaíso' },
  { codigo: '05107', nombre: 'Villa Alemana',       region: 'Valparaíso' },
  { codigo: '05108', nombre: 'Viña del Mar',        region: 'Valparaíso' },
  { codigo: '05109', nombre: 'Con Con',             region: 'Valparaíso' },
  { codigo: '05301', nombre: 'Los Andes',           region: 'Valparaíso' },
  { codigo: '05302', nombre: 'Calle Larga',         region: 'Valparaíso' },
  { codigo: '05303', nombre: 'Rinconada',           region: 'Valparaíso' },
  { codigo: '05304', nombre: 'San Esteban',         region: 'Valparaíso' },
  { codigo: '05401', nombre: 'La Ligua',            region: 'Valparaíso' },
  { codigo: '05501', nombre: 'Quillota',            region: 'Valparaíso' },
  { codigo: '05502', nombre: 'Calera',              region: 'Valparaíso' },
  { codigo: '05503', nombre: 'Hijuelas',            region: 'Valparaíso' },
  { codigo: '05504', nombre: 'La Cruz',             region: 'Valparaíso' },
  { codigo: '05505', nombre: 'Nogales',             region: 'Valparaíso' },
  { codigo: '05601', nombre: 'San Antonio',         region: 'Valparaíso' },
  { codigo: '05602', nombre: 'Algarrobo',           region: 'Valparaíso' },
  { codigo: '05603', nombre: 'Cartagena',           region: 'Valparaíso' },
  { codigo: '05604', nombre: 'El Quisco',           region: 'Valparaíso' },
  { codigo: '05605', nombre: 'El Tabo',             region: 'Valparaíso' },
  { codigo: '05606', nombre: 'Santo Domingo',       region: 'Valparaíso' },
  { codigo: '05701', nombre: 'San Felipe',          region: 'Valparaíso' },
  { codigo: '05702', nombre: 'Catemu',              region: 'Valparaíso' },
  { codigo: '05703', nombre: 'Llaillay',            region: 'Valparaíso' },
  { codigo: '05704', nombre: 'Panquehue',           region: 'Valparaíso' },
  { codigo: '05705', nombre: 'Putaendo',            region: 'Valparaíso' },
  { codigo: '05706', nombre: 'Santa María',         region: 'Valparaíso' },

  // Biobío (VIII)
  { codigo: '08101', nombre: 'Concepción',          region: 'Biobío' },
  { codigo: '08102', nombre: 'Coronel',             region: 'Biobío' },
  { codigo: '08103', nombre: 'Chiguayante',         region: 'Biobío' },
  { codigo: '08104', nombre: 'Florida',             region: 'Biobío' },
  { codigo: '08105', nombre: 'Hualqui',             region: 'Biobío' },
  { codigo: '08106', nombre: 'Lota',                region: 'Biobío' },
  { codigo: '08107', nombre: 'Penco',               region: 'Biobío' },
  { codigo: '08108', nombre: 'San Pedro de la Paz', region: 'Biobío' },
  { codigo: '08109', nombre: 'Santa Juana',         region: 'Biobío' },
  { codigo: '08110', nombre: 'Talcahuano',          region: 'Biobío' },
  { codigo: '08111', nombre: 'Tomé',                region: 'Biobío' },
  { codigo: '08112', nombre: 'Hualpén',             region: 'Biobío' },
  { codigo: '08201', nombre: 'Lebu',                region: 'Biobío' },
  { codigo: '08301', nombre: 'Los Ángeles',         region: 'Biobío' },
  { codigo: '08302', nombre: 'Nacimiento',          region: 'Biobío' },
  { codigo: '08303', nombre: 'Negrete',             region: 'Biobío' },
  { codigo: '08401', nombre: 'Chillán',             region: 'Ñuble' },
  { codigo: '08402', nombre: 'Bulnes',              region: 'Ñuble' },
  { codigo: '08403', nombre: 'Chillán Viejo',       region: 'Ñuble' },
  { codigo: '08404', nombre: 'San Carlos',          region: 'Ñuble' },
  { codigo: '08405', nombre: 'San Fabián',          region: 'Ñuble' },

  // Araucanía (IX)
  { codigo: '09101', nombre: 'Temuco',              region: 'La Araucanía' },
  { codigo: '09102', nombre: 'Carahue',             region: 'La Araucanía' },
  { codigo: '09103', nombre: 'Cunco',               region: 'La Araucanía' },
  { codigo: '09104', nombre: 'Curarrehue',          region: 'La Araucanía' },
  { codigo: '09105', nombre: 'Freire',              region: 'La Araucanía' },
  { codigo: '09106', nombre: 'Galvarino',           region: 'La Araucanía' },
  { codigo: '09107', nombre: 'Gorbea',              region: 'La Araucanía' },
  { codigo: '09108', nombre: 'Lautaro',             region: 'La Araucanía' },
  { codigo: '09109', nombre: 'Loncoche',            region: 'La Araucanía' },
  { codigo: '09110', nombre: 'Melipeuco',           region: 'La Araucanía' },
  { codigo: '09111', nombre: 'Nueva Imperial',      region: 'La Araucanía' },
  { codigo: '09112', nombre: 'Padre Las Casas',     region: 'La Araucanía' },
  { codigo: '09113', nombre: 'Perquenco',           region: 'La Araucanía' },
  { codigo: '09114', nombre: 'Pitrufquén',          region: 'La Araucanía' },
  { codigo: '09115', nombre: 'Pucón',               region: 'La Araucanía' },
  { codigo: '09116', nombre: 'Saavedra',            region: 'La Araucanía' },
  { codigo: '09117', nombre: 'Teodoro Schmidt',     region: 'La Araucanía' },
  { codigo: '09118', nombre: 'Toltén',              region: 'La Araucanía' },
  { codigo: '09119', nombre: 'Vilcún',              region: 'La Araucanía' },
  { codigo: '09120', nombre: 'Villarrica',          region: 'La Araucanía' },
  { codigo: '09201', nombre: 'Angol',               region: 'La Araucanía' },

  // Los Lagos (X)
  { codigo: '10101', nombre: 'Puerto Montt',        region: 'Los Lagos' },
  { codigo: '10102', nombre: 'Calbuco',             region: 'Los Lagos' },
  { codigo: '10103', nombre: 'Cochamó',             region: 'Los Lagos' },
  { codigo: '10104', nombre: 'Fresia',              region: 'Los Lagos' },
  { codigo: '10105', nombre: 'Frutillar',           region: 'Los Lagos' },
  { codigo: '10106', nombre: 'Los Muermos',         region: 'Los Lagos' },
  { codigo: '10107', nombre: 'Llanquihue',          region: 'Los Lagos' },
  { codigo: '10108', nombre: 'Maullín',             region: 'Los Lagos' },
  { codigo: '10109', nombre: 'Puerto Varas',        region: 'Los Lagos' },
  { codigo: '10201', nombre: 'Castro',              region: 'Los Lagos' },
  { codigo: '10202', nombre: 'Ancud',               region: 'Los Lagos' },
  { codigo: '10203', nombre: 'Chonchi',             region: 'Los Lagos' },
  { codigo: '10204', nombre: 'Curaco de Vélez',     region: 'Los Lagos' },
  { codigo: '10205', nombre: 'Dalcahue',            region: 'Los Lagos' },
  { codigo: '10206', nombre: 'Puqueldón',           region: 'Los Lagos' },
  { codigo: '10207', nombre: 'Queilén',             region: 'Los Lagos' },
  { codigo: '10208', nombre: 'Quellón',             region: 'Los Lagos' },
  { codigo: '10209', nombre: 'Quemchi',             region: 'Los Lagos' },
  { codigo: '10210', nombre: 'Quinchao',            region: 'Los Lagos' },
  { codigo: '10301', nombre: 'Osorno',              region: 'Los Lagos' },
  { codigo: '10302', nombre: 'Puerto Octay',        region: 'Los Lagos' },
  { codigo: '10303', nombre: 'Purranque',           region: 'Los Lagos' },
  { codigo: '10304', nombre: 'Puyehue',             region: 'Los Lagos' },
  { codigo: '10305', nombre: 'Río Negro',           region: 'Los Lagos' },
  { codigo: '10306', nombre: 'San Juan de la Costa',region: 'Los Lagos' },
  { codigo: '10307', nombre: 'San Pablo',           region: 'Los Lagos' },

  // O'Higgins (VI)
  { codigo: '06101', nombre: 'Rancagua',            region: "O'Higgins" },
  { codigo: '06102', nombre: 'Codegua',             region: "O'Higgins" },
  { codigo: '06103', nombre: 'Coinco',              region: "O'Higgins" },
  { codigo: '06104', nombre: 'Coltauco',            region: "O'Higgins" },
  { codigo: '06105', nombre: 'Doñihue',             region: "O'Higgins" },
  { codigo: '06106', nombre: 'Graneros',            region: "O'Higgins" },
  { codigo: '06107', nombre: 'Las Cabras',          region: "O'Higgins" },
  { codigo: '06108', nombre: 'Machalí',             region: "O'Higgins" },
  { codigo: '06109', nombre: 'Malloa',              region: "O'Higgins" },
  { codigo: '06110', nombre: 'Mostazal',            region: "O'Higgins" },
  { codigo: '06111', nombre: 'Olivar',              region: "O'Higgins" },
  { codigo: '06112', nombre: 'Peumo',               region: "O'Higgins" },
  { codigo: '06113', nombre: 'Pichidegua',          region: "O'Higgins" },
  { codigo: '06114', nombre: 'Quinta de Tilcoco',   region: "O'Higgins" },
  { codigo: '06115', nombre: 'Rengo',               region: "O'Higgins" },
  { codigo: '06116', nombre: 'Requínoa',            region: "O'Higgins" },
  { codigo: '06117', nombre: 'San Vicente',         region: "O'Higgins" },
  { codigo: '06201', nombre: 'Pichilemu',           region: "O'Higgins" },
  { codigo: '06301', nombre: 'San Fernando',        region: "O'Higgins" },

  // Maule (VII)
  { codigo: '07101', nombre: 'Talca',               region: 'Maule' },
  { codigo: '07102', nombre: 'Constitución',        region: 'Maule' },
  { codigo: '07103', nombre: 'Curepto',             region: 'Maule' },
  { codigo: '07104', nombre: 'Empedrado',           region: 'Maule' },
  { codigo: '07105', nombre: 'Maule',               region: 'Maule' },
  { codigo: '07106', nombre: 'Pelarco',             region: 'Maule' },
  { codigo: '07107', nombre: 'Pencahue',            region: 'Maule' },
  { codigo: '07108', nombre: 'Río Claro',           region: 'Maule' },
  { codigo: '07109', nombre: 'San Clemente',        region: 'Maule' },
  { codigo: '07110', nombre: 'San Rafael',          region: 'Maule' },
  { codigo: '07201', nombre: 'Cauquenes',           region: 'Maule' },
  { codigo: '07301', nombre: 'Curicó',              region: 'Maule' },
  { codigo: '07302', nombre: 'Hualañé',             region: 'Maule' },
  { codigo: '07303', nombre: 'Licantén',            region: 'Maule' },
  { codigo: '07304', nombre: 'Molina',              region: 'Maule' },
  { codigo: '07305', nombre: 'Rauco',               region: 'Maule' },
  { codigo: '07306', nombre: 'Romeral',             region: 'Maule' },
  { codigo: '07307', nombre: 'Sagrada Familia',     region: 'Maule' },
  { codigo: '07308', nombre: 'Teno',                region: 'Maule' },
  { codigo: '07309', nombre: 'Vichuquén',           region: 'Maule' },
  { codigo: '07401', nombre: 'Linares',             region: 'Maule' },
  { codigo: '07402', nombre: 'Colbún',              region: 'Maule' },
  { codigo: '07403', nombre: 'Longaví',             region: 'Maule' },
  { codigo: '07404', nombre: 'Parral',              region: 'Maule' },
  { codigo: '07405', nombre: 'Retiro',              region: 'Maule' },
  { codigo: '07406', nombre: 'San Javier',          region: 'Maule' },
  { codigo: '07407', nombre: 'Villa Alegre',        region: 'Maule' },
  { codigo: '07408', nombre: 'Yerbas Buenas',       region: 'Maule' },

  // Coquimbo (IV)
  { codigo: '04101', nombre: 'La Serena',           region: 'Coquimbo' },
  { codigo: '04102', nombre: 'Andacollo',           region: 'Coquimbo' },
  { codigo: '04103', nombre: 'Coquimbo',            region: 'Coquimbo' },
  { codigo: '04104', nombre: 'Herradura',           region: 'Coquimbo' },
  { codigo: '04105', nombre: 'La Higuera',          region: 'Coquimbo' },
  { codigo: '04106', nombre: 'Paiguano',            region: 'Coquimbo' },
  { codigo: '04107', nombre: 'Vicuña',              region: 'Coquimbo' },
  { codigo: '04201', nombre: 'Illapel',             region: 'Coquimbo' },
  { codigo: '04301', nombre: 'Ovalle',              region: 'Coquimbo' },

  // Antofagasta (II)
  { codigo: '02101', nombre: 'Antofagasta',         region: 'Antofagasta' },
  { codigo: '02102', nombre: 'Mejillones',          region: 'Antofagasta' },
  { codigo: '02103', nombre: 'Sierra Gorda',        region: 'Antofagasta' },
  { codigo: '02104', nombre: 'Taltal',              region: 'Antofagasta' },
  { codigo: '02201', nombre: 'Calama',              region: 'Antofagasta' },
  { codigo: '02202', nombre: 'Ollagüe',             region: 'Antofagasta' },
  { codigo: '02203', nombre: 'San Pedro de Atacama',region: 'Antofagasta' },
  { codigo: '02301', nombre: 'Tocopilla',           region: 'Antofagasta' },
  { codigo: '02302', nombre: 'María Elena',         region: 'Antofagasta' },

  // Atacama (III)
  { codigo: '03101', nombre: 'Copiapó',             region: 'Atacama' },
  { codigo: '03102', nombre: 'Caldera',             region: 'Atacama' },
  { codigo: '03103', nombre: 'Tierra Amarilla',     region: 'Atacama' },
  { codigo: '03201', nombre: 'Chañaral',            region: 'Atacama' },
  { codigo: '03202', nombre: 'Diego de Almagro',    region: 'Atacama' },
  { codigo: '03301', nombre: 'Vallenar',            region: 'Atacama' },

  // Tarapacá (I)
  { codigo: '01101', nombre: 'Iquique',             region: 'Tarapacá' },
  { codigo: '01107', nombre: 'Alto Hospicio',       region: 'Tarapacá' },
  { codigo: '01401', nombre: 'Pozo Almonte',        region: 'Tarapacá' },

  // Arica y Parinacota (XV)
  { codigo: '15101', nombre: 'Arica',               region: 'Arica y Parinacota' },
  { codigo: '15102', nombre: 'Camarones',           region: 'Arica y Parinacota' },
  { codigo: '15201', nombre: 'Putre',               region: 'Arica y Parinacota' },

  // Los Ríos (XIV)
  { codigo: '14101', nombre: 'Valdivia',            region: 'Los Ríos' },
  { codigo: '14102', nombre: 'Corral',              region: 'Los Ríos' },
  { codigo: '14103', nombre: 'Lanco',               region: 'Los Ríos' },
  { codigo: '14104', nombre: 'Los Lagos',           region: 'Los Ríos' },
  { codigo: '14105', nombre: 'Máfil',               region: 'Los Ríos' },
  { codigo: '14106', nombre: 'Mariquina',           region: 'Los Ríos' },
  { codigo: '14107', nombre: 'Paillaco',            region: 'Los Ríos' },
  { codigo: '14108', nombre: 'Panguipulli',         region: 'Los Ríos' },
  { codigo: '14201', nombre: 'La Unión',            region: 'Los Ríos' },
  { codigo: '14202', nombre: 'Futrono',             region: 'Los Ríos' },
  { codigo: '14203', nombre: 'Lago Ranco',          region: 'Los Ríos' },
  { codigo: '14204', nombre: 'Río Bueno',           region: 'Los Ríos' },

  // Aysén (XI)
  { codigo: '11101', nombre: 'Coihaique',           region: 'Aysén' },
  { codigo: '11102', nombre: 'Lago Verde',          region: 'Aysén' },
  { codigo: '11201', nombre: 'Aysén',               region: 'Aysén' },
  { codigo: '11202', nombre: 'Cisnes',              region: 'Aysén' },
  { codigo: '11203', nombre: 'Guaitecas',           region: 'Aysén' },
  { codigo: '11301', nombre: 'Cochrane',            region: 'Aysén' },
  { codigo: '11302', nombre: 'O\'Higgins',          region: 'Aysén' },
  { codigo: '11303', nombre: 'Tortel',              region: 'Aysén' },
  { codigo: '11401', nombre: 'Chile Chico',         region: 'Aysén' },
  { codigo: '11402', nombre: 'Río Ibáñez',          region: 'Aysén' },

  // Magallanes (XII)
  { codigo: '12101', nombre: 'Punta Arenas',        region: 'Magallanes' },
  { codigo: '12102', nombre: 'Laguna Blanca',       region: 'Magallanes' },
  { codigo: '12103', nombre: 'Río Verde',           region: 'Magallanes' },
  { codigo: '12104', nombre: 'San Gregorio',        region: 'Magallanes' },
  { codigo: '12201', nombre: 'Cabo de Hornos',      region: 'Magallanes' },
  { codigo: '12202', nombre: 'Antártica',           region: 'Magallanes' },
  { codigo: '12301', nombre: 'Porvenir',            region: 'Magallanes' },
  { codigo: '12302', nombre: 'Primavera',           region: 'Magallanes' },
  { codigo: '12303', nombre: 'Timaukel',            region: 'Magallanes' },
  { codigo: '12401', nombre: 'Natales',             region: 'Magallanes' },
  { codigo: '12402', nombre: 'Torres del Paine',    region: 'Magallanes' },

  // Ñuble (XVI)
  { codigo: '16101', nombre: 'Chillán',             region: 'Ñuble' },
  { codigo: '16102', nombre: 'Bulnes',              region: 'Ñuble' },
  { codigo: '16103', nombre: 'Chillán Viejo',       region: 'Ñuble' },
  { codigo: '16104', nombre: 'El Carmen',           region: 'Ñuble' },
  { codigo: '16105', nombre: 'Pemuco',              region: 'Ñuble' },
  { codigo: '16106', nombre: 'Pinto',               region: 'Ñuble' },
  { codigo: '16107', nombre: 'Quillón',             region: 'Ñuble' },
  { codigo: '16108', nombre: 'San Ignacio',         region: 'Ñuble' },
  { codigo: '16109', nombre: 'Yungay',              region: 'Ñuble' },
  { codigo: '16201', nombre: 'Cobquecura',          region: 'Ñuble' },
  { codigo: '16202', nombre: 'Coelemu',             region: 'Ñuble' },
  { codigo: '16203', nombre: 'Ninhue',              region: 'Ñuble' },
  { codigo: '16204', nombre: 'Portezuelo',          region: 'Ñuble' },
  { codigo: '16205', nombre: 'Quirihue',            region: 'Ñuble' },
  { codigo: '16206', nombre: 'Ránquil',             region: 'Ñuble' },
  { codigo: '16207', nombre: 'Trehuaco',            region: 'Ñuble' },
  { codigo: '16301', nombre: 'San Carlos',          region: 'Ñuble' },
  { codigo: '16302', nombre: 'Coihueco',            region: 'Ñuble' },
  { codigo: '16303', nombre: 'Ñiquén',              region: 'Ñuble' },
  { codigo: '16304', nombre: 'San Fabián',          region: 'Ñuble' },
  { codigo: '16305', nombre: 'San Nicolás',         region: 'Ñuble' },
]

/**
 * Busca comunas localmente — normaliza tildes y mayúsculas.
 * Orden: nombre exacto → prefijo nombre → incluye nombre → región → código.
 * `limit` alto (p. ej. 400) devuelve prácticamente todo Chile que coincida.
 */
export function searchComunas(q, limit = 80) {
  const norm = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  const query = norm(q.trim())
  if (query.length < 2) return []

  const scored = []
  for (const c of COMUNAS_CL) {
    const nn = norm(c.nombre)
    const nr = norm(c.region)
    const nc = norm(String(c.codigo))
    let score = 99
    if (nn === query) score = 0
    else if (nn.startsWith(query)) score = 1
    else if (nn.includes(query)) score = 2
    else if (nr.includes(query)) score = 3
    else if (nc.includes(query)) score = 4
    else continue
    scored.push({ c, score, nn })
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    return a.nn.localeCompare(b.nn, 'es', { sensitivity: 'base' })
  })

  const lim = Math.min(Math.max(Number(limit) || 80, 1), 500)
  return scored.slice(0, lim).map((x) => x.c)
}

/**
 * Intenta casar texto de geocodificador (ciudad, suburbio, etc.) con una comuna local.
 */
export function bestComunaMatchFromGeocoderText(text) {
  if (!text || typeof text !== 'string') return null
  const trimmed = text.trim()
  if (trimmed.length < 2) return null

  const tried = new Set()
  const tryOne = (q) => {
    if (!q || q.length < 2) return null
    const k = q.toLowerCase()
    if (tried.has(k)) return null
    tried.add(k)
    const hits = searchComunas(q, 10)
    return hits[0] || null
  }

  let hit = tryOne(trimmed)
  if (hit) return hit
  for (const part of trimmed.split(/[,;/]/).map((s) => s.trim()).filter(Boolean)) {
    hit = tryOne(part)
    if (hit) return hit
  }
  for (const w of trimmed.split(/\s+/).filter((w) => w.length > 2)) {
    hit = tryOne(w)
    if (hit) return hit
  }
  return null
}
