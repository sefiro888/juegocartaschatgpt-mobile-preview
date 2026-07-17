import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useGameStore } from '../../store/gameStore';
import { Card3D } from './Card3D';
import { FloatingSanctuary } from './FloatingSanctuary';
import { BoardFoundation, SanctuaryObstacle } from './SanctuaryBoardAssets';
import { SanctuaryMaterialsProvider, useSanctuaryMaterials } from './SanctuaryMaterials';
import type { BoardEntity, Position } from '../../types/card';
import { canAttackTarget, isAdjacent } from '../../core/engine';
import { CARDS_DB } from '../../core/cardsDb';
import { PLAYER_BACK_ROW } from '../../core/boardConfig';
import {
  BOARD_CELL_SIZE,
  BOARD_SURFACE_Y,
  BOARD_VISUAL_NODES,
  getBoardVisualNode,
  getMovementPath,
  getMovementPathThroughNodes,
  type BoardVisualNode,
  type WorldPoint,
} from '../../core/boardVisualLayout';
import { getReachablePositions, isBoardObstacle, positionKey } from '../../core/boardPathfinding';

type NodeHighlight = 'summon' | 'move' | 'attack' | 'spell' | null;

const HIGHLIGHT_COLORS: Record<Exclude<NodeHighlight, null>, string> = {
  summon: '#63e6b5',
  move: '#6bc7ff',
  attack: '#ff786b',
  spell: '#70e4ff',
};

const CAMERA_TARGET: WorldPoint = [0, BOARD_SURFACE_Y, 0.35];

interface TacticalGrid3DProps {
  nodes: BoardVisualNode[];
  highlights: Map<string, NodeHighlight>;
  showFoundation: boolean;
  useDetailedTextures: boolean;
  onNodeClick: (node: BoardVisualNode) => void;
  onNodeHover: (node: BoardVisualNode | null) => void;
}

