/**
 * TESTE DA LÓGICA DO JOGO DE TRUCO
 * 
 * Este arquivo testa as funcionalidades do gameLogic.js
 */

const { 
  criarBaralho, 
  iniciarNovaPartida, 
  exibirMaos,
  cartaParaTexto
} = require('./gameLogic');

console.log('🎮 TESTANDO A LÓGICA DO JOGO DE TRUCO\n');

// Teste 1: Criar baralho
console.log('1️⃣ TESTE: Criando baralho...');
const baralho = criarBaralho();
console.log(`✅ Baralho criado com ${baralho.length} cartas`);
console.log(`   Primeiras 3 cartas: ${baralho.slice(0, 3).map(cartaParaTexto).join(', ')}\n`);

// Teste 2: Simular jogadores
console.log('2️⃣ TESTE: Simulando jogadores...');
const jogadoresSimulados = new Map();
jogadoresSimulados.set('socket_123', 'João');
jogadoresSimulados.set('socket_456', 'Maria');

console.log('✅ Jogadores criados:');
for (const [id, nome] of jogadoresSimulados.entries()) {
  console.log(`   ${nome} (${id})`);
}
console.log('');

// Teste 3: Iniciar partida
console.log('3️⃣ TESTE: Iniciando nova partida...');
try {
  const estadoPartida = iniciarNovaPartida(jogadoresSimulados);
  
  console.log('✅ Partida iniciada com sucesso!');
  console.log(`   Vira: ${cartaParaTexto(estadoPartida.vira)}`);
  console.log(`   Manilhas: ${estadoPartida.manilhas.map(cartaParaTexto).join(', ')}`);
  console.log(`   Primeiro a jogar: ${estadoPartida.vezDoJogador}`);
  
  // Exibir mãos dos jogadores
  exibirMaos(estadoPartida.maos, jogadoresSimulados);
  
  console.log('📊 Estado completo da partida:');
  console.log(JSON.stringify(estadoPartida, null, 2));
  
} catch (error) {
  console.error('❌ Erro ao iniciar partida:', error.message);
}

console.log('\n🎯 TODOS OS TESTES CONCLUÍDOS!');
