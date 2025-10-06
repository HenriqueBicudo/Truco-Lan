/**
 * LÓGICA DO JOGO DE TRUCO
 * 
 * Este módulo contém toda a lógica central do jogo de Truco,
 * separada da lógica de rede (Socket.IO).
 */

// Definição das cartas e suas forças no Truco
const CARTAS_BASE = [
  
  // 4
  { valor: '4', naipe: 'Ouros', forca: 1 },
  { valor: '4', naipe: 'Espadas', forca: 1 },
  { valor: '4', naipe: 'Copas', forca: 1 },
  { valor: '4', naipe: 'Paus', forca: 1 },
  
  // 5
  { valor: '5', naipe: 'Ouros', forca: 2 },
  { valor: '5', naipe: 'Espadas', forca: 2 },
  { valor: '5', naipe: 'Copas', forca: 2 },
  { valor: '5', naipe: 'Paus', forca: 2 },
  
  // 6
  { valor: '6', naipe: 'Ouros', forca: 3 },
  { valor: '6', naipe: 'Espadas', forca: 3 },
  { valor: '6', naipe: 'Copas', forca: 3 },
  { valor: '6', naipe: 'Paus', forca: 3 },
  
  // 7
  { valor: '7', naipe: 'Ouros', forca: 4 },
  { valor: '7', naipe: 'Espadas', forca: 4 },
  { valor: '7', naipe: 'Copas', forca: 4 },
  { valor: '7', naipe: 'Paus', forca: 4 },
  
  // Dama (Q)
  { valor: 'Q', naipe: 'Ouros', forca: 5 },
  { valor: 'Q', naipe: 'Espadas', forca: 5 },
  { valor: 'Q', naipe: 'Copas', forca: 5 },
  { valor: 'Q', naipe: 'Paus', forca: 5 },
  
  // Valete (J)
  { valor: 'J', naipe: 'Ouros', forca: 6 },
  { valor: 'J', naipe: 'Espadas', forca: 6 },
  { valor: 'J', naipe: 'Copas', forca: 6 },
  { valor: 'J', naipe: 'Paus', forca: 6 },
  
  // Rei (K)
  { valor: 'K', naipe: 'Ouros', forca: 7 },
  { valor: 'K', naipe: 'Espadas', forca: 7 },
  { valor: 'K', naipe: 'Copas', forca: 7 },
  { valor: 'K', naipe: 'Paus', forca: 7 },
  // Ás (1)
  { valor: 'A', naipe: 'Ouros', forca: 8 },
  { valor: 'A', naipe: 'Espadas', forca: 8 },
  { valor: 'A', naipe: 'Copas', forca: 8 },
  { valor: 'A', naipe: 'Paus', forca: 8 },
  
  // 2
  { valor: '2', naipe: 'Ouros', forca: 9 },
  { valor: '2', naipe: 'Espadas', forca: 9 },
  { valor: '2', naipe: 'Copas', forca: 9 },
  { valor: '2', naipe: 'Paus', forca: 9 },
  
  // 3
  { valor: '3', naipe: 'Ouros', forca: 10 },
  { valor: '3', naipe: 'Espadas', forca: 10 },
  { valor: '3', naipe: 'Copas', forca: 10 },
  { valor: '3', naipe: 'Paus', forca: 10 }
];

/**
 * Cria um baralho completo de Truco (40 cartas)
 * @returns {Array} Array com 40 objetos Carta
 */
function criarBaralho() {
  // Retorna uma cópia do baralho base para evitar mutações
  return CARTAS_BASE.map(carta => ({ ...carta }));
}

/**
 * Embaralha um array usando o algoritmo Fisher-Yates
 * @param {Array} array - Array a ser embaralhado
 * @returns {Array} Array embaralhado
 */
function embaralhar(array) {
  const arrayEmbaralhado = [...array];
  
  for (let i = arrayEmbaralhado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrayEmbaralhado[i], arrayEmbaralhado[j]] = [arrayEmbaralhado[j], arrayEmbaralhado[i]];
  }
  
  return arrayEmbaralhado;
}

/**
 * Determina a qual time pertence um jogador (para 4 jogadores)
 * Baseado na posição visual na mesa:
 * Time Y (eixo vertical): Jogadores índice 0 e 1 (sul e norte)
 * Time X (eixo horizontal): Jogadores índice 2 e 3 (leste e oeste)
 * @param {string} jogadorId - ID do jogador
 * @param {Array} jogadoresIds - Array ordenado de IDs dos jogadores
 * @returns {string} - 'Y' ou 'X'
 */
function determinarTime(jogadorId, jogadoresIds) {
  const indice = jogadoresIds.indexOf(jogadorId);
  console.log(`🔍 DEBUG determinarTime - Jogador índice: ${indice}, Time: ${(indice === 0 || indice === 1) ? 'Y' : 'X'}`);
  // Índices 0 e 1 são time Y (vertical), índices 2 e 3 são time X (horizontal)
  return (indice === 0 || indice === 1) ? 'Y' : 'X';
}

