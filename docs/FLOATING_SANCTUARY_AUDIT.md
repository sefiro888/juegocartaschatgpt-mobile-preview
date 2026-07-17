# Auditoría: Santuario de los Cielos Quebrados

Fecha: 2026-07-15  
Rama de trabajo: `feat/floating-sanctuary-card-movement`

## Referencia visual

La referencia muestra un santuario flotante luminoso compuesto por una plataforma central dominante, alas laterales elevadas, puentes estrechos sobre el vacío, portales arcanos, cristales azules usados como hitos y arquitectura lejana entre nubes. La composición mantiene superficies limpias alrededor de las cartas y reserva el detalle ornamental para bordes, altares y puntos de interés.

La reconstrucción no copiará la imagen píxel por píxel. Se conservarán sus principios de composición:

- lectura diagonal desde el jugador hacia el fondo;
- vacío visible entre plataformas para comunicar altura;
- rutas y puentes que expliquen el movimiento;
- iluminación cálida de amanecer con acentos arcanos azules;
- plataformas de piedra azul grisácea con metal dorado moderado;
- cartas verticales como foco principal;
- portales y cristales como anclas visuales, no como decoración repetitiva.

## Arquitectura actual

- `src/core/engine.ts` contiene las reglas puras de invocación, movimiento, combate, hechizos y turnos.
- `src/core/ai.ts` consume las mismas reglas y recorre el tablero lógico mediante `BOARD_SIZE`.
- `src/core/boardConfig.ts` define un tablero lógico de 10×10.
- `src/store/gameStore.ts` conecta las acciones del motor con Zustand y controla selección, IA y audio.
- `src/components/board3d/Board3D.tsx` mezcla interacción, conversión de coordenadas, cámara, luces, arquitectura, obstáculos y efectos.
- `src/components/board3d/Card3D.tsx` vuelve a calcular por separado la conversión 10×10 a coordenadas 3D y anima las cartas con interpolación lineal.
- `src/components/board3d/Particles.tsx` genera partículas por carta y vuelve a crear sus búferes en cada render.
- `src/components/GameHUD.tsx` conserva el HUD, inspector, mano y controles alrededor del canvas.

## Línea base

- `npm install`: correcto, sin vulnerabilidades reportadas.
- `npm run lint`: correcto con un aviso previo en `src/core/audio.ts` por un parámetro de `catch` no usado.
- `npm run test`: 2 archivos y 7 pruebas correctas.
- `npm run build`: correcto.
- Bundle principal: aproximadamente 1,31 MB sin comprimir; Vite avisa de un chunk superior a 500 kB.
- Servidor local: correcto.
- Captura inicial: `docs/screenshots/floating-sanctuary-before.png`.

## Diagnóstico visual

- La cuadrícula de cien losas es el elemento dominante incluso cuando no existe una decisión táctica activa.
- Los materiales casi negros absorben la iluminación y reducen la lectura de volumen.
- El tablero es una única superficie rectangular; no hay vacío funcional, rutas laterales ni jerarquía de plataformas.
- Portales, torres y pilares están construidos como primitivas aisladas y no forman una arquitectura coherente.
- La escala de las cartas es pequeña frente a la cuadrícula y el encuadre.
- Los efectos usan varios colores neón sin una jerarquía clara.
- Las coordenadas 3D están duplicadas en `Board3D.tsx` y `Card3D.tsx`.
- El movimiento usa `lerp` recto sobre el suelo; no sigue puentes ni compensa desniveles.

## Decisión de arquitectura

Se mantiene el tablero lógico de 10×10 para no romper reglas, IA, mazos ni pruebas. La capa de presentación asigna ahora cada coordenada a una baldosa física de una matriz uniforme. Las 25 plataformas originales permanecen como arquitectura ambiental alrededor y debajo del plano táctico, pero ya no alteran la posición de las casillas.

La capa visual será TypeScript puro y no importará React, Three.js ni Zustand. Expondrá:

- nodos visuales y sus posiciones lógicas;
- posiciones, rotaciones, alturas y tipos de nodo;
- vecindad visual derivada de la vecindad lógica;
- una superficie táctica continua de cien baldosas;
- 25 descriptores de plataforma ambiental y sus conexiones;
- rutas de movimiento con puntos de control.

## Riesgos

- La cuadrícula ocupa una única losa amplia; la cámara debe conservar visibles sus diez filas sin que el HUD tape la primera o la última.
- Las posiciones con desnivel necesitan rutas elevadas para evitar que las cartas atraviesen la piedra.
- Cien superficies de interacción siguen siendo necesarias aunque no sean visibles; deberán usar geometría simple y material invisible.
- Los componentes HTML dentro de Three.js son costosos; se mantendrán sólo para las cartas y no para la arquitectura.
- Nubes, partículas y sombras pueden degradar WebGL; se limitarán densidad, DPR y tamaño de shadow map en calidad media.

