import React, { useLayoutEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { BoardEntity, Position } from '../../types/card';
import { CARDS_DB } from '../../core/cardsDb';
import { FactionParticles } from './Particles';
import {
  getMovementPath,
  getMovementPathThroughNodes,
  type BoardVisualNode,
  type WorldPoint,
} from '../../core/boardVisualLayout';
import { resolvePublicAsset } from '../../core/publicAssets';

interface Card3DProps {
  entity: BoardEntity;
  visualNode: BoardVisualNode;
  isSelected?: boolean;
  isHovered?: boolean;
  isHidden?: boolean; // FOG OF WAR prop
  movementRoute?: Position[];
  attackTarget?: WorldPoint;
  attackPulseId?: string;
  impactPulseId?: string;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  onMovementComplete?: () => void;
}

export const Card3D: React.FC<Card3DProps> = ({
  entity,
  visualNode,
  isSelected = false,
  isHovered = false,
  isHidden = false,
  movementRoute,
  attackTarget,
  attackPulseId,
  impactPulseId,
  onClick,
  onHover,
  onMovementComplete,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const cardData = CARDS_DB[entity.cardId];
  const logicalX = entity.position.x;
  const logicalY = entity.position.y;

  const previousLogicalPositionRef = useRef<Position>({ ...entity.position });
  const movementRef = useRef<{
    curve: THREE.CatmullRomCurve3;
    progress: number;
    duration: number;
  } | null>(null);
  const temporaryPositionRef = useRef(new THREE.Vector3());
  const temporaryScaleRef = useRef(new THREE.Vector3(1, 1, 1));
  const attackTargetRef = useRef(new THREE.Vector3());
  const attackDirectionRef = useRef(new THREE.Vector3());
  const previousHealthRef = useRef(entity.health);
  const damageReactionRef = useRef(0);
  const attackPulseRef = useRef(0);
  const lastAttackPulseIdRef = useRef<string | undefined>(undefined);
  const lastImpactPulseIdRef = useRef<string | undefined>(undefined);
  const [artLoaded, setArtLoaded] = useState(false);

  useLayoutEffect(() => {
    const previousPosition = previousLogicalPositionRef.current;
    const currentPosition: Position = { x: logicalX, y: logicalY };
    const hasMoved = previousPosition.x !== logicalX || previousPosition.y !== logicalY;

    if (hasMoved) {
      const firstRoutePosition = movementRoute?.[0];
      const lastRoutePosition = movementRoute?.[movementRoute.length - 1];
      const routeMatchesMovement = Boolean(
        firstRoutePosition &&
        lastRoutePosition &&
        firstRoutePosition.x === previousPosition.x &&
        firstRoutePosition.y === previousPosition.y &&
        lastRoutePosition.x === currentPosition.x &&
        lastRoutePosition.y === currentPosition.y,
      );
      const logicalRoute = routeMatchesMovement && movementRoute
        ? movementRoute
        : [previousPosition, currentPosition];
      const worldPath = logicalRoute.length > 2
        ? getMovementPathThroughNodes(logicalRoute)
        : getMovementPath(previousPosition, currentPosition);
      const path = worldPath.map(
        ([x, y, z]) => new THREE.Vector3(x, y, z),
      );
      if (meshRef.current) path[0].copy(meshRef.current.position);
      movementRef.current = {
        curve: new THREE.CatmullRomCurve3(path, false, 'catmullrom', 0.28),
        progress: 0,
        duration: Math.min(1.35, 0.42 + (logicalRoute.length - 1) * 0.26),
      };
      previousLogicalPositionRef.current = currentPosition;
    }

    if (entity.health < previousHealthRef.current) damageReactionRef.current = 1;
    previousHealthRef.current = entity.health;
  }, [entity.health, logicalX, logicalY, movementRoute]);

  useLayoutEffect(() => {
    if (attackPulseId && attackPulseId !== lastAttackPulseIdRef.current && attackTarget) {
      attackTargetRef.current.set(...attackTarget);
      attackPulseRef.current = 1;
      lastAttackPulseIdRef.current = attackPulseId;
    }
  }, [attackPulseId, attackTarget]);

  useLayoutEffect(() => {
    if (impactPulseId && impactPulseId !== lastImpactPulseIdRef.current) {
      damageReactionRef.current = 1;
      lastImpactPulseIdRef.current = impactPulseId;
    }
  }, [impactPulseId]);

  // Animates position, float heights, and interactive tilts smoothly
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const elapsed = state.clock.getElapsedTime();
    const movement = movementRef.current;
    let attackLunge = 0;

    if (attackPulseRef.current > 0) {
      attackPulseRef.current = Math.max(0, attackPulseRef.current - delta / 0.5);
      attackLunge = Math.sin((1 - attackPulseRef.current) * Math.PI);
    }

    if (movement) {
      movement.progress = Math.min(1, movement.progress + delta / movement.duration);
      const easedProgress = 1 - Math.pow(1 - movement.progress, 3);
      movement.curve.getPoint(easedProgress, temporaryPositionRef.current);
      meshRef.current.position.copy(temporaryPositionRef.current);
      if (movement.progress >= 1) {
        movementRef.current = null;
        onMovementComplete?.();
      }
    } else {
      const floatOffset = Math.sin(elapsed * 1.45 + entity.position.x * 0.7) * 0.025;
      const interactionLift = isSelected ? 0.14 : isHovered ? 0.08 : 0;
      let targetX = visualNode.worldPosition[0];
      let targetY = visualNode.worldPosition[1] + interactionLift + floatOffset;
      let targetZ = visualNode.worldPosition[2];
      if (attackLunge > 0) {
        attackDirectionRef.current.copy(attackTargetRef.current);
        attackDirectionRef.current.x -= visualNode.worldPosition[0];
        attackDirectionRef.current.y -= visualNode.worldPosition[1];
        attackDirectionRef.current.z -= visualNode.worldPosition[2];
        attackDirectionRef.current.y = 0;
        attackDirectionRef.current.normalize().multiplyScalar(attackLunge * 0.52);
        targetX += attackDirectionRef.current.x;
        targetY += attackLunge * 0.2;
        targetZ += attackDirectionRef.current.z;
      }
      const smoothing = 1 - Math.exp(-7.5 * delta);

      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, smoothing);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, smoothing);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, smoothing);
    }

    // Tilt animations:
    // Selected cards tilt towards player, hovered cards sway gently, frozen cards shake
    const defaultRotX = visualNode.cardRotation?.[0] ?? -0.17;
    const defaultRotY = visualNode.cardRotation?.[1] ?? 0.42;
    const targetRotX = (isSelected ? defaultRotX - 0.12 : isHovered ? defaultRotX - 0.06 : defaultRotX) - attackLunge * 0.12;
    const targetRotY = defaultRotY + (isHovered ? Math.sin(elapsed * 2) * 0.055 : 0);
    const frozenShake = entity.frozenTurns > 0 ? Math.sin(elapsed * 18) * 0.035 : 0;

    damageReactionRef.current = Math.max(0, damageReactionRef.current - delta * 3.8);
    const damageShake = Math.sin(elapsed * 42) * damageReactionRef.current * 0.07;
    const targetRotZ = frozenShake + damageShake;
    const restingScale = cardData?.type === 'COMANDANTE' ? 1.16 : 1;
    const targetScale = (isSelected ? 1.3 : isHovered ? 1.16 : restingScale) + damageReactionRef.current * 0.055 + attackLunge * 0.06;

    const rotationSmoothing = 1 - Math.exp(-10 * delta);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, rotationSmoothing);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, rotationSmoothing);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotZ, rotationSmoothing);
    const scaleSmoothing = 1 - Math.exp(-10 * delta);
    temporaryScaleRef.current.setScalar(targetScale);
    meshRef.current.scale.lerp(temporaryScaleRef.current, scaleSmoothing);
  });

  if (!cardData) return null;

  const isOpponent = entity.controller === 'OPPONENT';
  const isLegendaria = cardData.rarity === 'LEGENDARIA';
  const isEpica = cardData.rarity === 'EPICA';

  // Rarity color tags
  const getRarityBorderColor = (rarity: string) => {
    if (isHidden) return '#2b3b5c';
    switch (rarity) {
      case 'LEGENDARIA': return '#fbbf24';
      case 'EPICA': return '#a855f7';
      case 'RARA': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const isStructure = cardData.type === 'ESTRUCTURA';
  const hasStats = cardData.type === 'UNIDAD' || cardData.type === 'COMANDANTE' || isStructure;

  return (
    <group
      ref={meshRef}
      position={[
        visualNode.worldPosition[0],
        visualNode.worldPosition[1] + 4.6,
        visualNode.worldPosition[2],
      ]}
      onClick={onClick ? (e) => {
        e.stopPropagation();
        onClick();
      } : undefined}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (onHover) onHover(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (onHover) onHover(false);
      }}
    >
      {/* 1. Heavy physical base plinth */}
      <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.55, 0.6, 0.1, 24]} />
        <meshStandardMaterial
          color={isOpponent ? '#4f1a1a' : '#1e293b'}
          roughness={0.25}
          metalness={0.8}
        />
      </mesh>
      
      {/* 2. Runic metallic trim around base */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.02, 24]} />
        <meshStandardMaterial
          color={isLegendaria ? '#fbbf24' : isEpica ? '#c084fc' : '#9ca3af'}
          metalness={0.9}
          roughness={0.1}
          emissive={isLegendaria ? '#fbbf24' : isEpica ? '#a855f7' : '#000000'}
          emissiveIntensity={isLegendaria ? 0.35 : isEpica ? 0.25 : 0}
        />
      </mesh>

      {/* 3. Glowing indicator ring at base if selected */}
      {isSelected && (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.7, 32]} />
          <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} />
        </mesh>
      )}

      {isSelected && (
        <mesh position={[0, 0.72, -0.08]}>
          <cylinderGeometry args={[0.46, 0.68, 1.5, 28, 1, true]} />
          <meshBasicMaterial
            color={cardData.faction === 'FURIA' ? '#ffb36b' : '#8bddff'}
            transparent
            opacity={0.055}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 4. 3D Card standee, raised above the base */}
      <mesh
        position={[0, 0.95, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.35, 1.85, 0.08]} />
        <meshStandardMaterial
          color={isSelected ? '#fbbf24' : isHovered ? '#fff' : isHidden ? '#0a0d14' : isOpponent ? '#2d1818' : '#14202d'}
          roughness={0.4}
          metalness={0.3}
        />

        {/* Projected HTML Card Face on the front side (Z = 0.05). STATIC DOM NODES TO PREVENT UNMOUNT CRASHES! */}
        <Html
          transform
          pointerEvents="none"
          distanceFactor={3.75}
          position={[0, 0, 0.05]}
          rotation={[0, 0, 0]}
          style={{
            width: '140px',
            height: '190px',
            pointerEvents: 'none',
          }}
        >
          <div
            data-entity-id={entity.id}
            data-logical-position={`${logicalX},${logicalY}`}
            className={[
              'card3d-face',
              isHidden ? 'hidden-fog' : cardData.faction.toLowerCase(),
              isSelected ? 'selected' : '',
              isHovered ? 'hovered' : '',
              (isLegendaria && !isHidden) ? 'rarity-legendaria' : '',
              (isEpica && !isHidden) ? 'rarity-epica' : '',
            ].filter(Boolean).join(' ')}
            style={{
              borderColor: getRarityBorderColor(cardData.rarity),
            }}
          >
            {/* Inner Border Frame */}
            <div className="card3d-border-inlay" />

            {/* Header nameplate */}
            <div className="card3d-header">
              <span className="card3d-name">{isHidden ? 'Criatura Oculta' : cardData.name}</span>
            </div>

            {/* Framed Art illustration */}
            <div className="card3d-art">
              {isHidden ? (
                <div className="hidden-fog-art">?</div>
              ) : (
                <img
                  src={resolvePublicAsset(cardData.artPath)}
                  alt=""
                  className={artLoaded ? 'is-loaded' : ''}
                  loading="eager"
                  decoding="async"
                  onLoad={() => setArtLoaded(true)}
                />
              )}
            </div>

            {/* Back watermark icon */}
            <div className="card3d-watermark">
              {isHidden ? '👁️' : cardData.faction === 'FURIA' ? '🔥' : '❄️'}
            </div>

            {/* Runic Stat medals (Static rendering, toggle display property to avoid DOM node addition/removal crashes) */}
            <div className="card3d-stats" style={{ display: hasStats && !isHidden ? 'flex' : 'none' }}>
              <div className="stat3d-badge att" style={{ display: !isStructure ? 'flex' : 'none' }}>
                <span className="badge-ring" />
                <span className="val">{entity.attack}</span>
              </div>
              <div className="stat3d-badge hp">
                <span className="badge-ring" />
                <span className="val">{entity.health}</span>
              </div>
            </div>

            {/* Frozen status overlay (Static render, display toggle) */}
            <div className="frozen-overlay" style={{ display: entity.frozenTurns > 0 && !isHidden ? 'flex' : 'none' }}>
              CONGELADO ❄️
            </div>
            
            {/* Enemy Tag (Static render, display toggle) */}
            <div className="controller-badge opponent" style={{ display: isOpponent ? 'block' : 'none' }}>
              ENEMIGO
            </div>
          </div>

          <style>{`
            .card3d-face {
              width: 140px;
              height: 190px;
              border: 2px solid #555;
              border-radius: 9px;
              background: #0f1115;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              position: relative;
              font-family: 'Inter', sans-serif;
              color: white;
              box-shadow: 0 6px 15px rgba(0,0,0,0.8);
            }
            
            .card3d-face.hidden-fog {
              background: radial-gradient(circle at center, #1b212f 0%, #080b11 100%);
              border-color: #2b3b5c;
            }
            .hidden-fog-art {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 3rem;
              font-weight: 800;
              color: #4f46e5;
              text-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
              background: #080b11;
            }

            .card3d-face.furia {
              background: linear-gradient(to bottom, #160707, #070303);
            }
            .card3d-face.arcano {
              background: linear-gradient(to bottom, #071524, #03080e);
            }
            
            /* Inner gold/silver frame decoration */
            .card3d-border-inlay {
              position: absolute;
              inset: 3px;
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 6px;
              pointer-events: none;
              z-index: 10;
            }
            .rarity-legendaria .card3d-border-inlay {
              border-color: rgba(251, 191, 36, 0.35);
            }
            .rarity-epica .card3d-border-inlay {
              border-color: rgba(168, 85, 247, 0.35);
            }

            .card3d-face.selected {
              border-color: #fbbf24 !important;
              box-shadow: 0 0 15px rgba(251, 191, 36, 0.6);
            }

            .card3d-header {
              padding: 5px 8px;
              background: linear-gradient(90deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.01) 100%);
              border-bottom: 1px solid rgba(255,255,255,0.1);
              display: flex;
              justify-content: space-between;
              align-items: center;
              z-index: 5;
              margin: 4px 6px 0 6px;
              border-radius: 3px;
            }

            .card3d-name {
              font-size: 0.62rem;
              font-weight: 800;
              font-family: 'Outfit', sans-serif;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            }

            /* Framed Art Window */
            .card3d-art {
              margin: 4px 6px;
              flex: 1;
              background: #000;
              overflow: hidden;
              position: relative;
              border-radius: 4px;
              border: 1px solid rgba(255,255,255,0.08);
              box-shadow: inset 0 0 8px rgba(0,0,0,0.8);
              z-index: 5;
            }

            .card3d-art img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              opacity: 0;
              backface-visibility: hidden;
              transform: translateZ(0.01px);
              transition: opacity 0.12s ease-out;
              will-change: opacity, transform;
            }

            .card3d-art img.is-loaded {
              opacity: 1;
            }

            .card3d-watermark {
              position: absolute;
              bottom: 4px;
              right: 6px;
              font-size: 2.2rem;
              opacity: 0.04;
              pointer-events: none;
              z-index: 2;
            }

            /* Overlapping Runic Stat Badges */
            .card3d-stats {
              position: absolute;
              bottom: 3px;
              left: 3px;
              right: 3px;
              display: flex;
              justify-content: space-between;
              pointer-events: none;
              z-index: 15;
            }

            .stat3d-badge {
              background: rgba(10, 10, 15, 0.85);
              width: 25px;
              height: 25px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 0.72rem;
              font-weight: 900;
              position: relative;
              box-shadow: 0 3px 6px rgba(0,0,0,0.7);
              border: 1.5px solid;
            }
            
            .badge-ring {
              position: absolute;
              inset: 1px;
              border: 1px dashed rgba(255,255,255,0.25);
              border-radius: 50%;
            }
            .val {
              z-index: 1;
              text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            }

            .stat3d-badge.att {
              background: radial-gradient(circle at 35% 30%, #991b1b, #450a0a);
              color: #fecaca;
              border-color: #ef4444;
            }
            .stat3d-badge.hp {
              background: radial-gradient(circle at 35% 30%, #065f46, #022c22);
              color: #a7f3d0;
              border-color: #10b981;
            }

            .frozen-overlay {
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              background: rgba(0, 191, 255, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 0.7rem;
              font-weight: bold;
              color: white;
              text-shadow: 0 2px 4px rgba(0,0,0,0.9);
              z-index: 12;
              border-radius: 7px;
            }

            .controller-badge {
              position: absolute;
              bottom: 30px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(239, 68, 68, 0.85);
              border: 1px solid rgba(239, 68, 68, 0.4);
              color: white;
              font-size: 0.45rem;
              padding: 1px 5px;
              border-radius: 10px;
              font-weight: bold;
              letter-spacing: 0.05em;
              z-index: 11;
              box-shadow: 0 2px 4px rgba(0,0,0,0.4);
            }
          `}</style>
        </Html>
      </mesh>

      {/* Render particle effects for Furia (fire embers) and Arcano (ice sparkles) */}
      {cardData.faction === 'FURIA' && (isSelected || isHovered) && (
        <FactionParticles
          position={[0, 0.1, 0]}
          faction="FURIA"
          count={7}
        />
      )}
      {cardData.faction === 'ARCANO' && entity.frozenTurns > 0 && (
        <FactionParticles
          position={[0, 0.1, 0]}
          faction="ARCANO"
          count={6}
        />
      )}
    </group>
  );
};
