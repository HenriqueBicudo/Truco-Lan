# 🎮 Truco LAN

Um jogo de Truco multiplayer local desenvolvido com React, TypeScript e Node.js usando Socket.IO para comunicação em tempo real.

## 📋 Características

- 🎯 **Jogo completo de Truco** com todas as regras oficiais
- 👥 **Multiplayer local** para 4 jogadores
- 🏆 **Sistema de times** (2v2) com designação vertical/horizontal
- 🔥 **Sistema de apostas** (Truco, 6, 9, 12)
- 💬 **Chat em tempo real** com highlights dos eventos da partida
- 🎨 **Interface moderna** e responsiva
- ⚡ **Modal interativo** para respostas ao truco
- 📊 **Placar dinâmico** com acompanhamento de rodadas

## 🚀 Como executar

### Pré-requisitos

- Node.js (v16 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd truco-lan
```

2. Instale as dependências do servidor:
```bash
cd server
npm install
```

3. Instale as dependências do cliente:
```bash
cd ../client
npm install
```

### Executar o jogo

1. Inicie o servidor (em um terminal):
```bash
cd server
npm start
```

2. Inicie o cliente (em outro terminal):
```bash
cd client
npm run dev
```

3. Abra seu navegador em:
- Jogador 1: `http://localhost:5173`
- Jogador 2: `http://localhost:5173` (nova aba)
- Jogador 3: `http://localhost:5173` (nova aba)
- Jogador 4: `http://localhost:5173` (nova aba)

## 🎮 Como jogar

1. **Entre no jogo**: Digite seu nome na tela inicial
2. **Aguarde os jogadores**: O jogo inicia automaticamente com 4 jogadores
3. **Times**: 
   - Time Y (vertical): Jogadores 1 e 2
   - Time X (horizontal): Jogadores 3 e 4
4. **Jogando**:
   - Clique em uma carta para jogá-la (quando for sua vez)
   - Use o botão "PEDIR TRUCO" para desafiar o time adversário
   - Responda aos desafios através do modal centralizado
5. **Vencendo**: Primeiro time a chegar a 12 pontos vence!

## 🏗️ Estrutura do projeto

```
truco-lan/
├── client/              # Frontend React + TypeScript + Vite
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── App.tsx      # Componente principal
│   │   └── main.tsx     # Entry point
│   └── package.json
│
├── server/              # Backend Node.js + Socket.IO
│   ├── server.js        # Servidor principal
│   ├── gameLogic.js     # Lógica do jogo
│   └── package.json
│
└── README.md
```

## 🎯 Regras do Truco

- Cada jogador recebe 3 cartas
- São jogadas 3 rodadas (no máximo) por mão
- Vence quem ganhar 2 rodadas (melhor de 3)
- Em caso de empate na primeira rodada, a segunda decide
- Valores das apostas: 3 (Truco), 6, 9, 12
- Apenas o time que aceitou pode aumentar a aposta
- Quem "corre" perde a mão automaticamente

## 🛠️ Tecnologias utilizadas

### Frontend
- React 18
- TypeScript
- Vite
- Socket.IO Client

### Backend
- Node.js
- Express
- Socket.IO
- CORS

## 📝 Funcionalidades especiais

- ✅ **Modal de Truco**: Interface bloqueante e intuitiva para responder desafios
- 💬 **Chat com Highlights**: Acompanhe todos os eventos importantes da partida
- 🎨 **Indicadores visuais**: Badges de times, status de truco, vez do jogador
- 📊 **Histórico completo**: Veja o resultado de cada rodada
- 🔄 **Sincronização em tempo real**: Todos os jogadores veem as ações instantaneamente

## 👨‍💻 Desenvolvedor

Desenvolvido como projeto de estudo de jogos multiplayer em tempo real.

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar!
