const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { 
  iniciarNovaPartida, 
  exibirMaos, 
  determinarVencedorDaRodada, 
  verificarVencedorDaMao, 
  iniciarNovaMao, 
  processarPedidoTruco, 
  processarRespostaTruco, 
  reiniciarTruco,
  proximoJogadorHorario 
} = require('./gameLogic');

const app = express();
const server = http.createServer(app);

// Estrutura de dados para armazenar jogadores online
const jogadoresOnline = new Map(); // { socketId: nomeJogador }

// Estado da partida atual
let partidaAtual = null;

// Função para enviar highlight ao chat
function enviarHighlightChat(icone, mensagem, tipo = 'info') {
  if (!partidaAtual) return;
  
  const highlight = {
    id: `highlight-${Date.now()}-${Math.random()}`,
    jogadorId: 'SISTEMA',
    nome: '🎮 PARTIDA',
    mensagem: `${icone} ${mensagem}`,
    timestamp: new Date().toISOString(),
    tipo: tipo // 'info', 'truco', 'rodada', 'mao'
  };
  
  console.log(`📢 Highlight: ${mensagem}`);
  io.emit('novaMensagemChat', highlight);
}

// Função auxiliar para enviar lista de jogadores para todos os clientes
function enviarListaDeJogadores() {
  const listaDeNomes = Array.from(jogadoresOnline.values());
  io.emit('atualizarListaDeJogadores', listaDeNomes);
  console.log(`📡 Lista enviada para todos os clientes: [${listaDeNomes.join(', ')}]`);
}

// Função para enviar estado personalizado para cada jogador
function enviarEstadoPersonalizado() {
  if (!partidaAtual) return;

  for (const [socketId, nomeJogador] of jogadoresOnline.entries()) {
    if (partidaAtual.jogadoresIds.includes(socketId)) {
      const dadosPersonalizados = {
        vira: partidaAtual.vira,
        manilhas: partidaAtual.manilhas,
        vezDoJogador: partidaAtual.vezDoJogador,
        rodadaAtual: partidaAtual.rodadaAtual,
        jogadoresIds: partidaAtual.jogadoresIds,
        placar: partidaAtual.placar,
        placarGeral: partidaAtual.placarGeral,
        resultadosRodadas: partidaAtual.resultadosRodadas,
        nomes: partidaAtual.nomes,
        numeroMao: partidaAtual.numeroMao,
        valorDaMao: partidaAtual.valorDaMao,
        truco: partidaAtual.truco,  // Estado do truco
        minhasCartas: partidaAtual.maos[socketId] || [],
        cartasNaMesa: partidaAtual.cartasNaMesa || [],
        meuId: socketId,
        meuNome: nomeJogador,
        totalJogadores: partidaAtual.jogadoresIds.length
      };

      console.log(`🔍 DEBUG - Enviando para ${nomeJogador}:`, {
        truco: partidaAtual.truco,
        temTruco: !!partidaAtual.truco,
        statusTruco: partidaAtual.truco?.status
      });

      io.to(socketId).emit('partidaAtualizada', dadosPersonalizados);
    }
  }
  
  console.log('📤 Estado atualizado enviado para todos os jogadores');
}

