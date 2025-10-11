import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// Componente otimizado para o coco, sem lógica de clique.
// A coleta agora é gerenciada pelo GameScene por proximidade.
function Coco({ id, position }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    // Animação de flutuação suave
    if (meshRef.current) {
      // Usamos o ID para variar a animação de cada coco
      const animationOffset = parseInt(id.split('_')[1]) || 0;
      meshRef.current.position.y = 0.5 + Math.sin(clock.elapsedTime * 2 + animationOffset) * 0.15;
    }
  });

  return (
    <group position={position}>
        {/* Formato de coco (cone achatado e marrom escuro) */}
        <mesh ref={meshRef} castShadow rotation={[0, 0, 0]}>
            <coneGeometry args={[0.3, 0.5, 8]} />
            <meshStandardMaterial color="#4A3020" roughness={0.8} />
        </mesh>
    </group>
  );
}

export default Coco;