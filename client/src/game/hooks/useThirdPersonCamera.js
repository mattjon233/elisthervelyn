import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

/**
 * Câmera third-person fixa e suave
 * Fica sempre atrás e acima do jogador
 */
export function useThirdPersonCamera(targetRef) {
  // Posição fixa da câmera (não rotaciona com o jogador)
  const cameraDistance = 12;
  const cameraHeight = 8;

  const currentCameraPos = useRef(new THREE.Vector3(0, cameraHeight, cameraDistance));
  const currentLookAt = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (!targetRef.current) return;

    const camera = state.camera;
    const playerPos = targetRef.current.position;

    // Posição ideal: sempre atrás e acima (fixa, sem rotacionar)
    const idealCameraPos = new THREE.Vector3(
      playerPos.x,
      playerPos.y + cameraHeight,
      playerPos.z + cameraDistance
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

  return {};
}
