import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Board3D } from './board3d/Board3D';
import { CardDOM } from './CardDOM';
import { CARDS_DB } from '../core/cardsDb';

interface GameHUDProps {
  onQuit?: () => void;
}

/** A single entry in the action log feed */
interface ActionLogEntry {
  id: number;
  text: string;
  timestamp: number;
}

let actionLogId = 0;

export const GameHUD: React.FC<GameHUDProps> = ({ onQuit }) => {
  const {
    gameState,
    selectedCardInHand,
    selectedEntity,
    hoveredEntity,
    selectCardInHand,
    playMana,
    endActiveTurn,
    startNewGame,
    isAIThinking,
  } = useGameStore();

  const isEntityVisibleInHUD = (entity: any) => {
    if (!gameState) return true;
    if (entity.controller === 'PLAYER') return true;
    if (entity.cardId.startsWith('obstaculo-')) return true;

    const playerEntities = Object.values(gameState.board).filter((e: any) => e.controller === 'PLAYER');
    if (entity.position.y <= 2) return true;

    return playerEntities.some((pe: any) => {
      const dx = Math.abs(pe.position.x - entity.position.x);
      const dy = Math.abs(pe.position.y - entity.position.y);
      return (dx + dy) <= 2;
    });
  };

  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const prevTurnRef = useRef<number>(0);

  const turn = gameState?.turn || 0;
  const activePlayer = gameState?.activePlayer || 'PLAYER';
  const isPlayerTurn = activePlayer === 'PLAYER';

  useEffect(() => {
    if (!gameState) return;
    if (turn !== prevTurnRef.current) {
      prevTurnRef.current = turn;
      const entry: ActionLogEntry = {
        id: ++actionLogId,
        text: `Turno ${turn} — ${isPlayerTurn ? 'Tu turno' : 'Turno de la IA'}`,
        timestamp: Date.now(),
      };
      setActionLog(prev => [...prev.slice(-2), entry]);
    }
  }, [turn, isPlayerTurn, gameState]);

  if (!gameState) return null;

  const { player, opponent, winner } = gameState;
  const playerCommanderCard = CARDS_DB[player.commander.id];

  // Retrieve health from the actual commander entities on the board
  const playerCommanderEntity = Object.values(gameState.board).find(ent => ent.id === 'commander-player');
  const opponentCommanderEntity = Object.values(gameState.board).find(ent => ent.id === 'commander-opponent');

  const playerHealth = playerCommanderEntity ? playerCommanderEntity.health : 0;
  const opponentHealth = opponentCommanderEntity ? opponentCommanderEntity.health : 0;

  const handlePlayMana = (cardId: string) => {
    if (isPlayerTurn && !player.manaPlayedThisTurn) {
      playMana(cardId);
      const entry: ActionLogEntry = {
        id: ++actionLogId,
        text: `Maná jugado: ${CARDS_DB[cardId]?.name ?? cardId}`,
        timestamp: Date.now(),
      };
      setActionLog(prev => [...prev.slice(-2), entry]);
    }
  };

  const handleRestart = () => {
    const playerFaction = playerCommanderCard.faction === 'FURIA' ? 'FURIA' : 'ARCANO';
    startNewGame(playerFaction);
    setActionLog([]);
  };

  const handleEndTurn = () => {
    const entry: ActionLogEntry = {
      id: ++actionLogId,
      text: 'Turno finalizado por el jugador',
      timestamp: Date.now(),
    };
    setActionLog(prev => [...prev.slice(-2), entry]);
    endActiveTurn();
  };

  /** Render mana orbs (colored circles) */
  const renderManaOrbs = (available: number, total: number, faction: 'furia' | 'arcano') => {
    const orbs = [];
    for (let i = 0; i < total; i++) {
      orbs.push(
        <div
          key={i}
          className={`mana-orb ${faction} ${i < available ? 'active' : 'spent'}`}
        />
      );
    }
    return <div className="mana-orbs-row">{orbs}</div>;
  };

  const playerFuriaAvail = player.manaSources.furia.total - player.manaSources.furia.spent;
  const playerArcanoAvail = player.manaSources.arcano.total - player.manaSources.arcano.spent;
  const oppFuriaAvail = opponent.manaSources.furia.total - opponent.manaSources.furia.spent;
  const oppArcanoAvail = opponent.manaSources.arcano.total - opponent.manaSources.arcano.spent;

  return (
    <div className="game-hud">
      {/* ═══ TOP BAR: OPPONENT INFO | TURN/PHASE | OPP MANA ═══ */}
      <div className="hud-top-bar glass-panel">
        <div className="top-section opponent-info-compact">
          <span className="commander-tag opponent">🤖 RIVAL (IA)</span>
          <div className="nexo-health-bar-mini">
            <div className="nexo-bar-fill opponent" style={{ width: `${Math.max(0, (opponentHealth / 25) * 100)}%` }} />
            <span className="nexo-bar-text">❤️ {opponentHealth}/25</span>
          </div>
          <span className="resource-badge">🎴 {opponent.deck.length}</span>
          <span className="resource-badge">🪦 {opponent.graveyard.length}</span>
        </div>

        <div className="top-section game-status-center">
          <div className="turn-indicator">
            <div className={`turn-dot ${isPlayerTurn ? 'player-dot' : 'opponent-dot'}`} />
            <span className="turn-label">TURNO {turn}</span>
          </div>
          <span className={`phase-tag ${isPlayerTurn ? 'player' : 'opponent'}`}>
            {isPlayerTurn ? '⚔️ Tu Turno' : '🤖 IA Pensando...'}
          </span>
        </div>

        <div className="top-section opponent-mana-compact">
          <div className="mana-compact-group">
            <span className="mana-compact-label arcano-text">❄️</span>
            {renderManaOrbs(oppArcanoAvail, opponent.manaSources.arcano.total, 'arcano')}
            <span className="mana-compact-num">{oppArcanoAvail}/{opponent.manaSources.arcano.total}</span>
          </div>
          <div className="mana-compact-group">
            <span className="mana-compact-label furia-text">🔥</span>
            {renderManaOrbs(oppFuriaAvail, opponent.manaSources.furia.total, 'furia')}
            <span className="mana-compact-num">{oppFuriaAvail}/{opponent.manaSources.furia.total}</span>
          </div>
        </div>
      </div>

      {/* ═══ CENTER LAYOUT: 3D BOARD & INSPECTOR SIDEBAR ═══ */}
      <div className="game-center-board">
        <div className="board-canvas-area">
          <Board3D />
        </div>

        {/* SIDEBAR DETAILED INSPECTOR */}
        <div className="hud-sidebar glass-panel">
          <h3 className="sidebar-title">
            <span className="sidebar-title-icon">🔍</span>
            Inspector
          </h3>
          
          <div className="inspector-content">
            {hoveredEntity ? (
              !isEntityVisibleInHUD(hoveredEntity) ? (
                <div className="inspector-card-hidden">
                  <div className="inspected-card-preview-hidden">
                    <div className="hidden-card-placeholder">
                      <span className="eye-icon">👁️</span>
                      <span className="question">?</span>
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1rem', marginTop: '10px', color: '#818cf8' }}>Criatura Oculta</h3>
                  <p className="rules-desc" style={{ fontStyle: 'italic', opacity: 0.6 }}>Esta unidad enemiga está oculta por la niebla de guerra. Acércate para revelarla.</p>
                </div>
              ) : (
                <div className="sidebar-entity-info animated-fade">
                  <div className="inspected-card-preview">
                    <CardDOM card={CARDS_DB[hoveredEntity.cardId]} mode="thumbnail" />
                  </div>
                  <div className="stats-grid">
                    <div className="stat-box attack">
                      <div className="stat-circle attack-circle">
                        <span className="stat-circle-val">{hoveredEntity.attack}</span>
                      </div>
                      <span className="stat-label">ATK</span>
                    </div>
                    <div className="stat-box health">
                      <div className="stat-circle health-circle">
                        <span className="stat-circle-val">{hoveredEntity.health}</span>
                      </div>
                      <span className="stat-label">HP {hoveredEntity.health}/{hoveredEntity.maxHealth}</span>
                    </div>
                  </div>
                  <div className="card-specs-mini">
                    {CARDS_DB[hoveredEntity.cardId]?.range !== undefined && (
                      <span className="spec-pill">🎯 Rango: {CARDS_DB[hoveredEntity.cardId].range}</span>
                    )}
                    {CARDS_DB[hoveredEntity.cardId]?.movement !== undefined && (
                      <span className="spec-pill">👣 Mov: {CARDS_DB[hoveredEntity.cardId].movement}</span>
                    )}
                    <span className="spec-pill style-tag-pill">{CARDS_DB[hoveredEntity.cardId]?.subtype}</span>
                  </div>
                  <div className="rules-box">
                    <p className="rules-title">Reglas Especiales</p>
                    <p className="rules-desc">{CARDS_DB[hoveredEntity.cardId]?.rulesText}</p>
                  </div>
                  <div className="lore-box-sidebar">
                    <p className="lore-desc">"{CARDS_DB[hoveredEntity.cardId]?.flavorText}"</p>
                    {CARDS_DB[hoveredEntity.cardId]?.artist && (
                      <p className="artist-credit-sidebar">🎨 Art: {CARDS_DB[hoveredEntity.cardId].artist} ({CARDS_DB[hoveredEntity.cardId].artistStyle})</p>
                    )}
                  </div>
                  {hoveredEntity.frozenTurns > 0 && (
                    <div className="frozen-banner-sidebar">❄️ CONGELADO ({hoveredEntity.frozenTurns} T)</div>
                  )}
                </div>
              )
            ) : selectedEntity ? (
              !isEntityVisibleInHUD(selectedEntity) ? (
                <div className="inspector-card-hidden">
                  <div className="inspected-card-preview-hidden">
                    <div className="hidden-card-placeholder">
                      <span className="eye-icon">👁️</span>
                      <span className="question">?</span>
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1rem', marginTop: '10px', color: '#818cf8' }}>Criatura Oculta</h3>
                  <p className="rules-desc" style={{ fontStyle: 'italic', opacity: 0.6 }}>Esta unidad enemiga está oculta por la niebla de guerra. Acércate para revelarla.</p>
                </div>
              ) : (
                <div className="sidebar-entity-info animated-fade">
                  <div className="inspected-card-preview">
                    <CardDOM card={CARDS_DB[selectedEntity.cardId]} mode="thumbnail" />
                  </div>
                  <div className="stats-grid">
                    <div className="stat-box attack">
                      <div className="stat-circle attack-circle">
                        <span className="stat-circle-val">{selectedEntity.attack}</span>
                      </div>
                      <span className="stat-label">ATK</span>
                    </div>
                    <div className="stat-box health">
                      <div className="stat-circle health-circle">
                        <span className="stat-circle-val">{selectedEntity.health}</span>
                      </div>
                      <span className="stat-label">HP {selectedEntity.health}/{selectedEntity.maxHealth}</span>
                    </div>
                  </div>
                  <div className="card-specs-mini">
                    {CARDS_DB[selectedEntity.cardId]?.range !== undefined && (
                      <span className="spec-pill">🎯 Rango: {CARDS_DB[selectedEntity.cardId].range}</span>
                    )}
                    {CARDS_DB[selectedEntity.cardId]?.movement !== undefined && (
                      <span className="spec-pill">👣 Mov: {CARDS_DB[selectedEntity.cardId].movement}</span>
                    )}
                    <span className="spec-pill style-tag-pill">{CARDS_DB[selectedEntity.cardId]?.subtype}</span>
                  </div>
                  <div className="rules-box">
                    <p className="rules-title">Reglas Especiales</p>
                    <p className="rules-desc">{CARDS_DB[selectedEntity.cardId]?.rulesText}</p>
                  </div>
                  <div className="lore-box-sidebar">
                    <p className="lore-desc">"{CARDS_DB[selectedEntity.cardId]?.flavorText}"</p>
                    {CARDS_DB[selectedEntity.cardId]?.artist && (
                      <p className="artist-credit-sidebar">🎨 Art: {CARDS_DB[selectedEntity.cardId].artist} ({CARDS_DB[selectedEntity.cardId].artistStyle})</p>
                    )}
                  </div>
                  <div className="actions-hint">
                    <span className={`hint-pill ${selectedEntity.hasMovedThisTurn ? 'spent' : 'ready'}`}>
                      {selectedEntity.hasMovedThisTurn ? '✗ Movido' : '✓ Mover'}
                    </span>
                    <span className={`hint-pill ${selectedEntity.hasAttackedThisTurn ? 'spent' : 'ready'}`}>
                      {selectedEntity.hasAttackedThisTurn ? '✗ Atacado' : '✓ Atacar'}
                    </span>
                  </div>
                </div>
              )
            ) : selectedCardInHand ? (
              <div className="sidebar-card-info animated-fade">
                <h4>{selectedCardInHand.name}</h4>
                <div className="badge-row-sidebar">
                  <span className="badge-type">{selectedCardInHand.subtype || selectedCardInHand.type}</span>
                  <span className="badge-rarity-sidebar" style={{ color: `var(--rarity-${selectedCardInHand.rarity.toLowerCase()})` }}>
                    {selectedCardInHand.rarity}
                  </span>
                </div>
                <div className="card-specs-mini hand-specs">
                  {selectedCardInHand.range !== undefined && (
                    <span className="spec-pill">🎯 Rango: {selectedCardInHand.range}</span>
                  )}
                  {selectedCardInHand.movement !== undefined && (
                    <span className="spec-pill">👣 Mov: {selectedCardInHand.movement}</span>
                  )}
                  {selectedCardInHand.attack !== undefined && (
                    <span className="spec-pill">⚔️ ATK: {selectedCardInHand.attack}</span>
                  )}
                  {selectedCardInHand.maxHealth !== undefined && (
                    <span className="spec-pill">❤️ HP: {selectedCardInHand.maxHealth}</span>
                  )}
                </div>
                <p className="rules-desc-sidebar">{selectedCardInHand.rulesText}</p>
                <div className="lore-box-sidebar hand-lore">
                  <p className="lore-desc">"{selectedCardInHand.flavorText}"</p>
                  {selectedCardInHand.artist && (
                    <p className="artist-credit-sidebar">🎨 Art: {selectedCardInHand.artist} ({selectedCardInHand.artistStyle})</p>
                  )}
                </div>
                
                {selectedCardInHand.type === 'MANA' && (
                  <button
                    className="action-btn-sidebar play-mana"
                    disabled={!isPlayerTurn || player.manaPlayedThisTurn}
                    onClick={() => handlePlayMana(selectedCardInHand.id)}
                  >
                    ⬆ Jugar Fuente de Maná
                  </button>
                )}
              </div>
            ) : (
              <div className="sidebar-placeholder">
                <div className="placeholder-icon">👁️</div>
                <p>Selecciona o inspecciona una carta del tablero o tu mano para ver sus atributos.</p>
              </div>
            )}
          </div>

          {/* ACTION LOG */}
          <div className="action-log">
            <div className="action-log-title">📜 Registro</div>
            {actionLog.length === 0 ? (
              <div className="action-log-empty">Sin acciones aún</div>
            ) : (
              actionLog.map(entry => (
                <div key={entry.id} className="action-log-entry">
                  {entry.text}
                </div>
              ))
            )}
          </div>

          <div className="sidebar-footer-controls">
            <button
              className={`action-btn end-turn ${isPlayerTurn ? 'active' : ''}`}
              disabled={!isPlayerTurn}
              onClick={handleEndTurn}
            >
              {isPlayerTurn ? '⚡ Finalizar Turno' : '⏳ Esperando...'}
            </button>
            <button className="action-btn surrender" onClick={onQuit}>
              🏳️ Rendirse
            </button>
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM BAR: PLAYER STATS | HAND | MANA ═══ */}
      <div className={`hud-bottom-bar glass-panel ${isAIThinking ? 'ai-thinking-dim' : ''}`}>
        {/* AI Thinking Overlay */}
        {isAIThinking && (
          <div className="ai-thinking-overlay">
            <div className="ai-spinner" />
            <span>IA PENSANDO...</span>
          </div>
        )}

        {/* PLAYER STATS (LEFT) */}
        <div className="player-stats-panel">
          <div className="commander-tag player">👤 TU NEXO</div>
          <div className="hp-bar-container">
            <div className="hp-bar-fill" style={{ width: `${Math.max(0, (playerHealth / 25) * 100)}%` }}>
              <div className="hp-bar-shimmer" />
            </div>
            <span className="hp-bar-label">{playerHealth} / 25</span>
          </div>
          <div className="deck-graveyard-stats">
            <span>🎴 {player.deck.length}</span>
            <span>🪦 {player.graveyard.length}</span>
          </div>
        </div>

        {/* HAND ROW (CENTER - FULL HEIGHT) */}
        <div className="player-hand-container">
          <div className="player-hand-scroll">
            {player.hand.map((card, idx) => {
              const isSelected = selectedCardInHand?.id === card.id;
              const isPlayable = isPlayerTurn && (
                card.type === 'MANA' ? !player.manaPlayedThisTurn : (
                  (card.cost.furia || 0) <= (player.manaSources.furia.total - player.manaSources.furia.spent) &&
                  (card.cost.arcano || 0) <= (player.manaSources.arcano.total - player.manaSources.arcano.spent) &&
                  card.cost.generic <= (
                    (player.manaSources.furia.total - player.manaSources.furia.spent) +
                    (player.manaSources.arcano.total - player.manaSources.arcano.spent) -
                    (card.cost.furia || 0) - (card.cost.arcano || 0)
                  )
                )
              );

              return (
                <div
                  key={`${card.id}-${idx}`}
                  className={`hand-card-wrapper ${isSelected ? 'is-selected' : ''} ${isPlayable ? 'is-playable' : ''}`}
                  onClick={() => selectCardInHand(isSelected ? null : card)}
                >
                  <CardDOM card={card} mode="hand" isSelected={isSelected} isPlayable={isPlayable} />
                </div>
              );
            })}
          </div>
        </div>

        {/* MANA ORB TRACKERS (RIGHT) */}
        <div className="player-mana-panel">
          <div className="mana-orb-group">
            <div className="mana-orb-header">
              <span className="mana-orb-icon arcano-text">❄️ Arcano</span>
              <span className="mana-orb-count">{playerArcanoAvail}/{player.manaSources.arcano.total}</span>
            </div>
            {renderManaOrbs(playerArcanoAvail, player.manaSources.arcano.total, 'arcano')}
          </div>
          <div className="mana-orb-group">
            <div className="mana-orb-header">
              <span className="mana-orb-icon furia-text">🔥 Furia</span>
              <span className="mana-orb-count">{playerFuriaAvail}/{player.manaSources.furia.total}</span>
            </div>
            {renderManaOrbs(playerFuriaAvail, player.manaSources.furia.total, 'furia')}
          </div>
        </div>
      </div>

      {/* ═══ VICTORY / DEFEAT CINEMATIC OVERLAY ═══ */}
      {winner && (
        <div className="game-over-overlay">
          <div className={`game-over-box glass-panel ${winner === 'PLAYER' ? 'victory' : 'defeat'}`}>
            <div className="game-over-icon">
              {winner === 'PLAYER' ? '🏆' : '💀'}
            </div>
            <h2 className={winner === 'PLAYER' ? 'victory-title' : 'defeat-title'}>
              {winner === 'PLAYER' ? '¡VICTORIA!' : 'DERROTA'}
            </h2>
            <p className="game-over-desc">
              {winner === 'PLAYER'
                ? 'Has defendido con éxito tu Nexo y derrotado a la Inteligencia Artificial.'
                : 'Tu Comandante ha caído en combate. El Nexo ha sido destruido.'}
            </p>
            <div className="game-over-buttons">
              <button className="game-over-btn primary" onClick={handleRestart}>
                ⚔️ Jugar de Nuevo
              </button>
              <button className="game-over-btn secondary" onClick={onQuit}>
                🏠 Volver al Menú
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ═══════════════════════════════════════════════════
           GAME HUD — Premium Layout System
           ═══════════════════════════════════════════════════ */
        .game-hud {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          background: linear-gradient(180deg, #05060a 0%, #080a12 50%, #05060a 100%);
          overflow: hidden;
          padding: 6px;
          gap: 6px;
          font-family: var(--font-sans);
        }

        /* ═══ TOP BAR ═══ */
        .hud-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 16px;
          height: 50px;
          min-height: 50px;
          border-radius: 10px;
        }

        .top-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .opponent-info-compact {
          font-size: 0.82rem;
        }

        .commander-tag {
          font-family: var(--font-display);
          font-weight: 700;
          letter-spacing: 0.03em;
          font-size: 0.82rem;
        }
        .commander-tag.opponent { color: var(--color-furia); }
        .commander-tag.player { color: var(--color-arcano); }

        /* Mini health bar in top bar */
        .nexo-health-bar-mini {
          position: relative;
          width: 100px;
          height: 18px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 9px;
          overflow: hidden;
        }
        .nexo-bar-fill {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          border-radius: 9px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nexo-bar-fill.opponent {
          background: linear-gradient(90deg, #b91c1c, #ef4444, #f87171);
        }
        .nexo-bar-text {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 0.68rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .resource-badge {
          color: var(--color-text-muted);
          font-size: 0.78rem;
        }

        /* Turn indicator with pulsing dot */
        .game-status-center {
          flex-direction: column;
          gap: 2px;
        }
        .turn-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .turn-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse-dot 1.5s infinite;
        }
        .turn-dot.player-dot { background: var(--color-success); box-shadow: 0 0 6px var(--color-success); }
        .turn-dot.opponent-dot { background: var(--color-danger); box-shadow: 0 0 6px var(--color-danger); }

        .turn-label {
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #fff;
          font-family: var(--font-display);
        }

        .phase-tag {
          font-size: 0.68rem;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .phase-tag.player {
          background: rgba(16, 185, 129, 0.15);
          color: var(--color-success);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .phase-tag.opponent {
          background: rgba(239, 68, 68, 0.12);
          color: var(--color-danger);
          border: 1px solid rgba(239, 68, 68, 0.25);
          animation: glow-pulse 2s infinite;
        }

        /* Opponent mana compact orbs */
        .opponent-mana-compact {
          flex-direction: column;
          gap: 3px;
        }
        .mana-compact-group {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .mana-compact-label {
          font-size: 0.78rem;
        }
        .mana-compact-num {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--color-text-muted);
          min-width: 28px;
          text-align: right;
        }

        /* ═══ MANA ORBS ═══ */
        .mana-orbs-row {
          display: flex;
          gap: 3px;
          align-items: center;
        }
        .mana-orb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          transition: all 0.3s;
        }
        .mana-orb.furia.active {
          background: radial-gradient(circle at 35% 35%, #ff6b6b, var(--color-furia));
          box-shadow: 0 0 5px var(--color-furia-glow);
        }
        .mana-orb.arcano.active {
          background: radial-gradient(circle at 35% 35%, #66efff, var(--color-arcano));
          box-shadow: 0 0 5px var(--color-arcano-glow);
        }
        .mana-orb.spent {
          background: rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 0 3px rgba(0,0,0,0.4);
        }

        /* ═══ CENTER LAYOUT ═══ */
        .game-center-board {
          flex: 1;
          display: flex;
          gap: 6px;
          min-height: 0;
        }
        .board-canvas-area {
          flex: 1;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
        }

        /* ═══ SIDEBAR INSPECTOR ═══ */
        .hud-sidebar {
          width: 290px;
          min-width: 290px;
          display: flex;
          flex-direction: column;
          padding: 14px;
          gap: 10px;
          border-radius: 10px;
        }

        .inspector-card-hidden {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          margin-top: 15px;
          animation: slide-up 0.3s ease-out;
        }
        .inspected-card-preview-hidden {
          width: 140px;
          height: 190px;
          border: 2px dashed rgba(255, 255, 255, 0.15);
          border-radius: 9px;
          background: radial-gradient(circle at center, #111827 0%, #030712 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .hidden-card-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .hidden-card-placeholder .eye-icon {
          font-size: 2.2rem;
          opacity: 0.15;
        }
        .hidden-card-placeholder .question {
          font-size: 3rem;
          font-weight: bold;
          color: #818cf8;
          text-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
        }

        .sidebar-title {
          font-size: 0.95rem;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 6px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 6px;
        }
        .sidebar-title-icon {
          font-size: 1rem;
        }

        .inspector-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          min-height: 0;
          overflow-y: auto;
        }

        .sidebar-entity-info, .sidebar-card-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: slide-up 0.25s ease-out;
        }

        .inspected-card-preview {
          height: 40px;
          display: flex;
          justify-content: center;
        }

        /* Circular stat badges */
        .stats-grid {
          display: flex;
          justify-content: center;
          gap: 20px;
        }
        .stat-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .stat-circle {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.2rem;
          border: 2px solid;
          position: relative;
        }
        .stat-circle-val {
          font-family: var(--font-display);
        }
        .attack-circle {
          background: rgba(239, 68, 68, 0.12);
          border-color: #f87171;
          color: #f87171;
          box-shadow: 0 0 10px rgba(248, 113, 113, 0.2);
        }
        .health-circle {
          background: rgba(52, 211, 153, 0.12);
          border-color: #34d399;
          color: #34d399;
          box-shadow: 0 0 10px rgba(52, 211, 153, 0.2);
        }
        .stat-label {
          font-size: 0.6rem;
          color: var(--color-text-muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rules-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 8px 10px;
        }
        .rules-title {
          font-size: 0.62rem;
          color: var(--color-text-muted);
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 3px;
          letter-spacing: 0.04em;
        }
        .rules-desc {
          font-size: 0.78rem;
          line-height: 1.35;
          color: #d1d5db;
        }

        .frozen-banner-sidebar {
          background: rgba(0, 217, 255, 0.12);
          color: var(--color-arcano);
          border: 1px solid rgba(0, 217, 255, 0.25);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 5px;
          text-align: center;
          border-radius: 6px;
          animation: glow-pulse 2s infinite;
        }

        .actions-hint {
          display: flex;
          gap: 6px;
          margin-top: auto;
        }
        .hint-pill {
          flex: 1;
          font-size: 0.65rem;
          text-align: center;
          padding: 4px;
          border-radius: 4px;
          font-weight: 700;
        }
        .hint-pill.ready {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-success);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .hint-pill.spent {
          background: rgba(255, 255, 255, 0.04);
          color: var(--color-text-muted);
        }

        .badge-type {
          font-size: 0.62rem;
          text-transform: uppercase;
          background: rgba(255,255,255,0.06);
          padding: 3px 8px;
          border-radius: 4px;
          width: fit-content;
          color: var(--color-text-muted);
          letter-spacing: 0.04em;
          font-weight: 600;
        }

        .card-specs-mini {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }

        .spec-pill {
          font-size: 0.68rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 2px 7px;
          border-radius: 6px;
          color: #d1d5db;
        }

        .style-tag-pill {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.25);
          color: #a5b4fc;
        }

        .lore-box-sidebar {
          background: rgba(0, 0, 0, 0.18);
          border-left: 2px solid rgba(255, 255, 255, 0.1);
          padding: 8px 10px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .lore-desc {
          font-size: 0.72rem;
          font-style: italic;
          color: #9ca3af;
          line-height: 1.4;
        }

        .artist-credit-sidebar {
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.3);
          font-weight: 600;
        }

        .badge-row-sidebar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .badge-rarity-sidebar {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rules-desc-sidebar {
          font-size: 0.82rem;
          line-height: 1.5;
          color: #e5e7eb;
        }

        .action-btn-sidebar {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.25s;
          margin-top: auto;
          font-size: 0.85rem;
        }
        .action-btn-sidebar.play-mana {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: white;
          box-shadow: 0 2px 10px rgba(79, 70, 229, 0.3);
        }
        .action-btn-sidebar.play-mana:hover:not(:disabled) {
          background: linear-gradient(135deg, #4338ca, #4f46e5);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(79, 70, 229, 0.5);
        }
        .action-btn-sidebar.play-mana:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .sidebar-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
          padding: 20px 10px;
        }
        .placeholder-icon {
          font-size: 2rem;
          opacity: 0.3;
        }
        .sidebar-placeholder p {
          font-size: 0.78rem;
          color: var(--color-text-muted);
          font-style: italic;
          line-height: 1.5;
        }

        /* Action log */
        .action-log {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 6px;
          padding: 6px 8px;
          max-height: 80px;
          overflow-y: auto;
        }
        .action-log-title {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin-bottom: 4px;
          letter-spacing: 0.04em;
        }
        .action-log-empty {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.2);
          font-style: italic;
        }
        .action-log-entry {
          font-size: 0.68rem;
          color: #d1d5db;
          padding: 2px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          animation: slide-up 0.2s ease-out;
        }

        .sidebar-footer-controls {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .action-btn {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.25s;
          font-size: 0.85rem;
          font-family: var(--font-sans);
        }
        .action-btn.end-turn {
          background: rgba(255, 255, 255, 0.04);
          color: var(--color-text-muted);
          border-color: rgba(255,255,255,0.08);
          cursor: not-allowed;
        }
        .action-btn.end-turn.active {
          background: linear-gradient(135deg, #059669, #10b981);
          color: white;
          border-color: #059669;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
        }
        .action-btn.end-turn.active:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.5);
        }

        .action-btn.surrender {
          background: rgba(239, 68, 68, 0.06);
          color: rgba(239, 68, 68, 0.7);
          border-color: rgba(239, 68, 68, 0.12);
          font-size: 0.78rem;
        }
        .action-btn.surrender:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        /* ═══ BOTTOM BAR ═══ */
        .hud-bottom-bar {
          display: grid;
          grid-template-columns: 190px 1fr 190px;
          gap: 12px;
          height: 220px;
          min-height: 220px;
          padding: 10px 14px;
          border-radius: 10px;
          align-items: center;
          position: relative;
          transition: filter 0.4s;
        }

        .hud-bottom-bar.ai-thinking-dim {
          filter: brightness(0.5) saturate(0.6);
          pointer-events: none;
        }

        /* AI Thinking overlay on hand */
        .ai-thinking-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          z-index: 50;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 10px;
          backdrop-filter: blur(4px);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--color-text-muted);
          letter-spacing: 0.1em;
        }
        .ai-spinner {
          width: 22px;
          height: 22px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--color-arcano);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Player stats */
        .player-stats-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hp-bar-container {
          position: relative;
          width: 100%;
          height: 22px;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 11px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hp-bar-fill {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          background: linear-gradient(90deg, #047857, #059669, #10b981);
          border-radius: 11px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .hp-bar-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.15) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
        .hp-bar-label {
          position: relative;
          z-index: 5;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 3px rgba(0,0,0,0.6);
        }
        .deck-graveyard-stats {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        /* ═══ HAND SCROLL ═══ */
        .player-hand-container {
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .player-hand-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 20px 10px 10px 10px;
          align-items: flex-end;
          height: 100%;
        }

        .hand-card-wrapper {
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                      filter 0.3s;
          cursor: pointer;
          position: relative;
        }
        .hand-card-wrapper:hover {
          transform: translateY(-30px) scale(1.08);
          z-index: 100;
          filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.6));
        }
        .hand-card-wrapper.is-playable:hover {
          filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))
                  drop-shadow(0 8px 20px rgba(0, 0, 0, 0.6));
        }
        .hand-card-wrapper.is-selected {
          transform: translateY(-35px) scale(1.06);
          z-index: 99;
        }

        /* ═══ PLAYER MANA PANEL (RIGHT) ═══ */
        .player-mana-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mana-orb-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mana-orb-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mana-orb-icon {
          font-size: 0.72rem;
          font-weight: 700;
        }
        .arcano-text { color: var(--color-arcano); }
        .furia-text { color: var(--color-furia); }
        .mana-orb-count {
          font-size: 0.78rem;
          font-weight: 800;
          color: #fff;
          font-family: var(--font-display);
        }

        /* ═══ GAME OVER CINEMATIC ═══ */
        .game-over-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          animation: fadeIn 0.5s ease-out;
        }
        .game-over-box {
          width: 440px;
          padding: 50px 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
          animation: cinematic-entrance 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .game-over-box.victory {
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.15);
        }
        .game-over-box.defeat {
          border-color: rgba(239, 68, 68, 0.3);
          box-shadow: 0 0 40px rgba(239, 68, 68, 0.15);
        }
        .game-over-icon {
          font-size: 4rem;
          animation: pulse-dot 2s infinite;
        }
        .victory-title {
          font-size: 2.5rem;
          color: var(--color-success);
          text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
          font-family: var(--font-display);
        }
        .defeat-title {
          font-size: 2.5rem;
          color: var(--color-danger);
          text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
          font-family: var(--font-display);
        }
        .game-over-desc {
          color: var(--color-text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .game-over-buttons {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }
        .game-over-btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.25s;
          font-family: var(--font-sans);
          font-size: 0.9rem;
        }
        .game-over-btn.primary {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: white;
          box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
        }
        .game-over-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(79, 70, 229, 0.6);
        }
        .game-over-btn.secondary {
          background: rgba(255,255,255,0.05);
          color: white;
          border-color: rgba(255,255,255,0.12);
        }
        .game-over-btn.secondary:hover {
          background: rgba(255,255,255,0.12);
        }

        .animated-fade {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
