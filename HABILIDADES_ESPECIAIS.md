# ✨ Sistema de Habilidades Especiais - DIA 6

## 🎮 Habilidades Implementadas

### 1. ⚔️ Esther - Flecha Precisa

**Tipo:** Projétil de longo alcance
**Tecla:** Q
**Dano:** 35 HP
**Alcance:** 20 unidades
**Cooldown:** 1 segundo

**Mecânica:**
- Dispara uma flecha rosa na direção que está olhando
- Projétil rápido (velocidade 30 u/s)
- Trail de luz rosa
- Hit instantâneo ao colidir com inimigo
- Alto dano single-target

**Efeitos Visuais:**
- Flecha rosa brilhante (#FF69B4)
- Ponta em cone (#FF1493)
- Penas translúcidas
- Trail de 3 esferas de luz
- PointLight rosa (intensidade 1)

---

### 2. 🗡️ Elissa - Giro Lâmina

**Tipo:** Ataque giratório de área
**Tecla:** Q
**Dano:** 25 HP
**Alcance:** 3 unidades (raio)
**Cooldown:** 2 segundos
**Duração:** 400ms

**Mecânica:**
- Cria 4 lâminas giratórias ao redor dela
- Atinge todos os inimigos próximos simultaneamente
- Animação de rotação rápida
- Expansão e contração visual
- Ideal para grupos de inimigos

**Efeitos Visuais:**
- 4 lâminas roxas (#9370DB)
- Rotação rápida (20 rad/s)
- Círculo central translúcido
- 8 partículas externas (#D4A5D4)
- PointLight roxa (intensidade 2)

---

### 3. 🌠 Evelyn - Chuva de Meteoros

**Tipo:** Ataque de área com delay
**Tecla:** Q
**Dano:** 40 HP
**Alcance:** 10 unidades (distância do alvo)
**Raio da Área:** 4 unidades
**Delay:** 1.5 segundos
**Cooldown:** 3 segundos
**Duração:** 2.5 segundos (total)

**Mecânica:**
- Marca uma área no chão (indicador azul)
- Após 1.5s, meteoros caem do céu
- 8 meteoros em posições aleatórias na área
- Atinge todos os inimigos na área de impacto
- Maior dano, maior cooldown

**Efeitos Visuais:**
**Fase 1 - Targeting (0-1.5s):**
- Anel azul no chão (#4169E1)
- Raio de 4 unidades

**Fase 2 - Falling (1.5-2.0s):**
- 8 meteoros caindo (dodecaedros laranja/vermelho)
- Trail de fogo (5 esferas por meteoro)
- PointLight laranja em cada meteoro

**Fase 3 - Impact (2.0-2.5s):**
- Explosões azuis (#4169E1)
- Anéis de impacto
- PointLight central intensa (intensidade 5)

---

## 🎯 Sistema de Cooldown

### useAbility Hook

```javascript
const {
  config,           // Configuração da habilidade
  canUseAbility,   // Pode usar? (não em cooldown)
  isUsingAbility,  // Está usando agora?
  cooldownProgress, // 0.0 - 1.0 (progresso)
  useAbility       // Função para ativar
} = useAbility(character);
```

### Configurações por Personagem

| Personagem | Cooldown | Duração | Tipo |
|------------|----------|---------|------|
| Esther     | 1000ms   | 0ms     | Instant |
| Elissa     | 2000ms   | 400ms   | Channeled |
| Evelyn     | 3000ms   | 2500ms  | Delayed |

---

## 🎨 Arquivos Criados

### Hooks
1. **useAbility.js** (100 linhas)
   - Gerenciamento de cooldown
   - Estado de habilidade
   - Configurações por personagem

### Componentes de Habilidades
2. **ArrowProjectile.jsx** (90 linhas)
   - Projétil da Esther
   - Movimentação e colisão
   - Trail de luz

3. **BladeSpinEffect.jsx** (85 linhas)
   - Giro da Elissa
   - 4 lâminas rotativas
   - Partículas externas

4. **MeteorShower.jsx** (150 linhas)
   - Meteoros da Evelyn
   - 3 fases (targeting, falling, impact)
   - 8 meteoros com trails

---

## 🔗 Integração

### usePlayerControls.js
```javascript
// Adicionado
keys.ability = false  // Tecla Q

// KeyDown
ability: prev.ability || key === 'q'

// KeyUp
ability: prev.ability && key !== 'q'
```

### Player.jsx (próximo passo)
```javascript
import { useAbility } from '../hooks/useAbility';
import ArrowProjectile from './abilities/ArrowProjectile';
import BladeSpinEffect from './abilities/BladeSpinEffect';
import MeteorShower from './abilities/MeteorShower';

const ability = useAbility(character);

// Detectar Q pressionado
useEffect(() => {
  if (controls?.keys.ability && ability.canUseAbility) {
    ability.useAbility();
    // Criar efeito visual correspondente
  }
}, [controls?.keys.ability]);
```

### GameScene.jsx (próximo passo)
```javascript
// Detectar colisão das habilidades com inimigos
// Aplicar dano específico
// Remover inimigos mortos
```

---

## 🎮 Controles

### Desktop
- **WASD / Setas:** Movimento
- **F / J / Mouse:** Ataque básico
- **Q:** Habilidade especial
- **Espaço:** (Reservado)

### Mobile
- **Joystick:** Movimento
- **⚔️:** Ataque básico
- **✨:** Habilidade especial (já existe!)

---

## 🔊 Sons (próximo passo)

### soundService.js
```javascript
playArrowSound()       // Whoosh de flecha
playBladeSpinSound()   // Corte giratório
playMeteorSound()      // Estrondo distante
playMeteorImpactSound() // Explosão
```

---

## 💡 Mecânicas Especiais

### Flecha Precisa (Esther)
- Ótima para eliminar inimigos isolados
- Sem área de efeito
- Cooldown curto = spam possível
- Requer mira na direção certa

### Giro Lâmina (Elissa)
- Ótima para grupos próximos
- Não requer mira
- Cooldown médio
- Jogadora fica vulnerável durante animação

### Chuva de Meteoros (Evelyn)
- Ótima para grupos distantes
- Delay permite inimigos escaparem
- Maior dano do jogo
- Cooldown longo = uso estratégico
- Área visível = inimigos podem evitar

---

## 🐛 Sistema de Colisão (implementar)

### Flecha (projétil)
```javascript
// A cada frame, verificar distância até inimigos
enemies.forEach(enemy => {
  const distance = arrow.position.distanceTo(enemy.position);
  if (distance < 0.5) {
    // HIT!
    damageEnemy(enemy.id, 35);
    removeArrow();
  }
});
```

### Giro Lâmina (área circular)
```javascript
// No momento da ativação, verificar raio de 3 unidades
const hitEnemies = enemies.filter(enemy => {
  const distance = player.position.distanceTo(enemy.position);
  return distance <= 3;
});

hitEnemies.forEach(enemy => damageEnemy(enemy.id, 25));
```

### Meteoros (área múltipla)
```javascript
// No impacto, verificar cada meteoro
meteors.forEach(meteor => {
  const hitEnemies = enemies.filter(enemy => {
    const distance = meteor.position.distanceTo(enemy.position);
    return distance <= 1; // Raio de explosão
  });

  hitEnemies.forEach(enemy => damageEnemy(enemy.id, 40));
});
```

---

## 📊 Balanceamento

| Aspecto | Esther | Elissa | Evelyn |
|---------|--------|--------|--------|
| DPS teórico | 35/s | 12.5/s | 13.3/s |
| Área de efeito | ❌ | ✅ Pequena | ✅ Grande |
| Risco | Baixo | Médio | Baixo |
| Skill required | Médio | Baixo | Alto |
| Versatilidade | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 Próximos Passos

### Urgente
- [ ] Integrar habilidades no Player.jsx
- [ ] Implementar detecção de colisão
- [ ] Adicionar sons das habilidades
- [ ] Criar indicador de cooldown no HUD

### Importante
- [ ] Sincronizar habilidades via Socket.io (multiplayer)
- [ ] Adicionar efeitos de partículas Three.js
- [ ] Balancear dano e cooldowns

### Futuro
- [ ] Animações de cast do personagem
- [ ] Combos de habilidades
- [ ] Upgrades de habilidades
- [ ] Habilidade passiva única por personagem

---

## 🚀 Status

- **Arquivos criados:** 4
- **Linhas de código:** ~425
- **Habilidades completas:** 3/3 ✅
- **Integração:** 30% ⏳
- **Testes:** 0% ⏳

**Próximo:** Integrar no Player e testar!

---

**Data:** 08/10/2025
**Status:** ⚡ Habilidades Criadas - Falta Integração