const TargetMarker: React.FC<{ color: string; radius: number }> = ({ color, radius }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const pulse = 0.94 + Math.sin(time * 3.2) * 0.07;
    groupRef.current.scale.setScalar(pulse);
    groupRef.current.rotation.y = time * 0.24;
  });

  return (
    <group ref={groupRef} position={[0, 0.08, 0]} renderOrder={40}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={40}>
        <ringGeometry args={[radius * 0.72, radius, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={41}>
        <ringGeometry args={[radius * 0.26, radius * 0.31, 32]} />
        <meshBasicMaterial color="#e9fbff" transparent opacity={0.76} side={THREE.DoubleSide} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
  );
};

function getCellColor(node: BoardVisualNode, highlight: NodeHighlight, hovered: boolean): THREE.Color {
  if (highlight) return new THREE.Color(HIGHLIGHT_COLORS[highlight]);

  const variation = (node.logicalPosition.x * 17 + node.logicalPosition.y * 11) % 5;
  let color: THREE.Color;
  if (node.logicalPosition.y <= 1) {
    color = new THREE.Color(['#edf3f5', '#e2ecef', '#e8f0f2', '#dbe7eb', '#e5edef'][variation]);
  } else if (node.logicalPosition.y >= 8) {
    color = new THREE.Color(['#e0eaf0', '#d6e3e9', '#dce7ec', '#cfdee5', '#d9e5ea'][variation]);
  } else {
    color = new THREE.Color(['#e8eff1', '#dce7ea', '#e3ebed', '#d4e1e5', '#dfe8eb'][variation]);
  }

  if (hovered) color.lerp(new THREE.Color('#eff8fa'), 0.38);
  return color;
}

const TacticalGrid3D: React.FC<TacticalGrid3DProps> = ({
  nodes,
  highlights,
  showFoundation,
  useDetailedTextures,
  onNodeClick,
  onNodeHover,
}) => {
  const { tile } = useSanctuaryMaterials();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const temporaryObject = useMemo(() => new THREE.Object3D(), []);
  const tileGeometry = useMemo(() => {
    const geometry = new RoundedBoxGeometry(BOARD_CELL_SIZE - 0.07, 0.13, BOARD_CELL_SIZE - 0.07, 2, 0.028);
    const uv = geometry.getAttribute('uv');
    for (let index = 0; index < uv.count; index += 1) {
      uv.setXY(index, uv.getX(index) * 0.28 + 0.12, uv.getY(index) * 0.28 + 0.2);
    }
    uv.needsUpdate = true;
    return geometry;
  }, []);
  const [hoveredInstanceId, setHoveredInstanceId] = useState<number | null>(null);

  useEffect(() => () => tileGeometry.dispose(), [tileGeometry]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    nodes.forEach((node, index) => {
      const settle = ((node.logicalPosition.x * 13 + node.logicalPosition.y * 7) % 5 - 2) * 0.0025;
      const quarterTurn = (node.logicalPosition.x * 3 + node.logicalPosition.y * 5) % 4;
      temporaryObject.position.set(
        node.worldPosition[0],
        node.worldPosition[1] - 0.065 + settle,
        node.worldPosition[2],
      );
      temporaryObject.rotation.set(0, quarterTurn * Math.PI / 2, 0);
      temporaryObject.scale.set(1, 1, 1);
      temporaryObject.updateMatrix();
      meshRef.current?.setMatrixAt(index, temporaryObject.matrix);
      meshRef.current?.setColorAt(
        index,
        getCellColor(node, highlights.get(node.id) ?? null, hoveredInstanceId === index),
      );
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    meshRef.current.computeBoundingBox();
    meshRef.current.computeBoundingSphere();
  }, [highlights, hoveredInstanceId, nodes, temporaryObject]);

  const updateHoveredInstance = (instanceId: number | null) => {
    if (instanceId === hoveredInstanceId) return;
    setHoveredInstanceId(instanceId);
    onNodeHover(instanceId === null ? null : nodes[instanceId] ?? null);
  };

  return (
    <group>
      {showFoundation && <BoardFoundation />}

      <instancedMesh
        ref={meshRef}
        args={[tileGeometry, undefined, nodes.length]}
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          if (event.instanceId === undefined) return;
          const node = nodes[event.instanceId];
          if (node) onNodeClick(node);
        }}
        onPointerMove={(event) => {
          event.stopPropagation();
          updateHoveredInstance(event.instanceId ?? null);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          updateHoveredInstance(null);
        }}
      >
        <meshStandardMaterial
          map={useDetailedTextures ? tile.map : undefined}
          color="#f5f7f7"
          emissiveMap={useDetailedTextures ? tile.map : undefined}
          emissive="#a7bac1"
          emissiveIntensity={0.22}
          vertexColors
          roughness={0.96}
          metalness={0.025}
        />
      </instancedMesh>

      {nodes.map((node) => {
        const highlight = highlights.get(node.id) ?? null;
        if (!highlight) return null;
        return (
          <group key={`${node.id}-${highlight}`} position={node.worldPosition}>
            <TargetMarker color={HIGHLIGHT_COLORS[highlight]} radius={node.visualRadius * 0.78} />
          </group>
        );
      })}
    </group>
  );
};

interface ValidRouteProps {
  points: WorldPoint[];
  highlight: Exclude<NodeHighlight, null>;
}

const ValidRoute: React.FC<ValidRouteProps> = ({ points, highlight }) => {
  const liftedPoints = points.map(([x, y, z]) => [x, y + 0.045, z] as WorldPoint);
  return (
    <Line
      points={liftedPoints}
      color={HIGHLIGHT_COLORS[highlight]}
      lineWidth={1.55}
      transparent
      opacity={0.58}
      dashed
      dashSize={0.22}
      gapSize={0.14}
      depthWrite={false}
    />
  );
};

interface CanvasHealthMonitorProps {
  onContextLost: () => void;
  onContextRestored: () => void;
}

const CanvasHealthMonitor: React.FC<CanvasHealthMonitorProps> = ({ onContextLost, onContextRestored }) => {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    canvas.addEventListener('webglcontextlost', handleLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
    };
  }, [gl, onContextLost, onContextRestored]);

  return null;
};

interface DeathExplosion3DProps {
  worldPosition: WorldPoint;
  faction: string;
  onComplete: () => void;
}

