import React, { useState } from 'react';
import { CARDS_DB } from '../core/cardsDb';
import { LORE_DB } from '../core/loreDb';
import { CardDOM } from './CardDOM';
import type { Card, Faction } from '../types/card';

interface GalleryProps {
  onBack?: () => void;
}

export const Gallery: React.FC<GalleryProps> = ({ onBack }) => {
  const [selectedFaction, setSelectedFaction] = useState<Faction | 'ALL'>('ALL');
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);

  const factions: { id: Faction | 'ALL'; name: string }[] = [
    { id: 'ALL', name: 'Todas' },
    { id: 'FURIA', name: 'Furia (Fuego)' },
    { id: 'ARCANO', name: 'Arcano (Hielo)' },
    { id: 'NATURALEZA', name: 'Naturaleza' },
    { id: 'ORDEN', name: 'Orden' },
    { id: 'SOMBRA', name: 'Sombra' },
    { id: 'VACIO', name: 'Vacío' },
  ];

  const cardsList = Object.values(CARDS_DB).sort((a, b) => a.cardNumber - b.cardNumber);

  const filteredCards = cardsList.filter(card => {
    if (selectedFaction === 'ALL') return true;
    return card.faction === selectedFaction;
  });

  return (
    <div className="gallery-view">
      <div className="gallery-header">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            ← Volver al Menú
          </button>
        )}
        <h1>Colección de Cartas</h1>
        <p className="gallery-subtitle">Muestra de las 400 cartas que habitan el Nexo</p>
      </div>

      {/* FACTION TABS */}
      <div className="faction-tabs">
        {factions.map(f => (
          <button
            key={f.id}
            className={`tab-button ${selectedFaction === f.id ? 'active' : ''}`}
            onClick={() => setSelectedFaction(f.id)}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* CARDS GRID */}
      <div className="gallery-grid-wrapper">
        <div className="gallery-grid">
          {filteredCards.map(card => (
            <div key={card.id} className="grid-card-item">
              <CardDOM
                card={card}
                mode="gallery"
                onClick={() => setInspectedCard(card)}
              />
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
        .gallery-view {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          background: radial-gradient(circle at center, #111520 0%, #050609 100%);
          padding: 24px 40px;
          overflow: hidden;
        }

        .gallery-header {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
          position: relative;
        }

        .back-button {
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
        .back-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .gallery-header h1 {
          font-size: 2.2rem;
          text-align: center;
          background: linear-gradient(90deg, #fff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .gallery-subtitle {
          text-align: center;
          color: var(--color-text-muted);
          font-size: 0.95rem;
          margin-top: 4px;
        }

        /* Tabs */
        .faction-tabs {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .tab-button {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--color-text-muted);
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-family: var(--font-sans);
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .tab-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.15);
        }

        .tab-button.active {
          background: #4f46e5;
          color: #fff;
          border-color: #6366f1;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
        }

        /* Grid */
        .gallery-grid-wrapper {
          flex: 1;
          overflow-y: auto;
          padding-right: 8px;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 24px;
          justify-items: center;
          padding-bottom: 40px;
        }

        .grid-card-item {
          transition: transform 0.2s;
        }
        .grid-card-item:hover {
          transform: translateY(-5px);
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
