import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FactionParticlesProps {
  position: [number, number, number];
  faction: 'FURIA' | 'ARCANO';
  count?: number;
}

export const FactionParticles: React.FC<FactionParticlesProps> = ({
  position,
  faction,
  count = 20,
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [tempPositions, tempVelocities] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.18 + ((i * 7) % 9) * 0.045;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = ((i * 5) % 11) * 0.035;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      velocities[i * 3] = Math.cos(angle) * 0.06;
      velocities[i * 3 + 1] = 0.32 + ((i * 3) % 7) * 0.035;
      velocities[i * 3 + 2] = Math.sin(angle) * 0.06;
    }

    return [positions, velocities];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute('position');

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      
      // Update Y position (upwards)
      let y = posAttr.getY(i) + tempVelocities[idx + 1] * delta;
      let x = posAttr.getX(i) + tempVelocities[idx] * delta;
      let z = posAttr.getZ(i) + tempVelocities[idx + 2] * delta;

      // Reset when particle goes too high
      if (y > 1.35) {
        y = 0;
        const angle = (i / count) * Math.PI * 2;
        x = Math.cos(angle) * 0.22;
        z = Math.sin(angle) * 0.22;
      }

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  });

  const particleColor = faction === 'FURIA' ? '#ff4d00' : '#00e5ff';

  return (
    <group position={position}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[tempPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={particleColor}
          size={0.12}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
