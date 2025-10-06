import { useState, useEffect } from 'react'
import io, { Socket } from 'socket.io-client'
import './App.css'
import Carta from './components/Carta.tsx'

// Tipo para o estado da partida
interface EstadoPartida {
  vira: { valor: string; naipe: string; forca: number }
  manilhas: Array<{ valor: string; naipe: string; forca: number; tipo: string }>
  vezDoJogador: string
  rodadaAtual: number
  jogadoresIds: string[]
  placar: { [key: string]: number }
  placarGeral: { [key: string]: number }
  resultadosRodadas: Array<{ vencedor: string | null; empate: boolean; detalhes: string }>
  nomes: { [key: string]: string }
  numeroMao: number
  valorDaMao: number
  minhasCartas: Array<{ valor: string; naipe: string; forca: number }>
  cartasNaMesa: Array<{ carta: { valor: string; naipe: string }; jogador: string; socketId: string }>
  meuId: string
  meuNome: string
  totalJogadores: number
  truco: {
    status: 'inativo' | 'pendente' | 'ativo'
    valor: number
    desafiante: string | null
    desafiados: string[]
    respostas: { [key: string]: string }
    proximoValor: number
    timeQueAceitou: string | null
    ultimoQueAceitou: string | null
  }
}

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [nomeJogador, setNomeJogador] = useState('')
  const [etapa, setEtapa] = useState<'login' | 'logado' | 'jogo'>('login')
  const [socket, setSocket] = useState<Socket | null>(null)
  const [jogadores, setJogadores] = useState<string[]>([])
  const [estadoDaPartida, setEstadoDaPartida] = useState<EstadoPartida | null>(null)
  const [mensagensMesa, setMensagensMesa] = useState<string[]>([])
  const [mensagensChat, setMensagensChat] = useState<Array<{
    id: string
    jogadorId: string
    nome: string
    mensagem: string
    timestamp: string
    tipo?: 'info' | 'truco' | 'rodada' | 'mao'
  }>>([])
  const [mensagemChat, setMensagemChat] = useState('')

  useEffect(() => {
    // Estabelece conexão com o servidor Socket.IO
  const socketInstance = io('https://truco-lan.onrender.com')
    setSocket(socketInstance)

    // Listener para evento de conexão
    socketInstance.on('connect', () => {
      console.log('✅ Conectado ao servidor Socket.IO!')
      setIsConnected(true)
    })

    // Listener para evento de desconexão
    socketInstance.on('disconnect', () => {
      console.log('❌ Desconectado do servidor Socket.IO!')
      setIsConnected(false)
      setEtapa('login') // Volta para o login se desconectar
      setJogadores([]) // Limpa a lista de jogadores
    })

    // Listener para atualização da lista de jogadores
    socketInstance.on('atualizarListaDeJogadores', (listaJogadores: string[]) => {
      console.log('📋 Lista de jogadores atualizada:', listaJogadores)
      setJogadores(listaJogadores)
    })

    // Listener para quando a partida é iniciada
    socketInstance.on('partidaIniciada', (dadosPartida: EstadoPartida) => {
      console.log('🎮 Partida iniciada! Dados recebidos:', dadosPartida)
      setEstadoDaPartida(dadosPartida)
      setEtapa('jogo')
    })

    // Listener para quando o estado da partida é atualizado (jogadas, etc.)
    socketInstance.on('partidaAtualizada', (dadosPartida: EstadoPartida) => {
      console.log('🔄 Estado da partida atualizado:', dadosPartida)
      setEstadoDaPartida(dadosPartida)
    })

        // Listener para quando alguém pede truco
    socketInstance.on('trucoSolicitado', (dados: {
      desafiante: string
      desafiados: string[]
      valor: number
      proximoValor: number
      mensagem: string
      mensagemMesa: string
    }) => {
      console.log('🎯 Truco solicitado:', dados)
      // A mensagem será tratada pelo modal automaticamente via estadoDaPartida
    })

    // Listener para quando alguém responde ao truco
    socketInstance.on('trucoRespondido', (dados: {
      respondedor: string
      resposta: string
      valor: number
      acao: string
      mensagem: string
      mensagemMesa: string
    }) => {
      console.log('📝 Truco respondido:', dados)
      // A mensagem será tratada pelo modal automaticamente via estadoDaPartida
    })

    // Listener para resposta ao truco
    socketInstance.on('trucoRespondido', (dados: {
      respondedor: string
      resposta: string
      valor: number
      acao: string
      mensagem: string
      mensagemMesa: string
    }) => {
      console.log('📋 Resposta ao truco:', dados)
      
      // Adicionar mensagem ao chat da mesa com auto-remoção
      if (dados.mensagemMesa) {
        const novaMensagem = dados.mensagemMesa;
        setMensagensMesa(prev => [...prev, novaMensagem].slice(-5))
        
        // Remover esta mensagem após 5 segundos
        setTimeout(() => {
          setMensagensMesa(prev => prev.filter(msg => msg !== novaMensagem))
        }, 5000)
      }
    })

    // Listener para erros
    socketInstance.on('erro', (dados: { mensagem: string }) => {
      console.log('❌ Erro:', dados.mensagem)
      alert(dados.mensagem)
    })

    // Listener para mensagens do chat
    socketInstance.on('novaMensagemChat', (mensagem: {
      id: string
      jogadorId: string
      nome: string
      mensagem: string
      timestamp: string
      tipo?: 'info' | 'truco' | 'rodada' | 'mao'
    }) => {
      console.log('💬 Nova mensagem do chat RECEBIDA:', mensagem)
      setMensagensChat(prev => {
        const novaLista = [...prev, mensagem].slice(-50)
        console.log('📝 Lista de mensagens atualizada. Total:', novaLista.length)
        return novaLista
      })
    })

    // Função de limpeza - remove listeners quando o componente é desmontado
    return () => {
      socketInstance.off('connect')
      socketInstance.off('disconnect')
      socketInstance.off('atualizarListaDeJogadores')
      socketInstance.off('partidaIniciada')
      socketInstance.off('partidaAtualizada')
      socketInstance.off('trucoSolicitado')
      socketInstance.off('trucoRespondido')
      socketInstance.off('erro')
      socketInstance.off('novaMensagemChat')
      socketInstance.disconnect()
    }
  }, [])

  const handleEntrarNoJogo = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (nomeJogador.trim() === '') {
      alert('Por favor, digite seu nome!')
      return
    }

    if (socket && isConnected) {
      // Emite evento para o servidor
      socket.emit('entrarNoJogo', nomeJogador.trim())
      console.log(`Enviando nome "${nomeJogador}" para o servidor...`)
      
      // Muda a etapa para "logado"
      setEtapa('logado')
    }
  }

  const handleIniciarPartida = () => {
    if (socket && isConnected) {
      console.log('🎯 Solicitando início da partida...')
      socket.emit('iniciarPartida')
    }
  }

  const jogarCarta = (carta: { valor: string; naipe: string }) => {
    if (socket && isConnected && estadoDaPartida?.vezDoJogador === estadoDaPartida?.meuId) {
      console.log('🃏 Jogando carta:', carta)
      socket.emit('jogarCarta', carta)
    }
  }

  const pedirTruco = () => {
    if (socket && isConnected && estadoDaPartida) {
      console.log('🎯 Pedindo TRUCO!')
      socket.emit('pedirTruco')
    } else {
      console.log('❌ Não é possível pedir truco no momento')
    }
  }

  const responderTruco = (resposta: 'aceitou' | 'aumentou' | 'correu') => {
    if (socket && isConnected) {
      console.log('📋 Respondendo ao TRUCO:', resposta)
      socket.emit('responderTruco', { resposta })
    }
  }

  const enviarMensagemChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!socket || !isConnected || !mensagemChat.trim()) {
      console.log('❌ Não pode enviar mensagem:', { socket: !!socket, isConnected, mensagem: mensagemChat })
      return
    }

    console.log('💬 Enviando mensagem para o servidor:', mensagemChat)
    socket.emit('enviarMensagemChat', { mensagem: mensagemChat })
    console.log('✅ Evento emit executado')
    setMensagemChat('') // Limpa o campo após enviar
  }

  // Verifica se o jogador pode aumentar a aposta
  const podeAumentar = (): boolean => {
    if (!estadoDaPartida || !estadoDaPartida.truco) {
      console.log('❌ podeAumentar: Sem estado ou truco');
      return false;
    }
    
    // Truco deve estar ativo e não no máximo
    if (estadoDaPartida.truco.status !== 'ativo' || estadoDaPartida.truco.valor >= 12) {
      console.log('❌ podeAumentar: Status não é ativo ou já está no máximo', {
        status: estadoDaPartida.truco.status,
        valor: estadoDaPartida.truco.valor
      });
      return false;
    }
    
    // Para 4 jogadores: verificar se é do time que aceitou
    if (estadoDaPartida.totalJogadores === 4) {
      const meuIndice = estadoDaPartida.jogadoresIds.indexOf(estadoDaPartida.meuId);
      const meuTime = (meuIndice === 0 || meuIndice === 1) ? 'Y' : 'X';
      const timeQueAceitou = estadoDaPartida.truco.timeQueAceitou;
      
      console.log('🔍 podeAumentar (4 jogadores):', {
        meuIndice,
        meuTime,
        timeQueAceitou,
        podeAumentar: meuTime === timeQueAceitou
      });
      
      return meuTime === timeQueAceitou;
    }
    
    // Para 2 jogadores: verificar se foi quem aceitou
    if (estadoDaPartida.totalJogadores === 2) {
      const ultimoQueAceitou = estadoDaPartida.truco.ultimoQueAceitou;
      const podeAumentar = estadoDaPartida.meuId === ultimoQueAceitou;
      
      console.log('🔍 podeAumentar (2 jogadores):', {
        meuId: estadoDaPartida.meuId,
        ultimoQueAceitou,
        podeAumentar
      });
      
      return podeAumentar;
    }
    
    console.log('❌ podeAumentar: Condição não satisfeita');
    return false;
  }

  const renderLogin = () => (
    <div>
      <h2 style={{ marginBottom: '30px', color: '#333' }}>� Entre no Lobby</h2>
      <form onSubmit={handleEntrarNoJogo} style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Digite seu nome"
            value={nomeJogador}
            onChange={(e) => setNomeJogador(e.target.value)}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}
            disabled={!isConnected}
          />
        </div>
        <button
          type="submit"
          disabled={!isConnected || nomeJogador.trim() === ''}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            backgroundColor: isConnected ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.3s'
          }}
        >
          {isConnected ? '🚀 Entrar no Jogo' : '⏳ Aguardando Conexão...'}
        </button>
      </form>
    </div>
  )

  const renderLobby = () => (
    <div>
      <h2 style={{ color: '#28a745', marginBottom: '20px' }}>
        🎉 Bem-vindo, {nomeJogador}!
      </h2>
      <div style={{
        padding: '30px',
        backgroundColor: '#f8f9fa',
        border: '2px solid #28a745',
        borderRadius: '10px',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <p style={{ fontSize: '18px', margin: '0 0 20px 0' }}>
          🎯 Aguardando outros jogadores...
        </p>
        
        {/* Lista de Jogadores Online */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <h3 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '16px', 
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            👥 Jogadores na Sala ({jogadores.length})
          </h3>
          {jogadores.length > 0 ? (
            <ul style={{ 
              margin: '0', 
              padding: '0', 
              listStyle: 'none',
              fontSize: '14px'
            }}>
              {jogadores.map((jogador, index) => (
                <li key={index} style={{ 
                  padding: '5px 0',
                  color: jogador === nomeJogador ? '#28a745' : '#333',
                  fontWeight: jogador === nomeJogador ? 'bold' : 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {jogador === nomeJogador ? '🟢' : '🔵'} {jogador}
                  {jogador === nomeJogador && ' (você)'}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ 
              margin: '0', 
              color: '#666', 
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              Nenhum jogador conectado...
            </p>
          )}
        </div>
        
        <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
          {jogadores.length >= 2 ? 'Pronto para jogar!' : 'Aguardando mais jogadores...'}
        </p>
      </div>
      
      {/* Botão Iniciar Jogo */}
      {jogadores.length >= 2 && (
        <button
          onClick={handleIniciarPartida}
          disabled={!isConnected}
          style={{
            marginTop: '20px',
            marginRight: '10px',
            padding: '15px 25px',
            fontSize: '16px',
            backgroundColor: isConnected ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          🎮 Iniciar Jogo
        </button>
      )}
      
      <button
        onClick={() => {
          setEtapa('login')
          setNomeJogador('')
          setJogadores([])
        }}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '14px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🚪 Sair do Lobby
      </button>
    </div>
  )

  const renderJogo = () => {
    if (!estadoDaPartida) return null;

    // Calcula resultados das rodadas para exibição
    const calcularPlacarMao = () => {
      if (!estadoDaPartida.resultadosRodadas) return { eu: 0, oponente: 0 };
      
      let vitoriasMinhas = 0;
      let vitoriasOponente = 0;
      
      estadoDaPartida.resultadosRodadas.forEach(resultado => {
        if (!resultado.empate) {
          if (resultado.vencedor === estadoDaPartida.meuId) {
            vitoriasMinhas++;
          } else {
            vitoriasOponente++;
          }
        }
      });
      
      return { eu: vitoriasMinhas, oponente: vitoriasOponente };
    };

    const placarMao = calcularPlacarMao();

    // Mensagem de status da última rodada
    const ultimaRodada = estadoDaPartida.resultadosRodadas?.[estadoDaPartida.resultadosRodadas.length - 1];
    let mensagemStatus = '';
    if (ultimaRodada) {
      if (ultimaRodada.empate) {
        mensagemStatus = `🤝 Rodada ${estadoDaPartida.resultadosRodadas.length} empatou!`;
      } else if (ultimaRodada.vencedor === estadoDaPartida.meuId) {
        mensagemStatus = `🎉 Você venceu a rodada ${estadoDaPartida.resultadosRodadas.length}!`;
      } else {
        mensagemStatus = `😔 ${estadoDaPartida.nomes?.[ultimaRodada.vencedor || ''] || 'Oponente'} venceu a rodada ${estadoDaPartida.resultadosRodadas.length}!`;
      }
    }

    return (
      <div style={{ padding: '20px 0' }}>
        {/* Container Principal com Jogadores Externos */}
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          position: 'relative',
          padding: '0 180px'
        }}>
          
          {/* Jogadores nas laterais e topo/baixo */}
          <div style={{ position: 'relative', margin: '130px 0' }}>
            {estadoDaPartida.jogadoresIds.map((jogadorId, index) => {
              const isMe = jogadorId === estadoDaPartida.meuId;
              const nomeJogador = estadoDaPartida.nomes?.[jogadorId] || `Jogador ${index + 1}`;
              const pontosJogador = estadoDaPartida.placarGeral?.[jogadorId] || 0;
              
              // Determinar time baseado no eixo visual
              // Time Y (vertical): índices 0 e 1 (sul e norte)
              // Team X (horizontal): índices 2 e 3 (leste e oeste)
              const time = (index === 0 || index === 1) ? 'Y' : 'X';
              const corTime = time === 'Y' ? '#2196f3' : '#ff9800'; // Azul para Y, Laranja para X
              
              let playerPosition: React.CSSProperties = {};
              
              switch(index) {
                case 0: // Sul (você) - Abaixo da mesa
                  playerPosition = {
                    position: 'absolute',
                    bottom: '-120px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10
                  };
                  break;
                case 1: // Norte - Acima da mesa
                  playerPosition = {
                    position: 'absolute',
                    top: '-120px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10
                  };
                  break;
                case 2: // Leste - Direita
                  playerPosition = {
                    position: 'absolute',
                    right: '-170px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  };
                  break;
                case 3: // Oeste - Esquerda
                  playerPosition = {
                    position: 'absolute',
                    left: '-170px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  };
                  break;
              }
              
              return (
                <div key={jogadorId} style={playerPosition}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: estadoDaPartida.vezDoJogador === jogadorId 
                        ? 'linear-gradient(145deg, #66bb6a, #43a047)'
                        : 'linear-gradient(145deg, #757575, #616161)',
                      border: '4px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      boxShadow: estadoDaPartida.vezDoJogador === jogadorId
                        ? '0 4px 15px rgba(76, 175, 80, 0.6), 0 0 20px rgba(76, 175, 80, 0.4)'
                        : '0 3px 10px rgba(0,0,0,0.4)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      animation: estadoDaPartida.vezDoJogador === jogadorId ? 'pulse 2s infinite' : 'none'
                    }}>
                      {isMe ? '🫵' : '👤'}
                      {estadoDaPartida.vezDoJogador === jogadorId && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#4caf50',
                          border: '2px solid white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}>
                          ▶️
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 'bold',
                      color: '#1a1a1a',
                      background: 'linear-gradient(145deg, #ffffff, #f5f5f5)',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      minWidth: '90px',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
                      border: '1px solid #e0e0e0'
                    }}>
                      <div style={{ 
                        fontSize: '10px', 
                        color: 'white',
                        backgroundColor: corTime,
                        padding: '2px 8px',
                        borderRadius: '8px',
                        marginBottom: '4px',
                        fontWeight: 'bold',
                        display: 'inline-block'
                      }}>
                        {time === 'Y' ? '🔵 Time Y' : '🟠 Time X'}
                      </div>
                      <div style={{ marginBottom: '3px' }}>{nomeJogador}</div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666',
                        padding: '2px 6px',
                        backgroundColor: pontosJogador > 0 ? '#e8f5e9' : '#fafafa',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}>
                        {pontosJogador} pts
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          
          {/* Mesa de Truco Circular */}
          <div style={{
            position: 'relative',
            width: '700px',
            height: '500px',
            margin: '0 auto',
            background: 'linear-gradient(145deg, #2d5016, #1a3a0a)',
            borderRadius: '50px',
            border: '12px solid #6d4c41',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 15px 40px rgba(0,0,0,0.5), inset 0 -10px 30px rgba(0,0,0,0.3)',
            zIndex: 1
          }}>
          {/* Área central da mesa */}
          <div style={{
            width: '320px',
            height: '220px',
            background: 'linear-gradient(145deg, #1a3a0a, #0d1f05)',
            borderRadius: '20px',
            border: '3px solid #3a5d2a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: 'inset 0 5px 20px rgba(0,0,0,0.5)'
          }}>
            {/* Vira no centro */}
            {estadoDaPartida.vira && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(0.85)'
              }}>
                <Carta 
                  dadosDaCarta={estadoDaPartida.vira}
                  isPlayable={false}
                />
              </div>
            )}
            
            {/* Área vazia para mensagens centrais */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontSize: '14px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {/* Mensagens de status podem aparecer aqui */}
            </div>
            
            {/* Chat de mensagens da mesa */}
            {mensagensMesa.length > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '12px',
                padding: '8px 14px',
                maxWidth: '280px',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}>
                {mensagensMesa.map((msg, index) => (
                  <div key={index} style={{
                    fontSize: '13px',
                    color: '#ffd700',
                    fontWeight: 'bold',
                    marginBottom: index < mensagensMesa.length - 1 ? '4px' : '0',
                    textAlign: 'center',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                  }}>
                    💬 {msg}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cartas jogadas na mesa */}
          {estadoDaPartida.cartasNaMesa && estadoDaPartida.cartasNaMesa.map((cartaInfo, idx) => {
            const jogadorIndex = estadoDaPartida.jogadoresIds.indexOf(cartaInfo.socketId);
            let cardPosition: React.CSSProperties = {};
            
            switch(jogadorIndex) {
              case 0: // Sul
                cardPosition = {
                  position: 'absolute',
                  bottom: '70px',
                  left: '50%',
                  transform: 'translateX(-50%) scale(0.7)'
                };
                break;
              case 1: // Norte
                cardPosition = {
                  position: 'absolute',
                  top: '70px',
                  left: '50%',
                  transform: 'translateX(-50%) scale(0.7)'
                };
                break;
              case 2: // Leste
                cardPosition = {
                  position: 'absolute',
                  right: '60px',
                  top: '50%',
                  transform: 'translateY(-50%) scale(0.7) rotate(90deg)'
                };
                break;
              case 3: // Oeste
                cardPosition = {
                  position: 'absolute',
                  left: '60px',
                  top: '50%',
                  transform: 'translateY(-50%) scale(0.7) rotate(-90deg)'
                };
                break;
            }
            
            return (
              <div key={idx} style={cardPosition}>
                <Carta 
                  dadosDaCarta={cartaInfo.carta}
                  isPlayable={false}
                />
              </div>
            );
          })}

          {/* Placar da rodada - canto superior esquerdo */}
          <div style={{
            position: 'absolute',
            top: '15px',
            left: '15px',
            background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
            padding: '10px 15px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            border: '1px solid #e0e0e0',
            zIndex: 5
          }}>
            🎲 Mão {estadoDaPartida.numeroMao} - Rodada {estadoDaPartida.rodadaAtual}
          </div>

          {/* Valor da mão - canto superior direito */}
          <div style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: estadoDaPartida.valorDaMao > 1 
              ? 'linear-gradient(145deg, #ff6b6b, #ee5a52)' 
              : 'linear-gradient(145deg, #ffffff, #f0f0f0)',
            color: estadoDaPartida.valorDaMao > 1 ? 'white' : '#333',
            padding: '10px 15px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 'bold',
            boxShadow: estadoDaPartida.valorDaMao > 1
              ? '0 4px 15px rgba(255, 107, 107, 0.4)'
              : '0 4px 12px rgba(0,0,0,0.25)',
            border: estadoDaPartida.valorDaMao > 1 ? 'none' : '1px solid #e0e0e0',
            zIndex: 5
          }}>
            🎯 Vale {estadoDaPartida.valorDaMao || 1} pts
          </div>

          {/* Indicador de tentos (rodadas ganhas) */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: 'bold',
            zIndex: 5
          }}>
            Tentos: {placarMao.eu} x {placarMao.oponente}
          </div>
        </div>
      </div>
      
      {/* Mensagem de Status */}
      {mensagemStatus && (
        <div style={{
          backgroundColor: '#fff3e0',
          border: '2px solid #ff9800',
          borderRadius: '12px',
          padding: '12px',
          margin: '20px auto',
          maxWidth: '500px',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#f57c00',
          boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)'
        }}>
          {mensagemStatus}
        </div>
      )}
      
      {/* Container Unificado: Ações do Jogo */}
      <div style={{
        maxWidth: '850px',
        margin: '40px auto 30px',
        background: 'linear-gradient(145deg, #f8f9fa, #e9ecef)',
        border: '3px solid #dee2e6',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }}>

        {/* Container com Cartas e Ações do Truco lado a lado */}
        <div style={{
          marginTop: '0px',
          paddingTop: '25px',
          borderTop: '2px solid rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '30px',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Seção de Cartas */}
          <div style={{ flex: '1 1 auto', minWidth: '300px' }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#1565c0',
              textAlign: 'center',
              fontSize: '22px',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}>
              🃏 Suas Cartas
            </h3>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {estadoDaPartida.minhasCartas.map((carta, index) => (
                <Carta
                  key={index}
                  dadosDaCarta={carta}
                  isPlayable={estadoDaPartida.vezDoJogador === estadoDaPartida.meuId}
                  onClick={jogarCarta}
                />
              ))}
            </div>
          </div>

          {/* Seção de Ações do Truco */}
          <div style={{ 
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            alignItems: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: '12px',
            border: '2px solid rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ 
              margin: '0 0 10px 0', 
              color: '#d32f2f',
              fontSize: '18px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              🎯 Ações Truco
            </h4>

            {/* Botão para pedir Truco (quando truco está inativo) */}
            {estadoDaPartida.truco?.status === 'inativo' && 
             estadoDaPartida.vezDoJogador === estadoDaPartida.meuId && (
              <button
                onClick={pedirTruco}
                style={{
                  background: 'linear-gradient(145deg, #ff5252, #f44336)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '15px 35px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(244, 67, 54, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  minWidth: '200px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(244, 67, 54, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(244, 67, 54, 0.4)';
                }}
              >
                🎯 PEDIR TRUCO!
              </button>
            )}
            
            {/* Botão para aumentar (quando truco está ativo e é do time que aceitou) */}
            {estadoDaPartida.truco?.status === 'ativo' &&
             estadoDaPartida.vezDoJogador === estadoDaPartida.meuId &&
             podeAumentar() && (
              <button
                onClick={pedirTruco}
                style={{
                  background: 'linear-gradient(145deg, #ff9800, #f57c00)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '15px 35px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(255, 152, 0, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  minWidth: '200px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 152, 0, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 152, 0, 0.4)';
                }}
              >
                🔥 PEDIR {estadoDaPartida.truco.proximoValor}!
              </button>
            )}
            
            {/* Botões de resposta ao truco (quando foi trucado) */}
            {estadoDaPartida.truco?.status === 'pendente' && 
             estadoDaPartida.truco?.desafiados.includes(estadoDaPartida.meuId) &&
             !estadoDaPartida.truco?.respostas[estadoDaPartida.meuId] && (
              <>
                <button
                  onClick={() => responderTruco('correu')}
                  style={{
                    background: 'linear-gradient(145deg, #78909c, #607d8b)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(96, 125, 139, 0.3)',
                    minWidth: '200px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(96, 125, 139, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(96, 125, 139, 0.3)';
                  }}
                >
                  🏃 CORRER
                </button>
                
                <button
                  onClick={() => responderTruco('aceitou')}
                  style={{
                    background: 'linear-gradient(145deg, #66bb6a, #43a047)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                    minWidth: '200px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                  }}
                >
                  ✅ ACEITAR
                </button>
                
                {estadoDaPartida.truco.proximoValor <= 12 && (
                  <button
                    onClick={() => responderTruco('aumentou')}
                    style={{
                      background: 'linear-gradient(145deg, #ff7043, #f4511e)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '14px 28px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(255, 111, 0, 0.4)',
                      textTransform: 'uppercase',
                      minWidth: '200px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 111, 0, 0.6)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.4)';
                    }}
                  >
                    🔥 {estadoDaPartida.truco.proximoValor === 6 ? 'SEIS!' : 
                         estadoDaPartida.truco.proximoValor === 9 ? 'NOVE!' : 'DOZE!'}
                  </button>
                )}
              </>
            )}

            {/* Mensagens de status quando não há ações disponíveis */}
            {!(
              (estadoDaPartida.truco?.status === 'inativo' && estadoDaPartida.vezDoJogador === estadoDaPartida.meuId) ||
              (estadoDaPartida.truco?.status === 'ativo' && estadoDaPartida.vezDoJogador === estadoDaPartida.meuId && podeAumentar()) ||
              (estadoDaPartida.truco?.status === 'pendente' && estadoDaPartida.truco?.desafiados.includes(estadoDaPartida.meuId) && !estadoDaPartida.truco?.respostas[estadoDaPartida.meuId])
            ) && (
              <div style={{
                padding: '15px',
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '13px',
                color: '#666',
                minWidth: '200px'
              }}>
                {estadoDaPartida.vezDoJogador !== estadoDaPartida.meuId 
                  ? '⏳ Aguarde sua vez' 
                  : '💡 Jogue uma carta'}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Modal de Truco - Aparece quando há truco pendente */}
      {estadoDaPartida.truco?.status === 'pendente' && 
       estadoDaPartida.truco?.desafiados.includes(estadoDaPartida.meuId) &&
       !estadoDaPartida.truco?.respostas[estadoDaPartida.meuId] && (
        <>
          {/* Overlay escuro que cobre toda a tela */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(5px)'
          }}>
            {/* Modal Card */}
            <div style={{
              background: 'linear-gradient(145deg, #ffffff, #f5f5f5)',
              borderRadius: '24px',
              padding: '40px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 100px rgba(255,152,0,0.3)',
              border: '3px solid #ff9800',
              animation: 'modalAppear 0.3s ease-out'
            }}>
              {/* Ícone e Título */}
              <div style={{
                textAlign: 'center',
                marginBottom: '30px'
              }}>
                <div style={{
                  fontSize: '64px',
                  marginBottom: '15px',
                  animation: 'pulse 1.5s infinite'
                }}>
                  🎯
                </div>
                <h2 style={{
                  margin: '0 0 10px 0',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#d84315',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}>
                  TRUCO!
                </h2>
                <p style={{
                  margin: 0,
                  fontSize: '18px',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  Vale <strong style={{ color: '#ff6f00', fontSize: '24px' }}>{estadoDaPartida.truco.valor}</strong> pontos
                </p>
              </div>

              {/* Mensagem */}
              <div style={{
                backgroundColor: '#fff3e0',
                border: '2px solid #ff9800',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '30px',
                textAlign: 'center'
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  color: '#e65100',
                  fontWeight: 'bold',
                  lineHeight: '1.5'
                }}>
                  {estadoDaPartida.nomes[estadoDaPartida.truco.desafiante || '']} pediu truco!
                  <br />
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    O que você faz?
                  </span>
                </p>
              </div>

              {/* Botões de Ação */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                {/* Botão Aceitar */}
                <button
                  onClick={() => responderTruco('aceitou')}
                  style={{
                    background: 'linear-gradient(145deg, #66bb6a, #43a047)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '18px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                    textTransform: 'uppercase'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
                  }}
                >
                  ✅ ACEITAR ({estadoDaPartida.truco.valor} pontos)
                </button>

                {/* Botão Aumentar (se possível) */}
                {estadoDaPartida.truco.proximoValor <= 12 && (
                  <button
                    onClick={() => responderTruco('aumentou')}
                    style={{
                      background: 'linear-gradient(145deg, #ff7043, #f4511e)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '18px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 6px 20px rgba(255, 87, 34, 0.4)',
                      textTransform: 'uppercase'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 87, 34, 0.6)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 87, 34, 0.4)';
                    }}
                  >
                    🔥 {estadoDaPartida.truco.proximoValor === 6 ? 'PEDIR SEIS!' : 
                         estadoDaPartida.truco.proximoValor === 9 ? 'PEDIR NOVE!' : 'PEDIR DOZE!'} ({estadoDaPartida.truco.proximoValor} pontos)
                  </button>
                )}

                {/* Botão Correr */}
                <button
                  onClick={() => responderTruco('correu')}
                  style={{
                    background: 'linear-gradient(145deg, #78909c, #607d8b)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '18px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 6px 20px rgba(96, 125, 139, 0.4)',
                    textTransform: 'uppercase'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(96, 125, 139, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(96, 125, 139, 0.4)';
                  }}
                >
                  🏃 CORRER (Desistir)
                </button>
              </div>
            </div>
          </div>

          {/* Animação do Modal */}
          <style>{`
            @keyframes modalAppear {
              from {
                opacity: 0;
                transform: scale(0.8) translateY(-50px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.1);
              }
            }
          `}</style>
        </>
      )}

      {/* Chat Geral */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '320px',
        height: '400px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '12px',
        border: '2px solid #444',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        zIndex: 1000
      }}>
        {/* Cabeçalho do Chat */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '2px solid #444',
          background: 'linear-gradient(145deg, #2c3e50, #34495e)',
          borderTopLeftRadius: '10px',
          borderTopRightRadius: '10px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            color: '#fff',
            fontWeight: 'bold'
          }}>💬 Chat Geral</h3>
        </div>

        {/* Área de Mensagens */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {mensagensChat.length === 0 ? (
            <div style={{
              color: '#888',
              fontSize: '13px',
              textAlign: 'center',
              marginTop: '20px'
            }}>
              Nenhuma mensagem ainda...
            </div>
          ) : (
            mensagensChat.map((msg) => {
              // Verifica se é uma mensagem de highlight do sistema
              const isHighlight = msg.jogadorId === 'SISTEMA';
              const tipoHighlight = msg.tipo || 'info';
              
              // Cores baseadas no tipo de highlight
              const coresHighlight = {
                'truco': { bg: 'rgba(255, 152, 0, 0.2)', border: '#ff9800', text: '#ffa726' },
                'rodada': { bg: 'rgba(33, 150, 243, 0.2)', border: '#2196f3', text: '#64b5f6' },
                'mao': { bg: 'rgba(156, 39, 176, 0.2)', border: '#9c27b0', text: '#ba68c8' },
                'info': { bg: 'rgba(158, 158, 158, 0.2)', border: '#9e9e9e', text: '#bdbdbd' }
              };
              
              const cores = isHighlight ? coresHighlight[tipoHighlight as keyof typeof coresHighlight] : null;
              
              return (
                <div
                  key={msg.id}
                  style={{
                    padding: isHighlight ? '10px 12px' : '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: isHighlight 
                      ? cores!.bg
                      : msg.jogadorId === estadoDaPartida?.meuId 
                        ? 'rgba(76, 175, 80, 0.2)' 
                        : 'rgba(66, 66, 66, 0.5)',
                    border: isHighlight
                      ? `2px solid ${cores!.border}`
                      : msg.jogadorId === estadoDaPartida?.meuId 
                        ? '1px solid rgba(76, 175, 80, 0.5)' 
                        : '1px solid rgba(100, 100, 100, 0.5)',
                    textAlign: isHighlight ? 'center' : 'left'
                  }}
                >
                  {!isHighlight && (
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: msg.jogadorId === estadoDaPartida?.meuId ? '#66bb6a' : '#64b5f6',
                      marginBottom: '4px'
                    }}>
                      {msg.nome}
                      {msg.jogadorId === estadoDaPartida?.meuId && ' (Você)'}
                    </div>
                  )}
                  <div style={{
                    fontSize: isHighlight ? '14px' : '13px',
                    color: isHighlight ? cores!.text : '#fff',
                    fontWeight: isHighlight ? 'bold' : 'normal',
                    wordWrap: 'break-word'
                  }}>
                    {msg.mensagem}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input de Mensagem */}
        <form
          onSubmit={enviarMensagemChat}
          style={{
            padding: '12px',
            borderTop: '2px solid #444',
            display: 'flex',
            gap: '8px'
          }}
        >
          <input
            type="text"
            value={mensagemChat}
            onChange={(e) => setMensagemChat(e.target.value)}
            placeholder="Digite sua mensagem..."
            maxLength={200}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid #555',
              borderRadius: '6px',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!mensagemChat.trim()}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 'bold',
              backgroundColor: mensagemChat.trim() ? '#4caf50' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: mensagemChat.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            ➤
          </button>
        </form>
      </div>

      {/* Botão Voltar ao Lobby */}
      <button
        onClick={() => {
          setEtapa('logado')
          setEstadoDaPartida(null)
        }}
        style={{
          marginTop: '30px',
          padding: '10px 20px',
          fontSize: '14px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔙 Voltar ao Lobby
      </button>
    </div>
  );
  }

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>🃏 Truco LAN</h1>
      
      {/* Status da Conexão */}
      <div style={{ 
        fontSize: '16px', 
        marginBottom: '30px',
        padding: '15px',
        border: '2px solid #ddd',
        borderRadius: '10px',
        backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
        color: isConnected ? '#155724' : '#721c24',
        maxWidth: '300px',
        margin: '0 auto 30px auto'
      }}>
        Status: {isConnected ? '✅ Conectado' : '❌ Desconectado'}
      </div>

      {/* Renderiza Login, Lobby ou Jogo baseado na etapa */}
      {etapa === 'login' && renderLogin()}
      {etapa === 'logado' && renderLobby()}
      {etapa === 'jogo' && renderJogo()}
    </div>
  )
}

export default App
