import React, { useRef } from 'react';
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

  // Initialize random velocities and positions
  const tempPositions = new Float32Array(count * 3);
  const tempVelocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Spread particles slightly around position
    tempPositions[i * 3] = (Math.random() - 0.5) * 1.5;
    tempPositions[i * 3 + 1] = Math.random() * 0.5;
    tempPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

    // Upward velocity
    tempVelocities[i * 3] = (Math.random() - 0.5) * 0.2;
    tempVelocities[i * 3 + 1] = 0.5 + Math.random() * 0.5; // up speed
    tempVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }

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
      if (y > 2.0) {
        y = 0;
        x = (Math.random() - 0.5) * 1.5;
        z = (Math.random() - 0.5) * 1.5;
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
