import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useGameStore } from './store/gameStore';

const Gallery = lazy(async () => {
  const module = await import('./components/Gallery');
  return { default: module.Gallery };
});

const DeckViewer = lazy(async () => {
  const module = await import('./components/DeckViewer');
  return { default: module.DeckViewer };
});

const loadGameHUD = () => import('./components/GameHUD');

const GameHUD = lazy(async () => {
  const module = await loadGameHUD();
  return { default: module.GameHUD };
});

type ViewMode = 'menu' | 'faction-select' | 'game' | 'gallery' | 'deck-viewer';

class ViewErrorBoundary extends Component<
  { children: ReactNode; onExit: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="view-error-state" role="alert">
          <strong>No se ha podido abrir esta vista.</strong>
          <span>La partida no se ha modificado. Puedes volver al menu o recargar la aplicacion.</span>
          <div className="view-error-actions">
            <button type="button" onClick={this.props.onExit}>Volver al menu</button>
            <button type="button" onClick={() => window.location.reload()}>Recargar</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Generates floating particle elements for the menu background */
const MenuParticles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 12,
    duration: 8 + Math.random() * 14,
    opacity: 0.15 + Math.random() * 0.35,
  }));

  return (
    <div className="particles-container">
      {particles.map(p => (
        <div
          key={p.id}
          className="floating-particle"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
};

function App() {
  const [view, setView] = useState<ViewMode>('menu');
  const [transitioning, setTransitioning] = useState(false);
  const [nextView, setNextView] = useState<ViewMode | null>(null);
  const [viewRecoveryVersion, setViewRecoveryVersion] = useState(0);
  const { startNewGame } = useGameStore();

  const navigateTo = (target: ViewMode) => {
    setTransitioning(true);
    setNextView(target);
  };

  useEffect(() => {
    if (transitioning && nextView) {
      const timer = setTimeout(() => {
        setView(nextView);
        setNextView(null);
        setTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [transitioning, nextView]);

  const handleSelectFaction = (faction: 'FURIA' | 'ARCANO', theme: string) => {
    startNewGame(faction, theme);
    navigateTo('game');
  };

  const handleStartGameFlow = () => {
    void loadGameHUD();
    navigateTo('faction-select');
  };

  const handleViewRecovery = () => {
    setTransitioning(false);
    setNextView(null);
    setView('menu');
    setViewRecoveryVersion((current) => current + 1);
  };

  return (
    <div className={`app-container ${transitioning ? 'fade-out' : 'fade-in'}`}>
      {view === 'menu' && (
        <div className="main-menu-container">
          <MenuParticles />

          <div className="menu-header">
            <h1 className="game-title-logo">CRÓNICAS DEL NEXO</h1>
            <div className="title-underline" />
            <p className="game-tagline">Vertical Slice • Combate Táctico de Cartas en 3D</p>
          </div>

          <div className="menu-actions glass-panel">
            <button className="menu-btn primary" onClick={handleStartGameFlow}>
              ⚔️ Jugar contra la IA
            </button>
            <button className="menu-btn secondary" onClick={() => navigateTo('gallery')}>
              🎴 Colección de Cartas
            </button>
            <button className="menu-btn secondary" onClick={() => navigateTo('deck-viewer')}>
              📁 Visor de Mazos
            </button>
          </div>

          <div className="menu-credits">
            Antigravity Games Team • Google DeepMind
          </div>
        </div>
      )}

      {view === 'faction-select' && (
        <div className="faction-select-container">
          <MenuParticles />

          <h2 className="faction-heading">Elige tu Facción y Mazo</h2>
          <p className="select-desc">Selecciona uno de los mazos temáticos de 50 cartas para iniciar la batalla</p>

          <div className="factions-grid">
            {/* FURIA */}
            <div className="faction-card furia glass-panel">
              <div className="faction-art-preview furia-art">
                <div className="faction-art-icon">🔥</div>
              </div>
              <h3>IGNIS</h3>
              <p className="faction-commander-title">Cólera del Nexo (Furia)</p>
              <div className="faction-lore">
                "Fuego consumidor, ataques rápidos y destrucción. Elige tu estrategia para quemar el nexo enemigo."
              </div>
              <div className="faction-traits">
                <span className="trait">⚔️ Agresivo</span>
                <span className="trait">💥 Daño directo</span>
              </div>
              
              <div className="deck-choices-list">
                <div className="deck-choice-item" onClick={() => handleSelectFaction('FURIA', 'FURIA')}>
                  <h4>🔥 Mazo Clásico</h4>
                  <p>Equilibrio ofensivo con criaturas y hechizos clásicos.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('FURIA', 'FURIA_AGRO')}>
                  <h4>⚡ Fuego Rápido (Agro)</h4>
                  <p>Invocaciones veloces de Trasgos y Sabuesos de carga.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('FURIA', 'FURIA_CONTROL')}>
                  <h4>🌋 Caldera (Control)</h4>
                  <p>Grandes Dragones, volcanes y hechizos de daño masivo.</p>
                </div>
              </div>
            </div>

            {/* ARCANO */}
            <div className="faction-card arcano glass-panel">
              <div className="faction-art-preview arcano-art">
                <div className="faction-art-icon">❄️</div>
              </div>
              <h3>AETHELGARD</h3>
              <p className="faction-commander-title">Sabio del Domo (Arcano)</p>
              <div className="faction-lore">
                "Control de hielo, barreras rúnicas y robo de cartas. Elige tu estrategia para dominar el tiempo."
              </div>
              <div className="faction-traits">
                <span className="trait">🛡️ Defensivo</span>
                <span className="trait">❄️ Control</span>
              </div>

              <div className="deck-choices-list">
                <div className="deck-choice-item" onClick={() => handleSelectFaction('ARCANO', 'ARCANO')}>
                  <h4>❄️ Mazo Clásico</h4>
                  <p>Control y robo de maná clásico balanceado.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('ARCANO', 'ARCANO_FREEZE')}>
                  <h4>🥶 Ventisca (Control)</h4>
                  <p>Muros de escarcha, Golems de glaciar y congelamiento.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('ARCANO', 'ARCANO_SPELL')}>
                  <h4>🔮 Magia de Runas (Combo)</h4>
                  <p>Búhos arcanos, tejedores del tiempo y combo de hechizos.</p>
                </div>
              </div>
            </div>

            {/* HÍBRIDOS Y ESPECIALES */}
            <div className="faction-card hybrid glass-panel">
              <div className="faction-art-preview hybrid-art">
                <div className="faction-art-icon">⚡</div>
              </div>
              <h3>NEXO</h3>
              <p className="faction-commander-title">Mazos Híbridos & Temáticos</p>
              <div className="faction-lore">
                "Combina las fuerzas del fuego y del hielo, o utiliza la sinergia oculta de las Bestias y las Estructuras sagradas."
              </div>
              <div className="faction-traits">
                <span className="trait hybrid-tag">⚡ Híbrido</span>
                <span className="trait hybrid-tag">⚜️ Sinergia</span>
              </div>

              <div className="deck-choices-list">
                <div className="deck-choice-item" onClick={() => handleSelectFaction('FURIA', 'NEXO_HIBRIDO')}>
                  <h4>⚡ Combustión Rúnica</h4>
                  <p>Mezcla agresiva de Furia y control congelante de Arcano.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('FURIA', 'BARAJA_BESTIAS')}>
                  <h4>🦁 Manada del Nexo</h4>
                  <p>Bestias: Sabuesos, Búhos, Dracos y Elementales.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('ARCANO', 'FORTALEZA_RUNICA')}>
                  <h4>🛡️ Fortaleza Antigua</h4>
                  <p>Estructuras defensivas, Forjas y Golems colosales.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('ARCANO', 'MAZO_SOMBRA')}>
                  <h4>🕸️ Reino Umbrío</h4>
                  <p>Fieles de Sombra: Espectros, Vampiros y Nigromancia.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('FURIA', 'MAZO_NATURALEZA')}>
                  <h4>🌿 Abrazo Forestal</h4>
                  <p>Naturaleza pura: Centauros, Lobos y Sanaciones salvajes.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('ARCANO', 'MAZO_CELESTIAL')}>
                  <h4>🦅 Reinos del Aire</h4>
                  <p>Animales Celestiales: Ángeles, Grifos, Halcones y Pegasos.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('ARCANO', 'MAZO_ACUATICO')}>
                  <h4>🌊 Abismo Marino</h4>
                  <p>Criaturas acuáticas, Leviatanes y magias de agua abisales.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('FURIA', 'MAZO_RENEGADOS')}>
                  <h4>🗑️ Pila de Renegados</h4>
                  <p>Cartas rechazadas, descartes caóticos y Goblins locos.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('FURIA', 'MAZO_ORCOS_BESTIAS')}>
                  <h4>👹 Horda Orca</h4>
                  <p>Sinergia brutal de Orcos de Sombra y Bestias de Furia.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('ARCANO', 'MAZO_VACIO')}>
                  <h4>🌌 Vacío Entrópico</h4>
                  <p>Falla del Vacío: Horrores, parásitos y magias de aniquilación.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('ARCANO', 'MAZO_ORDEN')}>
                  <h4>🛡️ Edicto Sagrado</h4>
                  <p>Unidades de Orden: Ángeles, paladines y escudos divinos.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('FURIA', 'MAZO_ULTIMO_ALIENTO')}>
                  <h4>💀 Último Aliento</h4>
                  <p>Mazo de sacrificio y fénix que reviven al morir.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('FURIA', 'MAZO_DOBLE_ATAQUE')}>
                  <h4>🌪️ Ráfaga de Furia</h4>
                  <p>Doble golpe: Atacantes que golpean dos veces por turno.</p>
                </div>
                <div className="deck-choice-item" onClick={() => handleSelectFaction('FURIA', 'MAZO_FORESTAL_CONTROL')}>
                  <h4>🌳 Raíces de Vida</h4>
                  <p>Control de Naturaleza: Curación constante y muros gruesos.</p>
                </div>
              </div>
            </div>
          </div>

          <button className="back-menu-btn" onClick={() => navigateTo('menu')}>
            ← Volver al Menú
          </button>
        </div>
      )}

      <ViewErrorBoundary key={viewRecoveryVersion} onExit={handleViewRecovery}>
        <Suspense fallback={<div className="view-loading-indicator" aria-label="Cargando vista" />}>
          {view === 'game' && <GameHUD onQuit={() => navigateTo('menu')} />}
          {view === 'gallery' && <Gallery onBack={() => navigateTo('menu')} />}
          {view === 'deck-viewer' && <DeckViewer onBack={() => navigateTo('menu')} />}
        </Suspense>
      </ViewErrorBoundary>

      <style>{`
        .app-container {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background-color: #030407;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .view-loading-indicator {
          width: 34px;
          height: 34px;
          border: 3px solid rgba(151, 183, 214, 0.18);
          border-top-color: #78cfff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .view-error-state {
          width: min(440px, calc(100vw - 40px));
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          color: #eef6ff;
          background: rgba(10, 17, 26, 0.94);
          border: 1px solid rgba(137, 205, 238, 0.35);
          border-radius: 8px;
          box-shadow: 0 22px 64px rgba(0, 0, 0, 0.48);
          text-align: center;
        }
        .view-error-state span { color: #b9c9d5; font-size: 0.85rem; line-height: 1.45; }
        .view-error-actions { display: flex; justify-content: center; gap: 9px; margin-top: 5px; }
        .view-error-actions button {
          padding: 8px 12px;
          border: 1px solid rgba(126, 211, 255, 0.45);
          border-radius: 6px;
          color: #effaff;
          background: #176887;
          cursor: pointer;
        }

        /* Page transitions */
        .fade-in {
          animation: pageIn 0.4s ease-out;
        }
        .fade-out {
          animation: pageOut 0.3s ease-in forwards;
        }
        @keyframes pageIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pageOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        /* Floating particles */
        .particles-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .floating-particle {
          position: absolute;
          bottom: -10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.6), rgba(99, 102, 241, 0.1));
          animation: float linear infinite;
          pointer-events: none;
        }

        /* Main Menu style */
        .main-menu-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, #151a2d 0%, #0a0d17 40%, #030407 100%);
          z-index: 10;
          position: relative;
        }

        .menu-header {
          text-align: center;
          margin-bottom: 40px;
          position: relative;
          z-index: 1;
          animation: slide-up 0.6s ease-out;
        }

        .game-title-logo {
          font-size: 4rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 40%, #6366f1 70%, #4f46e5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: var(--font-display);
          animation: title-glow 3s ease-in-out infinite;
          position: relative;
        }

        .title-underline {
          width: 120px;
          height: 2px;
          margin: 12px auto 0;
          background: linear-gradient(90deg, transparent, #6366f1, transparent);
          border-radius: 1px;
        }

        .game-tagline {
          font-size: 1.05rem;
          color: var(--color-text-muted);
          margin-top: 14px;
          letter-spacing: 0.05em;
        }

        .menu-actions {
          width: 340px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          position: relative;
          z-index: 1;
          animation: slide-up 0.8s ease-out;
        }

        .menu-btn {
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          font-family: var(--font-sans);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .menu-btn.primary {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: white;
          border-color: #6366f1;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
        }
        .menu-btn.primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 30px rgba(79, 70, 229, 0.6);
        }

        .menu-btn.secondary {
          background: rgba(255, 255, 255, 0.03);
          color: white;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .menu-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-3px);
        }

        .menu-credits {
          position: absolute;
          bottom: 24px;
          font-size: 0.78rem;
          color: var(--color-text-muted);
          letter-spacing: 0.05em;
          z-index: 1;
        }

        /* Faction Selector */
        .faction-select-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, #0f121d 0%, #080a12 40%, #030407 100%);
          padding: 40px;
          position: relative;
        }

        .faction-heading {
          font-size: 2.5rem;
          color: white;
          margin-bottom: 8px;
          animation: slide-up 0.5s ease-out;
        }

        .select-desc {
          color: var(--color-text-muted);
          margin-bottom: 40px;
          text-align: center;
          max-width: 600px;
          animation: slide-up 0.6s ease-out;
        }

         .factions-grid {
          display: flex;
          gap: 24px;
          max-width: 1200px;
          width: 100%;
          margin-bottom: 40px;
          z-index: 1;
          animation: slide-up 0.7s ease-out;
        }

        .faction-card {
          flex: 1;
          padding: 30px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        
        .faction-card.furia:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 15px 40px rgba(255, 62, 62, 0.25);
          border-color: var(--color-furia);
        }

        .faction-card.arcano:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 15px 40px rgba(0, 217, 255, 0.25);
          border-color: var(--color-arcano);
        }

        .faction-card.hybrid:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 15px 40px rgba(139, 92, 246, 0.25);
          border-color: #8b5cf6;
        }

        .trait.hybrid-tag {
          background: rgba(139, 92, 246, 0.1);
          color: #a78bfa;
          border-color: rgba(139, 92, 246, 0.25);
        }

        .faction-art-preview.hybrid-art {
          background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
        }

        /* Faction art preview area */
        .faction-art-preview {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          position: relative;
        }
        .furia-art {
          background: radial-gradient(circle, rgba(255, 62, 62, 0.2), rgba(255, 62, 62, 0.05));
          border: 2px solid rgba(255, 62, 62, 0.3);
          box-shadow: 0 0 20px rgba(255, 62, 62, 0.15);
        }
        .arcano-art {
          background: radial-gradient(circle, rgba(0, 217, 255, 0.2), rgba(0, 217, 255, 0.05));
          border: 2px solid rgba(0, 217, 255, 0.3);
          box-shadow: 0 0 20px rgba(0, 217, 255, 0.15);
        }
        .faction-art-icon {
          font-size: 2.5rem;
        }

        .faction-card h3 {
          font-size: 2rem;
          margin-bottom: 6px;
        }

        .faction-card.furia h3 { color: var(--color-furia); }
        .faction-card.arcano h3 { color: var(--color-arcano); }

        .faction-commander-title {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          margin-bottom: 16px;
        }

        .faction-lore {
          font-size: 0.92rem;
          line-height: 1.6;
          color: #d1d5db;
          margin-bottom: 16px;
          flex: 1;
        }

        .faction-traits {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        .trait {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--color-text-muted);
        }

        .play-select-btn {
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: bold;
          font-family: var(--font-sans);
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.25s;
          font-size: 0.95rem;
        }

        .play-select-btn.furia {
          background: var(--color-furia-bg);
          color: white;
          border-color: var(--color-furia);
        }
        .play-select-btn.furia:hover {
          background: var(--color-furia);
          box-shadow: 0 0 15px var(--color-furia-glow);
        }

        .play-select-btn.arcano {
          background: var(--color-arcano-bg);
          color: white;
          border-color: var(--color-arcano);
        }
        .play-select-btn.arcano:hover {
          background: var(--color-arcano);
          box-shadow: 0 0 15px var(--color-arcano-glow);
        }

        .deck-choices-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          margin-top: 10px;
          z-index: 5;
          max-height: 240px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .deck-choice-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 10px 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .furia .deck-choice-item:hover {
          background: rgba(255, 62, 62, 0.08);
          border-color: rgba(255, 62, 62, 0.3);
          transform: scale(1.02);
        }

        .arcano .deck-choice-item:hover {
          background: rgba(0, 217, 255, 0.08);
          border-color: rgba(0, 217, 255, 0.3);
          transform: scale(1.02);
        }

        .deck-choice-item h4 {
          font-size: 0.88rem;
          margin: 0;
          color: #fff;
        }

        .deck-choice-item p {
          font-size: 0.7rem;
          margin: 0;
          color: var(--color-text-muted);
          line-height: 1.35;
        }

        .back-menu-btn {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 1;
        }
        .back-menu-btn:hover {
          color: white;
          transform: translateX(-4px);
        }
      `}</style>
    </div>
  );
}

export default App;
