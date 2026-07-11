import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { BoardEntity } from '../../types/card';
import { CARDS_DB } from '../../core/cardsDb';
import { FactionParticles } from './Particles';
import { BOARD_SIZE } from '../../core/boardConfig';

const tileSize = 1.25;
const tileSpacing = 0.15;
const gridOffset = (BOARD_SIZE - 1) / 2;

interface Card3DProps {
  entity: BoardEntity;
  isSelected?: boolean;
  isHovered?: boolean;
  isHidden?: boolean; // FOG OF WAR prop
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

export const Card3D: React.FC<Card3DProps> = ({
  entity,
  isSelected = false,
  isHovered = false,
  isHidden = false,
  onClick,
  onHover,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const cardData = CARDS_DB[entity.cardId];

  const targetX = (entity.position.x - gridOffset) * (tileSize + tileSpacing);
  const targetZ = -(entity.position.y - gridOffset) * (tileSize + tileSpacing);

  // Animation states for the summon/entrance jump effect
  const isFirstRender = useRef(true);

  // Animates position, float heights, and interactive tilts smoothly
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const speed = 7;
    const curX = meshRef.current.position.x;
    const curZ = meshRef.current.position.z;

    // Plinth sits on the floor: Y=0.22 base. Float if selected or hovered.
    let targetY = isSelected ? 0.55 : isHovered ? 0.4 : 0.22;

    // Fall slam animation on first render
    if (isFirstRender.current) {
      meshRef.current.position.y = 8.0;
      meshRef.current.position.x = targetX;
      meshRef.current.position.z = targetZ;
      isFirstRender.current = false;
    }

    const curY = meshRef.current.position.y;

    // Lerp positions
    meshRef.current.position.x = curX + (targetX - curX) * speed * delta;
    meshRef.current.position.y = curY + (targetY - curY) * speed * delta;
    meshRef.current.position.z = curZ + (targetZ - curZ) * speed * delta;

    // Tilt animations:
    // Selected cards tilt towards player, hovered cards sway gently, frozen cards shake
    const defaultRotX = -0.3; // Default tilt to face the camera
    const targetRotX = isSelected ? -0.45 : isHovered ? -0.38 : defaultRotX;
    const targetRotY = isHovered ? Math.sin(state.clock.getElapsedTime() * 2) * 0.08 : 0;
    const targetRotZ = entity.frozenTurns > 0 ? Math.sin(Date.now() * 0.005) * 0.04 : 0;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, 10 * delta);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, 10 * delta);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotZ, 10 * delta);
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
      position={[targetX, 8.0, targetZ]}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
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
          distanceFactor={1.35}
          position={[0, 0, 0.05]}
          rotation={[0, 0, 0]}
          style={{
            width: '140px',
            height: '190px',
            pointerEvents: 'none',
          }}
        >
          <div
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
                <img src={cardData.artPath} alt="" />
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
      {cardData.faction === 'FURIA' && (
        <FactionParticles
          position={[meshRef.current?.position.x || targetX, 0.1, meshRef.current?.position.z || targetZ]}
          faction="FURIA"
          count={15}
        />
      )}
      {cardData.faction === 'ARCANO' && entity.frozenTurns > 0 && (
        <FactionParticles
          position={[meshRef.current?.position.x || targetX, 0.1, meshRef.current?.position.z || targetZ]}
          faction="ARCANO"
          count={10}
        />
      )}
    </group>
  );
};
