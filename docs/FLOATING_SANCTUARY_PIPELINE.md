# Flujo de Producción: Santuario de los Cielos Quebrados

## Objetivo de esta versión

Esta iteración está dirigida a PC. Mantiene el tablero lógico de 10×10, las reglas, la IA y el estado de partida, pero presenta las cien coordenadas mediante 25 zonas visuales integradas en un santuario 3D continuo.

## Herramientas

- Blender 5.1.2.
- glTF Transform CLI 4.4 para compresión Meshopt y texturas WebP.
- React, TypeScript y Vite.
- Three.js, React Three Fiber y React Three Drei.
- Texturas PBR CC0 documentadas en `FLOATING_SANCTUARY_ASSETS.md`.

No se necesita Unity ni Unreal Engine.

## Regenerar el escenario

Desde la raíz del repositorio en PowerShell:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --python tools\blender\build_floating_sanctuary.py
```

El script produce y optimiza de forma automática:

- `art/blender/floating-sanctuary.blend`: fuente editable.
- `public/assets/scenarios/floating-sanctuary/floating-sanctuary.glb`: activo del juego.
- `docs/screenshots/floating-sanctuary-blender-preview.png`: render de control.

Blender exporta primero un GLB temporal sin comprimir. El mismo script ejecuta después glTF Transform, aplica deduplicación, poda, WebP y Meshopt, reemplaza el GLB final y elimina el temporal. No hay que ejecutar un segundo comando manual.

## Integración WebGL

`FloatingSanctuary.tsx` carga el GLB y añade en tiempo real:

- iluminación de amanecer;
- cielo atmosférico mediante una cúpula de un solo draw call;
- niebla y bancos de nubes mediante una malla instanciada sin texturas;
- vórtice animado del portal;
- luces pulsantes de cristales;
- partículas ambientales limitadas;
- arquitectura distante de bajo coste.

El cargador usa el decodificador Meshopt incluido con Three.js y no depende de un CDN de Draco. El escenario incorpora además arcos inferiores, molduras orientadas, capiteles, contrafuertes, escombros controlados y un portal de varias capas para acercar su silueta a la referencia.

`boardVisualLayout.ts` continúa siendo TypeScript puro. No importa React ni Three.js y sigue separando reglas y presentación.

El tablero jugable es una matriz física uniforme de 10×10. Cada coordenada lógica corresponde al centro de una baldosa visible y clicable, con separación constante en ambos ejes. El modelo del santuario funciona como entorno y pedestal, no como fuente de coordenadas tácticas irregulares.

## Cámara y HUD

La cámara de PC usa una perspectiva diagonal controlada. El HUD se superpone al canvas para que el escenario conserve una composición 16:9 y no quede comprimido entre paneles. La mano ocupa la franja inferior, pero el punto de interés de la cámara mantiene los destinos tácticos por encima de ella.

## Cartas y movimiento

- Las cartas conservan arte, marco, coste y estadísticas mediante `Html` transformado.
- La cara visual se escala para coincidir con el soporte físico 3D.
- Los comandantes reciben mayor escala de reposo.
- La selección agranda la carta sin sustituirla por una miniatura.
- Los movimientos siguen curvas entre nodos y compensan desniveles.
- Las cien baldosas forman una única superficie continua, legible como una hoja cuadriculada.
- El valor `movement` determina el alcance mediante búsqueda de rutas sobre las 100 posiciones.
- Cada unidad móvil puede usar los ocho sentidos; las diagonales consumen un punto de movimiento.
- Los destinos se separan visualmente y la ruta solo se dibuja al señalar una posición válida.
- Las unidades terrestres no atraviesan ocupantes; `Vuelo` permite saltarlos sin aterrizar sobre ellos.
- Las cartas con alcance superior a uno respetan línea de visión y no reciben contraataque de unidades que no pueden alcanzarlas.
- Destinos y rutas solo aparecen durante una acción válida.

## Presupuesto actual de PC

- GLB optimizado: 0,78 MB aproximadamente; el exportado sin comprimir ronda 6,76 MB.
- Geometría comprimida con Meshopt y cinco texturas WebP embebidas.
- El HDRI 2K se conserva como fuente de arte, pero no se carga en WebGL.
- Texturas de piedra 1K.
- Sombras de 1024 px para la luz principal.
- DPR del canvas limitado a 1,25.
- Nubes instanciadas y partículas con límites explícitos.
- Entrada inicial de Vite: 286 KB aproximadamente, 85 KB gzip.
- `GameHUD` y el mundo 3D se cargan bajo demanda al entrar en juego; galería y visor de mazos tienen chunks independientes.

## Límites conocidos

- La referencia es una ilustración fija; la reconstrucción prioriza su composición y sensación, no una copia píxel por píxel.
- Aún faltan relieves y bordes rotos esculpidos de forma única; el pase actual usa un kit modular propio para mantener el coste WebGL controlado.
- El aviso deprecado de `THREE.Clock` procede de la combinación instalada de React Three Fiber y Three.js.
- El chunk diferido de `GameHUD` supera el umbral informativo de 500 kB por Three.js, pero ya no bloquea la carga del menú inicial.
- La adaptación específica para móvil queda fuera de esta iteración.

## Prueba automatizada de Chrome

`tools/qa/chrome-game-smoke.mjs` se conecta a un Chrome iniciado con CDP y comprueba:

- carga completa de menú, facción y partida;
- recursos o excepciones de consola;
- estado real del contexto WebGL;
- cantidad de destinos válidos al seleccionar el comandante;
- actualización de la posición de la carta después de moverla;
- captura de pantalla del resultado.

## Próximas mejoras artísticas

1. Crear decals de grietas, suciedad y runas sin aumentar la densidad visual.
2. Esculpir dos o tres piezas heroicas únicas para el portal y la plaza central.
3. Añadir LOD y texturas KTX2 para la futura versión móvil.
4. Preparar variantes nocturna, tormenta y amanecer reutilizando los mismos anclajes tácticos.
