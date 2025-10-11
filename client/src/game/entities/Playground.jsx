import * as THREE from 'three';

// Posição central do parquinho
const PLAYGROUND_POSITION = { x: -25, y: 0, z: -25 };

// --- Componentes Visuais --- //

const SwingSet = ({ position }) => (
  <group position={position}>
    {/* Estrutura */}
    <mesh position={[-1.5, 1, 0]}><boxGeometry args={[0.2, 2.2, 0.2]} /><meshStandardMaterial color="#c0392b" /></mesh>
    <mesh position={[1.5, 1, 0]}><boxGeometry args={[0.2, 2.2, 0.2]} /><meshStandardMaterial color="#c0392b" /></mesh>
    <mesh position={[0, 2, 0]} rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.2, 3.2, 0.2]} /><meshStandardMaterial color="#c0392b" /></mesh>
    {/* Balanços */}
    <mesh position={[-0.8, 0.4, 0]}><boxGeometry args={[0.6, 0.1, 0.4]} /><meshStandardMaterial color="#f1c40f" /></mesh>
    <mesh position={[0.8, 0.4, 0]}><boxGeometry args={[0.6, 0.1, 0.4]} /><meshStandardMaterial color="#f1c40f" /></mesh>
  </group>
);

const Slide = ({ position }) => (
  <group position={position}>
    {/* Escada */}
    <mesh position={[-1, 0.5, 0]}><boxGeometry args={[0.2, 1, 0.2]} /></mesh>
    <mesh position={[-1, 1, 0]}><boxGeometry args={[0.2, 1, 0.2]} /></mesh>
    {/* Plataforma */}
    <mesh position={[-0.5, 1.5, 0]}><boxGeometry args={[1, 0.1, 1]} /></mesh>
    {/* Escorregador */}
    <mesh position={[1, 0.75, 0]} rotation={[0, 0, -Math.PI / 6]}><boxGeometry args={[2, 0.1, 0.8]} /></mesh>
  </group>
);

const SeeSaw = ({ position }) => (
    <group position={position}>
        <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.2, 0.4, 0.2]} /><meshStandardMaterial color="#2980b9" /></mesh>
        <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0.2]}><boxGeometry args={[3, 0.1, 0.5]} /><meshStandardMaterial color="#27ae60" /></mesh>
    </group>
);

// --- Dados de Colisão --- //

const playgroundEquipmentData = [
    { type: 'box', subType: 'swing', x: -3, z: 2, width: 3.2, depth: 0.5 },
    { type: 'box', subType: 'slide', x: 4, z: -1, width: 3, depth: 1 },
    { type: 'box', subType: 'seesaw', x: 2, z: 5, width: 3, depth: 0.5 },
];

export const playgroundObstacles = playgroundEquipmentData.map(item => ({
    type: 'box',
    x: item.x + PLAYGROUND_POSITION.x,
    z: item.z + PLAYGROUND_POSITION.z,
    width: item.width,
    depth: item.depth,
}));

// --- Componente Principal --- //

function Playground() {
  return (
    <group position={[PLAYGROUND_POSITION.x, PLAYGROUND_POSITION.y, PLAYGROUND_POSITION.z]}>
      {/* Chão de areia */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[10, 32]} />
        <meshStandardMaterial color="#f1c40f" roughness={0.9} />
      </mesh>

      {/* Equipamentos */}
      <SwingSet position={[-3, 0, 2]} />
      <Slide position={[4, 0, -1]} />
      <SeeSaw position={[2, 0, 5]} />

    </group>
  );
}

export default Playground;