/**
 * Determina as manilhas baseadas na carta vira
 * @param {Object} vira - Carta que foi virada
 * @returns {Array} Array com as 4 manilhas em ordem de força
 */
function determinarManilhas(vira) {
  // Mapa de valores para determinar a próxima carta
  const proximoValor = {
    'A': '2',
    '2': '3',
    '3': '4',
    '4': '5',
    '5': '6',
    '6': '7',
    '7': 'Q',
    'Q': 'J',
    'J': 'K',
    'K': 'A'
  };
  
  const valorManilha = proximoValor[vira.valor];
  
  console.log(`🎯 Vira: ${vira.valor} de ${vira.naipe}`);
  console.log(`🃏 Manilhas: ${valorManilha} de Ouros, ${valorManilha} de Espadas, ${valorManilha} de Copas, ${valorManilha} de Paus`);
  
  // Ordem de força das manilhas (do mais fraco ao mais forte)
  return [
    { valor: valorManilha, naipe: 'Ouros', forca: 11, tipo: 'manilha' },
    { valor: valorManilha, naipe: 'Espadas', forca: 12, tipo: 'manilha' },
    { valor: valorManilha, naipe: 'Copas', forca: 13, tipo: 'manilha' },
    { valor: valorManilha, naipe: 'Paus', forca: 14, tipo: 'manilha' }
  ];
}

/**
 * Distribui cartas para os jogadores
 * @param {Array} baralhoEmbaralhado - Baralho já embaralhado
 * @param {Array} jogadoresIds - Array com IDs dos jogadores
 * @returns {Object} Objeto com as mãos de cada jogador
 */
function distribuirCartas(baralhoEmbaralhado, jogadoresIds) {
  const maos = {};
  
  // Cada jogador recebe 3 cartas
  jogadoresIds.forEach((jogadorId, index) => {
    maos[jogadorId] = [
      baralhoEmbaralhado[index],                    // 1ª carta
      baralhoEmbaralhado[index + jogadoresIds.length],     // 2ª carta
      baralhoEmbaralhado[index + (jogadoresIds.length * 2)] // 3ª carta
    ];
  });
  
  return maos;
}

/**
 * Função principal para iniciar uma nova partida de Truco
 * @param {Map|Object} jogadores - Map ou objeto com os jogadores online
 * @returns {Object} Estado completo da partida
 */
function iniciarNovaPartida(jogadores) {
  // Converte Map para Array se necessário
  let jogadoresIds;
  if (jogadores instanceof Map) {
    jogadoresIds = Array.from(jogadores.keys());
  } else {
    jogadoresIds = Object.keys(jogadores);
  }
  
  // Validação: Truco precisa de 2 ou 4 jogadores
  if (jogadoresIds.length !== 2 && jogadoresIds.length !== 4) {
    throw new Error(`Truco precisa de 2 ou 4 jogadores. Jogadores atuais: ${jogadoresIds.length}`);
  }
  
  console.log(`🎴 Iniciando nova partida com ${jogadoresIds.length} jogadores`);
  
  // 1. Criar e embaralhar o baralho
  const baralho = criarBaralho();
  const baralhoEmbaralhado = embaralhar(baralho);
  
  // 2. Virar uma carta (vira)
  const vira = baralhoEmbaralhado[jogadoresIds.length * 3]; // Primeira carta após distribuição
  
  // 3. Determinar manilhas
  const manilhas = determinarManilhas(vira);
  
  // 4. Distribuir cartas para os jogadores
  const maos = distribuirCartas(baralhoEmbaralhado, jogadoresIds);
  
  // 5. Determinar quem joga primeiro (primeiro jogador da lista)
  const vezDoJogador = jogadoresIds[0];
  
  // 6. Criar estado da partida
  const estadoDaPartida = {
    vira,
    manilhas,
    maos,
    vezDoJogador,
    jogadoresIds,
    rodadaAtual: 1,
    cartasJogadas: [],
    cartasNaMesa: [],
    resultadosRodadas: [],
    placar: {},
    placarGeral: {},
    nomes: {},
    numeroMao: 1,
    valorDaMao: 1,
    truco: {
      status: 'inativo',     // inativo, pendente, ativo
      valor: 3,              // 3, 6, 9, 12
      desafiante: null,      // socketId do jogador que desafiou
      desafiados: [],        // array de socketIds dos jogadores desafiados
      respostas: {},         // objeto com respostas de cada desafiado
      proximoValor: 3,       // próximo valor possível do desafio
      timeQueAceitou: null,  // time que aceitou o último pedido (Y ou X)
      ultimoQueAceitou: null // para 2 jogadores: ID de quem aceitou
    },
    iniciada: true,
    status: 'em_andamento',  // status da partida
    timestampInicio: new Date().toISOString()
  };
  
  console.log(`🔍 DEBUG - Estado da partida criado:`, {
    temTruco: !!estadoDaPartida.truco,
    truco: estadoDaPartida.truco
  });
  
  // Inicializar placares e nomes
  if (jogadores instanceof Map) {
    jogadoresIds.forEach(id => {
      estadoDaPartida.placar[id] = 0;
      estadoDaPartida.placarGeral[id] = 0;
      estadoDaPartida.nomes[id] = jogadores.get(id);
    });
  } else {
    jogadoresIds.forEach(id => {
      estadoDaPartida.placar[id] = 0;
      estadoDaPartida.placarGeral[id] = 0;
      estadoDaPartida.nomes[id] = jogadores[id];
    });
  }
  
  console.log(`🎯 Vira: ${vira.valor} de ${vira.naipe}`);
  console.log(`🃏 Manilhas: ${manilhas.map(m => `${m.valor} de ${m.naipe}`).join(', ')}`);
  console.log(`👤 Primeiro a jogar: ${vezDoJogador}`);
  
  return estadoDaPartida;
}

