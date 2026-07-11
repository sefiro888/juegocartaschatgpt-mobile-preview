import { describe, it, expect } from 'vitest';
import { initializeGame, playManaCard, summonUnit, moveUnit, playSpell } from '../engine';
import { getPreconstructedDeck, CARDS_DB } from '../cardsDb';
import { executeAITurn } from '../ai';

describe('AI Battle Simulation Run', () => {
  const seed = 'simulation-seed-456';
  const furyDeck = getPreconstructedDeck('FURIA');
  const arcaneDeck = getPreconstructedDeck('ARCANO');
  
  const commanderFury = CARDS_DB['comandante-furia'];
  const commanderArcane = CARDS_DB['comandante-arcano'];

  it('should run a complete multi-turn simulation between Player and AI without throwing errors', () => {
    // ═══════════════════════════════════════════════════
    // TURN 1: INITIALIZATION & PLAYER ACTIONS
    // ═══════════════════════════════════════════════════
    let state = initializeGame(furyDeck, arcaneDeck, commanderFury, commanderArcane, seed);
    expect(state.turn).toBe(1);
    expect(state.activePlayer).toBe('PLAYER');
    
    // Player plays a mana source
    state.player.hand.unshift({ ...CARDS_DB['fuente-furia'] });
    state = playManaCard(state, 'PLAYER', 'fuente-furia');
    expect(state.player.manaSources.furia.total).toBe(1);
    expect(state.player.manaPlayedThisTurn).toBe(true);

    // Give player more mana directly to summon units for test
    state.player.manaSources.furia.total = 3;
    state.player.manaSources.furia.spent = 0;

    // Player summons Sabueso de Brasa (2/1) on (1, 0)
    const hound = { ...CARDS_DB['sabueso-brasa'] };
    state.player.hand.unshift(hound);
    state = summonUnit(state, 'PLAYER', hound.id, { x: 1, y: 0 });
    expect(state.board["1,0"]).toBeDefined();
    expect(state.board["1,0"].cardId).toBe('sabueso-brasa');

    // Player ends turn -> transitions to AI
    state.activePlayer = 'OPPONENT';
    
    // ═══════════════════════════════════════════════════
    // TURN 1: AI (OPPONENT) ACTIONS
    // ═══════════════════════════════════════════════════
    // Make sure opponent has mana and cards to play
    state.opponent.manaSources.arcano.total = 3;
    state.opponent.manaSources.arcano.spent = 0;
    state.opponent.hand.unshift({ ...CARDS_DB['fuente-arcano'] });
    state.opponent.hand.unshift({ ...CARDS_DB['tejedora-escarcha'] });

    // Run AI turn
    state = executeAITurn(state);
    
    // AI turn should play mana, summon tejedora-escarcha, and end turn
    // (state.activePlayer returns to PLAYER, and turn count increments to 2)
    expect(state.activePlayer).toBe('PLAYER');
    expect(state.turn).toBe(2);

    // ═══════════════════════════════════════════════════
    // TURN 2: PLAYER ACTIONS (MOVEMENT & COMBAT)
    // ═══════════════════════════════════════════════════
    // Check if player's Sabueso de Brasa can move forward
    expect(state.board["1,0"]).toBeDefined();
    const playerUnit = state.board["1,0"];
    expect(playerUnit.hasMovedThisTurn).toBe(false);

    // Move playerUnit orthogonal from (1, 0) to (1, 1)
    state = moveUnit(state, { x: 1, y: 0 }, { x: 1, y: 1 });
    expect(state.board["1,0"]).toBeUndefined();
    expect(state.board["1,1"]).toBeDefined();
    expect(state.board["1,1"].hasMovedThisTurn).toBe(true);

    // Player casts Lluvia de Ceniza on an enemy unit
    // Force place an enemy unit at (1, 2)
    state.board["1,2"] = {
      id: "enemy_unit_test",
      cardId: "tejedora-escarcha",
      controller: 'OPPONENT',
      position: { x: 1, y: 2 },
      health: 3,
      maxHealth: 3,
      attack: 2,
      hasMovedThisTurn: false,
      hasAttackedThisTurn: false,
      frozenTurns: 0,
    };

    state.player.manaSources.furia.total = 5;
    state.player.manaSources.furia.spent = 0;
    state.player.hand.unshift({ ...CARDS_DB['lluvia-ceniza'] });

    state = playSpell(state, 'PLAYER', 'lluvia-ceniza', { x: 1, y: 2 });
    
    // The tejedora-escarcha at (1, 2) should have taken 3 damage and died (removed from board)
    expect(state.board["1,2"]).toBeUndefined();
    expect(state.opponent.graveyard.map(c => c.id)).toContain('tejedora-escarcha');

    // End turn -> AI turn
    state.activePlayer = 'OPPONENT';
    state = executeAITurn(state);

    // Verify AI resolved turn cleanly
    expect(state.activePlayer).toBe('PLAYER');
    expect(state.turn).toBe(3);
  });
});
