import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Box } from '@react-three/drei';

const PlayerLite = ({ player }) => {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current && player.position) {
      meshRef.current.position.lerp(new THREE.Vector3(player.position.x, player.position.y, player.position.z), 0.1);
    }
  });

  return (
    <Box ref={meshRef} args={[1, 2, 1]} position={[player.position?.x || 0, player.position?.y || 0.5, player.position?.z || 0]}>
      <meshStandardMaterial color={player.character?.color || '#cccccc'} />
    </Box>
  );
};

export default PlayerLite;
