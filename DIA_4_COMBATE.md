# ⚔️ DIA 4 - Sistema de Combate Implementado

## 📋 Resumo

Sistema de combate completo com detecção de colisão, efeitos visuais e sonoros. Os jogadores agora podem atacar inimigos, causar dano e eliminar alvos.

---

## 🎮 Controles de Ataque

### Desktop
- **F** ou **J**: Atacar
- **Mouse (Botão Esquerdo)**: Atacar
- Cooldown: 500ms entre ataques

### Mobile (Preparado)
- Botão de ataque no joystick virtual
- Touch screen integrado

---

## 💥 Mecânicas de Combate

### Sistema de Detecção
- **Tipo:** Cone de ataque frontal
- **Ângulo:** 60° (dotProduct > 0.5)
- **Alcance:** 1.5 unidades
- **Anti-spam:** 200ms entre hits no mesmo inimigo

### Cálculo de Dano
```javascript
Esther (Arqueira): 15 HP por hit
Elissa (Guerreira): 20 HP por hit
Evelyn (Maga): 12 HP por hit
```

### Vida dos Inimigos
- **Zumbis:** 30 HP
- **Fantasmas:** 20 HP

---

## 🎨 Efeitos Visuais

### AttackEffect Component
- Arco animado que aparece na frente do jogador
- Cor personalizada por personagem:
  - Esther: Rosa vibrante (#FF69B4)
  - Elissa: Roxo médio (#9370DB)
  - Evelyn: Azul royal (#4169E1)
- Animação:
  - Duração: 200ms
  - Expansão de escala (0.5 → 1.5)
  - Fade out progressivo

---

## 🔊 Sistema de Som (soundService.js)

### Web Audio API Sintético

#### 1. Som de Ataque (Swoosh)
- Frequência: 800Hz → 200Hz
- Duração: 150ms
- Tipo: Sawtooth wave

#### 2. Som de Hit
- Frequência: 150Hz → 50Hz
- Duração: 100ms
- Tipo: Square wave
- Objetivo: Impacto grave

#### 3. Som de Morte
- Frequência: 400Hz → 50Hz
- Duração: 400ms
- Tipo: Triangle wave
- Objetivo: Descendente dramático

#### 4. Som de Dano ao Jogador (Preparado)
- Frequência: 600Hz → 200Hz
- Duração: 200ms
- Tipo: Sine wave
- Objetivo: Tom agudo de dor

### Recursos
- Volume master ajustável (padrão: 30%)
- Enable/Disable global
- Lazy initialization (apenas quando necessário)

---

## 🗂️ Arquivos Criados/Modificados

### Novos Arquivos
```
client/src/game/hooks/useCombat.js         (140 linhas)
client/src/game/entities/AttackEffect.jsx  (56 linhas)
client/src/services/soundService.js        (165 linhas)
```

### Modificados
```
client/src/game/hooks/usePlayerControls.js  (+60 linhas)
client/src/game/entities/Player.jsx         (+40 linhas)
client/src/game/GameScene.jsx               (+70 linhas)
client/src/components/GameUI.jsx            (+10 linhas)
client/src/components/Game.jsx              (+15 linhas)
client/src/store/gameStore.js               (+15 linhas)
```

---

## 🧩 Fluxo de Combate

```
1. Jogador pressiona ataque (F/J/Mouse)
   ↓
2. usePlayerControls detecta input
   ↓
3. isAttacking = true (se fora de cooldown)
   ↓
4. Player.jsx:
   - Mostra AttackEffect
   - Toca som de ataque
   ↓
5. GameScene.jsx (useFrame):
   - Calcula direção do jogador
   - Itera sobre inimigos
   - Verifica distância < 1.5
   - Verifica cone 60°
   - Verifica cooldown de hit
   ↓
6. Se hit confirmado:
   - Aplica dano ao inimigo
   - Toca som de hit
   - Atualiza lastHit timestamp
   ↓
7. Se vida <= 0:
   - Toca som de morte
   - Remove inimigo do array
   - Incrementa killCount
   ↓
8. killCount atualizado no HUD
```

---

## 📊 Estado do Jogo

### gameStore.js
```javascript
// Novo método
damageEnemy(enemyId, damage) {
  // Calcula nova vida
  // Atualiza timestamp de lastHit
  // Retorna estado atualizado
}
```

### Enemy State
```javascript
{
  id: 'z1',
  type: 'zombie',
  position: [x, y, z],
  health: 30,        // Vida atual
  maxHealth: 30,     // Vida máxima
  lastHit: timestamp // Previne hit duplo
}
```

---

## 🎯 Sistema de Kills

### HUD Display
```jsx
<div className="kill-counter">
  <span>KILLS:</span>
  <span style={{ color: '#FFD700' }}>{killCount}</span>
</div>
```

### Propagação de Estado
```
GameScene (useState)
   ↓ (callback)
Game.jsx (useState)
   ↓ (props)
GameUI.jsx (display)
```

---

## 🔧 Hooks Personalizados

### useCombat.js
```javascript
const {
  attackRange,        // 1.5 unidades
  baseDamage,         // Por personagem
  checkAttackHit,     // Função de detecção
  applyDamage,        // Aplicar dano
  checkPlayerDamage   // (Preparado para IA)
} = useCombat(playerRef, character, isAttacking);
```

---

## 🐛 Bugs Conhecidos Resolvidos

✅ Hit duplo no mesmo frame → Resolvido com `lastHit` timestamp
✅ Ataque sem cooldown → Implementado 500ms cooldown
✅ Sem feedback visual → AttackEffect animado adicionado
✅ Sem feedback sonoro → soundService implementado

---

## 🚀 Como Testar

1. Iniciar o jogo:
```bash
npm run dev
```

2. Criar sala no lobby
3. Selecionar personagem
4. No jogo:
   - Aproximar de inimigos (zumbis ou fantasmas)
   - Pressionar **F**, **J** ou **Clique Esquerdo**
   - Observar:
     - ✅ Efeito visual de arco
     - ✅ Som de "swoosh"
     - ✅ Barra de vida do inimigo diminuindo
     - ✅ Som de "hit"
     - ✅ Inimigo desaparece ao morrer
     - ✅ Som de morte
     - ✅ Contador de kills atualiza

---

## 📝 Notas Técnicas

### Performance
- Detecção de colisão roda apenas durante ataque (otimizado)
- Sons são sintéticos (sem carregamento de arquivos)
- AttackEffect é removido após animação (cleanup)

### Escalabilidade
- Sistema preparado para múltiplos jogadores
- Dano pode ser sincronizado via Socket.io futuramente
- Sons podem ser substituídos por arquivos reais

### Acessibilidade
- Volume master ajustável
- Sistema pode ser totalmente desabilitado
- Feedback visual e sonoro redundante

---

## 🎮 Próximos Passos (Dia 5)

- [ ] Sistema de missões ativo (backend)
- [ ] Spawn dinâmico de inimigos
- [ ] Diálogos do Oráculo com texto animado
- [ ] Progressão de missões
- [ ] Tela de vitória/derrota
- [ ] IA de inimigos atacando de volta

---

**Status:** ✅ COMPLETO
**Progresso:** 85% do MVP
**Data:** 08/10/2025
