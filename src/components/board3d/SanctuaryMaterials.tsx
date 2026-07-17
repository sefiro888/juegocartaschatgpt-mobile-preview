import React, { createContext, useContext, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { resolvePublicAsset } from '../../core/publicAssets';

const STONE_COLOR_URL = resolvePublicAsset(
  '/assets/scenarios/floating-sanctuary/textures/stone_tile_wall_diff_512.jpg',
);

useTexture.preload(STONE_COLOR_URL);

export interface SanctuaryStoneTextureSet {
  map: THREE.Texture;
}

interface SanctuaryMaterialsContextValue {
  masonry: SanctuaryStoneTextureSet;
  tile: SanctuaryStoneTextureSet;
}

const SanctuaryMaterialsContext = createContext<SanctuaryMaterialsContextValue | null>(null);
const EMPTY_TEXTURE = new THREE.Texture();
const EMPTY_MATERIALS: SanctuaryMaterialsContextValue = {
  masonry: { map: EMPTY_TEXTURE },
  tile: { map: EMPTY_TEXTURE },
};

const LoadedSanctuaryMaterialsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const colorMap = useTexture(STONE_COLOR_URL);
  const materials = useMemo<SanctuaryMaterialsContextValue>(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.repeat.set(1, 1);
    colorMap.offset.set(0, 0);
    colorMap.anisotropy = 6;
    colorMap.needsUpdate = true;

    const textureSet = { map: colorMap };
    return { masonry: textureSet, tile: textureSet };
  }, [colorMap]);

  return (
    <SanctuaryMaterialsContext.Provider value={materials}>
      {children}
    </SanctuaryMaterialsContext.Provider>
  );
};

interface SanctuaryMaterialsProviderProps extends React.PropsWithChildren {
  enabled?: boolean;
}

export const SanctuaryMaterialsProvider: React.FC<SanctuaryMaterialsProviderProps> = ({
  children,
  enabled = true,
}) => {
  if (!enabled) {
    return (
      <SanctuaryMaterialsContext.Provider value={EMPTY_MATERIALS}>
        {children}
      </SanctuaryMaterialsContext.Provider>
    );
  }

  return <LoadedSanctuaryMaterialsProvider>{children}</LoadedSanctuaryMaterialsProvider>;
};

// oxlint-disable-next-line react/only-export-components
export function useSanctuaryMaterials(): SanctuaryMaterialsContextValue {
  const context = useContext(SanctuaryMaterialsContext);
  if (!context) {
    throw new Error('useSanctuaryMaterials must be used inside SanctuaryMaterialsProvider.');
  }
  return context;
}