// Função para iniciar uma nova partida
function tentarIniciarPartida() {
  const numeroJogadores = jogadoresOnline.size;
  
  // Verifica se há jogadores suficientes (2 ou 4)
  if (numeroJogadores >= 2) {
    try {
      console.log(`\n🎮 Iniciando partida com ${numeroJogadores} jogadores...`);
      
      // Inicia nova partida
      partidaAtual = iniciarNovaPartida(jogadoresOnline);
      
      // Exibe as mãos no console do servidor (para debug)
      exibirMaos(partidaAtual.maos, jogadoresOnline);
      
      // Envia dados personalizados para cada jogador
      for (const [socketId, cartas] of Object.entries(partidaAtual.maos)) {
        const nomeJogador = jogadoresOnline.get(socketId);
        
        // Dados personalizados para este jogador
        const dadosPersonalizados = {
          // Informações públicas (todos veem)
          vira: partidaAtual.vira,
          manilhas: partidaAtual.manilhas,
          vezDoJogador: partidaAtual.vezDoJogador,
          rodadaAtual: partidaAtual.rodadaAtual,
          jogadoresIds: partidaAtual.jogadoresIds,
          placar: partidaAtual.placar,
          placarGeral: partidaAtual.placarGeral,
          resultadosRodadas: partidaAtual.resultadosRodadas,
          nomes: partidaAtual.nomes,
          numeroMao: partidaAtual.numeroMao,
          valorDaMao: partidaAtual.valorDaMao,
          truco: partidaAtual.truco,  // Estado do truco
          cartasNaMesa: partidaAtual.cartasNaMesa || [],
          
          // Informação privada (só este jogador vê)
          minhasCartas: cartas,
          
          // Informações úteis
          meuId: socketId,
          meuNome: nomeJogador,
          totalJogadores: numeroJogadores
        };
        
        io.to(socketId).emit('partidaIniciada', dadosPersonalizados);
        console.log(`📤 Dados enviados para ${nomeJogador} (${socketId})`);
        console.log(`🔍 DEBUG - Truco enviado para ${nomeJogador}:`, {
          temTruco: !!dadosPersonalizados.truco,
          statusTruco: dadosPersonalizados.truco?.status
        });
      }
      
      console.log('✅ Partida iniciada e dados personalizados enviados para todos!\n');
      
    } catch (error) {
      console.error('❌ Erro ao iniciar partida:', error.message);
    }
  } else {
    console.log(`⏳ Precisa de pelo menos 2 jogadores. Atual: ${numeroJogadores}`);
  }
}

// Configuração do CORS para permitir conexões do Vite
app.use(cors({
  origin: [' *'],
  methods: ['GET', 'POST']
}));

// Configuração do Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['*'],
    methods: ['GET', 'POST']
  }
});