/**
 * Utilitário para exibir uma carta de forma legível
 * @param {Object} carta - Objeto carta
 * @returns {string} Representação textual da carta
 */
function cartaParaTexto(carta) {
  return `${carta.valor} de ${carta.naipe}`;
}

/**
 * Utilitário para exibir as mãos de todos os jogadores (para debug)
 * @param {Object} maos - Objeto com as mãos dos jogadores
 * @param {Map|Object} jogadores - Jogadores com seus nomes
 */
function exibirMaos(maos, jogadores) {
  console.log('\n🃏 MÃOS DOS JOGADORES:');
  Object.keys(maos).forEach(jogadorId => {
    const nomeJogador = jogadores instanceof Map ? 
      jogadores.get(jogadorId) : 
      jogadores[jogadorId];
    
    const cartasTexto = maos[jogadorId].map(cartaParaTexto).join(', ');
    console.log(`   ${nomeJogador}: ${cartasTexto}`);
  });
  console.log('');
}

/**
 * Determina o vencedor de uma rodada baseado nas cartas jogadas
 * @param {Object} partida - Estado atual da partida
 * @returns {Object} - { vencedor: socketId|null, empate: boolean, detalhes: string }
 */
function determinarVencedorDaRodada(partida) {
  const cartasNaMesa = partida.cartasNaMesa || [];
  
  if (cartasNaMesa.length === 0) {
    return { vencedor: null, empate: false, detalhes: "Nenhuma carta na mesa" };
  }
  
  // Ordena as cartas por força (maior força primeiro)
  const cartasOrdenadas = cartasNaMesa
    .map(cartaInfo => ({
      ...cartaInfo,
      forca: cartaInfo.carta.forca
    }))
    .sort((a, b) => b.forca - a.forca);
  
  const cartaMaisForte = cartasOrdenadas[0];
  const segundaCartaMaisForte = cartasOrdenadas[1];
  
  // Verifica empate (cartas com mesma força)
  if (segundaCartaMaisForte && cartaMaisForte.forca === segundaCartaMaisForte.forca) {
    return { 
      vencedor: null, 
      empate: true, 
      detalhes: `Empate! ${cartaMaisForte.carta.valor} de ${cartaMaisForte.carta.naipe} vs ${segundaCartaMaisForte.carta.valor} de ${segundaCartaMaisForte.carta.naipe}` 
    };
  }
  
  return { 
    vencedor: cartaMaisForte.socketId, 
    empate: false, 
    detalhes: `${cartaMaisForte.jogador} venceu com ${cartaMaisForte.carta.valor} de ${cartaMaisForte.carta.naipe}` 
  };
}

/**
 * Verifica se um jogador/time venceu a mão (melhor de 3 rodadas)
 * @param {Object} partida - Estado atual da partida
 * @returns {Object} - { vencedor: socketId|null, terminouMao: boolean, detalhes: string }
 */
