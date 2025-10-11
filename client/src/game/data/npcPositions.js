/**
 * Fonte central da verdade para as posições de NPCs importantes.
 * Isso evita posições hardcoded espalhadas por vários arquivos.
 */

// Posições dos NPCs
export const oraclePosition = { x: 35, y: 0, z: 35 };
export const tiaRosePosition = { x: -35, y: 0, z: -35 };
export const tioUnclePosition = { x: 40, y: 0, z: 10 };

/**
 * Array de obstáculos para os NPCs, usado pelo sistema de colisão manual.
 * Cada NPC é tratado como uma esfera de colisão.
 */
export const npcObstacles = [
  {
    type: 'sphere',
    x: oraclePosition.x,
    z: oraclePosition.z,
    radius: 1.5, // Raio de colisão para o Oráculo
  },
  {
    type: 'sphere',
    x: tiaRosePosition.x,
    z: tiaRosePosition.z,
    radius: 1.5, // Raio de colisão para a Tia Rose
  },
  {
    type: 'sphere',
    x: tioUnclePosition.x,
    z: tioUnclePosition.z,
    radius: 1.2, // Raio de colisão para o Tio Uncle
  },
];
