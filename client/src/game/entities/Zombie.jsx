import { useRef } from 'react';
import { Capsule, Sphere } from '@react-three/drei';
import HealthBar from './HealthBar';

const Zombie = ({ position, health, maxHealth }) => {
  const ref = useRef();

  return (
    <group ref={ref} position={position}>
      <HealthBar health={health} maxHealth={maxHealth} />
      {/* Head */}
      <Sphere args={[0.4, 16, 16]} position={[0, 1.4, 0]}>
        <meshStandardMaterial color="#99cc99" />
      </Sphere>
      {/* Eyes */}
      <Sphere args={[0.05, 8, 8]} position={[-0.15, 1.5, 0.35]}>
        <meshBasicMaterial color="black" />
      </Sphere>
      <Sphere args={[0.05, 8, 8]} position={[0.15, 1.5, 0.35]}>
        <meshBasicMaterial color="black" />
      </Sphere>
      {/* Torso */}
      <Capsule args={[0.5, 1.0, 16, 32]} position={[0, 0.25, 0]}>
        <meshStandardMaterial color="#99cc99" />
      </Capsule>
      {/* Arms */}
      <Capsule args={[0.2, 0.8, 8, 16]} position={[-0.7, 0.5, 0]}>
        <meshStandardMaterial color="#99cc99" />
      </Capsule>
      <Capsule args={[0.2, 0.8, 8, 16]} position={[0.7, 0.5, 0]}>
        <meshStandardMaterial color="#99cc99" />
      </Capsule>
      {/* Legs */}
      <Capsule args={[0.25, 0.8, 8, 16]} position={[-0.25, -1, 0]}>
        <meshStandardMaterial color="#99cc99" />
      </Capsule>
      <Capsule args={[0.25, 0.8, 8, 16]} position={[0.25, -1, 0]}>
        <meshStandardMaterial color="#99cc99" />
      </Capsule>
    </group>
  );
};

export default Zombie;