function verificarVencedorDaMao(partida) {
  const resultadosRodadas = partida.resultadosRodadas || [];
  const numRodadas = resultadosRodadas.length;
  
  if (numRodadas === 0) {
    return { vencedor: null, terminouMao: false, detalhes: "Nenhuma rodada jogada" };
  }
  
  // Para 2 jogadores: individual
  if (partida.jogadoresIds.length === 2) {
    const jogador1 = partida.jogadoresIds[0];
    const jogador2 = partida.jogadoresIds[1];
    
    let vitoriasJ1 = 0;
    let vitoriasJ2 = 0;
    let empates = 0;
    
    resultadosRodadas.forEach(resultado => {
      if (resultado.empate) {
        empates++;
      } else if (resultado.vencedor === jogador1) {
        vitoriasJ1++;
      } else if (resultado.vencedor === jogador2) {
        vitoriasJ2++;
      }
    });
    
    // Regras do Truco:
    // 1. Primeiro a ganhar 2 rodadas vence a mão
    if (vitoriasJ1 >= 2) {
      return { vencedor: jogador1, terminouMao: true, detalhes: `${partida.nomes[jogador1]} venceu a mão! (2+ vitórias)` };
    }
    if (vitoriasJ2 >= 2) {
      return { vencedor: jogador2, terminouMao: true, detalhes: `${partida.nomes[jogador2]} venceu a mão! (2+ vitórias)` };
    }
    
    // 2. Se jogaram 3 rodadas, quem tem mais vitórias ganha
    if (numRodadas === 3) {
      if (vitoriasJ1 > vitoriasJ2) {
        return { vencedor: jogador1, terminouMao: true, detalhes: `${partida.nomes[jogador1]} venceu a mão! (${vitoriasJ1}x${vitoriasJ2})` };
      } else if (vitoriasJ2 > vitoriasJ1) {
        return { vencedor: jogador2, terminouMao: true, detalhes: `${partida.nomes[jogador2]} venceu a mão! (${vitoriasJ2}x${vitoriasJ1})` };
      } else {
        return { vencedor: null, terminouMao: true, detalhes: "Mão empatada! Ninguém pontua." };
      }
    }
    
    // 3. Regras especiais para empates
    if (numRodadas === 2) {
      // Se a primeira foi empate e a segunda teve vencedor
      if (resultadosRodadas[0].empate && !resultadosRodadas[1].empate) {
        const vencedor = resultadosRodadas[1].vencedor;
        return { vencedor, terminouMao: true, detalhes: `${partida.nomes[vencedor]} venceu a mão! (1ª empatou, 2ª venceu)` };
      }
      // Se a primeira teve vencedor e a segunda empatou
      if (!resultadosRodadas[0].empate && resultadosRodadas[1].empate) {
        const vencedor = resultadosRodadas[0].vencedor;
        return { vencedor, terminouMao: true, detalhes: `${partida.nomes[vencedor]} venceu a mão! (1ª venceu, 2ª empatou)` };
      }
    }
  }
  
  // Para 4 jogadores: times baseados nos eixos visuais
  if (partida.jogadoresIds.length === 4) {
    // Time Y (eixo vertical): jogadores 0 e 1 (sul e norte - pontas cima/baixo)
    // Time X (eixo horizontal): jogadores 2 e 3 (leste e oeste - pontas laterais)
    const timeY = [partida.jogadoresIds[0], partida.jogadoresIds[1]];
    const timeX = [partida.jogadoresIds[2], partida.jogadoresIds[3]];
    
    let vitoriasTimeY = 0;
    let vitoriasTimeX = 0;
    let empates = 0;
    
    resultadosRodadas.forEach(resultado => {
      if (resultado.empate) {
        empates++;
      } else if (timeY.includes(resultado.vencedor)) {
        vitoriasTimeY++;
      } else if (timeX.includes(resultado.vencedor)) {
        vitoriasTimeX++;
      }
    });
    
    console.log(`📊 Placar da mão - Time Y (vertical): ${vitoriasTimeY} x Time X (horizontal): ${vitoriasTimeX} (Empates: ${empates})`);
    
    // Regras do Truco:
    // 1. Primeiro time a ganhar 2 rodadas vence a mão
    if (vitoriasTimeY >= 2) {
      const vencedor = resultadosRodadas[numRodadas - 1].vencedor || timeY[0];
      return { vencedor, time: 'Y', terminouMao: true, detalhes: `Time Y venceu a mão! (2+ vitórias)` };
    }
    if (vitoriasTimeX >= 2) {
      const vencedor = resultadosRodadas[numRodadas - 1].vencedor || timeX[0];
      return { vencedor, time: 'X', terminouMao: true, detalhes: `Time X venceu a mão! (2+ vitórias)` };
    }
    
    // 2. Se jogaram 3 rodadas, quem tem mais vitórias ganha
    if (numRodadas === 3) {
      if (vitoriasTimeY > vitoriasTimeX) {
        const vencedor = resultadosRodadas[numRodadas - 1].vencedor || timeY[0];
        return { vencedor, time: 'Y', terminouMao: true, detalhes: `Time Y venceu a mão! (${vitoriasTimeY}x${vitoriasTimeX})` };
      } else if (vitoriasTimeX > vitoriasTimeY) {
        const vencedor = resultadosRodadas[numRodadas - 1].vencedor || timeX[0];
        return { vencedor, time: 'X', terminouMao: true, detalhes: `Time X venceu a mão! (${vitoriasTimeX}x${vitoriasTimeY})` };
      } else {
        return { vencedor: null, time: null, terminouMao: true, detalhes: "Mão empatada! Ninguém pontua." };
      }
    }
    
    // 3. Regras especiais para empates
    if (numRodadas === 2) {
      // Se a primeira foi empate e a segunda teve vencedor
      if (resultadosRodadas[0].empate && !resultadosRodadas[1].empate) {
        const vencedor = resultadosRodadas[1].vencedor;
        const time = timeY.includes(vencedor) ? 'Y' : 'X';
        return { vencedor, time, terminouMao: true, detalhes: `Time ${time} venceu a mão! (1ª empatou, 2ª venceu)` };
      }
      // Se a primeira teve vencedor e a segunda empatou
      if (!resultadosRodadas[0].empate && resultadosRodadas[1].empate) {
        const vencedor = resultadosRodadas[0].vencedor;
        const time = timeY.includes(vencedor) ? 'Y' : 'X';
        return { vencedor, time, terminouMao: true, detalhes: `Time ${time} venceu a mão! (1ª venceu, 2ª empatou)` };
      }
    }
  }
  
  return { vencedor: null, terminouMao: false, detalhes: "Mão ainda em andamento" };
}

