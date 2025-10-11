import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../../store/missionStore';
import { useGameStore } from '../../store/gameStore';
import socketService from '../../services/socket';
import SpeechBubble from './SpeechBubble';
import { oraclePosition } from '../data/npcPositions';

/**
 * Oracle - NPC que dá missões
 * Jogadores podem interagir pressionando E quando próximos
 */
function Oracle({ playerPosition = [0, 0, 0], preciousStoneActive = false }) {
  const meshRef = useRef();
  const ringRef = useRef();
  const [isPlayerNearby, setIsPlayerNearby] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const interactionDistance = 3; // Distância para interagir

  const { activeMission, missionReadyToComplete } = useMissionStore();
  const setShowMissionChoice = useGameStore((state) => state.setShowMissionChoice);

  useFrame((state) => {
    // Animar anel de interação
    if (ringRef.current && isPlayerNearby) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }

    // Verificar proximidade do jogador
    const oraclePos = new THREE.Vector3(oraclePosition.x, 0, oraclePosition.z);
    const playerPos = new THREE.Vector3(playerPosition[0], 0, playerPosition[2]);
    const distance = oraclePos.distanceTo(playerPos);

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

  // Novo listener para o evento de escolha de missão
  useEffect(() => {
    const handleShowChoice = (data) => {
      console.log('CLIENT: Recebido evento show_mission_choice', data);
      setShowMissionChoice(true, data);
    };

    socketService.on('show_mission_choice', handleShowChoice);
    return () => socketService.off('show_mission_choice', handleShowChoice);
  }, [setShowMissionChoice]);

  const handleInteraction = () => {
    // A lógica agora é centralizada no servidor
    socketService.emit('interact_with_oracle');
    // Opcional: mostrar um feedback visual imediato
    setSpeechText('O Oráculo pondera sobre seu destino...');
    setTimeout(() => setSpeechText(''), 2000);
  };

  // Atualizar balão de fala quando jogador se aproxima
  useEffect(() => {
    if (isPlayerNearby && !speechText) {
      if (activeMission?.target === 'precious_stone' && preciousStoneActive) {
        setSpeechText('A pedra preciosa está em algum lugar do mapa...');
      } else if (!activeMission) {
        setSpeechText('Olá, jovens! Preciso de sua ajuda...');
      } else if (missionReadyToComplete) {
        setSpeechText('Retornaram vitoriosas! Venham receber a recompensa.');
      }
    } else if (!isPlayerNearby && speechText && !activeMission) {
      setSpeechText('');
    }
  }, [isPlayerNearby, activeMission, missionReadyToComplete, preciousStoneActive]);

  // Determinar texto de interação
  let interactionText = '';
  if (activeMission?.target === 'precious_stone' && preciousStoneActive) {
    interactionText = 'Procurem a Pedra Preciosa!';
  } else if (!activeMission) {
    interactionText = 'Pressione E - Nova Missão';
  } else if (missionReadyToComplete) {
    interactionText = 'Pressione E - Coletar Recompensa';
  } else {
    interactionText = 'Missão em Progresso';
  }

  return (
    <group position={[oraclePosition.x, oraclePosition.y, oraclePosition.z]}>
      {/* Corpo (túnica longa) */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.8, 2.4, 8]} />
        <meshStandardMaterial color="#4A3B2A" roughness={0.9} />
      </mesh>

      {/* Cabeça */}
      <mesh position={[0, 2.7, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#F5D5C3" roughness={0.8} />
      </mesh>

      {/* Barba longa branca */}
      <mesh position={[0, 2.3, 0.25]} castShadow>
        <coneGeometry args={[0.3, 0.8, 8]} />
        <meshStandardMaterial color="#E8E8E8" roughness={1} />
      </mesh>

      {/* Cabelo/capuz */}
      <mesh position={[0, 2.95, 0]} castShadow>
        <sphereGeometry args={[0.38, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#6B5B47" roughness={0.9} />
      </mesh>

      {/* Olhos */}
      <mesh position={[-0.12, 2.75, 0.3]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#2C1810" />
      </mesh>
      <mesh position={[0.12, 2.75, 0.3]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#2C1810" />
      </mesh>

      {/* Cajado/Bastão */}
      <mesh position={[0.6, 1.5, 0]} rotation={[0, 0, -0.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 3.5, 8]} />
        <meshStandardMaterial color="#5D4E37" roughness={0.8} />
      </mesh>

      {/* Cristal no topo do cajado */}
      <mesh position={[0.75, 3.2, 0]} castShadow>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color="#87CEEB"
          emissive="#87CEEB"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Luz do cristal */}
      <pointLight position={[0.75, 3.2, 0]} color="#87CEEB" intensity={0.5} distance={5} />

      {/* Balão de fala */}
      {speechText && <SpeechBubble text={speechText} position={[0, 4, 0]} />}

      {/* Zona de interação no chão */}
      {isPlayerNearby && (
        <>
          <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.5, 3, 32]} />
            <meshBasicMaterial
              color="#87CEEB"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Texto de interação */}
          <Text
            position={[0, 3.5, 0]}
            fontSize={0.3}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {interactionText}
          </Text>
        </>
      )}

      {/* Base/Pedestal */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.2, 8]} />
        <meshStandardMaterial color="#8B7355" roughness={0.7} />
      </mesh>

      {/* Luz ambiente suave ao redor */}
      <pointLight position={[0, 2, 0]} color="#FFF8DC" intensity={0.3} distance={8} />
    </group>
  );
}

export default Oracle;
