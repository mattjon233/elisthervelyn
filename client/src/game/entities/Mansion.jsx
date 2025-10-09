import { useRef } from 'react';
import * as THREE from 'three';

/**
 * Mansion - Mansão de 2 andares no canto inferior esquerdo do mapa
 * Sala enorme com mesa de jantar e candelabro, escadas ao fundo
 */
function Mansion() {
  const mansionRef = useRef();

  // Posição da mansão no canto inferior esquerdo do mapa
  const mansionPosition = [-30, 0, 30];

  // Cores
  const wallColor = '#8B7355'; // Marrom claro (paredes externas)
  const roofColor = '#4A3428'; // Marrom escuro (telhado)
  const floorColor = '#5D4E37'; // Marrom médio (piso interno)
  const woodColor = '#3E2723'; // Madeira escura
  const goldColor = '#FFD700'; // Dourado (candelabro)
  const interiorWallColor = '#A0826D'; // Paredes internas

  return (
    <group ref={mansionRef} position={mansionPosition}>
      {/* ==================== PRIMEIRO ANDAR ==================== */}

      {/* PISO TÉRREO */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[16, 0.1, 14]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} />
      </mesh>

      {/* PAREDES EXTERNAS */}
      {/* Parede Frontal (com porta aberta) */}
      {/* Lado esquerdo da porta */}
      <mesh position={[-5, 2, -7]} castShadow receiveShadow>
        <boxGeometry args={[6, 4, 0.3]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* Lado direito da porta */}
      <mesh position={[5, 2, -7]} castShadow receiveShadow>
        <boxGeometry args={[6, 4, 0.3]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* Parte superior da porta */}
      <mesh position={[0, 3.5, -7]} castShadow receiveShadow>
        <boxGeometry args={[4, 1, 0.3]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Parede Traseira */}
      <mesh position={[0, 2, 7]} castShadow receiveShadow>
        <boxGeometry args={[16, 4, 0.3]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Parede Esquerda */}
      <mesh position={[-8, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 4, 14]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Parede Direita */}
      <mesh position={[8, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 4, 14]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* PORTAS ABERTAS (Moldura) */}
      {/* Porta esquerda */}
      <mesh position={[-1.8, 2, -7.2]} rotation={[0, Math.PI / 6, 0]} castShadow>
        <boxGeometry args={[1.8, 3.5, 0.1]} />
        <meshStandardMaterial color={woodColor} roughness={0.7} />
      </mesh>
      {/* Porta direita */}
      <mesh position={[1.8, 2, -7.2]} rotation={[0, -Math.PI / 6, 0]} castShadow>
        <boxGeometry args={[1.8, 3.5, 0.1]} />
        <meshStandardMaterial color={woodColor} roughness={0.7} />
      </mesh>
      {/* Maçanetas douradas */}
      <mesh position={[-1.2, 2, -7.3]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={goldColor} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.2, 2, -7.3]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={goldColor} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ==================== INTERIOR - SALA ENORME ==================== */}

      {/* PISO INTERNO DETALHADO */}
      <mesh position={[0, 0.11, 0]} receiveShadow>
        <boxGeometry args={[15.5, 0.05, 13.5]} />
        <meshStandardMaterial color="#6B5B47" roughness={0.6} />
      </mesh>

      {/* TAPETE SOB A MESA */}
      <mesh position={[0, 0.12, -1]} receiveShadow>
        <boxGeometry args={[10, 0.02, 6]} />
        <meshStandardMaterial color="#8B0000" roughness={0.9} />
      </mesh>

      {/* MESA DE JANTAR ENORME */}
      {/* Tampo da mesa */}
      <mesh position={[0, 1.2, -1]} castShadow receiveShadow>
        <boxGeometry args={[9, 0.2, 4]} />
        <meshStandardMaterial color={woodColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Pernas da mesa (4 cantos) */}
      <mesh position={[-4, 0.6, -2.5]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.2, 8]} />
        <meshStandardMaterial color={woodColor} roughness={0.7} />
      </mesh>
      <mesh position={[4, 0.6, -2.5]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.2, 8]} />
        <meshStandardMaterial color={woodColor} roughness={0.7} />
      </mesh>
      <mesh position={[-4, 0.6, 0.5]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.2, 8]} />
        <meshStandardMaterial color={woodColor} roughness={0.7} />
      </mesh>
      <mesh position={[4, 0.6, 0.5]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.2, 8]} />
        <meshStandardMaterial color={woodColor} roughness={0.7} />
      </mesh>

      {/* CADEIRAS AO REDOR DA MESA (8 cadeiras) */}
      {/* Lado esquerdo (3 cadeiras) - encosto virado para a mesa (rotação 0) */}
      {[-3, 0, 3].map((z, i) => (
        <group key={`left-${i}`} position={[-5.5, 0, -1 + z]} rotation={[0, 0, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.6, 1, 0.6]} />
            <meshStandardMaterial color={woodColor} roughness={0.7} />
          </mesh>
          <mesh position={[-0.3, 1, 0]} castShadow>
            <boxGeometry args={[0.1, 1.2, 0.6]} />
            <meshStandardMaterial color={woodColor} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Lado direito (3 cadeiras) - encosto virado para a mesa */}
      {[-3, 0, 3].map((z, i) => (
        <group key={`right-${i}`} position={[5.5, 0, -1 + z]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.6, 1, 0.6]} />
            <meshStandardMaterial color={woodColor} roughness={0.7} />
          </mesh>
          <mesh position={[-0.3, 1, 0]} castShadow>
            <boxGeometry args={[0.1, 1.2, 0.6]} />
            <meshStandardMaterial color={woodColor} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Cabeceira (1 cadeira) - encosto virado para a mesa */}
      <group position={[0, 0, -3.5]} rotation={[0, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.8, 1, 0.8]} />
          <meshStandardMaterial color={woodColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.2, 0.4]} castShadow>
          <boxGeometry args={[0.8, 1.6, 0.1]} />
          <meshStandardMaterial color={woodColor} roughness={0.7} />
        </mesh>
      </group>

      {/* Pé da mesa (1 cadeira) - encosto virado para a mesa */}
      <group position={[0, 0, 1.5]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.8, 1, 0.8]} />
          <meshStandardMaterial color={woodColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.2, 0.4]} castShadow>
          <boxGeometry args={[0.8, 1.6, 0.1]} />
          <meshStandardMaterial color={woodColor} roughness={0.7} />
        </mesh>
      </group>

      {/* ==================== CANDELABRO ACIMA DA MESA ==================== */}
      <group position={[0, 3.5, -1]}>
        {/* Corrente */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
          <meshStandardMaterial color={goldColor} metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Base do candelabro */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={goldColor} metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Braços do candelabro (6 braços em círculo) */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = Math.cos(angle) * 0.8;
          const z = Math.sin(angle) * 0.8;
          return (
            <group key={i} position={[x, -0.2, z]}>
              {/* Braço */}
              <mesh rotation={[0, angle, Math.PI / 6]}>
                <cylinderGeometry args={[0.04, 0.03, 0.6, 8]} />
                <meshStandardMaterial color={goldColor} metalness={0.9} roughness={0.1} />
              </mesh>
              {/* Vela */}
              <mesh position={[0, 0.2, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
                <meshStandardMaterial color="#FFF8DC" />
              </mesh>
              {/* Chama */}
              <mesh position={[0, 0.5, 0]}>
                <coneGeometry args={[0.08, 0.2, 6]} />
                <meshBasicMaterial color="#FFA500" />
              </mesh>
              {/* Luz da vela */}
              <pointLight position={[0, 0.5, 0]} color="#FFA500" intensity={0.5} distance={5} castShadow />
            </group>
          );
        })}

        {/* Vela central */}
        <mesh position={[0, -0.3, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
          <meshStandardMaterial color="#FFF8DC" />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <coneGeometry args={[0.1, 0.25, 6]} />
          <meshBasicMaterial color="#FFA500" />
        </mesh>
        <pointLight position={[0, 0.1, 0]} color="#FFA500" intensity={0.8} distance={8} castShadow />
      </group>

      {/* ==================== ESCADAS AO FUNDO ==================== */}
      <group position={[0, 0, 5]}>
        {/* Base das escadas */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[4, 0.1, 3]} />
          <meshStandardMaterial color={woodColor} roughness={0.7} />
        </mesh>

        {/* Degraus (10 degraus) */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <mesh key={i} position={[0, 0.15 + i * 0.3, -1.4 + i * 0.3]} castShadow receiveShadow>
            <boxGeometry args={[3.5, 0.15, 0.4]} />
            <meshStandardMaterial color={woodColor} roughness={0.7} />
          </mesh>
        ))}

        {/* Corrimões */}
        {/* Esquerdo */}
        <mesh position={[-1.75, 1.5, 0]} castShadow>
          <boxGeometry args={[0.1, 3, 0.1]} />
          <meshStandardMaterial color={woodColor} roughness={0.7} />
        </mesh>
        <mesh position={[-1.75, 1.5, 0]} rotation={[Math.PI / 6, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 3.5, 8]} />
          <meshStandardMaterial color={woodColor} roughness={0.7} />
        </mesh>

        {/* Direito */}
        <mesh position={[1.75, 1.5, 0]} castShadow>
          <boxGeometry args={[0.1, 3, 0.1]} />
          <meshStandardMaterial color={woodColor} roughness={0.7} />
        </mesh>
        <mesh position={[1.75, 1.5, 0]} rotation={[Math.PI / 6, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 3.5, 8]} />
          <meshStandardMaterial color={woodColor} roughness={0.7} />
        </mesh>
      </group>

      {/* ==================== SEGUNDO ANDAR ==================== */}

      {/* PISO DO SEGUNDO ANDAR */}
      <mesh position={[0, 4, 4]} receiveShadow>
        <boxGeometry args={[16, 0.2, 6]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} />
      </mesh>

      {/* PAREDES DO SEGUNDO ANDAR */}
      {/* Parede frontal do 2º andar */}
      <mesh position={[0, 6, 1]} castShadow receiveShadow>
        <boxGeometry args={[16, 4, 0.3]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Parede traseira do 2º andar */}
      <mesh position={[0, 6, 7]} castShadow receiveShadow>
        <boxGeometry args={[16, 4, 0.3]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Parede esquerda do 2º andar */}
      <mesh position={[-8, 6, 4]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 4, 6]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Parede direita do 2º andar */}
      <mesh position={[8, 6, 4]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 4, 6]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* JANELAS DO SEGUNDO ANDAR */}
      {/* Janela frontal esquerda */}
      <mesh position={[-4, 6, 0.9]} castShadow>
        <boxGeometry args={[1.5, 2, 0.1]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} />
      </mesh>
      {/* Janela frontal direita */}
      <mesh position={[4, 6, 0.9]} castShadow>
        <boxGeometry args={[1.5, 2, 0.1]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} />
      </mesh>

      {/* ==================== TELHADO ==================== */}

      {/* Telhado em formato de pirâmide inclinada */}
      <mesh position={[0, 8.5, 4]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[17, 0.3, 7]} />
        <meshStandardMaterial color={roofColor} roughness={0.9} />
      </mesh>

      {/* Inclinação frontal */}
      <mesh position={[0, 9.2, 2]} rotation={[-Math.PI / 6, 0, 0]} castShadow>
        <boxGeometry args={[17, 0.2, 3]} />
        <meshStandardMaterial color={roofColor} roughness={0.9} />
      </mesh>

      {/* Inclinação traseira */}
      <mesh position={[0, 9.2, 6]} rotation={[Math.PI / 6, 0, 0]} castShadow>
        <boxGeometry args={[17, 0.2, 3]} />
        <meshStandardMaterial color={roofColor} roughness={0.9} />
      </mesh>

      {/* Chaminé */}
      <mesh position={[-5, 10, 5]} castShadow>
        <boxGeometry args={[0.8, 2, 0.8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>

      {/* ==================== DECORAÇÃO EXTERNA ==================== */}

      {/* Plantas ao lado da entrada */}
      <mesh position={[-4, 0.3, -7.5]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.6, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      <mesh position={[-4, 0.8, -7.5]} castShadow>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="#228B22" roughness={0.9} />
      </mesh>

      <mesh position={[4, 0.3, -7.5]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.6, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      <mesh position={[4, 0.8, -7.5]} castShadow>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="#228B22" roughness={0.9} />
      </mesh>

      {/* Luminárias na entrada */}
      <group position={[-2.5, 3, -7.3]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshStandardMaterial color="#2C1810" />
        </mesh>
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.3, 0.4, 0.3]} />
          <meshStandardMaterial color="#FFA500" emissive="#FFA500" emissiveIntensity={0.5} />
        </mesh>
        <pointLight position={[0, -0.3, 0]} color="#FFA500" intensity={0.5} distance={6} />
      </group>

      <group position={[2.5, 3, -7.3]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshStandardMaterial color="#2C1810" />
        </mesh>
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.3, 0.4, 0.3]} />
          <meshStandardMaterial color="#FFA500" emissive="#FFA500" emissiveIntensity={0.5} />
        </mesh>
        <pointLight position={[0, -0.3, 0]} color="#FFA500" intensity={0.5} distance={6} />
      </group>

      {/* Luz ambiente da mansão */}
      <pointLight position={[0, 5, 0]} color="#FFE4B5" intensity={0.3} distance={20} />
    </group>
  );
}

export default Mansion;