// Listener para novas conexões
io.on('connection', (socket) => {
  console.log(`Novo usuário conectado: ${socket.id}`);

  // Listener para quando um jogador entra no jogo
  socket.on('entrarNoJogo', (nomeJogador) => {
    // Adiciona o jogador à lista de jogadores online
    jogadoresOnline.set(socket.id, nomeJogador);
    
    console.log(`🎮 Jogador "${nomeJogador}" (ID: ${socket.id}) entrou no jogo.`);
    console.log(`📊 Total de jogadores online: ${jogadoresOnline.size}`);
    
    // Lista todos os jogadores online no console
    console.log('👥 Jogadores no lobby:');
    for (const [socketId, nome] of jogadoresOnline.entries()) {
      console.log(`   - ${nome} (${socketId})`);
    }
    console.log('─'.repeat(50));
    
    // Envia lista atualizada para todos os clientes
    enviarListaDeJogadores();
    
    // Tenta iniciar partida se há jogadores suficientes
    tentarIniciarPartida();
  });

  // Listener para iniciar partida manualmente
  socket.on('iniciarPartida', () => {
    const nomeJogador = jogadoresOnline.get(socket.id);
    if (nomeJogador) {
      console.log(`🎯 ${nomeJogador} solicitou iniciar partida manualmente`);
      tentarIniciarPartida();
    }
  });

  // Listener para jogar carta
  socket.on('jogarCarta', (dadosCarta) => {
    console.log(`🃏 Tentativa de jogar carta de ${socket.id}:`, dadosCarta);
    
    // Verificações de validação
    if (!partidaAtual || !dadosCarta) {
      console.log('❌ Estado da partida inválido ou dados da carta ausentes');
      return;
    }

    // Verifica se é a vez do jogador
    if (partidaAtual.vezDoJogador !== socket.id) {
      const nomeJogador = jogadoresOnline.get(socket.id);
      console.log(`❌ Não é a vez de ${nomeJogador} (${socket.id}) jogar`);
      return;
    }

    // Verifica se o jogador possui a carta
    const indexCarta = partidaAtual.maos[socket.id].findIndex(carta => 
      carta.valor === dadosCarta.valor && carta.naipe === dadosCarta.naipe
    );

    if (indexCarta === -1) {
      const nomeJogador = jogadoresOnline.get(socket.id);
      console.log(`❌ ${nomeJogador} não possui a carta ${dadosCarta.valor} de ${dadosCarta.naipe}`);
      return;
    }

    // Jogada válida - processa a carta
    const nomeJogador = jogadoresOnline.get(socket.id);
    console.log(`✅ ${nomeJogador} jogou ${dadosCarta.valor} de ${dadosCarta.naipe}`);

    // Remove a carta da mão do jogador
    const cartaJogada = partidaAtual.maos[socket.id].splice(indexCarta, 1)[0];

    // Verifica se a carta jogada é uma manilha e atualiza sua força
    console.log(`🔍 Verificando manilhas...`);
    console.log(`   Carta jogada: ${cartaJogada.valor} de ${cartaJogada.naipe} (força atual: ${cartaJogada.forca})`);
    console.log(`   Manilhas disponíveis:`, partidaAtual.manilhas.map(m => `${m.valor} de ${m.naipe} (força ${m.forca})`));
    
    const manilhaCorrespondente = partidaAtual.manilhas.find(
      manilha => manilha.valor === cartaJogada.valor && manilha.naipe === cartaJogada.naipe
    );
    
    if (manilhaCorrespondente) {
      const forcaAnterior = cartaJogada.forca;
      cartaJogada.forca = manilhaCorrespondente.forca;
      cartaJogada.tipo = 'manilha';
      console.log(`🔥 Carta é MANILHA! Força atualizada de ${forcaAnterior} para ${cartaJogada.forca}`);
    } else {
      console.log(`   Não é manilha, mantém força ${cartaJogada.forca}`);
    }

    // Adiciona a carta na mesa
    if (!partidaAtual.cartasNaMesa) {
      partidaAtual.cartasNaMesa = [];
    }
    partidaAtual.cartasNaMesa.push({
      carta: cartaJogada,
      jogador: nomeJogador,
      socketId: socket.id
    });

    console.log(`🃏 Carta adicionada à mesa. Total de cartas: ${partidaAtual.cartasNaMesa.length}`);

    // Determina o próximo jogador no sentido horário
    const jogadoresIds = partidaAtual.jogadoresIds;
    
    if (jogadoresIds.length === 4) {
      // Para 4 jogadores, usa ordem horária: 0→3→1→2→0
      partidaAtual.vezDoJogador = proximoJogadorHorario(socket.id, jogadoresIds);
    } else {
      // Para 2 jogadores, alternância simples
      const indiceAtual = jogadoresIds.indexOf(socket.id);
      const proximoIndice = (indiceAtual + 1) % jogadoresIds.length;
      partidaAtual.vezDoJogador = jogadoresIds[proximoIndice];
    }

    console.log(`🔄 Próximo jogador: ${jogadoresOnline.get(partidaAtual.vezDoJogador)}`);

    // ENVIA O ESTADO IMEDIATAMENTE APÓS A JOGADA
    enviarEstadoPersonalizado();

    // Verifica se a rodada terminou (todos jogaram)
    if (partidaAtual.cartasNaMesa.length === partidaAtual.jogadoresIds.length) {
      console.log('🏁 Rodada terminou! Determinando vencedor...');
      console.log('🃏 Cartas na mesa:');
      partidaAtual.cartasNaMesa.forEach(c => {
        console.log(`   ${c.jogador}: ${c.carta.valor} de ${c.carta.naipe} (força: ${c.carta.forca})`);
      });
      
      // Determina o vencedor da rodada
      const resultadoRodada = determinarVencedorDaRodada(partidaAtual);
      console.log(`📊 Resultado da rodada: ${resultadoRodada.detalhes}`);
      
      // Envia highlight da rodada
      if (resultadoRodada.vencedor) {
        const nomeVencedor = partidaAtual.nomes[resultadoRodada.vencedor];
        enviarHighlightChat('🏆', `${nomeVencedor} venceu a rodada ${partidaAtual.rodadaAtual}!`, 'rodada');
      } else if (resultadoRodada.empate) {
        enviarHighlightChat('🤝', `Rodada ${partidaAtual.rodadaAtual} empatou!`, 'rodada');
      }
      
      // Adiciona o resultado às rodadas
      if (!partidaAtual.resultadosRodadas) {
        partidaAtual.resultadosRodadas = [];
      }
      partidaAtual.resultadosRodadas.push(resultadoRodada);
      
      // Define quem começa a próxima rodada
      if (resultadoRodada.vencedor) {
        partidaAtual.vezDoJogador = resultadoRodada.vencedor;
      } // Se empatou, mantém o próximo jogador
      
      // Envia estado com as cartas na mesa ANTES de limpar
      enviarEstadoPersonalizado();
      
      // Aguarda 3 segundos antes de limpar a mesa para mostrar o resultado
      setTimeout(() => {
        // Limpa a mesa para a próxima rodada
        partidaAtual.cartasNaMesa = [];
        partidaAtual.rodadaAtual++;
        
        // Envia estado atualizado após limpar a mesa
        enviarEstadoPersonalizado();
        
        // Verifica se a mão terminou
        const resultadoMao = verificarVencedorDaMao(partidaAtual);
        
        if (resultadoMao.terminouMao) {
          console.log(`🏆 Mão terminou: ${resultadoMao.detalhes}`);
          
          // Atualiza placar geral se houve vencedor
          if (resultadoMao.vencedor) {
            partidaAtual.placarGeral[resultadoMao.vencedor] += partidaAtual.valorDaMao;
            console.log(`📈 Placar atualizado: ${partidaAtual.nomes[resultadoMao.vencedor]} +${partidaAtual.valorDaMao} ponto(s)`);
            
            // Envia highlight da mão
            const nomeVencedor = partidaAtual.nomes[resultadoMao.vencedor];
            enviarHighlightChat('🎊', `${nomeVencedor} venceu a mão e ganhou ${partidaAtual.valorDaMao} ponto(s)!`, 'mao');
          }
          
          // Envia estado final da mão
          enviarEstadoPersonalizado();
          
          // Agenda nova mão após 4 segundos
          setTimeout(() => {
            console.log('🔄 Iniciando nova mão...');
            partidaAtual = iniciarNovaMao(partidaAtual, jogadoresOnline);
            enviarEstadoPersonalizado();
          }, 4000);
        }
      }, 3000);
    } else {
      // Envia estado atualizado para todos os jogadores
      enviarEstadoPersonalizado();
    }
  });

  // Listener para pedido de truco
  socket.on('pedirTruco', () => {
    console.log(`🎯 ${socket.id} pediu TRUCO!`);
    
    if (!partidaAtual || partidaAtual.status !== 'em_andamento') {
      socket.emit('erro', { mensagem: 'Não há partida em andamento' });
      return;
    }
    
    const resultado = processarPedidoTruco(partidaAtual, socket.id);
    
    if (!resultado.sucesso) {
      socket.emit('erro', { mensagem: resultado.mensagem });
      return;
    }
    
    // Envia highlight do truco
    const nomeDesafiante = jogadoresOnline.get(socket.id);
    const valorTexto = partidaAtual.truco.valor === 3 ? 'TRUCO' : 
                       partidaAtual.truco.valor === 6 ? 'SEIS' :
                       partidaAtual.truco.valor === 9 ? 'NOVE' : 'DOZE';
    enviarHighlightChat('🎯', `${nomeDesafiante} pediu ${valorTexto}! (${partidaAtual.truco.valor} pontos)`, 'truco');
    
    // Notificar todos os jogadores sobre o pedido de truco
    const dadosTruco = {
      desafiante: socket.id,
      desafiados: partidaAtual.truco.desafiados,
      valor: partidaAtual.truco.valor,
      proximoValor: partidaAtual.truco.proximoValor,
      mensagem: resultado.mensagem,
      mensagemMesa: resultado.mensagemMesa
    };
    
    // Enviar para todos os jogadores da partida
    partidaAtual.jogadoresIds.forEach(jogadorId => {
      io.to(jogadorId).emit('trucoSolicitado', dadosTruco);
    });
    
    console.log('🎯 Evento trucoSolicitado enviado para todos os jogadores');
    
    // Enviar estado atualizado
    enviarEstadoPersonalizado();
  });

  // Listener para resposta ao truco
  socket.on('responderTruco', (dados) => {
    console.log(`📋 ${socket.id} respondeu ao TRUCO:`, dados.resposta);
    
    if (!partidaAtual || partidaAtual.status !== 'em_andamento') {
      socket.emit('erro', { mensagem: 'Não há partida em andamento' });
      return;
    }
    
    const resultado = processarRespostaTruco(partidaAtual, socket.id, dados.resposta);
    
    if (!resultado.sucesso) {
      socket.emit('erro', { mensagem: resultado.mensagem });
      return;
    }
    
    // Envia highlight da resposta
    const nomeRespondedor = jogadoresOnline.get(socket.id);
    if (dados.resposta === 'aceitou') {
      enviarHighlightChat('✅', `${nomeRespondedor} aceitou o truco!`, 'truco');
    } else if (dados.resposta === 'aumentou') {
      const valorTexto = partidaAtual.truco.valor === 6 ? 'SEIS' :
                         partidaAtual.truco.valor === 9 ? 'NOVE' : 'DOZE';
      enviarHighlightChat('🔥', `${nomeRespondedor} pediu ${valorTexto}! (${partidaAtual.truco.valor} pontos)`, 'truco');
    } else if (dados.resposta === 'correu') {
      enviarHighlightChat('🏃', `${nomeRespondedor} correu do truco!`, 'truco');
    }
    
    // Notificar todos sobre a resposta
    const dadosResposta = {
      respondedor: socket.id,
      resposta: dados.resposta,
      valor: partidaAtual.truco.valor,
      acao: resultado.acao,
      mensagem: resultado.mensagem,
      mensagemMesa: resultado.mensagemMesa
    };
    
    // Enviar para todos os jogadores da partida
    partidaAtual.jogadoresIds.forEach(jogadorId => {
      io.to(jogadorId).emit('trucoRespondido', dadosResposta);
    });
    
    console.log('📋 Evento trucoRespondido enviado para todos os jogadores');
    
    // Ações específicas baseadas na resposta
    if (resultado.acao === 'fimDaMao') {
      // Verificar se alguém ganhou o jogo
      const vencedorJogo = Object.entries(partidaAtual.placarGeral)
        .find(([id, pontos]) => pontos >= 12);
      
      if (vencedorJogo) {
        console.log(`🏅 ${vencedorJogo[0]} ganhou o jogo com ${vencedorJogo[1]} pontos!`);
        
        partidaAtual.status = 'finalizada';
        partidaAtual.vencedorFinal = vencedorJogo[0];
        
        enviarEstadoPersonalizado();
        return;
      }
      
      // Agenda nova mão após 2 segundos
      setTimeout(() => {
        console.log('🆕 Nova mão iniciada após truco!');
        partidaAtual = iniciarNovaMao(partidaAtual, jogadoresOnline);
        enviarEstadoPersonalizado();
      }, 2000);
    }
    
    // Enviar estado atualizado
    enviarEstadoPersonalizado();
  });

  // Listener para desconexões
  socket.on('disconnect', () => {
    // Remove o jogador da lista se ele estava logado
    const nomeJogador = jogadoresOnline.get(socket.id);
    
    if (nomeJogador) {
      jogadoresOnline.delete(socket.id);
      console.log(`🚪 Jogador "${nomeJogador}" (ID: ${socket.id}) saiu do jogo.`);
      console.log(`📊 Total de jogadores online: ${jogadoresOnline.size}`);
      
      // Envia lista atualizada para todos os clientes
      enviarListaDeJogadores();
    } else {
      console.log(`❌ Usuário desconectou: ${socket.id}`);
    }
  });

  // Listener para mensagens do chat
  socket.on('enviarMensagemChat', (dados) => {
    const nomeJogador = jogadoresOnline.get(socket.id);
    
    if (!nomeJogador) {
      socket.emit('erro', { mensagem: 'Você precisa estar conectado para enviar mensagens' });
      return;
    }

    const mensagem = dados.mensagem?.trim();
    
    if (!mensagem || mensagem.length === 0) {
      return;
    }

    // Limita o tamanho da mensagem
    const mensagemLimitada = mensagem.substring(0, 200);
    
    console.log(`💬 ${nomeJogador}: ${mensagemLimitada}`);

    // Envia a mensagem para todos os jogadores
    const mensagemChat = {
      id: `${socket.id}-${Date.now()}`,
      jogadorId: socket.id,
      nome: nomeJogador,
      mensagem: mensagemLimitada,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Enviando mensagem para todos:', mensagemChat);
    io.emit('novaMensagemChat', mensagemChat);
    console.log('✅ Mensagem emitida!');
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});