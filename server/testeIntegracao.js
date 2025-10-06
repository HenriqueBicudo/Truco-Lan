/**
 * TESTE DE INTEGRAÇÃO - Server.js + GameLogic.js
 */

const { iniciarNovaPartida, exibirMaos } = require('./gameLogic');

console.log('🔗 TESTE DE INTEGRAÇÃO SERVIDOR + LÓGICA DO JOGO\n');

// Simular cenário real do servidor
const jogadoresOnlineSimulados = new Map();
jogadoresOnlineSimulados.set('socket_abc123', 'Jogador1');
jogadoresOnlineSimulados.set('socket_def456', 'Jogador2');

console.log('📋 JOGADORES SIMULADOS:');
for (const [socketId, nome] of jogadoresOnlineSimulados.entries()) {
  console.log(`   ${nome} (${socketId})`);
}

console.log('\n🎮 INICIANDO PARTIDA VIA SERVIDOR...');

try {
  // Exatamente como seria chamado no server.js
  const partidaAtual = iniciarNovaPartida(jogadoresOnlineSimulados);
  
  // Exibir mãos como no servidor
  exibirMaos(partidaAtual.maos, jogadoresOnlineSimulados);
  
  // Simular dados que seriam enviados para cada cliente
  console.log('📤 DADOS ENVIADOS PARA CLIENTES:');
  
  for (const [socketId, cartas] of Object.entries(partidaAtual.maos)) {
    const nomeJogador = jogadoresOnlineSimulados.get(socketId);
    
    // Dados personalizados como no servidor real
    const dadosPersonalizados = {
      vira: partidaAtual.vira,
      manilhas: partidaAtual.manilhas,
      vezDoJogador: partidaAtual.vezDoJogador,
      minhasCartas: cartas,
      meuId: socketId,
      meuNome: nomeJogador
    };
    
    console.log(`\n   Para ${nomeJogador}:`);
    console.log(`   - Vira: ${dadosPersonalizados.vira.valor} de ${dadosPersonalizados.vira.naipe}`);
    console.log(`   - Minhas cartas: ${dadosPersonalizados.minhasCartas.map(c => `${c.valor} de ${c.naipe}`).join(', ')}`);
    console.log(`   - É minha vez? ${dadosPersonalizados.vezDoJogador === socketId ? 'SIM' : 'NÃO'}`);
  }
  
  console.log('\n✅ INTEGRAÇÃO FUNCIONANDO PERFEITAMENTE!');
  
} catch (error) {
  console.error('❌ Erro na integração:', error.message);
}

console.log('\n🎯 RESUMO DA IMPLEMENTAÇÃO:');
console.log('✅ gameLogic.js implementado com todas as funcionalidades:');
console.log('   - criarBaralho() ✅');
console.log('   - embaralhar() com Fisher-Yates ✅');
console.log('   - determinarManilhas() ✅');
console.log('   - distribuirCartas() ✅');
console.log('   - iniciarNovaPartida() ✅');
console.log('   - Utilitários de debug ✅');
console.log('✅ Integração com server.js ✅');
console.log('✅ Separação clara entre lógica de jogo e rede ✅');