/**
 * Reinicia uma nova mão, mantendo o placar geral
 * @param {Object} partidaAtual - Estado atual da partida
 * @param {Map} jogadoresOnline - Map dos jogadores conectados
 * @returns {Object} - Nova partida com dados resetados
 */
function iniciarNovaMao(partidaAtual, jogadoresOnline) {
  const jogadoresIds = partidaAtual.jogadoresIds;
  const placarGeral = partidaAtual.placarGeral || {};
  const nomes = partidaAtual.nomes || {};
  
  // Cria nova partida mantendo o placar
  const novaPartida = iniciarNovaPartida(jogadoresOnline);
  
  // Preserva dados importantes
  novaPartida.placarGeral = { ...placarGeral };
  novaPartida.nomes = { ...nomes };
  novaPartida.numeroMao = (partidaAtual.numeroMao || 0) + 1;
  novaPartida.resultadosRodadas = [];
  novaPartida.rodadaAtual = 1;
  
  console.log(`🔄 Nova mão iniciada! Mão ${novaPartida.numeroMao}`);
  console.log(`📊 Placar geral:`, novaPartida.placarGeral);
  
  return novaPartida;
}

/**
 * Processa um pedido de truco
 * @param {Object} partida - Estado atual da partida
 * @param {string} desafianteId - ID do jogador que pediu truco
 * @returns {Object} - { sucesso: boolean, mensagem: string, mensagemMesa: string }
 */
function processarPedidoTruco(partida, desafianteId) {
  // Permite pedir truco apenas quando for a vez do jogador
  if (partida.vezDoJogador !== desafianteId) {
    return { sucesso: false, mensagem: 'Não é sua vez de jogar' };
  }
  
  // Se há truco pendente, não permite novo pedido
  if (partida.truco.status === 'pendente') {
    return { sucesso: false, mensagem: 'Há um desafio pendente aguardando resposta' };
  }
  
  const numJogadores = partida.jogadoresIds.length;
  const nomeDesafiante = partida.nomes[desafianteId];
  
  // Se truco está inativo, permite pedir truco normal
  if (partida.truco.status === 'inativo') {
    let desafiados = [];
    
    // Para 4 jogadores (times): desafiados são os 2 jogadores do time adversário
    if (numJogadores === 4) {
      const timeDesafiante = determinarTime(desafianteId, partida.jogadoresIds);
      console.log(`🎯 Desafiante: ${nomeDesafiante} (índice: ${partida.jogadoresIds.indexOf(desafianteId)}, time: ${timeDesafiante})`);
      
      desafiados = partida.jogadoresIds.filter(id => {
        const timeJogador = determinarTime(id, partida.jogadoresIds);
        const ehDesafiado = timeJogador !== timeDesafiante;
        console.log(`  - Jogador ${partida.nomes[id]} (índice: ${partida.jogadoresIds.indexOf(id)}, time: ${timeJogador}) ${ehDesafiado ? '✅ DESAFIADO' : '❌ mesmo time'}`);
        return ehDesafiado;
      });
      
      console.log(`📋 Desafiados finais: ${desafiados.map(id => partida.nomes[id]).join(', ')}`);
    } else {
      // Para 2 jogadores: desafiado é o outro jogador
      const desafiadoId = partida.jogadoresIds.find(id => id !== desafianteId);
      if (!desafiadoId) {
        return { sucesso: false, mensagem: 'Não foi possível determinar o desafiado' };
      }
      desafiados = [desafiadoId];
    }
    
    // Atualiza estado do truco
    partida.truco = {
      status: 'pendente',
      valor: 3,
      desafiante: desafianteId,
      desafiados: desafiados,
      respostas: {}, // Armazena as respostas de cada desafiado
      proximoValor: 6
    };
    
    const nomesDesafiados = desafiados.map(id => partida.nomes[id]).join(' e ');
    const mensagemMesa = `${nomeDesafiante} pediu TRUCO!`;
    
    console.log(`🎯 ${nomeDesafiante} pediu TRUCO para ${nomesDesafiados}!`);
    
    return { 
      sucesso: true, 
      mensagem: `${nomeDesafiante} pediu TRUCO! Aguardando resposta de ${nomesDesafiados}...`,
      mensagemMesa: mensagemMesa
    };
  }
  
  // Se truco está ativo, permite aumentar APENAS se você é do time que ACEITOU
  if (partida.truco.status === 'ativo') {
    if (partida.truco.valor >= 12) {
      return { sucesso: false, mensagem: 'O truco já está no valor máximo (12 pontos)' };
    }
    
    // Verificar se quem está pedindo é do time que ACEITOU (tem direito de aumentar)
    const numJogadores = partida.jogadoresIds.length;
    
    if (numJogadores === 4) {
      const timeDesafiante = determinarTime(desafianteId, partida.jogadoresIds);
      const timeQueAceitou = partida.truco.timeQueAceitou;
      
      if (!timeQueAceitou) {
        return { sucesso: false, mensagem: 'Erro: time que aceitou não foi registrado' };
      }
      
      if (timeDesafiante !== timeQueAceitou) {
        return { sucesso: false, mensagem: 'Apenas o time que aceitou o último pedido pode aumentar a aposta!' };
      }
      
      // Desafiados são os 2 jogadores do time adversário
      const desafiados = partida.jogadoresIds.filter(id => {
        const timeJogador = determinarTime(id, partida.jogadoresIds);
        return timeJogador !== timeDesafiante;
      });
      
      const novoValor = partida.truco.valor === 3 ? 6 : partida.truco.valor === 6 ? 9 : 12;
      const proximoValor = novoValor === 6 ? 9 : novoValor === 9 ? 12 : 12;
      const nomeValor = novoValor === 6 ? 'SEIS' : novoValor === 9 ? 'NOVE' : 'DOZE';
      
      console.log(`🔥 ${nomeDesafiante} (Time ${timeDesafiante}) pediu ${nomeValor}!`);
      
      // Atualiza estado do truco para pendente com novo valor
      partida.truco = {
        status: 'pendente',
        valor: novoValor,
        desafiante: desafianteId,
        desafiados: desafiados,
        respostas: {},
        proximoValor: proximoValor,
        timeQueAceitou: null // Resetado até que aceitem
      };
      
      const nomesDesafiados = desafiados.map(id => partida.nomes[id]).join(' e ');
      const mensagemMesa = `${nomeDesafiante} pediu ${nomeValor}!`;
      
      return { 
        sucesso: true, 
        mensagem: `${nomeDesafiante} aumentou para ${nomeValor}! Aguardando resposta de ${nomesDesafiados}...`,
        mensagemMesa: mensagemMesa
      };
    } else {
      // Para 2 jogadores: quem aceitou pode aumentar
      if (partida.truco.ultimoQueAceitou !== desafianteId) {
        return { sucesso: false, mensagem: 'Apenas quem aceitou o último pedido pode aumentar a aposta!' };
      }
      
      const desafiadoId = partida.jogadoresIds.find(id => id !== desafianteId);
      if (!desafiadoId) {
        return { sucesso: false, mensagem: 'Não foi possível determinar o desafiado' };
      }
      
      const novoValor = partida.truco.valor === 3 ? 6 : partida.truco.valor === 6 ? 9 : 12;
      const proximoValor = novoValor === 6 ? 9 : novoValor === 9 ? 12 : 12;
      const nomeValor = novoValor === 6 ? 'SEIS' : novoValor === 9 ? 'NOVE' : 'DOZE';
      
      console.log(`🔥 ${nomeDesafiante} aumentou para ${nomeValor}!`);
      
      partida.truco = {
        status: 'pendente',
        valor: novoValor,
        desafiante: desafianteId,
        desafiados: [desafiadoId],
        respostas: {},
        proximoValor: proximoValor,
        ultimoQueAceitou: null
      };
      
      const mensagemMesa = `${nomeDesafiante} pediu ${nomeValor}!`;
      
      return { 
        sucesso: true, 
        mensagem: `${nomeDesafiante} aumentou para ${nomeValor}! Aguardando resposta de ${partida.nomes[desafiadoId]}...`,
        mensagemMesa: mensagemMesa
      };
    }
  }
  
  return { sucesso: false, mensagem: 'Estado de truco inválido' };
}

