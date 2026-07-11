# Multiagent Guidelines: Crónicas del Nexo

Este archivo define las directrices y tareas de desarrollo para cada agente especializado del equipo de Google Antigravity.

## Responsabilidades de los Agentes

### 1. Arquitectura
*   Asegurar que el motor de reglas en `src/core/` se mantenga libre de importaciones de React/Three.js.
*   Enforzar tipado estricto en TypeScript sin usar `any`.
*   Mantener el sistema de archivos limpio e indexado.

### 2. Diseño de Juego
*   Mantener el balance de costes de maná y estadísticas de ataque/defensa.
*   Verificar que las reglas de movimiento y de combate sigan las distancias correctas.
*   Programar el comportamiento heurístico del oponente virtual (IA).

### 3. Cartas y Narrativa
*   Mantener actualizados los nombres de las 24 cartas, sus textos narrativos de ambientación en cursiva y la coherencia del trasfondo fantástico de Furia y Arcano.
*   Asegurar que cada carta tenga un número de colección asignado (1 a 24).

### 4. Interfaz y Experiencia de Usuario (UI/UX)
*   Garantizar la legibilidad de las estadísticas en el tablero 3D y en la mano del jugador.
*   Implementar tooltips accesibles para las palabras clave del juego.
*   Construir la galería interactiva y el visor de mazos.

### 5. Three.js y Efectos
*   Crear animaciones suaves para todas las acciones en el tablero.
*   Optimizar los sistemas de partículas en React Three Fiber para evitar caídas de fotogramas por segundo (FPS).
*   Garantizar el correcto funcionamiento de las cámaras y luces del tablero.

### 6. Arte Técnico
*   Diseñar las ilustraciones vectoriales SVG multicapa estructuradas.
*   Implementar el componente de carga fallback automático (WebP -> SVG).

### 7. Calidad (QA)
*   Escribir y mantener las pruebas unitarias en `src/core/__tests__/`.
*   Validar la ausencia de errores o warnings persistentes en la consola del navegador.
