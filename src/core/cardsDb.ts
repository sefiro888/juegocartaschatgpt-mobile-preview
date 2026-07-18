import type { Card, Faction } from '../types/card';

export const CARDS_DB: Record<string, Card> = {
  // --- FURIA (20 cartas, IDs 1-12, 25-32) ---
  'fuente-furia': {
    id: 'fuente-furia',
    name: 'Fuente de Furia',
    faction: 'FURIA',
    type: 'MANA',
    subtype: 'Recurso de Fuego',
    cost: { generic: 0 },
    rarity: 'COMUN',
    rulesText: 'Genera 1 de maná de Furia. (Límite de 1 maná jugado por turno)',
    flavorText: '«El latido ígneo de la tierra misma no se puede apagar; fluye silencioso bajo el nexo esperando la chispa que lo libere.» — Leyenda del Cataclismo',
    cardNumber: 1,
    artPath: '/assets/cards/art/fuente-furia.webp',
    range: 1,
    movement: 0,
    artist: 'Ignis Fatuus',
    artistStyle: 'Fantasía Oscura Digital'
  },
  'sabueso-brasa': {
    id: 'sabueso-brasa',
    name: 'Sabueso de Brasa',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Bestia',
    cost: { generic: 1, furia: 1 },
    rarity: 'COMUN',
    rulesText: 'Carga (Puede moverse y atacar inmediatamente al ser invocado).',
    flavorText: 'El sabueso olfateó el aire cargado de azufre, soltando un ladrido que encendió la hojarasca a su paso. «No es solo una bestia, es una mecha andante», comentó el explorador.',
    attack: 2,
    maxHealth: 1,
    cardNumber: 2,
    artPath: '/assets/cards/art/sabueso-brasa.webp',
    range: 1,
    movement: 2,
    artist: 'Kaelen Vane',
    artistStyle: 'Pintura al Óleo'
  },
  'berserker-ignivoro': {
    id: 'berserker-ignivoro',
    name: 'Berserker Ignívoro',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Guerrero',
    cost: { generic: 3, furia: 1 },
    rarity: 'COMUN',
    rulesText: 'Furia: Cuando esta criatura ataca, se inflige 1 punto de daño a sí misma.',
    flavorText: '«Su rabia es su fuerza, alimentada por su propia destrucción. Si debe arder para vencer, que así sea.» — Diario de campaña de Ignis',
    attack: 4,
    maxHealth: 2,
    cardNumber: 3,
    artPath: '/assets/cards/art/berserker-ignivoro.webp',
    range: 1,
    movement: 1,
    artist: 'Brutus Clay',
    artistStyle: 'Boceto a Carbón / Sketch'
  },
  'dragon-caldera': {
    id: 'dragon-caldera',
    name: 'Dragón de la Caldera',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Dragón',
    cost: { generic: 6, furia: 2 },
    rarity: 'LEGENDARIA',
    rulesText: 'Vuelo (Puede saltar obstáculos). Grito de Batalla: Inflige 2 de daño a todas las unidades enemigas adyacentes.',
    flavorText: 'Cuando alza el vuelo, el cielo se tiñe de brasa y ceniza. Las leyendas dicen que duerme en el corazón del volcán nexo y despierta solo para reclamar su tributo de fuego.',
    attack: 6,
    maxHealth: 6,
    cardNumber: 4,
    artPath: '/assets/cards/art/dragon-caldera.webp',
    range: 1,
    movement: 2,
    artist: 'Elysia Thorne',
    artistStyle: 'Acuarela Mística'
  },
  'lluvia-ceniza': {
    id: 'lluvia-ceniza',
    name: 'Lluvia de Ceniza',
    faction: 'FURIA',
    type: 'HECHIZO',
    subtype: 'Destrucción',
    cost: { generic: 2, furia: 1 },
    rarity: 'RARA',
    rulesText: 'Inflige 3 puntos de daño a una unidad seleccionada o al Nexo objetivo.',
    flavorText: '«Un aguacero de muerte ardiente que no respeta armaduras ni plegarias. Corre si puedes, aunque el cielo mismo te persiga.» — Canto de guerra de Furia',
    cardNumber: 5,
    artPath: '/assets/cards/art/lluvia-ceniza.webp',
    range: 3,
    movement: 0,
    artist: 'Valerius',
    artistStyle: 'Grabado Medieval en Madera'
  },
  'forja-carmesi': {
    id: 'forja-carmesi',
    name: 'Forja Carmesí',
    faction: 'FURIA',
    type: 'ESTRUCTURA',
    subtype: 'Edificio',
    cost: { generic: 3, furia: 1 },
    rarity: 'RARA',
    rulesText: 'Las unidades que invoques en casillas adyacentes a la Forja obtienen +1/+0 de forma permanente.',
    flavorText: '«El metal al rojo vivo nunca duerme. Aquí forjamos las garras del nexo; cada golpe en el yunque es un latido de rabia.» — Herrero Grog',
    maxHealth: 4,
    cardNumber: 6,
    artPath: '/assets/cards/art/forja-carmesi.webp',
    range: 1,
    movement: 0,
    artist: 'Ignis Fatuus',
    artistStyle: 'Fantasía Oscura Digital'
  },
  'chispa-fugaz': {
    id: 'chispa-fugaz',
    name: 'Chispa Fugaz',
    faction: 'FURIA',
    type: 'HECHIZO',
    subtype: 'Evocación rápida',
    cost: { generic: 1 },
    rarity: 'COMUN',
    rulesText: 'Inflige 2 de daño a cualquier objetivo. Descarta una carta aleatoria de tu mano.',
    flavorText: '«Un chispazo descontrolado en medio del nexo. Es rápida, letal e impredecible; a veces quema lo que querías salvar.» — Mago renegado del Nexo',
    cardNumber: 7,
    artPath: '/assets/cards/art/chispa-fugaz.webp',
    range: 3,
    movement: 0,
    artist: 'Zoriel Moon',
    artistStyle: 'Neon / Cyber-Glow'
  },
  'infiltrado-volcanico': {
    id: 'infiltrado-volcanico',
    name: 'Infiltrado Volcánico',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Pícaro',
    cost: { generic: 2, furia: 1 },
    rarity: 'COMUN',
    rulesText: 'Movimiento Diagonal: Puede desplazarse y atacar diagonalmente.',
    flavorText: 'Se desplaza silencioso por los ríos de magma ardiente. Su silueta se confunde con las sombras de las rocas ígneas antes de asestar el golpe letal.',
    attack: 2,
    maxHealth: 2,
    cardNumber: 8,
    artPath: '/assets/cards/art/infiltrado-volcanico.webp',
    range: 1,
    movement: 1,
    artist: 'Lyra Frost',
    artistStyle: 'Vidriera Gótica / Stained Glass'
  },
  'elemental-lava': {
    id: 'elemental-lava',
    name: 'Elemental de Lava',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Elemental',
    cost: { generic: 4, furia: 2 },
    rarity: 'EPICA',
    rulesText: 'Último Aliento: Al morir, inflige 2 de daño a todas las unidades adyacentes en el tablero.',
    flavorText: 'Piedra derretida que busca consumir el mundo. Cuando su núcleo colapsa, explota en un torrente de magma que reduce a cenizas todo a su alrededor.',
    attack: 4,
    maxHealth: 4,
    cardNumber: 9,
    artPath: '/assets/cards/art/elemental-lava.webp',
    range: 1,
    movement: 1,
    artist: 'Hokusai Runic',
    artistStyle: 'Tinta Sumi-e Japonesa'
  },
  'muro-pomez': {
    id: 'muro-pomez',
    name: 'Muro de Piedra Pómez',
    faction: 'FURIA',
    type: 'ESTRUCTURA',
    subtype: 'Muro',
    cost: { generic: 2 },
    rarity: 'COMUN',
    rulesText: 'Obstrucción (No puede moverse ni atacar. Impide el paso enemigo).',
    flavorText: 'Una barrera ligera pero tenaz de roca volcánica solidificada rápidamente. «No detendrá a un gigante, pero te dará tiempo para preparar las flechas de fuego.»',
    maxHealth: 5,
    cardNumber: 10,
    artPath: '/assets/cards/art/muro-pomez.webp',
    range: 1,
    movement: 0,
    artist: 'PixelLord',
    artistStyle: 'Arte de Píxeles Retro / 16-Bit'
  },
  'impetu-fuego': {
    id: 'impetu-fuego',
    name: 'Ímpetu de Fuego',
    faction: 'FURIA',
    type: 'HECHIZO',
    subtype: 'Bendición',
    cost: { generic: 2 },
    rarity: 'COMUN',
    rulesText: 'Otorga +2/+0 y +1 de movimiento a una unidad aliada este turno.',
    flavorText: '«El fuego del Nexo acelera la sangre y los reflejos. En su mirada solo hay rabia pura y el deseo indomable de embestir.» — Aethelgard',
    cardNumber: 11,
    artPath: '/assets/cards/art/impetu-fuego.webp',
    range: 1,
    movement: 0,
    artist: 'Aria Star',
    artistStyle: 'Comic Book / Cel-Shading'
  },
  'comandante-furia': {
    id: 'comandante-furia',
    name: 'Ignis, Cólera del Nexo',
    faction: 'FURIA',
    type: 'COMANDANTE',
    subtype: 'Elemental Guerrero',
    cost: { generic: 4, furia: 2 },
    rarity: 'LEGENDARIA',
    rulesText: 'Comandante. Habilidad Activa (1 Furia): Inflige 1 de daño a una unidad enemiga adyacente.',
    flavorText: '«Que se queme hasta la última brizna. Así sabrán quién reina en las profundidades. Mi corona está hecha de llamas y mi trono de ceniza.» — Comandante Ignis',
    attack: 4,
    maxHealth: 25,
    cardNumber: 12,
    artPath: '/assets/cards/art/comandante-furia.webp',
    range: 1,
    movement: 1,
    artist: 'Ignis Fatuus',
    artistStyle: 'Fantasía Oscura Digital'
  },
  'guerrero-ceniza': {
    id: 'guerrero-ceniza',
    name: 'Guerrero de Ceniza',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Guerrero',
    cost: { generic: 2, furia: 1 },
    rarity: 'COMUN',
    rulesText: 'Grito de Batalla: Inflige 1 de daño a una unidad adyacente en el tablero.',
    flavorText: '«La ceniza no solo ciega; también arde con la fuerza del volcán de donde nació.» — Proverbio de los guerreros de Ignis',
    attack: 3,
    maxHealth: 2,
    cardNumber: 25,
    artPath: '/assets/cards/art/guerrero-ceniza.webp',
    range: 1,
    movement: 1,
    artist: 'Kaelen Vane',
    artistStyle: 'Pintura al Óleo'
  },
  'fenix-renacido': {
    id: 'fenix-renacido',
    name: 'Fénix Renacido',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Fénix',
    cost: { generic: 4, furia: 2 },
    rarity: 'EPICA',
    rulesText: 'Vuelo (Puede saltar obstáculos). Último Aliento: Regresa a tu mano al morir.',
    flavorText: '«La muerte es solo un contratiempo para el fuego eterno. Caerá hoy, pero renacerá de su propio calor mañana.» — Sabiduría elemental de Ignis',
    attack: 2,
    maxHealth: 2,
    cardNumber: 26,
    artPath: '/assets/cards/art/fenix-renacido.webp',
    range: 1,
    movement: 2,
    artist: 'Elysia Thorne',
    artistStyle: 'Acuarela Mística'
  },
  'draco-magma': {
    id: 'draco-magma',
    name: 'Draco de Magma',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Dragón',
    cost: { generic: 5, furia: 1 },
    rarity: 'RARA',
    rulesText: 'Carga. Al atacar, inflige 1 de daño al Nexo enemigo directamente.',
    flavorText: 'Su sangre es lava pura y su furia, indomable. Su rugido agita los cimientos del Nexo antes de que embista directamente contra la fortaleza enemiga.',
    attack: 4,
    maxHealth: 4,
    cardNumber: 27,
    artPath: '/assets/cards/art/draco-magma.webp',
    range: 1,
    movement: 2,
    artist: 'Zoriel Moon',
    artistStyle: 'Neon / Cyber-Glow'
  },
  'trasgo-piroclastico': {
    id: 'trasgo-piroclastico',
    name: 'Trasgo Piroclástico',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Trasgo',
    cost: { generic: 1 },
    rarity: 'COMUN',
    rulesText: 'Carga. Grito de Batalla: Descarta una carta de tu mano de forma aleatoria.',
    flavorText: '«Pequeño, molesto y extremadamente destructivo. No le importa si se quema él mismo con tal de verte arder.» — Notas de exploración de los magos del Domo',
    attack: 2,
    maxHealth: 1,
    cardNumber: 28,
    artPath: '/assets/cards/art/trasgo-piroclastico.webp',
    range: 1,
    movement: 2,
    artist: 'Brutus Clay',
    artistStyle: 'Boceto a Carbón / Sketch'
  },
  'golem-fundicion': {
    id: 'golem-fundicion',
    name: 'Golem de la Fundición',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Golem',
    cost: { generic: 5, furia: 2 },
    rarity: 'EPICA',
    rulesText: 'Al final de tu turno, inflige 1 de daño a todas las unidades adyacentes (aliadas y enemigas).',
    flavorText: 'Un horno viviente que derrite el suelo bajo sus pies. Su simple presencia hace que el acero empiece a licuarse y la piedra se agriete.',
    attack: 5,
    maxHealth: 5,
    cardNumber: 29,
    artPath: '/assets/cards/art/golem-fundicion.webp',
    range: 1,
    movement: 1,
    artist: 'Ignis Fatuus',
    artistStyle: 'Fantasía Oscura Digital'
  },
  'furia-nexo': {
    id: 'furia-nexo',
    name: 'Furia del Nexo',
    faction: 'FURIA',
    type: 'HECHIZO',
    subtype: 'Evocación ígnea',
    cost: { generic: 3, furia: 1 },
    rarity: 'RARA',
    rulesText: 'Otorga +3/+0 y Carga a una unidad aliada este turno.',
    flavorText: '«La rabia del Nexo desatada en un solo golpe. Una fuerza tan destructiva que consume los músculos y el alma del portador en minutos.»',
    cardNumber: 30,
    artPath: '/assets/cards/art/furia-nexo.webp',
    range: 1,
    movement: 0,
    artist: 'Aria Star',
    artistStyle: 'Comic Book / Cel-Shading'
  },
  'erupcion-volcanica': {
    id: 'erupcion-volcanica',
    name: 'Erupción Volcánica',
    faction: 'FURIA',
    type: 'HECHIZO',
    subtype: 'Cataclismo',
    cost: { generic: 5, furia: 2 },
    rarity: 'EPICA',
    rulesText: 'Inflige 2 de daño a todas las unidades en el tablero.',
    flavorText: '«La ira del volcán consume a justos y pecadores por igual. Cuando la tierra ruge, no hay escudo que aguante la marea de fuego.» — Crónicas del Domo',
    cardNumber: 31,
    artPath: '/assets/cards/art/erupcion-volcanica.webp',
    range: 5,
    movement: 0,
    artist: 'Valerius',
    artistStyle: 'Grabado Medieval en Madera'
  },
  'pilar-fuego': {
    id: 'pilar-fuego',
    name: 'Pilar de Fuego',
    faction: 'FURIA',
    type: 'ESTRUCTURA',
    subtype: 'Pilar',
    cost: { generic: 4, furia: 1 },
    rarity: 'RARA',
    rulesText: 'Al inicio de tu turno, inflige 2 de daño a una unidad enemiga aleatoria en la misma fila del Pilar.',
    flavorText: 'Una columna de fuego constante que calcina la retaguardia enemiga. Los soldados aprenden rápido a evitar su línea de visión abrasadora.',
    maxHealth: 5,
    cardNumber: 32,
    artPath: '/assets/cards/art/pilar-fuego.webp',
    range: 4,
    movement: 0,
    artist: 'PixelLord',
    artistStyle: 'Arte de Píxeles Retro / 16-Bit'
  },

  // --- ARCANO (20 cartas, IDs 13-24, 33-40) ---
  'fuente-arcana': {
    id: 'fuente-arcana',
    name: 'Fuente Arcana',
    faction: 'ARCANO',
    type: 'MANA',
    subtype: 'Recurso Arcano',
    cost: { generic: 0 },
    rarity: 'COMUN',
    rulesText: 'Genera 1 de maná de Arcano. (Límite de 1 maná jugado por turno)',
    flavorText: '«La corriente fría de la energía pura y silenciosa que sostiene el Domo. Es el fluir del cosmos que pacifica el alma.» — Aethelgard',
    cardNumber: 13,
    artPath: '/assets/cards/art/fuente-arcana.webp',
    range: 1,
    movement: 0,
    artist: 'Lyra Frost',
    artistStyle: 'Vidriera Gótica / Stained Glass'
  },
  'centinela-cristal': {
    id: 'centinela-cristal',
    name: 'Centinela de Cristal',
    faction: 'ARCANO',
    type: 'UNIDAD',
    subtype: 'Golem',
    cost: { generic: 2, arcano: 1 },
    rarity: 'COMUN',
    rulesText: 'Resistencia: Ignora el primer punto de daño que recibe en cada turno.',
    flavorText: 'Piedra rúnica tallada en cristal que repele los impactos. Sus runas brillan con luz azul fría con cada golpe absorbido.',
    attack: 1,
    maxHealth: 4,
    cardNumber: 14,
    artPath: '/assets/cards/art/centinela-cristal.webp',
    range: 1,
    movement: 1,
    artist: 'Hokusai Runic',
    artistStyle: 'Tinta Sumi-e Japonesa'
  },
  'tejedora-escarcha': {
    id: 'tejedora-escarcha',
    name: 'Tejedora de Escarcha',
    faction: 'ARCANO',
    type: 'UNIDAD',
    subtype: 'Mago',
    cost: { generic: 3, arcano: 1 },
    rarity: 'COMUN',
    rulesText: 'Grito de Batalla: Congela a una unidad enemiga por 1 turno (No puede moverse ni atacar).',
    flavorText: '«Su aliento hiela el aire y detiene los corazones más férreos. El calor es una debilidad pasajera.» — Lección de la Tejedora a sus aprendices',
    attack: 2,
    maxHealth: 3,
    cardNumber: 15,
    artPath: '/assets/cards/art/tejedora-escarcha.webp',
    range: 1,
    movement: 1,
    artist: 'Elysia Thorne',
    artistStyle: 'Acuarela Mística'
  },
  'prision-glacial': {
    id: 'prision-glacial',
    name: 'Prisión Glacial',
    faction: 'ARCANO',
    type: 'HECHIZO',
    subtype: 'Control',
    cost: { generic: 2, arcano: 1 },
    rarity: 'RARA',
    rulesText: 'Congela a una unidad enemiga en el tablero durante 2 turnos.',
    flavorText: '«El hielo eterno detiene todo calor e ímpetu. Incluso el gigante más enfurecido se ve reducido a una estatua inmóvil.» — Sabiduría del Sabio del Domo',
    cardNumber: 16,
    artPath: '/assets/cards/art/prision-glacial.webp',
    range: 3,
    movement: 0,
    artist: 'Valerius',
    artistStyle: 'Grabado Medieval en Madera'
  },
  'cometa-arcano': {
    id: 'cometa-arcano',
    name: 'Cometa Arcano',
    faction: 'ARCANO',
    type: 'HECHIZO',
    subtype: 'Evocación cósmica',
    cost: { generic: 4, arcano: 2 },
    rarity: 'RARA',
    rulesText: 'Inflige 4 de daño a una unidad enemiga. Roba una carta de tu mazo.',
    flavorText: 'Una estrella fugaz de energía destilada del Domo. Su impacto abre grietas en la realidad del Nexo, liberando conocimientos olvidados.',
    cardNumber: 17,
    artPath: '/assets/cards/art/cometa-arcano.webp',
    range: 4,
    movement: 0,
    artist: 'Zoriel Moon',
    artistStyle: 'Neon / Cyber-Glow'
  },
  'torre-horizonte': {
    id: 'torre-horizonte',
    name: 'Torre del Horizonte',
    faction: 'ARCANO',
    type: 'ESTRUCTURA',
    subtype: 'Edificio',
    cost: { generic: 3, arcano: 1 },
    rarity: 'EPICA',
    rulesText: 'Al comienzo de tu turno, roba 1 carta.',
    flavorText: 'Desde su cúspide celestial, las posibilidades se despliegan infinitas ante los astrónomos del Domo. Nada escapa a su lente celestial.',
    maxHealth: 4,
    cardNumber: 18,
    artPath: '/assets/cards/art/torre-horizonte.webp',
    range: 1,
    movement: 0,
    artist: 'Lyra Frost',
    artistStyle: 'Vidriera Gótica / Stained Glass'
  },
  'aprendiz-nexo': {
    id: 'aprendiz-nexo',
    name: 'Aprendiz del Nexo',
    faction: 'ARCANO',
    type: 'UNIDAD',
    subtype: 'Estudiante',
    cost: { generic: 1 },
    rarity: 'COMUN',
    rulesText: 'Tus hechizos cuestan 1 menos de maná genérico (mínimo 1).',
    flavorText: 'Un estudiante ansioso de poder que memoriza runas sin cesar. «La concentración abre las puertas del nexo; el resto es solo voluntad.»',
    attack: 1,
    maxHealth: 2,
    cardNumber: 19,
    artPath: '/assets/cards/art/aprendiz-nexo.webp',
    range: 1,
    movement: 1,
    artist: 'PixelLord',
    artistStyle: 'Arte de Píxeles Retro / 16-Bit'
  },
  'barrera-hielo': {
    id: 'barrera-hielo',
    name: 'Barrera de Hielo',
    faction: 'ARCANO',
    type: 'ESTRUCTURA',
    subtype: 'Muro',
    cost: { generic: 2 },
    rarity: 'COMUN',
    rulesText: 'Obstrucción. Cuando es atacada cuerpo a cuerpo, congela al atacante por 1 turno.',
    flavorText: 'Tocarla es quedar atrapado por la escarcha eterna del polo norte. Los atacantes quedan petrificados al instante al tocar el hielo puro.',
    maxHealth: 4,
    cardNumber: 20,
    artPath: '/assets/cards/art/barrera-hielo.webp',
    range: 1,
    movement: 0,
    artist: 'Brutus Clay',
    artistStyle: 'Boceto a Carbón / Sketch'
  },
  'destello-runico': {
    id: 'destello-runico',
    name: 'Destello Rúnico',
    faction: 'ARCANO',
    type: 'HECHIZO',
    subtype: 'Conjuro rápido',
    cost: { generic: 1 },
    rarity: 'COMUN',
    rulesText: 'Congela a una unidad enemiga adyacente a tu Comandante y roba 1 carta.',
    flavorText: '«Un destello cegador que emana del báculo rúnico para aturdir a los agresores más atrevidos.» — Comandante Aethelgard',
    cardNumber: 21,
    artPath: '/assets/cards/art/destello-runico.webp',
    range: 2,
    movement: 0,
    artist: 'Aria Star',
    artistStyle: 'Comic Book / Cel-Shading'
  },
  'golem-glaciar': {
    id: 'golem-glaciar',
    name: 'Golem de Glaciar',
    faction: 'ARCANO',
    type: 'UNIDAD',
    subtype: 'Golem',
    cost: { generic: 5, arcano: 2 },
    rarity: 'LEGENDARIA',
    rulesText: 'Inmune a Hechizos: No puede ser objetivo de hechizos de ningún jugador.',
    flavorText: 'Hielo antiguo modelado con la fuerza silenciosa de los siglos. Las runas arcanas que lo mantienen en pie repelen todo intento de encantamiento.',
    attack: 3,
    maxHealth: 6,
    cardNumber: 22,
    artPath: '/assets/cards/art/golem-glaciar.webp',
    range: 1,
    movement: 1,
    artist: 'Kaelen Vane',
    artistStyle: 'Pintura al Óleo'
  },
  'vortice-mana': {
    id: 'vortice-mana',
    name: 'Vórtice de Maná',
    faction: 'ARCANO',
    type: 'HECHIZO',
    subtype: 'Transmutación',
    cost: { generic: 3, arcano: 1 },
    rarity: 'EPICA',
    rulesText: 'Devuelve una unidad del tablero a la mano de su propietario.',
    flavorText: '«La energía del Nexo gira en sentido contrario, deshaciendo la materia y enviando la criatura de vuelta al plano de su invocación.» — Libro de hechizos del Domo',
    cardNumber: 23,
    artPath: '/assets/cards/art/vortice-mana.webp',
    range: 3,
    movement: 0,
    artist: 'Hokusai Runic',
    artistStyle: 'Tinta Sumi-e Japonesa'
  },
  'comandante-arcano': {
    id: 'comandante-arcano',
    name: 'Aethelgard, Sabio del Domo',
    faction: 'ARCANO',
    type: 'COMANDANTE',
    subtype: 'Mago Comandante',
    cost: { generic: 4, arcano: 2 },
    rarity: 'LEGENDARIA',
    rulesText: 'Comandante. Habilidad Activa (1 Arcano): Roba una carta.',
    flavorText: '«En el silencio del hielo eterno, la verdad del universo se revela a quienes saben escuchar. Mi mente abarca todas las posibilidades del Nexo.» — Aethelgard',
    attack: 2,
    maxHealth: 25,
    cardNumber: 24,
    artPath: '/assets/cards/art/comandante-arcano.webp',
    range: 2,
    movement: 1,
    artist: 'Lyra Frost',
    artistStyle: 'Vidriera Gótica / Stained Glass'
  },
  'buho-runico': {
    id: 'buho-runico',
    name: 'Búho Rúnico',
    faction: 'ARCANO',
    type: 'UNIDAD',
    subtype: 'Bestia',
    cost: { generic: 2, arcano: 1 },
    rarity: 'COMUN',
    rulesText: 'Vuelo. Al inicio de tu turno, roba 1 carta y descarta 1 carta.',
    flavorText: 'Su vuelo nocturno dibuja constelaciones en la tundra helada. Su sabiduría otorga nuevas ideas al mago, pero exige deshacerse de viejos conceptos.',
    attack: 1,
    maxHealth: 3,
    cardNumber: 33,
    artPath: '/assets/cards/art/buho-runico.webp',
    range: 1,
    movement: 2,
    artist: 'Elysia Thorne',
    artistStyle: 'Acuarela Mística'
  },
  'elemental-tormenta': {
    id: 'elemental-tormenta',
    name: 'Elemental de Tormenta',
    faction: 'ARCANO',
    type: 'UNIDAD',
    subtype: 'Elemental',
    cost: { generic: 4, arcano: 2 },
    rarity: 'EPICA',
    rulesText: 'Grito de Batalla: Congela a 2 unidades enemigas aleatorias en el tablero por 1 turno.',
    flavorText: 'El viento helado se materializa en una ráfaga devastadora. Su simple paso congela instantáneamente las articulaciones de los rivales desprotegidos.',
    attack: 3,
    maxHealth: 3,
    cardNumber: 34,
    artPath: '/assets/cards/art/elemental-tormenta.webp',
    range: 1,
    movement: 1,
    artist: 'Zoriel Moon',
    artistStyle: 'Neon / Cyber-Glow'
  },
  'avatar-cosmos': {
    id: 'avatar-cosmos',
    name: 'Avatar del Cosmos',
    faction: 'ARCANO',
    type: 'UNIDAD',
    subtype: 'Espíritu',
    cost: { generic: 6, arcano: 2 },
    rarity: 'LEGENDARIA',
    rulesText: 'Inmune a Hechizos. Tus hechizos cuestan 1 menos (mínimo 1 maná).',
    flavorText: 'Nacido del vacío infinito entre las estrellas, posee el conocimiento absoluto. Su presencia altera el flujo mágico del nexo a favor del invocador.',
    attack: 5,
    maxHealth: 5,
    cardNumber: 35,
    artPath: '/assets/cards/art/avatar-cosmos.webp',
    range: 2,
    movement: 1,
    artist: 'Ignis Fatuus',
    artistStyle: 'Fantasía Oscura Digital'
  },
  'tejedora-tiempo': {
    id: 'tejedora-tiempo',
    name: 'Tejedora del Tiempo',
    faction: 'ARCANO',
    type: 'UNIDAD',
    subtype: 'Mago',
    cost: { generic: 3, arcano: 1 },
    rarity: 'RARA',
    rulesText: 'Grito de Batalla: Selecciona una unidad aliada. Puede moverse y atacar una segunda vez este turno.',
    flavorText: '«El tiempo no es lineal, es un hilo más en mi telar. Si quieres volver a golpear, déjame desenredar tu momento.» — Tejedora del Tiempo',
    attack: 2,
    maxHealth: 2,
    cardNumber: 36,
    artPath: '/assets/cards/art/tejedora-tiempo.webp',
    range: 1,
    movement: 1,
    artist: 'Aria Star',
    artistStyle: 'Comic Book / Cel-Shading'
  },
  'mago-runa-helada': {
    id: 'mago-runa-helada',
    name: 'Mago de Runa Helada',
    faction: 'ARCANO',
    type: 'UNIDAD',
    subtype: 'Mago',
    cost: { generic: 3, arcano: 1 },
    rarity: 'COMUN',
    rulesText: 'Cuando esta unidad inflige daño de combate a otra unidad, la congela por 1 turno.',
    flavorText: 'Cada golpe de su báculo rúnico congela la sangre de su rival, deteniendo su avance por completo. «No mato por fuego, mato por quietud.»',
    attack: 2,
    maxHealth: 3,
    cardNumber: 37,
    artPath: '/assets/cards/art/mago-runa-helada.webp',
    range: 2,
    movement: 1,
    artist: 'Hokusai Runic',
    artistStyle: 'Tinta Sumi-e Japonesa'
  },
  'congelacion-rapida': {
    id: 'congelacion-rapida',
    name: 'Congelación Rápida',
    faction: 'ARCANO',
    type: 'HECHIZO',
    subtype: 'Conjuro helado',
    cost: { generic: 1, arcano: 1 },
    rarity: 'COMUN',
    rulesText: 'Congela a una unidad enemiga en el tablero. Roba 1 carta.',
    flavorText: '«Un suspiro frío en el aire y el objetivo se detiene rígido, mientras sus pensamientos se vuelven transparentes para el invocador.» — Lección del Domo',
    cardNumber: 38,
    artPath: '/assets/cards/art/congelacion-rapida.webp',
    range: 3,
    movement: 0,
    artist: 'PixelLord',
    artistStyle: 'Arte de Píxeles Retro / 16-Bit'
  },
  'tormenta-mana': {
    id: 'tormenta-mana',
    name: 'Tormenta de Maná',
    faction: 'ARCANO',
    type: 'HECHIZO',
    subtype: 'Tormenta',
    cost: { generic: 4, arcano: 1 },
    rarity: 'RARA',
    rulesText: 'Congela a todas las unidades en la columna seleccionada del tablero.',
    flavorText: 'Una ventisca cósmica que paraliza líneas enteras de infantería enemiga. El frío desciende directamente del Domo, inmovilizando los peones enemigos.',
    cardNumber: 39,
    artPath: '/assets/cards/art/tormenta-mana.webp',
    range: 3,
    movement: 0,
    artist: 'Valerius',
    artistStyle: 'Grabado Medieval en Madera'
  },
  'templo-runico': {
    id: 'templo-runico',
    name: 'Templo Rúnico',
    faction: 'ARCANO',
    type: 'ESTRUCTURA',
    subtype: 'Edificio',
    cost: { generic: 3 },
    rarity: 'COMUN',
    rulesText: 'Tus comandantes tienen +1 de ataque y Resistencia (ignoran 1 punto de daño).',
    flavorText: '«El nexo del templo sagrado irradia energía protectora al sabio, convirtiendo su báculo en un arma letal y su túnica en un escudo rúnico.»',
    maxHealth: 4,
    cardNumber: 40,
    artPath: '/assets/cards/art/templo-runico.webp',
    range: 1,
    movement: 0,
    artist: 'Brutus Clay',
    artistStyle: 'Boceto a Carbón / Sketch'
  },
  'devorador-entropico': {
    id: 'devorador-entropico',
    name: 'Devorador Entrópico',
    faction: 'VACIO',
    type: 'UNIDAD',
    subtype: 'Horror cósmico',
    cost: { generic: 5, arcano: 2 },
    rarity: 'LEGENDARIA',
    rulesText: 'Vuelo (Puede saltar obstáculos). Resistencia (Reduce en 1 el daño recibido).',
    flavorText: '«No devora mundos por hambre, sino para devolverlos al silencio anterior a la creación.» — Astrónomo del último observatorio',
    attack: 4,
    maxHealth: 6,
    cardNumber: 41,
    artPath: '/assets/cards/art/devorador-entropico.webp',
    range: 1,
    movement: 2,
    artist: 'Archivo del Nexo',
    artistStyle: 'Fantasía cósmica'
  },
  'basilisco-caos': {
    id: 'basilisco-caos',
    name: 'Basilisco del Caos',
    faction: 'NATURALEZA',
    type: 'UNIDAD',
    subtype: 'Bestia',
    cost: { generic: 4 },
    rarity: 'RARA',
    rulesText: 'Movimiento Diagonal: Puede desplazarse y atacar diagonalmente.',
    flavorText: 'Su mirada no convierte la carne en piedra: desordena las leyes que mantienen unido al mundo.',
    attack: 4,
    maxHealth: 4,
    cardNumber: 42,
    artPath: '/assets/cards/art/basilisco-caos.webp',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Fantasía oscura'
  },
  'biblioteca-runica': {
    id: 'biblioteca-runica',
    name: 'Biblioteca Rúnica',
    faction: 'ARCANO',
    type: 'ESTRUCTURA',
    subtype: 'Edificio',
    cost: { generic: 3, arcano: 1 },
    rarity: 'RARA',
    rulesText: 'Al comienzo de tu turno, roba 1 carta.',
    flavorText: 'Cada pasillo conserva un futuro posible y cada libro sabe cuánto le queda a una estrella para apagarse.',
    maxHealth: 5,
    cardNumber: 43,
    artPath: '/assets/cards/art/biblioteca-runica.webp',
    range: 1,
    movement: 0,
    artist: 'Archivo del Nexo',
    artistStyle: 'Arquitectura rúnica'
  },
  'clerigo-luz': {
    id: 'clerigo-luz',
    name: 'Clérigo de la Luz',
    faction: 'ORDEN',
    type: 'UNIDAD',
    subtype: 'Clérigo',
    cost: { generic: 4 },
    rarity: 'COMUN',
    rulesText: 'Resistencia (Reduce en 1 el daño recibido).',
    flavorText: 'Su plegaria no pide que desaparezca la oscuridad, sino que nadie tenga que atravesarla solo.',
    attack: 3,
    maxHealth: 5,
    cardNumber: 44,
    artPath: '/assets/cards/art/clerigo-luz.webp',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Fantasía sacra'
  },
  'demonio-infernal': {
    id: 'demonio-infernal',
    name: 'Demonio Infernal',
    faction: 'SOMBRA',
    type: 'UNIDAD',
    subtype: 'Demonio',
    cost: { generic: 5 },
    rarity: 'RARA',
    rulesText: 'Carga (Puede moverse y atacar inmediatamente al ser invocado).',
    flavorText: 'No fue invocado desde el infierno. El infierno se abrió para que él pudiera salir.',
    attack: 5,
    maxHealth: 4,
    cardNumber: 45,
    artPath: '/assets/cards/art/demonio-infernal.webp',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Pintura infernal'
  },
  'espectro-siniestro': {
    id: 'espectro-siniestro',
    name: 'Espectro Siniestro',
    faction: 'SOMBRA',
    type: 'UNIDAD',
    subtype: 'Espectro',
    cost: { generic: 3 },
    rarity: 'COMUN',
    rulesText: 'Vuelo (Puede saltar obstáculos).',
    flavorText: 'La cripta lo recuerda como un nombre; el campo de batalla lo conoce como una silueta que nunca toca el suelo.',
    attack: 3,
    maxHealth: 3,
    cardNumber: 46,
    artPath: '/assets/cards/art/espectro-siniestro.webp',
    range: 1,
    movement: 2,
    artist: 'Archivo del Nexo',
    artistStyle: 'Gótico espectral'
  },
  'esqueleto-guerrero': {
    id: 'esqueleto-guerrero',
    name: 'Esqueleto Guerrero',
    faction: 'SOMBRA',
    type: 'UNIDAD',
    subtype: 'Guerrero',
    cost: { generic: 2 },
    rarity: 'COMUN',
    rulesText: 'Resistencia (Reduce en 1 el daño recibido).',
    flavorText: 'Su armadura se oxidó hace siglos. Su juramento, en cambio, sigue afilado.',
    attack: 2,
    maxHealth: 3,
    cardNumber: 47,
    artPath: '/assets/cards/art/esqueleto-guerrero.webp',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Fantasía gótica'
  },
  'gigante-magma': {
    id: 'gigante-magma',
    name: 'Gigante de Magma',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Gigante',
    cost: { generic: 5, furia: 1 },
    rarity: 'EPICA',
    rulesText: 'Resistencia (Reduce en 1 el daño recibido).',
    flavorText: 'Cada paso suyo levanta una montaña de ceniza y cada puño recuerda el primer golpe del Cataclismo.',
    attack: 5,
    maxHealth: 6,
    cardNumber: 48,
    artPath: '/assets/cards/art/gigante-magma.webp',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Fantasía volcánica'
  },
  'golem-runico': {
    id: 'golem-runico',
    name: 'Gólem Rúnico',
    faction: 'ARCANO',
    type: 'UNIDAD',
    subtype: 'Gólem',
    cost: { generic: 5, arcano: 1 },
    rarity: 'EPICA',
    rulesText: 'Resistencia (Reduce en 1 el daño recibido).',
    flavorText: 'Las runas de su pecho no describen un hechizo: describen una orden que lleva mil años esperando.',
    attack: 4,
    maxHealth: 6,
    cardNumber: 49,
    artPath: '/assets/cards/art/golem-runico.webp',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Piedra rúnica'
  },
  'grifo-orden': {
    id: 'grifo-orden',
    name: 'Grifo del Orden',
    faction: 'ORDEN',
    type: 'UNIDAD',
    subtype: 'Grifo',
    cost: { generic: 4 },
    rarity: 'RARA',
    rulesText: 'Vuelo (Puede saltar obstáculos).',
    flavorText: 'Desde sus alas, las fronteras parecen líneas dibujadas sobre la tierra. Su deber es vigilar todas.',
    attack: 4,
    maxHealth: 4,
    cardNumber: 50,
    artPath: '/assets/cards/art/grifo-orden.webp',
    range: 1,
    movement: 2,
    artist: 'Archivo del Nexo',
    artistStyle: 'Fantasía celestial'
  },
  'guardian-escarchado': {
    id: 'guardian-escarchado',
    name: 'Guardián Escarchado',
    faction: 'ARCANO',
    type: 'UNIDAD',
    subtype: 'Guardián',
    cost: { generic: 4, arcano: 1 },
    rarity: 'RARA',
    rulesText: 'Resistencia (Reduce en 1 el daño recibido).',
    flavorText: 'No protege una puerta ni un tesoro. Protege el último fragmento de invierno que queda en el Nexo.',
    attack: 3,
    maxHealth: 5,
    cardNumber: 51,
    artPath: '/assets/cards/art/guardian-escarchado.webp',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Fantasía glacial'
  },
  'juicio-divino': {
    id: 'juicio-divino',
    name: 'Juicio Divino',
    faction: 'ORDEN',
    type: 'HECHIZO',
    subtype: 'Castigo',
    cost: { generic: 4 },
    rarity: 'EPICA',
    rulesText: 'Inflige 3 puntos de daño a una unidad seleccionada o al Nexo objetivo.',
    flavorText: 'Cuando la luz cae desde el cielo, incluso los culpables y los inocentes comparten la misma sombra.',
    cardNumber: 52,
    artPath: '/assets/cards/art/juicio-divino.webp',
    range: 4,
    movement: 0,
    artist: 'Archivo del Nexo',
    artistStyle: 'Fantasía divina'
  },
  'leviatan-abisal': {
    id: 'leviatan-abisal',
    name: 'Leviatán Abisal',
    faction: 'VACIO',
    type: 'UNIDAD',
    subtype: 'Leviatán',
    cost: { generic: 6 },
    rarity: 'LEGENDARIA',
    rulesText: 'Vuelo (Puede saltar obstáculos).',
    flavorText: 'Nada en un océano sin agua y emerge allí donde el cielo empieza a parecerse demasiado a un abismo.',
    attack: 6,
    maxHealth: 6,
    cardNumber: 53,
    artPath: '/assets/cards/art/leviatan-abisal.webp',
    range: 1,
    movement: 2,
    artist: 'Archivo del Nexo',
    artistStyle: 'Fantasía abisal'
  },
  'murcielago-sombra': {
    id: 'murcielago-sombra',
    name: 'Murciélago de Sombra',
    faction: 'SOMBRA',
    type: 'UNIDAD',
    subtype: 'Bestia',
    cost: { generic: 2 },
    rarity: 'COMUN',
    rulesText: 'Vuelo (Puede saltar obstáculos).',
    flavorText: 'Su chillido no se escucha: aparece dentro de la mente de quien ya ha sido elegido como presa.',
    attack: 2,
    maxHealth: 2,
    cardNumber: 54,
    artPath: '/assets/cards/art/murcielago-sombra.webp',
    range: 1,
    movement: 2,
    artist: 'Archivo del Nexo',
    artistStyle: 'Gótico sombrío'
  },
  'orco-comandante': {
    id: 'orco-comandante',
    name: 'Comandante Orco',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Guerrero',
    cost: { generic: 5, furia: 1 },
    rarity: 'EPICA',
    rulesText: 'Carga (Puede moverse y atacar inmediatamente al ser invocado).',
    flavorText: 'No grita para ordenar el ataque. Grita porque ya está en medio de él.',
    attack: 5,
    maxHealth: 5,
    cardNumber: 55,
    artPath: '/assets/cards/art/cacique-orco.png',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Guerra de fantasía'
  },
  'orco-guerrero': {
    id: 'orco-guerrero',
    name: 'Guerrero Orco',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Guerrero',
    cost: { generic: 3, furia: 1 },
    rarity: 'COMUN',
    rulesText: 'Carga (Puede moverse y atacar inmediatamente al ser invocado).',
    flavorText: 'El acero es pesado, la armadura es incómoda y el enemigo está cerca. Para él, todo eso es una invitación.',
    attack: 3,
    maxHealth: 3,
    cardNumber: 56,
    artPath: '/assets/cards/art/orco-guerrero.webp',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Guerra de fantasía'
  },
  'parasito-vacio': {
    id: 'parasito-vacio',
    name: 'Parásito del Vacío',
    faction: 'VACIO',
    type: 'UNIDAD',
    subtype: 'Horror',
    cost: { generic: 3 },
    rarity: 'COMUN',
    rulesText: 'Movimiento Diagonal: Puede desplazarse y atacar diagonalmente.',
    flavorText: 'No invade un cuerpo: convence a la realidad de que siempre hubo algo viviendo dentro.',
    attack: 3,
    maxHealth: 3,
    cardNumber: 57,
    artPath: '/assets/cards/art/parasito-vacio.webp',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Horror cósmico'
  },
  'pegaso-celestial': {
    id: 'pegaso-celestial',
    name: 'Pegaso Celestial',
    faction: 'ORDEN',
    type: 'UNIDAD',
    subtype: 'Pegaso',
    cost: { generic: 4 },
    rarity: 'RARA',
    rulesText: 'Vuelo (Puede saltar obstáculos).',
    flavorText: 'Sus cascos no pisan las nubes: las despiertan. Allí donde galopa, el amanecer encuentra un camino.',
    attack: 3,
    maxHealth: 4,
    cardNumber: 58,
    artPath: '/assets/cards/art/pegaso-celestial.webp',
    range: 1,
    movement: 2,
    artist: 'Archivo del Nexo',
    artistStyle: 'Fantasía celestial'
  },
  'pesadilla-mortal': {
    id: 'pesadilla-mortal',
    name: 'Pesadilla Mortal',
    faction: 'SOMBRA',
    type: 'HECHIZO',
    subtype: 'Miedo',
    cost: { generic: 4 },
    rarity: 'RARA',
    rulesText: 'Inflige 3 puntos de daño a una unidad seleccionada o al Nexo objetivo.',
    flavorText: 'El objetivo no ve una criatura: ve el instante exacto en que todos sus planes dejan de importar.',
    cardNumber: 59,
    artPath: '/assets/cards/art/pesadilla-mortal.webp',
    range: 4,
    movement: 0,
    artist: 'Archivo del Nexo',
    artistStyle: 'Fantasía onírica'
  },
  'zombi-hambriento': {
    id: 'zombi-hambriento',
    name: 'Zombi Hambriento',
    faction: 'SOMBRA',
    type: 'UNIDAD',
    subtype: 'No-muerto',
    cost: { generic: 2 },
    rarity: 'COMUN',
    rulesText: 'Resistencia (Reduce en 1 el daño recibido).',
    flavorText: 'La tumba le quitó el nombre, pero no el hambre. Desde entonces busca un corazón que todavía recuerde cómo latir.',
    attack: 2,
    maxHealth: 3,
    cardNumber: 60,
    artPath: '/assets/cards/art/zombi-infectado.png',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Horror gótico'
  },
  'golem-piedra': {
    id: 'golem-piedra',
    name: 'GÃ³lem de Piedra',
    faction: 'ARCANO',
    type: 'UNIDAD',
    subtype: 'GÃ³lem',
    cost: { generic: 4, arcano: 1 },
    rarity: 'RARA',
    rulesText: 'Resistencia (Reduce en 1 el daÃ±o recibido).',
    flavorText: 'Fue tallado en una montaÃ±a que ya no existe. Cada paso suyo recuerda al valle que jurÃ³ proteger.',
    attack: 3,
    maxHealth: 6,
    cardNumber: 61,
    artPath: '/assets/cards/art/golem-piedra.png',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Piedra rÃºnica'
  },
  'minotauro-brasa': {
    id: 'minotauro-brasa',
    name: 'Minotauro de Brasa',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Minotauro',
    cost: { generic: 4, furia: 1 },
    rarity: 'RARA',
    rulesText: 'Carga (Puede moverse y atacar inmediatamente al ser invocado).',
    flavorText: 'No embiste porque estÃ© furioso. Embiste porque el mundo aÃºn sigue en pie.',
    attack: 5,
    maxHealth: 4,
    cardNumber: 62,
    artPath: '/assets/cards/art/minotauro-brasa.png',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'FantasÃ­a volcÃ¡nica'
  },
  'cacique-orco': {
    id: 'cacique-orco',
    name: 'Cacique Orco',
    faction: 'FURIA',
    type: 'UNIDAD',
    subtype: 'Guerrero',
    cost: { generic: 5, furia: 1 },
    rarity: 'EPICA',
    rulesText: 'Tus otros orcos y guerreros adyacentes ganan +1 de ataque.',
    flavorText: 'Su tribu no sigue una bandera. Sigue el sonido de su hacha golpeando el suelo.',
    attack: 4,
    maxHealth: 6,
    cardNumber: 63,
    artPath: '/assets/cards/art/cacique-orco.png',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Guerra de fantasÃ­a'
  },
  'horca-renegada': {
    id: 'horca-renegada',
    name: 'Horca Renegada',
    faction: 'SOMBRA',
    type: 'ESTRUCTURA',
    subtype: 'Artefacto',
    cost: { generic: 3 },
    rarity: 'RARA',
    rulesText: 'Las unidades enemigas adyacentes tienen -1 de movimiento.',
    flavorText: 'Nadie recuerda quiÃ©n la construyÃ³. Lo inquietante es que cada amanecer aparece una cuerda nueva.',
    maxHealth: 4,
    cardNumber: 64,
    artPath: '/assets/cards/art/horca-renegada.png',
    range: 1,
    movement: 0,
    artist: 'Archivo del Nexo',
    artistStyle: 'GÃ³tico sombrÃ­o'
  },
  'tumba-olvidada': {
    id: 'tumba-olvidada',
    name: 'Tumba Olvidada',
    faction: 'SOMBRA',
    type: 'ESTRUCTURA',
    subtype: 'Cripta',
    cost: { generic: 4 },
    rarity: 'RARA',
    rulesText: 'Al comienzo de tu turno, cura 1 de salud a una unidad de Sombra aliada.',
    flavorText: 'Sus puertas no se abren hacia dentro, sino hacia todos los nombres que el mundo prefiriÃ³ enterrar.',
    maxHealth: 5,
    cardNumber: 65,
    artPath: '/assets/cards/art/tumba-olvidada.png',
    range: 1,
    movement: 0,
    artist: 'Archivo del Nexo',
    artistStyle: 'Ruina encantada'
  },
  'zombi-infectado': {
    id: 'zombi-infectado',
    name: 'Zombi Infectado',
    faction: 'SOMBRA',
    type: 'UNIDAD',
    subtype: 'No-muerto',
    cost: { generic: 3 },
    rarity: 'COMUN',
    rulesText: 'Ãšltimo Aliento: Inflige 1 de daÃ±o a las unidades adyacentes.',
    flavorText: 'La plaga no lo mantiene vivo. Solo impide que la muerte termine su trabajo.',
    attack: 2,
    maxHealth: 4,
    cardNumber: 66,
    artPath: '/assets/cards/art/zombi-infectado.png',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Horror gÃ³tico'
  },
  'vampiro-noble': {
    id: 'vampiro-noble',
    name: 'Vampiro Noble',
    faction: 'SOMBRA',
    type: 'UNIDAD',
    subtype: 'Vampiro',
    cost: { generic: 4 },
    rarity: 'RARA',
    rulesText: 'Al daÃ±ar una unidad, cura 1 de salud a esta unidad.',
    flavorText: 'Su cortesÃ­a es impecable. Por eso sus vÃ­ctimas tardan tanto en comprender que ya han sido invitadas a morir.',
    attack: 3,
    maxHealth: 4,
    cardNumber: 67,
    artPath: '/assets/cards/art/vampiro-noble.png',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'Nobleza oscura'
  },
  'espora-venenosa': {
    id: 'espora-venenosa',
    name: 'Espora Venenosa',
    faction: 'NATURALEZA',
    type: 'HECHIZO',
    subtype: 'Espora',
    cost: { generic: 2 },
    rarity: 'COMUN',
    rulesText: 'Inflige 2 puntos de daÃ±o a una unidad seleccionada.',
    flavorText: 'El bosque no siempre ruge. A veces basta con respirar en el lugar equivocado.',
    cardNumber: 68,
    artPath: '/assets/cards/art/espora-venenosa.png',
    range: 3,
    movement: 0,
    artist: 'Archivo del Nexo',
    artistStyle: 'Bosque venenoso'
  },
  'totem-naturaleza': {
    id: 'totem-naturaleza',
    name: 'TÃ³tem de Naturaleza',
    faction: 'NATURALEZA',
    type: 'ESTRUCTURA',
    subtype: 'TÃ³tem',
    cost: { generic: 3 },
    rarity: 'RARA',
    rulesText: 'Tus unidades adyacentes ganan +1 de vida mÃ¡xima.',
    flavorText: 'Sus runas no fueron escritas: crecieron lentamente bajo la corteza hasta aprender a brillar.',
    maxHealth: 4,
    cardNumber: 69,
    artPath: '/assets/cards/art/totem-naturaleza.png',
    range: 1,
    movement: 0,
    artist: 'Archivo del Nexo',
    artistStyle: 'Naturaleza rÃºnica'
  },
  'centauro-guerrero': {
    id: 'centauro-guerrero',
    name: 'Centauro Guerrero',
    faction: 'NATURALEZA',
    type: 'UNIDAD',
    subtype: 'Centauro',
    cost: { generic: 3 },
    rarity: 'COMUN',
    rulesText: 'Movimiento Diagonal: Puede desplazarse y atacar diagonalmente.',
    flavorText: 'Donde otros ven maleza, Ã©l ve avenidas de guerra abiertas por el viento.',
    attack: 3,
    maxHealth: 3,
    cardNumber: 70,
    artPath: '/assets/cards/art/centauro-guerrero.png',
    range: 1,
    movement: 2,
    artist: 'Archivo del Nexo',
    artistStyle: 'Bosque guerrero'
  },
  'fauno-bosque': {
    id: 'fauno-bosque',
    name: 'Fauno del Bosque',
    faction: 'NATURALEZA',
    type: 'UNIDAD',
    subtype: 'Fauno',
    cost: { generic: 2 },
    rarity: 'COMUN',
    rulesText: 'Grito de Batalla: Cura 1 de salud a una unidad aliada adyacente.',
    flavorText: 'Su melodÃ­a hace que las setas despierten y que las heridas recuerden cÃ³mo cerrarse.',
    attack: 1,
    maxHealth: 3,
    cardNumber: 71,
    artPath: '/assets/cards/art/fauno-bosque.png',
    range: 1,
    movement: 1,
    artist: 'Archivo del Nexo',
    artistStyle: 'FantasÃ­a forestal'
  },
  'obelisco-estelar': {
    id: 'obelisco-estelar',
    name: 'Obelisco Estelar',
    faction: 'ARCANO',
    type: 'ESTRUCTURA',
    subtype: 'Obelisco',
    cost: { generic: 4, arcano: 1 },
    rarity: 'EPICA',
    rulesText: 'Al comienzo de tu turno, roba 1 carta si controlas una unidad adyacente.',
    flavorText: 'No apunta al cielo: es el cielo quien parece inclinarse para leerlo.',
    maxHealth: 5,
    cardNumber: 72,
    artPath: '/assets/cards/art/obelisco-estelar.png',
    range: 1,
    movement: 0,
    artist: 'Archivo del Nexo',
    artistStyle: 'Arcano estelar'
  },
  'obstaculo-lava': {
    id: 'obstaculo-lava',
    name: 'Cráter de Lava',
    faction: 'FURIA',
    type: 'ESTRUCTURA',
    subtype: 'Obstáculo',
    cost: { generic: 99 },
    rarity: 'COMUN',
    rulesText: 'Bloquea el paso. Puede destruirse para abrir una ruta.',
    flavorText: '«Una profunda grieta que expulsa vapores sulfúricos. Cruzarla es una muerte segura.»',
    maxHealth: 5,
    cardNumber: 0,
    artPath: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="100%" height="100%" fill="%232d0b0b"/><circle cx="100" cy="100" r="60" fill="%23ef4444" opacity="0.3" filter="blur(5px)"/><polygon points="70,50 130,50 140,150 60,150" fill="%237f1d1d" stroke="%23f59e0b" stroke-width="4"/><circle cx="100" cy="100" r="15" fill="%23f59e0b"/></svg>',
    range: 1,
    movement: 0,
    artist: 'Naturaleza del Nexo',
    artistStyle: 'Volcánico'
  },
  'obstaculo-pilar': {
    id: 'obstaculo-pilar',
    name: 'Pilar Rúnico',
    faction: 'FURIA',
    type: 'ESTRUCTURA',
    subtype: 'Obstáculo',
    cost: { generic: 99 },
    rarity: 'COMUN',
    rulesText: 'Bloquea el paso. Puede destruirse para abrir una ruta.',
    flavorText: '«Un monolito erigido en el centro del Nexo que canaliza energías magnéticas.»',
    maxHealth: 4,
    cardNumber: 0,
    artPath: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="100%" height="100%" fill="%230f172a"/><circle cx="100" cy="100" r="60" fill="%2306b6d4" opacity="0.3" filter="blur(5px)"/><rect x="75" y="40" width="50" height="120" fill="%231e293b" stroke="%233b82f6" stroke-width="4"/><path d="M 90 70 L 110 70 M 100 70 L 100 130" stroke="%2306b6d4" stroke-width="3"/></svg>',
    range: 1,
    movement: 0,
    artist: 'Constructores del Domo',
    artistStyle: 'Rúnico'
  },
  'obstaculo-risco': {
    id: 'obstaculo-risco',
    name: 'Risco Quebrado',
    faction: 'ORDEN',
    type: 'ESTRUCTURA',
    subtype: 'Obstáculo',
    cost: { generic: 99 },
    rarity: 'COMUN',
    rulesText: 'Bloquea el paso. Puede destruirse para abrir una ruta.',
    flavorText: 'Una cresta de piedra suspendida, erosionada por siglos de tormentas celestes.',
    maxHealth: 6,
    cardNumber: 0,
    artPath: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="100%" height="100%" fill="%231a2934"/><polygon points="20,165 72,38 112,125 151,54 184,165" fill="%23798e9a" stroke="%23c5d3da" stroke-width="4"/></svg>',
    range: 1,
    movement: 0,
    artist: 'Canteros del Santuario',
    artistStyle: 'Piedra Tallada'
  },
  'obstaculo-corriente': {
    id: 'obstaculo-corriente',
    name: 'Corriente Arcana',
    faction: 'ARCANO',
    type: 'ESTRUCTURA',
    subtype: 'Obstáculo',
    cost: { generic: 99 },
    rarity: 'COMUN',
    rulesText: 'Bloquea el paso. Puede disiparse con daño para abrir una ruta.',
    flavorText: 'Un cauce de energía viva que solo cede cuando su sello se fragmenta.',
    maxHealth: 3,
    cardNumber: 0,
    artPath: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="100%" height="100%" fill="%230b1b32"/><path d="M10 120 C45 65 70 170 105 95 S165 80 190 32" fill="none" stroke="%2354dfff" stroke-width="18"/><path d="M10 120 C45 65 70 170 105 95 S165 80 190 32" fill="none" stroke="%23d6fbff" stroke-width="4"/></svg>',
    range: 1,
    movement: 0,
    artist: 'Canalizadores del Domo',
    artistStyle: 'Flujo Rúnico'
  }
};