## Funcionalidad que debe conservarse

- inicialización de partida y comandantes;
- reglas de invocación y adyacencia;
- movimiento y combate;
- hechizos y objetivos;
- IA y final de turno;
- niebla de guerra;
- selección, inspector y mano;
- galería y visor de mazos;
- arte, marco, coste y estadísticas de cada carta;
- publicación bajo la base `/juegocartaschatgpt/`.

## Archivos previstos

- `src/core/boardVisualLayout.ts` (nuevo)
- `src/core/__tests__/boardVisualLayout.test.ts` (nuevo)
- `src/components/board3d/FloatingSanctuary.tsx` (nuevo)
- `src/components/board3d/Board3D.tsx`
- `src/components/board3d/Card3D.tsx`
- `src/components/board3d/Particles.tsx`
- `docs/references/santuario-flotante.png`

## Plan de implementación

1. Crear y probar el mapa lógico-a-visual.
2. Extraer el escenario a un módulo reutilizable con plataformas, puentes, vacío, portales, cristales y ambiente.
3. Sustituir la cuadrícula visible por nodos de interacción invisibles y marcadores contextuales.
4. Dibujar destinos y rutas válidas sólo durante una selección.
5. Animar cartas entre nodos mediante curvas con elevación y conservar su orientación legible.
6. Optimizar partículas y materiales para calidad media.
7. Ejecutar lint, pruebas y build; verificar consola, selección, invocación y movimiento en navegador.
8. Comparar capturas antes/después y documentar límites de esta primera versión.

## Resultado de implementación y QA

- La cuadrícula visible fue sustituida por 25 plataformas visuales que contienen las 100 posiciones lógicas originales.
- Se añadieron 40 conexiones modulares, tres plazas mayores, desniveles, dos portales, cuatro balizas de cristal, cimientos flotantes, nubes y torres lejanas.
- Los nodos tácticos permanecen invisibles hasta que existe una selección válida.
- Movimiento y ataque muestran destino y ruta; las cartas se desplazan con una curva elevada sobre plataformas y puentes.
- La interacción real en navegador movió al comandante de `5,0` a `4,0` y actualizó el atributo de prueba de su cara 3D.
- Las rutas públicas de ilustraciones ahora respetan `import.meta.env.BASE_URL`, incluida la publicación en `/juegocartaschatgpt/`.
- El HUD conserva el inspector completo en escritorio y presenta los controles de turno como overlay en pantallas estrechas.
- `npm run lint`: correcto sin avisos del código del proyecto.
- `npm run test`: 4 archivos, 13 pruebas correctas.
- `npm run build`: correcto.
- Comprobación de píxeles de escritorio (canvas 970×424): luminancia media 140,72; desviación 35,32; píxeles casi negros 1,53 %.
- Comprobación de píxeles móvil (canvas 380×604): luminancia media 138,35; desviación 29,62; píxeles casi negros 0,68 %.
- Consola del navegador: sin errores, sin pérdida de contexto WebGL y sin avisos propios. Permanece el aviso de deprecación `THREE.Clock` emitido internamente por la versión instalada de React Three Fiber/Three.js.
- El menú inicial se separó del mundo 3D: Gallery, DeckViewer y GameHUD se cargan en chunks independientes.

Capturas verificadas:

- `docs/screenshots/floating-sanctuary-before.png`
- `docs/screenshots/floating-sanctuary-after.png`
- `docs/screenshots/floating-sanctuary-moved.png`
- `docs/screenshots/floating-sanctuary-mobile.png`

## Pase de producción 3D para PC

Tras validar la primera versión procedural se creó un segundo pase orientado a fidelidad visual:

- Blender 5.1.2 instalado y utilizado como herramienta de autoría.
- Arquitectura propia exportada como `floating-sanctuary.glb`.
- Grandes masas conectadas sustituyen la lectura de 25 losas independientes.
- Piedra PBR azul grisácea, bordes estratificados, soportes, columnas, portal y cristales.
- HDRI de atardecer, nubes locales, niebla y luces cálidas/frías combinadas.
- Canvas a pantalla completa con HUD superpuesto para conservar una composición 16:9.
- Cámara diagonal controlada y cartas orientadas hacia ella.
- Corrección de escala de la cara HTML para ocupar el soporte físico completo.
- Prueba real de movimiento del comandante de `5,0` a `6,0` completada en navegador.

Documentación adicional:

- `docs/FLOATING_SANCTUARY_ASSETS.md`
- `docs/FLOATING_SANCTUARY_PIPELINE.md`
- `docs/screenshots/floating-sanctuary-pc-live.png`

Validación final del pase PC:

