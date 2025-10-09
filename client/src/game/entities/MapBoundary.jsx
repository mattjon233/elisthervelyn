import * as THREE from 'three';

/**
 * Barreiras nas bordas do mapa
 * Paredes de pedra com colisão física
 */
function MapBoundary() {
  const mapSize = 50; // Tamanho do mapa (100x100, então ±50)
  const wallHeight = 4;
  const wallThickness = 1;

  // Cor e textura das paredes
  const wallColor = '#5A5A5A';
  const topColor = '#6B6B6B';

  return (
    <group>
      {/* Parede Norte */}
      <mesh position={[0, wallHeight / 2, -mapSize]} receiveShadow castShadow>
        <boxGeometry args={[mapSize * 2, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      {/* Topo da parede Norte */}
      <mesh position={[0, wallHeight, -mapSize]} receiveShadow>
        <boxGeometry args={[mapSize * 2, 0.3, wallThickness + 0.2]} />
        <meshStandardMaterial color={topColor} roughness={0.6} />
      </mesh>

      {/* Parede Sul */}
      <mesh position={[0, wallHeight / 2, mapSize]} receiveShadow castShadow>
        <boxGeometry args={[mapSize * 2, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      {/* Topo da parede Sul */}
      <mesh position={[0, wallHeight, mapSize]} receiveShadow>
        <boxGeometry args={[mapSize * 2, 0.3, wallThickness + 0.2]} />
        <meshStandardMaterial color={topColor} roughness={0.6} />
      </mesh>

      {/* Parede Leste */}
      <mesh position={[mapSize, wallHeight / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, wallHeight, mapSize * 2]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      {/* Topo da parede Leste */}
      <mesh position={[mapSize, wallHeight, 0]} receiveShadow>
        <boxGeometry args={[wallThickness + 0.2, 0.3, mapSize * 2]} />
        <meshStandardMaterial color={topColor} roughness={0.6} />
      </mesh>

      {/* Parede Oeste */}
      <mesh position={[-mapSize, wallHeight / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, wallHeight, mapSize * 2]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      {/* Topo da parede Oeste */}
      <mesh position={[-mapSize, wallHeight, 0]} receiveShadow>
        <boxGeometry args={[wallThickness + 0.2, 0.3, mapSize * 2]} />
        <meshStandardMaterial color={topColor} roughness={0.6} />
      </mesh>

      {/* Torres nos cantos */}
      {/* Canto Nordeste */}
      <mesh position={[mapSize, wallHeight, -mapSize]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.5, wallHeight * 1.5, 8]} />
        <meshStandardMaterial color={topColor} roughness={0.7} />
      </mesh>
      {/* Topo da torre NE */}
      <mesh position={[mapSize, wallHeight * 1.75, -mapSize]}>
        <coneGeometry args={[1.8, 1.5, 8]} />
        <meshStandardMaterial color="#4A4A4A" roughness={0.6} />
      </mesh>

      {/* Canto Noroeste */}
      <mesh position={[-mapSize, wallHeight, -mapSize]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.5, wallHeight * 1.5, 8]} />
        <meshStandardMaterial color={topColor} roughness={0.7} />
      </mesh>
      {/* Topo da torre NO */}
      <mesh position={[-mapSize, wallHeight * 1.75, -mapSize]}>
        <coneGeometry args={[1.8, 1.5, 8]} />
        <meshStandardMaterial color="#4A4A4A" roughness={0.6} />
      </mesh>

      {/* Canto Sudeste */}
      <mesh position={[mapSize, wallHeight, mapSize]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.5, wallHeight * 1.5, 8]} />
        <meshStandardMaterial color={topColor} roughness={0.7} />
      </mesh>
      {/* Topo da torre SE */}
      <mesh position={[mapSize, wallHeight * 1.75, mapSize]}>
        <coneGeometry args={[1.8, 1.5, 8]} />
        <meshStandardMaterial color="#4A4A4A" roughness={0.6} />
      </mesh>

      {/* Canto Sudoeste */}
      <mesh position={[-mapSize, wallHeight, mapSize]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.5, wallHeight * 1.5, 8]} />
        <meshStandardMaterial color={topColor} roughness={0.7} />
      </mesh>
      {/* Topo da torre SO */}
      <mesh position={[-mapSize, wallHeight * 1.75, mapSize]}>
        <coneGeometry args={[1.8, 1.5, 8]} />
        <meshStandardMaterial color="#4A4A4A" roughness={0.6} />
      </mesh>
    </group>
  );
}

export default MapBoundary;
