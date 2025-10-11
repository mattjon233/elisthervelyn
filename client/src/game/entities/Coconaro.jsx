import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Html } from '@react-three/drei';

function HealthBar({ health, maxHealth }) {
  const percentage = (health / maxHealth) * 100;
  return (
    <div style={{
      width: '200px',
      height: '20px',
      backgroundColor: '#333',
      border: '1px solid #fff',
      borderRadius: '5px'
    }}>
      <div style={{
        width: `${percentage}%`,
        height: '100%',
        backgroundColor: '#e74c3c',
        borderRadius: '5px'
      }} />
      <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: 0, color: 'white' }}>
        {health} / {maxHealth}
      </div>
    </div>
  );
}

function Coconaro({ id, position, health, maxHealth }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      // Animação de idle
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      groupRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Health Bar */}
      <Html position={[0, 4.5, 0]} center>
        <HealthBar health={health} maxHealth={maxHealth} />
      </Html>

      {/* Corpo Principal (Verde) */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color="#27ae60" roughness={0.6} />
      </mesh>

      {/* Bandeira do Brasil (Amarelo e Azul) */}
      <mesh position={[0, 1.5, -1.51]}>
        <planeGeometry args={[2, 1.2]} />
        <meshStandardMaterial color="#f1c40f" />
      </mesh>
      <mesh position={[0, 1.5, -1.52]}>
        <circleGeometry args={[0.4, 32]} />
        <meshStandardMaterial color="#2980b9" />
      </mesh>

      {/* Olhos */}
      <mesh position={[-0.5, 2, -1.3]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#e74c3c" emissive="#c0392b" />
      </mesh>
      <mesh position={[0.5, 2, -1.3]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#e74c3c" emissive="#c0392b" />
      </mesh>

      {/* Pernas */}
      <mesh castShadow position={[-0.7, 0.5, 0]}>
        <boxGeometry args={[0.5, 1, 0.5]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh castShadow position={[0.7, 0.5, 0]}>
        <boxGeometry args={[0.5, 1, 0.5]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  );
}

export default Coconaro;
