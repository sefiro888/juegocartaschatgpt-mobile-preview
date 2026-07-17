import React, { useEffect, useMemo, useRef } from 'react';
import { Sparkles, useGLTF, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { resolvePublicAsset } from '../../core/publicAssets';
import type { WorldPoint } from '../../core/boardVisualLayout';

const MODEL_URL = resolvePublicAsset('/assets/scenarios/floating-sanctuary/floating-sanctuary.glb');
const CLOUD_TEXTURE_URL = resolvePublicAsset('/assets/scenarios/floating-sanctuary/textures/cloud.webp');
const SKY_PLATE_URL = resolvePublicAsset('/assets/scenarios/floating-sanctuary/textures/sky-atmosphere-v1.png');

useTexture.preload(CLOUD_TEXTURE_URL);
useTexture.preload(SKY_PLATE_URL);

type SanctuaryDebugMode = 'bare' | 'model' | 'environment' | 'clouds';

function getSanctuaryDebugMode(): SanctuaryDebugMode | null {
  const mode = new URLSearchParams(window.location.search).get('sanctuaryDebug');
  if (mode === 'bare' || mode === 'model' || mode === 'environment' || mode === 'clouds') return mode;
  return null;
}

const PORTAL_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PORTAL_FRAGMENT_SHADER = `
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 point = (vUv - 0.5) * vec2(1.0, 0.72);
    float radius = length(point);
    float angle = atan(point.y, point.x);
    float spiral = sin(angle * 7.0 - uTime * 1.8 + radius * 28.0);
    float current = sin(radius * 42.0 - uTime * 3.2 + spiral * 1.8);
    float grain = hash(floor(vUv * 92.0) + floor(uTime * 4.0));
    float mask = 1.0 - smoothstep(0.315, 0.49, radius);
    float core = 1.0 - smoothstep(0.0, 0.34, radius);
    vec3 deepBlue = vec3(0.015, 0.12, 0.48);
    vec3 arcaneBlue = vec3(0.06, 0.56, 1.0);
    vec3 whiteBlue = vec3(0.68, 0.94, 1.0);
    vec3 color = mix(deepBlue, arcaneBlue, 0.48 + current * 0.22);
    color = mix(color, whiteBlue, core * 0.58 + grain * 0.08);
    float alpha = mask * (0.76 + current * 0.08);
    gl_FragColor = vec4(color, alpha);
  }
`;

const SKY_VERTEX_SHADER = `
  varying vec3 vWorldDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldDirection = normalize(worldPosition.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uStorm;
  uniform float uLightning;
  varying vec3 vWorldDirection;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    float a = hash(cell);
    float b = hash(cell + vec2(1.0, 0.0));
    float c = hash(cell + vec2(0.0, 1.0));
    float d = hash(cell + vec2(1.0, 1.0));
    return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 5; octave++) {
      value += noise(point) * amplitude;
      point = point * 2.03 + vec2(17.2, 9.1);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 direction = normalize(vWorldDirection);
    float height = smoothstep(-0.18, 0.76, direction.y);
    float horizonBand = 1.0 - smoothstep(-0.08, 0.34, abs(direction.y));
    vec3 horizon = vec3(0.66, 0.77, 0.88);
    vec3 zenith = vec3(0.08, 0.22, 0.43);
    vec3 dawn = vec3(1.0, 0.58, 0.3);
    vec3 color = mix(horizon, zenith, height);

    vec3 sunDirection = normalize(vec3(0.64, 0.24, -0.73));
    float sunDot = max(dot(direction, sunDirection), 0.0);
    float sunGlow = pow(sunDot, 18.0);
    float sunCore = pow(sunDot, 220.0);
    color = mix(color, dawn, horizonBand * sunGlow * 0.48);
    color += vec3(1.0, 0.78, 0.55) * sunCore * 0.82;

    float azimuth = atan(direction.z, direction.x);
    vec2 wind = vec2(uTime * 0.009, -uTime * 0.0025);
    vec2 cloudUv = vec2(azimuth * 1.9, direction.y * 4.8);
    vec2 warpedUv = cloudUv + vec2(fbm(cloudUv * 1.6 + wind) - 0.5, fbm(cloudUv * 1.2 - wind * 0.7) - 0.5) * 0.33;
    float distantClouds = fbm(warpedUv * 1.36 + wind * 0.65);
    float middleClouds = fbm(warpedUv * 2.5 - wind * 1.45 + vec2(8.7, 2.1));
    float highClouds = fbm(vec2(azimuth * 3.5 + uTime * 0.006, direction.y * 8.2));
    float cloudBand = smoothstep(-0.02, 0.17, direction.y) * (1.0 - smoothstep(0.59, 0.81, direction.y));
    float cloudMass = smoothstep(0.46, 0.72, distantClouds + middleClouds * 0.36 + (0.28 - abs(direction.y - 0.25)) * 0.48);
    float wisps = smoothstep(0.55, 0.77, highClouds) * smoothstep(0.33, 0.56, direction.y);
    float cloudLight = cloudMass * cloudBand;
    float cloudShade = smoothstep(0.38, 0.7, middleClouds) * cloudBand;
    vec3 cloudSilver = vec3(0.9, 0.94, 0.96);
    vec3 cloudBlue = vec3(0.3, 0.42, 0.55);
    vec3 stormBlue = vec3(0.09, 0.15, 0.24);
    vec3 cloudColor = mix(cloudSilver, cloudBlue, cloudShade * 0.62 + (1.0 - sunGlow) * 0.1);
    cloudColor = mix(cloudColor, stormBlue, uStorm * (0.58 + cloudShade * 0.3));
    color = mix(color, cloudColor, cloudLight * (0.64 + uStorm * 0.24));
    color = mix(color, vec3(0.81, 0.87, 0.92), wisps * 0.16 * (1.0 - uStorm));

    float stormHorizon = smoothstep(0.02, 0.2, direction.y) * (1.0 - smoothstep(0.34, 0.52, direction.y));
    float stormCells = smoothstep(0.43, 0.7, fbm(vec2(azimuth * 2.1 - uTime * 0.014, direction.y * 7.5)));
    color = mix(color, vec3(0.08, 0.13, 0.21), stormHorizon * stormCells * uStorm * 0.62);

    float farRidge = 0.005 + sin(azimuth * 3.1 + 0.8) * 0.025 + sin(azimuth * 7.4) * 0.012;
    float nearRidge = -0.012 + sin(azimuth * 2.4 - 0.5) * 0.038 + sin(azimuth * 5.7 + 1.2) * 0.018;
    float horizonFloor = smoothstep(-0.16, -0.045, direction.y);
    float farMountains = (1.0 - smoothstep(farRidge - 0.018, farRidge + 0.018, direction.y)) * horizonFloor;
    float nearMountains = (1.0 - smoothstep(nearRidge - 0.016, nearRidge + 0.016, direction.y)) * horizonFloor;
    color = mix(color, vec3(0.36, 0.5, 0.63), farMountains * 0.42);
    color = mix(color, vec3(0.24, 0.38, 0.52), nearMountains * 0.3);

    float atmosphericHaze = smoothstep(0.02, 0.24, direction.y) * (1.0 - smoothstep(0.55, 0.8, direction.y));
    color += vec3(0.08, 0.1, 0.12) * atmosphericHaze * 0.1;
    color += vec3(0.58, 0.74, 1.0) * uLightning * (0.28 + stormHorizon * 0.72);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const SkyDome: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uStorm: { value: 0 }, uLightning: { value: 0 } }), []);

  useFrame((state) => {
    if (!materialRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    const storm = THREE.MathUtils.smoothstep((Math.sin(elapsed * 0.052) + 1) * 0.5, 0.78, 0.96);
    const lightning = storm * Math.pow(Math.max(0, Math.sin(elapsed * 2.17 + Math.sin(elapsed * 0.27) * 3.4)), 42);
    materialRef.current.uniforms.uTime.value = elapsed;
    materialRef.current.uniforms.uStorm.value = storm;
    materialRef.current.uniforms.uLightning.value = lightning;
  });

  return (
    <mesh renderOrder={-20} frustumCulled={false}>
      <sphereGeometry args={[105, 32, 18]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={SKY_VERTEX_SHADER}
        fragmentShader={SKY_FRAGMENT_SHADER}
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  );
};

const SkyBackdropPlate: React.FC = () => {
  const backdropRef = useRef<THREE.Sprite>(null);
  const skyTexture = useTexture(SKY_PLATE_URL);
  const { camera } = useThree();
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    skyTexture.anisotropy = 8;
    skyTexture.needsUpdate = true;
  }, [skyTexture]);

  useFrame(() => {
    if (!backdropRef.current) return;
    camera.getWorldDirection(cameraDirection);
    backdropRef.current.position
      .copy(camera.position)
      .addScaledVector(cameraDirection, 108);
  });

  return (
    <sprite ref={backdropRef} scale={[230, 92, 1]} renderOrder={-12} frustumCulled={false}>
      <spriteMaterial
        map={skyTexture}
        color="#c7d7e4"
        depthTest
        depthWrite={false}
        transparent={false}
        fog={false}
        toneMapped={false}
      />
    </sprite>
  );
};

interface CrystalLightProps {
  position: WorldPoint;
  phase: number;
  intensity?: number;
}

const CrystalLight: React.FC<CrystalLightProps> = ({ position, phase, intensity = 1 }) => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!lightRef.current) return;
    lightRef.current.intensity = intensity * (0.88 + Math.sin(state.clock.getElapsedTime() * 1.7 + phase) * 0.12);
  });

  return (
    <group position={position}>
      <pointLight ref={lightRef} color="#57c9ff" intensity={intensity} distance={6} decay={2} />
      <Sparkles count={5} scale={[1.1, 2.1, 1.1]} size={1.8} speed={0.22} color="#b9efff" opacity={0.6} />
    </group>
  );
};

const PortalVortex: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const haloRef = useRef<THREE.Group>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (materialRef.current) materialRef.current.uniforms.uTime.value = elapsed;
    if (haloRef.current) haloRef.current.rotation.z = Math.sin(elapsed * 0.3) * 0.08;
  });

  return (
    <group position={[-8.25, 2.35, -7.14]}>
      <mesh renderOrder={3}>
        <planeGeometry args={[2.12, 3.78]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={PORTAL_VERTEX_SHADER}
          fragmentShader={PORTAL_FRAGMENT_SHADER}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <group ref={haloRef} position={[0, 0, 0.02]} scale={[1, 1.52, 1]}>
        <mesh>
          <ringGeometry args={[1.02, 1.075, 64]} />
          <meshBasicMaterial
            color="#8ddfff"
            transparent
            opacity={0.72}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>
      <pointLight position={[0, 0, 1.1]} color="#46bdff" intensity={4.2} distance={8.5} decay={2} />
      <Sparkles count={18} scale={[2.5, 4.8, 1.4]} size={2.1} speed={0.35} color="#bdefff" opacity={0.72} />
    </group>
  );
};

interface DistantCitadelProps {
  position: WorldPoint;
  scale: number;
  broken?: boolean;
  rotationY?: number;
}

const DistantCitadel: React.FC<DistantCitadelProps> = ({
  position,
  scale,
  broken = false,
  rotationY = 0,
}) => (
  <group position={position} scale={scale} rotation={[0, rotationY, 0]}>
    <mesh position={[0, -1.95, 0]} rotation={[Math.PI, 0, 0]} castShadow>
      <coneGeometry args={[2.2, 4.7, 8]} />
      <meshStandardMaterial color="#35485a" roughness={0.99} flatShading />
    </mesh>
    <mesh position={[0, 0.08, 0]} castShadow>
      <cylinderGeometry args={[1.75, 2.05, 0.58, 10]} />
      <meshStandardMaterial color="#65798b" roughness={0.94} />
    </mesh>
    <mesh position={[0, 0.42, 0]} castShadow>
      <cylinderGeometry args={[1.45, 1.62, 0.16, 10]} />
      <meshStandardMaterial color="#947244" metalness={0.5} roughness={0.52} />
    </mesh>
    <mesh position={[0, broken ? 2.35 : 2.75, 0]} castShadow>
      <cylinderGeometry args={[0.43, 0.75, broken ? 3.7 : 4.7, 10]} />
      <meshStandardMaterial color="#52687b" roughness={0.96} />
    </mesh>
    <mesh position={[0, 1.15, 0]} castShadow>
      <cylinderGeometry args={[0.72, 0.86, 0.22, 10]} />
      <meshStandardMaterial color="#8b6a3c" metalness={0.52} roughness={0.5} />
    </mesh>
    {!broken && (
      <>
        <mesh position={[0, 5.68, 0]} castShadow>
          <coneGeometry args={[0.62, 1.45, 8]} />
          <meshStandardMaterial color="#3b5064" roughness={0.94} />
        </mesh>
        <mesh position={[0, 6.34, 0]}>
          <octahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial color="#7fddff" emissive="#1b83b4" emissiveIntensity={1.25} roughness={0.2} />
        </mesh>
      </>
    )}
    <mesh position={[-0.86, 0.95, 0.1]} castShadow>
      <cylinderGeometry args={[0.18, 0.3, 1.35, 8]} />
      <meshStandardMaterial color="#465c70" roughness={0.97} />
    </mesh>
    <mesh position={[0.9, 0.8, -0.2]} castShadow>
      <cylinderGeometry args={[0.15, 0.27, 1.05, 8]} />
      <meshStandardMaterial color="#465c70" roughness={0.97} />
    </mesh>
  </group>
);

const SanctuaryModel: React.FC = () => {
  const gltf = useGLTF(MODEL_URL, false, true);
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.material = Array.isArray(child.material)
        ? child.material.map((material) => material.clone())
        : child.material.clone();
    });
    return clone;
  }, [gltf.scene]);

  useEffect(() => {
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = !child.name.includes('Rune');
      child.receiveShadow = true;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        if (material.map) {
          material.map.anisotropy = 8;
          material.map.colorSpace = THREE.SRGBColorSpace;
        }
        if (material.name.includes('StoneLight')) {
          material.color.lerp(new THREE.Color('#91a4b2'), 0.38);
        } else if (material.name.includes('StoneMid')) {
          material.color.lerp(new THREE.Color('#607487'), 0.32);
        } else if (material.name.includes('StoneDark')) {
          material.color.lerp(new THREE.Color('#34495c'), 0.25);
        }
        material.envMapIntensity = material.name.includes('AgedGold') ? 1.35 : 0.7;
        material.roughness = material.name.includes('AgedGold') ? 0.4 : Math.max(material.roughness, 0.78);
        material.needsUpdate = true;
      }
    });

    return () => {
      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      });
    };
  }, [model]);

  return <primitive object={model} />;
};

const CLOUD_SPRITES: Array<{
  position: WorldPoint;
  scale: [number, number];
  opacity: number;
  rotation: number;
}> = [
  { position: [-17, -2.6, 8], scale: [12, 6.5], opacity: 0.52, rotation: -0.08 },
  { position: [-9, -3.4, 10], scale: [10, 5.6], opacity: 0.44, rotation: 0.06 },
  { position: [1, -3.8, 10], scale: [13, 6.4], opacity: 0.42, rotation: -0.04 },
  { position: [12, -3.1, 8], scale: [11, 5.8], opacity: 0.48, rotation: 0.08 },
  { position: [20, -2.3, 4], scale: [10, 5.2], opacity: 0.48, rotation: -0.05 },
  { position: [-22, -1.5, -15], scale: [14, 7.4], opacity: 0.5, rotation: 0.04 },
  { position: [-12, -2.2, -22], scale: [12, 6.2], opacity: 0.42, rotation: -0.07 },
  { position: [0, -2.6, -27], scale: [16, 7.8], opacity: 0.5, rotation: 0.03 },
  { position: [13, -2, -23], scale: [13, 6.8], opacity: 0.45, rotation: -0.04 },
  { position: [23, -1.4, -15], scale: [12, 6.3], opacity: 0.48, rotation: 0.06 },
  { position: [-19, 4.2, -28], scale: [18, 8.4], opacity: 0.2, rotation: -0.06 },
  { position: [-5, 6.4, -35], scale: [21, 9.2], opacity: 0.18, rotation: 0.04 },
  { position: [11, 5.1, -32], scale: [19, 8.6], opacity: 0.21, rotation: -0.03 },
  { position: [25, 4.8, -24], scale: [16, 7.5], opacity: 0.19, rotation: 0.08 },
  { position: [-28, 7.2, -42], scale: [25, 11], opacity: 0.16, rotation: -0.02 },
  { position: [-8, 8.8, -47], scale: [27, 12], opacity: 0.14, rotation: 0.04 },
  { position: [15, 7.5, -43], scale: [24, 10], opacity: 0.16, rotation: -0.05 },
  { position: [33, 6.2, -36], scale: [22, 9.4], opacity: 0.15, rotation: 0.07 },
];

const CloudLayer: React.FC = () => {
  const nearCloudsRef = useRef<THREE.Group>(null);
  const farCloudsRef = useRef<THREE.Group>(null);
  const cloudTexture = useTexture(CLOUD_TEXTURE_URL);

  useEffect(() => {
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    cloudTexture.anisotropy = 4;
    cloudTexture.needsUpdate = true;
  }, [cloudTexture]);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const storm = THREE.MathUtils.smoothstep((Math.sin(elapsed * 0.052) + 1) * 0.5, 0.78, 0.96);

    if (nearCloudsRef.current) {
      nearCloudsRef.current.position.x = Math.sin(elapsed * 0.04) * 0.65;
      nearCloudsRef.current.position.y = Math.cos(elapsed * 0.03) * 0.16;
      nearCloudsRef.current.position.z = Math.sin(elapsed * 0.022) * 0.72;
      nearCloudsRef.current.children.forEach((child, index) => {
        if (!(child instanceof THREE.Sprite)) return;
        const material = child.material as THREE.SpriteMaterial;
        const baseOpacity = CLOUD_SPRITES[index].opacity;
        material.opacity = baseOpacity * (1.0 - storm * 0.2);
        material.color.set(storm > 0.2 ? '#a9b8c5' : '#eef4f6');
      });
    }

    if (farCloudsRef.current) {
      farCloudsRef.current.position.x = Math.sin(elapsed * 0.018) * 1.25;
      farCloudsRef.current.position.y = Math.cos(elapsed * 0.016) * 0.22;
      farCloudsRef.current.position.z = Math.sin(elapsed * 0.012) * 1.1;
      farCloudsRef.current.children.forEach((child, offset) => {
        if (!(child instanceof THREE.Sprite)) return;
        const material = child.material as THREE.SpriteMaterial;
        const baseOpacity = CLOUD_SPRITES[offset + 10].opacity;
        material.opacity = baseOpacity * (0.92 + storm * 0.36);
        material.color.set(storm > 0.2 ? '#768897' : '#dce8ee');
      });
    }
  });

  const renderCloud = (cloud: (typeof CLOUD_SPRITES)[number], index: number) => (
    <sprite key={`cloud-${index}`} position={cloud.position} scale={[cloud.scale[0], cloud.scale[1], 1]}>
      <spriteMaterial
        map={cloudTexture}
        color="#eef4f6"
        transparent
        opacity={cloud.opacity}
        rotation={cloud.rotation}
        depthWrite={false}
        alphaTest={0.015}
        fog
      />
    </sprite>
  );

  return (
    <>
      <group ref={nearCloudsRef} renderOrder={-2}>{CLOUD_SPRITES.slice(0, 10).map(renderCloud)}</group>
      <group ref={farCloudsRef} renderOrder={-3}>{CLOUD_SPRITES.slice(10).map((cloud, index) => renderCloud(cloud, index + 10))}</group>
    </>
  );
};

const WeatherLighting: React.FC = () => {
  const flashRef = useRef<THREE.DirectionalLight>(null);
  const horizonRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const storm = THREE.MathUtils.smoothstep((Math.sin(elapsed * 0.052) + 1) * 0.5, 0.78, 0.96);
    const lightning = storm * Math.pow(Math.max(0, Math.sin(elapsed * 2.17 + Math.sin(elapsed * 0.27) * 3.4)), 42);
    if (flashRef.current) flashRef.current.intensity = 0.05 + lightning * 2.8;
    if (horizonRef.current) horizonRef.current.intensity = 0.18 + storm * 0.46 + lightning * 1.8;
  });

  return (
    <>
      <directionalLight ref={flashRef} position={[-18, 17, -28]} color="#b7d9ff" intensity={0.05} />
      <pointLight ref={horizonRef} position={[-12, 10, -31]} color="#86aef8" intensity={0.18} distance={44} decay={1.7} />
    </>
  );
};

export const FloatingSanctuary: React.FC = () => {
  const debugMode = getSanctuaryDebugMode();
  const showFullScene = debugMode === null;
  const showModel = showFullScene || debugMode === 'model';
  const showEnvironment = showFullScene || debugMode === 'environment';
  const showClouds = showFullScene || debugMode === 'clouds';

  return (
    <group>
    <color attach="background" args={['#91a9bd']} />
    <fog attach="fog" args={['#8da5b8', 31, 86]} />
    {showEnvironment && <SkyDome />}
    {showEnvironment && <SkyBackdropPlate />}

    <hemisphereLight args={['#e6f3ff', '#344554', 1.42]} />
    <ambientLight intensity={0.26} />
    <directionalLight
      position={[15, 22, 11]}
      color="#ffd6a0"
      intensity={2.85}
      castShadow={showFullScene}
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-left={-15}
      shadow-camera-right={15}
      shadow-camera-top={14}
      shadow-camera-bottom={-14}
      shadow-camera-near={1}
      shadow-camera-far={55}
      shadow-bias={-0.00035}
      shadow-normalBias={0.025}
      shadow-radius={2}
    />
    <directionalLight position={[-13, 10, -15]} color="#86c9f1" intensity={0.86} />
    {showEnvironment && <WeatherLighting />}

    {showClouds && <CloudLayer />}
    {showFullScene && (
      <>
        <DistantCitadel position={[-18, -4.6, -30]} scale={1.05} rotationY={0.28} />
        <DistantCitadel position={[-8, -5.2, -35]} scale={0.78} rotationY={-0.34} broken />
        <DistantCitadel position={[11, -5, -36]} scale={0.88} rotationY={0.2} />
        <DistantCitadel position={[20, -4.5, -29]} scale={1.08} rotationY={-0.22} broken />
      </>
    )}

    {showModel && <SanctuaryModel />}
    {showFullScene && <PortalVortex />}

    {showFullScene && (
      <>
        <CrystalLight position={[-9.35, 1.7, -4.85]} phase={0.4} intensity={2.1} />
        <CrystalLight position={[-9.15, 1.45, 7.9]} phase={1.8} intensity={2.2} />
        <CrystalLight position={[8.85, 2.15, -5.25]} phase={3.1} intensity={2.35} />
        <CrystalLight position={[9.65, 1.45, 3.6]} phase={4.6} intensity={1.8} />
      </>
    )}

    {showFullScene && (
      <Sparkles
        count={24}
        scale={[27, 7, 23]}
        position={[0, 2.6, -2]}
        size={1.15}
        speed={0.12}
        color="#d9f5ff"
        opacity={0.34}
      />
    )}
    </group>
  );
};

useGLTF.preload(MODEL_URL, false, true);
