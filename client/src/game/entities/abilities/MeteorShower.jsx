import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import soundService from '../../../services/soundService';

function MeteorShower({ ability, targetPosition, onImpact }) {
  const [phase, setPhase] = useState('targeting');

  useEffect(() => {
    const targetingTimer = setTimeout(() => {
      setPhase('falling');
    }, ability.delay);

    const impactTimer = setTimeout(() => {
      setPhase('impact');
      soundService.playMeteorImpactSound(); // Som de impacto
      if (onImpact) {
        // Notifica a GameScene para aplicar o dano
        onImpact(ability, targetPosition);
      }
    }, ability.delay + 500); // 500ms de queda

    const cleanupTimer = setTimeout(() => {
      setPhase('done');
    }, ability.duration);

    return () => {
      clearTimeout(targetingTimer);
      clearTimeout(impactTimer);
      clearTimeout(cleanupTimer);
    };
  }, [ability, targetPosition, onImpact]);

  if (phase === 'done') return null;

  return (
    <group>
      {/* Fase 1: Área de alvo (círculo vermelho piscante) */}
      {phase === 'targeting' && (
        <>
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ability.areaRadius - 0.2, ability.areaRadius, 32]} />
            <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={1.5} />
          </mesh>
          {/* Círculo interno para mostrar área de dano */}
          <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[ability.areaRadius - 0.2, 32]} />
            <meshStandardMaterial color="#FF4500" transparent opacity={0.3} />
          </mesh>
          {/* Luz vermelha de alerta */}
          <pointLight color="#FF0000" intensity={2} distance={ability.areaRadius * 2} />
        </>
      )}

      {/* Fase 2: Meteoros caindo */}
      {phase === 'falling' && (
        <>
          {[...Array(12)].map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * ability.areaRadius * 2, 10 - i * 0.5, (Math.random() - 0.5) * ability.areaRadius * 2]}>
              <dodecahedronGeometry args={[0.4]} />
              <meshStandardMaterial color="#FF4500" emissive="#FF0000" emissiveIntensity={1.2} />
            </mesh>
          ))}
          {/* Círculo de alerta permanece */}
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ability.areaRadius - 0.2, ability.areaRadius, 32]} />
            <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={1} />
          </mesh>
        </>
      )}

      {/* Fase 3: Impacto (explosão) */}
      {phase === 'impact' && (
        <>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[ability.areaRadius, 32, 32]} />
            <meshStandardMaterial color="#FF4500" emissive="#FF0000" emissiveIntensity={1.5} transparent opacity={0.6} />
          </mesh>
          {/* Anel de choque */}
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ability.areaRadius * 0.8, ability.areaRadius * 1.2, 32]} />
            <meshStandardMaterial color="#FF6347" emissive="#FF0000" emissiveIntensity={2} transparent opacity={0.8} />
          </mesh>
          {/* Luz intensa da explosão */}
          <pointLight color="#FF4500" intensity={5} distance={ability.areaRadius * 3} />
        </>
      )}
    </group>
  );
}

export default MeteorShower;