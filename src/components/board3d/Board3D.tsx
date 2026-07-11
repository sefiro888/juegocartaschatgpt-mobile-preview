import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { Card3D } from './Card3D';
import type { BoardEntity, Position } from '../../types/card';
import { isAdjacent } from '../../core/engine';
import { CARDS_DB } from '../../core/cardsDb';
import { BOARD_SIZE, COMMANDER_COLUMN, OPPONENT_BACK_ROW, PLAYER_BACK_ROW } from '../../core/boardConfig';

// Grid tile sizes
const tileSize = 1.25;
const tileSpacing = 0.15;
const gridOffset = (BOARD_SIZE - 1) / 2;

// Helper for converting grid x,y to 3D world coordinates
const getWorldCoords = (x: number, y: number): [number, number, number] => {
  return [
    (x - gridOffset) * (tileSize + tileSpacing),
    0.11,
    -(y - gridOffset) * (tileSize + tileSpacing),
  ];
};

interface Tile3DProps {
  x: number;
  y: number;
  highlight: 'summon' | 'move' | 'attack' | 'spell' | null;
  onClick: () => void;
}

// Spectacular 3D tile slab component with pulsing magical glows on hover and targeting
const Tile3D: React.FC<Tile3DProps> = ({ x, y, highlight, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const coords = getWorldCoords(x, y);

  // Smooth frame loop animations using R3F useFrame hook
  useFrame((state) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.MeshStandardMaterial;

    if (highlight) {
      // Subtly pulse the stone material itself to show it is active, but keep it dark basalt stone
      const pulse = 0.05 + Math.sin(state.clock.getElapsedTime() * 4) * 0.03;
      material.emissiveIntensity = pulse;
      material.opacity = 1.0;
    } else if (hovered) {
      material.emissiveIntensity = 0.25;
      material.opacity = 1.0;
    } else {
      material.emissiveIntensity = 0;
      material.opacity = 1.0;
    }
  });

  // Default color checkers split by board territory
  let tileColor = '#000000';
  const isEven = (x + y) % 2 === 0;
  if (y <= 3) {
    // Player - Furia: Volcanic warm basalt
    tileColor = isEven ? '#2d1818' : '#1d1010';
  } else if (y >= 6) {
    // Opponent - Arcano: Cosmic cool basalt
    tileColor = isEven ? '#101c2c' : '#09111c';
  } else {
    // Row 3 - Neutral dividing line: Obsidian dark gray
    tileColor = isEven ? '#17181c' : '#101114';
  }

  let emissiveColor = '#000000';
  let highlightColor = '#000000';

  if (highlight === 'summon') {
    highlightColor = '#10b981'; // Green glow
    emissiveColor = '#065f46';
  } else if (highlight === 'move') {
    highlightColor = '#3b82f6'; // Blue glow
    emissiveColor = '#1e3a8a';
  } else if (highlight === 'attack') {
    highlightColor = '#ef4444'; // Red glow
    emissiveColor = '#7f1d1d';
  } else if (highlight === 'spell') {
    highlightColor = '#06b6d4'; // Cyan glow
    emissiveColor = '#155e75';
  } else if (hovered) {
    emissiveColor = '#6366f1'; // Indigo outline on mouseover
  }

  const isCommanderSpot =
    (x === COMMANDER_COLUMN && y === PLAYER_BACK_ROW) ||
    (x === COMMANDER_COLUMN && y === OPPONENT_BACK_ROW);

  return (
    <group position={coords}>
      <mesh
        ref={meshRef}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        {/* Tile thickness 0.2 to make it feel like a heavy solid block */}
        <boxGeometry args={[tileSize, 0.2, tileSize]} />
        <meshStandardMaterial
          color={tileColor}
          emissive={highlight ? highlightColor : emissiveColor}
          emissiveIntensity={highlight ? 0.35 : hovered ? 0.3 : 0}
          roughness={0.8}
          metalness={0.15}
        />
        {/* Decorative Runic Gold or Indigo cell borders */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(tileSize, 0.2, tileSize)]} />
          <lineBasicMaterial color={highlight ? highlightColor : hovered ? '#818cf8' : '#1c2230'} linewidth={1.5} />
        </lineSegments>
      </mesh>

      {/* Glowing magic circle on commander spots */}
      {isCommanderSpot && (
        <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[tileSize * 0.32, tileSize * 0.38, 32]} />
          <meshBasicMaterial
            color={y === 0 ? '#ff4d00' : '#8b5cf6'}
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Glowing targeting magic circle on highlighted spots (looks like reference magic circles!) */}
      {highlight && (
        <group position={[0, 0.105, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[tileSize * 0.32, tileSize * 0.38, 32]} />
            <meshBasicMaterial
              color={highlightColor}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0, tileSize * 0.1, 16]} />
            <meshBasicMaterial
              color={highlightColor}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

export const Board3D: React.FC = () => {
  const {
    gameState,
    selectedCardInHand,
    selectedEntity,
    selectEntity,
    setHoveredEntity,
    summon,
    move,
    attack,
    castSpell,
  } = useGameStore();

  const [deathExplosions, setDeathExplosions] = useState<{ id: string; position: Position; faction: string }[]>([]);
  const prevBoardRef = useRef<Record<string, BoardEntity>>({});

  useEffect(() => {
    if (!gameState) return;
    const prevBoard = prevBoardRef.current;
    const currentBoard = gameState.board;

    // Detect deaths
    Object.values(prevBoard).forEach(prevEntity => {
      const isStillAlive = Object.values(currentBoard).some(curr => curr.id === prevEntity.id);
      if (!isStillAlive) {
        const card = CARDS_DB[prevEntity.cardId];
        setDeathExplosions(prev => [
          ...prev,
          {
            id: `${prevEntity.id}_death_${Date.now()}`,
            position: prevEntity.position,
            faction: card?.faction || 'FURIA'
          }
        ]);
      }
    });

    prevBoardRef.current = { ...currentBoard };
  }, [gameState]);

  if (!gameState) return null;

  // Check highlight states
  const getTileHighlight = (x: number, y: number): 'summon' | 'move' | 'attack' | 'spell' | null => {
    const key = `${x},${y}`;
    const cellOccupied = !!gameState.board[key];
    const occupant = gameState.board[key];

    // Case 1: Spell Targeting
    if (selectedCardInHand && selectedCardInHand.type === 'HECHIZO') {
      if (occupant && !CARDS_DB[occupant.cardId]?.rulesText.includes('Inmune a Hechizos')) {
        if (selectedCardInHand.id === 'destello-runico') {
          const commander = Object.values(gameState.board).find(ent => ent.id === 'commander-player');
          if (commander && isAdjacent(commander.position, { x, y }, false)) {
            return 'spell';
          }
          return null;
        }
        return 'spell';
      }
      return null;
    }

    // Case 2: Summoning unit/structure
    if (selectedCardInHand && (selectedCardInHand.type === 'UNIDAD' || selectedCardInHand.type === 'ESTRUCTURA')) {
      if (cellOccupied) return null;

      const isBackrow = y === PLAYER_BACK_ROW;
      let hasAdjacentAlly = false;
      for (const ent of Object.values(gameState.board)) {
        if (ent.controller === 'PLAYER' && isAdjacent(ent.position, { x, y }, false)) {
          hasAdjacentAlly = true;
          break;
        }
      }
      return (isBackrow || hasAdjacentAlly) ? 'summon' : null;
    }

    // Case 3: Unit selected on board (Movement or Attack)
    if (selectedEntity) {
      if (selectedEntity.frozenTurns > 0) return null;
      if (selectedEntity.position.x === x && selectedEntity.position.y === y) return null;

      const diagonal = CARDS_DB[selectedEntity.cardId]?.rulesText.includes('Movimiento Diagonal');
      const adjacent = isAdjacent(selectedEntity.position, { x, y }, diagonal);

      if (adjacent) {
        if (!cellOccupied && !selectedEntity.hasMovedThisTurn) {
          return 'move';
        }
        if (cellOccupied && occupant.controller === 'OPPONENT' && !selectedEntity.hasAttackedThisTurn) {
          const refCard = CARDS_DB[selectedEntity.cardId];
          if (refCard && refCard.type !== 'ESTRUCTURA') {
            return 'attack';
          }
        }
      }
    }

    return null;
  };

  // Click handler
  const handleTileClick = (x: number, y: number) => {
    const highlight = getTileHighlight(x, y);
    const key = `${x},${y}`;
    const occupant = gameState.board[key];

    if (highlight === 'summon' && selectedCardInHand) {
      let enemyPos: Position | undefined = undefined;
      if (selectedCardInHand.id === 'tejedora-escarcha') {
        const enemy = Object.values(gameState.board).find(ent => ent.controller === 'OPPONENT');
        if (enemy) enemyPos = enemy.position;
      }
      summon(selectedCardInHand.id, { x, y }, enemyPos);
    } else if (highlight === 'spell' && selectedCardInHand) {
      castSpell(selectedCardInHand.id, { x, y });
    } else if (highlight === 'move' && selectedEntity) {
      move(selectedEntity.position, { x, y });
    } else if (highlight === 'attack' && selectedEntity) {
      attack(selectedEntity.position, { x, y });
    } else if (occupant && occupant.controller === 'PLAYER') {
      if (selectedEntity && selectedEntity.id === occupant.id) {
        selectEntity(null);
      } else {
        selectEntity(occupant);
      }
    } else {
      selectEntity(null);
    }
  };

  const boardWidth = BOARD_SIZE * (tileSize + tileSpacing) + 0.3;

  return (
    <div className="board3d-wrapper">
      <Canvas
        camera={{ position: [0, 10.5, 12.5], fov: 48 }}
        shadows
        className="canvas3d"
        gl={{ alpha: true }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Stars radius={100} depth={50} count={1500} factor={4} saturation={0.5} fade speed={1} />
        <Sparkles count={40} scale={12} size={1.2} speed={0.4} color="#00d9ff" />
        
        {/* Lights setup for dramatic 3D shadow map */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[5, 12, 4]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-5, 4, -5]} intensity={0.6} color="#00d9ff" />
        <pointLight position={[5, 4, 5]} intensity={0.6} color="#ff3e3e" />

        {/* ═══ OUTER FRAME BOARD BEZEL (PHYSICAL BOARD GAME FEEL) ═══ */}
        {/* Step 1: Bottom dark stone slab */}
        <mesh position={[0, -0.26, 0]} receiveShadow>
          <boxGeometry args={[boardWidth + 0.6, 0.28, boardWidth + 0.6]} />
          <meshStandardMaterial color="#080c10" roughness={0.9} />
        </mesh>
        
        {/* Step 2: Middle dark blue stone tier */}
        <mesh position={[0, -0.12, 0]} receiveShadow>
          <boxGeometry args={[boardWidth + 0.2, 0.16, boardWidth + 0.2]} />
          <meshStandardMaterial color="#0f141d" roughness={0.8} metalness={0.2} />
        </mesh>
        
        {/* Step 3: Top Bezel with glowing trim */}
        <mesh position={[0, -0.04, 0]} receiveShadow>
          <boxGeometry args={[boardWidth, 0.08, boardWidth]} />
          <meshStandardMaterial color="#1a202c" roughness={0.7} metalness={0.5} />
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(boardWidth, 0.08, boardWidth)]} />
            <lineBasicMaterial color="#6366f1" opacity={0.3} transparent />
          </lineSegments>
        </mesh>

        {/* Pulsing subfloor under the spaced grid tiles */}
        <SubFloor boardWidth={boardWidth} />

        {/* Outer Corner Pillars for both factions */}
        <CornerPillars boardWidth={boardWidth} />

        {/* Floating Citadel rocky island base underneath */}
        <FloatingRocks boardWidth={boardWidth} />

        {/* Castle towers flanking the board sides */}
        <CastleTowers boardWidth={boardWidth} />

        {/* Player Gothic Invocations Portal (Furia - Warm/Magma) */}
        <GothicPortal position={[0, 0.05, boardWidth / 2 + 0.35]} rotation={[0, Math.PI, 0]} isFuria={true} />

        {/* Opponent Gothic Invocations Portal (Arcano - Cool/Celestial) */}
        <GothicPortal position={[0, 0.05, -boardWidth / 2 - 0.35]} rotation={[0, 0, 0]} isFuria={false} />

        {/* Runic Stone Bridges connecting to Portals */}
        <PortalBridges boardWidth={boardWidth} />

        {/* Floating Mana Crystals bobbing in the void */}
        <FloatingCrystal position={[-boardWidth / 2 - 1.2, 0.8, -1]} color="#8b5cf6" offset={0} />
        <FloatingCrystal position={[boardWidth / 2 + 1.2, 1.0, -2]} color="#00e5ff" offset={1.5} />
        <FloatingCrystal position={[-boardWidth / 2 - 1.5, 0.6, 2]} color="#ff4d00" offset={3.0} />
        <FloatingCrystal position={[boardWidth / 2 + 1.5, 0.8, 1]} color="#ec4899" offset={4.5} />

        {/* Board grid tiles */}
        <group>
          {Array.from({ length: BOARD_SIZE }).map((_, x) =>
            Array.from({ length: BOARD_SIZE }).map((_, y) => {
              const highlight = getTileHighlight(x, y);
              return (
                <Tile3D
                  key={`${x},${y}`}
                  x={x}
                  y={y}
                  highlight={highlight}
                  onClick={() => handleTileClick(x, y)}
                />
              );
            })
          )}
        </group>

        {/* Board Units/Entities */}
        {Object.values(gameState.board).map((entity) => {
          // Render Neutral Obstacles differently as actual 3D shapes
          if (entity.cardId.startsWith('obstaculo-')) {
            return (
              <Obstacle3D
                key={entity.id}
                entity={entity}
              />
            );
          }

          const isHidden = !isEntityVisible(entity, gameState.board);
          return (
            <Card3D
              key={entity.id}
              entity={entity}
              isSelected={selectedEntity?.id === entity.id}
              isHidden={isHidden}
              onClick={() => handleTileClick(entity.position.x, entity.position.y)}
              onHover={(h) => setHoveredEntity(h ? entity : null)}
            />
          );
        })}

        {/* Particle Death Explosions */}
        {deathExplosions.map(exp => (
          <DeathExplosion3D
            key={exp.id}
            position={exp.position}
            faction={exp.faction}
            onComplete={() => {
              setDeathExplosions(prev => prev.filter(e => e.id !== exp.id));
            }}
          />
        ))}

        <OrbitControls
          enablePan={false}
          minPolarAngle={0.4}
          maxPolarAngle={1.1}
          minDistance={7}
          maxDistance={18}
        />
      </Canvas>

      <style>{`
        .board3d-wrapper {
          flex: 1;
          position: relative;
          background: radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.12) 0%, transparent 60%),
                      radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.12) 0%, transparent 60%),
                      radial-gradient(circle at 50% 50%, #0d0a21 0%, #020106 100%);
          border-radius: 12px;
          border: 1.2px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
          box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.95);
        }
        .canvas3d {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

interface DeathExplosion3DProps {
  position: Position;
  faction: string;
  onComplete: () => void;
}

const DeathExplosion3D: React.FC<DeathExplosion3DProps> = ({ position, faction, onComplete }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const startTime = useRef(Date.now());
  const duration = 750; // 750ms

  // Position on the 3D board
  const posX = (position.x - gridOffset) * (tileSize + tileSpacing);
  const posZ = -(position.y - gridOffset) * (tileSize + tileSpacing);

  const particleCount = 35;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Start at center
      pos[i * 3] = posX;
      pos[i * 3 + 1] = 0.5; // standee center height
      pos[i * 3 + 2] = posZ;

      // Random spherical velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 1.2 + Math.random() * 2.2;

      vel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + 1.2; // upwards bias
      vel[i * 3 + 2] = Math.cos(phi) * speed;
    }
    return [pos, vel];
  }, [posX, posZ]);

  const color = faction === 'FURIA' ? '#ff3e3e' : '#00d9ff';

  useFrame((_, delta) => {
    const elapsed = Date.now() - startTime.current;
    if (elapsed >= duration) {
      onComplete();
      return;
    }

    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
      
      for (let i = 0; i < particleCount; i++) {
        posAttr.array[i * 3] += velocities[i * 3] * delta;
        posAttr.array[i * 3 + 1] += velocities[i * 3 + 1] * delta;
        posAttr.array[i * 3 + 2] += velocities[i * 3 + 2] * delta;

        // Gravity pull
        velocities[i * 3 + 1] -= 3.5 * delta;
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.15}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

function isEntityVisible(entity: BoardEntity, board: Record<string, BoardEntity>): boolean {
  if (entity.controller === 'PLAYER') return true;
  if (entity.cardId.startsWith('obstaculo-')) return true; // Obstacles are always visible!
  
  // A tile is visible if it is Y <= 2 (our side) OR within distance 2 of any player entity
  if (entity.position.y <= 2) return true;

  const playerEntities = Object.values(board).filter((e) => e.controller === 'PLAYER');
  return playerEntities.some((pe) => {
    const dx = Math.abs(pe.position.x - entity.position.x);
    const dy = Math.abs(pe.position.y - entity.position.y);
    return (dx + dy) <= 2;
  });
}

interface Obstacle3DProps {
  entity: BoardEntity;
}

const Obstacle3D: React.FC<Obstacle3DProps> = ({ entity }) => {
  const posX = (entity.position.x - gridOffset) * (tileSize + tileSpacing);
  const posZ = -(entity.position.y - gridOffset) * (tileSize + tileSpacing);
  
  const isLava = entity.cardId === 'obstaculo-lava';
  
  return (
    <group position={[posX, 0.15, posZ]}>
      {isLava ? (
        // Lava Crater: Volcanic cylinder with glowing lava core & warm rising sparkles
        <group>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.7, 0.8, 0.3, 16]} />
            <meshStandardMaterial color="#1e1310" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.02, 16]} />
            <meshStandardMaterial color="#ff3e3e" emissive="#ef4444" emissiveIntensity={2.5} />
          </mesh>
          <Sparkles count={6} scale={0.6} size={1.2} speed={0.8} color="#ff5a00" position={[0, 0.2, 0]} />
        </group>
      ) : (
        // Runic Pillar: Stone column with glowing cyan details & cold sparkles
        <group>
          <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
            <boxGeometry args={[0.5, 1.2, 0.5]} />
            <meshStandardMaterial color="#1f2937" roughness={0.8} metalness={0.1} />
            <mesh position={[0, 0.61, 0]}>
              <boxGeometry args={[0.2, 0.05, 0.52]} />
              <meshStandardMaterial color="#00d9ff" emissive="#06b6d4" emissiveIntensity={3} />
            </mesh>
            <mesh position={[0, 0.2, 0.26]}>
              <boxGeometry args={[0.1, 0.6, 0.01]} />
              <meshStandardMaterial color="#00d9ff" emissive="#06b6d4" emissiveIntensity={2} />
            </mesh>
          </mesh>
          <Sparkles count={5} scale={0.5} size={1.0} speed={0.5} color="#00e5ff" position={[0, 0.8, 0]} />
        </group>
      )}
    </group>
  );
};

const SubFloor: React.FC<{ boardWidth: number }> = ({ boardWidth }) => {
  const matFuria = useRef<THREE.MeshBasicMaterial>(null);
  const matArcano = useRef<THREE.MeshBasicMaterial>(null);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (matFuria.current) {
      // Slow pulse magma under the cracks
      const pulse = 0.65 + Math.sin(time * 1.5) * 0.35;
      matFuria.current.color.setRGB(pulse * 1.0, pulse * 0.2, 0.0);
    }
    if (matArcano.current) {
      // Slow pulse arcane mana
      const pulse = 0.65 + Math.sin(time * 1.8) * 0.35;
      matArcano.current.color.setRGB(0.0, pulse * 0.55, pulse * 1.0);
    }
  });

  return (
    <group position={[0, 0.015, 0]}>
      {/* Furia side (magma) - occupying player's half of the board */}
      <mesh position={[0, 0, boardWidth / 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[boardWidth, boardWidth / 2]} />
        <meshBasicMaterial ref={matFuria} color="#ff3e00" />
      </mesh>
      {/* Arcano side (celestial) - occupying opponent's half of the board */}
      <mesh position={[0, 0, -boardWidth / 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[boardWidth, boardWidth / 2]} />
        <meshBasicMaterial ref={matArcano} color="#00bfff" />
      </mesh>
    </group>
  );
};

const CornerPillars: React.FC<{ boardWidth: number }> = ({ boardWidth }) => {
  const half = boardWidth / 2;
  const positions: [number, number, number][] = [
    [-half, 0.1, -half], // Arcano corner 1
    [half, 0.1, -half],  // Arcano corner 2
    [-half, 0.1, half],  // Furia corner 1
    [half, 0.1, half],   // Furia corner 2
  ];

  return (
    <>
      {positions.map((pos, idx) => (
        <group key={idx} position={pos}>
          {/* Main heavy stone/metal pillar body */}
          <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
            <boxGeometry args={[0.3, 0.6, 0.3]} />
            <meshStandardMaterial color="#2d3748" roughness={0.8} metalness={0.6} />
          </mesh>
          {/* Glowing faction crystal tip */}
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[0.22, 0.06, 0.22]} />
            <meshStandardMaterial
              color={idx < 2 ? '#00e5ff' : '#ff4d00'}
              emissive={idx < 2 ? '#00e5ff' : '#ff4d00'}
              emissiveIntensity={2}
            />
          </mesh>
        </group>
      ))}
    </>
  );
};

const FloatingRocks: React.FC<{ boardWidth: number }> = ({ boardWidth }) => {
  return (
    <group position={[0, -0.65, 0]}>
      {/* Main central rocky island body */}
      <mesh castShadow receiveShadow>
        <coneGeometry args={[boardWidth / 2 + 0.3, 1.1, 5]} />
        <meshStandardMaterial color="#181a22" roughness={0.9} flatShading />
      </mesh>
      {/* Surrounding floating stones shards */}
      <mesh position={[-boardWidth / 2 - 1.2, -0.2, -boardWidth / 2 - 1.2]} rotation={[0.4, 0.2, 0.1]}>
        <dodecahedronGeometry args={[0.45]} />
        <meshStandardMaterial color="#111216" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[boardWidth / 2 + 1.4, -0.4, boardWidth / 2 + 0.9]} rotation={[0.2, 0.5, 0.9]}>
        <dodecahedronGeometry args={[0.55]} />
        <meshStandardMaterial color="#111216" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[boardWidth / 2 + 1.3, -0.1, -boardWidth / 2 - 0.7]} rotation={[0.8, 0.1, 0.3]}>
        <dodecahedronGeometry args={[0.35]} />
        <meshStandardMaterial color="#111216" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
};

const CastleTowers: React.FC<{ boardWidth: number }> = ({ boardWidth }) => {
  const half = boardWidth / 2;
  return (
    <group>
      {/* Left Castle Tower */}
      <group position={[-half - 0.5, 0.3, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.4, 1.0, 8]} />
          <meshStandardMaterial color="#1b1e26" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <coneGeometry args={[0.4, 0.35, 8]} />
          <meshStandardMaterial color="#0b0d10" roughness={0.9} />
        </mesh>
      </group>
      {/* Right Castle Tower */}
      <group position={[half + 0.5, 0.3, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.4, 1.0, 8]} />
          <meshStandardMaterial color="#1b1e26" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <coneGeometry args={[0.4, 0.35, 8]} />
          <meshStandardMaterial color="#0b0d10" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

interface GothicPortalProps {
  position: [number, number, number];
  rotation: [number, number, number];
  isFuria: boolean;
}

const GothicPortal: React.FC<GothicPortalProps> = ({ position, rotation, isFuria }) => {
  const portalMat = useRef<THREE.MeshStandardMaterial>(null);
  
  useFrame((state) => {
    if (portalMat.current) {
      const t = state.clock.getElapsedTime();
      portalMat.current.emissiveIntensity = 1.8 + Math.sin(t * 3.5) * 0.45;
    }
  });

  const color = isFuria ? '#ff4d00' : '#8b5cf6';
  
  return (
    <group position={position} rotation={rotation}>
      {/* Left Gothic Pillar */}
      <mesh castShadow receiveShadow position={[-0.7, 0.85, 0]}>
        <boxGeometry args={[0.18, 1.7, 0.22]} />
        <meshStandardMaterial color="#2d3748" roughness={0.8} />
      </mesh>
      {/* Right Gothic Pillar */}
      <mesh castShadow receiveShadow position={[0.7, 0.85, 0]}>
        <boxGeometry args={[0.18, 1.7, 0.22]} />
        <meshStandardMaterial color="#2d3748" roughness={0.8} />
      </mesh>
      {/* Arch Top Header */}
      <mesh castShadow receiveShadow position={[0, 1.7, 0]}>
        <boxGeometry args={[1.58, 0.18, 0.3]} />
        <meshStandardMaterial color="#1a202c" roughness={0.8} />
      </mesh>
      {/* Arch Top Crown */}
      <mesh castShadow receiveShadow position={[0, 1.88, 0]}>
        <coneGeometry args={[0.26, 0.18, 4]} />
        <meshStandardMaterial color="#2d3748" roughness={0.8} />
      </mesh>
      {/* Swirling Magical Portal Plane inside */}
      <mesh position={[0, 0.85, 0.015]}>
        <planeGeometry args={[1.2, 1.5]} />
        <meshStandardMaterial
          ref={portalMat}
          color={color}
          emissive={color}
          emissiveIntensity={1.8}
          transparent
          opacity={0.7}
        />
      </mesh>
      <Sparkles count={6} scale={1.1} size={1.2} speed={0.5} color={color} position={[0, 0.85, 0]} />
    </group>
  );
};

interface FloatingCrystalProps {
  position: [number, number, number];
  color: string;
  offset: number;
}

const FloatingCrystal: React.FC<FloatingCrystalProps> = ({ position, color, offset }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.position.y = position[1] + Math.sin(t * 1.3 + offset) * 0.12;
    ref.current.rotation.y += delta * 0.35;
    ref.current.rotation.x += delta * 0.12;
  });

  return (
    <mesh ref={ref} position={position} castShadow>
      <octahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.6}
        roughness={0.15}
        metalness={0.85}
      />
    </mesh>
  );
};

const PortalBridges: React.FC<{ boardWidth: number }> = ({ boardWidth }) => {
  const half = boardWidth / 2;
  return (
    <group>
      {/* Bridge to Opponent Portal */}
      <mesh position={[0, 0.02, -half - 0.18]} receiveShadow>
        <boxGeometry args={[1.5, 0.04, 0.38]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>
      {/* Bridge to Player Portal */}
      <mesh position={[0, 0.02, half + 0.18]} receiveShadow>
        <boxGeometry args={[1.5, 0.04, 0.38]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>
    </group>
  );
};
