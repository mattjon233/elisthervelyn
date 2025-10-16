import { useRef } from 'react';
import { Sphere } from '@react-three/drei';
import HealthBar from './HealthBar';

const Ghost = ({ position, health, maxHealth }) => {
  const ref = useRef();

  return (
    <group ref={ref} position={position}>
      <HealthBar health={health} maxHealth={maxHealth} />
      <Sphere args={[0.8, 32, 32]}>
        <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
      </Sphere>
    </group>
  );
};

export default Ghost;
