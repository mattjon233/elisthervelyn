/**
 * Dados para NPCs amigáveis que povoam o mapa.
 */

const friendlyNpcData = [
  {
    id: 'npc_child_1',
    position: { x: -28, y: 0, z: -26 },
    model: 'child',
    dialogue: [
      'Você já viu o cemitério? Dá um pouco de medo...',
      'Minha mãe disse para não falar com estranhos.',
      'Queria que meu cachorro fosse legal como o Rocket!',
    ],
  },
  {
    id: 'npc_villager_1',
    position: { x: -28, y: 0, z: 2 },
    model: 'villager_male',
    dialogue: [
      'As poções da Tia Rose já me salvaram algumas vezes.',
      'Cuidado ao andar pelo mapa, está cheio de monstros.',
      'Dizem que o Tio Uncle tem umas melhorias bem esquisitas.',
    ],
  },
  {
    id: 'npc_villager_2',
    position: { x: -32, y: 0, z: -2 },
    model: 'villager_female',
    dialogue: [
      'Um lanchinho sempre vai bem depois de uma batalha!',
      'O Oráculo parece saber de tudo, não é?',
      'As três irmãs são nossa única esperança.',
    ],
  },
];

export default friendlyNpcData;

/**
 * Array de obstáculos para os NPCs amigáveis, usado pelo sistema de colisão.
 */
export const friendlyNpcObstacles = friendlyNpcData.map(npc => ({
  type: 'sphere',
  x: npc.position.x,
  z: npc.position.z,
  radius: 0.8, // Raio de colisão padrão para NPCs amigáveis
}));
