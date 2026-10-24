import React from 'react';
import { Trophy, Clock, Footprints, RotateCcw, Sparkles, Star } from 'lucide-react';

export default function WinModal({ time, moves, bestTime, bestMoves, onRestart }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine star rating (perfect is 8 pairs = min 8 moves)
  const getStars = () => {
    if (moves <= 10) return 3;
    if (moves <= 16) return 2;
    return 1;
  };

  const stars = getStars();
  const accuracy = Math.min(100, Math.round((8 / Math.max(moves, 8)) * 100));

  const isNewBestMoves = bestMoves && moves <= bestMoves;
  const isNewBestTime = bestTime && time <= bestTime;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-glow-bg" />

        <div className="trophy-wrapper">
          <div className="trophy-circle">
            <Trophy className="trophy-icon" size={54} />
          </div>
          <div className="trophy-stars">
            {[1, 2, 3].map((starIndex) => (
              <Star
                key={starIndex}
                className={`star-icon ${starIndex <= stars ? 'star-filled' : 'star-empty'}`}
                size={28}
                fill={starIndex <= stars ? '#f59e0b' : 'none'}
              />
            ))}
          </div>
        </div>

        <h2 className="modal-title">🎉 挑戰成功！</h2>
        <p className="modal-subtitle">太神了！所有 16 張卡牌已全數消除！</p>

        {(isNewBestMoves || isNewBestTime) && (
          <div className="record-badge">
            <Sparkles size={16} /> 創下個人最佳紀錄！
          </div>
        )}

        <div className="modal-stats-grid">
          <div className="modal-stat-item">
            <div className="stat-label">
              <Clock size={16} />
              <span>總耗時</span>
            </div>
            <div className="stat-value">{formatTime(time)}</div>
          </div>

          <div className="modal-stat-item">
            <div className="stat-label">
              <Footprints size={16} />
              <span>翻牌步數</span>
            </div>
            <div className="stat-value">{moves} 步</div>
          </div>

          <div className="modal-stat-item">
            <div className="stat-label">
              <Trophy size={16} />
              <span>最佳步數</span>
            </div>
            <div className="stat-value">{bestMoves ? `${bestMoves} 步` : '--'}</div>
          </div>

          <div className="modal-stat-item">
            <div className="stat-label">
              <Sparkles size={16} />
              <span>記憶精準度</span>
            </div>
            <div className="stat-value">{accuracy}%</div>
          </div>
        </div>

        <button
          id="restart-modal-btn"
          type="button"
          className="btn-restart-primary"
          onClick={onRestart}
        >
          <RotateCcw size={20} />
          <span>重新開始</span>
        </button>
      </div>
    </div>
  );
}
