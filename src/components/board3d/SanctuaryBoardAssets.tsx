import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { BoardEntity } from '../../types/card';
import {
  BOARD_SURFACE_Y,
  BOARD_WORLD_SIZE,
  getBoardVisualNode,
  type WorldPoint,
} from '../../core/boardVisualLayout';
import { useSanctuaryMaterials, type SanctuaryStoneTextureSet } from './SanctuaryMaterials';

const BOARD_HALF_SIZE = BOARD_WORLD_SIZE / 2;

function createStoneMaterial(
  textures: SanctuaryStoneTextureSet,
  color: THREE.ColorRepresentation,
  normalStrength: number,
  roughness = 0.94,
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    ...textures,
    color,
    roughness,
    metalness: 0.025,
  });
  material.normalScale.set(normalStrength, normalStrength);
  return material;
}

interface CornerBeaconProps {
  position: WorldPoint;
  geometries: {
    base: THREE.BufferGeometry;
    step: THREE.BufferGeometry;
    ring: THREE.BufferGeometry;
    core: THREE.BufferGeometry;
    shard: THREE.BufferGeometry;
  };
  stoneMaterial: THREE.Material;
  darkStoneMaterial: THREE.Material;
  goldMaterial: THREE.Material;
  crystalMaterial: THREE.Material;
  phase: number;
}

