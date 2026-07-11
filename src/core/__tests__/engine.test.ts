import { describe, it, expect } from 'vitest';
import { initializeGame, playManaCard, summonUnit, moveUnit, combatAttack, playSpell } from '../engine';
import { getPreconstructedDeck, CARDS_DB } from '../cardsDb';
import { COMMANDER_COLUMN, OPPONENT_BACK_ROW, PLAYER_BACK_ROW } from '../boardConfig';

describe('Rules Engine', () => {
  const seed = 'test-seed-123';
  const furyDeck = getPreconstructedDeck('FURIA');
  const arcaneDeck = getPreconstructedDeck('ARCANO');
  
  const commanderFury = CARDS_DB['comandante-furia'];
  const commanderArcane = CARDS_DB['comandante-arcano'];

  it('should initialize game correctly with seed, hand sizes, and commander placement', () => {
    const state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);
    
    expect(state.winner).toBeNull();
    expect(state.turn).toBe(1);
    expect(state.activePlayer).toBe('PLAYER');
    expect(state.player.hand).toHaveLength(5);
    expect(state.opponent.hand).toHaveLength(5);
    
    const playerCommanderKey = `${COMMANDER_COLUMN},${PLAYER_BACK_ROW}`;
    const opponentCommanderKey = `${COMMANDER_COLUMN},${OPPONENT_BACK_ROW}`;

    expect(state.board[playerCommanderKey]).toBeDefined();
    expect(state.board[playerCommanderKey].id).toBe('commander-player');
    expect(state.board[playerCommanderKey].health).toBe(25);
    
    expect(state.board[opponentCommanderKey]).toBeDefined();
    expect(state.board[opponentCommanderKey].id).toBe('commander-opponent');
    expect(state.board[opponentCommanderKey].health).toBe(25);
  });

  it('should allow playing a mana source and prevent playing a second one on the same turn', () => {
    let state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);
    
    // Manually insert mana to hand to guarantee it exists
    state.player.hand.unshift({ ...CARDS_DB['fuente-furia'] });
    state.player.hand.unshift({ ...CARDS_DB['fuente-furia'] });

    expect(state.player.manaSources.furia.total).toBe(0);
    
    // Play first mana source
    state = playManaCard(state, 'PLAYER', 'fuente-furia');
    expect(state.player.manaSources.furia.total).toBe(1);
    expect(state.player.manaPlayedThisTurn).toBe(true);

    // Try to play second mana source
    state = playManaCard(state, 'PLAYER', 'fuente-furia');
    expect(state.player.manaSources.furia.total).toBe(1); // Still 1
  });

  it('should respect mana costs and enforce summon rules (empty and adjacent/backrow)', () => {
    let state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);
    
    // Add mana sources directly
    state.player.manaSources.furia.total = 3;
    
    // Sabueso de Brasa cost generic: 1, furia: 1. Total: 2.
    const hound = { ...CARDS_DB['sabueso-brasa'] };
    state.player.hand.unshift(hound);

    // Play unit on valid backrow spot (0, 0)
    state = summonUnit(state, 'PLAYER', hound.id, { x: 0, y: 0 });
    expect(state.board["0,0"]).toBeDefined();
    expect(state.board["0,0"].cardId).toBe('sabueso-brasa');
    
    // Mana deducted: spent = 2 (generic 1 + furia 1)
    expect(state.player.manaSources.furia.spent).toBe(2);

    // Try to summon on occupied spot (0,0)
    const anotherHound = { ...CARDS_DB['sabueso-brasa'] };
    state.player.hand.unshift(anotherHound);
    state.player.manaSources.furia.spent = 0; // Reset spent
    state = summonUnit(state, 'PLAYER', anotherHound.id, { x: 0, y: 0 });
    
    // Hand should still have the hound because summon failed
    expect(state.player.hand[0].id).toBe('sabueso-brasa');

    // Try to summon far away (not backrow, not adjacent to allies, e.g. at 4, 3)
    state = summonUnit(state, 'PLAYER', anotherHound.id, { x: 4, y: 3 });
    expect(state.board["4,3"]).toBeUndefined();
  });

  it('should handle movement (orthogonal vs diagonal keywords)', () => {
    let state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);
    
    // Place units on board
    state.board["1,1"] = {
      id: "sabueso_1",
      cardId: "sabueso-brasa",
      controller: 'PLAYER',
      position: { x: 1, y: 1 },
      health: 1,
      maxHealth: 1,
      attack: 2,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };

    state.board["3,1"] = {
      id: "infiltrado_1",
      cardId: "infiltrado-volcanico", // Has diagonal movement keyword
      controller: 'PLAYER',
      position: { x: 3, y: 1 },
      health: 2,
      maxHealth: 2,
      attack: 2,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };

    // Move orthogonal (1,1) -> (1,2)
    state = moveUnit(state, { x: 1, y: 1 }, { x: 1, y: 2 });
    expect(state.board["1,1"]).toBeUndefined();
    expect(state.board["1,2"]).toBeDefined();
    expect(state.board["1,2"].hasMovedThisTurn).toBe(true);

    // Try to move diagonal for normal unit: (1,2) -> (2,3) -> should fail
    state.board["1,2"].hasMovedThisTurn = false; // Reset move lock
    state = moveUnit(state, { x: 1, y: 2 }, { x: 2, y: 3 });
    expect(state.board["1,2"]).toBeDefined();
    expect(state.board["2,3"]).toBeUndefined();

    // Move diagonal for Infiltrado Volcánico: (3,1) -> (4,2) -> should succeed
    state = moveUnit(state, { x: 3, y: 1 }, { x: 4, y: 2 });
    expect(state.board["3,1"]).toBeUndefined();
    expect(state.board["4,2"]).toBeDefined();
  });

  it('should resolve combat, damage, and death correctly', () => {
    let state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);

    // Attacker 2/2, Defender 2/1
    state.board["2,1"] = {
      id: "infiltrado_1",
      cardId: "infiltrado-volcanico",
      controller: 'PLAYER',
      position: { x: 2, y: 1 },
      health: 2,
      maxHealth: 2,
      attack: 2,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };

    state.board["2,2"] = {
      id: "sabueso_enemy",
      cardId: "sabueso-brasa",
      controller: 'OPPONENT',
      position: { x: 2, y: 2 },
      health: 1,
      maxHealth: 1,
      attack: 2,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };

    // Attack!
    state = combatAttack(state, { x: 2, y: 1 }, { x: 2, y: 2 });

    // Defender has 1 health, takes 2 damage, dies
    expect(state.board["2,2"]).toBeUndefined();
    expect(state.opponent.graveyard.map(c => c.id)).toContain('sabueso-brasa');

    // Attacker takes 2 damage, health becomes 0, dies as well
    expect(state.board["2,1"]).toBeUndefined();
    expect(state.player.graveyard.map(c => c.id)).toContain('infiltrado-volcanico');
  });

  it('should apply spells like Lluvia de Ceniza and handle spell immunity', () => {
    let state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);

    state.player.hand = [];
    state.player.manaSources.furia.total = 3;
    state.player.manaSources.furia.spent = 0;
    
    // Add Lluvia de Ceniza (Hechizo, cost: 3)
    const spell = { ...CARDS_DB['lluvia-ceniza'] };
    state.player.hand.unshift(spell);

    const opponentCommanderPos = { x: COMMANDER_COLUMN, y: OPPONENT_BACK_ROW };
    const opponentCommanderKey = `${opponentCommanderPos.x},${opponentCommanderPos.y}`;

    state = playSpell(state, 'PLAYER', spell.id, opponentCommanderPos);

    // Opponent Commander health should go from 25 to 22
    expect(state.board[opponentCommanderKey].health).toBe(22);
    expect(state.player.hand.map(c => c.id)).not.toContain('lluvia-ceniza');
    expect(state.player.graveyard.map(c => c.id)).toContain('lluvia-ceniza');

    // Summon immune unit: Golem de Glaciar (Inmune a Hechizos)
    state.board["2,3"] = {
      id: "golem_1",
      cardId: "golem-glaciar",
      controller: 'OPPONENT',
      position: { x: 2, y: 3 },
      health: 6,
      maxHealth: 6,
      attack: 3,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };

    // Add another Lluvia de Ceniza and try to target golem
    const spell2 = { ...CARDS_DB['lluvia-ceniza'] };
    state.player.hand.unshift(spell2);
    state.player.manaSources.furia.spent = 0; // Reset spent

    state = playSpell(state, 'PLAYER', spell2.id, { x: 2, y: 3 });

    // Golem should ignore the spell and still have 6 health
    expect(state.board["2,3"].health).toBe(6);
    expect(state.player.hand[0].id).toBe('lluvia-ceniza'); // Spell not played/ignored
  });
});
