/**
 * Serviço de Som - Gerencia efeitos sonoros do jogo
 * Por enquanto usa Web Audio API com sons sintéticos
 * Futuramente será substituído por arquivos de áudio reais
 */

class SoundService {
  constructor() {
    this.audioContext = null;
    this.masterVolume = 0.3;
    this.enabled = true;

    // Inicializar AudioContext (lazy)
    this.init();
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API não suportada:', e);
      this.enabled = false;
    }
  }

  /**
   * Som de ataque básico (swoosh)
   */
  playAttackSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Oscilador para "swoosh"
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Frequência descendente (swoosh)
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    // Envelope de volume
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.5, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.type = 'sawtooth';
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Som de hit (acertar inimigo)
   */
  playHitSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Tom grave de impacto
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.7, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.type = 'square';
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Som de morte de inimigo
   */
  playEnemyDeathSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Som descendente dramático
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.6, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.type = 'triangle';
    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * Som de dano recebido pelo jogador
   */
  playPlayerHurtSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Tom agudo descendente
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.4, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.type = 'sine';
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Som de cura (Rocket)
   */
  playHealSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Tom ascendente cristalino
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Frequência ascendente (mágico/curativo)
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);

    // Envelope suave
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.type = 'sine';
    osc.start(now);
    osc.stop(now + 0.3);

    // Segundo harmônico (mais agudo)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(this.masterVolume * 0.15, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc2.type = 'sine';
    osc2.start(now);
    osc2.stop(now + 0.3);
  }

  /**
   * Som da flecha (Esther)
   */
  playArrowSound() {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    // Ruído branco para o "whoosh"
    const bufferSize = ctx.sampleRate * 0.2; // 0.2s de ruído
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filtro passa-banda para dar forma ao ruído
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(4000, now);
    bandpass.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    bandpass.Q.value = 1;

    noise.connect(bandpass);
    bandpass.connect(gain);

    gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    noise.start(now);
    noise.stop(now + 0.2);
  }

  /**
   * Som do giro da lâmina (Elissa)
   */
  playBladeSpinSound() {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Múltiplos osciladores para um som metálico
    [600, 1200, 1800].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.5, now + 0.4);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.1 * (3 - i), now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  /**
   * Som do meteoro caindo (Evelyn)
   */
  playMeteorSound() {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Ruído grave e profundo
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 1.5);
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.4, now + 0.2);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);

    osc.start(now);
    osc.stop(now + 1.5);
  }

  /**
   * Som do impacto do meteoro (Evelyn)
   */
  playMeteorImpactSound() {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Explosão grave
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.8, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  /**
   * Definir volume master (0-1)
   */
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Ativar/desativar sons
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// Singleton
const soundService = new SoundService();

export default soundService;
