import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../../store/missionStore';
import { useShopStore } from '../../store/shopStore';
import socketService from '../../services/socket';
import SpeechBubble from './SpeechBubble';
import { tiaRosePosition } from '../data/npcPositions';

/**
 * TiaRose - NPC que vende poções
 * Jogadores podem interagir pressionando E quando próximos
 */
function TiaRose({ playerPosition = [0, 0, 0] }) {
  const meshRef = useRef();
  const ringRef = useRef();
  const [isPlayerNearby, setIsPlayerNearby] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [hasVisited, setHasVisited] = useState(false);
  const interactionDistance = 3;

  const { teamGold } = useMissionStore();
  const { potion, hasReceivedFreePotion, buyPotion } = useShopStore();

  useFrame((state) => {
    // Animar anel de interação
    if (ringRef.current && isPlayerNearby) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }

    // Verificar proximidade do jogador
    const npcPos = new THREE.Vector3(tiaRosePosition.x, 0, tiaRosePosition.z);
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
  }, [isPlayerNearby, potion, teamGold, hasReceivedFreePotion]);

  // Listener para resposta da compra
  useEffect(() => {
    const handleBuyResult = (data) => {
      if (data.success) {
        setSpeechText(data.message);

        // Atualizar a store local
        if (data.isFirstPotion) {
          useShopStore.setState({
            potion: { id: 'health_potion', name: 'Poção de Vida', effect: { type: 'heal', amount: 25 } },
            hasReceivedFreePotion: true
          });
        } else {
          useShopStore.setState({
            potion: { id: 'health_potion', name: 'Poção de Vida', effect: { type: 'heal', amount: 25 } }
          });
        }
      } else {
        setSpeechText(data.message);
      }

      setTimeout(() => setSpeechText(''), 4000);
    };

    socketService.on('potion_buy_result', handleBuyResult);
    return () => socketService.off('potion_buy_result', handleBuyResult);
  }, []);

  const handleInteraction = () => {
    // Se o jogador já tem uma poção, não faz nada
    if (potion) {
      setSpeechText('Você já tem uma poção! Use-a antes de comprar outra.');
      setTimeout(() => setSpeechText(''), 4000);
      return;
    }

    // Na primeira visita, dá a poção de cortesia imediatamente
    if (!hasReceivedFreePotion) {
      setSpeechText('Olá, minhas queridas guerreiras! A primeira poção é cortesia da casa!');
      socketService.emit('buy_potion', { potionId: 'health_potion' });
    } else {
      // Lógica para comprar poção com ouro
      setSpeechText('Precisa de mais uma poção, querida?');
      socketService.emit('buy_potion', { potionId: 'health_potion' });
    }
  };

  // Atualizar balão de fala quando jogador se aproxima
  useEffect(() => {
    if (isPlayerNearby && !speechText) {
      if (!hasVisited) {
        setSpeechText('Olá, queridas! Venham conhecer minha loja de poções!');
      } else if (potion) {
        setSpeechText('Você já tem uma poção! Use-a antes de comprar outra.');
      } else {
        setSpeechText('Olá de novo, querida! Precisa de uma poção?');
      }
    } else if (!isPlayerNearby && speechText && !hasReceivedFreePotion) {
      setSpeechText('');
    }
  }, [isPlayerNearby, potion, hasReceivedFreePotion, hasVisited]);

  // Determinar texto de interação
  let interactionText = '';
  if (potion) {
    interactionText = 'Você já tem uma poção';
  } else if (!hasReceivedFreePotion) {
    interactionText = 'Pressione E - Poção Grátis!';
  } else {
    interactionText = `Pressione E - Comprar Poção (50 ouro)`;
  }

  return (
    <group position={[tiaRosePosition.x, tiaRosePosition.y, tiaRosePosition.z]}>
      {/* Corpo - vestido longo */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 2.0, 8]} />
        <meshStandardMaterial color="#8B4789" roughness={0.8} />
      </mesh>

      {/* Avental branco */}
      <mesh position={[0, 1.0, 0.35]} castShadow>
        <boxGeometry args={[0.8, 1.6, 0.05]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.9} />
      </mesh>

      {/* Cabeça */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#F5D5C3" roughness={0.8} />
      </mesh>

      {/* Cabelo grisalho - coque */}
      <mesh position={[0, 2.5, -0.15]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#D3D3D3" roughness={0.9} />
      </mesh>

      {/* Franja */}
      <mesh position={[0, 2.35, 0.25]} castShadow>
        <boxGeometry args={[0.5, 0.1, 0.08]} />
        <meshStandardMaterial color="#D3D3D3" roughness={0.9} />
      </mesh>

      {/* Olhos */}
      <mesh position={[-0.1, 2.32, 0.27]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#4A3520" />
      </mesh>
      <mesh position={[0.1, 2.32, 0.27]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#4A3520" />
      </mesh>

      {/* Óculos */}
      <mesh position={[0, 2.32, 0.28]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.12, 0.02, 8, 16]} />
        <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Nariz */}
      <mesh position={[0, 2.25, 0.29]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#F5C5B3" roughness={0.8} />
      </mesh>

      {/* Sorriso */}
      <mesh position={[0, 2.18, 0.28]}>
        <boxGeometry args={[0.12, 0.02, 0.02]} />
        <meshBasicMaterial color="#C47B7B" />
      </mesh>

      {/* Braços */}
      <mesh position={[-0.45, 1.3, 0]} rotation={[0, 0, -0.3]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 8, 16]} />
        <meshStandardMaterial color="#8B4789" />
      </mesh>
      <mesh position={[0.45, 1.3, 0]} rotation={[0, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 8, 16]} />
        <meshStandardMaterial color="#8B4789" />
      </mesh>

      {/* Mãos */}
      <mesh position={[-0.65, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#F5D5C3" />
      </mesh>
      <mesh position={[0.65, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#F5D5C3" />
      </mesh>

      {/* Poção na mão esquerda */}
      <group position={[-0.65, 1.1, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.18, 8]} />
          <meshStandardMaterial color="#FF1493" transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, 0.12, 0]} castShadow>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Brilho da poção */}
        <pointLight position={[0, 0, 0]} color="#FF1493" intensity={0.3} distance={2} />
      </group>

      {/* Mesa com poções */}
      <group position={[1.2, 0, 0]}>
        {/* Tampo da mesa */}
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.1, 0.8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>

        {/* Pernas da mesa */}
        <mesh position={[-0.5, 0.4, -0.3]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
        <mesh position={[0.5, 0.4, -0.3]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
        <mesh position={[-0.5, 0.4, 0.3]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
        <mesh position={[0.5, 0.4, 0.3]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
          <meshStandardMaterial color="#654321" />
        </mesh>

        {/* Poções na mesa */}
        <mesh position={[-0.3, 0.95, 0.1]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 0.15, 8]} />
          <meshStandardMaterial color="#FF1493" transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, 0.95, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 0.15, 8]} />
          <meshStandardMaterial color="#FF69B4" transparent opacity={0.7} />
        </mesh>
        <mesh position={[0.3, 0.95, -0.1]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 0.15, 8]} />
          <meshStandardMaterial color="#FF1493" transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Balão de fala */}
      {speechText && <SpeechBubble text={speechText} position={[0, 3.2, 0]} />}

      {/* Zona de interação no chão */}
      {isPlayerNearby && (
        <>
          <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.5, 3, 32]} />
            <meshBasicMaterial
              color="#FF1493"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Texto de interação */}
          <Text
            position={[0, 2.8, 0]}
            fontSize={0.25}
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
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.2, 0.1, 8]} />
        <meshStandardMaterial color="#A0826D" roughness={0.7} />
      </mesh>

      {/* Luz ambiente suave rosada */}
      <pointLight position={[0, 2, 0]} color="#FFB6D9" intensity={0.4} distance={8} />
    </group>
  );
}

export default TiaRose;