const CornerBeacon: React.FC<CornerBeaconProps> = ({
  position,
  geometries,
  stoneMaterial,
  darkStoneMaterial,
  goldMaterial,
  crystalMaterial,
  phase,
}) => {
  const crystalRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!crystalRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    crystalRef.current.rotation.y = phase + elapsed * 0.08;
    crystalRef.current.position.y = 1.68 + Math.sin(elapsed * 1.15 + phase) * 0.025;
  });

  return (
    <group position={position}>
      <mesh geometry={geometries.base} material={darkStoneMaterial} position={[0, 0.96, 0]} castShadow receiveShadow />
      <mesh geometry={geometries.step} material={stoneMaterial} position={[0, 1.2, 0]} castShadow receiveShadow />
      <mesh
        geometry={geometries.ring}
        material={goldMaterial}
        position={[0, 1.34, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      />
      <group ref={crystalRef} position={[0, 1.68, 0]}>
        <mesh geometry={geometries.core} material={crystalMaterial} castShadow />
        <mesh
          geometry={geometries.shard}
          material={crystalMaterial}
          position={[-0.22, -0.15, 0.06]}
          rotation={[0.18, 0.25, 0.42]}
          castShadow
        />
        <mesh
          geometry={geometries.shard}
          material={crystalMaterial}
          position={[0.2, -0.17, -0.08]}
          rotation={[-0.14, -0.35, -0.38]}
          castShadow
        />
      </group>
    </group>
  );
};

const FOUNDATION_SUPPORTS: Array<{ position: WorldPoint; rotationY: number }> = [
  ...[-4.8, -1.6, 1.6, 4.8].flatMap((offset) => [
    { position: [offset, BOARD_SURFACE_Y - 1.18, BOARD_HALF_SIZE + 0.24] as WorldPoint, rotationY: 0 },
    { position: [offset, BOARD_SURFACE_Y - 1.18, -BOARD_HALF_SIZE - 0.24] as WorldPoint, rotationY: 0 },
    { position: [BOARD_HALF_SIZE + 0.24, BOARD_SURFACE_Y - 1.18, offset] as WorldPoint, rotationY: Math.PI / 2 },
    { position: [-BOARD_HALF_SIZE - 0.24, BOARD_SURFACE_Y - 1.18, offset] as WorldPoint, rotationY: Math.PI / 2 },
  ]),
];

export const BoardFoundation: React.FC = () => {
  const { masonry, tile } = useSanctuaryMaterials();
  const supportRef = useRef<THREE.InstancedMesh>(null);
  const spurRef = useRef<THREE.InstancedMesh>(null);
  const temporaryObject = useMemo(() => new THREE.Object3D(), []);

  const geometries = useMemo(() => ({
    upper: new RoundedBoxGeometry(BOARD_WORLD_SIZE + 0.58, 0.64, BOARD_WORLD_SIZE + 0.58, 3, 0.08),
    lower: new RoundedBoxGeometry(BOARD_WORLD_SIZE + 0.2, 0.5, BOARD_WORLD_SIZE + 0.2, 2, 0.065),
    undercroft: new RoundedBoxGeometry(BOARD_WORLD_SIZE - 0.3, 0.28, BOARD_WORLD_SIZE - 0.3, 2, 0.055),
    support: new RoundedBoxGeometry(0.72, 1.55, 0.62, 2, 0.055),
    spur: new THREE.ConeGeometry(0.41, 1.7, 7),
    beaconBase: new THREE.CylinderGeometry(0.5, 0.62, 0.3, 10),
    beaconStep: new THREE.CylinderGeometry(0.35, 0.46, 0.19, 10),
    beaconRing: new THREE.TorusGeometry(0.29, 0.025, 6, 32),
    beaconCore: new THREE.ConeGeometry(0.22, 0.88, 6),
    beaconShard: new THREE.ConeGeometry(0.11, 0.5, 5),
  }), []);

  const materials = useMemo(() => ({
    stone: createStoneMaterial(masonry, '#eef2f4', 0.62, 0.93),
    detailStone: createStoneMaterial(tile, '#d6e0e5', 0.48, 0.95),
    darkStone: createStoneMaterial(masonry, '#7b8995', 0.42, 0.98),
    gold: new THREE.MeshStandardMaterial({
      color: '#9b7440',
      metalness: 0.74,
      roughness: 0.38,
    }),
    crystal: new THREE.MeshStandardMaterial({
      color: '#86ddff',
      emissive: '#147caf',
      emissiveIntensity: 1.45,
      roughness: 0.16,
      metalness: 0.08,
      transparent: true,
      opacity: 0.88,
    }),
  }), [masonry, tile]);

  useLayoutEffect(() => {
    FOUNDATION_SUPPORTS.forEach((support, index) => {
      temporaryObject.position.set(...support.position);
      temporaryObject.rotation.set(0, support.rotationY, 0);
      temporaryObject.scale.set(1, 1, 1);
      temporaryObject.updateMatrix();
      supportRef.current?.setMatrixAt(index, temporaryObject.matrix);

      temporaryObject.position.set(support.position[0], BOARD_SURFACE_Y - 2.55, support.position[2]);
      temporaryObject.rotation.set(Math.PI, support.rotationY, 0);
      temporaryObject.scale.set(1, 1, 1);
      temporaryObject.updateMatrix();
      spurRef.current?.setMatrixAt(index, temporaryObject.matrix);
    });
    if (supportRef.current) supportRef.current.instanceMatrix.needsUpdate = true;
    if (spurRef.current) spurRef.current.instanceMatrix.needsUpdate = true;
  }, [temporaryObject]);

  useEffect(() => () => {
    Object.values(geometries).forEach((geometry) => geometry.dispose());
    Object.values(materials).forEach((material) => material.dispose());
  }, [geometries, materials]);

  const beaconGeometries = {
    base: geometries.beaconBase,
    step: geometries.beaconStep,
    ring: geometries.beaconRing,
    core: geometries.beaconCore,
    shard: geometries.beaconShard,
  };
  const beaconOffset = BOARD_HALF_SIZE + 0.66;

  return (
    <group>
      <mesh
        geometry={geometries.upper}
        material={materials.stone}
        position={[0, BOARD_SURFACE_Y - 0.38, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geometries.lower}
        material={materials.darkStone}
        position={[0, BOARD_SURFACE_Y - 0.95, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geometries.undercroft}
        material={materials.detailStone}
        position={[0, BOARD_SURFACE_Y - 1.36, 0]}
        castShadow
        receiveShadow
      />

      <instancedMesh
        ref={supportRef}
        args={[geometries.support, materials.stone, FOUNDATION_SUPPORTS.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={spurRef}
        args={[geometries.spur, materials.darkStone, FOUNDATION_SUPPORTS.length]}
        castShadow
        receiveShadow
      />

      <mesh position={[0, BOARD_SURFACE_Y - 0.095, BOARD_HALF_SIZE + 0.255]} material={materials.darkStone} castShadow>
        <boxGeometry args={[BOARD_WORLD_SIZE + 0.5, 0.2, 0.22]} />
      </mesh>
      <mesh position={[0, BOARD_SURFACE_Y - 0.095, -BOARD_HALF_SIZE - 0.255]} material={materials.darkStone} castShadow>
        <boxGeometry args={[BOARD_WORLD_SIZE + 0.5, 0.2, 0.22]} />
      </mesh>
      <mesh position={[BOARD_HALF_SIZE + 0.255, BOARD_SURFACE_Y - 0.095, 0]} material={materials.darkStone} castShadow>
        <boxGeometry args={[0.22, 0.2, BOARD_WORLD_SIZE + 0.5]} />
      </mesh>
      <mesh position={[-BOARD_HALF_SIZE - 0.255, BOARD_SURFACE_Y - 0.095, 0]} material={materials.darkStone} castShadow>
        <boxGeometry args={[0.22, 0.2, BOARD_WORLD_SIZE + 0.5]} />
      </mesh>

      <mesh position={[0, BOARD_SURFACE_Y + 0.005, BOARD_HALF_SIZE + 0.29]} material={materials.gold} castShadow>
        <boxGeometry args={[BOARD_WORLD_SIZE + 0.58, 0.065, 0.065]} />
      </mesh>
      <mesh position={[0, BOARD_SURFACE_Y + 0.005, -BOARD_HALF_SIZE - 0.29]} material={materials.gold} castShadow>
        <boxGeometry args={[BOARD_WORLD_SIZE + 0.58, 0.065, 0.065]} />
      </mesh>
      <mesh position={[BOARD_HALF_SIZE + 0.29, BOARD_SURFACE_Y + 0.005, 0]} material={materials.gold} castShadow>
        <boxGeometry args={[0.065, 0.065, BOARD_WORLD_SIZE + 0.58]} />
      </mesh>
      <mesh position={[-BOARD_HALF_SIZE - 0.29, BOARD_SURFACE_Y + 0.005, 0]} material={materials.gold} castShadow>
        <boxGeometry args={[0.065, 0.065, BOARD_WORLD_SIZE + 0.58]} />
      </mesh>

      {[
        [-beaconOffset, 0, -beaconOffset],
        [beaconOffset, 0, -beaconOffset],
        [-beaconOffset, 0, beaconOffset],
        [beaconOffset, 0, beaconOffset],
      ].map((position, index) => (
        <CornerBeacon
          key={`corner-beacon-${index}`}
          position={position as WorldPoint}
          geometries={beaconGeometries}
          stoneMaterial={materials.detailStone}
          darkStoneMaterial={materials.darkStone}
          goldMaterial={materials.gold}
          crystalMaterial={materials.crystal}
          phase={index * 1.7}
        />
      ))}
    </group>
  );
};

const ROCK_PIECES: Array<{ position: WorldPoint; scale: WorldPoint; rotation: WorldPoint; color: string }> = [
  { position: [-0.38, 0.39, 0.12], scale: [0.38, 0.38, 0.34], rotation: [0.12, 0.45, -0.18], color: '#d6dfe4' },
  { position: [0.33, 0.36, -0.08], scale: [0.4, 0.34, 0.32], rotation: [-0.08, -0.36, 0.14], color: '#c4d0d7' },
  { position: [-0.04, 0.76, 0.02], scale: [0.34, 0.74, 0.3], rotation: [0.04, 0.18, 0.12], color: '#e1e7ea' },
  { position: [-0.2, 0.86, -0.03], scale: [0.23, 0.84, 0.21], rotation: [0.02, -0.28, -0.1], color: '#dce5e9' },
  { position: [0.18, 0.58, 0.22], scale: [0.28, 0.52, 0.24], rotation: [-0.1, 0.7, -0.2], color: '#cfdae0' },
  { position: [-0.28, 0.23, -0.34], scale: [0.26, 0.22, 0.25], rotation: [0.2, -0.2, 0.08], color: '#b8c7cf' },
  { position: [0.44, 0.2, 0.32], scale: [0.23, 0.19, 0.2], rotation: [-0.14, 0.25, 0.06], color: '#adbec7' },
  { position: [-0.52, 0.16, -0.16], scale: [0.17, 0.15, 0.18], rotation: [0.08, 0.55, 0.12], color: '#a6b7c1' },
  { position: [0.08, 0.14, -0.48], scale: [0.2, 0.13, 0.16], rotation: [0.18, -0.6, -0.08], color: '#bbc9d0' },
  { position: [0.55, 0.12, -0.27], scale: [0.13, 0.11, 0.14], rotation: [0.12, 0.2, 0.02], color: '#a3b4be' },
  { position: [-0.1, 0.11, 0.48], scale: [0.16, 0.1, 0.13], rotation: [-0.08, 0.8, 0.1], color: '#b3c2ca' },
];

function makeIrregularRockGeometry(): THREE.IcosahedronGeometry {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const position = geometry.getAttribute('position');
  const vertex = new THREE.Vector3();

  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index);
    const variation = 1
      + Math.sin(vertex.x * 7.3 + vertex.y * 3.1) * 0.065
      + Math.cos(vertex.z * 8.7 - vertex.x * 2.4) * 0.045;
    vertex.multiplyScalar(variation);
    vertex.x += Math.sin(vertex.y * 5.2) * 0.035;
    vertex.z += Math.cos(vertex.x * 4.8) * 0.03;
    position.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

const StoneRidge: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const temporaryObject = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(makeIrregularRockGeometry, []);
  const material = useMemo(() => {
    const next = new THREE.MeshStandardMaterial({
      color: '#8296a1',
      roughness: 0.97,
      metalness: 0.01,
    });
    next.flatShading = true;
    next.vertexColors = true;
    next.emissive.set('#5d737e');
    next.emissiveIntensity = 0.3;
    return next;
  }, []);

  useLayoutEffect(() => {
    ROCK_PIECES.forEach((piece, index) => {
      temporaryObject.position.set(...piece.position);
      temporaryObject.rotation.set(...piece.rotation);
      temporaryObject.scale.set(...piece.scale);
      temporaryObject.updateMatrix();
      meshRef.current?.setMatrixAt(index, temporaryObject.matrix);
      meshRef.current?.setColorAt(index, new THREE.Color(piece.color));
    });
    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
      meshRef.current.computeBoundingSphere();
    }
  }, [temporaryObject]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  return (
    <group>
      <mesh position={[0, 0.035, 0]} receiveShadow>
        <cylinderGeometry args={[0.57, 0.62, 0.07, 14]} />
        <meshStandardMaterial color="#758793" roughness={0.98} metalness={0.01} />
      </mesh>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, ROCK_PIECES.length]}
        castShadow
        receiveShadow
      />
    </group>
  );
};

const CURRENT_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.64, 0.12, -0.32),
  new THREE.Vector3(-0.35, 0.11, -0.08),
  new THREE.Vector3(-0.06, 0.12, 0.08),
  new THREE.Vector3(0.25, 0.11, 0.02),
  new THREE.Vector3(0.64, 0.12, 0.34),
]);

