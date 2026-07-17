import React, { useEffect, useMemo, useState } from 'react';
import type { Card } from '../types/card';
import { getCardArtCandidates } from '../core/publicAssets';

interface CardDOMProps {
  card: Card;
  mode?: 'thumbnail' | 'hand' | 'board' | 'gallery' | 'inspected' | 'deck-preview';
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
}

export const CardDOM: React.FC<CardDOMProps> = ({
  card,
  mode = 'gallery',
  isSelected = false,
  isPlayable = false,
  onClick,
}) => {
  const artCandidates = useMemo(
    () => getCardArtCandidates(card),
    [card],
  );
  const [artCandidateIndex, setArtCandidateIndex] = useState(0);
  const imgSrc = artCandidates[Math.min(artCandidateIndex, artCandidates.length - 1)];

  useEffect(() => {
    setArtCandidateIndex(0);
  }, [artCandidates]);

  const handleImageError = () => {
    setArtCandidateIndex((current) => Math.min(current + 1, artCandidates.length - 1));
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'RARA': return 'var(--rarity-rara)';
      case 'EPICA': return 'var(--rarity-epica)';
      case 'LEGENDARIA': return 'var(--rarity-legendaria)';
      default: return 'var(--rarity-comun)';
    }
  };

  const isMana = card.type === 'MANA';
  const factionClass = card.faction === 'FURIA' ? 'furia-card' : 'arcano-card';
  const isLarge = mode === 'gallery' || mode === 'inspected';
  const isBoard = mode === 'board';
  const isLegendaria = card.rarity === 'LEGENDARIA';
  const isEpica = card.rarity === 'EPICA';
  const hasStats = (card.type === 'UNIDAD' || card.type === 'COMANDANTE' || card.type === 'ESTRUCTURA') && mode !== 'thumbnail' && mode !== 'board';

  return (
    <div
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Ver detalles de ${card.name}` : undefined}
      className={[
        'card-container',
        factionClass,
        `mode-${mode}`,
        isSelected ? 'selected' : '',
        isPlayable ? 'playable' : '',
        isLegendaria ? 'rarity-legendaria' : '',
        isEpica ? 'rarity-epica' : '',
      ].filter(Boolean).join(' ')}
      style={{
        borderColor: getRarityColor(card.rarity),
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* MAGICAL BORDER INLAY */}
      <div className="card-border-inlay" />

      {/* HOLOGRAPHIC SHIMMER OVERLAY for LEGENDARIA */}
      {isLegendaria && <div className="holo-shimmer-overlay" />}

      {/* COST CONTAINER (only for non-mana cards) */}
      {!isMana && mode !== 'thumbnail' && mode !== 'board' && (
        <div className="card-cost-badge">
          {card.cost.generic > 0 && <span className="generic-cost">{card.cost.generic}</span>}
          {card.faction === 'FURIA' && card.cost.furia ? (
            <span className="faction-cost furia-icon">🔥{card.cost.furia}</span>
          ) : card.faction === 'ARCANO' && card.cost.arcano ? (
            <span className="faction-cost arcano-icon">❄️{card.cost.arcano}</span>
          ) : null}
        </div>
      )}

      {/* CARD HEADER */}
      {mode !== 'board' && (
        <div className="card-header">
          <div className="card-title">{card.name}</div>
          {mode !== 'thumbnail' && <div className="card-type-label">{card.subtype || card.type}</div>}
        </div>
      )}

      {/* ILLUSTRATION (Framed like a TCG card) */}
      {mode !== 'thumbnail' && (
        <div className="card-illustration-container">
          <img
            src={imgSrc}
            alt={card.name}
            onError={handleImageError}
            className="card-illustration"
            draggable={false}
          />
        </div>
      )}

      {/* CARD BODY (Framed Text Box) */}
      {!isBoard && mode !== 'thumbnail' && (
        <div className={['card-body', hasStats ? 'has-stats' : ''].filter(Boolean).join(' ')}>
          {/* Watermark in background */}
          <div className={`card-watermark ${card.faction === 'FURIA' ? 'furia-watermark' : 'arcano-watermark'}`}>
            {card.faction === 'FURIA' ? '🔥' : '❄️'}
          </div>

          <div className="card-rules">{card.rulesText}</div>
          {isLarge && (card.range !== undefined || card.movement !== undefined) && (
            <div className="card-attributes-row">
              {card.range !== undefined && <span className="attr-pill">🎯 Rango: {card.range}</span>}
              {card.movement !== undefined && <span className="attr-pill">👣 Mov: {card.movement}</span>}
            </div>
          )}
          {isLarge && <div className="card-flavor">"{card.flavorText}"</div>}
          {isLarge && card.artist && (
            <div className="card-artist-line">
              <span>🎨 {card.artist}</span>
              <span className="artist-style-tag">{card.artistStyle}</span>
            </div>
          )}
        </div>
      )}

      {/* STATS (ATTACK / HEALTH) — runic circular medals */}
      {(card.type === 'UNIDAD' || card.type === 'COMANDANTE' || card.type === 'ESTRUCTURA') && mode !== 'thumbnail' && (
        <div className="card-stats">
          {card.attack !== undefined && (
            <div className="stat-badge stat-attack-badge">
              <span className="badge-ring" />
              <span className="stat-val">{card.attack}</span>
            </div>
          )}
          {card.maxHealth !== undefined && (
            <div className="stat-badge stat-health-badge">
              <span className="badge-ring" />
              <span className="stat-val">{mode === 'board' && card.health !== undefined ? card.health : card.maxHealth}</span>
            </div>
          )}
        </div>
      )}

      {/* COMPACT BOARD INFO */}
      {isBoard && (
        <div className="card-board-content">
          <div className="board-card-name">{card.name}</div>
          <div className="board-card-type">{card.subtype || card.type}</div>
        </div>
      )}

      {/* CARD COLLECTION NUMBER — updated to /400 */}
      {isLarge && (
        <div className="card-footer-number">
          #{card.cardNumber}/400 • {card.rarity}
        </div>
      )}

      <style>{`
        .card-container {
          position: relative;
          display: flex;
          flex-direction: column;
          border: 2px solid #555;
          border-radius: 12px;
          background: #151821;
          user-select: none;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1),
                      box-shadow 0.35s,
                      border-color 0.35s;
          overflow: hidden;
          width: 100%;
          height: 100%;
          perspective: 800px;
        }

        /* 3D tilt on hover */
        .card-container:hover {
          transform: perspective(600px) rotateY(4deg) rotateX(-3deg) translateY(-2px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8);
        }

        /* Runic card border inlay (inner frame decoration) */
        .card-border-inlay {
          position: absolute;
          inset: 3px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9px;
          pointer-events: none;
          z-index: 10;
        }
        
        .rarity-legendaria .card-border-inlay {
          border-color: rgba(251, 191, 36, 0.35);
          box-shadow: inset 0 0 4px rgba(251, 191, 36, 0.15);
        }
        .rarity-epica .card-border-inlay {
          border-color: rgba(168, 85, 247, 0.35);
          box-shadow: inset 0 0 4px rgba(168, 85, 247, 0.15);
        }
        .rarity-rara .card-border-inlay {
          border-color: rgba(59, 130, 246, 0.3);
        }

        /* Faction backgrounds - magical textures */
        .furia-card {
          background: linear-gradient(135deg, #180909 0%, #0c0404 100%);
          box-shadow: inset 0 0 15px rgba(239, 68, 68, 0.15), 0 8px 20px rgba(0,0,0,0.6);
        }
        
        .arcano-card {
          background: linear-gradient(135deg, #09131e 0%, #03070b 100%);
          box-shadow: inset 0 0 15px rgba(0, 217, 255, 0.15), 0 8px 20px rgba(0,0,0,0.6);
        }

        .selected {
          transform: translateY(-8px) scale(1.03) !important;
          box-shadow: 0 0 25px var(--rarity-legendaria) !important;
          border-color: var(--rarity-legendaria) !important;
        }

        .playable {
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.7);
          border-color: var(--color-success) !important;
        }

        /* Pulsing border animations */
        .rarity-epica {
          border: 2.2px solid #a855f7 !important;
          box-shadow: 0 0 16px rgba(168, 85, 247, 0.35), inset 0 0 10px rgba(168, 85, 247, 0.15) !important;
          animation: epic-border-pulse 2.5s ease-in-out infinite;
        }

        .rarity-legendaria {
          border: 2.5px solid #fbbf24 !important;
          box-shadow: 0 0 22px rgba(251, 191, 36, 0.45), inset 0 0 12px rgba(251, 191, 36, 0.2) !important;
        }
        
        .rarity-rara {
          border: 2px solid #3b82f6 !important;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.25), inset 0 0 8px rgba(59, 130, 246, 0.1) !important;
        }

        .rarity-comun {
          border: 2px solid #6b7280 !important;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
        }

        .holo-shimmer-overlay {
          position: absolute;
          inset: 0;
          z-index: 15;
          pointer-events: none;
          background: linear-gradient(
            105deg,
            transparent 20%,
            rgba(251, 191, 36, 0.1) 30%,
            rgba(168, 85, 247, 0.12) 40%,
            rgba(59, 130, 246, 0.1) 50%,
            rgba(16, 185, 129, 0.1) 60%,
            rgba(251, 191, 36, 0.08) 70%,
            transparent 80%
          );
          background-size: 200% 100%;
          animation: shimmer 4.5s linear infinite;
          border-radius: 11px;
          mix-blend-mode: screen;
        }

        /* Cost Badge - Runic Stone design */
        .card-cost-badge {
          position: absolute;
          top: 8px;
          right: 10px;
          display: flex;
          gap: 3px;
          z-index: 20;
          background: radial-gradient(circle at 35% 35%, #2a2e3d, #12141a);
          padding: 4px 9px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 800;
          font-family: var(--font-display);
          box-shadow: 0 4px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .generic-cost {
          color: #fff;
        }

        .faction-cost {
          display: flex;
          align-items: center;
        }

        /* Card Header - Metallic Nameplate */
        .card-header {
          padding: 7px 12px;
          margin: 6px 8px 0 8px;
          display: flex;
          flex-direction: column;
          background: linear-gradient(90deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.01) 100%);
          border-bottom: 1.2px solid rgba(255,255,255,0.1);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
          border-radius: 4px;
          z-index: 5;
        }

        .card-title {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #fff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.9);
        }

        .card-type-label {
          font-size: 0.62rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 1px;
        }

        /* Card Illustration Window */
        .card-illustration-container {
          position: relative;
          margin: 6px 8px 0 8px;
          height: 48%;
          background: #000;
          overflow: hidden;
          border-radius: 6px;
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.85), 0 3px 6px rgba(0,0,0,0.4);
          z-index: 5;
        }

        .card-illustration {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .card-container:hover .card-illustration {
          transform: scale(1.06);
        }

        /* Card Body - Obsidian Scroll plate */
        .card-body {
          flex: 1;
          margin: 6px 8px 8px 8px;
          padding: 8px 10px;
          border-radius: 6px;
          background: rgba(8, 10, 15, 0.85);
          border: 1.2px solid rgba(255, 255, 255, 0.06);
          box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.95);
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          font-size: 0.72rem;
          line-height: 1.25;
          overflow: hidden;
          position: relative;
          z-index: 5;
          gap: 6px;
        }

        .card-body.has-stats {
          padding-bottom: 28px; /* Safe space to prevent overlapping statistics circles! */
        }

        /* Subtle Watermark */
        .card-watermark {
          position: absolute;
          bottom: -15px;
          right: -10px;
          font-size: 4.5rem;
          opacity: 0.035;
          pointer-events: none;
          z-index: 0;
          user-select: none;
          transform: rotate(-15deg);
        }

        .card-rules {
          color: #e2e8f0;
          overflow-y: auto;
          margin-bottom: 2px;
          z-index: 1;
          font-weight: 500;
        }

        .card-flavor {
          font-style: italic;
          color: #a0aec0;
          font-size: 0.65rem;
          opacity: 0.85;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 4px;
          margin-top: auto;
          z-index: 1;
        }

        .card-attributes-row {
          display: flex;
          gap: 6px;
          margin-bottom: 4px;
          z-index: 1;
        }

        .attr-pill {
          font-size: 0.6rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1px 5px;
          border-radius: 4px;
          color: var(--color-text-muted);
        }

        .card-artist-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.58rem;
          color: rgba(255, 255, 255, 0.35);
          margin-top: 2px;
          border-top: 1px dashed rgba(255, 255, 255, 0.05);
          padding-top: 3px;
          z-index: 1;
        }

        .artist-style-tag {
          font-size: 0.52rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 0 4px;
          border-radius: 3px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          color: var(--color-text-muted);
        }

        /* ═══ COMBAT STAT MEDALS (MTG Style Corner overlap) ═══ */
        .card-stats {
          position: absolute;
          bottom: 3px;
          left: 3px;
          right: 3px;
          display: flex;
          justify-content: space-between;
          z-index: 20;
          pointer-events: none;
        }

        .stat-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.92rem;
          font-weight: 900;
          font-family: var(--font-display);
          border: 2px solid;
          position: relative;
          box-shadow: 0 4px 10px rgba(0,0,0,0.7);
        }

        .badge-ring {
          position: absolute;
          inset: 1px;
          border: 1px dashed rgba(255,255,255,0.25);
          border-radius: 50%;
          pointer-events: none;
        }

        .stat-val {
          z-index: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }

        .stat-attack-badge {
          background: radial-gradient(circle at 35% 30%, #991b1b, #450a0a);
          color: #fecaca;
          border-color: #ef4444;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.35), 0 4px 10px rgba(0,0,0,0.7);
        }

        .stat-health-badge {
          background: radial-gradient(circle at 35% 30%, #065f46, #022c22);
          color: #a7f3d0;
          border-color: #10b981;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.35), 0 4px 10px rgba(0,0,0,0.7);
        }

        .card-footer-number {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.52rem;
          color: rgba(255,255,255,0.25);
          z-index: 15;
          pointer-events: none;
          font-weight: 500;
        }

        /* ═══ MODES ═══ */
        .mode-hand {
          width: 140px;
          height: 200px;
          font-size: 0.7rem;
        }
        
        .mode-hand .card-title {
          font-size: 0.8rem;
        }

        .mode-hand:hover {
          transform: none;
        }

        .mode-gallery {
          width: 200px;
          height: 290px;
        }

        .mode-inspected {
          width: 320px;
          height: 460px;
          font-size: 0.85rem;
        }
        
        .mode-inspected .card-title {
          font-size: 1.2rem;
        }
        
        .mode-inspected .card-rules {
          font-size: 0.85rem;
        }
        
        .mode-inspected .card-flavor {
          font-size: 0.78rem;
        }

        .mode-thumbnail {
          width: 120px;
          height: 40px;
          flex-direction: row;
          align-items: center;
          padding: 0 8px;
          border-radius: 6px;
        }
        .mode-thumbnail:hover {
          transform: none;
        }
        
        .mode-thumbnail .card-header {
          border: none;
          padding: 0;
          flex: 1;
          margin: 0;
        }
        
        .mode-thumbnail .card-title {
          font-size: 0.75rem;
        }

        .mode-thumbnail .card-border-inlay {
          display: none;
        }

        /* Board representation compact mode */
        .mode-board {
          width: 100px;
          height: 100px;
          border-radius: 8px;
          padding: 6px;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        .mode-board:hover {
          transform: none;
        }
        
        .mode-board .card-border-inlay {
          display: none;
        }

        .card-board-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 100%;
        }

        .board-card-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .board-card-type {
          font-size: 0.6rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }

        .mode-deck-preview {
          width: 100%;
          height: 50px;
          flex-direction: row;
          align-items: center;
          padding: 0 10px;
          border-radius: 6px;
          border-width: 1px;
          background: rgba(20, 24, 33, 0.9);
        }
        .mode-deck-preview:hover {
          background: rgba(30, 36, 48, 0.95);
          transform: none;
        }
        .mode-deck-preview .card-title {
          font-size: 0.8rem;
          flex: 1;
        }
        .mode-deck-preview .card-cost-badge {
          position: static;
          background: none;
          padding: 0;
          box-shadow: none;
          border: none;
        }
        .mode-deck-preview .card-border-inlay {
          display: none;
        }
      `}</style>
    </div>
  );
};
