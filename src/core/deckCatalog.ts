export type DeckTone = 'furia' | 'arcano' | 'neutral';

export type DeckId =
  | 'FURIA' | 'FURIA_AGRO' | 'FURIA_CONTROL'
  | 'ARCANO' | 'ARCANO_FREEZE' | 'ARCANO_SPELL'
  | 'NEXO_HIBRIDO' | 'BARAJA_BESTIAS' | 'FORTALEZA_RUNICA'
  | 'MAZO_VACIO' | 'MAZO_ORDEN' | 'MAZO_ULTIMO_ALIENTO'
  | 'MAZO_DOBLE_ATAQUE' | 'MAZO_FORESTAL_CONTROL' | 'MAZO_SOMBRA'
  | 'MAZO_NATURALEZA' | 'MAZO_CELESTIAL' | 'MAZO_ACUATICO'
  | 'MAZO_RENEGADOS' | 'MAZO_ORCOS_BESTIAS';

export interface DeckDefinition {
  id: DeckId;
  name: string;
  faction: string;
  commanderFaction: 'FURIA' | 'ARCANO';
  archetype: string;
  description: string;
  tone: DeckTone;
  mark: string;
}

export const DECK_CATALOG: readonly DeckDefinition[] = [
  { id: 'FURIA', name: 'Ignis', faction: 'Furia', commanderFaction: 'FURIA', archetype: 'Clasico', description: 'Presion directa y criaturas de fuego.', tone: 'furia', mark: 'F' },
  { id: 'FURIA_AGRO', name: 'Fuego Rapido', faction: 'Furia', commanderFaction: 'FURIA', archetype: 'Agro', description: 'Carga, dano temprano y ritmo constante.', tone: 'furia', mark: 'A' },
  { id: 'FURIA_CONTROL', name: 'Caldera', faction: 'Furia', commanderFaction: 'FURIA', archetype: 'Control', description: 'Dragones grandes y dano de area.', tone: 'furia', mark: 'C' },
  { id: 'ARCANO', name: 'Aethelgard', faction: 'Arcano', commanderFaction: 'ARCANO', archetype: 'Clasico', description: 'Recursos, control y respuestas flexibles.', tone: 'arcano', mark: 'A' },
  { id: 'ARCANO_FREEZE', name: 'Ventisca', faction: 'Arcano', commanderFaction: 'ARCANO', archetype: 'Control', description: 'Congela amenazas y gana tiempo.', tone: 'arcano', mark: 'V' },
  { id: 'ARCANO_SPELL', name: 'Magia de Runas', faction: 'Arcano', commanderFaction: 'ARCANO', archetype: 'Combo', description: 'Hechizos encadenados y robo de cartas.', tone: 'arcano', mark: 'R' },
  { id: 'NEXO_HIBRIDO', name: 'Nexo Hibrido', faction: 'Mixto', commanderFaction: 'FURIA', archetype: 'Equilibrio', description: 'Amenazas de Furia y Arcano en un solo plan.', tone: 'neutral', mark: 'N' },
  { id: 'BARAJA_BESTIAS', name: 'Llamada Bestial', faction: 'Mixto', commanderFaction: 'FURIA', archetype: 'Bestias', description: 'Criaturas agresivas con apoyo elemental.', tone: 'neutral', mark: 'B' },
  { id: 'FORTALEZA_RUNICA', name: 'Fortaleza Runica', faction: 'Mixto', commanderFaction: 'ARCANO', archetype: 'Estructuras', description: 'Torres, muros y defensa progresiva.', tone: 'neutral', mark: 'R' },
  { id: 'MAZO_VACIO', name: 'Vacio Entropico', faction: 'Vacio', commanderFaction: 'ARCANO', archetype: 'Desgaste', description: 'Horrores y efectos que descomponen el tablero.', tone: 'neutral', mark: 'V' },
  { id: 'MAZO_ORDEN', name: 'Edicto Sagrado', faction: 'Orden', commanderFaction: 'ARCANO', archetype: 'Proteccion', description: 'Unidades resistentes y escudos divinos.', tone: 'arcano', mark: 'O' },
  { id: 'MAZO_ULTIMO_ALIENTO', name: 'Ultimo Aliento', faction: 'Mixto', commanderFaction: 'FURIA', archetype: 'Sacrificio', description: 'Morir es solo el comienzo de la siguiente jugada.', tone: 'neutral', mark: 'U' },
  { id: 'MAZO_DOBLE_ATAQUE', name: 'Rafaga de Furia', faction: 'Mixto', commanderFaction: 'FURIA', archetype: 'Doble golpe', description: 'Cargas y ataques que buscan cerrar la partida.', tone: 'furia', mark: 'D' },
  { id: 'MAZO_FORESTAL_CONTROL', name: 'Raices de Vida', faction: 'Naturaleza', commanderFaction: 'FURIA', archetype: 'Control', description: 'Curacion, muros y control del terreno.', tone: 'neutral', mark: 'R' },
  { id: 'MAZO_SOMBRA', name: 'Reino Umbrio', faction: 'Sombra', commanderFaction: 'ARCANO', archetype: 'Niebla', description: 'Espectros, vampiros y presion silenciosa.', tone: 'neutral', mark: 'S' },
  { id: 'MAZO_NATURALEZA', name: 'Abrazo Forestal', faction: 'Naturaleza', commanderFaction: 'FURIA', archetype: 'Vida', description: 'Bestias, crecimiento y recuperacion.', tone: 'neutral', mark: 'N' },
  { id: 'MAZO_CELESTIAL', name: 'Reinos del Aire', faction: 'Orden', commanderFaction: 'ARCANO', archetype: 'Celestial', description: 'Criaturas voladoras y presencia desde el cielo.', tone: 'arcano', mark: 'C' },
  { id: 'MAZO_ACUATICO', name: 'Abismo Marino', faction: 'Abisal', commanderFaction: 'ARCANO', archetype: 'Aguas profundas', description: 'Leviatanes, hielo y amenazas de gran alcance.', tone: 'arcano', mark: 'M' },
  { id: 'MAZO_RENEGADOS', name: 'Pila de Renegados', faction: 'Mixto', commanderFaction: 'FURIA', archetype: 'Descarte', description: 'Caos, descarte y cartas que vuelven con fuerza.', tone: 'furia', mark: 'X' },
  { id: 'MAZO_ORCOS_BESTIAS', name: 'Horda Orca', faction: 'Furia', commanderFaction: 'FURIA', archetype: 'Horda', description: 'Orcos y bestias que dominan por volumen.', tone: 'furia', mark: 'H' },
];

export function getDeckDefinition(deckId: DeckId): DeckDefinition {
  const definition = DECK_CATALOG.find((deck) => deck.id === deckId);
  if (!definition) throw new Error(`No existe el mazo ${deckId}.`);
  return definition;
}
