import './SkillTreeUI.css';
import { useLevelStore } from '../store/levelStore';
import socketService from '../services/socket';

function SkillTreeUI({ onClose }) {
  const { skills, skillPoints, unlockSkill } = useLevelStore();

  const handleUnlock = (skillName) => {
    const success = unlockSkill(skillName, socketService);
    if (!success) {
      // Pode adicionar um feedback visual de erro aqui
    }
  };

  return (
    <div className="skill-tree-overlay">
      <div className="skill-tree-modal">
        <button className="skill-tree-close" onClick={onClose}>X</button>

        <h2>🌟 Árvore de Habilidades</h2>
        <p className="skill-points-info">
          Pontos disponíveis: <span className="points-count">{skillPoints}</span>
        </p>

        <div className="skill-tree-container">
          {/* BRANCH 1: Velocidade */}
          <div className="skill-branch">
            <h3 className="branch-title">⚡ Ramo da Velocidade</h3>

            {/* Topo: Speed Boost */}
            <div className="skill-tier">
              <div
                className={`skill-node ${skills.speedBoost ? 'unlocked' : skillPoints > 0 ? 'available' : 'locked'}`}
                onClick={() => !skills.speedBoost && handleUnlock('speedBoost')}
              >
                <div className="skill-icon">🏃</div>
                <div className="skill-name">Velocidade+</div>
                <div className="skill-description">+30% velocidade de movimento</div>
                {skills.speedBoost && <div className="skill-check">✓</div>}
              </div>
            </div>

            {/* Filhos: Health Increase e Cooldown Reduction */}
            <div className="skill-tier skill-tier-dual">
              <div
                className={`skill-node ${skills.healthIncrease ? 'unlocked' : skills.speedBoost && skillPoints > 0 ? 'available' : 'locked'}`}
                onClick={() => !skills.healthIncrease && skills.speedBoost && handleUnlock('healthIncrease')}
              >
                <div className="skill-icon">💚</div>
                <div className="skill-name">HP Máximo+</div>
                <div className="skill-description">+50 HP máximo</div>
                {skills.healthIncrease && <div className="skill-check">✓</div>}
                {!skills.speedBoost && <div className="skill-lock">🔒</div>}
              </div>

              <div
                className={`skill-node ${skills.abilityCooldownReduction ? 'unlocked' : skills.speedBoost && skillPoints > 0 ? 'available' : 'locked'}`}
                onClick={() => !skills.abilityCooldownReduction && skills.speedBoost && handleUnlock('abilityCooldownReduction')}
              >
                <div className="skill-icon">⏱️</div>
                <div className="skill-name">Cooldown-</div>
                <div className="skill-description">-30% cooldown habilidade Q</div>
                {skills.abilityCooldownReduction && <div className="skill-check">✓</div>}
                {!skills.speedBoost && <div className="skill-lock">🔒</div>}
              </div>
            </div>
          </div>

          {/* BRANCH 2: Dano */}
          <div className="skill-branch">
            <h3 className="branch-title">⚔️ Ramo do Poder</h3>

            {/* Topo: Damage Boost */}
            <div className="skill-tier">
              <div
                className={`skill-node ${skills.damageBoost ? 'unlocked' : skillPoints > 0 ? 'available' : 'locked'}`}
                onClick={() => !skills.damageBoost && handleUnlock('damageBoost')}
              >
                <div className="skill-icon">💥</div>
                <div className="skill-name">Dano+</div>
                <div className="skill-description">+50% dano de ataque</div>
                {skills.damageBoost && <div className="skill-check">✓</div>}
              </div>
            </div>

            {/* Filhos: Invulnerability e Instakill */}
            <div className="skill-tier skill-tier-dual">
              <div
                className={`skill-node ${skills.invulnerabilitySkill ? 'unlocked' : skills.damageBoost && skillPoints > 0 ? 'available' : 'locked'}`}
                onClick={() => !skills.invulnerabilitySkill && skills.damageBoost && handleUnlock('invulnerabilitySkill')}
              >
                <div className="skill-icon">🛡️</div>
                <div className="skill-name">Invulnerável</div>
                <div className="skill-description">Skill T: 5s invulnerável</div>
                {skills.invulnerabilitySkill && <div className="skill-check">✓</div>}
                {!skills.damageBoost && <div className="skill-lock">🔒</div>}
              </div>

              <div
                className={`skill-node ${skills.instakillChance ? 'unlocked' : skills.damageBoost && skillPoints > 0 ? 'available' : 'locked'}`}
                onClick={() => !skills.instakillChance && skills.damageBoost && handleUnlock('instakillChance')}
              >
                <div className="skill-icon">💀</div>
                <div className="skill-name">Execução</div>
                <div className="skill-description">5% chance instakill</div>
                {skills.instakillChance && <div className="skill-check">✓</div>}
                {!skills.damageBoost && <div className="skill-lock">🔒</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkillTreeUI;
