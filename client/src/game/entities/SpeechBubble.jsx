import { Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Balão de fala 3D para diálogos
 * Aparece acima do personagem/NPC
 */
function SpeechBubble({ text, position = [0, 3.5, 0] }) {
  if (!text) return null;

  // Limitar texto a 50 caracteres
  const displayText = text.length > 50 ? text.substring(0, 47) + '...' : text;

  return (
    <group position={position}>
      {/* Fundo do balão */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[displayText.length * 0.12 + 0.5, 0.6]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Borda do balão */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[displayText.length * 0.12 + 0.6, 0.7]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pontinha do balão (triangulo) */}
      <mesh position={[0, -0.5, 0.02]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.15, 0.3, 3]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      {/* Texto */}
      <Text
        position={[0, 0, 0.03]}
        fontSize={0.18}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        maxWidth={displayText.length * 0.12 + 0.3}
      >
        {displayText}
      </Text>
    </group>
  );
}

export default SpeechBubble;
