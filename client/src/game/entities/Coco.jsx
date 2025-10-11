import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import socketService from '../../services/socket';

function Coco({ id, position }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    // Animação de flutuação
    if (meshRef.current) {
      meshRef.current.position.y = 0.5 + Math.sin(clock.elapsedTime * 2 + position[0]) * 0.15;
    }
  });

  const handleCollect = () => {
    console.log(`CLIENT: Coletando coco ${id}`);
    // Adiciona um efeito visual rápido (opcional)
    if (meshRef.current) {
      meshRef.current.scale.set(1.5, 1.5, 1.5);
      setTimeout(() => {
        // O coco será removido pelo estado do GameScene, mas escondemos ele
        if(meshRef.current) meshRef.current.visible = false;
      }, 100);
    }
    // Envia o evento para o servidor
    socketService.emit('collect_coconut', { coconutId: id });
  };

  return (
    <group position={position}>
        {/* Formato de coco (cone achatado e marrom escuro) */}
        <mesh ref={meshRef} onPointerDown={handleCollect} castShadow rotation={[0, 0, 0]}>
            <coneGeometry args={[0.3, 0.5, 8]} />
            <meshStandardMaterial color="#4A3020" roughness={0.8} />
        </mesh>
    </group>
  );
}

export default Coco;
