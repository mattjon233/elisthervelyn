import { Text } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Balão de fala 3D para diálogos
 * Aparece acima do personagem/NPC
 * Sempre fica de frente para a câmera (billboard)
 */
function SpeechBubble({ text, position = [0, 3.5, 0] }) {
  const bubbleRef = useRef();

  if (!text) return null;

  // Configurações do balão
  const maxCharsPerLine = 45; // Máximo de caracteres por linha
  const maxWidth = 6; // Largura máxima do balão
  const lineHeight = 0.25; // Altura de cada linha

  // Calcular altura baseada no comprimento do texto
  const estimatedLines = Math.ceil(text.length / maxCharsPerLine);
  const bubbleHeight = Math.max(0.8, estimatedLines * lineHeight + 0.4);

  // Efeito billboard - sempre olhar para a câmera
  useFrame(({ camera }) => {
    if (bubbleRef.current) {
      bubbleRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={bubbleRef} position={position}>
      {/* Fundo do balão */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[maxWidth, bubbleHeight]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Borda do balão */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[maxWidth + 0.1, bubbleHeight + 0.1]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pontinha do balão (triangulo) */}
      <mesh position={[0, -bubbleHeight / 2 - 0.15, 0.02]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.15, 0.3, 3]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      {/* Texto com múltiplas linhas */}
      <Text
        position={[0, 0, 0.03]}
        fontSize={0.16}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        maxWidth={maxWidth - 0.4}
        lineHeight={1.3}
        textAlign="center"
      >
        {text}
      </Text>
    </group>
  );
}

export default SpeechBubble;