/**
 * Processa a resposta a um desafio de truco
 * @param {Object} partida - Estado atual da partida
 * @param {string} respondedorId - ID do jogador que respondeu
 * @param {string} resposta - 'aceitou', 'aumentou', 'correu'
 * @returns {Object} - { sucesso: boolean, mensagem: string, acao: string, mensagemMesa: string }
 */
function processarRespostaTruco(partida, respondedorId, resposta) {
  // Validações
  if (partida.truco.status !== 'pendente') {
    return { sucesso: false, mensagem: 'Não há desafio pendente', acao: 'none' };
  }
  
  if (!partida.truco.desafiados.includes(respondedorId)) {
    return { sucesso: false, mensagem: 'Você não pode responder este desafio', acao: 'none' };
  }
  
  // Verifica se este jogador já respondeu
  if (partida.truco.respostas[respondedorId]) {
    return { sucesso: false, mensagem: 'Você já respondeu este desafio', acao: 'none' };
  }
  
  const nomeRespondedor = partida.nomes[respondedorId];
  const nomeDesafiante = partida.nomes[partida.truco.desafiante];
  const numJogadores = partida.jogadoresIds.length;
  
  // Registra a resposta
  partida.truco.respostas[respondedorId] = resposta;
  
  // Para 2 jogadores: processa imediatamente
  if (numJogadores === 2) {
    switch (resposta) {
      case 'correu':
        console.log(`🏃 ${nomeRespondedor} correu do TRUCO!`);
        
        // O desafiante ganha os pontos da mão atual
        partida.placarGeral[partida.truco.desafiante] += partida.valorDaMao;
        
        const mensagemCorreu2 = `${nomeRespondedor} correu! ${nomeDesafiante} ganhou ${partida.valorDaMao} ponto(s)`;
        
        // Reset do estado de truco
        partida.truco = {
          status: 'inativo',
          valor: 1,
          desafiante: null,
          desafiados: [],
          respostas: {},
          proximoValor: 3
        };
        
        return { 
          sucesso: true, 
          mensagem: `${nomeRespondedor} correu! ${nomeDesafiante} ganha ${partida.valorDaMao} ponto(s)!`,
          mensagemMesa: mensagemCorreu2,
          acao: 'fimDaMao'
        };
      
      case 'aceitou':
        console.log(`✅ ${nomeRespondedor} aceitou o TRUCO de ${partida.truco.valor} pontos!`);
        
        // Atualiza valor da mão e status
        partida.valorDaMao = partida.truco.valor;
        partida.truco.status = 'ativo';
        partida.truco.ultimoQueAceitou = respondedorId; // Registra quem aceitou (para 2 jogadores)
        
        const mensagemAceito2 = `${nomeRespondedor} aceitou! Vale ${partida.truco.valor}`;
        
        return { 
          sucesso: true, 
          mensagem: `${nomeRespondedor} aceitou! Valendo ${partida.truco.valor} pontos!`,
          mensagemMesa: mensagemAceito2,
          acao: 'trucoAceito'
        };
      
      case 'aumentou':
        const novoValor2 = partida.truco.proximoValor;
        
        if (novoValor2 > 12) {
          return { sucesso: false, mensagem: 'Não é possível aumentar mais', acao: 'none' };
        }
        
        const nomeProximoValor2 = novoValor2 === 6 ? 'SEIS' : novoValor2 === 9 ? 'NOVE' : 'DOZE';
        console.log(`🔥 ${nomeRespondedor} aumentou para ${nomeProximoValor2}!`);
        
        const mensagemAumentou2 = `${nomeRespondedor} pediu ${nomeProximoValor2}!`;
        
        // Inverte os papéis
        partida.truco = {
          status: 'pendente',
          valor: novoValor2,
          desafiante: respondedorId,
          desafiados: [partida.truco.desafiante],
          respostas: {},
          proximoValor: novoValor2 === 6 ? 9 : novoValor2 === 9 ? 12 : 12
        };
        
        return { 
          sucesso: true, 
          mensagem: `${nomeRespondedor} aumentou para ${nomeProximoValor2}! Aguardando resposta de ${nomeDesafiante}...`,
          mensagemMesa: mensagemAumentou2,
          acao: 'aguardando'
        };
      
      default:
        return { sucesso: false, mensagem: 'Resposta inválida', acao: 'none' };
    }
  }
  
  // Para 4 jogadores (times): precisa processar ambas as respostas
  const respostasRecebidas = Object.keys(partida.truco.respostas).length;
  const totalDesafiados = partida.truco.desafiados.length;
  
  // Se ainda falta alguém responder
  if (respostasRecebidas < totalDesafiados) {
    let mensagemEspera = '';
    
    if (resposta === 'aceitou') {
      mensagemEspera = `${nomeRespondedor} aceitou!`;
      console.log(`✅ ${nomeRespondedor} aceitou o TRUCO! Aguardando parceiro...`);
    } else if (resposta === 'correu') {
      mensagemEspera = `${nomeRespondedor} correu...`;
      console.log(`🏃 ${nomeRespondedor} correu! Aguardando parceiro...`);
    } else if (resposta === 'aumentou') {
      mensagemEspera = `${nomeRespondedor} quer aumentar...`;
      console.log(`🔥 ${nomeRespondedor} quer aumentar! Aguardando parceiro...`);
    }
    
    return {
      sucesso: true,
      mensagem: `Resposta registrada. Aguardando resposta do parceiro...`,
      mensagemMesa: mensagemEspera,
      acao: 'aguardando'
    };
  }
  
  // Todos responderam - processar resultado
  const respostas = Object.values(partida.truco.respostas);
  
  // Se QUALQUER um aceitou, o truco é aceito
  if (respostas.includes('aceitou')) {
    console.log(`✅ Time aceitou o TRUCO!`);
    
    // Determinar qual time aceitou
    const timeQueAceitou = determinarTime(respondedorId, partida.jogadoresIds);
    
    partida.truco.status = 'ativo';
    partida.valorDaMao = partida.truco.valor;
    partida.truco.timeQueAceitou = timeQueAceitou; // Registra qual time aceitou
    
    console.log(`📝 Time ${timeQueAceitou} aceitou e tem direito de aumentar na próxima!`);
    
    const mensagemAceito = `Time aceitou! Vale ${partida.truco.valor}`;
    
    return {
      sucesso: true,
      mensagem: `O time aceitou! A mão vale ${partida.truco.valor} ponto(s).`,
      mensagemMesa: mensagemAceito,
      acao: 'trucoAceito'
    };
  }
  
  // Se QUALQUER um aumentou, o truco aumenta
  if (respostas.includes('aumentou')) {
    const novoValor = partida.truco.proximoValor;
    
    if (novoValor > 12) {
      return { sucesso: false, mensagem: 'Não é possível aumentar mais', acao: 'none' };
    }
    
    const nomeProximoValor = novoValor === 6 ? 'SEIS' : novoValor === 9 ? 'NOVE' : 'DOZE';
    console.log(`🔥 Time aumentou para ${nomeProximoValor}!`);
    
    const mensagemAumentou = `Time pediu ${nomeProximoValor}!`;
    
    // Determina os novos desafiados (time adversário do respondedor)
    const timeRespondedor = determinarTime(respondedorId, partida.jogadoresIds);
    const novosDesafiados = partida.jogadoresIds.filter(id => {
      const timeJogador = determinarTime(id, partida.jogadoresIds);
      return timeJogador !== timeRespondedor;
    });
    
    // Inverte os papéis - quem aumentou agora é o desafiante
    partida.truco = {
      status: 'pendente',
      valor: novoValor,
      desafiante: respondedorId,
      desafiados: novosDesafiados,
      respostas: {},
      proximoValor: novoValor === 6 ? 9 : novoValor === 9 ? 12 : 12,
      timeQueAceitou: null // Resetado até que aceitem o novo valor
    };
    
    const nomesNovosDesafiados = novosDesafiados.map(id => partida.nomes[id]).join(' e ');
    
    return {
      sucesso: true,
      mensagem: `Time aumentou para ${nomeProximoValor}! Aguardando resposta de ${nomesNovosDesafiados}...`,
      mensagemMesa: mensagemAumentou,
      acao: 'aguardando'
    };
  }
  
  // Se TODOS correram, o time desafiante ganha
  if (respostas.every(r => r === 'correu')) {
    console.log(`🏃 Time inteiro correu do TRUCO!`);
    
    // O desafiante ganha os pontos da mão atual
    partida.placarGeral[partida.truco.desafiante] += partida.valorDaMao;
    
    const mensagemCorreu = `Time correu! ${nomeDesafiante} ganhou ${partida.valorDaMao} ponto(s)`;
    
    // Reset do estado de truco
    partida.truco = {
      status: 'inativo',
      valor: 1,
      desafiante: null,
      desafiados: [],
      respostas: {},
      proximoValor: 3
    };
    
    return {
      sucesso: true,
      mensagem: `O time correu! ${nomeDesafiante} ganha ${partida.valorDaMao} ponto(s).`,
      mensagemMesa: mensagemCorreu,
      acao: 'fimDaMao'
    };
  }
  
  return { sucesso: false, mensagem: 'Estado de resposta inválido', acao: 'none' };
}