function makeCurrentRibbonGeometry(width: number, height: number): THREE.BufferGeometry {
  const segments = 32;
  const positions = new Float32Array((segments + 1) * 6);
  const uvs = new Float32Array((segments + 1) * 4);
  const indices: number[] = [];
  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();

  for (let index = 0; index <= segments; index += 1) {
    const progress = index / segments;
    CURRENT_PATH.getPoint(progress, point);
    CURRENT_PATH.getTangent(progress, tangent);
    const tangentLength = Math.hypot(tangent.x, tangent.z) || 1;
    const normalX = -tangent.z / tangentLength;
    const normalZ = tangent.x / tangentLength;
    const vertexOffset = index * 6;
    const uvOffset = index * 4;

    positions[vertexOffset] = point.x + normalX * width;
    positions[vertexOffset + 1] = height;
    positions[vertexOffset + 2] = point.z + normalZ * width;
    positions[vertexOffset + 3] = point.x - normalX * width;
    positions[vertexOffset + 4] = height;
    positions[vertexOffset + 5] = point.z - normalZ * width;
    uvs[uvOffset] = progress;
    uvs[uvOffset + 1] = 0;
    uvs[uvOffset + 2] = progress;
    uvs[uvOffset + 3] = 1;

    if (index < segments) {
      const left = index * 2;
      const right = left + 1;
      const nextLeft = left + 2;
      const nextRight = left + 3;
      indices.push(left, right, nextLeft, right, nextRight, nextLeft);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const ArcaneCurrent: React.FC<{ rotationY: number }> = ({ rotationY }) => {
  const { tile } = useSanctuaryMaterials();
  const geometries = useMemo(() => ({
    bed: makeCurrentRibbonGeometry(0.29, 0.055),
    water: makeCurrentRibbonGeometry(0.21, 0.072),
    glint: makeCurrentRibbonGeometry(0.035, 0.082),
  }), []);
  const bankMaterial = useMemo(() => createStoneMaterial(tile, '#93a6b4', 0.34, 0.97), [tile]);

  useEffect(() => () => {
    geometries.bed.dispose();
    geometries.water.dispose();
    geometries.glint.dispose();
    bankMaterial.dispose();
  }, [bankMaterial, geometries]);

  return (
    <group rotation={[0, rotationY, 0]}>
      <mesh geometry={geometries.bed} castShadow receiveShadow>
        <meshStandardMaterial color="#263d49" roughness={0.82} metalness={0.03} />
      </mesh>
      <mesh geometry={geometries.water} renderOrder={8}>
        <meshBasicMaterial
          color="#08b9e8"
          transparent
          opacity={0.98}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={geometries.glint} renderOrder={9}>
        <meshBasicMaterial color="#d5f8ff" transparent opacity={0.42} depthWrite={false} toneMapped={false} />
      </mesh>
      {[
        [-0.42, 0.14, 0.25, 0.19],
        [-0.05, 0.12, -0.24, 0.16],
        [0.34, 0.14, 0.25, 0.18],
        [0.5, 0.1, -0.05, 0.12],
      ].map(([x, y, z, scale], index) => (
        <mesh
          key={`current-bank-${index}`}
          position={[x, y, z]}
          scale={[scale * 1.25, scale, scale]}
          rotation={[0.2, index * 0.9, 0.12]}
          material={bankMaterial}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      <Sparkles count={4} scale={[1.1, 0.28, 0.75]} size={0.9} speed={0.18} color="#c8f5ff" position={[0, 0.2, 0]} opacity={0.58} />
    </group>
  );
};

const CrystalShrine: React.FC = () => {
  const { tile } = useSanctuaryMaterials();
  const crystalRef = useRef<THREE.Group>(null);
  const stoneMaterial = useMemo(() => createStoneMaterial(tile, '#c7d2d9', 0.44, 0.93), [tile]);
  const darkMaterial = useMemo(() => createStoneMaterial(tile, '#738591', 0.32, 0.97), [tile]);
  const crystalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#9be8ff',
    emissive: '#168ac2',
    emissiveIntensity: 1.65,
    roughness: 0.14,
    metalness: 0.06,
    transparent: true,
    opacity: 0.9,
  }), []);

  useFrame((state) => {
    if (!crystalRef.current) return;
    crystalRef.current.rotation.y = state.clock.getElapsedTime() * 0.12;
    crystalRef.current.position.y = 1.55 + Math.sin(state.clock.getElapsedTime() * 1.6) * 0.025;
  });

  useEffect(() => () => {
    stoneMaterial.dispose();
    darkMaterial.dispose();
    crystalMaterial.dispose();
  }, [crystalMaterial, darkMaterial, stoneMaterial]);

  return (
    <group>
      <mesh position={[0, 0.09, 0]} material={darkMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.58, 0.18, 10]} />
      </mesh>
      <mesh position={[0, 0.24, 0]} material={stoneMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.46, 0.16, 10]} />
      </mesh>
      <mesh position={[0, 0.68, 0]} material={stoneMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.23, 0.78, 12]} />
      </mesh>
      <mesh position={[0, 1.07, 0]} material={darkMaterial} castShadow>
        <cylinderGeometry args={[0.28, 0.2, 0.18, 10]} />
      </mesh>
      <mesh position={[0, 1.17, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.24, 0.025, 6, 32]} />
        <meshStandardMaterial color="#b68a4b" metalness={0.76} roughness={0.34} />
      </mesh>
      <group ref={crystalRef} position={[0, 1.55, 0]}>
        <mesh material={crystalMaterial} castShadow>
          <coneGeometry args={[0.23, 0.82, 6]} />
        </mesh>
        <mesh material={crystalMaterial} position={[-0.25, -0.2, 0.04]} rotation={[0.16, 0.2, 0.42]} castShadow>
          <coneGeometry args={[0.12, 0.5, 5]} />
        </mesh>
        <mesh material={crystalMaterial} position={[0.23, -0.22, -0.08]} rotation={[-0.18, -0.28, -0.4]} castShadow>
          <coneGeometry args={[0.11, 0.46, 5]} />
        </mesh>
      </group>
      <pointLight position={[0, 1.45, 0]} color="#69d6ff" intensity={1.25} distance={3.2} decay={2} />
      <Sparkles count={5} scale={[0.7, 1.4, 0.7]} size={1.15} speed={0.2} color="#c9f4ff" position={[0, 1.1, 0]} opacity={0.56} />
    </group>
  );
};