const DeathExplosion3D: React.FC<DeathExplosion3DProps> = ({ worldPosition, faction, onComplete }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const elapsedRef = useRef(0);
  const particleCount = 28;
  const [positions, velocities] = useMemo(() => {
    const nextPositions = new Float32Array(particleCount * 3);
    const nextVelocities = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      const theta = (index / particleCount) * Math.PI * 2;
      const spread = 0.65 + ((index * 17) % 11) / 10;
      nextPositions[index * 3] = 0;
      nextPositions[index * 3 + 1] = 0.7;
      nextPositions[index * 3 + 2] = 0;
      nextVelocities[index * 3] = Math.cos(theta) * spread;
      nextVelocities[index * 3 + 1] = 1.1 + ((index * 7) % 9) / 7;
      nextVelocities[index * 3 + 2] = Math.sin(theta) * spread;
    }

    return [nextPositions, nextVelocities];
  }, []);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    if (elapsedRef.current >= 0.72) {
      onComplete();
      return;
    }

    const positionAttribute = pointsRef.current?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!positionAttribute) return;

    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      positionAttribute.array[offset] += velocities[offset] * delta;
      positionAttribute.array[offset + 1] += velocities[offset + 1] * delta;
      positionAttribute.array[offset + 2] += velocities[offset + 2] * delta;
      velocities[offset + 1] -= 3.1 * delta;
    }
    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={worldPosition}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={faction === 'FURIA' ? '#ffad66' : '#83ddff'}
        size={0.13}
        transparent
        opacity={0.82}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

interface AttackAnimation3DProps {
  from: WorldPoint;
  to: WorldPoint;
  faction: string;
  onComplete: () => void;
}

const AttackAnimation3D: React.FC<AttackAnimation3DProps> = ({ from, to, faction, onComplete }) => {
  const boltRef = useRef<THREE.Mesh>(null);
  const impactRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const [start, end, arc] = useMemo(() => {
    const nextStart = new THREE.Vector3(from[0], from[1] + 1.05, from[2]);
    const nextEnd = new THREE.Vector3(to[0], to[1] + 1.02, to[2]);
    const midpoint = nextStart.clone().lerp(nextEnd, 0.5);
    midpoint.y += 0.58;
    return [nextStart, nextEnd, new THREE.QuadraticBezierCurve3(nextStart, midpoint, nextEnd)];
  }, [from, to]);
  const color = faction === 'FURIA' ? '#ff9d55' : '#72d7ff';

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const progress = Math.min(1, elapsedRef.current / 0.58);
    const travel = Math.min(1, progress / 0.56);
    const impact = THREE.MathUtils.smoothstep(progress, 0.42, 0.96);

    if (boltRef.current) {
      boltRef.current.visible = travel < 1;
      boltRef.current.position.copy(arc.getPoint(travel));
      boltRef.current.scale.setScalar(0.75 + Math.sin(travel * Math.PI) * 0.52);
    }
    if (impactRef.current) {
      impactRef.current.visible = impact > 0;
      impactRef.current.scale.setScalar(0.35 + impact * 1.9);
      impactRef.current.rotation.z += delta * 6.5;
    }
    if (lightRef.current) lightRef.current.intensity = Math.max(0, Math.sin(impact * Math.PI) * 3.5);

    if (progress >= 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  return (
    <group>
      <Line
        points={[start, end]}
        color={color}
        lineWidth={1.5}
        transparent
        opacity={0.3}
        dashed
        dashSize={0.2}
        gapSize={0.16}
        depthWrite={false}
      />
      <mesh ref={boltRef}>
        <sphereGeometry args={[0.13, 14, 14]} />
        <meshBasicMaterial color={color} transparent opacity={0.96} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <group ref={impactRef} position={end} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.42, 36]} />
          <meshBasicMaterial color={color} transparent opacity={0.82} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.18, 14, 14]} />
          <meshBasicMaterial color="#fff4dc" transparent opacity={0.76} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
      <pointLight ref={lightRef} position={end} color={color} intensity={0} distance={4.4} decay={2} />
    </group>
  );
};

function isEntityVisible(entity: BoardEntity, board: Record<string, BoardEntity>): boolean {
  if (entity.controller === 'PLAYER' || entity.cardId.startsWith('obstaculo-')) return true;
  if (entity.position.y <= 2) return true;

  return Object.values(board)
    .filter((candidate) => candidate.controller === 'PLAYER')
    .some((playerEntity) => {
      const deltaX = Math.abs(playerEntity.position.x - entity.position.x);
      const deltaY = Math.abs(playerEntity.position.y - entity.position.y);
      return deltaX + deltaY <= 2;
    });
}

