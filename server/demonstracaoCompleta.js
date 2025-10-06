/**
 * TESTE ADICIONAL - DEMONSTRAÇÃO COMPLETA DA LÓGICA DO TRUCO
 */

const { 
  criarBaralho, 
  iniciarNovaPartida, 
  exibirMaos,
  cartaParaTexto,
  embaralhar,
  determinarManilhas
} = require('./gameLogic');

console.log('🎯 DEMONSTRAÇÃO COMPLETA DA LÓGICA DO TRUCO\n');

// Teste 1: Verificar estrutura do baralho
console.log('1️⃣ ESTRUTURA DO BARALHO:');
const baralho = criarBaralho();
console.log(`   Total de cartas: ${baralho.length}`);

// Contar cartas por naipe
const naipes = ['Ouros', 'Espadas', 'Copas', 'Paus'];
naipes.forEach(naipe => {
  const cartasDoNaipe = baralho.filter(carta => carta.naipe === naipe);
  console.log(`   ${naipe}: ${cartasDoNaipe.length} cartas`);
});

// Mostrar valores únicos
const valores = [...new Set(baralho.map(carta => carta.valor))];
console.log(`   Valores: ${valores.join(', ')}\n`);

// Teste 2: Algoritmo de embaralhamento
console.log('2️⃣ TESTE DE EMBARALHAMENTO:');
const baralhoOriginal = criarBaralho();
const baralhoEmbaralhado = embaralhar(baralhoOriginal);

console.log('   Primeiras 5 cartas originais:', baralhoOriginal.slice(0, 5).map(cartaParaTexto).join(', '));
console.log('   Primeiras 5 cartas embaralhadas:', baralhoEmbaralhado.slice(0, 5).map(cartaParaTexto).join(', '));

// Verificar se todas as cartas ainda estão presentes
const todosPresentes = baralhoOriginal.every(cartaOriginal => 
  baralhoEmbaralhado.some(cartaEmb => 
    cartaEmb.valor === cartaOriginal.valor && cartaEmb.naipe === cartaOriginal.naipe
  )
);
console.log(`   ✅ Todas as cartas preservadas: ${todosPresentes}\n`);

// Teste 3: Sistema de manilhas
console.log('3️⃣ SISTEMA DE MANILHAS:');
const exemploViras = [
  { valor: 'A', naipe: 'Ouros', forca: 1 },
  { valor: '7', naipe: 'Copas', forca: 7 },
  { valor: 'K', naipe: 'Paus', forca: 10 }
];

exemploViras.forEach(vira => {
  const manilhas = determinarManilhas(vira);
  console.log(`   Vira: ${cartaParaTexto(vira)}`);
  console.log(`   Manilhas: ${manilhas.map(cartaParaTexto).join(', ')}`);
  console.log(`   Forças: ${manilhas.map(m => m.forca).join(', ')}\n`);
});

// Teste 4: Partida com 4 jogadores
console.log('4️⃣ PARTIDA COM 4 JOGADORES:');
const jogadores4 = new Map();
jogadores4.set('player_1', 'João');
jogadores4.set('player_2', 'Maria');
jogadores4.set('player_3', 'Pedro');
jogadores4.set('player_4', 'Ana');

try {
  const partidaCompleta = iniciarNovaPartida(jogadores4);
  
  console.log(`   Vira: ${cartaParaTexto(partidaCompleta.vira)}`);
  console.log(`   Primeiro a jogar: ${jogadores4.get(partidaCompleta.vezDoJogador)}`);
  
  exibirMaos(partidaCompleta.maos, jogadores4);
  
  // Verificar se algum jogador tem manilhas
  console.log('🔍 ANÁLISE DAS MÃOS:');
  Object.entries(partidaCompleta.maos).forEach(([playerId, cartas]) => {
    const nomeJogador = jogadores4.get(playerId);
    const manilhasNaMao = cartas.filter(carta => 
      partidaCompleta.manilhas.some(manilha => 
        manilha.valor === carta.valor && manilha.naipe === carta.naipe
      )
    );
    
    if (manilhasNaMao.length > 0) {
      console.log(`   🎯 ${nomeJogador} tem ${manilhasNaMao.length} manilha(s): ${manilhasNaMao.map(cartaParaTexto).join(', ')}`);
    } else {
      console.log(`   📝 ${nomeJogador} não tem manilhas`);
    }
  });
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}

console.log('\n🎉 DEMONSTRAÇÃO CONCLUÍDA!');
console.log('🔗 O gameLogic.js está pronto para ser usado no servidor!');
