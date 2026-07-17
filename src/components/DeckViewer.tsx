import React, { useEffect, useMemo, useState } from 'react';
import { getPreconstructedDeck } from '../core/cardsDb';
import { LORE_DB } from '../core/loreDb';
import { CardDOM } from './CardDOM';
import type { Card } from '../types/card';

interface DeckViewerProps {
  onBack?: () => void;
}

type DeckTone = 'furia' | 'arcano' | 'neutral';
type DeckId =
  | 'FURIA' | 'FURIA_AGRO' | 'FURIA_CONTROL'
  | 'ARCANO' | 'ARCANO_FREEZE' | 'ARCANO_SPELL'
  | 'NEXO_HIBRIDO' | 'BARAJA_BESTIAS' | 'FORTALEZA_RUNICA'
  | 'MAZO_VACIO' | 'MAZO_ORDEN' | 'MAZO_ULTIMO_ALIENTO'
  | 'MAZO_DOBLE_ATAQUE' | 'MAZO_FORESTAL_CONTROL' | 'MAZO_SOMBRA'
  | 'MAZO_NATURALEZA' | 'MAZO_CELESTIAL' | 'MAZO_ACUATICO'
  | 'MAZO_RENEGADOS' | 'MAZO_ORCOS_BESTIAS';

interface DeckDefinition {
  id: DeckId;
  name: string;
  faction: string;
  archetype: string;
  description: string;
  tone: DeckTone;
  mark: string;
}

const DECK_CATALOG: DeckDefinition[] = [
  { id: 'FURIA', name: 'Ignis', faction: 'Furia', archetype: 'Clasico', description: 'Presion directa y criaturas de fuego.', tone: 'furia', mark: 'F' },
  { id: 'FURIA_AGRO', name: 'Fuego Rapido', faction: 'Furia', archetype: 'Agro', description: 'Carga, dano temprano y ritmo constante.', tone: 'furia', mark: 'A' },
  { id: 'FURIA_CONTROL', name: 'Caldera', faction: 'Furia', archetype: 'Control', description: 'Dragones grandes y dano de area.', tone: 'furia', mark: 'C' },
  { id: 'ARCANO', name: 'Aethelgard', faction: 'Arcano', archetype: 'Clasico', description: 'Recursos, control y respuestas flexibles.', tone: 'arcano', mark: 'A' },
  { id: 'ARCANO_FREEZE', name: 'Ventisca', faction: 'Arcano', archetype: 'Control', description: 'Congela amenazas y gana tiempo.', tone: 'arcano', mark: 'V' },
  { id: 'ARCANO_SPELL', name: 'Magia de Runas', faction: 'Arcano', archetype: 'Combo', description: 'Hechizos encadenados y robo de cartas.', tone: 'arcano', mark: 'R' },
  { id: 'NEXO_HIBRIDO', name: 'Nexo Hibrido', faction: 'Mixto', archetype: 'Equilibrio', description: 'Amenazas de Furia y Arcano en un solo plan.', tone: 'neutral', mark: 'N' },
  { id: 'BARAJA_BESTIAS', name: 'Llamada Bestial', faction: 'Mixto', archetype: 'Bestias', description: 'Criaturas agresivas con apoyo elemental.', tone: 'neutral', mark: 'B' },
  { id: 'FORTALEZA_RUNICA', name: 'Fortaleza Runica', faction: 'Mixto', archetype: 'Estructuras', description: 'Torres, muros y defensa progresiva.', tone: 'neutral', mark: 'R' },
  { id: 'MAZO_VACIO', name: 'Vacio Entropico', faction: 'Vacio', archetype: 'Desgaste', description: 'Horrores y efectos que descomponen el tablero.', tone: 'neutral', mark: 'V' },
  { id: 'MAZO_ORDEN', name: 'Edicto Sagrado', faction: 'Orden', archetype: 'Proteccion', description: 'Unidades resistentes y escudos divinos.', tone: 'arcano', mark: 'O' },
  { id: 'MAZO_ULTIMO_ALIENTO', name: 'Ultimo Aliento', faction: 'Mixto', archetype: 'Sacrificio', description: 'Morir es solo el comienzo de la siguiente jugada.', tone: 'neutral', mark: 'U' },
  { id: 'MAZO_DOBLE_ATAQUE', name: 'Rafaga de Furia', faction: 'Mixto', archetype: 'Doble golpe', description: 'Cargas y ataques que buscan cerrar la partida.', tone: 'furia', mark: 'D' },
  { id: 'MAZO_FORESTAL_CONTROL', name: 'Raices de Vida', faction: 'Naturaleza', archetype: 'Control', description: 'Curacion, muros y control del terreno.', tone: 'neutral', mark: 'R' },
  { id: 'MAZO_SOMBRA', name: 'Reino Umbrio', faction: 'Sombra', archetype: 'Niebla', description: 'Espectros, vampiros y presion silenciosa.', tone: 'neutral', mark: 'S' },
  { id: 'MAZO_NATURALEZA', name: 'Abrazo Forestal', faction: 'Naturaleza', archetype: 'Vida', description: 'Bestias, crecimiento y recuperacion.', tone: 'neutral', mark: 'N' },
  { id: 'MAZO_CELESTIAL', name: 'Reinos del Aire', faction: 'Orden', archetype: 'Celestial', description: 'Criaturas voladoras y presencia desde el cielo.', tone: 'arcano', mark: 'C' },
  { id: 'MAZO_ACUATICO', name: 'Abismo Marino', faction: 'Abisal', archetype: 'Aguas profundas', description: 'Leviatanes, hielo y amenazas de gran alcance.', tone: 'arcano', mark: 'M' },
  { id: 'MAZO_RENEGADOS', name: 'Pila de Renegados', faction: 'Mixto', archetype: 'Descarte', description: 'Caos, descarte y cartas que vuelven con fuerza.', tone: 'furia', mark: 'X' },
  { id: 'MAZO_ORCOS_BESTIAS', name: 'Horda Orca', faction: 'Furia', archetype: 'Horda', description: 'Orcos y bestias que dominan por volumen.', tone: 'furia', mark: 'H' },
];