// ═══════════════════════════════════════════════════
// DYNAMIC SVG ILLUSTRATION GENERATOR FOR ALL 400 CARDS
// ═══════════════════════════════════════════════════
export function getSvgIllustration(card: {
  id: string;
  name: string;
  faction: string;
  type: string;
  subtype: string;
  rarity: string;
  artistStyle: string;
}): string {
  const isFuria = card.faction === 'FURIA';
  
  // 1. Color palette definitions based on faction and style
  const color1 = isFuria ? '#ef4444' : '#06b6d4';
  const color2 = isFuria ? '#7f1d1d' : '#0f172a';
  const color3 = isFuria ? '#f59e0b' : '#3b82f6';
  const colorAccent = isFuria ? '#fef08a' : '#e0f2fe';

  let bgGradient = `<linearGradient id="bgGrad_${card.id}" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${color2}" />
    <stop offset="100%" stop-color="${isFuria ? '#2b0909' : '#030712'}" />
  </linearGradient>`;

  let overlayGrad = `<radialGradient id="radialGrad_${card.id}" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="${color1}" stop-opacity="0.35" />
    <stop offset="100%" stop-color="${color2}" stop-opacity="0" />
  </radialGradient>`;

  let styleMarkup = '';
  const style = card.artistStyle;

  // 2. Render geometric artwork overlays based on artist styles
  if (style === 'Cyberpunk de Neón') {
    styleMarkup += `
      <pattern id="neonGrid_${card.id}" width="15" height="15" patternUnits="userSpaceOnUse">
        <path d="M 15 0 L 0 0 0 15" fill="none" stroke="${color1}" stroke-width="0.5" stroke-opacity="0.25"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#neonGrid_${card.id})" />
      <polygon points="100,30 40,150 160,150" fill="none" stroke="${color3}" stroke-width="1.5" stroke-opacity="0.4" />
      <polygon points="100,50 60,140 140,140" fill="none" stroke="${colorAccent}" stroke-width="1" stroke-opacity="0.3" />
    `;
  } else if (style === 'Mosaico de Cristal / Vidriera') {
    styleMarkup += `
      <g opacity="0.45" stroke="#111827" stroke-width="1.5">
        <polygon points="0,0 70,0 50,60" fill="${color1}" />
        <polygon points="70,0 200,0 120,70 50,60" fill="${color2}" />
        <polygon points="0,0 50,60 0,110" fill="${color3}" />
        <polygon points="50,60 120,70 90,130 30,120" fill="${colorAccent}" />
        <polygon points="120,70 200,0 200,90" fill="${color1}" />
        <polygon points="120,70 200,90 160,150 90,130" fill="${color3}" />
        <polygon points="0,110 50,60 30,120 0,180" fill="${color2}" />
        <polygon points="30,120 90,130 110,200 0,200 0,180" fill="${colorAccent}" />
        <polygon points="90,130 160,150 200,200 110,200" fill="${color1}" />
        <polygon points="160,150 200,90 200,200" fill="${color2}" />
      </g>
    `;
  } else if (style === 'Grabado Medieval en Madera') {
    styleMarkup += `
      <g opacity="0.25" stroke="#ffffff" stroke-width="0.8">
        <line x1="0" y1="10" x2="200" y2="210" />
        <line x1="0" y1="30" x2="200" y2="230" />
        <line x1="0" y1="50" x2="200" y2="250" />
        <line x1="0" y1="70" x2="200" y2="270" />
        <line x1="0" y1="-10" x2="200" y2="190" />
        <line x1="0" y1="-30" x2="200" y2="170" />
      </g>
      <rect x="5" y="5" width="190" height="190" fill="none" stroke="${colorAccent}" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="6,4" />
    `;
  } else if (style === 'Grabado Rúnico Metálico') {
    styleMarkup += `
      <rect width="100%" height="100%" fill="none" stroke="${colorAccent}" stroke-width="1" stroke-opacity="0.2" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="${colorAccent}" stroke-width="1.2" stroke-opacity="0.25" stroke-dasharray="10,5" />
      <path d="M 85 85 L 100 70 L 115 85 M 100 70 L 100 115 M 85 100 L 115 100" fill="none" stroke="${colorAccent}" stroke-width="2" stroke-opacity="0.6" />
      <path d="M 80 120 L 100 135 L 120 120" fill="none" stroke="${color3}" stroke-width="1.5" stroke-opacity="0.5" />
    `;
  } else if (style === 'Acuarela Mística') {
    styleMarkup += `
      <circle cx="70" cy="80" r="55" fill="${color1}" opacity="0.35" filter="blur(10px)" />
      <circle cx="130" cy="110" r="45" fill="${color3}" opacity="0.3" filter="blur(8px)" />
      <circle cx="100" cy="60" r="35" fill="${colorAccent}" opacity="0.25" filter="blur(6px)" />
    `;
  } else if (style === 'Boceto a Carbón / Sketch') {
    styleMarkup += `
      <path d="M 10,20 Q 80,180 190,40" fill="none" stroke="#fff" stroke-width="1.5" stroke-opacity="0.25" />
      <path d="M 30,180 Q 120,30 170,160" fill="none" stroke="#fff" stroke-width="1" stroke-opacity="0.2" />
      <path d="M 5,90 L 195,110" fill="none" stroke="${color1}" stroke-width="1" stroke-opacity="0.15" />
    `;
  } else {
    styleMarkup += `
      <circle cx="100" cy="100" r="60" fill="none" stroke="${color1}" stroke-width="1.5" stroke-opacity="0.3" />
      <circle cx="100" cy="100" r="45" fill="none" stroke="${color3}" stroke-width="1" stroke-opacity="0.25" />
      <circle cx="100" cy="100" r="30" fill="none" stroke="${colorAccent}" stroke-width="1" stroke-opacity="0.2" stroke-dasharray="4,3" />
    `;
  }

  // 3. Central Icon depending on Card Type
  let iconMarkup = '';
  if (card.type === 'UNIDAD') {
    iconMarkup = `
      <g stroke="${colorAccent}" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(75, 75) scale(0.4)">
        <path d="M 25 5 L 45 12 L 45 35 C 45 47 25 55 25 55 C 25 55 5 47 5 35 L 5 12 Z" stroke="${colorAccent}" stroke-width="4" />
        <path d="M 25 12 L 25 47" stroke="${colorAccent}" stroke-width="3" />
        <circle cx="25" cy="30" r="7" fill="${color1}" stroke="none" />
      </g>
    `;
  } else if (card.type === 'ESTRUCTURA') {
    iconMarkup = `
      <g stroke="${colorAccent}" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(75, 72) scale(0.4)">
        <polygon points="25,5 45,20 40,55 10,55 5,20" stroke="${colorAccent}" stroke-width="4" fill="${color2}" />
        <rect x="21" y="25" width="8" height="15" stroke="${color3}" stroke-width="3" />
        <line x1="25" y1="5" x2="25" y2="55" stroke="${colorAccent}" stroke-width="2" stroke-opacity="0.5" />
      </g>
    `;
  } else if (card.type === 'HECHIZO') {
    iconMarkup = `
      <g stroke="${colorAccent}" fill="none" stroke-linecap="round" transform="translate(75, 75) scale(0.4)">
        <path d="M 25 5 C 10 25, 40 25, 25 45 C 10 25, 40 25, 25 5 Z" stroke="${colorAccent}" stroke-width="4" fill="url(#radialGrad_${card.id})" />
        <circle cx="25" cy="25" r="6" fill="${colorAccent}" stroke="none" />
        <path d="M 10 25 L 40 25 M 25 10 L 25 40" stroke="${colorAccent}" stroke-dasharray="2,2" stroke-width="2" />
      </g>
    `;
  } else {
    iconMarkup = `
      <g stroke="${colorAccent}" fill="none" transform="translate(75, 75) scale(0.4)">
        <polygon points="25,7 42,25 25,43 8,25" stroke="${colorAccent}" stroke-width="4" />
        <polygon points="25,14 36,25 25,36 14,25" stroke="${color3}" stroke-width="2.5" fill="${color1}" fill-opacity="0.3" />
      </g>
    `;
  }

  // 4. Build complete SVG and pack into Data URL
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <defs>
      ${bgGradient}
      ${overlayGrad}
    </defs>
    <rect width="100%" height="100%" fill="url(#bgGrad_${card.id})" />
    <rect width="100%" height="100%" fill="url(#radialGrad_${card.id})" />
    ${styleMarkup}
    ${iconMarkup}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ═══════════════════════════════════════════════════
// PROGRAMMATIC CARD GENERATION (TO REACH 400 UNIQUE CARDS)
// ═══════════════════════════════════════════════════
function generateRemainingCards() {
  const rarities = ['COMUN', 'RARA', 'EPICA', 'LEGENDARIA'] as const;
  const cardTypes = ['UNIDAD', 'ESTRUCTURA', 'HECHIZO'] as const;
  const styles = [
    'Fantasía Oscura Digital', 'Pintura al Óleo', 'Boceto a Carbón / Sketch',
    'Acuarela Mística', 'Grabado Medieval en Madera', 'Cyberpunk de Neón',
    'Anime Ilustrado a Mano', 'Mosaico de Cristal / Vidriera', 'Fantasía Épica Clásica',
    'Grabado Rúnico Metálico'
  ];
  const artists = [
    'Ignis Fatuus', 'Kaelen Vane', 'Brutus Clay', 'Elysia Thorne',
    'Valerius', 'Vectoria Spark', 'Haruto Sato', 'Vitreus Art',
    'Elena Petrova', 'Rune Carver'
  ];

  // Furia (Ignis) vocabulary
  const furiaNounsUnits = ['Guerrero', 'Devastador', 'Campeón', 'Cazador', 'Bestia', 'Elemental', 'Can', 'Minotauro', 'Trasgo', 'Fénix', 'Grifo', 'Basilisco', 'Quimera', 'Gigante', 'Titán', 'Golem', 'Defensor', 'Asolador', 'Cenizo'];
  const furiaNounsStructs = ['Forja', 'Altar', 'Muralla', 'Portal', 'Torre', 'Bastión', 'Baluarte', 'Cráter', 'Núcleo'];
  const furiaNounsSpells = ['Llama', 'Erupción', 'Lluvia', 'Chispa', 'Impulso', 'Ignición', 'Calcinación', 'Explosión', 'Cataclismo', 'Fuego', 'Ráfaga', 'Tormento'];
  const furiaAdjectives = ['Carmesí', 'Ígneo', 'Volcánico', 'de Ceniza', 'de Lava', 'Quemante', 'del Caos', 'Devastador', 'de Brasa', 'Piroclástico', 'de Fundición', 'del Nexo', 'Asolador', 'Infernal', 'del Magma', 'Colosal', 'Eterno'];

  // Arcano (Aethelgard) vocabulary
  const arcanoNounsUnits = ['Mago', 'Aprendiz', 'Tejedora', 'Elemental', 'Búho', 'Centinela', 'Guardián', 'Archimago', 'Sabio', 'Clérigo', 'Druida', 'Golem', 'Espíritu', 'Sombra', 'Aparición', 'Espectro', 'Esfinge'];
  const arcanoNounsStructs = ['Templo', 'Torre', 'Barrera', 'Portal', 'Prisma', 'Santuario', 'Monolito', 'Obelisco', 'Biblioteca'];
  const arcanoNounsSpells = ['Prisión', 'Vórtice', 'Cometa', 'Tormenta', 'Congelación', 'Destello', 'Ventisca', 'Runa', 'Hechizo', 'Ráfaga', 'Ilusión', 'Vacío'];
  const arcanoAdjectives = ['Glaciar', 'Celestial', 'del Cosmos', 'Rúnico', 'Estelar', 'Escarchado', 'Glacial', 'de Hielo', 'de Maná', 'Temporal', 'del Nexo', 'Sagrado', 'Espectral', 'del Vacío', 'Silencioso', 'Cristalino', 'Eterno'];

  // Naturaleza vocabulary
  const naturalezaNounsUnits = ['Elfo', 'Bestia', 'Lobo', 'Fauno', 'Ciervo', 'Oso', 'Ninfa', 'Arbusto', 'Guía', 'Dríada', 'Centauro', 'Lémur', 'Árbol', 'Tejón', 'Águila'];
  const naturalezaNounsStructs = ['Arboleda', 'Nido', 'Raíz', 'Santuario', 'Bosque', 'Tótem', 'Invernadero'];
  const naturalezaNounsSpells = ['Crecimiento', 'Sanación', 'Semilla', 'Polen', 'Espora', 'Abrazo', 'Florescencia', 'Liana', 'Ciclo'];
  const naturalezaAdjectives = ['Luminoso', 'Salvaje', 'Ancestral', 'Espiritual', 'Verde', 'Floreciente', 'Humedecido', 'Primaveral', 'del Bosque', 'Silvestre', 'Espeso'];

  // Sombra vocabulary
  const sombraNounsUnits = ['Espectro', 'Sombra', 'Orco', 'Renegado', 'Nigromante', 'Vampiro', 'Necrófago', 'Esqueleto', 'Zombi', 'Demonio', 'Parca', 'Verdugo', 'Murciélago'];
  const sombraNounsStructs = ['Tumba', 'Cripta', 'Mausoleo', 'Abismo', 'Fosa', 'Mazmorra', 'Guillotina'];
  const sombraNounsSpells = ['Maldición', 'Oscuridad', 'Drenaje', 'Corrupción', 'Plaga', 'Pesadilla', 'Sacrificio', 'Marchitez', 'Olvido'];
  const sombraAdjectives = ['Umbrío', 'Siniestro', 'Mortal', 'Corrupto', 'Espectral', 'Oscuro', 'No-Muerto', 'Vampírico', 'de la Cripta', 'Fúnebre', 'Renegado'];

  // Vacío vocabulary
  const vacioNounsUnits = ['Horror', 'Engendro', 'Devorador', 'Parásito', 'Leviatán', 'Mutante', 'Desgarrador', 'Paradoja', 'Sombra', 'Enigma'];
  const vacioNounsStructs = ['Falla', 'Grieta', 'Domo', 'Vacío', 'Portal', 'Singularidad'];
  const vacioNounsSpells = ['Aniquilación', 'Consunción', 'Distorsión', 'Vacío', 'Desintegración', 'Agujero', 'Succión'];
  const vacioAdjectives = ['del Vacío', 'Abisal', 'Silencioso', 'Desolador', 'Vacante', 'Inexistente', 'Negro', 'Entrópico', 'Paralizante'];

  // Orden (Air & Light) vocabulary
  const ordenNounsUnits = ['Caballero', 'Ángel', 'Paladín', 'Clérigo', 'Grifo', 'Águila', 'Centinela', 'Inquisidor', 'Sacerdote', 'Halcón', 'Pegaso'];
  const ordenNounsStructs = ['Catedral', 'Fortaleza', 'Monumento', 'Castillo', 'Altar', 'Faro'];
  const ordenNounsSpells = ['Juicio', 'Bendición', 'Justicia', 'Orden', 'Ascensión', 'Destello', 'Castigo', 'Soplido'];
  const ordenAdjectives = ['Sagrado', 'Celestial', 'del Aire', 'Brillante', 'Justo', 'Puro', 'Glorioso', 'del Alba', 'Solar', 'Divino', 'Eólico'];

  const getSubtype = (type: string, noun: string) => {
    if (type === 'ESTRUCTURA') return 'Edificio';
    if (type === 'HECHIZO') return 'Magia';
    if (['Trasgo', 'Trasgos', 'Orco', 'Orcos'].includes(noun)) return 'Guerrero';
    if (['Dragón', 'Draco'].includes(noun)) return 'Dragón';
    if (['Elemental', 'Bestia', 'Minotauro', 'Basilisco', 'Quimera', 'Fénix', 'Grifo', 'Búho', 'Lobo', 'Oso', 'Ciervo', 'Grifo', 'Pegaso', 'Halcón', 'Águila'].includes(noun)) return noun;
    return 'Guerrero';
  };

  const factions: Faction[] = ['FURIA', 'ARCANO', 'NATURALEZA', 'ORDEN', 'SOMBRA', 'VACIO'];

  // Generate the remaining unique cards to reach 400 after the curated additions.
  for (let i = 73; i <= 400; i++) {
    const faction = factions[i % factions.length];
    const type = cardTypes[(i + 1) % cardTypes.length];
    const rarity = rarities[i % rarities.length];

    let name = '';
    let noun = '';
    let adj = '';

    if (faction === 'FURIA') {
      adj = furiaAdjectives[(i * 3) % furiaAdjectives.length];
      if (type === 'UNIDAD') {
        noun = furiaNounsUnits[(i * 7) % furiaNounsUnits.length];
      } else if (type === 'ESTRUCTURA') {
        noun = furiaNounsStructs[(i * 7) % furiaNounsStructs.length];
      } else {
        noun = furiaNounsSpells[(i * 7) % furiaNounsSpells.length];
      }
      name = `${noun} ${adj}`;
    } else if (faction === 'ARCANO') {
      adj = arcanoAdjectives[(i * 3) % arcanoAdjectives.length];
      if (type === 'UNIDAD') {
        noun = arcanoNounsUnits[(i * 7) % arcanoNounsUnits.length];
      } else if (type === 'ESTRUCTURA') {
        noun = arcanoNounsStructs[(i * 7) % arcanoNounsStructs.length];
      } else {
        noun = arcanoNounsSpells[(i * 7) % arcanoNounsSpells.length];
      }
      name = `${noun} ${adj}`;
    } else if (faction === 'NATURALEZA') {
      adj = naturalezaAdjectives[(i * 3) % naturalezaAdjectives.length];
      if (type === 'UNIDAD') {
        noun = naturalezaNounsUnits[(i * 7) % naturalezaNounsUnits.length];
      } else if (type === 'ESTRUCTURA') {
        noun = naturalezaNounsStructs[(i * 7) % naturalezaNounsStructs.length];
      } else {
        noun = naturalezaNounsSpells[(i * 7) % naturalezaNounsSpells.length];
      }
      name = `${noun} ${adj}`;
    } else if (faction === 'SOMBRA') {
      adj = sombraAdjectives[(i * 3) % sombraAdjectives.length];
      if (type === 'UNIDAD') {
        noun = sombraNounsUnits[(i * 7) % sombraNounsUnits.length];
      } else if (type === 'ESTRUCTURA') {
        noun = sombraNounsStructs[(i * 7) % sombraNounsStructs.length];
      } else {
        noun = sombraNounsSpells[(i * 7) % sombraNounsSpells.length];
      }
      name = `${noun} ${adj}`;
    } else if (faction === 'VACIO') {
      adj = vacioAdjectives[(i * 3) % vacioAdjectives.length];
      if (type === 'UNIDAD') {
        noun = vacioNounsUnits[(i * 7) % vacioNounsUnits.length];
      } else if (type === 'ESTRUCTURA') {
        noun = vacioNounsStructs[(i * 7) % vacioNounsStructs.length];
      } else {
        noun = vacioNounsSpells[(i * 7) % vacioNounsSpells.length];
      }
      name = `${noun} ${adj}`;
    } else { // ORDEN
      adj = ordenAdjectives[(i * 3) % ordenAdjectives.length];
      if (type === 'UNIDAD') {
        noun = ordenNounsUnits[(i * 7) % ordenNounsUnits.length];
      } else if (type === 'ESTRUCTURA') {
        noun = ordenNounsStructs[(i * 7) % ordenNounsStructs.length];
      } else {
        noun = ordenNounsSpells[(i * 7) % ordenNounsSpells.length];
      }
      name = `${noun} ${adj}`;
    }

    const totalCost = (i % 6) + 1; // 1 to 6
    let cost: any;
    if (faction === 'FURIA') {
      const factionCost = Math.min(totalCost, (i % 2) + 1);
      cost = { generic: totalCost - factionCost, furia: factionCost };
    } else if (faction === 'ARCANO') {
      const factionCost = Math.min(totalCost, (i % 2) + 1);
      cost = { generic: totalCost - factionCost, arcano: factionCost };
    } else {
      cost = { generic: totalCost };
    }

    let attack: number | undefined;
    let maxHealth: number | undefined;
    let range: number | undefined;
    let movement: number | undefined;

    if (type === 'UNIDAD') {
      attack = Math.max(1, Math.round(totalCost * 0.8 + (i % 2)));
      maxHealth = Math.max(1, Math.round(totalCost * 1.1 - (i % 2)));
      range = totalCost > 3 && i % 3 === 0 ? 2 : 1;
      movement = i % 2 === 0 ? 1 : 2;
    } else if (type === 'ESTRUCTURA') {
      maxHealth = Math.max(2, totalCost * 2);
      range = 1;
      movement = 0;
    } else {
      range = 3;
      movement = 0;
    }

    let rulesText = '';
    if (type === 'UNIDAD') {
      const rules = [
        'Carga (Puede moverse y atacar inmediatamente al ser invocado).',
        'Grito de Batalla: Inflige 1 de daño a una unidad adyacente.',
        'Último Aliento: Otorga +1 de ataque a tus aliados adyacentes.',
        'Escudo Divino (Ignora el primer daño recibido).',
        'Fin de turno: Se inflige 1 punto de daño a sí mismo.',
        'Inmune a Hechizos.',
        'Movimiento Diagonal.',
        'Esta criatura puede atacar dos veces por turno.'
      ];
      rulesText = rules[i % rules.length];
    } else if (type === 'ESTRUCTURA') {
      const rules = [
        'Fin del turno: Cura 1 de salud al Comandante aliado.',
        'Tus unidades en la misma fila ganan +1 de ataque.',
        'Tus unidades adyacentes ganan +2 de vida máxima.',
        'Las unidades enemigas adyacentes tienen -1 de movimiento.',
        'Al comienzo de tu turno, genera 1 fuente de maná temporal.'
      ];
      rulesText = rules[i % rules.length];
    } else {
      const rules = [
        'Inflige 2 puntos de daño a la unidad seleccionada.',
        'Congela a una unidad enemiga por 1 turno y roba 1 carta.',
        'Regresa una criatura aliada o enemiga a la mano de su dueño.',
        'Otorga +2/+2 a una unidad aliada elegida.',
        'Daño masivo: Inflige 1 de daño a todas las unidades en juego.'
      ];
      rulesText = rules[i % rules.length];
    }

    const artist = artists[(i * 3) % artists.length];
    const artistStyle = styles[(i * 7) % styles.length];
    const id = `gen-${faction.toLowerCase()}-${i}`;
    
    // Dynamically generate the SVG illustration for this specific card
    let artPath = getSvgIllustration({ id, name, faction, type, subtype: getSubtype(type, noun), rarity, artistStyle });

    // Override with high-fidelity generated assets if names match
    if (name === 'Mago Celestial' || name === 'Mago Rúnico') {
      artPath = '/assets/cards/art/mago-celestial.webp';
    } else if (name === 'Guerrero Carmesí' || name === 'Guerrero Ígneo') {
      artPath = '/assets/cards/art/guerrero-igneo.webp';
    } else if (name.includes('Guardián Escarchado') || name.includes('Guardián Glacial')) {
      artPath = '/assets/cards/art/guardian-escarchado.webp';
    } else if (name.includes('Titán Infernal') || name.includes('Titán Volcánico')) {
      artPath = '/assets/cards/art/titan-infernal.webp';
    } else if (name.includes('Dragón') || name.includes('Draco')) {
      artPath = '/assets/cards/art/dragon-escarcha.webp';
    } else if (name.includes('Nigromante')) {
      artPath = '/assets/cards/art/nigromante-oscuro.webp';
    } else if (name.includes('Elfo') || name.includes('Dríada')) {
      artPath = '/assets/cards/art/elfo-ancestral.webp';
    } else if (name.includes('Vampiro')) {
      artPath = '/assets/cards/art/vampiro-noble.png';
    } else if (name.includes('Paladín') || name.includes('Caballero')) {
      artPath = '/assets/cards/art/paladin-glorioso.webp';
    } else if (name.includes('Ángel')) {
      artPath = '/assets/cards/art/angel-celestial.webp';
    } else if (name.includes('Horror') || name.includes('Engendro') || name.includes('Devorador')) {
      artPath = '/assets/cards/art/horror-abisal.webp';
    } else if (name.includes('Lobo')) {
      artPath = '/assets/cards/art/lobo-salvaje.webp';
    } else if (name.includes('Minotauro')) {
      artPath = '/assets/cards/art/minotauro-brasa.png';
    } else if (name.includes('Centauro')) {
      artPath = '/assets/cards/art/centauro-guerrero.png';
    } else if (name.includes('Fauno')) {
      artPath = '/assets/cards/art/fauno-bosque.png';
    } else if (name.includes('Falla') || name.includes('Grieta')) {
      artPath = '/assets/cards/art/falla-vacio.webp';
    } else if (name.includes('Monumento')) {
      artPath = '/assets/cards/art/monumento-sagrado.webp';
    } else if (name.includes('Tumba')) {
      artPath = '/assets/cards/art/tumba-olvidada.png';
    } else if (name.includes('Cripta')) {
      artPath = '/assets/cards/art/cripta-mortal.webp';
    } else if (name.includes('TÃ³tem') || name.includes('Totem')) {
      artPath = '/assets/cards/art/totem-naturaleza.png';
    } else if (name.includes('Arboleda') || name.includes('Bosque')) {
      artPath = '/assets/cards/art/arboleda-sagrada.webp';
    } else if (name.includes('Quimera')) {
      artPath = '/assets/cards/art/quimera-caos.webp';
    } else if (name.includes('Maldición')) {
      artPath = '/assets/cards/art/maldicion-sombra.webp';
    } else if (name.includes('Crecimiento')) {
      artPath = '/assets/cards/art/crecimiento-salvaje.webp';
    } else if (name.includes('Aniquilación')) {
      artPath = '/assets/cards/art/aniquilacion-vacio.webp';
    } else if (name.includes('Juicio')) {
      artPath = '/assets/cards/art/juicio-divino.webp';
    } else if (name.includes('Gigante') || name.includes('Asolador')) {
      artPath = '/assets/cards/art/gigante-magma.webp';
    } else if (name.includes('Golem')) {
      artPath = '/assets/cards/art/golem-piedra.png';
    } else if (name.includes('Espectro') || name.includes('Sombra')) {
      artPath = '/assets/cards/art/espectro-siniestro.webp';
    } else if (name.includes('Guillotina')) {
      artPath = '/assets/cards/art/horca-renegada.png';
    } else if (name.includes('Renegado') || name.includes('Esclavo')) {
      artPath = '/assets/cards/art/renegado-oscuro.webp';
    } else if (name.includes('Basilisco')) {
      artPath = '/assets/cards/art/basilisco-caos.webp';
    } else if (name.includes('Pesadilla')) {
      artPath = '/assets/cards/art/pesadilla-mortal.webp';
    } else if (name.includes('Santuario')) {
      artPath = '/assets/cards/art/santuario-sagrado.webp';
    } else if (name.includes('Paradoja')) {
      artPath = '/assets/cards/art/paradoja-vacio.webp';
    } else if (name.includes('Oso')) {
      artPath = '/assets/cards/art/oso-forestal.webp';
    } else if (name.includes('Ciervo')) {
      artPath = '/assets/cards/art/ciervo-sagrado.webp';
    } else if (name.includes('Águila')) {
      artPath = '/assets/cards/art/aguila-celestial.webp';
    } else if (name.includes('Esqueleto')) {
      artPath = '/assets/cards/art/esqueleto-guerrero.webp';
    } else if (name.includes('Zombi') || name.includes('Necrófago')) {
      artPath = '/assets/cards/art/zombi-infectado.png';
    } else if (name.includes('Demonio')) {
      artPath = '/assets/cards/art/demonio-infernal.webp';
    } else if (name.includes('Murciélago')) {
      artPath = '/assets/cards/art/murcielago-sombra.webp';
    } else if (name.includes('Parásito')) {
      artPath = '/assets/cards/art/parasito-vacio.webp';
    } else if (name.includes('Leviatán')) {
      artPath = '/assets/cards/art/leviatan-abisal.webp';
    } else if (name.includes('Grifo')) {
      artPath = '/assets/cards/art/grifo-orden.webp';
    } else if (name.includes('Pegaso')) {
      artPath = '/assets/cards/art/pegaso-celestial.webp';
    } else if (name.includes('Clérigo') || name.includes('Sacerdote')) {
      artPath = '/assets/cards/art/clerigo-luz.webp';
    } else if (name.includes('Comandante') || name.includes('Jefe') || name.includes('Cacique')) {
      artPath = '/assets/cards/art/cacique-orco.png';
    } else if (name.includes('Orco')) {
      artPath = '/assets/cards/art/orco-guerrero.webp';
    } else if (name.includes('Obelisco')) {
      artPath = '/assets/cards/art/obelisco-estelar.png';
    } else if (name.includes('Espora')) {
      artPath = '/assets/cards/art/espora-venenosa.png';
    } else if (name.includes('Biblioteca') || name.includes('Archivo') || name.includes('Monolito')) {
      artPath = '/assets/cards/art/biblioteca-runica.webp';
    }

    CARDS_DB[id] = {
      id,
      name,
      faction,
      type,
      subtype: getSubtype(type, noun),
      cost,
      rarity,
      rulesText,
      flavorText: `«En los anales del Nexo, la leyenda de esta carta relata cómo el destino del mundo cambió debido a su poder.» — Crónicas del Nexo, Vol. ${i}`,
      cardNumber: i,
      artPath,
      range,
      movement,
      artist,
      artistStyle,
      ...(attack !== undefined ? { attack } : {}),
      ...(maxHealth !== undefined ? { maxHealth } : {}),
    };
  }
}

// Generate the remaining 360 cards immediately
generateRemainingCards();

export function getPreconstructedDeck(factionOrTheme: string): Card[] {
  const deck: Card[] = [];
  const addFromPool = (preferredPool: Card[], fallbackPool: Card[], count: number) => {
    const pool = preferredPool.length > 0 ? preferredPool : fallbackPool;
    if (pool.length === 0) {
      throw new Error(`No hay cartas disponibles para completar el mazo ${factionOrTheme}.`);
    }

    for (let i = 0; i < count; i++) {
      deck.push({ ...pool[i % pool.length] });
    }
  };
  
  if (factionOrTheme === 'MAZO_VACIO') {
    // 10 Furia, 10 Arcano
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const vacioCards = Object.values(CARDS_DB).filter(c => c.faction === 'VACIO');
    for (let i = 0; i < 30; i++) {
      const card = vacioCards[i % vacioCards.length];
      deck.push({ ...card });
    }
  } else if (factionOrTheme === 'MAZO_ORDEN') {
    // 10 Furia, 10 Arcano
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const ordenCards = Object.values(CARDS_DB).filter(c => c.faction === 'ORDEN');
    for (let i = 0; i < 30; i++) {
      const card = ordenCards[i % ordenCards.length];
      deck.push({ ...card });
    }
  } else if (factionOrTheme === 'MAZO_ULTIMO_ALIENTO') {
    // 10 Furia, 10 Arcano
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const deathCards = Object.values(CARDS_DB).filter(c => 
      c.id === 'fenix-renacido' ||
      c.rulesText.includes('Último Aliento') ||
      c.rulesText.includes('muerte') ||
      c.rulesText.includes('Morir') ||
      c.rulesText.includes('morir')
    );
    for (let i = 0; i < 30; i++) {
      const card = deathCards[i % deathCards.length];
      deck.push({ ...card });
    }
  } else if (factionOrTheme === 'MAZO_DOBLE_ATAQUE') {
    // 10 Furia, 10 Arcano
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const attackCards = Object.values(CARDS_DB).filter(c => 
      c.rulesText.includes('dos veces') ||
      c.rulesText.includes('Carga') ||
      c.id === 'furia-nexo' ||
      c.id === 'impetu-fuego'
    );
    for (let i = 0; i < 30; i++) {
      const card = attackCards[i % attackCards.length];
      deck.push({ ...card });
    }
  } else if (factionOrTheme === 'MAZO_FORESTAL_CONTROL') {
    // 10 Furia, 10 Arcano
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const forestControlCards = Object.values(CARDS_DB).filter(c => 
      c.faction === 'NATURALEZA' && 
      (c.type === 'ESTRUCTURA' || c.rulesText.includes('Cura') || c.rulesText.includes('vida'))
    );
    const fallbackForestControl = Object.values(CARDS_DB).filter(c =>
      c.faction === 'NATURALEZA' && c.type !== 'MANA'
    );
    addFromPool(forestControlCards, fallbackForestControl, 30);
  } else if (factionOrTheme === 'MAZO_SOMBRA') {
    // 10 Furia, 10 Arcano
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const sombraCards = Object.values(CARDS_DB).filter(c => c.faction === 'SOMBRA');
    for (let i = 0; i < 30; i++) {
      const card = sombraCards[i % sombraCards.length];
      deck.push({ ...card });
    }
  } else if (factionOrTheme === 'MAZO_NATURALEZA') {
    // 10 Furia, 10 Arcano
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const natCards = Object.values(CARDS_DB).filter(c => c.faction === 'NATURALEZA');
    for (let i = 0; i < 30; i++) {
      const card = natCards[i % natCards.length];
      deck.push({ ...card });
    }
  } else if (factionOrTheme === 'MAZO_CELESTIAL') {
    // 10 Furia, 10 Arcano
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const celestialCards = Object.values(CARDS_DB).filter(c => 
      c.faction === 'ORDEN' || 
      c.id === 'buho-runico' || 
      c.name.includes('Celestial') || 
      c.name.includes('Grifo') || 
      c.name.includes('Ángel') ||
      c.name.includes('Fénix')
    );
    for (let i = 0; i < 30; i++) {
      const card = celestialCards[i % celestialCards.length];
      deck.push({ ...card });
    }
  } else if (factionOrTheme === 'MAZO_ACUATICO') {
    // 10 Furia, 10 Arcano
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const waterCards = Object.values(CARDS_DB).filter(c => 
      c.name.includes('Glaciar') || 
      c.name.includes('Glacial') || 
      c.name.includes('Hielo') || 
      c.name.includes('Acuático') || 
      c.name.includes('Abisal') ||
      c.id === 'golem-glaciar' ||
      c.id === 'barrera-hielo' ||
      c.id === 'prision-glacial'
    );
    for (let i = 0; i < 30; i++) {
      const card = waterCards[i % waterCards.length];
      deck.push({ ...card });
    }
  } else if (factionOrTheme === 'MAZO_RENEGADOS') {
    // 10 Furia, 10 Arcano
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const renegadeCards = Object.values(CARDS_DB).filter(c => 
      c.id === 'trasgo-piroclastico' || 
      c.id === 'chispa-fugaz' || 
      c.rulesText.includes('descarte') || 
      c.rulesText.includes('Descarte') || 
      c.rulesText.includes('sí mismo') || 
      c.name.includes('Renegado') ||
      c.name.includes('Esclavo') ||
      c.name.includes('Espectro')
    );
    for (let i = 0; i < 30; i++) {
      const card = renegadeCards[i % renegadeCards.length];
      deck.push({ ...card });
    }
  } else if (factionOrTheme === 'MAZO_ORCOS_BESTIAS') {
    // 10 Furia, 10 Arcano
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const orcBeastCards = Object.values(CARDS_DB).filter(c => 
      c.subtype === 'Bestia' || 
      c.name.includes('Orco') || 
      c.name.includes('Bestia') || 
      c.name.includes('Minotauro') ||
      c.id === 'sabueso-brasa' ||
      c.id === 'draco-magma'
    );
    for (let i = 0; i < 30; i++) {
      const card = orcBeastCards[i % orcBeastCards.length];
      deck.push({ ...card });
    }
  } else if (factionOrTheme === 'NEXO_HIBRIDO') {
    // 10 Furia Mana, 10 Arcano Mana
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const base = [
      { id: 'sabueso-brasa', count: 3 },
      { id: 'berserker-ignivoro', count: 2 },
      { id: 'dragon-caldera', count: 1 },
      { id: 'lluvia-ceniza', count: 2 },
      { id: 'guerrero-ceniza', count: 3 },
      { id: 'draco-magma', count: 2 },
      { id: 'trasgo-piroclastico', count: 2 },
      { id: 'centinela-cristal', count: 3 },
      { id: 'tejedora-escarcha', count: 2 },
      { id: 'prision-glacial', count: 2 },
      { id: 'cometa-arcano', count: 2 },
      { id: 'buho-runico', count: 2 },
      { id: 'mago-runa-helada', count: 2 },
      { id: 'tejedora-tiempo', count: 2 }
    ];
    base.forEach(item => {
      for (let i = 0; i < item.count; i++) deck.push({ ...CARDS_DB[item.id] });
    });
  } else if (factionOrTheme === 'BARAJA_BESTIAS') {
    // 10 Furia Mana, 10 Arcano Mana
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const base = [
      { id: 'sabueso-brasa', count: 4 },
      { id: 'buho-runico', count: 4 },
      { id: 'draco-magma', count: 4 },
      { id: 'dragon-caldera', count: 2 },
      { id: 'elemental-lava', count: 4 },
      { id: 'elemental-tormenta', count: 4 },
      { id: 'chispa-fugaz', count: 4 },
      { id: 'congelacion-rapida', count: 4 }
    ];
    base.forEach(item => {
      for (let i = 0; i < item.count; i++) deck.push({ ...CARDS_DB[item.id] });
    });
  } else if (factionOrTheme === 'FORTALEZA_RUNICA') {
    // 10 Furia Mana, 10 Arcano Mana
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    for (let i = 0; i < 10; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const base = [
      { id: 'forja-carmesi', count: 4 },
      { id: 'torre-horizonte', count: 4 },
      { id: 'templo-runico', count: 4 },
      { id: 'muro-pomez', count: 4 },
      { id: 'golem-fundicion', count: 3 },
      { id: 'golem-glaciar', count: 3 },
      { id: 'centinela-cristal', count: 4 },
      { id: 'prision-glacial', count: 4 }
    ];
    base.forEach(item => {
      for (let i = 0; i < item.count; i++) deck.push({ ...CARDS_DB[item.id] });
    });
  } else if (factionOrTheme === 'FURIA_AGRO') {
    // 18 Furia Mana
    for (let i = 0; i < 18; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    const base = [
      { id: 'sabueso-brasa', count: 4 },
      { id: 'berserker-ignivoro', count: 4 },
      { id: 'guerrero-ceniza', count: 4 },
      { id: 'trasgo-piroclastico', count: 4 },
    ];
    base.forEach(item => {
      for (let i = 0; i < item.count; i++) deck.push({ ...CARDS_DB[item.id] });
    });
    // Fill with generated low-cost Furia cards
    const genFuriaAgro = Object.values(CARDS_DB).filter(c => 
      c.id.startsWith('gen-furia-') && 
      c.type === 'UNIDAD' && 
      ((c.cost.generic || 0) + (c.cost.furia || 0)) <= 3
    );
    const fallbackFuriaAgro = Object.values(CARDS_DB).filter(c =>
      c.faction === 'FURIA' &&
      c.type === 'UNIDAD' &&
      ((c.cost.generic || 0) + (c.cost.furia || 0)) <= 3
    );
    addFromPool(genFuriaAgro, fallbackFuriaAgro, 16);
  } else if (factionOrTheme === 'FURIA_CONTROL') {
    // 22 Furia Mana
    for (let i = 0; i < 22; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    const base = [
      { id: 'dragon-caldera', count: 2 },
      { id: 'golem-fundicion', count: 3 },
      { id: 'draco-magma', count: 3 },
      { id: 'muro-pomez', count: 2 },
      { id: 'lluvia-ceniza', count: 2 },
    ];
    base.forEach(item => {
      for (let i = 0; i < item.count; i++) deck.push({ ...CARDS_DB[item.id] });
    });
    // Fill with generated heavy Furia cards
    const genFuriaHeavy = Object.values(CARDS_DB).filter(c => 
      c.id.startsWith('gen-furia-') && 
      ((c.cost.generic || 0) + (c.cost.furia || 0)) >= 4
    );
    const fallbackFuriaHeavy = Object.values(CARDS_DB).filter(c =>
      c.faction === 'FURIA' &&
      c.type !== 'MANA' &&
      ((c.cost.generic || 0) + (c.cost.furia || 0)) >= 4
    );
    addFromPool(genFuriaHeavy, fallbackFuriaHeavy, 16);
  } else if (factionOrTheme === 'ARCANO_FREEZE') {
    // 20 Arcano Mana
    for (let i = 0; i < 20; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const base = [
      { id: 'centinela-cristal', count: 3 },
      { id: 'tejedora-escarcha', count: 3 },
      { id: 'golem-glaciar', count: 2 },
      { id: 'mago-runa-helada', count: 3 },
      { id: 'prision-glacial', count: 3 },
    ];
    base.forEach(item => {
      for (let i = 0; i < item.count; i++) deck.push({ ...CARDS_DB[item.id] });
    });
    // Fill with generated Arcano control/freeze cards
    const genArcanoControl = Object.values(CARDS_DB).filter(c => 
      c.id.startsWith('gen-arcano-') && 
      (c.rulesText.includes('Congela') || c.rulesText.includes('congelar') || c.type === 'ESTRUCTURA' || c.type === 'UNIDAD')
    );
    const fallbackArcanoControl = Object.values(CARDS_DB).filter(c =>
      c.faction === 'ARCANO' &&
      (c.rulesText.includes('Congela') || c.rulesText.includes('congelar') || c.type === 'ESTRUCTURA' || c.type === 'UNIDAD')
    );
    addFromPool(genArcanoControl, fallbackArcanoControl, 16);
  } else if (factionOrTheme === 'ARCANO_SPELL') {
    // 20 Arcano Mana
    for (let i = 0; i < 20; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const base = [
      { id: 'aprendiz-nexo', count: 3 },
      { id: 'buho-runico', count: 3 },
      { id: 'tejedora-tiempo', count: 3 },
      { id: 'vortice-mana', count: 3 },
      { id: 'cometa-arcano', count: 2 },
    ];
    base.forEach(item => {
      for (let i = 0; i < item.count; i++) deck.push({ ...CARDS_DB[item.id] });
    });
    // Fill with generated Arcano spells
    const genArcanoSpells = Object.values(CARDS_DB).filter(c => 
      c.id.startsWith('gen-arcano-') && c.type === 'HECHIZO'
    );
    const fallbackArcanoSpells = Object.values(CARDS_DB).filter(c =>
      c.faction === 'ARCANO' && c.type === 'HECHIZO'
    );
    addFromPool(genArcanoSpells, fallbackArcanoSpells, 16);
  } else if (factionOrTheme === 'FURIA') {
    // Default Furia composition
    for (let i = 0; i < 20; i++) deck.push({ ...CARDS_DB['fuente-furia'] });
    const composition = [
      { id: 'sabueso-brasa', count: 3 },
      { id: 'berserker-ignivoro', count: 3 },
      { id: 'lluvia-ceniza', count: 2 },
      { id: 'forja-carmesi', count: 2 },
      { id: 'chispa-fugaz', count: 2 },
      { id: 'infiltrado-volcanico', count: 2 },
      { id: 'elemental-lava', count: 2 },
      { id: 'muro-pomez', count: 2 },
      { id: 'dragon-caldera', count: 1 },
      { id: 'guerrero-ceniza', count: 3 },
      { id: 'fenix-renacido', count: 2 },
      { id: 'draco-magma', count: 2 },
      { id: 'trasgo-piroclastico', count: 2 },
      { id: 'golem-fundicion', count: 2 }
    ];
    composition.forEach(item => {
      for (let i = 0; i < item.count; i++) deck.push({ ...CARDS_DB[item.id] });
    });
  } else {
    // Default Arcano composition
    for (let i = 0; i < 20; i++) deck.push({ ...CARDS_DB['fuente-arcana'] });
    const composition = [
      { id: 'centinela-cristal', count: 3 },
      { id: 'tejedora-escarcha', count: 2 },
      { id: 'prision-glacial', count: 2 },
      { id: 'cometa-arcano', count: 2 },
      { id: 'torre-horizonte', count: 2 },
      { id: 'aprendiz-nexo', count: 2 },
      { id: 'barrera-hielo', count: 2 },
      { id: 'vortice-mana', count: 2 },
      { id: 'golem-glaciar', count: 1 },
      { id: 'buho-runico', count: 3 },
      { id: 'elemental-tormenta', count: 2 },
      { id: 'avatar-cosmos', count: 1 },
      { id: 'tejedora-tiempo', count: 3 },
      { id: 'mago-runa-helada', count: 3 }
    ];
    composition.forEach(item => {
      for (let i = 0; i < item.count; i++) deck.push({ ...CARDS_DB[item.id] });
    });
  }

  const invalidCardIndex = deck.findIndex((card) => !card.id || !card.cost);
  if (invalidCardIndex !== -1) {
    throw new Error(`El mazo ${factionOrTheme} contiene una carta invalida en la posicion ${invalidCardIndex}.`);
  }

  return deck;
}