const EmberSeal: React.FC = () => (
  <group>
    <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
      <cylinderGeometry args={[0.5, 0.56, 0.12, 12]} />
      <meshStandardMaterial color="#3f4b53" roughness={0.97} />
    </mesh>
    <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.33, 0.035, 8, 32]} />
      <meshStandardMaterial color="#ffc273" emissive="#d96824" emissiveIntensity={1.3} roughness={0.32} />
    </mesh>
    <Sparkles count={4} scale={[0.7, 0.45, 0.7]} size={0.95} speed={0.24} color="#ffd5a0" position={[0, 0.25, 0]} opacity={0.58} />
  </group>
);

interface SanctuaryObstacleProps {
  entity: BoardEntity;
  onClick: () => void;
}

export const SanctuaryObstacle: React.FC<SanctuaryObstacleProps> = ({ entity, onClick }) => {
  const node = getBoardVisualNode(entity.position);
  const isEmberSeal = entity.cardId === 'obstaculo-lava';
  const isRidge = entity.cardId === 'obstaculo-risco';
  const isArcaneCurrent = entity.cardId === 'obstaculo-corriente';
  const rotationY = (entity.position.x + entity.position.y) % 2 === 0 ? 0.12 : Math.PI / 2 + 0.12;

  return (
    <group
      position={node.worldPosition}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onPointerEnter={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerLeave={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {isRidge ? (
        <StoneRidge />
      ) : isArcaneCurrent ? (
        <ArcaneCurrent rotationY={rotationY} />
      ) : isEmberSeal ? (
        <EmberSeal />
      ) : (
        <CrystalShrine />
      )}
    </group>
  );
};
