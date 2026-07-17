import { describe, it, expect } from 'vitest';
import { initializeGame, playManaCard, summonUnit, moveUnit, combatAttack, getCombatPreview, playSpell } from '../engine';
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

  it('should handle movement in all eight directions', () => {
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
      id: "berserker_diagonal_1",
      cardId: "berserker-ignivoro",
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

    // A movement-2 unit can combine both axes across its movement budget.
    state.board["1,2"].hasMovedThisTurn = false; // Reset move lock
    state = moveUnit(state, { x: 1, y: 2 }, { x: 2, y: 3 });
    expect(state.board["1,2"]).toBeUndefined();
    expect(state.board["2,3"]).toBeDefined();

    // Normal movement-1 units can also move diagonally in one step.
    state = moveUnit(state, { x: 3, y: 1 }, { x: 4, y: 2 });
    expect(state.board["3,1"]).toBeUndefined();
    expect(state.board["4,2"]).toBeDefined();
  });

  it('should use each card movement value and respect blocking terrain', () => {
    let state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);
    state.board["1,1"] = {
      id: "hound_range_test",
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

    state = moveUnit(state, { x: 1, y: 1 }, { x: 1, y: 3 });
    expect(state.board["1,1"]).toBeUndefined();
    expect(state.board["1,3"]?.id).toBe('hound_range_test');

    state.board["1,3"].hasMovedThisTurn = false;
    state.board["1,2"] = {
      id: "ridge_range_test",
      cardId: "obstaculo-risco",
      controller: 'OPPONENT',
      position: { x: 1, y: 2 },
      health: 99,
      maxHealth: 99,
      attack: 0,
      hasMovedThisTurn: true,
      hasAttackedThisTurn: true,
      frozenTurns: 0,
    };

    state = moveUnit(state, { x: 1, y: 3 }, { x: 1, y: 1 });
    expect(state.board["1,3"]?.id).toBe('hound_range_test');
    expect(state.board["1,1"]).toBeUndefined();
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

  it('should let either side break neutral terrain and open its cell', () => {
    let state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);
    state.board['2,3'] = {
      id: 'terrain-breaker',
      cardId: 'infiltrado-volcanico',
      controller: 'PLAYER',
      position: { x: 2, y: 3 },
      health: 2,
      maxHealth: 2,
      attack: 2,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };
    state.board['2,4'] = {
      id: 'fragile-current',
      cardId: 'obstaculo-corriente',
      controller: 'OPPONENT',
      position: { x: 2, y: 4 },
      health: 2,
      maxHealth: 3,
      attack: 0,
      hasMovedThisTurn: true,
      hasAttackedThisTurn: true,
      frozenTurns: 0,
    };

    state = combatAttack(state, { x: 2, y: 3 }, { x: 2, y: 4 });

    expect(state.board['2,4']).toBeUndefined();
    expect(state.board['2,3']?.health).toBe(2);
    expect(state.board['2,3']?.hasAttackedThisTurn).toBe(true);
    expect(state.opponent.graveyard.map((card) => card.id)).not.toContain('obstaculo-corriente');
  });

  it('should let damage spells shatter terrain but reject control spells against it', () => {
    let state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);
    state.player.manaSources.furia.total = 6;
    state.player.hand.unshift({ ...CARDS_DB['lluvia-ceniza'] });
    state.player.hand.unshift({ ...CARDS_DB['congelacion-rapida'] });
    state.board['3,3'] = {
      id: 'spell-current',
      cardId: 'obstaculo-corriente',
      controller: 'OPPONENT',
      position: { x: 3, y: 3 },
      health: 3,
      maxHealth: 3,
      attack: 0,
      hasMovedThisTurn: true,
      hasAttackedThisTurn: true,
      frozenTurns: 0,
    };

    const beforeControl = state.player.hand.length;
    state = playSpell(state, 'PLAYER', 'congelacion-rapida', { x: 3, y: 3 });
    expect(state.player.hand).toHaveLength(beforeControl);

    state = playSpell(state, 'PLAYER', 'lluvia-ceniza', { x: 3, y: 3 });
    expect(state.board['3,3']).toBeUndefined();
    expect(state.player.graveyard.map((card) => card.id)).toContain('lluvia-ceniza');
  });

  it('should remove terrain cleanly when global damage destroys it', () => {
    let state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);
    state.player.manaSources.furia.total = 8;
    state.player.hand.unshift({ ...CARDS_DB['erupcion-volcanica'] });
    state.board['4,4'] = {
      id: 'eruption-ridge',
      cardId: 'obstaculo-risco',
      controller: 'OPPONENT',
      position: { x: 4, y: 4 },
      health: 2,
      maxHealth: 2,
      attack: 0,
      hasMovedThisTurn: true,
      hasAttackedThisTurn: true,
      frozenTurns: 0,
    };

    state = playSpell(state, 'PLAYER', 'erupcion-volcanica');

    expect(state.board['4,4']).toBeUndefined();
    expect(state.opponent.graveyard.map((card) => card.id)).not.toContain('obstaculo-risco');
  });

  it('should preview the same combat exchange resolved by the engine', () => {
    const state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);
    state.board['2,1'] = {
      id: 'preview-attacker',
      cardId: 'infiltrado-volcanico',
      controller: 'PLAYER',
      position: { x: 2, y: 1 },
      health: 2,
      maxHealth: 2,
      attack: 2,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };
    state.board['2,2'] = {
      id: 'preview-target',
      cardId: 'sabueso-brasa',
      controller: 'OPPONENT',
      position: { x: 2, y: 2 },
      health: 1,
      maxHealth: 1,
      attack: 2,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };

    expect(getCombatPreview(state, { x: 2, y: 1 }, { x: 2, y: 2 })).toMatchObject({
      damageToTarget: 2,
      damageToAttacker: 2,
      targetCanRetaliate: true,
      targetWillFall: true,
      attackerWillFall: true,
    });
  });

  it('should apply unit range, line of sight, and ranged retaliation rules', () => {
    let state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);
    state.board["0,1"] = {
      id: "ranged_attacker",
      cardId: "mago-runa-helada",
      controller: 'PLAYER',
      position: { x: 0, y: 1 },
      health: 3,
      maxHealth: 3,
      attack: 2,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };
    state.board["0,3"] = {
      id: "melee_target",
      cardId: "sabueso-brasa",
      controller: 'OPPONENT',
      position: { x: 0, y: 3 },
      health: 3,
      maxHealth: 3,
      attack: 2,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };

    state = combatAttack(state, { x: 0, y: 1 }, { x: 0, y: 3 });
    expect(state.board["0,3"].health).toBe(1);
    expect(state.board["0,1"].health).toBe(3);

    state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);
    state.board["0,1"] = {
      id: "blocked_ranged_attacker",
      cardId: "mago-runa-helada",
      controller: 'PLAYER',
      position: { x: 0, y: 1 },
      health: 3,
      maxHealth: 3,
      attack: 2,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };
    state.board["0,2"] = {
      id: "line_of_sight_ridge",
      cardId: "obstaculo-risco",
      controller: 'OPPONENT',
      position: { x: 0, y: 2 },
      health: 99,
      maxHealth: 99,
      attack: 0,
      hasMovedThisTurn: true,
      hasAttackedThisTurn: true,
      frozenTurns: 0,
    };
    state.board["0,3"] = {
      id: "blocked_melee_target",
      cardId: "sabueso-brasa",
      controller: 'OPPONENT',
      position: { x: 0, y: 3 },
      health: 3,
      maxHealth: 3,
      attack: 2,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };

    state = combatAttack(state, { x: 0, y: 1 }, { x: 0, y: 3 });
    expect(state.board["0,3"].health).toBe(3);
    expect(state.board["0,1"].hasAttackedThisTurn).toBe(false);
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
