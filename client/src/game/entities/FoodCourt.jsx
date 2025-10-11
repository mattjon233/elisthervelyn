import * as THREE from 'three';

const FOOD_COURT_POSITION = { x: -30, y: 0, z: 0 };

// --- Componentes Visuais --- //

const FoodStall = ({ position, color = '#e74c3c' }) => (
  <group position={position}>
    {/* Base */}
    <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[3, 1, 1.5]} /><meshStandardMaterial color="#bdc3c7" /></mesh>
    {/* Balcão */}
    <mesh position={[0, 1.05, 0]} castShadow><boxGeometry args={[3.1, 0.1, 1.6]} /><meshStandardMaterial color="#ecf0f1" /></mesh>
    {/* Toldo */}
    <mesh position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[3.2, 0.4, 1.7]} />
        <meshStandardMaterial color={color} />
    </mesh>
  </group>
);

const Table = ({ position }) => (
    <group position={position}>
        {/* Perna */}
        <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 0.6, 8]} /><meshStandardMaterial color="#7f8c8d" /></mesh>
        {/* Tampo */}
        <mesh position={[0, 0.6, 0]} castShadow><cylinderGeometry args={[0.5, 0.5, 0.05, 16]} /><meshStandardMaterial color="#95a5a6" /></mesh>
        {/* Guarda-sol */}
        <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 1.8, 8]} /><meshStandardMaterial color="#7f8c8d" /></mesh>
        <mesh position={[0, 2.0, 0]} castShadow><coneGeometry args={[1, 0.5, 8]} /><meshStandardMaterial color="#3498db" /></mesh>
    </group>
);


// --- Dados de Colisão --- //

const foodCourtItemData = [
    { type: 'box', subType: 'stall1', x: -5, z: 0, width: 3.2, depth: 1.7 },
    { type: 'box', subType: 'stall2', x: 5, z: 0, width: 3.2, depth: 1.7 },
    { type: 'sphere', subType: 'table1', x: 0, z: 5, radius: 0.5 },
    { type: 'sphere', subType: 'table2', x: -4, z: 6, radius: 0.5 },
    { type: 'sphere', subType: 'table3', x: 4, z: 6, radius: 0.5 },
];

export const foodCourtObstacles = foodCourtItemData.map(item => ({
    type: item.type,
    x: item.x + FOOD_COURT_POSITION.x,
    z: item.z + FOOD_COURT_POSITION.z,
    radius: item.radius,
    width: item.width,
    depth: item.depth,
}));

// --- Componente Principal --- //

function FoodCourt() {
  return (
    <group position={[FOOD_COURT_POSITION.x, FOOD_COURT_POSITION.y, FOOD_COURT_POSITION.z]}>
      {/* Chão de pedra */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 15]} />
        <meshStandardMaterial color="#95a5a6" />
      </mesh>

      {/* Barracas */}
      <FoodStall position={[-5, 0, 0]} color="#e74c3c" />
      <FoodStall position={[5, 0, 0]} color="#2ecc71" />

      {/* Mesas */}
      <Table position={[0, 0, 5]} />
      <Table position={[-4, 0, 6]} />
      <Table position={[4, 0, 6]} />
    </group>
  );
}

export default FoodCourt;
