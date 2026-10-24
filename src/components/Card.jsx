import React from 'react';

export default function Card({ card, isFlipped, isMatched, isShaking, onClick }) {
  return (
    <button
      id={`card-${card.uniqueId}`}
      type="button"
      className={`card-container ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''} ${isShaking ? 'shake' : ''}`}
      onClick={() => onClick(card)}
      disabled={isFlipped || isMatched}
      aria-label={isFlipped || isMatched ? card.label : '未翻開的牌'}
    >
      <div className="card-inner">
        {/* Card Back (Default state before flip) */}
        <div className="card-face card-back">
          <div className="card-back-pattern">
            <div className="card-back-core">
              <span className="sparkle-icon">✦</span>
            </div>
          </div>
          <div className="card-back-shimmer" />
        </div>

        {/* Card Front (Revealed state) */}
        <div className="card-face card-front">
          <div className="card-front-content">
            <span className="card-emoji" role="img" aria-label={card.label}>
              {card.icon}
            </span>
            <span className="card-label">{card.label}</span>
          </div>
          {isMatched && (
            <div className="matched-badge">
              <span>已消除</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
