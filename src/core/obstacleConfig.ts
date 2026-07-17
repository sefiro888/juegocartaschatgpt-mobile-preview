export interface ObstacleDefinition {
  name: string;
  description: string;
  terrainLabel: string;
}

const OBSTACLE_DEFINITIONS: Record<string, ObstacleDefinition> = {
  'obstaculo-risco': {
    name: 'Risco quebrado',
    description: 'Bloquea el paso y puede abrirse al derribarlo.',
    terrainLabel: 'Roca destructible',
  },
  'obstaculo-pilar': {
    name: 'Pilar de cristal',
    description: 'Un foco arcano que bloquea la casilla hasta colapsar.',
    terrainLabel: 'Cristal destructible',
  },
  'obstaculo-corriente': {
    name: 'Corriente arcana',
    description: 'Una fractura energetica que corta la ruta a traves de la casilla.',
    terrainLabel: 'Corriente destructible',
  },
  'obstaculo-lava': {
    name: 'Sello de brasa',
    description: 'Un sello ardiente que impide el paso hasta destruirlo.',
    terrainLabel: 'Sello destructible',
  },
};

export function isObstacleCardId(cardId: string): boolean {
  return cardId.startsWith('obstaculo-');
}

export function getObstacleDefinition(cardId: string): ObstacleDefinition {
  return OBSTACLE_DEFINITIONS[cardId] ?? {
    name: 'Obstaculo del santuario',
    description: 'Bloquea la casilla hasta que sea destruido.',
    terrainLabel: 'Terreno destructible',
  };
}
