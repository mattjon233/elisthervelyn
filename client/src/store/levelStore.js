import { create } from 'zustand';

/**
 * Store para sistema de níveis e skill tree
 */
export const useLevelStore = create((set, get) => ({
  // XP e Level
  currentXP: 0,
  currentLevel: 1,
  xpToNextLevel: 100, // XP necessário para próximo nível

  // Skill Points disponíveis
  skillPoints: 0,

  // Skill Tree - Branch 1 (Velocidade)
  skills: {
    // Topo Branch 1
    speedBoost: false, // +velocidade das personagens

    // Filhos da speedBoost
    healthIncrease: false, // +50 HP máximo
    abilityCooldownReduction: false, // Reduz cooldown da skill Q

    // Topo Branch 2
    damageBoost: false, // +dano das personagens

    // Filhos da damageBoost
    invulnerabilitySkill: false, // Nova skill: invulnerabilidade 5s (tecla T)
    instakillChance: false, // 15% chance de instakill
  },

  // Bônus ativos aplicados
  bonuses: {
    speedMultiplier: 1.0, // Multiplicador de velocidade
    maxHealthBonus: 0, // Bônus de HP máximo
    abilityCooldownMultiplier: 1.0, // Multiplicador de cooldown (1.0 = normal, 0.7 = 30% mais rápido)
    damageMultiplier: 1.0, // Multiplicador de dano
    hasInvulnerability: false, // Tem skill de invulnerabilidade
    instakillChance: 0, // Chance de instakill (0-1)
  },

  // Adicionar XP
  addXP: (amount) => {
    const state = get();
    let newXP = state.currentXP + amount;
    let newLevel = state.currentLevel;
    let newSkillPoints = state.skillPoints;
    let newXPToNext = state.xpToNextLevel;

    // Verificar level ups
    while (newXP >= newXPToNext) {
      newXP -= newXPToNext;
      newLevel += 1;
      newSkillPoints += 1; // 1 skill point por nível
      newXPToNext = Math.floor(100 * Math.pow(1.2, newLevel - 1)); // XP aumenta 20% por nível
    }

    set({
      currentXP: newXP,
      currentLevel: newLevel,
      skillPoints: newSkillPoints,
      xpToNextLevel: newXPToNext,
    });
  },

  // Ativar skill (retorna true se sucesso)
  unlockSkill: (skillName, socketService = null) => {
    const state = get();

    // Verificar se tem skill points
    if (state.skillPoints <= 0) {
      return false;
    }

    // Verificar se já tem a skill
    if (state.skills[skillName]) {
      return false;
    }

    // Verificar pré-requisitos
    const prerequisites = {
      speedBoost: [], // Sem pré-requisitos
      healthIncrease: ['speedBoost'], // Requer speedBoost
      abilityCooldownReduction: ['speedBoost'], // Requer speedBoost
      damageBoost: [], // Sem pré-requisitos
      invulnerabilitySkill: ['damageBoost'], // Requer damageBoost
      instakillChance: ['damageBoost'], // Requer damageBoost
    };

    const required = prerequisites[skillName] || [];
    for (const req of required) {
      if (!state.skills[req]) {
        return false;
      }
    }

    // Desbloquear skill e gastar ponto
    const newSkills = { ...state.skills, [skillName]: true };
    const newBonuses = { ...state.bonuses };

    // Aplicar bônus da skill
    switch (skillName) {
      case 'speedBoost':
        newBonuses.speedMultiplier = 1.3; // +30% velocidade
        break;
      case 'healthIncrease':
        newBonuses.maxHealthBonus = 50; // +50 HP
        break;
      case 'abilityCooldownReduction':
        newBonuses.abilityCooldownMultiplier = 0.7; // -30% cooldown
        break;
      case 'damageBoost':
        newBonuses.damageMultiplier = 1.5; // +50% dano
        break;
      case 'invulnerabilitySkill':
        newBonuses.hasInvulnerability = true;
        break;
      case 'instakillChance':
        newBonuses.instakillChance = 0.15; // 15% chance
        break;
    }

    set({
      skills: newSkills,
      bonuses: newBonuses,
      skillPoints: state.skillPoints - 1,
    });

    // Notificar servidor se for skill de HP
    if (skillName === 'healthIncrease' && socketService) {
      socketService.emit('skill_unlocked', { skillName: 'healthIncrease', bonus: 50 });
    }

    return true;
  },

  // Reset (para debug)
  reset: () => {
    set({
      currentXP: 0,
      currentLevel: 1,
      xpToNextLevel: 100,
      skillPoints: 0,
      skills: {
        speedBoost: false,
        healthIncrease: false,
        abilityCooldownReduction: false,
        damageBoost: false,
        invulnerabilitySkill: false,
        instakillChance: false,
      },
      bonuses: {
        speedMultiplier: 1.0,
        maxHealthBonus: 0,
        abilityCooldownMultiplier: 1.0,
        damageMultiplier: 1.0,
        hasInvulnerability: false,
        instakillChance: 0,
      },
    });
  },
}));
