import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Clock,
  Footprints,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
} from 'lucide-react';
import Card from './components/Card';
import WinModal from './components/WinModal';
import { THEMES } from './constants/themes';
import { sound } from './utils/sound';
import './App.css';

// Fisher-Yates shuffle
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate 16 cards from 8 unique items
function generateDeck(themeCards) {
  const selectedPairs = themeCards.slice(0, 8);
  const deck = [];
  selectedPairs.forEach((item, index) => {
    deck.push({
      ...item,
      uniqueId: `${item.id}-a-${index}`,
    });
    deck.push({
      ...item,
      uniqueId: `${item.id}-b-${index}`,
    });
  });
  return shuffleArray(deck);
}

export default function App() {
  const [selectedThemeId, setSelectedThemeId] = useState('space');
  const currentTheme = THEMES.find((t) => t.id === selectedThemeId) || THEMES[0];

  const [cards, setCards] = useState(() => generateDeck(currentTheme.cards));
  const [flippedCards, setFlippedCards] = useState([]); // array of card objects (max 2)
  const [matchedCardIds, setMatchedCardIds] = useState(new Set()); // Set of uniqueIds
  const [shakingCardIds, setShakingCardIds] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // LocalStorage Best Records
  const [bestMoves, setBestMoves] = useState(() => {
    const saved = localStorage.getItem('memory_game_best_moves');
    return saved ? parseInt(saved, 10) : null;
  });
  const [bestTime, setBestTime] = useState(() => {
    const saved = localStorage.getItem('memory_game_best_time');
    return saved ? parseInt(saved, 10) : null;
  });

  const timerRef = useRef(null);

  // Timer interval
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Restart / Reset Game
  const restartGame = useCallback(
    (themeId = selectedThemeId) => {
      if (timerRef.current) clearInterval(timerRef.current);
      const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
      setCards(generateDeck(theme.cards));
      setFlippedCards([]);
      setMatchedCardIds(new Set());
      setShakingCardIds(new Set());
      setMoves(0);
      setSeconds(0);
      setIsTimerRunning(false);
      setIsEvaluating(false);
      setIsWon(false);
    },
    [selectedThemeId]
  );

  // Switch Theme
  const handleThemeChange = (newThemeId) => {
    setSelectedThemeId(newThemeId);
    restartGame(newThemeId);
  };

  // Toggle Mute
  const handleToggleSound = () => {
    const active = sound.toggleSound();
    setIsMuted(!active);
  };

  // Trigger celebratory confetti
  const triggerConfetti = () => {
    const end = Date.now() + 2500;
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  // Card click handler
  const handleCardClick = (clickedCard) => {
    if (isEvaluating || isWon) return;
    if (flippedCards.some((c) => c.uniqueId === clickedCard.uniqueId)) return;
    if (matchedCardIds.has(clickedCard.uniqueId)) return;

    // Start timer on very first move
    if (!isTimerRunning && seconds === 0 && moves === 0) {
      setIsTimerRunning(true);
    }

    sound.playFlip();

    const newFlipped = [...flippedCards, clickedCard];
    setFlippedCards(newFlipped);

    // If 2 cards are flipped
    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      setMoves((prev) => prev + 1);
      setIsEvaluating(true);

      // Check match by base item ID
      if (first.id === second.id) {
        // MATCH!
        setTimeout(() => {
          sound.playMatch();
          setMatchedCardIds((prev) => {
            const next = new Set(prev);
            next.add(first.uniqueId);
            next.add(second.uniqueId);

            // Check if all 16 cards are matched
            if (next.size === 16) {
              setIsTimerRunning(false);
              setIsWon(true);
              sound.playWin();
              triggerConfetti();

              // Update best records
              setMoves((finalMoves) => {
                setBestMoves((prevBest) => {
                  if (!prevBest || finalMoves < prevBest) {
                    localStorage.setItem('memory_game_best_moves', finalMoves.toString());
                    return finalMoves;
                  }
                  return prevBest;
                });
                return finalMoves;
              });

              setSeconds((finalSecs) => {
                setBestTime((prevBestTime) => {
                  if (!prevBestTime || finalSecs < prevBestTime) {
                    localStorage.setItem('memory_game_best_time', finalSecs.toString());
                    return finalSecs;
                  }
                  return prevBestTime;
                });
                return finalSecs;
              });
            }
            return next;
          });

          setFlippedCards([]);
          setIsEvaluating(false);
        }, 350);
      } else {
        // MISMATCH!
        setTimeout(() => {
          sound.playMismatch();
          setShakingCardIds(new Set([first.uniqueId, second.uniqueId]));
        }, 300);

        setTimeout(() => {
          setFlippedCards([]);
          setShakingCardIds(new Set());
          setIsEvaluating(false);
        }, 1000);
      }
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const matchedPairsCount = Math.floor(matchedCardIds.size / 2);
  const progressPercent = Math.round((matchedPairsCount / 8) * 100);

  return (
    <div className="game-app">
      {/* Background ambient lighting */}
      <div className="ambient-blob blob-1" />
      <div className="ambient-blob blob-2" />

      {/* Main Container */}
      <div className="game-container">
        {/* Header Bar */}
        <header className="game-header">
          <div className="brand-group">
            <div className="brand-icon">
              <Sparkles size={24} className="sparkle-spin" />
            </div>
            <div>
              <h1 className="game-title">記憶翻牌大挑戰</h1>
              <p className="game-subtitle">考驗你的眼力與極限記憶力（16張卡牌）</p>
            </div>
          </div>

          <div className="header-actions">
            {/* Theme Selector */}
            <div className="theme-selector-wrapper">
              <Layers size={16} className="theme-icon" />
              <select
                id="theme-select"
                value={selectedThemeId}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="theme-select"
                aria-label="選擇卡牌主題"
              >
                {THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              type="button"
              className={`icon-btn ${isMuted ? 'muted' : ''}`}
              onClick={handleToggleSound}
              title={isMuted ? '開啟音效' : '靜音'}
              aria-label={isMuted ? '開啟音效' : '靜音'}
            >
              {isMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
            </button>

            {/* Quick Restart */}
            <button
              id="header-restart-btn"
              type="button"
              className="icon-btn btn-restart"
              onClick={() => restartGame()}
              title="重新洗牌開始"
              aria-label="重新開始遊戲"
            >
              <RotateCcw size={19} />
            </button>
          </div>
        </header>

        {/* Stats Dashboard */}
        <section className="stats-dashboard" aria-label="遊戲數據">
          <div className="stat-card" id="stat-time">
            <div className="stat-icon-wrap icon-blue">
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">遊戲時間</span>
              <span className="stat-number">{formatTime(seconds)}</span>
            </div>
          </div>

          <div className="stat-card" id="stat-moves">
            <div className="stat-icon-wrap icon-amber">
              <Footprints size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">翻牌步數</span>
              <span className="stat-number">
                {moves} <small className="unit">步</small>
              </span>
            </div>
          </div>

          <div className="stat-card" id="stat-best">
            <div className="stat-icon-wrap icon-purple">
              <Trophy size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-title">最佳紀錄</span>
              <span className="stat-number">
                {bestMoves ? `${bestMoves} 步` : '--'}
                {bestTime ? ` (${formatTime(bestTime)})` : ''}
              </span>
            </div>
          </div>

          <div className="stat-card stat-progress-card" id="stat-progress">
            <div className="stat-info" style={{ width: '100%' }}>
              <div className="progress-label-row">
                <span className="stat-title">消除進度</span>
                <span className="progress-count">{matchedPairsCount} / 8 組</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Game Grid: 16 Cards (4x4) */}
        <main className="game-grid-wrapper">
          <div className="game-grid" id="card-grid">
            {cards.map((card) => {
              const isFlipped =
                flippedCards.some((c) => c.uniqueId === card.uniqueId) ||
                matchedCardIds.has(card.uniqueId);
              const isMatched = matchedCardIds.has(card.uniqueId);
              const isShaking = shakingCardIds.has(card.uniqueId);

              return (
                <Card
                  key={card.uniqueId}
                  card={card}
                  isFlipped={isFlipped}
                  isMatched={isMatched}
                  isShaking={isShaking}
                  onClick={handleCardClick}
                />
              );
            })}
          </div>
        </main>

        {/* Controls footer */}
        <footer className="game-footer">
          <button
            id="main-restart-btn"
            type="button"
            className="btn-main-restart"
            onClick={() => restartGame()}
          >
            <RotateCcw size={18} />
            <span>重新開始遊戲</span>
          </button>
        </footer>
      </div>

      {/* Completion Modal */}
      {isWon && (
        <WinModal
          time={seconds}
          moves={moves}
          bestTime={bestTime}
          bestMoves={bestMoves}
          onRestart={() => restartGame()}
        />
      )}
    </div>
  );
}