/**
 * Reinicia o estado do truco para uma nova mão
 * @param {Object} partida - Estado da partida
 */
function reiniciarTruco(partida) {
  partida.truco = {
    status: 'inativo',
    valor: 3,
    desafiante: null,
    desafiados: [],
    respostas: {},
    proximoValor: 3,
    timeQueAceitou: null,
    ultimoQueAceitou: null
  };
  partida.valorDaMao = 1; // Volta ao valor padrão
}

/**
 * Determina a qual time pertence um jogador (para 4 jogadores)
 * Baseado na posição visual na mesa:
 * Time Y (eixo vertical): Jogadores índice 0 e 1 (sul e norte - pontas cima/baixo)
 * Time X (eixo horizontal): Jogadores índice 2 e 3 (leste e oeste - pontas laterais)
 * @param {string} jogadorId - ID do jogador
 * @param {Array} jogadoresIds - Array ordenado de IDs dos jogadores
 * @returns {string} - 'Y' (vertical) ou 'X' (horizontal)
 */
function determinarTime(jogadorId, jogadoresIds) {
  const indice = jogadoresIds.indexOf(jogadorId);
  // Índices 0 e 1 são time Y (vertical), índices 2 e 3 são time X (horizontal)
  return (indice === 0 || indice === 1) ? 'Y' : 'X';
}

