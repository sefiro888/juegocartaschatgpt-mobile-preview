export interface LoreChapter {
  title: string;
  history: string[];
  quote: string;
  artistNote: string;
}

export const LORE_DB: Record<string, LoreChapter> = {
  'fuente-furia': {
    title: 'El Corazón Latiente de la Tierra',
    history: [
      'Antes de que existieran los comandantes o las fortalezas, la energía del nexo fluía sin control por las grietas volcánicas del sur. Las fuentes de Furia no son simples depósitos de poder; son géiseres de magma viviente alimentados por el manto ardiente de la creación.',
      'Los chamanes de la Furia aprendieron a canalizar esta corriente directa. Tocar una fuente de Furia es experimentar la ira y el ímpetu de mil erupciones pasadas. Es un recurso inestable que exige una voluntad de hierro para no ser consumido al instante por su calor primordial.'
    ],
    quote: '«El magma no obedece a reyes ni a dioses; fluye donde hay espacio para destruir.»',
    artistNote: 'El estilo de Fantasía Oscura Digital resalta el brillo abrasador del flujo de magma contra los bloques de obsidiana apagados.'
  },
  'sabueso-brasa': {
    title: 'El Cazador Ígneo del Domo',
    history: [
      'En los desiertos de ceniza que bordean el Nexo, los Sabuesos de Brasa cazan en manadas. Estas bestias no tienen carne ni huesos en el sentido tradicional; sus cuerpos están hechos de roca fundida y carbón ardiente que se regenera con cada paso.',
      'Su velocidad es legendaria debido a la Carga que llevan dentro. Son los primeros en cruzar las líneas enemigas, encendiendo el pánico y la hojarasca a su paso. Un solo mordisco puede derretir la armadura de acero templado más resistente.'
    ],
    quote: '«Si escuchas el crepitar de la ceniza seca a tu espalda, ya es demasiado tarde para correr.»',
    artistNote: 'La pintura al óleo de Kaelen Vane aporta una textura densa y clásica a las grietas incandescentes del pelaje de la criatura.'
  },
  'berserker-ignivoro': {
    title: 'El Juramento de la Llama Expiatoria',
    history: [
      'Los guerreros ignívoros no temen a la muerte; la buscan en el calor del combate. Cada berserker realiza el rito de la llama, consumiendo carbones ardientes para fusionar su espíritu con el fuego del Nexo. Este poder les otorga una fuerza devastadora a costa de su propia vida.',
      'En combate, su frenesí es tan destructivo que sus propios golpes les causan quemaduras internas. Cuanto más atacan, más rápido se consume su fuerza vital, pero el rastro de destrucción que dejan a su paso es innegable.'
    ],
    quote: '«Mi cuerpo es la madera; mi ira es el fuego. Arderé hasta que el último enemigo sea solo ceniza blanca.»',
    artistNote: 'El boceto a carbón de Brutus Clay captura la crudeza y el dinamismo salvaje del berserker en plena batalla.'
  },
  'dragon-caldera': {
    title: 'El Despertar del Tirano del Volcán',
    history: [
      'El Dragón de la Caldera es un espécimen colosal que ha habitado las profundidades de la caldera de magma desde la Primera Edad. Sus alas son capaces de levantar tormentas de ceniza ardiente, y su aliento puede fundir fortalezas enteras en segundos.',
      'Cuando desciende sobre el tablero, el impacto de su aterrizaje sacude la tierra, liberando una onda de choque ígnea que daña a todas las criaturas enemigas adyacentes. Es el depredador supremo de la facción de Furia.'
    ],
    quote: '«Cuando el cielo se tiñe de rojo y la tierra tiembla, el verdadero señor del fuego ha regresado.»',
    artistNote: 'La acuarela mística de Elysia Thorne suaviza la agresividad del dragón, envolviéndolo en un aura de leyenda antigua.'
  },
  'lluvia-ceniza': {
    title: 'La Ira del Cielo Quemado',
    history: [
      'Este hechizo es la invocación directa del Cataclismo. Al pronunciar las runas prohibidas de Furia, el invocador rasga el cielo, haciendo caer pequeños meteoritos y ceniza hirviendo sobre el campo de batalla.',
      'No hay refugio contra este ataque destructivo. Puede carbonizar una unidad de control o dañar directamente el Nexo enemigo para allanar el camino a las unidades de asalto rápido.'
    ],
    quote: '«El cielo ya no derrama agua, sino las lágrimas hirvientes de un mundo que quiere ver arder sus cimientos.»',
    artistNote: 'El grabado medieval en madera de Valerius da a la lluvia una sensación de plaga bíblica y castigo divino.'
  },
  'forja-carmesi': {
    title: 'El Yunque de la Rabia Eterna',
    history: [
      'En el corazón de la fortaleza de Furia se encuentra la Forja Carmesí. Sus fuegos son mantenidos por los esclavos del magma y el yunque ruge día y noche para equipar a las tropas con armas de hierro fundido.',
      'Cualquier unidad que pase cerca de sus fuegos recibe una bendición de calor permanente que aumenta su poder de ataque. Es un bastión táctico crucial para mantener la presión sobre el tablero.'
    ],
    quote: '«El acero se dobla ante la fuerza, pero el fuego le da su verdadero propósito. Forja tu rabia.»',
    artistNote: 'El estilo digital resalta el contraste entre la piedra negra y el metal licuado de color naranja brillante.'
  },
  'chispa-fugaz': {
    title: 'El Rayo Inestable de la Discordia',
    history: [
      'La Chispa Fugaz es el hechizo más básico de la facción de Furia, pero también uno de los más peligrosos debido a su inestabilidad. Canaliza una pequeña parte del núcleo del Nexo en una descarga de energía pura.',
      'Es extremadamente rápida de lanzar y barata, pero requiere que el invocador descarte una carta al azar debido a la falta de control que ejerce sobre la magia.'
    ],
    quote: '«La magia del fuego es fácil de encender, pero casi imposible de dirigir sin perder algo a cambio.»',
    artistNote: 'El estilo neon de Zoriel Moon hace destacar la chispa como un rayo eléctrico cargado de luz ultraviolenta.'
  },
  'infiltrado-volcanico': {
    title: 'La Sombra de los Ríos de Magma',
    history: [
      'Los Infiltrados Volcánicos son pícaros entrenados para cruzar el tablero a través de las rutas más peligrosas. Sus botas reforzadas con obsidiana les permiten caminar sobre el magma sin sufrir daños.',
      'Su especialidad es la infiltración diagonal. Son capaces de deslizarse entre las defensas enemigas para asestar golpes por la espalda a los magos arcanos de la retaguardia.'
    ],
    quote: '«La roca sólida es para los tontos; el magma ardiente es mi mejor camino.»',
    artistNote: 'La técnica de vidriera de Lyra Frost segmenta la escena en planos geométricos que imitan la cristalización de la lava.'
  },
  'elemental-lava': {
    title: 'La Furia Líquida del Tablero',
    history: [
      'El Elemental de Lava es la encarnación del magma en movimiento. Su cuerpo se regenera constantemente absorbiendo el calor del nexo. Es un gigante lento pero implacable.',
      'Cuando es destruido, la roca exterior que lo contiene se rompe de golpe, liberando el núcleo de magma a alta presión. Esto causa una erupción masiva que hiere a todos los que estén a su alrededor.'
    ],
    quote: '«No intentes romper mi piedra, porque solo liberarás la marea que te consumirá.»',
    artistNote: 'La tinta china Sumi-e de Hokusai rinde homenaje al movimiento fluido y violento de la lava con trazos negros y rojos orgánicos.'
  },
  'muro-pomez': {
    title: 'La Roca Flotante del Tablero',
    history: [
      'El Muro de Piedra Pómez se construye enfriando magma rápidamente con magia de viento básica. El resultado es una barrera porosa y ligera pero increíblemente resistente a los impactos físicos.',
      'Sirve principalmente para bloquear el avance del rival o proteger las estructuras vulnerables como la Forja Carmesí. No puede atacar, pero su salud resistirá varios turnos de asedio.'
    ],
    quote: '«Ligera como el aire, dura como la roca. El fuego nos dio forma y la piedra nos mantiene en pie.»',
    artistNote: 'El pixel art de PixelLord da un toque retro delicioso a la textura porosa del muro de roca volcánica.'
  },
  'impetu-fuego': {
    title: 'La Bendición del Nexo Ígneo',
    history: [
      'Este hechizo imbuye el cuerpo de una criatura aliada con el calor ardiente del Nexo. Sus efectos son inmediatos: el guerrero aumenta su velocidad y potencia física de forma dramática durante este turno.',
      'Se utiliza estratégicamente para lanzar contraataques letales o permitir que una criatura de asedio alcance el nexo enemigo antes de que pueda reaccionar.'
    ],
    quote: '«Siente el fuego en tus venas y embiste. La quietud es para los muertos.»',
    artistNote: 'El cel-shading de Aria Star da un aire de cómic dinámico a los chorros de llamas que impulsan al guerrero.'
  },
  'comandante-furia': {
    title: 'El Soberano de la Cólera Ígnea',
    history: [
      'Ignis es el gobernante de las tierras del sur. Su cuerpo está hecho de lava solidificada y su báculo canaliza la energía primordial del nexo volcánico. Ha jurado derretir el Domo de Arcano.',
      'Su habilidad activa le permite asestar pequeños golpes de fuego a las unidades adyacentes para rematarlas sin exponerse al daño de combate directo.'
    ],
    quote: '«El Nexo arderá conmigo o no pertenecerá a nadie. Bienvenidos a mi infierno.»',
    artistNote: 'La fantasía oscura digital dota a Ignis de una armadura de placas de obsidiana con relieves de magma brillante.'
  },
  'guerrero-ceniza': {
    title: 'La Guardia de Ceniza de Ignis',
    history: [
      'Los Guerreros de Ceniza forman el núcleo militar de la facción de Furia. Son soldados adiestrados en tácticas de desgaste que aprovechan las tormentas de polvo volcánico para cegar y dañar a sus oponentes.',
      'Al entrar en juego, lanzan una nube de ceniza hirviendo a una casilla adyacente, hiriendo a las unidades enemigas antes de comenzar el combate cuerpo a cuerpo.'
    ],
    quote: '«La ceniza entra en tus pulmones y ciega tus ojos. Tu fin está en mi viento.»',
    artistNote: 'El óleo de Kaelen Vane enfatiza los detalles de la ceniza suspendida en el aire con pinceladas texturizadas.'
  },
  'fenix-renacido': {
    title: 'El Ave de la Eterna Renovación',
    history: [
      'El Fénix Renacido es un ser mítico que habita en las chimeneas volcánicas más calientes del Nexo. Cuando sus plumas se consumen por completo, su cuerpo estalla en un haz de luz y regresa al nexo para renacer.',
      'En términos de juego, su Último Aliento devuelve la carta directamente a tu mano para que puedas volver a invocarlo en el siguiente turno. Es una fuente constante de presión voladora.'
    ],
    quote: '«Cada fin es solo el preludio de un nuevo despertar en llamas.»',
    artistNote: 'La acuarela de Elysia Thorne crea una sensación de luz translúcida que emana del cuerpo del ave de fuego.'
  },
  'draco-magma': {
    title: 'El Azote de la Caldera',
    history: [
      'Los Dracos de Magma son dragones menores que cazan en las laderas del volcán. A diferencia de su pariente colosal, el Dragón de la Caldera, estos dracos son extremadamente rápidos y embisten en manadas.',
      'Su habilidad de Carga y su capacidad de infligir daño directo al comandante enemigo al atacar los convierten en la opción perfecta para finalizar partidas ajustadas.'
    ],
    quote: '«Vuelan bajo los ríos de ceniza, buscando el corazón de la fortaleza enemiga.»',
    artistNote: 'El estilo neon de Zoriel resalta la lava que fluye por las alas y cola del draco contra la oscuridad del cielo.'
  },
  'trasgo-piroclastico': {
    title: 'La Locura del Magma Pequeño',
    history: [
      'Los Trasgos Piroclásticos son criaturas caóticas que viven en las cuevas de ceniza. Su único propósito es prender fuego a todo lo que encuentran, sin importar el coste personal.',
      'Son sumamente baratos e infligen un daño decente al instante (Carga), pero su naturaleza caótica obliga al invocador a descartar una carta al azar de su propia mano al entrar en juego.'
    ],
    quote: '«¡Fuego! ¡Más fuego! ¿Mano vacía? ¡No importa, más fuego!»',
    artistNote: 'Brutus Clay utiliza trazos rápidos a carbón para plasmar la expresión lunática y desenfrenada del trasgo.'
  },
  'golem-fundicion': {
    title: 'El Horno de Hierro Viviente',
    history: [
      'El Golem de la Fundición es una estructura metálica colosal animada por un núcleo de fuego concentrado. Su cuerpo irradia una temperatura tan alta que el aire a su alrededor se vuelve irrespirable.',
      'Al final de cada turno, el calor remanente de sus calderas inflige daño a todas las unidades en las casillas adyacentes, sin importar si son aliadas o enemigas. Úsalo con cuidado extremo.'
    ],
    quote: '«El yunque anda, el fuego quema, el hierro aplasta.»',
    artistNote: 'El estilo digital aporta detalles mecánicos precisos al cuerpo oxidado y lleno de grietas incandescentes del golem.'
  },
  'furia-nexo': {
    title: 'El Clímax de la Magia Ígnea',
    history: [
      'Este hechizo representa la canalización máxima de la ira del Nexo en una criatura aliada. El sujeto recibe un aumento colosal de ataque y la capacidad de cargar inmediatamente.',
      'La energía del hechizo es tan intensa que la unidad se consumirá al final de la batalla, pero su impacto inicial suele ser devastador para el oponente.'
    ],
    quote: '«Un golpe que sacude el Domo; una vida entregada al fuego del Nexo.»',
    artistNote: 'La ilustración tipo cómic de Aria Star destaca la sobrecarga de energía con líneas de acción potentes.'
  },
  'erupcion-volcanica': {
    title: 'El Fin de los Días en el Nexo',
    history: [
      'Este es el hechizo definitivo de la facción de Furia. Abre una grieta tectónica en el centro del campo de batalla, liberando una erupción volcánica que daña a todas las unidades en juego.',
      'Aunque daña a tus propias tropas, su capacidad para limpiar el tablero de amenazas enemigas de nivel bajo y medio lo convierte en un recurso táctico inigualable.'
    ],
    quote: '«Que el fuego purifique este tablero. Que la piedra vuelva a ser magma.»',
    artistNote: 'El grabado en madera de Valerius confiere a la erupción un aspecto clásico de las antiguas epopeyas mitológicas.'
  },
  'pilar-fuego': {
    title: 'La Columna de la Retaguardia Calcinada',
    history: [
      'El Pilar de Fuego es una estructura defensiva que dispara llamaradas constantes en línea recta a lo largo de su fila. Es un pilar tallado con runas de combustión constante.',
      'Al inicio de cada turno, el pilar detecta la presencia de enemigos en su fila y lanza una bola de fuego concentrada, forzando al oponente a recolocar sus piezas constantemente.'
    ],
    quote: '«Mientras el pilar siga en pie, esta fila pertenecerá a la ceniza.»',
    artistNote: 'El pixel art de PixelLord da un aire retro arcade a la animación de la columna de fuego constante.'
  },

  // --- ARCANO (20 cartas) ---
  'fuente-arcana': {
    title: 'El Flujo Cósmico del Domo',
    history: [
      'Las fuentes de Arcano son corrientes de energía mágica fría y cristalizada que emanan de las profundidades del Domo. A diferencia del magma salvaje de Furia, el maná arcano es ordenado y constante.',
      'Sostiene la barrera del Domo y permite a los magos tejer sus hechizos de control y hielo. Canalizar esta corriente otorga una mente clara y predecible.'
    ],
    quote: '«El maná no arde; fluye silencioso como el río celeste.»',
    artistNote: 'La técnica de vidriera de Lyra Frost capta la luz azul fría que refracta a través de los cristales arcanos.'
  },
  'centinela-cristal': {
    title: 'El Guardián Runado del Domo',
    history: [
      'Los Centinelas de Cristal son autómatas de piedra rúnica y cristal azul creados por Aethelgard. Su única directiva es custodiar los accesos al Domo celestial contra las incursiones de Furia.',
      'Gracias a su composición cristalina, poseen Resistencia innata, ignorando el primer punto de daño recibido en cada turno. Son la línea de defensa perfecta del mazo de Arcano.'
    ],
    quote: '«La roca tallada recuerda las runas de la defensa; el cristal no cede ante la fuerza bruta.»',
    artistNote: 'El dibujo con tinta Sumi-e de Hokusai le da al golem un aspecto místico y etéreo con líneas de contorno definidas.'
  },
  'tejedora-escarcha': {
    title: 'La Dama de la Ventisca Silenciosa',
    history: [
      'Las Tejedoras de Escarcha son magas elfas que han pasado siglos meditando en los picos helados de la cordillera norte. Controlan la humedad del aire para tejer prisiones de hielo al instante.',
      'Su Grito de Batalla congela a un oponente durante un turno entero. Esto permite al mazo de Arcano retrasar los ataques del Sabueso de Brasa o inmovilizar a grandes amenazas.'
    ],
    quote: '«Un suspiro frío es suficiente para detener tu pequeña rabia ígnea.»',
    artistNote: 'La acuarela mística de Elysia Thorne envuelve a la tejedora en brumas heladas de tonos azules y blancos.'
  },
  'prision-glacial': {
    title: 'El Hielo Eterno del Polo Norte',
    history: [
      'Este hechizo conjura un bloque de hielo milenario alrededor de una unidad enemiga, aislándola por completo del flujo del combate durante dos turnos arcanos.',
      'Es la herramienta de control por excelencia. Permite anular a la criatura más peligrosa del rival mientras el mago arcano roba recursos y prepara su contraataque.'
    ],
    quote: '«La quietud no es la muerte, sino la espera eterna bajo el hielo absoluto.»',
    artistNote: 'El grabado medieval de Valerius muestra la prisión de hielo como un bloque sólido con grabados rúnicos tallados.'
  },
  'cometa-arcano': {
    title: 'La Estrella Caída del Cielo Arcano',
    history: [
      'Al invocar el Cometa Arcano, el mago rasga la bóveda estrellada del Domo para hacer caer un proyectil de pura energía mágica concentrada sobre el campo de batalla.',
      'El impacto inflige un daño colosal a la criatura enemiga y su explosión mágica abre un vórtice que permite al invocador robar una carta adicional del mazo.'
    ],
    quote: '«La luz de las estrellas no solo guía el camino; también calcina la herejía de la ceniza.»',
    artistNote: 'El estilo neon de Zoriel Moon hace destacar la estela del cometa con un color cian brillante y partículas de plasma.'
  },
  'torre-horizonte': {
    title: 'La Academia del Domo Celestial',
    history: [
      'La Torre del Horizonte es la academia de astronomía y runas del mazo de Arcano. Desde su cúspide, los sabios observan el movimiento del Nexo y anticipan los movimientos de la Furia.',
      'Su efecto te otorga una ventaja de cartas insuperable, permitiéndote robar una carta adicional al inicio de tu turno. Protégela con tus Centinelas de Cristal.'
    ],
    quote: '«El conocimiento del mañana se escribe en las estrellas del horizonte.»',
    artistNote: 'La vidriera de Lyra Frost segmenta la torre contra el cielo nocturno estrellado en un mosaico de color azul profundo.'
  },
  'aprendiz-nexo': {
    title: 'El Estudiante Ansioso de Poder',
    history: [
      'Los Aprendices del Nexo son jóvenes estudiantes que memorizan runas sin cesar en la academia de Arcano. Aunque carecen de experiencia militar, su entusiasmo abarata el coste de los hechizos.',
      'Mientras esté en juego, todos tus hechizos arcanos costarán 1 de maná genérico menos. Es el motor perfecto para barajas centradas en el lanzamiento constante de conjuros.'
    ],
    quote: '«La concentración abre las puertas del nexo; el resto es solo voluntad y memoria.»',
    artistNote: 'El pixel art de PixelLord recrea al joven estudiante con túnicas azules y un libro de hechizos sobredimensionado.'
  },
  'barrera-hielo': {
    title: 'El Muro Translúcido del Norte',
    history: [
      'La Barrera de Hielo es una defensa mágica que se alza instantáneamente congelando el vapor de agua. Su superficie es tan fría que cualquier unidad que la ataque quedará inmovilizada.',
      'Su habilidad pasiva congela al atacante cuerpo a cuerpo por 1 turno, desbaratando la cadena de ataques rápidos de los berserkers de Furia.'
    ],
    quote: '«Tocar el muro es aceptar la congelación de tu propia sangre.»',
    artistNote: 'El dibujo a carbón de Brutus Clay plasma la textura angular y afilada de la barrera de hielo.'
  },
  'destello-runico': {
    title: 'La Luz Defensiva del Sabio',
    history: [
      'Este hechizo de conjuro rápido crea una ráfaga de luz cian que emana directamente del báculo del Comandante Arcano, cegando e inmovilizando al atacante adyacente.',
      'Es excelente para repeler asaltos sorpresa contra Aethelgard, dándote además una carta adicional para reponer tu mano.'
    ],
    quote: '«La luz del sabio no daña la carne; detiene el espíritu agresor al instante.»',
    artistNote: 'El cel-shading de Aria Star da un efecto de explosión gráfica retro al destello de energía mágica.'
  },
  'golem-glaciar': {
    title: 'El Coloso del Frío Eterno',
    history: [
      'El Golem de Glaciar es una de las creaciones más colosales del Domo de Arcano. Es una mole de hielo macizo y piedras polares inmune a la magia de cualquier invocador.',
      'Al ser inmune a hechizos, el oponente de Furia no podrá destruirlo con *Lluvia de Ceniza* o *Chispa Fugaz*, obligándolo a entablar un costoso combate físico contra sus 6 puntos de salud.'
    ],
    quote: '«La magia fluye a través de mi hielo sin dejar rastro de calor. Soy eterno.»',
    artistNote: 'El óleo clásico de Kaelen Vane aporta realismo al hielo azul translúcido y las texturas agrietadas del golem.'
  },
  'vortice-mana': {
    title: 'La Desintegración de la Materia',
    history: [
      'Este hechizo altera la polaridad de la energía del nexo bajo una criatura, forzando su desmaterialización y enviándola de vuelta al plano de su invocador.',
      'Es muy útil para retirar temporalmente del tablero a grandes unidades enemigas como el *Dragón de la Caldera* o rescatar a una unidad aliada en peligro de muerte.'
    ],
    quote: '«La materia es solo energía condensada. Yo decido cuándo debe disolverse.»',
    artistNote: 'La tinta china de Hokusai dibuja el vórtice como una espiral dinámica de líneas fluidas de color cian.'
  },
  'comandante-arcano': {
    title: 'El Sabio del Domo Celestial',
    history: [
      'Aethelgard es el comandante de Arcano. Ha pasado siglos estudiando el cielo estrellado y las corrientes mágicas del Nexo. Su mente fría calcula cada movimiento con precisión matemática.',
      'Su habilidad de Comandante le permite robar cartas adicionales, garantizando que el mazo de Arcano siempre disponga de respuestas tácticas adecuadas.'
    ],
    quote: '«La paciencia es el arma definitiva. El hielo no tiene prisa para congelar la montaña.»',
    artistNote: 'La vidriera de Lyra Frost muestra a Aethelgard levitando con su báculo rúnico rodeado de constelaciones celestes.'
  },
  'buho-runico': {
    title: 'El Mensajero de las Constelaciones',
    history: [
      'Los Búhos Rúnicos vuelan silenciosos por los cielos nocturnos del Domo. Son los mensajeros del Sabio, llevando runas de conocimiento y retirando las ideas obsoletas.',
      'Al inicio de tu turno, su efecto te permite renovar tu mano robando una carta y descartando otra, optimizando tu mazo para buscar respuestas rápidas.'
    ],
    quote: '«Su vuelo no deja rastro en la nieve; su mirada ve la magia del mañana.»',
    artistNote: 'La acuarela de Elysia Thorne da al búho un contorno etéreo y luminoso sobre un fondo azul estrellado.'
  },
  'elemental-tormenta': {
    title: 'La Ráfaga del Viento Polar',
    history: [
      'El Elemental de Tormenta es una criatura salvaje nacida del viento helado y los rayos cósmicos. Su paso congela instantáneamente las articulaciones de los rivales.',
      'Su Grito de Batalla congela a dos unidades enemigas al azar, dándote el control temporal del tablero para ejecutar maniobras tácticas ofensivas.'
    ],
    quote: '«El viento del norte no te cortará con acero; detendrá tu sangre en tus venas.»',
    artistNote: 'El estilo neon de Zoriel resalta los rayos arcanos que fluyen por el cuerpo espiral de la tormenta.'
  },
  'avatar-cosmos': {
    title: 'La Manifestación del Vacío Celestial',
    history: [
      'El Avatar del Cosmos es una entidad cósmica legendaria que solo responde al llamado de los magos arcanos más poderosos. Su cuerpo está compuesto de galaxias enteras.',
      'Reduce permanentemente el coste de todos tus hechizos y su inmunidad a hechizos lo protege de las respuestas del rival. Es el remate definitivo del mazo de Arcano.'
    ],
    quote: '«El universo entero cabe en mi palma. Tu pequeña guerra de fuego es solo una chispa efímera.»',
    artistNote: 'Fantasía Oscura Digital resalta la inmensidad del avatar con siluetas estelares imponentes.'
  },
  'tejedora-tiempo': {
    title: 'La Hilandera de los Momentos',
    history: [
      'La Tejedora del Tiempo manipula el hilo temporal de las criaturas en el tablero. Su magia puede acelerar o desacelerar el momento exacto en que una unidad actúa.',
      'Su Grito de Batalla le otorga a una unidad aliada la capacidad de moverse y atacar de nuevo en el mismo turno, permitiendo jugadas letales imprevistas.'
    ],
    quote: '«El tiempo es maleable si sabes tirar del hilo adecuado. Permíteme tejer tu segundo intento.»',
    artistNote: 'Aria Star utiliza un estilo tipo cómic con líneas de velocidad cinéticas alrededor de las manos de la maga.'
  },
  'mago-runa-helada': {
    title: 'El Guardián del Báculo Helado',
    history: [
      'Los Magos de Runa Helada patrullan las fronteras del Domo. Sus báculos están imbuidos con runas de congelación absoluta que se activan con cada golpe.',
      'Cualquier enemigo dañado por este mago quedará congelado al instante, convirtiéndolo en un excelente atacante de control en el tablero táctico.'
    ],
    quote: '«Cada golpe de mi báculo congela un recuerdo de tu vida. Pronto serás solo hielo.»',
    artistNote: 'Tinta Sumi-e de Hokusai define al mago con túnicas fluidas y un báculo rúnico azul brillante cargado de energía.'
  },
  'congelacion-rapida': {
    title: 'El Suspiro Frío del Tablero',
    history: [
      'Este conjuro rápido congela a una criatura enemiga por un turno de forma económica y te otorga un robo inmediato de carta para mantener el flujo de recursos.',
      'Se usa para detener a los sabuesos de carga de Furia antes de que puedan atacar tus estructuras clave.'
    ],
    quote: '«Un suspiro frío y el objetivo se detiene rígido, mientras su mente se abre ante mí.»',
    artistNote: 'PixelLord utiliza pixel art para dar un efecto retro congelado a la criatura atrapada.'
  },
  'tormenta-mana': {
    title: 'La Ventisca del Domo Celestial',
    history: [
      'Este hechizo convoca una ventisca helada que inmoviliza a todas las criaturas situadas en una columna vertical del tablero táctico de 5x5.',
      'Es ideal para congelar columnas de asalto enemigas completas que intenten avanzar hacia tu comandante.'
    ],
    quote: '«El frío desciende directamente del Domo, inmovilizando ejércitos enteros en silencio.»',
    artistNote: 'El grabado medieval de Valerius confiere al viento helado un aspecto clásico y devastador de antigua epopeya.'
  },
  'templo-runico': {
    title: 'El Santuario de la Protección Arcana',
    history: [
      'El Templo Rúnico es una estructura sagrada que conecta el Domo celestial con el Comandante Arcano, otorgándole mayor poder de ataque y la capacidad de resistir daños.',
      'Mientras el templo siga en pie, Aethelgard tendrá +1 de ataque y la palabra clave Resistencia. Es el pilar de la estrategia defensiva del Domo.'
    ],
    quote: '«Las runas del templo irradian energía protectora al sabio; somos impenetrables.»',
    artistNote: 'El boceto a carbón de Brutus Clay resalta los pilares rúnicos y los relieves tallados en el templo de piedra helada.'
  },
  'devorador-entropico': {
    title: 'La Boca Abierta Entre las Estrellas',
    history: [
      'El Devorador Entrópico nació en la oscuridad que separa los mundos. Su cuerpo está formado por materia quebrada y constelaciones extinguidas, y cada grieta de su armadura contiene el eco de una galaxia consumida.',
      'En el campo de batalla desciende sobre los obstáculos y resiste los ataques convencionales mientras avanza hacia el Nexo. Los sabios aseguran que destruirlo no lo mata: únicamente dispersa su forma hasta que vuelva a reunir suficiente vacío.'
    ],
    quote: '«Cuando su sombra cubra las estrellas, no mires al cielo. Él también estará mirando.»',
    artistNote: 'La ilustración aportada al Archivo del Nexo combina fantasía cósmica, roca abisal y energía violeta para transmitir una amenaza de escala planetaria.'
  }
};
