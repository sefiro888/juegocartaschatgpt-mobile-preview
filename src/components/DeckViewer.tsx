import React, { useState } from 'react';
import { getPreconstructedDeck } from '../core/cardsDb';
import { LORE_DB } from '../core/loreDb';
import { CardDOM } from './CardDOM';
import type { Card } from '../types/card';

interface DeckViewerProps {
  onBack?: () => void;
}

export const DeckViewer: React.FC<DeckViewerProps> = ({ onBack }) => {
  const [activeFaction, setActiveFaction] = useState<'FURIA' | 'ARCANO'>('FURIA');
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);

  const deck = getPreconstructedDeck(activeFaction);

  // Group deck cards to display count
  const groupedCards: { card: Card; count: number }[] = [];
  deck.forEach(card => {
    const existing = groupedCards.find(item => item.card.id === card.id);
    if (existing) {
      existing.count++;
    } else {
      groupedCards.push({ card, count: 1 });
    }
  });

  // Sort grouped: Commander first, then Mana, then by generic cost
  groupedCards.sort((a, b) => {
    if (a.card.type === 'COMANDANTE') return -1;
    if (b.card.type === 'COMANDANTE') return 1;
    if (a.card.type === 'MANA' && b.card.type !== 'MANA') return -1;
    if (b.card.type === 'MANA' && a.card.type !== 'MANA') return 1;
    return a.card.cost.generic - b.card.cost.generic;
  });

  return (
    <div className="deck-viewer">
      <div className="deck-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            ← Volver al Menú
          </button>
        )}
        <h1>Visor de Mazos</h1>
        <p className="deck-subtitle">Explora la composición de los mazos oficiales de 50 cartas</p>
      </div>

      <div className="deck-tabs">
        <button
          className={`tab-btn furia ${activeFaction === 'FURIA' ? 'active' : ''}`}
          onClick={() => setActiveFaction('FURIA')}
        >
          Mazo de Furia (Ignis)
        </button>
        <button
          className={`tab-btn arcano ${activeFaction === 'ARCANO' ? 'active' : ''}`}
          onClick={() => setActiveFaction('ARCANO')}
        >
          Mazo de Arcano (Aethelgard)
        </button>
      </div>

      <div className="deck-content-wrapper">
        {/* Left: Deck Stats Summary */}
        <div className="deck-stats-panel glass-panel">
          <h2>Estadísticas del Mazo</h2>
          <div className="stat-row">
            <span>Total Cartas:</span>
            <strong>{deck.length}</strong>
          </div>
          <div className="stat-row">
            <span>Fuentes de Maná:</span>
            <strong>{deck.filter(c => c.type === 'MANA').length} (40%)</strong>
          </div>
          <div className="stat-row">
            <span>Unidades:</span>
            <strong>{deck.filter(c => c.type === 'UNIDAD').length}</strong>
          </div>
          <div className="stat-row">
            <span>Hechizos:</span>
            <strong>{deck.filter(c => c.type === 'HECHIZO').length}</strong>
          </div>
          <div className="stat-row">
            <span>Estructuras:</span>
            <strong>{deck.filter(c => c.type === 'ESTRUCTURA').length}</strong>
          </div>

          <div className="deck-lore-notes">
            {activeFaction === 'FURIA' ? (
              <p>El mazo de Furia se enfoca en unidades de ataque rápido como el *Sabueso de Brasa* y hechizos de daño como *Lluvia de Ceniza* para aniquilar al comandante rival rápidamente.</p>
            ) : (
              <p>El mazo de Arcano utiliza efectos de control mediante el congelamiento del *Centinela de Cristal* e incrementa sus recursos con la *Torre del Horizonte* para robar cartas adicionales.</p>
            )}
          </div>
        </div>

        {/* Right: Card list with count badges */}
        <div className="deck-cards-list">
          {groupedCards.map(({ card, count }) => (
            <div key={card.id} className="deck-card-row-item" onClick={() => setInspectedCard(card)}>
              <div className="deck-card-preview-container">
                <CardDOM card={card} mode="deck-preview" />
              </div>
              <div className="deck-card-count-badge">
                x{count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INSPECTION MODAL — PREMIUM LORE VAULT */}
      {inspectedCard && (() => {
        const lore = LORE_DB[inspectedCard.id] || {
          title: inspectedCard.name,
          history: [inspectedCard.flavorText],
          quote: inspectedCard.flavorText,
          artistNote: 'Ilustración del nexo.'
        };
        return (
          <div className="lore-vault-overlay" onClick={() => setInspectedCard(null)}>
            <div className="lore-vault-content glass-panel-heavy" onClick={e => e.stopPropagation()}>
              <button className="close-vault-button" onClick={() => setInspectedCard(null)}>
                ✕
              </button>
              
              {/* Left Column: Premium card display */}
              <div className="vault-left-col">
                <div className="vault-card-wrapper">
                  <CardDOM card={inspectedCard} mode="inspected" />
                </div>
              </div>

              {/* Right Column: Immersive lore dossier */}
              <div className="vault-right-col">
                <div className="vault-header">
                  <span className="vault-rarity-badge" style={{ borderColor: `var(--rarity-${inspectedCard.rarity.toLowerCase()})`, color: `var(--rarity-${inspectedCard.rarity.toLowerCase()})` }}>
                    🛡️ {inspectedCard.rarity}
                  </span>
                  <span className="vault-faction-badge">{inspectedCard.faction}</span>
                  {inspectedCard.subtype && <span className="vault-subtype-badge">{inspectedCard.subtype}</span>}
                </div>

                <h1 className="vault-title">{lore.title}</h1>
                <div className="vault-divider" />

                {/* Quick Stats overview */}
                {(inspectedCard.attack !== undefined || inspectedCard.maxHealth !== undefined || inspectedCard.range !== undefined) && (
                  <div className="vault-stats-bar">
                    {inspectedCard.attack !== undefined && (
                      <div className="vault-stat-item">
                        <span className="vault-stat-icon red-text">⚔️</span>
                        <span className="vault-stat-val">{inspectedCard.attack} Atk</span>
                      </div>
                    )}
                    {inspectedCard.maxHealth !== undefined && (
                      <div className="vault-stat-item">
                        <span className="vault-stat-icon green-text">❤️</span>
                        <span className="vault-stat-val">{inspectedCard.maxHealth} HP</span>
                      </div>
                    )}
                    {inspectedCard.range !== undefined && (
                      <div className="vault-stat-item">
                        <span className="vault-stat-icon blue-text">🎯</span>
                        <span className="vault-stat-val">Rango {inspectedCard.range}</span>
                      </div>
                    )}
                    {inspectedCard.movement !== undefined && (
                      <div className="vault-stat-item">
                        <span className="vault-stat-icon yellow-text">👣</span>
                        <span className="vault-stat-val">Mov {inspectedCard.movement}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* History chapters */}
                <div className="vault-history-scroll">
                  {lore.history.map((paragraph, idx) => (
                    <p key={idx} className="vault-paragraph">{paragraph}</p>
                  ))}
                </div>

                {/* Big Immersive Quote */}
                <div className="vault-quote-block">
                  <p className="vault-quote-text">{lore.quote}</p>
                </div>

                {/* Footer artist metadata */}
                <div className="vault-artist-footer">
                  <div className="vault-artist-info">
                    <span className="artist-label">ARTISTA</span>
                    <span className="artist-name">{inspectedCard.artist || 'Desconocido'}</span>
                  </div>
                  <div className="vault-artist-info">
                    <span className="artist-label">ESTILO</span>
                    <span className="artist-name style-tag">{inspectedCard.artistStyle || 'Tradicional'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        .deck-viewer {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          background: radial-gradient(circle at center, #0d111b 0%, #040609 100%);
          padding: 24px 40px;
          overflow: hidden;
        }

        .deck-header {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
          position: relative;
        }

        .back-btn {
          position: absolute;
          top: 0;
          left: 0;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-family: var(--font-sans);
          font-weight: 500;
          transition: background 0.2s;
        }
        .back-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .deck-header h1 {
          font-size: 2.2rem;
          text-align: center;
          background: linear-gradient(90deg, #fff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .deck-subtitle {
          text-align: center;
          color: var(--color-text-muted);
          font-size: 0.95rem;
          margin-top: 4px;
        }

        .deck-tabs {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .tab-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--color-text-muted);
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-family: var(--font-sans);
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .tab-btn.furia.active {
          background: var(--color-furia-bg);
          color: #fff;
          border-color: var(--color-furia);
          box-shadow: 0 0 12px var(--color-furia-glow);
        }

        .tab-btn.arcano.active {
          background: var(--color-arcano-bg);
          color: #fff;
          border-color: var(--color-arcano);
          box-shadow: 0 0 12px var(--color-arcano-glow);
        }

        .deck-content-wrapper {
          display: flex;
          flex: 1;
          gap: 30px;
          overflow: hidden;
          padding-bottom: 20px;
        }

        .deck-stats-panel {
          width: 320px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .deck-stats-panel h2 {
          font-size: 1.4rem;
          color: #fff;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 8px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
        }

        .stat-row span {
          color: var(--color-text-muted);
        }

        .deck-lore-notes {
          margin-top: auto;
          font-size: 0.85rem;
          color: var(--color-text-muted);
          line-height: 1.5;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 16px;
        }

        .deck-cards-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          padding-right: 10px;
        }

        .deck-card-row-item {
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
        }

        .deck-card-preview-container {
          flex: 1;
          height: 50px;
        }

        .deck-card-count-badge {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 1rem;
          width: 60px;
          text-align: center;
        }

        /* Lore Vault Premium Modal Styles */
        .lore-vault-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(16px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 200;
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lore-vault-content {
          position: relative;
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 40px;
          padding: 40px;
          max-width: 950px;
          width: 92%;
          max-height: 90vh;
          overflow: hidden;
          animation: cinematic-entrance 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .close-vault-button {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 1.2rem;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s;
          z-index: 10;
        }
        .close-vault-button:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
          transform: rotate(90deg);
        }

        .vault-left-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .vault-card-wrapper {
          transform: scale(1.05);
          filter: drop-shadow(0 15px 30px rgba(0,0,0,0.6));
        }

        .vault-right-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: calc(90vh - 80px);
          overflow-y: auto;
          padding-right: 12px;
        }

        .vault-header {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .vault-rarity-badge, .vault-faction-badge, .vault-subtype-badge {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .vault-rarity-badge {
          background: rgba(0,0,0,0.4);
        }
        .vault-faction-badge {
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border-color: rgba(99, 102, 241, 0.25);
        }
        .vault-subtype-badge {
          background: rgba(255, 255, 255, 0.03);
          color: var(--color-text-muted);
        }

        .vault-title {
          font-family: var(--font-display);
          font-size: 2.4rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .vault-divider {
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.1), transparent);
          width: 100%;
        }

        .vault-stats-bar {
          display: flex;
          gap: 16px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.03);
          padding: 8px 16px;
          border-radius: 8px;
          width: fit-content;
        }
        .vault-stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .vault-stat-icon {
          font-size: 0.95rem;
        }
        .vault-stat-val {
          font-size: 0.8rem;
          font-weight: 700;
          font-family: var(--font-display);
          color: #e5e7eb;
        }
        .red-text { color: #f87171; }
        .green-text { color: #34d399; }
        .blue-text { color: #60a5fa; }
        .yellow-text { color: #fbbf24; }

        .vault-history-scroll {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .vault-paragraph {
          font-size: 0.92rem;
          line-height: 1.6;
          color: #d1d5db;
        }

        .vault-quote-block {
          background: rgba(251, 191, 36, 0.03);
          border-left: 3px solid #fbbf24;
          padding: 14px 18px;
          border-radius: 4px;
          margin-top: 10px;
          box-shadow: inset 0 0 10px rgba(251, 191, 36, 0.02);
        }
        .vault-quote-text {
          font-size: 1rem;
          font-style: italic;
          color: #fbbf24;
          line-height: 1.5;
          font-family: Georgia, serif;
        }

        .vault-artist-footer {
          display: flex;
          gap: 30px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 16px;
          margin-top: auto;
        }
        .vault-artist-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .artist-label {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
        }
        .artist-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #f3f4f6;
        }
        .artist-name.style-tag {
          color: var(--color-arcano);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
