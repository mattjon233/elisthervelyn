import { useRef } from 'react';
import { Capsule } from '@react-three/drei';
import HealthBar from './HealthBar';

const Slime = ({ position, health, maxHealth }) => {
  const ref = useRef();

  return (
    <group ref={ref} position={position}>
      <HealthBar health={health} maxHealth={maxHealth} />
      <Capsule args={[0.5, 0.5, 16, 32]}>
        <meshStandardMaterial color="#76ff7a" transparent opacity={0.9} />
      </Capsule>
    </group>
  );
};

export default Slime;
