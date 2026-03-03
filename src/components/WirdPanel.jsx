import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { getTodayWird, getWirdHistory, resetTodayWird } from '../services/wirdService';

export default function WirdPanel() {
  const { state, dispatch, set } = useApp();
  const { lang, wirdGoalType, wirdGoalAmount } = state;

  const [todayWird, setTodayWird] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('today'); // 'today' | 'history' | 'settings'
  const [loading, setLoading] = useState(true);

  const close = () => dispatch({ type: 'TOGGLE_WIRD' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [today, hist] = await Promise.all([
        getTodayWird(),
        getWirdHistory(30),
      ]);
      setTodayWird(today);
      setHistory(hist);
    } catch (err) {
      console.error('Wird load error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const goalLabel = wirdGoalType === 'pages'
    ? (lang === 'fr' ? 'pages' : 'pages')
    : wirdGoalType === 'hizb'
      ? (lang === 'fr' ? 'hizb' : 'hizb')
      : (lang === 'fr' ? 'juz' : 'juz');

  const progressValue = todayWird
    ? (wirdGoalType === 'pages' ? todayWird.pagesRead : todayWird.ayahsRead)
    : 0;

  const goalTarget = wirdGoalAmount || 5;
  const progressPct = Math.min(100, Math.round((progressValue / goalTarget) * 100));
  const isComplete = progressPct >= 100;

  const handleReset = async () => {
    await resetTodayWird();
    loadData();
  };

  const GOAL_TYPES = [
    { id: 'pages', label: lang === 'fr' ? 'Pages' : 'Pages' },
    { id: 'hizb', label: 'Hizb' },
    { id: 'juz', label: 'Juz' },
  ];

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal modal-wird" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <i className="fas fa-bullseye" style={{ marginInlineEnd: '0.4rem' }}></i>
            {t('wird.title', lang)}
          </h2>
          <button className="icon-btn" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="wird-tabs">
          <button className={`wird-tab ${tab === 'today' ? 'active' : ''}`} onClick={() => setTab('today')}>
            <i className="fas fa-calendar-day"></i> {t('wird.today', lang)}
          </button>
          <button className={`wird-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            <i className="fas fa-chart-line"></i> {t('wird.history', lang)}
          </button>
          <button className={`wird-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <i className="fas fa-sliders-h"></i> {t('wird.goal', lang)}
          </button>
        </div>

        <div className="wird-body">
          {loading ? (
            <div className="wird-loading">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          ) : tab === 'today' ? (
            <div className="wird-today">
              {/* Progress circle */}
              <div className="wird-progress-wrapper">
                <svg viewBox="0 0 120 120" className="wird-progress-svg">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke={isComplete ? 'var(--primary)' : 'var(--accent)'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - progressPct / 100)}`}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div className="wird-progress-text">
                  <span className="wird-pct">{progressPct}%</span>
                  <span className="wird-detail">
                    {progressValue} / {goalTarget} {goalLabel}
                  </span>
                </div>
              </div>

              {isComplete && (
                <div className="wird-complete-badge">
                  <i className="fas fa-check-circle"></i>
                  {lang === 'fr' ? 'Objectif atteint ! Barak Allahu fik' : 'Goal achieved! Barak Allahu feek'}
                </div>
              )}

              {todayWird && todayWird.entries.length > 0 && (
                <div className="wird-entries">
                  <h4 className="wird-entries-title">
                    {lang === 'fr' ? "Sessions d'aujourd'hui" : "Today's Sessions"} ({todayWird.entries.length})
                  </h4>
                  {todayWird.entries.slice(-5).reverse().map((e, i) => (
                    <div key={i} className="wird-entry">
                      <span className="wird-entry-surah">
                        {lang === 'fr' ? 'S.' : 'S.'}{e.surah} : {e.fromAyah}-{e.toAyah}
                      </span>
                      <span className="wird-entry-time">
                        {new Date(e.timestamp).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {todayWird && todayWird.entries.length > 0 && (
                <button className="wird-reset-btn" onClick={handleReset}>
                  <i className="fas fa-redo"></i> {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
                </button>
              )}

              {(!todayWird || todayWird.entries.length === 0) && (
                <p className="wird-empty">
                  {lang === 'fr'
                    ? 'Aucune lecture enregistrée aujourd\'hui. Commencez à lire le Coran pour suivre votre progression !'
                    : 'No reading logged today. Start reading the Quran to track your progress!'}
                </p>
              )}
            </div>
          ) : tab === 'history' ? (
            <div className="wird-history">
              {history.length === 0 ? (
                <p className="wird-empty">
                  {lang === 'fr' ? 'Aucun historique de wird.' : 'No wird history.'}
                </p>
              ) : (
                <div className="wird-calendar">
                  {history.map(day => {
                    const dayProgress = wirdGoalType === 'pages' ? day.pagesRead : day.ayahsRead;
                    const dayPct = Math.min(100, Math.round((dayProgress / goalTarget) * 100));
                    return (
                      <div key={day.date} className={`wird-day ${dayPct >= 100 ? 'complete' : dayPct > 0 ? 'partial' : ''}`}>
                        <span className="wird-day-date">
                          {new Date(day.date + 'T00:00').toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <div className="wird-day-bar">
                          <div className="wird-day-fill" style={{ width: `${dayPct}%` }}></div>
                        </div>
                        <span className="wird-day-stat">{dayProgress}/{goalTarget}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Settings tab */
            <div className="wird-settings">
              <div className="wird-setting-group">
                <label className="wird-setting-label">
                  {lang === 'fr' ? 'Type d\'objectif' : 'Goal type'}
                </label>
                <div className="wird-setting-options">
                  {GOAL_TYPES.map(gt => (
                    <button
                      key={gt.id}
                      className={`chip ${wirdGoalType === gt.id ? 'active' : ''}`}
                      onClick={() => set({ wirdGoalType: gt.id })}
                    >
                      {gt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wird-setting-group">
                <label className="wird-setting-label">
                  {lang === 'fr' ? 'Quantité par jour' : 'Amount per day'}: {wirdGoalAmount} {goalLabel}
                </label>
                <input
                  type="range"
                  min={1}
                  max={wirdGoalType === 'juz' ? 10 : wirdGoalType === 'hizb' ? 20 : 30}
                  value={wirdGoalAmount}
                  onChange={e => set({ wirdGoalAmount: parseInt(e.target.value) || 1 })}
                  className="setting-slider"
                />
              </div>

              <div className="wird-info">
                <i className="fas fa-info-circle"></i>
                <p>
                  {lang === 'fr'
                    ? 'La progression se met à jour automatiquement quand vous lisez le Coran dans l\'application.'
                    : 'Progress updates automatically as you read the Quran in the app.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-wird { max-width: 520px; }
        .wird-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          padding: 0 0.5rem;
        }
        .wird-tab {
          flex: 1;
          padding: 0.65rem 0.5rem;
          border: none;
          background: none;
          color: var(--text-muted);
          font-family: 'Cairo', sans-serif;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .wird-tab:hover { color: var(--text); }
        .wird-tab.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
        .wird-body {
          padding: 1rem;
          overflow-y: auto;
          max-height: 55vh;
        }
        .wird-loading {
          display: flex;
          justify-content: center;
          padding: 2rem;
          color: var(--text-muted);
          font-size: 1.5rem;
        }
        .wird-today {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .wird-progress-wrapper {
          position: relative;
          width: 160px;
          height: 160px;
        }
        .wird-progress-svg {
          width: 100%;
          height: 100%;
        }
        .wird-progress-text {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .wird-pct {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text);
          font-family: 'Cairo', sans-serif;
        }
        .wird-detail {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: 'Cairo', sans-serif;
        }
        .wird-complete-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: var(--radius);
          font-family: 'Cairo', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
        }
        .wird-entries {
          width: 100%;
        }
        .wird-entries-title {
          font-family: 'Cairo', sans-serif;
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }
        .wird-entry {
          display: flex;
          justify-content: space-between;
          padding: 0.4rem 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          margin-bottom: 0.3rem;
          font-family: 'Cairo', sans-serif;
          font-size: 0.78rem;
        }
        .wird-entry-surah { color: var(--primary); }
        .wird-entry-time { color: var(--text-muted); }
        .wird-reset-btn {
          padding: 0.4rem 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--bg);
          color: var(--text-muted);
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          font-size: 0.78rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          transition: all 0.2s;
        }
        .wird-reset-btn:hover {
          background: var(--primary-light);
          color: var(--primary);
        }
        .wird-empty {
          text-align: center;
          color: var(--text-muted);
          padding: 2rem 1rem;
          font-family: 'Cairo', sans-serif;
          font-size: 0.85rem;
          line-height: 1.6;
        }
        .wird-calendar {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .wird-day {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }
        .wird-day.complete { border-color: var(--primary); background: var(--primary-light); }
        .wird-day-date {
          font-family: 'Cairo', sans-serif;
          font-size: 0.75rem;
          color: var(--text-secondary);
          min-width: 90px;
        }
        .wird-day-bar {
          flex: 1;
          height: 6px;
          background: var(--border);
          border-radius: 3px;
          overflow: hidden;
        }
        .wird-day-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 3px;
          transition: width 0.3s;
        }
        .wird-day.partial .wird-day-fill { background: var(--accent); }
        .wird-day.complete .wird-day-fill { background: var(--primary); }
        .wird-day-stat {
          font-family: 'Cairo', sans-serif;
          font-size: 0.72rem;
          color: var(--text-muted);
          min-width: 42px;
          text-align: end;
        }
        .wird-settings {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .wird-setting-group {
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }
        .wird-setting-label {
          display: block;
          font-family: 'Cairo', sans-serif;
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin-bottom: 0.4rem;
          font-weight: 600;
        }
        .wird-setting-options {
          display: flex;
          gap: 0.4rem;
        }
        .wird-info {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.65rem;
          background: var(--primary-light);
          border-radius: var(--radius-sm);
          border: 1px solid rgba(var(--primary-rgb), 0.15);
        }
        .wird-info i {
          color: var(--primary);
          margin-top: 2px;
          flex-shrink: 0;
        }
        .wird-info p {
          font-family: 'Cairo', sans-serif;
          font-size: 0.76rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
