# 🛠️ Comandos Úteis - O Oráculo

## 🚀 Iniciar o Jogo

### Método 1: Tudo junto (recomendado)
```bash
cd /home/jones/elisthervelyn
npm run dev
```

### Método 2: Separado (para debug)
```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:client
```

---

## 📦 Instalação

### Primeira vez (instalar tudo)
```bash
cd /home/jones/elisthervelyn
npm run install:all
```

### Reinstalar apenas server
```bash
cd /home/jones/elisthervelyn/server
npm install
```

### Reinstalar apenas client
```bash
cd /home/jones/elisthervelyn/client
npm install
```

---

## 🔧 Desenvolvimento

### Rodar apenas o servidor
```bash
cd /home/jones/elisthervelyn
npm run dev:server
```

### Rodar apenas o cliente
```bash
cd /home/jones/elisthervelyn
npm run dev:client
```

### Testar saúde do servidor
```bash
curl http://localhost:3001/health
```

---

## 🐛 Troubleshooting

### Matar processos nas portas
```bash
# Matar servidor (porta 3001)
npx kill-port 3001

# Matar cliente (porta 3000)
npx kill-port 3000

# Matar ambos
npx kill-port 3001 3000
```

### Limpar cache do npm
```bash
npm cache clean --force
```

### Reinstalar tudo do zero
```bash
cd /home/jones/elisthervelyn
rm -rf node_modules client/node_modules server/node_modules
rm -rf package-lock.json client/package-lock.json server/package-lock.json
npm run install:all
```

---

## 📱 Descobrir IP para Mobile

### Linux/WSL
```bash
hostname -I | awk '{print $1}'
```

### Alternativa
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

### Testar conexão
```bash
# Substitua SEU_IP pelo IP descoberto
curl http://SEU_IP:3001/health
```

---

## 📝 Editar Arquivos de Dados

### Abrir diálogos
```bash
nano server/src/data/dialogues.json
# ou
code server/src/data/dialogues.json
```

### Abrir missões
```bash
nano server/src/data/missions.json
# ou
code server/src/data/missions.json
```

### Abrir personagens
```bash
nano server/src/data/characters.json
# ou
code server/src/data/characters.json
```

---

## 🔍 Ver Logs

### Logs do servidor (se rodando em background)
```bash
# Já deve aparecer automaticamente no terminal
# Se não, verifique o arquivo de log se criado
```

### Ver erros do navegador
```
Pressione F12 no navegador
Vá para a aba "Console"
```

---

## 🏗️ Estrutura de Arquivos

### Ver todos os arquivos do projeto
```bash
cd /home/jones/elisthervelyn
tree -I 'node_modules'
```

### Alternativa (se tree não estiver instalado)
```bash
find . -not -path "*/node_modules/*" -type f
```

### Ver apenas arquivos JS/JSX
```bash
find . -name "*.js" -o -name "*.jsx" | grep -v node_modules
```

---

## 🧪 Testes Rápidos

### Testar servidor está rodando
```bash
curl http://localhost:3001/health
# Deve retornar: {"status":"ok","message":"O Oráculo Server is running"}
```

### Testar cliente está rodando
```bash
curl http://localhost:3000
# Deve retornar HTML
```

### Verificar portas em uso
```bash
lsof -i :3000
lsof -i :3001
```

---

## 🎮 Acessar o Jogo

### Desktop
```
http://localhost:3000
```

### Mobile (mesma rede Wi-Fi)
```
http://[SEU_IP]:3000

Exemplo:
http://192.168.1.10:3000
```

---

## 📊 Status do Projeto

### Ver tamanho do projeto
```bash
cd /home/jones/elisthervelyn
du -sh .
```

### Contar linhas de código
```bash
find . -name "*.js" -o -name "*.jsx" | xargs wc -l
```

### Ver dependências instaladas
```bash
npm list --depth=0
```

---

## 🔄 Git (se inicializar)

