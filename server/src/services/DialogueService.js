import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * DialogueService - Gerencia todos os diálogos do jogo
 * VOCÊ PODE EDITAR OS TEXTOS EM /server/src/data/dialogues.json
 */
export class DialogueService {
  constructor() {
    this.dialogues = this.loadDialogues();
  }

  /**
   * Carregar diálogos do arquivo JSON
   */
  loadDialogues() {
    const dataPath = join(__dirname, '../data/dialogues.json');
    const data = readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Recarregar diálogos (útil para edição em tempo real)
   */
  reloadDialogues() {
    this.dialogues = this.loadDialogues();
  }

  /**
   * Obter diálogo específico
   */
  getDialogue(key) {
    const dialogue = this.dialogues[key];

    if (!dialogue) {
      return {
        momento: 'Desconhecido',
        oraculo: ['...'],
        tipo: 'erro'
      };
    }

    return dialogue;
  }

  /**
   * Obter todas as falas do Oráculo para um momento específico
   */
  getOracleLines(key) {
    const dialogue = this.getDialogue(key);
    return dialogue.oraculo || [];
  }

  /**
   * Listar todos os diálogos disponíveis
   */
  listAllDialogues() {
    return Object.keys(this.dialogues).filter(key => !key.startsWith('_'));
  }

  /**
   * Obter diálogo formatado para envio ao cliente
   */
  getFormattedDialogue(key) {
    const dialogue = this.getDialogue(key);

    return {
      momento: dialogue.momento,
      linhas: dialogue.oraculo,
      tipo: dialogue.tipo,
      objetivo: dialogue.objetivo_texto || null
    };
  }
}
