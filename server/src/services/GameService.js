import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * GameService - Lógica de jogo e gerenciamento de estado
 */
export class GameService {
  constructor() {
    this.characters = this.loadCharacters();
  }

  /**
   * Carregar dados de personagens do JSON
   */
  loadCharacters() {
    const dataPath = join(__dirname, '../data/characters.json');
    const data = readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Obter stats de um personagem
   */
  getCharacterStats(characterName) {
    const character = this.characters.princesas[characterName.toLowerCase()];
    if (!character) {
      throw new Error(`Personagem ${characterName} não encontrado`);
    }
    return character;
  }

  /**
   * Gera a lista inicial de inimigos para uma sala
   */
  getInitialEnemies() {
    // Inimigos espalhados pelo mapa
    return [
      // Zombies - Grupo 1 (Norte)
      { id: 'z1', type: 'zombie', position: [5, 0.5, -10], health: 100, maxHealth: 100 },
      { id: 'z2', type: 'zombie', position: [-5, 0.5, -12], health: 100, maxHealth: 100 },
      { id: 'z3', type: 'zombie', position: [8, 0.5, -8], health: 100, maxHealth: 100 },

      // Zombies - Grupo 2 (Sul)
      { id: 'z4', type: 'zombie', position: [10, 0.5, 10], health: 100, maxHealth: 100 },
      { id: 'z5', type: 'zombie', position: [-8, 0.5, 12], health: 100, maxHealth: 100 },
      { id: 'z6', type: 'zombie', position: [6, 0.5, 15], health: 100, maxHealth: 100 },

      // Zombies - Grupo 3 (Leste)
      { id: 'z7', type: 'zombie', position: [15, 0.5, -5], health: 100, maxHealth: 100 },
      { id: 'z8', type: 'zombie', position: [18, 0.5, 2], health: 100, maxHealth: 100 },

      // Zombies - Grupo 4 (Oeste)
      { id: 'z9', type: 'zombie', position: [-15, 0.5, -3], health: 100, maxHealth: 100 },
      { id: 'z10', type: 'zombie', position: [-18, 0.5, 5], health: 100, maxHealth: 100 },

      // Fantasmas espalhados
      { id: 'g1', type: 'ghost', position: [-10, 1, -15], health: 75, maxHealth: 75 },
      { id: 'g2', type: 'ghost', position: [12, 1, -18], health: 75, maxHealth: 75 },
      { id: 'g3', type: 'ghost', position: [15, 1, 12], health: 75, maxHealth: 75 },
      { id: 'g4', type: 'ghost', position: [-12, 1, 15], health: 75, maxHealth: 75 },
      { id: 'g5', type: 'ghost', position: [20, 1, -8], health: 75, maxHealth: 75 }
    ];
  }

  /**
   * Obter dados do NPC Rocket
   */
  getRocketData() {
    return this.characters.npcs.rocket;
  }

  /**
   * Obter dados de um tipo de inimigo
   */
  getEnemyData(enemyType) {
    return this.characters.inimigos[enemyType.toLowerCase()];
  }

  /**
   * Obter dados do boss
   */
  getBossData() {
    return this.characters.boss.coconaro;
  }

  /**
   * Calcular dano de ataque
   */
  calculateDamage(attacker, target, attackType) {
    // Implementação simplificada - pode ser expandida
    let baseDamage = attacker.habilidade.dano;

    // Aplicar modificadores futuros aqui
    // (crítico, buffs, debuffs, etc.)

    return baseDamage;
  }

  /**
   * Verificar se entidade está viva
   */
  isAlive(entity) {
    return entity.vida_atual > 0;
  }

  /**
   * Aplica dano a uma entidade
   */
  applyDamage(entity, damage) {
    entity.health = Math.max(0, entity.health - damage);
    return entity.health;
  }

  /**
   * Processa o dano de um ataque básico ou habilidade
   */
  applyAttackDamage(attacker, enemies, targetId, customDamage = null) {
    const target = enemies.find(e => e.id === targetId);
    if (!target || target.health <= 0) return;

    // Rocket é imortal e não pode ser atacado
    if (target.type === 'rocket') {
      console.log(`SERVER: Rocket não pode ser atacado! Ignorando dano.`);
      return;
    }

    // Auto ataque sempre dá 10 de dano para todos os personagens
    const AUTO_ATTACK_DAMAGE = 10;

    // Se o cliente enviou um dano customizado (habilidade), usa ele; senão, usa 10 de dano
    const damage = customDamage !== null ? customDamage : AUTO_ATTACK_DAMAGE;
    this.applyDamage(target, damage);

    const damageType = customDamage !== null ? '(habilidade)' : '(básico)';
    console.log(`SERVER: Jogador ${attacker.id} (${attacker.character}) causou ${damage} ${damageType} de dano em ${target.id}. Vida restante: ${target.health}`);
  }

  /**
   * Restaura a vida de um jogador e o torna invulnerável
   * Respawn perto do Oracle (canto do mapa em [35, 0, 35])
   */
  respawnPlayer(player) {
    player.health = player.maxHealth;
    player.invulnerableUntil = Date.now() + 5000; // 5 segundos de invulnerabilidade

    // Respawn perto do Oracle com pequena variação
    player.position = {
      x: 30 + Math.random() * 4, // 30-34 (perto do Oracle em x=35)
      y: 0.5,
      z: 30 + Math.random() * 4  // 30-34 (perto do Oracle em z=35)
    };
  }

  /**
   * Atualiza a posição dos inimigos (IA)
   */
  updateEnemyPositions(enemies, players) {
    if (!players || players.length === 0) return;

    const delta = 0.2; // Corresponde ao intervalo do loop (200ms)

    enemies.forEach(enemy => {
      // VERIFICAÇÃO CRÍTICA: Inimigos mortos não podem se mover nem atacar
      if (enemy.health <= 0) return;

      // Encontra o jogador mais próximo
      let nearestPlayer = null;
      let minDistance = Infinity;

      players.forEach(player => {
        if (player.position) {
          const dx = enemy.position[0] - player.position.x;
          const dz = enemy.position[2] - player.position.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          if (distance < minDistance) {
            minDistance = distance;
            nearestPlayer = player;
          }
        }
      });

      if (!nearestPlayer) return;

      // VERIFICAÇÃO CRÍTICA: Não atacar jogadores mortos ou invulneráveis
      const now = Date.now();
      if (nearestPlayer.health <= 0 || (nearestPlayer.invulnerableUntil && now < nearestPlayer.invulnerableUntil)) {
        // Se o jogador está morto ou invulnerável, este inimigo não faz nada com ele nesta iteração.
        // Ele ainda pode se mover, mas não ataca.
        return; // Sai desta iteração do forEach para este inimigo.
      }

      // Lógica de IA específica por tipo
      if (enemy.type === 'rocket') {
        const speed = 3.0;
        const followDistance = 3;
        if (minDistance > followDistance) {
          const targetPos = nearestPlayer.position;
          const enemyPos = { x: enemy.position[0], y: enemy.position[1], z: enemy.position[2] };
          const dx = targetPos.x - enemyPos.x;
          const dz = targetPos.z - enemyPos.z;
          const direction = { x: dx / minDistance, z: dz / minDistance };

          enemy.position[0] += direction.x * speed * delta;
          enemy.position[2] += direction.z * speed * delta;
        }

        // Lógica de Cura
        const healInterval = 5000; // 5 segundos
        const healAmount = 5;
        const healRadius = 5;
        const now = Date.now();

        if (!enemy.lastHealTime || now - enemy.lastHealTime > healInterval) {
          enemy.lastHealTime = now;
          players.forEach(p => {
            const dx = enemy.position[0] - p.position.x;
            const dz = enemy.position[2] - p.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // SÓ CURA JOGADORES VIVOS
            if (distance <= healRadius && p.health > 0 && p.health < p.maxHealth) {
              p.health = Math.min(p.maxHealth, p.health + healAmount);
              console.log(`SERVER: Rocket curou ${p.id} em ${healAmount}HP.`);
            }
          });
        }

      } else { // Lógica para Zumbis e Fantasmas
        const speed = enemy.type === 'zombie' ? 1.2 : 2.0;
        const detectionRange = 12;
        const attackRange = 1.5;

        if (minDistance < detectionRange && minDistance > attackRange) {
          const targetPos = nearestPlayer.position;
          const enemyPos = { x: enemy.position[0], y: enemy.position[1], z: enemy.position[2] };

          const dx = targetPos.x - enemyPos.x;
          const dz = targetPos.z - enemyPos.z;
          const direction = { x: dx / minDistance, z: dz / minDistance };

          enemy.position[0] += direction.x * speed * delta;
          enemy.position[2] += direction.z * speed * delta;
        } else if (minDistance <= attackRange) {
          // Inimigo está no alcance para atacar
          if (nearestPlayer.health <= 0) return; // NÃO ATACAR JOGADORES MORTOS

          const now = Date.now();

          // Verifica se o jogador está invulnerável
          if (nearestPlayer.invulnerableUntil && now < nearestPlayer.invulnerableUntil) {
            return; // Jogador está invulnerável, não faz nada
          }

          if (!enemy.lastAttackTime || now - enemy.lastAttackTime > 1000) { // Cooldown de 1s
            enemy.lastAttackTime = now;
            const damage = enemy.type === 'zombie' ? 10 : 15;
            nearestPlayer.health = Math.max(0, nearestPlayer.health - damage);
            console.log(`SERVER: Inimigo ${enemy.id} causou ${damage} de dano em ${nearestPlayer.id}. Vida restante: ${nearestPlayer.health}`);
          }
        }
      }

      // Lógica de separação para evitar sobreposição
      const separationDistance = 0.8;
      enemies.forEach(otherEnemy => {
        if (enemy.id !== otherEnemy.id) {
          const distToOtherX = enemy.position[0] - otherEnemy.position[0];
          const distToOtherZ = enemy.position[2] - otherEnemy.position[2];
          const otherDistance = Math.sqrt(distToOtherX * distToOtherX + distToOtherZ * distToOtherZ);

          if (otherDistance < separationDistance) {
            const pushForce = (separationDistance - otherDistance) * 0.1; // Força de empurrão
            enemy.position[0] += (distToOtherX / otherDistance) * pushForce;
            enemy.position[2] += (distToOtherZ / otherDistance) * pushForce;
          }
        }
      });
    });
  }
}
