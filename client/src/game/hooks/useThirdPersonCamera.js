import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Câmera third-person com rotação manual
 * Fica sempre atrás e acima do jogador, mas pode ser rotacionada com Z/X
 */
export function useThirdPersonCamera(targetRef) {
  // Posição da câmera
  const cameraDistance = 12;
  const cameraHeight = 8;

  const currentCameraPos = useRef(new THREE.Vector3(0, cameraHeight, cameraDistance));
  const currentLookAt = useRef(new THREE.Vector3());

  // Ângulo de rotação da câmera ao redor do jogador (em radianos)
  const [cameraAngle, setCameraAngle] = useState(0);
  const cameraAngleRef = useRef(0);

  // Listener para teclas Z e X (desktop)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'z') {
        // Rotacionar para esquerda
        setCameraAngle(prev => prev + Math.PI / 4); // 45 graus
      } else if (key === 'x') {
        // Rotacionar para direita
        setCameraAngle(prev => prev - Math.PI / 4); // 45 graus
      }
    };

    // Listener para evento customizado de rotação (mobile)
    const handleCameraRotate = (e) => {
      const { direction } = e.detail;
      if (direction === 'left') {
        setCameraAngle(prev => prev + Math.PI / 4); // 45 graus
      } else if (direction === 'right') {
        setCameraAngle(prev => prev - Math.PI / 4); // 45 graus
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('cameraRotate', handleCameraRotate);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('cameraRotate', handleCameraRotate);
    };
  }, []);

  // Atualizar ref quando o state mudar
  useEffect(() => {
    cameraAngleRef.current = cameraAngle;
  }, [cameraAngle]);

  useFrame((state) => {
    if (!targetRef.current) return;

    const camera = state.camera;
    const playerPos = targetRef.current.position;

    // Calcular posição da câmera baseada no ângulo
    const angle = cameraAngleRef.current;
    const offsetX = Math.sin(angle) * cameraDistance;
    const offsetZ = Math.cos(angle) * cameraDistance;

    // Posição ideal: rotacionada ao redor do jogador
    const idealCameraPos = new THREE.Vector3(
      playerPos.x + offsetX,
      playerPos.y + cameraHeight,
      playerPos.z + offsetZ
    );

    // Suavizar movimento da câmera
    currentCameraPos.current.lerp(idealCameraPos, 0.08);
    camera.position.copy(currentCameraPos.current);

    // Olhar para o jogador (um pouco acima)
    const lookTarget = playerPos.clone();
    lookTarget.y += 1;

    currentLookAt.current.lerp(lookTarget, 0.08);
    camera.lookAt(currentLookAt.current);
  });

  return { cameraAngleRef, setCameraAngle };
}
