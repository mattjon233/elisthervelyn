import * as THREE from 'three';

// Posição central do cemitério
const CEMETERY_POSITION = { x: 35, y: 0, z: -35 };
const CEMETERY_SIZE = { width: 22, depth: 20 };

// --- Componentes Visuais --- //

const Wall = ({ position, args }) => (
  <mesh position={position} castShadow>
    <boxGeometry args={args} />
    <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
  </mesh>
);

const Tombstone = ({ position, rotation = [0, 0, 0], type }) => {
  const stoneColor = "#5a5a5a";
  const baseArgs = [0.8, 0.2, 0.3];

  return (
    <group position={position} rotation={rotation}>
      {type === 'cross' && (
        <group>
          <mesh castShadow position={[0, 0.6, 0]}><boxGeometry args={[0.2, 1.2, 0.2]} /><meshStandardMaterial color={stoneColor} /></mesh>
          <mesh castShadow position={[0, 0.9, 0]}><boxGeometry args={[0.7, 0.2, 0.2]} /><meshStandardMaterial color={stoneColor} /></mesh>
        </group>
      )}
      {type === 'rounded' && (
        <mesh castShadow position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.8, 16, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color={stoneColor} side={THREE.DoubleSide} />
        </mesh>
      )}
      {type === 'block' && (
        <mesh castShadow position={[0, 0.5, 0]}><boxGeometry args={[0.7, 1, 0.3]} /><meshStandardMaterial color={stoneColor} /></mesh>
      )}
       {type === 'simple' && (
        <mesh castShadow position={[0, 0.3, 0]}><boxGeometry args={[0.6, 0.6, 0.25]} /><meshStandardMaterial color={stoneColor} /></mesh>
      )}
    </group>
  );
};

// --- Dados de Colisão --- //

const wallData = [
  // Parede de trás (Norte)
  { x: 0, z: -CEMETERY_SIZE.depth / 2, width: CEMETERY_SIZE.width, depth: 0.5 },
  // Parede da esquerda (Oeste)
  { x: -CEMETERY_SIZE.width / 2, z: 0, width: 0.5, depth: CEMETERY_SIZE.depth },
  // Parede da direita (Leste)
  { x: CEMETERY_SIZE.width / 2, z: 0, width: 0.5, depth: CEMETERY_SIZE.depth },
  // Parede da frente (Sul) - com entrada
  { x: -CEMETERY_SIZE.width / 4 - 1.5, z: CEMETERY_SIZE.depth / 2, width: CEMETERY_SIZE.width / 2 - 3, depth: 0.5 },
  { x: CEMETERY_SIZE.width / 4 + 1.5, z: CEMETERY_SIZE.depth / 2, width: CEMETERY_SIZE.width / 2 - 3, depth: 0.5 },
];

const tombstoneData = [
  { x: -8, z: -8, type: 'cross', rotation: 0.1 },
  { x: -5, z: -6, type: 'rounded', rotation: -0.2 },
  { x: -9, z: -3, type: 'block', rotation: 0.05 },
  { x: -6, z: 0, type: 'simple', rotation: 0.3 },
  { x: -9, z: 3, type: 'cross', rotation: -0.1 },
  { x: -4, z: 5, type: 'rounded', rotation: 0.15 },
  { x: 0, z: -5, type: 'block', rotation: -0.05 },
  { x: 2, z: -2, type: 'simple', rotation: -0.2 },
  { x: 1, z: 2, type: 'cross', rotation: 0.2 },
  { x: 5, z: -8, type: 'rounded', rotation: 0.1 },
  { x: 8, z: -5, type: 'block', rotation: -0.1 },
  { x: 6, z: -1, type: 'simple', rotation: 0.1 },
  { x: 9, z: 4, type: 'cross', rotation: 0.0 },
  { x: 4, z: 7, type: 'rounded', rotation: -0.3 },
];

// Exporta os obstáculos com posições no mundo para o sistema de colisão
export const cemeteryObstacles = [
  // Mapeia paredes para o formato de colisão (caixa)
  ...wallData.map(w => ({
    type: 'box',
    x: w.x + CEMETERY_POSITION.x,
    z: w.z + CEMETERY_POSITION.z,
    width: w.width,
    depth: w.depth,
  })),
  // Mapeia túmulos para o formato de colisão (círculo/raio)
  ...tombstoneData.map(t => ({
    type: 'sphere',
    x: t.x + CEMETERY_POSITION.x,
    z: t.z + CEMETERY_POSITION.z,
    radius: 0.5, // Raio de colisão padrão para túmulos
  }))
];

// --- Componente Principal --- //

function Cemetery() {
  return (
    <group position={[CEMETERY_POSITION.x, CEMETERY_POSITION.y, CEMETERY_POSITION.z]}>
      {/* Renderiza as Paredes */}
      {wallData.map((wall, i) => (
        <Wall key={i} position={[wall.x, 1.5, wall.z]} args={[wall.width, 3, wall.depth]} />
      ))}

      {/* Renderiza os Túmulos */}
      {tombstoneData.map((tomb, i) => (
        <Tombstone key={i} position={[tomb.x, 0, tomb.z]} rotation={[0, tomb.rotation, 0]} type={tomb.type} />
      ))}

      {/* Chão do cemitério (um pouco mais escuro) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CEMETERY_SIZE.width, CEMETERY_SIZE.depth]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
    </group>
  );
}

export default Cemetery;