### Inicializar repositório
```bash
cd /home/jones/elisthervelyn
git init
git add .
git commit -m "Initial commit - O Oráculo MVP Dias 1-3"
```

### Ver status
```bash
git status
```

### Criar branch para nova feature
```bash
git checkout -b feature/combate
```

---

## 🚀 Deploy (Futuro)

### Build do cliente para produção
```bash
cd /home/jones/elisthervelyn/client
npm run build
```

### Testar build localmente
```bash
cd /home/jones/elisthervelyn/client
npm run preview
```

---

## 📚 Documentação

### Ver README
```bash
cat README.md
```

### Ver Progresso
```bash
cat PROGRESSO.md
```

### Ver Início Rápido
```bash
cat INICIO_RAPIDO.md
```

### Ver Resumo Visual
```bash
cat RESUMO_VISUAL.md
```

---

## 🎨 Editar Variáveis de Ambiente

### Cliente
```bash
nano client/.env
# ou
code client/.env
```

Conteúdo:
```
VITE_SERVER_URL=http://localhost:3001
```

### Servidor
```bash
nano server/.env
# ou
code server/.env
```

Conteúdo:
```
PORT=3001
NODE_ENV=development
```

---

## 🔧 Comandos Avançados

### Atualizar todas as dependências
```bash
npm update
cd client && npm update
cd ../server && npm update
```

### Verificar vulnerabilidades
```bash
npm audit
npm audit fix
```

### Limpar e reconstruir
```bash
npm run install:all
```

---

## 🎯 Comandos Rápidos de Desenvolvimento

### Reiniciar tudo rapidamente
```bash
npx kill-port 3000 3001 && npm run dev
```

### Ver IP e iniciar
```bash
hostname -I | awk '{print $1}' && npm run dev
```

### Backup rápido dos JSONs
```bash
cp server/src/data/dialogues.json server/src/data/dialogues.backup.json
cp server/src/data/missions.json server/src/data/missions.backup.json
cp server/src/data/characters.json server/src/data/characters.backup.json
```

### Restaurar backup
```bash
cp server/src/data/dialogues.backup.json server/src/data/dialogues.json
cp server/src/data/missions.backup.json server/src/data/missions.json
cp server/src/data/characters.backup.json server/src/data/characters.json
```

---

## 🎮 Atalhos do Navegador

```
F5          - Recarregar página
Ctrl+Shift+R - Recarregar ignorando cache
F12         - Abrir DevTools (ver console/logs)
Ctrl+Shift+I - Abrir DevTools (alternativo)
Ctrl+Shift+C - Inspecionar elemento
```

---

## 📱 Testar em Múltiplos Dispositivos

### Abrir 3 abas no mesmo navegador
```
Ctrl+T (nova aba)
Copie e cole: http://localhost:3000
Repita 3 vezes
```

### Testar em dispositivo móvel real
1. Descubra seu IP: `hostname -I | awk '{print $1}'`
2. No celular, acesse: `http://SEU_IP:3000`
3. Certifique-se de estar na mesma rede Wi-Fi

---

## 🆘 SOS - Algo Deu Errado?

### Erro: "Cannot find module"
```bash
npm run install:all
```

### Erro: "Port already in use"
```bash
npx kill-port 3000 3001
```

### Erro: "ECONNREFUSED"
```bash
# Verifique se o servidor está rodando:
curl http://localhost:3001/health

# Se não estiver, inicie:
npm run dev:server
```

### Página em branco
```
1. Abra DevTools (F12)
2. Vá para "Console"
3. Veja erros
4. Copie e pesquise o erro
```

### Jogadores não aparecem
```
1. Recarregue a página (F5)
2. Verifique se o servidor está rodando
3. Veja console do navegador (F12)
```

---

**🎮 Salve este arquivo! Vai ser útil sempre! 📌**

*Feito com 💜 para facilitar sua vida*
