import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SpeechBubble from './SpeechBubble';

/**
 * Componente para NPCs amigáveis que povoam o mapa.
 * Eles oferecem dicas e saudações quando o jogador se aproxima.
 */
function FriendlyNPC({ npcData, playerPosition }) {
  const meshRef = useRef();
  const [isPlayerNearby, setIsPlayerNearby] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const interactionDistance = 4;
  const speechTimer = useRef();

  const { position, model, dialogue } = npcData;

  // Animação sutil de idle
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = (model === 'child' ? 0.3 : 0.5) + Math.sin(clock.elapsedTime * 1.2 + position.x) * 0.05;
    }

    // Verificar proximidade do jogador
    const npcPos = new THREE.Vector3(position.x, 0, position.z);
    const playerPos = new THREE.Vector3(playerPosition[0], 0, playerPosition[2]);
    const distance = npcPos.distanceTo(playerPos);

    setIsPlayerNearby(distance <= interactionDistance);
  });

  // Lógica do balão de fala
  useEffect(() => {
    if (isPlayerNearby) {
      // Se o jogador está perto e não há texto, mostra uma dica aleatória
      if (!speechText) {
        const randomIndex = Math.floor(Math.random() * dialogue.length);
        const randomDialogue = dialogue[randomIndex];
        setSpeechText(randomDialogue);

        // Limpa o texto após alguns segundos
        speechTimer.current = setTimeout(() => {
          setSpeechText('');
        }, 5000);
      }
    } else {
      // Se o jogador se afasta, limpa o texto e o timer
      if (speechText) {
        setSpeechText('');
        clearTimeout(speechTimer.current);
      }
    }

    // Limpeza ao desmontar
    return () => clearTimeout(speechTimer.current);
  }, [isPlayerNearby, dialogue, speechText]);

  const VillagerModel = ({ color }) => (
    <>
        <mesh castShadow position={[0, 0.4, 0]}><boxGeometry args={[0.5, 0.8, 0.3]} /><meshStandardMaterial color={color} /></mesh>
        <mesh castShadow position={[0, 0.95, 0]}><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#F5D5C3" /></mesh>
    </>
  );

  const ChildModel = () => (
    <>
        <mesh castShadow position={[0, 0.3, 0]}><boxGeometry args={[0.4, 0.6, 0.25]} /><meshStandardMaterial color="#3498db" /></mesh>
        <mesh castShadow position={[0, 0.7, 0]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color="#F5D5C3" /></mesh>
    </>
  );

  const BabaYagaModel = () => (
    <>
        {/* Corpo cabeludo e diferentão */}
        <mesh castShadow position={[0, 0.5, 0]}><boxGeometry args={[0.6, 1, 0.4]} /><meshStandardMaterial color="#8B4513" /></mesh>
        {/* Cabeça */}
        <mesh castShadow position={[0, 1.2, 0]}><sphereGeometry args={[0.25, 16, 16]} /><meshStandardMaterial color="#F5D5C3" /></mesh>
        {/* Cabelo cabeludo - múltiplas esferas para dar efeito de cabelo bagunçado */}
        <mesh castShadow position={[0, 1.35, 0]}><sphereGeometry args={[0.28, 8, 8]} /><meshStandardMaterial color="#2C1810" roughness={1} /></mesh>
        <mesh castShadow position={[-0.15, 1.4, 0]}><sphereGeometry args={[0.15, 8, 8]} /><meshStandardMaterial color="#2C1810" roughness={1} /></mesh>
        <mesh castShadow position={[0.15, 1.4, 0]}><sphereGeometry args={[0.15, 8, 8]} /><meshStandardMaterial color="#2C1810" roughness={1} /></mesh>
        <mesh castShadow position={[0, 1.45, 0.15]}><sphereGeometry args={[0.12, 8, 8]} /><meshStandardMaterial color="#2C1810" roughness={1} /></mesh>
        {/* Barba pequena */}
        <mesh castShadow position={[0, 1.05, 0.2]}><coneGeometry args={[0.1, 0.25, 6]} /><meshStandardMaterial color="#4A3020" roughness={1} /></mesh>
    </>
  );

  return (
    <group ref={meshRef} position={[position.x, 0, position.z]}>
        {model === 'child' && <ChildModel />}
        {model === 'villager_male' && <VillagerModel color="#2c3e50" />}
        {model === 'villager_female' && <VillagerModel color="#8e44ad" />}
        {model === 'baba_yaga' && <BabaYagaModel />}

        {speechText && <SpeechBubble text={speechText} position={[0, model === 'child' ? 1.2 : (model === 'baba_yaga' ? 1.8 : 1.5), 0]} />}
    </group>
  );
}

export default FriendlyNPC;
