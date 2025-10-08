import './AbilityCooldown.css';

const characterAbilityIcons = {
  esther: '✨',
  elissa: '⚔️',
  evelyn: '🔥',
};

function AbilityCooldown({ character, abilityState }) {
  if (!character || !abilityState) return null;

  // Pega a primeira (e única) habilidade do personagem
  const abilityId = Object.keys(abilityState)[0];
  if (!abilityId) return null;

  const state = abilityState[abilityId];
  const icon = characterAbilityIcons[character.id] || '✨';
  const progress = state.canUse ? 1 : state.cooldownProgress;

  return (
    <div className={`ability-cooldown ${!state.canUse ? 'on-cooldown' : ''}`}>
      <div className="ability-icon">{icon}</div>
      <div className="cooldown-overlay" style={{ transform: `scaleY(${1 - progress})` }} />
      <div className="ability-key">Q</div>
    </div>
  );
}

export default AbilityCooldown;
