import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * MissionService - Gerencia missões e progressão
 * VOCÊ PODE EDITAR MISSÕES EM /server/src/data/missions.json
 */
export class MissionService {
  constructor() {
    this.missionData = this.loadMissions();
  }

  /**
   * Carregar missões do arquivo JSON
   */
  loadMissions() {
    const dataPath = join(__dirname, '../data/missions.json');
    const data = readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Recarregar missões (útil para adicionar novas sem restart)
   */
  reloadMissions() {
    this.missionData = this.loadMissions();
    console.log('[MissionService] Missões recarregadas do arquivo JSON');
  }

  /**
   * Obter missão por ID
   */
  getMission(missionId) {
    const mission = this.missionData.missions.find(m => m.id === missionId);

    if (!mission) {
      console.warn(`[MissionService] Missão não encontrada: ${missionId}`);
      return null;
    }

    return mission;
  }

  /**
   * Obter próxima missão
   */
  getNextMission(currentMissionId) {
    const nextId = currentMissionId + 1;
    return this.getMission(nextId);
  }

  /**
   * Obter dados do boss
   */
  getBossFight() {
    return this.missionData.boss_fight;
  }

  /**
   * Obter total de missões
   */
  getTotalMissions() {
    return this.missionData.missions.length;
  }

  /**
   * Verificar se missão está completa
   */
  checkMissionComplete(mission, currentProgress) {
    const objectives = mission.objetivos.alvos;

    for (const [enemyType, required] of Object.entries(objectives)) {
      const killed = currentProgress[enemyType] || 0;
      if (killed < required) {
        return false;
      }
    }

    return true;
  }

  /**
   * Obter progresso formatado
   */
  getProgressText(mission, currentProgress) {
    const objectives = mission.objetivos.alvos;
    const progressArray = [];

    for (const [enemyType, required] of Object.entries(objectives)) {
      const killed = currentProgress[enemyType] || 0;
      progressArray.push(`${enemyType}: ${killed}/${required}`);
    }

    return progressArray.join(', ');
  }

  /**
   * Listar todas as missões
   */
  listAllMissions() {
    return this.missionData.missions.map(m => ({
      id: m.id,
      nome: m.nome,
      descricao: m.descricao
    }));
  }
}
