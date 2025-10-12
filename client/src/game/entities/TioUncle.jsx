import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useShopStore } from '../../store/shopStore';
import SpeechBubble from './SpeechBubble';

/**
 * Tio Uncle - NPC que vende melhorias
 */
function TioUncle({ position, playerPosition = [0, 0, 0] }) {
  const meshRef = useRef();
  const ringRef = useRef();
  const [isPlayerNearby, setIsPlayerNearby] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const openShop = useShopStore((state) => state.openShop);
  const interactionDistance = 3;

  // Animação sutil de idle
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = 0.5 + Math.sin(clock.elapsedTime * 1.5) * 0.05;
    }

    // Animar anel de interação
    if (ringRef.current && isPlayerNearby) {
      ringRef.current.rotation.z = clock.elapsedTime * 0.5;
    }

    // Verificar proximidade do jogador
    const npcPos = new THREE.Vector3(position[0], 0, position[2]);
    const playerPos = new THREE.Vector3(playerPosition[0], 0, playerPosition[2]);
    const distance = npcPos.distanceTo(playerPos);

    setIsPlayerNearby(distance <= interactionDistance);
  });

  // Listener para tecla E
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key.toLowerCase() === 'e' && isPlayerNearby) {
        handleInteraction();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlayerNearby]);

  const handleInteraction = () => {
    setSpeechText('Olá! Dá uma olhada nas melhorias que tenho para o Rocket!');
    openShop();
    setTimeout(() => setSpeechText(''), 4000);
  };

  // Atualizar balão de fala quando jogador se aproxima
  useEffect(() => {
    if (isPlayerNearby && !speechText) {
      setSpeechText('Ei, garotas! Pressione E para ver minhas melhorias!');
    } else if (!isPlayerNearby && speechText) {
      setSpeechText('');
    }
  }, [isPlayerNearby]);

  return (
    <group ref={meshRef} position={position}>
      {/* Corpo - Roupas despojadas (marrom) */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.5, 0.8, 0.3]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Cabeça */}
      <mesh castShadow position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="#FFDAB9" />
      </mesh>

      {/* Cabelo comprido e barba */}
      <mesh castShadow position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.25, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#A9A9A9" />
      </mesh>
      <mesh castShadow position={[0, 0.85, -0.1]}>
        <boxGeometry args={[0.3, 0.15, 0.1]} />
        <meshStandardMaterial color="#A9A9A9" />
      </mesh>

      {/* Olhos */}
      <mesh position={[-0.07, 0.98, -0.18]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.07, 0.98, -0.18]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Pernas */}
      <mesh castShadow position={[-0.1, -0.2, 0]}>
        <boxGeometry args={[0.15, 0.8, 0.2]} />
        <meshStandardMaterial color="#2F4F4F" />
      </mesh>
      <mesh castShadow position={[0.1, -0.2, 0]}>
        <boxGeometry args={[0.15, 0.8, 0.2]} />
        <meshStandardMaterial color="#2F4F4F" />
      </mesh>

      {/* Balão de fala */}
      {speechText && <SpeechBubble text={speechText} position={[0, 2.0, 0]} />}

      {/* Zona de interação no chão */}
      {isPlayerNearby && (
        <>
          <mesh ref={ringRef} position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.5, 3, 32]} />
            <meshBasicMaterial
              color="#8B4513"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Texto de interação */}
          <Text
            position={[0, 1.5, 0]}
            fontSize={0.25}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            Pressione E - Loja de Melhorias
          </Text>
        </>
      )}

      {/* Base/Pedestal */}
      <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.2, 0.1, 8]} />
        <meshStandardMaterial color="#A0826D" roughness={0.7} />
      </mesh>

      {/* Luz ambiente suave dourada */}
      <pointLight position={[0, 1.5, 0]} color="#FFD700" intensity={0.4} distance={8} />
    </group>
  );
}

export default TioUncle;
