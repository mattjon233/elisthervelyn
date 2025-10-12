# Guia de Deploy - O Oráculo

Este guia explica como hospedar o jogo do Oráculo gratuitamente na internet para jogar com suas sobrinhas.

## Importante sobre Multiplayer

O jogo usa **WebSockets (Socket.IO)** para comunicação em tempo real entre jogadores. Isso significa que você precisa de:
1. Um servidor para hospedar o **backend** (Node.js + Socket.IO)
2. Um servidor para hospedar o **frontend** (React/Vite)

## Opção 1: Render.com (RECOMENDADO para Multiplayer)

O Render.com oferece hospedagem gratuita e suporta WebSockets nativamente, ao contrário do Vercel que tem limitações com WebSockets no plano gratuito.

### Passo a Passo:

#### 1. Criar conta no Render.com
- Acesse: https://render.com
- Crie uma conta gratuita (pode usar GitHub)

#### 2. Fazer Deploy do Servidor (Backend)

1. No painel do Render, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório do GitHub ou faça upload dos arquivos
3. Configure:
   - **Name**: `oraculo-server` (ou o nome que preferir)
   - **Region**: US West (Oregon) ou outra região próxima
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. Clique em **"Create Web Service"**
5. Anote a URL gerada (ex: `https://oraculo-server.onrender.com`)

#### 3. Fazer Deploy do Cliente (Frontend)

1. No painel do Render, clique em **"New +"** → **"Static Site"**
2. Configure:
   - **Name**: `oraculo-client`
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Em **Environment Variables**, adicione:
   - **Key**: `VITE_SERVER_URL`
   - **Value**: `https://oraculo-server.onrender.com` (a URL do seu servidor)
4. Clique em **"Create Static Site"**
5. Aguarde o deploy terminar e acesse a URL gerada

#### 4. Pronto!
Seu jogo estará disponível na URL do cliente (ex: `https://oraculo-client.onrender.com`)

### Notas sobre o Plano Gratuito do Render:
- O servidor pode "dormir" após 15 minutos sem uso
- A primeira conexão pode demorar ~30 segundos (cold start)
- Limite de 750 horas/mês no plano gratuito
- **Multiplayer funciona perfeitamente!**

---

## Opção 2: Railway.app (Alternativa ao Render)

Railway também oferece suporte gratuito para WebSockets.

### Passo a Passo:

1. Acesse: https://railway.app
2. Crie uma conta (pode usar GitHub)
3. Clique em **"New Project"** → **"Deploy from GitHub repo"**
4. Selecione seu repositório
5. Railway detectará automaticamente os serviços (server e client)
6. Configure as variáveis de ambiente:
   - No serviço do client, adicione `VITE_SERVER_URL` com a URL do servidor
7. Aguarde o deploy

### Notas sobre Railway:
- $5 de crédito gratuito por mês
- Após esgotar o crédito, os serviços pausam
- Multiplayer funciona!

---

## Opção 3: Fly.io (Para usuários mais técnicos)

Fly.io oferece 3 VMs gratuitas e suporta WebSockets.

### Passo a Passo:

1. Instale o Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Faça login: `fly auth login`
3. Deploy do servidor:
   ```bash
   cd server
   fly launch --name oraculo-server
   fly deploy
   ```
4. Deploy do cliente (pode usar Vercel ou Netlify para o static site)

---

## Opção 4: Vercel (NÃO recomendado para Multiplayer)

O Vercel tem excelente suporte para sites estáticos, mas **NÃO suporta WebSockets de forma adequada** no plano gratuito. As funções serverless têm timeout de 10 segundos, o que quebra a conexão persistente necessária para o multiplayer.

Se ainda assim quiser usar o Vercel apenas para o frontend estático (sem multiplayer), você precisará:
1. Hospedar o servidor em outro lugar (Render, Railway, etc.)
2. Fazer deploy apenas do cliente no Vercel

---

## Preparação dos Arquivos

Antes de fazer o deploy, certifique-se de que:

1. Todos os arquivos estão commitados no Git
2. O arquivo `.gitignore` está configurado corretamente
3. As dependências estão listadas corretamente no `package.json`

---

## Solução de Problemas

### "Cannot connect to server"
- Verifique se a variável `VITE_SERVER_URL` está configurada corretamente no cliente
- Certifique-se de que o servidor está rodando e acessível
- Aguarde ~30 segundos na primeira conexão (cold start)

### "WebSocket connection failed"
- Certifique-se de que está usando HTTPS no cliente e no servidor
- Verifique se o servidor suporta WebSockets (Render, Railway, Fly.io suportam)

### Servidor "adormece" após alguns minutos
- Isso é normal no plano gratuito do Render
- A primeira requisição acordará o servidor (~30 segundos)
- Considere fazer um ping periódico ou atualizar para o plano pago

---

## Recomendação Final

Para jogar com suas sobrinhas, recomendamos **Render.com**:
- ✅ Gratuito
- ✅ Suporta WebSockets nativamente
- ✅ Fácil de usar
- ✅ Multiplayer funciona perfeitamente
- ✅ Deploy automático via Git

Boa sorte e divirta-se jogando! 🎮🔮