/**
 * Calcula o próximo jogador no sentido horário
 * Ordem visual na mesa: 0(sul) → 3(oeste) → 1(norte) → 2(leste) → 0...
 * @param {string} jogadorAtualId - ID do jogador atual
 * @param {Array} jogadoresIds - Array de IDs na ordem [sul, norte, leste, oeste]
 * @returns {string} - ID do próximo jogador
 */
function proximoJogadorHorario(jogadorAtualId, jogadoresIds) {
  const indiceAtual = jogadoresIds.indexOf(jogadorAtualId);
  
  // Mapeamento: índice do array → próximo índice no sentido horário
  // 0 (sul) → 3 (oeste)
  // 3 (oeste) → 1 (norte)  
  // 1 (norte) → 2 (leste)
  // 2 (leste) → 0 (sul)
  const ordemHoraria = [3, 2, 0, 1]; // próximo índice para cada posição
  
  const proximoIndice = ordemHoraria[indiceAtual];
  return jogadoresIds[proximoIndice];
}

// Exportações
module.exports = {
  criarBaralho,
  iniciarNovaPartida,
  embaralhar,
  determinarManilhas,
  distribuirCartas,
  cartaParaTexto,
  exibirMaos,
  determinarVencedorDaRodada,
  verificarVencedorDaMao,
  iniciarNovaMao,
  processarPedidoTruco,
  processarRespostaTruco,
  reiniciarTruco,
  determinarTime,
  proximoJogadorHorario
};
