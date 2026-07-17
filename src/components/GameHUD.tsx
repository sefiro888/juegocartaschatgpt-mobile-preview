import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { CardDOM } from './CardDOM';
import { CARDS_DB } from '../core/cardsDb';
import type { BoardEntity } from '../types/card';
import { Volume2, VolumeX } from 'lucide-react';
import { getObstacleDefinition } from '../core/obstacleConfig';
import { isBoardObstacle } from '../core/boardPathfinding';

const Board3D = lazy(async () => {
  const module = await import('./board3d/Board3D');
  return { default: module.Board3D };
});

class BoardErrorBoundary extends React.Component<
  { children: React.ReactNode; onRecover: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="board-error-state" role="alert">
          <strong>El santuario no ha podido cargarse.</strong>
          <span>La partida se conserva. Puedes reiniciar solo el escenario 3D.</span>
          <button type="button" onClick={this.props.onRecover}>
            Recuperar escenario
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const TerrainInspector: React.FC<{ entity: BoardEntity }> = ({ entity }) => {
  const obstacle = getObstacleDefinition(entity.cardId);
  const integrityPercent = Math.max(0, Math.min(100, (entity.health / entity.maxHealth) * 100));

  return (
    <div className="terrain-inspector animated-fade">
      <div className="terrain-inspector-crest" aria-hidden="true">+</div>
      <div className="terrain-inspector-heading">
        <span>{obstacle.terrainLabel}</span>
        <h4>{obstacle.name}</h4>
      </div>
      <div className="terrain-integrity">
        <div className="terrain-integrity-label">
          <span>Integridad</span>
          <strong>{entity.health}/{entity.maxHealth}</strong>
        </div>
        <div className="terrain-integrity-track" aria-label={`Integridad ${entity.health} de ${entity.maxHealth}`}>
          <span style={{ width: `${integrityPercent}%` }} />
        </div>
      </div>
      <div className="terrain-rule-list">
        <span>Bloquea movimiento y rutas a traves de esta casilla.</span>
        <span>Los ataques y hechizos de dano pueden derribarlo.</span>
      </div>
      <p className="terrain-description">{obstacle.description}</p>
    </div>
  );
};

interface GameHUDProps {
  onQuit?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ onQuit }) => {
  const [boardRecoveryVersion, setBoardRecoveryVersion] = useState(0);
  const stateRecoveryAttempted = useRef(false);
  const {
    gameState,
    selectedCardInHand,
    selectedEntity,
    hoveredEntity,
    inspectedCard,
    gameEvents,
    selectCardInHand,
    selectEntity,
    setInspectedCard,
    playMana,
    endActiveTurn,
    startNewGame,
    joinOnlineGame,
    leaveOnlineGame,
    isAIThinking,
    soundEnabled,
    toggleSound,
    localController,
    onlineSession,
    onlineError,
    isOnlineLoading,
  } = useGameStore();

  const isEntityVisibleInHUD = (entity: BoardEntity) => {
    if (!gameState) return true;
    if (entity.controller === localController) return true;
    if (entity.cardId.startsWith('obstaculo-')) return true;

    const playerEntities = Object.values(gameState.board).filter((candidate) => candidate.controller === localController);
    if (entity.position.y <= 2) return true;

    return playerEntities.some((playerEntity) => {
      const dx = Math.abs(playerEntity.position.x - entity.position.x);
      const dy = Math.abs(playerEntity.position.y - entity.position.y);
      return (dx + dy) <= 2;
    });
  };

  const turn = gameState?.turn || 0;
  const activePlayer = gameState?.activePlayer || 'PLAYER';
  const isPlayerTurn = activePlayer === localController;

  useEffect(() => {
    if (gameState || stateRecoveryAttempted.current) return;
    const roomCode = new URLSearchParams(window.location.search).get('sala')?.trim().toUpperCase();
    if (!roomCode || roomCode.length !== 6) return;
    stateRecoveryAttempted.current = true;
    void joinOnlineGame(roomCode).catch(() => undefined);
  }, [gameState, joinOnlineGame]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'Escape') {
        if (inspectedCard) setInspectedCard(null);
        else {
          selectCardInHand(null);
          selectEntity(null);
        }
      }
      if (event.key === 'Enter' && !event.repeat && isPlayerTurn && !isAIThinking && !inspectedCard) {
        event.preventDefault();
        endActiveTurn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [endActiveTurn, inspectedCard, isAIThinking, isPlayerTurn, selectCardInHand, selectEntity, setInspectedCard]);

  if (!gameState) {
    return (
      <div className="game-state-recovery" role="status">
        <span className="game-state-recovery-spinner" />
        <strong>Recuperando la partida</strong>
        <p>{onlineError ?? 'Reconectando con el estado compartido del santuario.'}</p>
        {onlineError && (
          <button
            type="button"
            onClick={() => {
              if (onlineSession) void leaveOnlineGame();
              onQuit?.();
            }}
          >
            Volver al menu
          </button>
        )}
        <style>{`
          .game-state-recovery {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 9px;
            color: #eff8ff;
            background: #050a12;
          }
          .game-state-recovery p { margin: 0; color: #9fb5c3; font-size: 0.82rem; }
          .game-state-recovery-spinner {
            width: 30px;
            height: 30px;
            border: 3px solid rgba(124, 211, 255, 0.18);
            border-top-color: #73d8ff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          .game-state-recovery button {
            margin-top: 7px;
            padding: 8px 13px;
            border: 1px solid rgba(124, 211, 255, 0.42);
            border-radius: 6px;
            color: #eefaff;
            background: #176887;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  const { player: playerState, opponent: opponentState, winner } = gameState;
  const player = localController === 'PLAYER' ? playerState : opponentState;
  const opponent = localController === 'PLAYER' ? opponentState : playerState;
  const playerCommanderCard = CARDS_DB[player.commander.id];

  // Retrieve health from the actual commander entities on the board
  const playerCommanderEntity = Object.values(gameState.board).find(
    (entity) => entity.id === (localController === 'PLAYER' ? 'commander-player' : 'commander-opponent'),
  );
  const opponentCommanderEntity = Object.values(gameState.board).find(
    (entity) => entity.id === (localController === 'PLAYER' ? 'commander-opponent' : 'commander-player'),
  );

  const playerHealth = playerCommanderEntity ? playerCommanderEntity.health : 0;
  const opponentHealth = opponentCommanderEntity ? opponentCommanderEntity.health : 0;

  const handlePlayMana = (cardId: string) => {
    if (isPlayerTurn && !player.manaPlayedThisTurn) {
      playMana(cardId);
    }
  };

  const handleRestart = () => {
    const playerFaction = playerCommanderCard.faction === 'FURIA' ? 'FURIA' : 'ARCANO';
    startNewGame(playerFaction);
  };

  const handleEndTurn = () => {
    endActiveTurn();
  };

  const handleQuit = () => {
    if (onlineSession) void leaveOnlineGame();
    onQuit?.();
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
          <span className="commander-tag opponent">{onlineSession ? 'RIVAL (ONLINE)' : '🤖 RIVAL (IA)'}</span>
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
            {onlineError
              ? 'Conexion inestable'
              : onlineSession && isOnlineLoading
                ? 'Sincronizando...'
                : isPlayerTurn
                  ? '⚔️ Tu Turno'
                  : onlineSession ? 'Esperando al rival...' : '🤖 IA Pensando...'}
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
          <button
            type="button"
            className={`sound-toggle ${soundEnabled ? 'is-active' : ''}`}
            onClick={toggleSound}
            title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
            aria-label={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {onlineError && (
        <div className="online-sync-error" role="alert">
          {onlineError}
        </div>
      )}

      {/* ═══ CENTER LAYOUT: 3D BOARD & INSPECTOR SIDEBAR ═══ */}
      <div className="game-center-board">
        <div className="board-canvas-area">
          <BoardErrorBoundary
            key={boardRecoveryVersion}
            onRecover={() => setBoardRecoveryVersion((current) => current + 1)}
          >
            <Suspense
              fallback={
                <div className="board-loading" aria-label="Cargando el escenario">
                  <span />
                </div>
              }
            >
              <Board3D />
            </Suspense>
          </BoardErrorBoundary>
        </div>

        {/* SIDEBAR DETAILED INSPECTOR */}
        <div className={`hud-sidebar glass-panel ${hoveredEntity || selectedEntity || selectedCardInHand ? 'has-inspection' : ''}`}>
          <h3 className="sidebar-title">
            <span className="sidebar-title-icon">🔍</span>
            Inspector
          </h3>
          
          <div className="inspector-content">
            {hoveredEntity ? (
              isBoardObstacle(hoveredEntity) ? (
                <TerrainInspector entity={hoveredEntity} />
              ) : !isEntityVisibleInHUD(hoveredEntity) ? (
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
                    <CardDOM card={CARDS_DB[hoveredEntity.cardId]} mode="hand" />
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
              isBoardObstacle(selectedEntity) ? (
                <TerrainInspector entity={selectedEntity} />
              ) : !isEntityVisibleInHUD(selectedEntity) ? (
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
                    <CardDOM card={CARDS_DB[selectedEntity.cardId]} mode="hand" />
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
                <div className="inspected-card-preview hand-card-preview">
                  <CardDOM
                    card={selectedCardInHand}
                    mode="hand"
                    isSelected
                    isPlayable={isPlayerTurn}
                  />
                </div>
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
            {gameEvents.length === 0 ? (
              <div className="action-log-empty">Sin acciones aún</div>
            ) : (
              gameEvents.map(entry => (
                <div key={entry.id} className={`action-log-entry tone-${entry.tone}`}>
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
            <button className="action-btn surrender" onClick={handleQuit}>
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
          <div className="hand-stage-meta" aria-hidden="true">
            <span className="hand-stage-title">MANO</span>
            <span className="hand-stage-count">{player.hand.length} CARTAS</span>
          </div>
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
                  style={{
                    '--hand-rotation': `${(idx - (player.hand.length - 1) / 2) * 1.1}deg`,
                    '--hand-offset': `${Math.abs(idx - (player.hand.length - 1) / 2) * 2}px`,
                  } as React.CSSProperties}
                  onClick={() => selectCardInHand(isSelected ? null : card)}
                  onDoubleClick={() => setInspectedCard(card)}
                  title="Doble clic para ver la carta completa"
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
          <div className={`game-over-box glass-panel ${winner === localController ? 'victory' : 'defeat'}`}>
            <div className="game-over-icon">
              {winner === localController ? '🏆' : '💀'}
            </div>
            <h2 className={winner === localController ? 'victory-title' : 'defeat-title'}>
              {winner === localController ? '¡VICTORIA!' : 'DERROTA'}
            </h2>
            <p className="game-over-desc">
              {winner === localController
                ? onlineSession ? 'Has defendido con exito tu Nexo y derrotado a tu rival.' : 'Has defendido con exito tu Nexo y derrotado a la Inteligencia Artificial.'
                : onlineSession ? 'Tu rival ha derribado tu Nexo.' : 'Tu Comandante ha caido en combate. El Nexo ha sido destruido.'}
            </p>
            <div className="game-over-buttons">
              {!onlineSession && (
                <button className="game-over-btn primary" onClick={handleRestart}>
                  ⚔️ Jugar de Nuevo
                </button>
              )}
              <button className="game-over-btn secondary" onClick={handleQuit}>
                🏠 Volver al Menú
              </button>
            </div>
          </div>
        </div>
      )}

      {inspectedCard && (
        <div
          className="card-inspection-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Información de ${inspectedCard.name}`}
          onClick={() => setInspectedCard(null)}
        >
          <div className="card-inspection-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="card-inspection-close"
              aria-label="Cerrar información de la carta"
              onClick={() => setInspectedCard(null)}
            >
              X
            </button>

            <div className="card-inspection-art">
              <CardDOM card={inspectedCard} mode="inspected" />
            </div>

            <div className="card-inspection-details">
              <div className="card-inspection-kicker">{inspectedCard.faction} / {inspectedCard.rarity}</div>
              <h2>{inspectedCard.name}</h2>
              <p className="card-inspection-type">{inspectedCard.subtype || inspectedCard.type}</p>

              <div className="card-inspection-stats">
                <span>Coste {inspectedCard.cost.generic + (inspectedCard.cost.furia || 0) + (inspectedCard.cost.arcano || 0)}</span>
                {inspectedCard.attack !== undefined && <span>ATK {inspectedCard.attack}</span>}
                {inspectedCard.maxHealth !== undefined && <span>HP {inspectedCard.maxHealth}</span>}
                {inspectedCard.range !== undefined && <span>Rango {inspectedCard.range}</span>}
                {inspectedCard.movement !== undefined && <span>Movimiento {inspectedCard.movement}</span>}
              </div>

              <section className="card-inspection-section">
                <h3>Reglas</h3>
                <p>{inspectedCard.rulesText}</p>
              </section>

              <section className="card-inspection-section card-inspection-flavor">
                <h3>Historia</h3>
                <p>"{inspectedCard.flavorText}"</p>
              </section>

              <div className="card-inspection-footer">
                <span>Colección #{inspectedCard.cardNumber}/400</span>
                <span>{inspectedCard.artist ? `Arte: ${inspectedCard.artist}` : 'Arte del Nexo'}</span>
              </div>
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
          position: relative;
          background: #0a1119;
          overflow: hidden;
          padding: 0;
          gap: 0;
          font-family: var(--font-sans);
        }

        /* ═══ TOP BAR ═══ */
        .hud-top-bar {
          position: absolute;
          z-index: 30;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 20px 15px;
          height: 56px;
          min-height: 56px;
          border: 0;
          border-radius: 0;
          background: linear-gradient(180deg, rgba(5, 9, 15, 0.92) 0%, rgba(5, 9, 15, 0.58) 58%, transparent 100%);
          box-shadow: none;
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

        .online-sync-error {
          position: absolute;
          z-index: 42;
          top: 50px;
          left: 50%;
          max-width: min(520px, calc(100vw - 40px));
          padding: 7px 12px;
          border: 1px solid rgba(255, 145, 118, 0.55);
          border-radius: 6px;
          color: #ffe4dc;
          background: rgba(94, 28, 23, 0.9);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          font-size: 0.72rem;
          text-align: center;
          transform: translateX(-50%);
          pointer-events: none;
        }

        /* Opponent mana compact orbs */
        .opponent-mana-compact {
          flex-direction: column;
          gap: 3px;
          position: relative;
          padding-right: 34px;
        }
        .sound-toggle {
          position: absolute;
          right: 0;
          top: 50%;
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(188, 219, 235, 0.18);
          border-radius: 50%;
          color: #8aa5b5;
          background: rgba(7, 17, 26, 0.72);
          transform: translateY(-50%);
          cursor: pointer;
          transition: color 160ms ease, border-color 160ms ease, background 160ms ease;
        }
        .sound-toggle:hover,
        .sound-toggle.is-active {
          color: #dff7ff;
          border-color: rgba(116, 215, 255, 0.5);
          background: rgba(27, 83, 108, 0.52);
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
          position: absolute;
          inset: 0;
          z-index: 0;
          display: block;
        }
        .board-canvas-area {
          width: 100%;
          height: 100%;
          border-radius: 0;
          overflow: hidden;
          position: relative;
          border: 0;
          display: flex;
          flex-direction: column;
        }
        .board-loading {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 50% 42%, rgba(174, 219, 250, 0.88), rgba(97, 145, 186, 0.9) 38%, rgba(26, 48, 78, 0.96));
        }
        .board-loading span {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(232, 248, 255, 0.38);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: board-loading-spin 720ms linear infinite;
        }
        @keyframes board-loading-spin {
          to { transform: rotate(360deg); }
        }
        .board-error-state {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 12px;
          color: #eff8ff;
          background: #17263a;
          text-align: center;
        }
        .board-error-state button {
          min-width: 112px;
          border: 1px solid rgba(214, 239, 255, 0.68);
          border-radius: 5px;
          padding: 8px 12px;
          color: #ffffff;
          background: rgba(79, 145, 198, 0.58);
          cursor: pointer;
        }

        /* ═══ SIDEBAR INSPECTOR ═══ */
        .hud-sidebar {
          position: absolute;
          z-index: 32;
          top: 66px;
          right: 18px;
          bottom: 298px;
          width: 248px;
          min-width: 248px;
          display: flex;
          flex-direction: column;
          padding: 12px;
          gap: 10px;
          border: 1px solid rgba(200, 220, 238, 0.14);
          border-radius: 8px;
          background: rgba(6, 12, 20, 0.76);
          box-shadow: 0 14px 35px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(12px);
          pointer-events: auto;
        }

        .hud-sidebar .action-log {
          display: block;
          flex: 0 0 74px;
          min-height: 74px;
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

        .terrain-inspector {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 6px 2px;
        }
        .terrain-inspector-crest {
          width: 76px;
          height: 76px;
          display: grid;
          place-items: center;
          align-self: center;
          border: 1px solid rgba(119, 213, 255, 0.48);
          border-radius: 50%;
          color: #d7f6ff;
          font-size: 2rem;
          font-weight: 300;
          background: radial-gradient(circle at 35% 28%, rgba(149, 235, 255, 0.34), rgba(32, 75, 101, 0.42) 58%, rgba(5, 18, 29, 0.9));
          box-shadow: 0 0 20px rgba(74, 193, 255, 0.22), inset 0 0 18px rgba(123, 220, 255, 0.12);
        }
        .terrain-inspector-heading {
          text-align: center;
        }
        .terrain-inspector-heading span {
          display: block;
          color: #77cce7;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .terrain-inspector-heading h4 {
          margin: 3px 0 0;
          color: #f0fbff;
          font-size: 1.05rem;
        }
        .terrain-integrity {
          padding: 9px;
          border: 1px solid rgba(158, 216, 235, 0.14);
          border-radius: 6px;
          background: rgba(130, 204, 232, 0.06);
        }
        .terrain-integrity-label {
          display: flex;
          justify-content: space-between;
          color: #b9d6df;
          font-size: 0.7rem;
          font-weight: 700;
        }
        .terrain-integrity-label strong { color: #eafaff; }
        .terrain-integrity-track {
          height: 7px;
          margin-top: 7px;
          overflow: hidden;
          border-radius: 4px;
          background: rgba(3, 10, 16, 0.72);
        }
        .terrain-integrity-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #65d6ad, #baf1c9);
          box-shadow: 0 0 9px rgba(122, 232, 183, 0.6);
          transition: width 260ms ease;
        }
        .terrain-rule-list {
          display: grid;
          gap: 6px;
          color: #c7d7df;
          font-size: 0.72rem;
          line-height: 1.35;
        }
        .terrain-rule-list span {
          padding: 7px 8px 7px 23px;
          position: relative;
          border-left: 2px solid rgba(108, 209, 241, 0.58);
          background: rgba(255, 255, 255, 0.035);
        }
        .terrain-rule-list span::before {
          content: '•';
          position: absolute;
          left: 9px;
          color: #7cdbf7;
        }
        .terrain-description {
          margin: 0;
          color: #91aab5;
          font-size: 0.74rem;
          font-style: italic;
          line-height: 1.45;
        }

        .inspected-card-preview {
          height: 220px;
          display: flex;
          justify-content: center;
        }

        .inspected-card-preview .mode-hand {
          width: 154px;
          height: 220px;
        }
        .hand-card-preview {
          height: 202px;
        }
        .hand-card-preview .mode-hand {
          width: 140px;
          height: 200px;
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
          max-height: 74px;
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
        .action-log-entry.tone-move { color: #91d7ff; }
        .action-log-entry.tone-attack { color: #ffb08a; }
        .action-log-entry.tone-summon { color: #f7d783; }
        .action-log-entry.tone-spell { color: #cbb7ff; }
        .action-log-entry.tone-mana { color: #78e6ba; }
        .action-log-entry.tone-system { color: #c3ced8; }

        .sidebar-footer-controls {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          padding: 8px;
          border: 1px solid rgba(200, 220, 238, 0.13);
          border-radius: 8px;
          background: rgba(6, 12, 20, 0.78);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.26);
          backdrop-filter: blur(10px);
          pointer-events: auto;
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
          position: absolute;
          z-index: 31;
          left: 0;
          right: 0;
          bottom: 0;
          display: grid;
          grid-template-columns: 182px minmax(0, 1fr) 182px;
          gap: 24px;
          height: 298px;
          min-height: 298px;
          padding: 14px 26px 16px;
          border: 1px solid rgba(181, 219, 238, 0.12);
          border-radius: 14px 14px 0 0;
          align-items: end;
          background: linear-gradient(0deg, rgba(3, 9, 16, 0.98) 0%, rgba(5, 15, 24, 0.93) 56%, rgba(8, 20, 31, 0.42) 100%);
          box-shadow: 0 -12px 34px rgba(1, 7, 13, 0.28), inset 0 1px 0 rgba(223, 245, 255, 0.05);
          transition: filter 0.4s;
          isolation: isolate;
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
          align-self: end;
          margin-bottom: 12px;
          padding: 13px;
          border: 1px solid rgba(104, 212, 255, 0.22);
          border-radius: 9px;
          background: linear-gradient(145deg, rgba(10, 28, 39, 0.92), rgba(5, 13, 22, 0.9));
          box-shadow: inset 0 1px 0 rgba(203, 243, 255, 0.06), 0 8px 18px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(12px);
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
          min-width: 0;
          overflow: visible;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: stretch;
          padding: 9px 14px 8px;
          border: 1px solid rgba(171, 217, 238, 0.16);
          border-radius: 12px 12px 8px 8px;
          background: linear-gradient(180deg, rgba(17, 39, 52, 0.78), rgba(5, 14, 23, 0.9));
          box-shadow: inset 0 1px 0 rgba(231, 250, 255, 0.05), 0 14px 28px rgba(0, 0, 0, 0.22);
          position: relative;
        }
        .player-hand-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 12%;
          right: 12%;
          height: 1px;
          background: rgba(139, 221, 255, 0.32);
          box-shadow: 0 0 13px rgba(139, 221, 255, 0.24);
        }
        .hand-stage-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 22px;
          padding: 0 6px 4px;
        }
        .hand-stage-title {
          color: #dff6ff;
          font-family: var(--font-display);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
        }
        .hand-stage-count {
          padding: 3px 7px;
          border: 1px solid rgba(139, 221, 255, 0.18);
          border-radius: 5px;
          color: #89afc1;
          background: rgba(139, 221, 255, 0.06);
          font-size: 0.58rem;
          font-weight: 800;
          letter-spacing: 0.08em;
        }
        .player-hand-scroll {
          display: flex;
          flex: 1;
          gap: 18px;
          overflow-x: auto;
          padding: 2px 14px 8px;
          align-items: flex-end;
          box-sizing: border-box;
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 221, 255, 0.35) transparent;
        }

        .player-hand-scroll .mode-hand {
          width: 172px;
          height: 246px;
        }

        .hand-card-wrapper {
          flex-shrink: 0;
          transform: translateY(var(--hand-offset)) rotate(var(--hand-rotation));
          transform-origin: center bottom;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                      filter 0.3s;
          cursor: pointer;
          position: relative;
        }
        .hand-card-wrapper:hover {
          transform: translateY(-18px) rotate(0deg) scale(1.06);
          z-index: 100;
          filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.6));
        }
        .hand-card-wrapper.is-playable:hover {
          filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))
                  drop-shadow(0 8px 20px rgba(0, 0, 0, 0.6));
        }
        .hand-card-wrapper.is-selected {
          transform: translateY(-22px) rotate(0deg) scale(1.06);
          z-index: 99;
        }

        .hand-card-wrapper:focus-visible {
          outline: 2px solid #8bddff;
          outline-offset: 5px;
          border-radius: 12px;
        }

        /* Full card inspection: keeps the playable board visible behind a calm reading surface. */
        .card-inspection-overlay {
          position: fixed;
          inset: 0;
          z-index: 220;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          background: rgba(3, 8, 14, 0.72);
          backdrop-filter: blur(14px) saturate(0.9);
          animation: fadeIn 0.18s ease-out;
        }

        .card-inspection-modal {
          position: relative;
          display: grid;
          grid-template-columns: minmax(260px, 340px) minmax(320px, 1fr);
          gap: 34px;
          width: min(820px, 92vw);
          max-height: min(690px, 88vh);
          padding: 34px;
          overflow: auto;
          border: 1px solid rgba(183, 224, 245, 0.28);
          border-radius: 16px;
          background: linear-gradient(145deg, rgba(16, 29, 42, 0.98), rgba(7, 14, 23, 0.98));
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.72), 0 0 34px rgba(97, 190, 232, 0.12);
          animation: cinematic-entrance 0.28s ease-out both;
        }

        .card-inspection-art {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
        }

        .card-inspection-art .mode-inspected {
          width: min(320px, 30vw);
          height: min(460px, 66vh);
        }

        .card-inspection-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding: 8px 10px 4px 0;
        }

        .card-inspection-kicker {
          color: #8bddff;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .card-inspection-details h2 {
          margin-top: 8px;
          color: #f8fbff;
          font-size: clamp(1.55rem, 3vw, 2.3rem);
          line-height: 1.05;
        }

        .card-inspection-type {
          margin-top: 8px;
          color: #9fb5c5;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .card-inspection-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 24px 0 22px;
        }

        .card-inspection-stats span {
          padding: 7px 10px;
          border: 1px solid rgba(139, 221, 255, 0.2);
          border-radius: 7px;
          background: rgba(139, 221, 255, 0.08);
          color: #d9f5ff;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .card-inspection-section {
          padding: 16px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card-inspection-section h3 {
          margin-bottom: 7px;
          color: #c5d7e4;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .card-inspection-section p {
          color: #eef6fb;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .card-inspection-flavor p {
          color: #aebfca;
          font-style: italic;
        }

        .card-inspection-footer {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 8px 18px;
          margin-top: auto;
          padding-top: 18px;
          color: #718896;
          font-size: 0.68rem;
        }

        .card-inspection-close {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 2;
          width: 34px;
          height: 34px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          color: #e6f4fb;
          cursor: pointer;
          font-weight: 800;
        }

        .card-inspection-close:hover {
          background: rgba(255, 255, 255, 0.18);
        }

        /* ═══ PLAYER MANA PANEL (RIGHT) ═══ */
        .player-mana-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-self: end;
          margin-bottom: 12px;
          padding: 13px;
          border: 1px solid rgba(200, 220, 238, 0.18);
          border-radius: 9px;
          background: linear-gradient(145deg, rgba(16, 25, 40, 0.92), rgba(6, 12, 22, 0.9));
          box-shadow: inset 0 1px 0 rgba(236, 246, 255, 0.05), 0 8px 18px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(12px);
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

        @media (max-width: 900px) {
          .game-hud {
            padding: 4px;
            gap: 4px;
          }

          .hud-top-bar {
            height: 46px;
            min-height: 46px;
            padding: 5px 9px;
          }

          .opponent-info-compact .resource-badge,
          .opponent-mana-compact {
            display: none;
          }

          .game-center-board {
            position: relative;
            gap: 0;
          }

          .board-canvas-area {
            width: 100%;
          }

          .hud-sidebar {
            position: absolute;
            top: 8px;
            right: 8px;
            bottom: auto;
            z-index: 20;
            width: 142px;
            min-width: 0;
            padding: 0;
            border: 0;
            background: transparent;
            box-shadow: none;
          }

          .hud-sidebar .sidebar-title,
          .hud-sidebar .inspector-content,
          .hud-sidebar .action-log {
            display: none;
          }

          .sidebar-footer-controls {
            width: 142px;
            margin: 0;
            padding: 5px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 7px;
            background: rgba(5, 9, 16, 0.76);
            backdrop-filter: blur(8px);
          }

          .sidebar-footer-controls .action-btn {
            padding: 7px 5px;
            font-size: 0.68rem;
          }

          .hud-bottom-bar {
            grid-template-columns: 108px minmax(0, 1fr) 86px;
            height: 188px;
            min-height: 188px;
            gap: 6px;
            padding: 7px;
          }

          .player-hand-scroll {
            justify-content: flex-start;
            padding-inline: 4px;
          }

          .player-hand-scroll .mode-hand {
            width: 116px;
            height: 166px;
          }

          .card-inspection-overlay {
            padding: 16px;
          }

          .card-inspection-modal {
            grid-template-columns: minmax(180px, 230px) minmax(0, 1fr);
            gap: 20px;
            padding: 24px;
          }

          .card-inspection-art .mode-inspected {
            width: 220px;
            height: 316px;
          }

          .card-inspection-section p {
            font-size: 0.84rem;
          }
        }

        @media (max-width: 540px) {
          .commander-tag {
            font-size: 0.66rem;
          }

          .nexo-health-bar-mini {
            width: 82px;
          }

          .phase-tag {
            font-size: 0.57rem;
            padding-inline: 5px;
          }

          .hud-bottom-bar {
            grid-template-columns: 74px minmax(0, 1fr) 64px;
            height: 176px;
            min-height: 176px;
            gap: 4px;
            padding: 5px;
          }

          .player-stats-panel,
          .player-mana-panel {
            gap: 5px;
          }

          .player-stats-panel .commander-tag {
            font-size: 0.58rem;
          }

          .deck-graveyard-stats,
          .mana-orb-icon,
          .mana-orb-count {
            font-size: 0.6rem;
          }

          .mana-orb {
            width: 7px;
            height: 7px;
          }

          .action-btn.surrender {
            display: none;
          }

          .card-inspection-modal {
            grid-template-columns: 1fr;
            gap: 14px;
            padding: 22px 18px 18px;
          }

          .card-inspection-art .mode-inspected {
            width: 190px;
            height: 274px;
          }

          .card-inspection-details {
            padding: 0;
          }

          .card-inspection-stats {
            margin: 14px 0 8px;
          }
        }
      `}</style>
    </div>
  );
};