- `npm run lint`: correcto.
- `npm run test`: 4 archivos y 13 pruebas correctas.
- `npm run build`: correcto.
- GLB, HDRI y nubes cargados desde una sesión nueva del navegador.
- Consola sin errores críticos; permanece únicamente la deprecación interna de `THREE.Clock`.
- Selección, destinos contextuales y movimiento animado verificados sobre el escenario final.
- El chunk diferido de GameHUD mantiene el aviso informativo por superar 500 kB, mientras que la entrada inicial queda por debajo de 300 kB.

## Segundo pase de producción PC

El generador de Blender recibió una nueva pasada modular centrada en la silueta y la profundidad de la referencia:

- arcos inferiores orientados bajo las plataformas principales;
- molduras doradas y bordes estratificados;
- capiteles, hombros y agujas laterales para el portal;
- escombros agrupados en zonas de rotura, sin invadir las posiciones de cartas;
- cristales secundarios menos intensos para conservar una jerarquía clara;
- render de control actualizado en `docs/screenshots/floating-sanctuary-blender-preview.png`.

El flujo de exportación incorpora ahora `@gltf-transform/cli`. El GLB pasa de unos 6,76 MB sin comprimir a unos 0,78 MB mediante Meshopt, cuantización y cinco texturas WebP embebidas. `FloatingSanctuary.tsx` usa el decodificador Meshopt incluido y evita dependencias de decodificación remotas.

La aplicación también separa el contenido pesado del primer render. El build medido genera una entrada de 285,92 KB (84,82 KB gzip) y un chunk diferido de GameHUD de 1.125,79 KB (303,85 KB gzip). La carga del chunk empieza al pulsar `Jugar contra la IA`, mientras el jugador elige facción.

QA de este pase:

- `npm run lint`: correcto.
- `npm run test`: 4 archivos y 13 pruebas correctas.
- `npm run build`: correcto.
- GLB inspeccionado con Meshopt y WebP activos.
- Ilustraciones de la mano verificadas en una carga limpia.
- Se añadió una invalidación visual tras `img.onload` para asegurar el repintado de las ilustraciones dentro de `Html transform`.
- El navegador automatizado integrado puede blanquear un canvas al acumular varias pestañas WebGL; la verificación funcional debe hacerse con una sola pestaña activa.

## Pase de estabilidad, movimiento y HUD

La pantalla blanca comunicada por el usuario no era un fallo de React: HUD, mano y estado de partida seguían activos. La captura mediante Chrome DevTools Protocol registró `THREE.WebGLRenderer: Context Lost`.

El aislamiento por subsistemas encontró dos detonantes independientes:

- conversión PMREM del HDR panorámico de 2K;
- nubes volumétricas de Drei y, posteriormente, la textura WebP utilizada como sprite.

Correcciones aplicadas:

- HDR sustituido por una cúpula atmosférica de un solo draw call;
- nubes sustituidas por trece volúmenes dentro de una única malla instanciada;
- shadow map reducido a 1024 y DPR máximo reducido a 1,25;
- monitor de `webglcontextlost` con recuperación visible, sin perder silenciosamente la partida;
- mano ampliada a cartas de 158×226 px en escritorio y barra inferior de 244 px;
- inspector cambiado de miniatura textual a carta ilustrada;
- cámara retrasada y reencuadrada para mantener las diez filas visibles sobre el HUD.

Reglas tácticas incorporadas:

- las 100 posiciones del tablero 10×10 participan en el cálculo;
- BFS limitado por el atributo `movement` de cada carta;
- rutas bloqueadas por unidades, riscos, pilares y corrientes arcanas;
- `Vuelo` puede atravesar obstáculos, pero no terminar sobre ellos;
- todas las unidades móviles usan los ocho vecinos del tablero; una diagonal consume un paso;
- no se pueden cortar esquinas ocupadas, por lo que montañas, pilares y corrientes conservan valor táctico;
- animación encadenada por cada nodo y puente de la ruta;
- alcance de unidades y línea de visión aplicados tanto al jugador como a la IA;
- obstáculos excluidos de invocaciones, hechizos, combate y objetivos de la IA.

Validación del pase:

- 5 archivos de prueba y 18 pruebas correctas;
- prueba limpia en navegador: contexto activo, 5 destinos desde `5,0` y comandante movido diagonalmente a `6,1`;
- tras renovar turno, la posición interior `6,1` expone sus 8 destinos: avance, retroceso, laterales y diagonales;
- la cuadrícula física se validó con movimientos por clic diagonal `5,0 → 6,1`, vertical `6,1 → 6,2` y horizontal `6,2 → 7,2`;
- prueba PC compacta a 1344×670 con mano, tablero y controles sin solapamientos;
- consola limpia salvo la deprecación interna conocida de `THREE.Clock`;
- capturas `floating-sanctuary-final-qa.png` y `floating-sanctuary-pc-1366.png`.