interface GroupedCard {
  card: Card;
  count: number;
}

export const DeckViewer: React.FC<DeckViewerProps> = ({ onBack }) => {
  const [activeDeckId, setActiveDeckId] = useState<DeckId>('FURIA');
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);
  const activeDeck = DECK_CATALOG.find((deck) => deck.id === activeDeckId) ?? DECK_CATALOG[0];
  const deck = useMemo(() => getPreconstructedDeck(activeDeck.id), [activeDeck.id]);

  const groupedCards = useMemo<GroupedCard[]>(() => {
    const groups = new Map<string, GroupedCard>();
    deck.forEach((card) => {
      const current = groups.get(card.id);
      if (current) current.count += 1;
      else groups.set(card.id, { card, count: 1 });
    });
    return [...groups.values()].sort((a, b) => {
      if (a.card.type === 'COMANDANTE') return -1;
      if (b.card.type === 'COMANDANTE') return 1;
      if (a.card.type === 'MANA' && b.card.type !== 'MANA') return -1;
      if (b.card.type === 'MANA' && a.card.type !== 'MANA') return 1;
      return a.card.cost.generic - b.card.cost.generic;
    });
  }, [deck]);

  const typeCounts = {
    mana: deck.filter((card) => card.type === 'MANA').length,
    units: deck.filter((card) => card.type === 'UNIDAD' || card.type === 'COMANDANTE').length,
    spells: deck.filter((card) => card.type === 'HECHIZO').length,
    structures: deck.filter((card) => card.type === 'ESTRUCTURA').length,
  };

  useEffect(() => {
    if (!inspectedCard) return;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setInspectedCard(null);
    };
    window.addEventListener('keydown', closeWithEscape);
    return () => window.removeEventListener('keydown', closeWithEscape);
  }, [inspectedCard]);

  return (
    <div className="deck-viewer">
      <header className="deck-header">
        {onBack && <button className="back-btn" type="button" onClick={onBack}>Volver al Menu</button>}
        <div className="deck-header-copy">
          <span className="deck-eyebrow">CRONICAS DEL NEXO / ARCHIVO TACTICO</span>
          <h1>Biblioteca de Mazos</h1>
          <p className="deck-subtitle">Explora las {DECK_CATALOG.length} listas disponibles y descubre que plan encaja contigo.</p>
        </div>
        <div className="deck-header-count"><strong>{DECK_CATALOG.length}</strong><span>mazos</span></div>
      </header>

      <div className="deck-content-wrapper">
        <aside className="deck-library glass-panel">
          <div className="deck-library-heading">
            <div><span className="deck-library-eyebrow">ARCHIVO DEL NEXO</span><h2>Todos los mazos</h2></div>
            <span className="deck-library-count">{DECK_CATALOG.length}</span>
          </div>
          <p className="deck-library-intro">Selecciona una estrategia para revisar su composicion y sus cartas.</p>
          <div className="deck-catalog" aria-label="Catalogo de mazos disponibles">
            {DECK_CATALOG.map((definition) => (
              <button
                type="button"
                key={definition.id}
                className={`deck-catalog-card tone-${definition.tone} ${activeDeckId === definition.id ? 'active' : ''}`}
                onClick={() => setActiveDeckId(definition.id)}
              >
                <span className="deck-catalog-mark">{definition.mark}</span>
                <span className="deck-catalog-copy"><strong>{definition.name}</strong><small>{definition.faction} / {definition.archetype}</small></span>
                <span className="deck-catalog-size">50</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="deck-main-panel">
          <section className={`deck-showcase tone-${activeDeck.tone}`}>
            <div className="deck-showcase-mark">{activeDeck.mark}</div>
            <div className="deck-showcase-copy"><span className="deck-showcase-kicker">{activeDeck.faction} / {activeDeck.archetype}</span><h2>{activeDeck.name}</h2><p>{activeDeck.description}</p></div>
            <div className="deck-showcase-stats"><strong>{deck.length}</strong><span>cartas</span><div className="deck-stat-chips"><span>{typeCounts.mana} mana</span><span>{typeCounts.units} unidades</span><span>{typeCounts.spells} hechizos</span><span>{typeCounts.structures} estructuras</span></div></div>
          </section>

          <section className="deck-list-panel">
            <div className="deck-list-heading"><div><span className="deck-library-eyebrow">COMPOSICION</span><h2>Cartas del mazo</h2></div><span className="deck-list-hint">Vista completa / clic para ampliar</span></div>
            <div className="deck-cards-grid">
              {groupedCards.map(({ card, count }) => (
                <button type="button" key={card.id} className="deck-card-tile" onClick={() => setInspectedCard(card)} aria-label={`Ampliar ${card.name}`}>
                  <div className="deck-card-natural-preview"><CardDOM card={card} mode="gallery" /></div>
                  <div className="deck-card-tile-meta"><span>{card.type}</span><strong>x{count}</strong></div>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>

      {inspectedCard && (() => {
        const lore = LORE_DB[inspectedCard.id] ?? { title: inspectedCard.name, history: [inspectedCard.flavorText], quote: inspectedCard.flavorText };
        return (
          <div className="lore-vault-overlay" role="dialog" aria-modal="true" aria-label={`Informacion de ${inspectedCard.name}`} onClick={() => setInspectedCard(null)}>
            <div className="lore-vault-content glass-panel-heavy" onClick={(event) => event.stopPropagation()}>
              <button className="close-vault-button" type="button" aria-label="Cerrar" onClick={() => setInspectedCard(null)}>X</button>
              <div className="vault-left-col"><div className="vault-card-wrapper"><CardDOM card={inspectedCard} mode="inspected" /></div></div>
              <div className="vault-right-col">
                <div className="vault-header"><span className="vault-rarity-badge" style={{ borderColor: `var(--rarity-${inspectedCard.rarity.toLowerCase()})`, color: `var(--rarity-${inspectedCard.rarity.toLowerCase()})` }}>{inspectedCard.rarity}</span><span className="vault-faction-badge">{inspectedCard.faction}</span>{inspectedCard.subtype && <span className="vault-subtype-badge">{inspectedCard.subtype}</span>}</div>
                <h2 className="vault-title">{lore.title}</h2><div className="vault-divider" />
                <div className="vault-stats-bar">{inspectedCard.attack !== undefined && <span>{inspectedCard.attack} ATK</span>}{inspectedCard.maxHealth !== undefined && <span>{inspectedCard.maxHealth} HP</span>}{inspectedCard.range !== undefined && <span>Rango {inspectedCard.range}</span>}{inspectedCard.movement !== undefined && <span>Movimiento {inspectedCard.movement}</span>}</div>
                <div className="vault-history-scroll">{lore.history.map((paragraph, index) => <p key={index} className="vault-paragraph">{paragraph}</p>)}</div>
                <div className="vault-quote-block"><p className="vault-quote-text">{lore.quote}</p></div>
                <div className="vault-artist-footer"><div className="vault-artist-info"><span className="artist-label">ARTISTA</span><span className="artist-name">{inspectedCard.artist || 'Desconocido'}</span></div><div className="vault-artist-info"><span className="artist-label">ESTILO</span><span className="artist-name style-tag">{inspectedCard.artistStyle || 'Tradicional'}</span></div></div>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        .deck-viewer { height: 100vh; width: 100vw; overflow: hidden; display: flex; flex-direction: column; gap: 18px; padding: 24px 32px 28px; color: #eef6fb; background: #071019; }
        .deck-header { position: relative; display: flex; align-items: center; justify-content: center; min-height: 82px; }
        .deck-header-copy { text-align: center; }
        .deck-eyebrow, .deck-library-eyebrow { color: #7ca4b8; font-size: .64rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
        .deck-header h1 { margin-top: 7px; color: #f6fbff; font-size: 2.35rem; line-height: 1; letter-spacing: .01em; }
        .deck-subtitle { margin-top: 8px; color: #91a9b8; font-size: .88rem; }
        .back-btn { position: absolute; left: 0; top: 2px; padding: 9px 14px; border: 1px solid rgba(174, 218, 238, .2); border-radius: 7px; color: #dff4fd; background: rgba(255,255,255,.05); cursor: pointer; font-weight: 700; }
        .back-btn:hover { background: rgba(255,255,255,.12); }
        .deck-header-count { position: absolute; right: 4px; top: 0; display: flex; flex-direction: column; align-items: center; min-width: 58px; padding: 7px 10px; border: 1px solid rgba(139,221,255,.22); border-radius: 9px; background: rgba(139,221,255,.07); }
        .deck-header-count strong { color: #8bddff; font-size: 1.35rem; line-height: 1; }
        .deck-header-count span { color: #9fb5c5; font-size: .6rem; text-transform: uppercase; }
        .deck-content-wrapper { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 18px; min-height: 0; flex: 1; }
        .deck-library { display: flex; flex-direction: column; min-height: 0; padding: 18px; border-radius: 12px; background: rgba(11, 23, 34, .88); }
        .deck-library-heading, .deck-list-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .deck-library h2, .deck-list-heading h2 { margin-top: 5px; color: #f2f8fc; font-size: 1.3rem; }
        .deck-library-count { min-width: 28px; padding: 6px 7px; border: 1px solid rgba(139,221,255,.3); border-radius: 6px; color: #8bddff; font-size: .8rem; font-weight: 800; text-align: center; }
        .deck-library-intro { margin: 13px 0 15px; color: #89a1af; font-size: .75rem; line-height: 1.45; }
        .deck-catalog { display: flex; flex-direction: column; gap: 7px; overflow-y: auto; padding: 2px 4px 4px 0; }
        .deck-catalog-card { display: grid; grid-template-columns: 32px minmax(0, 1fr) 25px; align-items: center; gap: 9px; width: 100%; padding: 9px; border: 1px solid rgba(255,255,255,.08); border-radius: 8px; color: #e7f1f6; background: rgba(255,255,255,.035); text-align: left; cursor: pointer; transition: border-color .18s, background .18s, transform .18s; }
        .deck-catalog-card:hover { transform: translateX(3px); background: rgba(255,255,255,.08); }
        .deck-catalog-card.active { border-color: var(--deck-accent); background: var(--deck-active-bg); box-shadow: inset 3px 0 0 var(--deck-accent); }
        .deck-catalog-mark, .deck-showcase-mark { display: grid; place-items: center; border: 1px solid var(--deck-accent); border-radius: 7px; color: var(--deck-accent); background: var(--deck-mark-bg); font-family: var(--font-display); font-weight: 800; }
        .deck-catalog-mark { width: 30px; height: 30px; font-size: .85rem; }
        .deck-catalog-copy { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
        .deck-catalog-copy strong { overflow: hidden; color: #f2f8fc; font-size: .77rem; text-overflow: ellipsis; white-space: nowrap; }
        .deck-catalog-copy small { overflow: hidden; color: #87a0af; font-size: .61rem; text-overflow: ellipsis; white-space: nowrap; }
        .deck-catalog-size { color: #7895a5; font-size: .63rem; font-weight: 800; text-align: right; }
        .deck-main-panel { display: flex; min-width: 0; min-height: 0; flex-direction: column; gap: 14px; }
        .deck-showcase { display: grid; grid-template-columns: 62px minmax(0, 1fr) auto; align-items: center; gap: 16px; min-height: 112px; padding: 18px 22px; border: 1px solid var(--deck-accent-border); border-radius: 12px; background: var(--deck-showcase-bg); box-shadow: 0 12px 32px rgba(0,0,0,.16); }
        .deck-showcase-mark { width: 58px; height: 58px; font-size: 1.55rem; box-shadow: 0 0 20px var(--deck-mark-glow); }
        .deck-showcase-copy { min-width: 0; }
        .deck-showcase-kicker { color: var(--deck-accent); font-size: .67rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .deck-showcase h2 { margin-top: 5px; color: #fff; font-size: 1.7rem; }
        .deck-showcase p { margin-top: 4px; color: #adc1cd; font-size: .78rem; }
        .deck-showcase-stats { display: grid; grid-template-columns: auto auto; align-items: baseline; column-gap: 6px; color: #90a7b5; font-size: .7rem; text-align: right; }
        .deck-showcase-stats strong { color: #fff; font-size: 2rem; line-height: 1; }
        .deck-stat-chips { grid-column: 1 / -1; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 5px; margin-top: 9px; }
        .deck-stat-chips span { padding: 4px 6px; border: 1px solid rgba(255,255,255,.12); border-radius: 5px; color: #b8ced9; background: rgba(0,0,0,.18); font-size: .6rem; }
        .deck-list-panel { display: flex; min-height: 0; flex: 1; flex-direction: column; padding: 18px; border: 1px solid rgba(174,218,238,.12); border-radius: 12px; background: rgba(8, 18, 28, .72); }
        .deck-list-hint { color: #7391a1; font-size: .68rem; }
        .deck-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); align-content: start; justify-items: center; gap: 22px 16px; min-height: 0; flex: 1; overflow-y: auto; margin-top: 16px; padding: 4px 8px 12px 4px; }
        .deck-card-tile { position: relative; display: flex; flex-direction: column; align-items: stretch; width: 200px; padding: 0; border: 0; color: inherit; background: transparent; cursor: pointer; text-align: left; }
        .deck-card-natural-preview { width: 200px; height: 290px; filter: drop-shadow(0 10px 18px rgba(0,0,0,.42)); transition: transform .22s ease, filter .22s ease; }
        .deck-card-tile:hover .deck-card-natural-preview { transform: translateY(-8px) scale(1.025); filter: drop-shadow(0 18px 26px rgba(0,0,0,.66)) brightness(1.1); }
        .deck-card-tile:focus-visible { outline: 2px solid #8bddff; outline-offset: 6px; border-radius: 12px; }
        .deck-card-tile-meta { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 8px; padding: 6px 8px; border: 1px solid rgba(255,255,255,.1); border-radius: 6px; background: rgba(5,13,21,.74); }
        .deck-card-tile-meta span { overflow: hidden; color: #8ea7b5; font-size: .59rem; font-weight: 800; letter-spacing: .06em; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
        .deck-card-tile-meta strong { color: #e8f6fb; font-size: .7rem; }
        .tone-furia { --deck-accent: #ff8a65; --deck-accent-border: rgba(255,138,101,.34); --deck-active-bg: rgba(255,93,54,.13); --deck-showcase-bg: linear-gradient(105deg, rgba(67,25,22,.92), rgba(16,27,35,.92)); --deck-mark-bg: rgba(255,93,54,.12); --deck-mark-glow: rgba(255,93,54,.3); }
        .tone-arcano { --deck-accent: #8bddff; --deck-accent-border: rgba(139,221,255,.34); --deck-active-bg: rgba(39,142,183,.15); --deck-showcase-bg: linear-gradient(105deg, rgba(15,49,67,.92), rgba(14,27,39,.92)); --deck-mark-bg: rgba(139,221,255,.1); --deck-mark-glow: rgba(139,221,255,.24); }
        .tone-neutral { --deck-accent: #d0b1ff; --deck-accent-border: rgba(208,177,255,.3); --deck-active-bg: rgba(126,87,180,.15); --deck-showcase-bg: linear-gradient(105deg, rgba(38,31,63,.92), rgba(15,25,35,.92)); --deck-mark-bg: rgba(208,177,255,.1); --deck-mark-glow: rgba(208,177,255,.2); }
        .lore-vault-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 28px; background: rgba(0,0,0,.82); backdrop-filter: blur(14px); }
        .lore-vault-content { position: relative; display: grid; grid-template-columns: 350px minmax(0,1fr); gap: 35px; width: min(960px, 94vw); max-height: 90vh; padding: 36px; overflow: hidden; border: 1px solid rgba(255,255,255,.13); box-shadow: 0 25px 80px rgba(0,0,0,.75); }
        .close-vault-button { position: absolute; top: 15px; right: 15px; z-index: 2; width: 34px; height: 34px; border: 1px solid rgba(255,255,255,.18); border-radius: 50%; color: #fff; background: rgba(255,255,255,.07); cursor: pointer; font-weight: 800; }
        .vault-left-col, .vault-card-wrapper { display: flex; align-items: center; justify-content: center; }
        .vault-right-col { display: flex; min-height: 0; flex-direction: column; gap: 15px; overflow-y: auto; padding-right: 10px; }
        .vault-header, .vault-stats-bar, .vault-artist-footer { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .vault-rarity-badge, .vault-faction-badge, .vault-subtype-badge { padding: 4px 9px; border: 1px solid rgba(255,255,255,.15); border-radius: 12px; color: #d8e8ef; background: rgba(255,255,255,.05); font-size: .63rem; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
        .vault-title { color: #fff; font-size: 2.15rem; }
        .vault-divider { height: 1px; background: rgba(255,255,255,.13); }
        .vault-stats-bar { padding: 9px 12px; border: 1px solid rgba(255,255,255,.09); border-radius: 7px; background: rgba(0,0,0,.2); }
        .vault-stats-bar span { color: #dbeaf0; font-size: .75rem; font-weight: 800; }
        .vault-history-scroll { display: flex; flex-direction: column; gap: 10px; }
        .vault-paragraph { color: #c9d8df; font-size: .88rem; line-height: 1.55; }
        .vault-quote-block { padding: 13px 16px; border-left: 3px solid #e7bf65; border-radius: 4px; background: rgba(231,191,101,.06); }
        .vault-quote-text { color: #e7bf65; font-family: Georgia, serif; font-size: .95rem; font-style: italic; line-height: 1.5; }
        .vault-artist-footer { margin-top: auto; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.08); }
        .vault-artist-info { display: flex; flex-direction: column; gap: 3px; }
        .artist-label { color: #738e9d; font-size: .58rem; font-weight: 800; letter-spacing: .1em; }
        .artist-name { color: #eef6fb; font-size: .78rem; font-weight: 700; }
        .style-tag { color: #8bddff; }
        @media (max-width: 980px) { .deck-viewer { padding: 18px; } .deck-content-wrapper { grid-template-columns: 280px minmax(0,1fr); } .deck-showcase { grid-template-columns: 48px minmax(0,1fr); } .deck-showcase-mark { width: 48px; height: 48px; } .deck-showcase-stats { grid-column: 2; justify-content: start; text-align: left; } .deck-stat-chips { justify-content: flex-start; } .deck-cards-grid { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 18px 10px; } .deck-card-tile, .deck-card-natural-preview { width: 170px; } .deck-card-natural-preview { height: 246px; } }
        @media (max-width: 720px) { .deck-viewer { overflow-y: auto; } .deck-header { min-height: 115px; align-items: flex-end; } .deck-header h1 { font-size: 1.8rem; } .deck-header-count { right: 0; top: 0; } .deck-content-wrapper { display: flex; flex-direction: column; } .deck-library { max-height: 270px; } .deck-catalog { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); } .deck-showcase { grid-template-columns: 48px minmax(0,1fr); } .deck-showcase-stats { grid-column: 1 / -1; } .deck-cards-grid { grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: 16px 8px; justify-items: center; } .deck-card-tile, .deck-card-natural-preview { width: 145px; } .deck-card-natural-preview { height: 210px; } .lore-vault-content { grid-template-columns: 1fr; gap: 16px; padding: 24px 18px 18px; overflow-y: auto; } .vault-left-col .mode-inspected { width: 210px; height: 300px; } }
        @media (max-width: 440px) { .back-btn { position: static; align-self: flex-start; } .deck-header { align-items: center; justify-content: space-between; } .deck-header-copy { text-align: left; } .deck-header-count { position: static; } .deck-catalog { grid-template-columns: 1fr; } .deck-showcase { padding: 14px; } .deck-showcase h2 { font-size: 1.35rem; } }
      `}</style>
    </div>
  );
};
