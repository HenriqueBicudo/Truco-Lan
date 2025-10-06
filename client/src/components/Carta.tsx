import React from 'react';
import './Carta.css';

interface DadosCarta {
  valor: string;
  naipe: string;
}

interface CartaProps {
  dadosDaCarta: DadosCarta;
  isPlayable?: boolean;
  onClick?: (carta: DadosCarta) => void;
}

const Carta: React.FC<CartaProps> = ({ dadosDaCarta, isPlayable = false, onClick }) => {
  // Mapeamento dos naipes para símbolos Unicode
  const mapearSimboloNaipe = (naipe: string) => {
    const simbolos = {
      'Ouros': '♦',
      'Paus': '♣', 
      'Copas': '♥',
      'Espadas': '♠'
    };
    return simbolos[naipe as keyof typeof simbolos] || '♠';
  };

  // Mapeamento de cores dos naipes
  const mapearCorNaipe = (naipe: string) => {
    const cores = {
      'Ouros': '#dc3545',    // Vermelho
      'Paus': '#000000',     // Preto
      'Copas': '#dc3545',    // Vermelho
      'Espadas': '#000000'   // Preto
    };
    return cores[naipe as keyof typeof cores] || '#000000';
  };

  // Se não há dados da carta, não renderiza nada
  if (!dadosDaCarta) {
    return null;
  }

  const simboloNaipe = mapearSimboloNaipe(dadosDaCarta.naipe);
  const corNaipe = mapearCorNaipe(dadosDaCarta.naipe);

  const handleClick = () => {
    if (isPlayable && onClick) {
      onClick(dadosDaCarta);
    }
  };

  return (
    <div 
      className={`carta ${isPlayable ? 'carta-jogavel' : ''}`}
      onClick={handleClick}
      style={{ color: corNaipe }}
    >
      <div className="carta-conteudo">
        <div className="carta-canto-superior">
          <div className="carta-valor">{dadosDaCarta.valor}</div>
          <div className="carta-naipe">{simboloNaipe}</div>
        </div>
        
        <div className="carta-centro">
          <div className="carta-naipe-grande">{simboloNaipe}</div>
        </div>
        
        <div className="carta-canto-inferior">
          <div className="carta-valor-invertido">{dadosDaCarta.valor}</div>
          <div className="carta-naipe-invertido">{simboloNaipe}</div>
        </div>
      </div>
    </div>
  );
};

export default Carta;