const ResponsiveCamera: React.FC = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || size.height === 0) return;
    const aspect = size.width / size.height;

    if (aspect < 0.82) {
      camera.position.set(0, 24.5, 31);
      camera.fov = 52;
    } else if (aspect < 1.35) {
      camera.position.set(8.8, 20.5, 28);
      camera.fov = 47;
    } else {
      camera.position.set(11.8, 19.2, 23.5);
      camera.fov = 43;
    }

    camera.lookAt(...CAMERA_TARGET);
    camera.updateProjectionMatrix();
  }, [camera, size.height, size.width]);

  return null;
};

export const Board3D: React.FC = () => {
  const {
    gameState,
    selectedCardInHand,
    selectedEntity,
    hoveredEntity,
    selectEntity,
    setHoveredEntity,
    summon,
    move,
    attack,
    castSpell,
  } = useGameStore();
  const [deathExplosions, setDeathExplosions] = useState<Array<{ id: string; position: Position; faction: string }>>([]);
  const [movementAnimationRoutes, setMovementAnimationRoutes] = useState<Record<string, Position[]>>({});
  const [attackAnimations, setAttackAnimations] = useState<Array<{
    id: string;
    attackerId: string;
    targetId: string;
    from: Position;
    to: Position;
    faction: string;
  }>>([]);
  const [hoveredTacticalNodeId, setHoveredTacticalNodeId] = useState<string | null>(null);
  const [canvasStatus, setCanvasStatus] = useState<'ready' | 'lost'>('ready');
  const previousBoardRef = useRef<Record<string, BoardEntity>>({});

  useEffect(() => {
    if (!gameState) return;
    const previousBoard = previousBoardRef.current;
    const currentIds = new Set(Object.values(gameState.board).map((entity) => entity.id));

    for (const previousEntity of Object.values(previousBoard)) {
      if (!currentIds.has(previousEntity.id)) {
        const card = CARDS_DB[previousEntity.cardId];
        setDeathExplosions((current) => [
          ...current,
          {
            id: `${previousEntity.id}-death-${Date.now()}`,
            position: previousEntity.position,
            faction: card?.faction ?? 'FURIA',
          },
        ]);
      }
    }

    previousBoardRef.current = { ...gameState.board };
  }, [gameState]);

  const movementRoutesByKey = useMemo(() => {
    const routes = new Map<string, Position[]>();
    if (!gameState || !selectedEntity || selectedEntity.hasMovedThisTurn || selectedEntity.frozenTurns > 0) {
      return routes;
    }

    const card = CARDS_DB[selectedEntity.cardId];
    if (!card || card.type === 'ESTRUCTURA') return routes;

    for (const reachable of getReachablePositions(
      gameState.board,
      selectedEntity.position,
      card.movement ?? 1,
      {
        allowDiagonal: true,
        canFly: card.rulesText.includes('Vuelo'),
      },
    )) {
      routes.set(positionKey(reachable.position), reachable.path);
    }

    return routes;
  }, [gameState, selectedEntity]);

  const highlightByNodeId = useMemo(() => {
    const highlights = new Map<string, NodeHighlight>();
    if (!gameState) return highlights;

    for (const node of BOARD_VISUAL_NODES) {
      const { x, y } = node.logicalPosition;
      const key = positionKey(node.logicalPosition);
      const occupant = gameState.board[key];
      let highlight: NodeHighlight = null;

      if (selectedCardInHand?.type === 'HECHIZO') {
        if (occupant && !isBoardObstacle(occupant) && !CARDS_DB[occupant.cardId]?.rulesText.includes('Inmune a Hechizos')) {
          if (selectedCardInHand.id === 'destello-runico') {
            const commander = Object.values(gameState.board).find((entity) => entity.id === 'commander-player');
            if (commander && isAdjacent(commander.position, node.logicalPosition, false)) highlight = 'spell';
          } else {
            highlight = 'spell';
          }
        }
      } else if (selectedCardInHand && (selectedCardInHand.type === 'UNIDAD' || selectedCardInHand.type === 'ESTRUCTURA')) {
        if (!occupant) {
          const isBackRow = y === PLAYER_BACK_ROW;
          const hasAdjacentAlly = Object.values(gameState.board).some(
            (entity) => entity.controller === 'PLAYER' && isAdjacent(entity.position, node.logicalPosition, false),
          );
          if (isBackRow || hasAdjacentAlly) highlight = 'summon';
        }
      } else if (selectedEntity && selectedEntity.frozenTurns === 0) {
        const isCurrentNode = selectedEntity.position.x === x && selectedEntity.position.y === y;

        if (!isCurrentNode) {
          if (!occupant && movementRoutesByKey.has(key)) {
            highlight = 'move';
          } else if (
            occupant?.controller === 'OPPONENT' &&
            !isBoardObstacle(occupant) &&
            canAttackTarget(gameState, selectedEntity.position, node.logicalPosition) &&
            !selectedEntity.hasAttackedThisTurn &&
            CARDS_DB[selectedEntity.cardId]?.type !== 'ESTRUCTURA'
          ) {
            highlight = 'attack';
          }
        }
      }

      highlights.set(node.id, highlight);
    }

    return highlights;
  }, [gameState, movementRoutesByKey, selectedCardInHand, selectedEntity]);

  if (!gameState) return null;

  const boardDebugMode = new URLSearchParams(window.location.search).get('sanctuaryBoardDebug');
  const showBoardFoundation = boardDebugMode !== 'tiles' && boardDebugMode !== 'plain';
  const showObstacles = boardDebugMode !== 'tiles'
    && boardDebugMode !== 'plain'
    && boardDebugMode !== 'foundation';
  const useDetailedTextures = boardDebugMode !== 'plain';

  const handleNodeClick = (position: Position) => {
    const node = getBoardVisualNode(position);
    const highlight = highlightByNodeId.get(node.id) ?? null;
    const key = positionKey(position);
    const occupant = gameState.board[key];

    if (highlight === 'summon' && selectedCardInHand) {
      let battlecryTarget: Position | undefined;
      if (selectedCardInHand.id === 'tejedora-escarcha') {
        battlecryTarget = Object.values(gameState.board).find(
          (entity) => entity.controller === 'OPPONENT' && !isBoardObstacle(entity),
        )?.position;
      }
      summon(selectedCardInHand.id, position, battlecryTarget);
    } else if (highlight === 'spell' && selectedCardInHand) {
      castSpell(selectedCardInHand.id, position);
    } else if (highlight === 'move' && selectedEntity) {
      const logicalRoute = movementRoutesByKey.get(key);
      if (logicalRoute) {
        setMovementAnimationRoutes((current) => ({
          ...current,
          [selectedEntity.id]: logicalRoute.map((routePosition) => ({ ...routePosition })),
        }));
      }
      move(selectedEntity.position, position);
    } else if (highlight === 'attack' && selectedEntity) {
      const attackerCard = CARDS_DB[selectedEntity.cardId];
      if (occupant && attackerCard) {
        setAttackAnimations((current) => [
          ...current,
          {
            id: `${selectedEntity.id}-attack-${Date.now()}`,
            attackerId: selectedEntity.id,
            targetId: occupant.id,
            from: { ...selectedEntity.position },
            to: { ...position },
            faction: attackerCard.faction,
          },
        ]);
      }
      attack(selectedEntity.position, position);
    } else if (occupant?.controller === 'PLAYER') {
      selectEntity(selectedEntity?.id === occupant.id ? null : occupant);
    } else {
      selectEntity(null);
    }
  };

  const activeRoutes = selectedEntity && hoveredTacticalNodeId
    ? BOARD_VISUAL_NODES.flatMap((node) => {
        if (node.id !== hoveredTacticalNodeId) return [];
        const highlight = highlightByNodeId.get(node.id);
        if (highlight !== 'move' && highlight !== 'attack') return [];
        const logicalRoute = movementRoutesByKey.get(positionKey(node.logicalPosition));
        return [{
          id: `${selectedEntity.id}-${node.id}`,
          highlight,
          points: highlight === 'move' && logicalRoute
            ? getMovementPathThroughNodes(logicalRoute)
            : getMovementPath(selectedEntity.position, node.logicalPosition),
        }];
      })
    : [];

  return (
    <div
      className="board3d-wrapper"
      data-testid="floating-sanctuary-board"
      data-canvas-status={canvasStatus}
      data-valid-moves={movementRoutesByKey.size}
      data-valid-move-positions={[...movementRoutesByKey.keys()].join(' ')}
    >
      <Canvas
        camera={{ position: [11.8, 19.2, 23.5], fov: 43, near: 0.1, far: 170 }}
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.25]}
        className="canvas3d"
        gl={{
          antialias: true,
          alpha: false,
          stencil: false,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <CanvasHealthMonitor
          onContextLost={() => setCanvasStatus('lost')}
          onContextRestored={() => setCanvasStatus('ready')}
        />
        <ResponsiveCamera />
        <SanctuaryMaterialsProvider enabled={useDetailedTextures}>
          <FloatingSanctuary />

          <TacticalGrid3D
            nodes={BOARD_VISUAL_NODES}
            highlights={highlightByNodeId}
            showFoundation={showBoardFoundation}
            useDetailedTextures={useDetailedTextures}
            onNodeClick={(node) => handleNodeClick(node.logicalPosition)}
            onNodeHover={(node) => setHoveredTacticalNodeId(node?.id ?? null)}
          />

          {activeRoutes.map((route) => (
            <ValidRoute key={route.id} points={route.points} highlight={route.highlight} />
          ))}

          {attackAnimations.map((animation) => (
            <AttackAnimation3D
              key={animation.id}
              from={getBoardVisualNode(animation.from).worldPosition}
              to={getBoardVisualNode(animation.to).worldPosition}
              faction={animation.faction}
              onComplete={() => {
                setAttackAnimations((current) => current.filter((candidate) => candidate.id !== animation.id));
              }}
            />
          ))}

          {Object.values(gameState.board).map((entity) => {
            if (entity.cardId.startsWith('obstaculo-')) {
              if (!showObstacles) return null;
              return <SanctuaryObstacle key={entity.id} entity={entity} onClick={() => handleNodeClick(entity.position)} />;
            }

            const attackAnimation = attackAnimations.find((animation) => animation.attackerId === entity.id);
            const impactAnimation = attackAnimations.find((animation) => animation.targetId === entity.id);

            return (
              <Card3D
                key={entity.id}
                entity={entity}
                visualNode={getBoardVisualNode(entity.position)}
                isSelected={selectedEntity?.id === entity.id}
                isHovered={hoveredEntity?.id === entity.id}
                isHidden={!isEntityVisible(entity, gameState.board)}
                movementRoute={movementAnimationRoutes[entity.id]}
                attackTarget={attackAnimation ? getBoardVisualNode(attackAnimation.to).worldPosition : undefined}
                attackPulseId={attackAnimation?.id}
                impactPulseId={impactAnimation?.id}
                onClick={selectedEntity?.id === entity.id ? undefined : () => handleNodeClick(entity.position)}
                onHover={(isHovered) => setHoveredEntity(isHovered ? entity : null)}
                onMovementComplete={() => {
                  setMovementAnimationRoutes((current) => {
                    if (!current[entity.id]) return current;
                    const next = { ...current };
                    delete next[entity.id];
                    return next;
                  });
                }}
              />
            );
          })}

          {deathExplosions.map((explosion) => (
            <DeathExplosion3D
              key={explosion.id}
              worldPosition={getBoardVisualNode(explosion.position).worldPosition}
              faction={explosion.faction}
              onComplete={() => {
                setDeathExplosions((current) => current.filter((candidate) => candidate.id !== explosion.id));
              }}
            />
          ))}

          <OrbitControls
            makeDefault
            target={CAMERA_TARGET}
            enablePan={false}
            enableDamping
            dampingFactor={0.075}
            minPolarAngle={0.72}
            maxPolarAngle={1.05}
            minAzimuthAngle={-0.05}
            maxAzimuthAngle={0.78}
            minDistance={24}
            maxDistance={36}
          />
        </SanctuaryMaterialsProvider>
      </Canvas>

      {canvasStatus === 'lost' && (
        <div className="canvas-recovery" role="alert">
          <strong>El escenario 3D se ha detenido</strong>
          <span>Se ha conservado la partida.</span>
          <button type="button" onClick={() => window.location.reload()}>Recargar escenario</button>
        </div>
      )}

      <style>{`
        .board3d-wrapper {
          flex: 1;
          position: relative;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          background: #9eb7ce;
          isolation: isolate;
        }
        .canvas3d {
          width: 100%;
          height: 100%;
          touch-action: none;
        }
        .canvas-recovery {
          position: absolute;
          inset: 0;
          z-index: 80;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #eef6ff;
          background: rgba(7, 13, 21, 0.92);
        }
        .canvas-recovery strong {
          font-size: 1rem;
        }
        .canvas-recovery span {
          color: #aebdca;
          font-size: 0.78rem;
        }
        .canvas-recovery button {
          margin-top: 6px;
          padding: 8px 12px;
          border: 1px solid rgba(126, 211, 255, 0.45);
          border-radius: 6px;
          color: #eaf8ff;
          background: #176887;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
