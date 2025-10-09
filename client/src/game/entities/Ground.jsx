import * as THREE from 'three';
import { useMemo } from 'react';

/**
 * Chão do jogo com decorações e obstáculos
 */
function Ground() {
  // Árvores/Arbustos decorativos (posições fixas)
  const trees = useMemo(() => [
    { pos: [10, 0, -10], size: 1.5 },
    { pos: [-12, 0, -8], size: 1.2 },
    { pos: [15, 0, 5], size: 1.8 },
    { pos: [-10, 0, 8], size: 1.3 },
    { pos: [8, 0, 12], size: 1.4 },
    { pos: [-15, 0, -15], size: 1.6 },
  ], []);

  // Rochas/Obstáculos (posições e rotações fixas)
  const rocks = useMemo(() => [
    { pos: [-5, 0, -12], scale: [1.2, 0.8, 1], rotation: 0.5 },
    { pos: [12, 0, -5], scale: [0.8, 0.6, 0.9], rotation: 1.2 },
    { pos: [-8, 0, 10], scale: [1, 0.7, 1.1], rotation: 2.1 },
    { pos: [5, 0, 15], scale: [0.9, 0.5, 0.8], rotation: 0.8 },
    { pos: [18, 0, -12], scale: [1.1, 0.9, 1.2], rotation: 1.5 },
  ], []);

  // Flores/Grama decorativa (posições fixas)
  const flowers = useMemo(() => [
    { pos: [-8, 0.1, 3], color: '#FF69B4' },
    { pos: [12, 0.1, -8], color: '#FFD700' },
    { pos: [-15, 0.1, 12], color: '#9370DB' },
    { pos: [6, 0.1, 8], color: '#00CED1' },
    { pos: [-3, 0.1, -15], color: '#FF69B4' },
    { pos: [18, 0.1, 10], color: '#FFD700' },
    { pos: [-18, 0.1, -5], color: '#9370DB' },
    { pos: [3, 0.1, -12], color: '#00CED1' },
    { pos: [-6, 0.1, 18], color: '#FF69B4' },
    { pos: [14, 0.1, 2], color: '#FFD700' },
    { pos: [-12, 0.1, -12], color: '#9370DB' },
    { pos: [8, 0.1, -3], color: '#00CED1' },
    { pos: [-2, 0.1, 6], color: '#FF69B4' },
    { pos: [16, 0.1, -15], color: '#FFD700' },
    { pos: [-14, 0.1, 4], color: '#9370DB' },
    { pos: [4, 0.1, 14], color: '#00CED1' },
    { pos: [-10, 0.1, -6], color: '#FF69B4' },
    { pos: [10, 0.1, 16], color: '#FFD700' },
    { pos: [-16, 0.1, 8], color: '#9370DB' },
    { pos: [2, 0.1, -8], color: '#00CED1' },
  ], []);

  return (
    <group>
      {/* Chão principal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#7CB342" />
      </mesh>

      {/* Caminho central mais escuro */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.01, 0]}>
        <planeGeometry args={[5, 40]} />
        <meshStandardMaterial color="#8D6E63" opacity={0.7} transparent />
      </mesh>

      {/* Árvores */}
      {trees.map((tree, i) => (
        <group key={`tree-${i}`} position={tree.pos}>
          {/* Tronco */}
          <mesh castShadow position={[0, tree.size * 0.5, 0]}>
            <cylinderGeometry args={[0.3 * tree.size, 0.4 * tree.size, tree.size, 8]} />
            <meshStandardMaterial color="#5D4037" />
          </mesh>
          {/* Copa da árvore */}
          <mesh castShadow position={[0, tree.size * 1.3, 0]}>
            <sphereGeometry args={[tree.size, 8, 8]} />
            <meshStandardMaterial color="#388E3C" />
          </mesh>
          <mesh castShadow position={[0, tree.size * 1.8, 0]}>
            <sphereGeometry args={[tree.size * 0.7, 8, 8]} />
            <meshStandardMaterial color="#43A047" />
          </mesh>
        </group>
      ))}

      {/* Rochas */}
      {rocks.map((rock, i) => (
        <mesh
          key={`rock-${i}`}
          castShadow
          position={rock.pos}
          rotation={[0, rock.rotation, 0]}
          scale={rock.scale}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#616161" roughness={0.9} />
        </mesh>
      ))}

      {/* Flores decorativas */}
      {flowers.map((flower, i) => (
        <group key={`flower-${i}`} position={flower.pos}>
          {/* Haste */}
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 4]} />
            <meshStandardMaterial color="#2E7D32" />
          </mesh>
          {/* Flor */}
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color={flower.color} emissive={flower.color} emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default Ground;
