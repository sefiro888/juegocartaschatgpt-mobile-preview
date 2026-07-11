# Crónicas del Nexo - Vertical Slice

**Crónicas del Nexo** es un vertical slice de un juego de cartas táctico en 3D para PC construido sobre una arquitectura modular con React, React Three Fiber (R3F), Zustand, TypeScript y Vitest.

El juego se centra por completo en la interacción visual de las cartas, las cuales sirven como las unidades tridimensionales en un tablero de combate táctico de 5x5.

## Requisitos y Comandos

### Instalación
Para instalar las dependencias del proyecto:
```bash
npm install
```

### Ejecutar Servidor de Desarrollo
Para arrancar la interfaz web local:
```bash
npm run dev
```

### Ejecutar Pruebas
Para validar las reglas del juego y componentes mediante Vitest:
```bash
npm run test
```

### Generar la Build de Producción
Para compilar la aplicación para producción:
```bash
npm run build
```

## Características de la Entrega
*   **Tablero de Combate 5x5**: Movimiento de unidades, posicionamiento estratégico y ataque físico o hechizos mágicos.
*   **Dos Facciones Implementadas**: **Furia** (Ataque rápido, quemar recursos, daño directo) y **Arcano** (Control de hielo, congelamiento de unidades, robo y hechizos de maná).
*   **Dos Mazos de 50 Cartas**: Pre-construidos con balance óptimo (20 de maná y 30 no-maná).
*   **24 Diseños Únicos de Cartas**: Galería interactiva e inspección a pantalla completa de cada carta con su texto narrativo correspondiente.
*   **12 Ilustraciones SVG Multicapa Originales**: Renderizado nativo y sistema de sustitución automática por formato WebP si se añade a la carpeta `/assets/cards/art/`.
*   **Inteligencia Artificial Local**: Un oponente virtual que juega sus turnos de forma autónoma calculando heurísticas de movimiento, ataque e invocaciones.
*   **Animaciones y Partículas 3D**: Integración fluida en R3F para simular fuego, brasas, hielo y daño en las cartas.
