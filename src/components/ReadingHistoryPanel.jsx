import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { getReadingDates, getAllSessions, clearHistory } from '../services/historyService';
import { getSurah } from '../data/surahs';

export default function ReadingHistoryPanel() {
  const { state, dispatch } = useApp();
  const { lang } = state;

  const [dates, setDates] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [tab, setTab] = useState('calendar'); // 'calendar' | 'sessions'
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const close = () => dispatch({ type: 'TOGGLE_HISTORY' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        getReadingDates(60),
        getAllSessions(100),
      ]);
      setDates(d);
      setSessions(s);
    } catch (err) {
      console.error('History load error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleClear = async () => {
    if (!window.confirm(t('readingHistory.clear', lang) + '?')) return;
    await clearHistory();
    loadData();
  };

  const formatDuration = (ms) => {
    if (!ms || ms < 1000) return '< 1 min';
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rm = mins % 60;
    return `${hrs}h${rm > 0 ? ` ${rm}m` : ''}`;
  };

  // Build a simple calendar grid for the selected month
  const now = new Date();
  const currentMonth = calMonth;
  const currentYear = calYear;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  // Map dates to a set for quick lookup
  const dateSet = new Set(dates.map(d => d.date));

  const calendarDays = [];
  // Empty cells before first day (Monday-start: adjust)
  const startOffset = (firstDayOfWeek + 6) % 7; // monday = 0
  for (let i = 0; i < startOffset; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, date: dateStr, hasReading: dateSet.has(dateStr), isToday: d === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear() });
  }

  const goMonthPrev = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const goMonthNext = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };
  const isCurrentMonth = calMonth === now.getMonth() && calYear === now.getFullYear();

  const totalSessions = dates.reduce((acc, d) => acc + d.sessions, 0);
  const totalDuration = dates.reduce((acc, d) => acc + d.totalDurationMs, 0);
  const totalAyahs = dates.reduce((acc, d) => acc + d.ayahsRead, 0);
  const streak = (() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dateSet.has(ds)) count++;
      else break;
    }
    return count;
  })();

  const DAY_NAMES = lang === 'fr'
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const MONTH_NAME = new Date(currentYear, currentMonth).toLocaleDateString(lang, { month: 'long', year: 'numeric' });

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal modal-history" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <i className="fas fa-clock-rotate-left" style={{ marginInlineEnd: '0.4rem' }}></i>
            {t('readingHistory.title', lang)}
          </h2>
          <button className="icon-btn" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Stats banner */}
        <div className="hist-stats">
          <div className="hist-stat">
            <span className="hist-stat-value">{streak}</span>
            <span className="hist-stat-label">{t('readingHistory.streak', lang)}</span>
          </div>
          <div className="hist-stat">
            <span className="hist-stat-value">{totalAyahs}</span>
            <span className="hist-stat-label">{t('readingHistory.ayahsRead', lang)}</span>
          </div>
          <div className="hist-stat">
            <span className="hist-stat-value">{formatDuration(totalDuration)}</span>
            <span className="hist-stat-label">{t('readingHistory.totalTime', lang)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="hist-tabs">
          <button className={`wird-tab ${tab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>
            <i className="fas fa-calendar"></i> {t('readingHistory.calendar', lang)}
          </button>
          <button className={`wird-tab ${tab === 'sessions' ? 'active' : ''}`} onClick={() => setTab('sessions')}>
            <i className="fas fa-list"></i> {t('readingHistory.sessions', lang)}
          </button>
        </div>

        <div className="hist-body">
          {loading ? (
            <div className="wird-loading">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          ) : tab === 'calendar' ? (
            <div className="hist-calendar-container">
              <div className="hist-month-nav">
                <button className="icon-btn hist-month-btn" onClick={goMonthPrev} title={lang === 'fr' ? 'Mois précédent' : 'Previous month'}>
                  <i className="fas fa-chevron-left"></i>
                </button>
                <h4 className="hist-month-title">{MONTH_NAME}</h4>
                <button className="icon-btn hist-month-btn" onClick={goMonthNext} disabled={isCurrentMonth} title={lang === 'fr' ? 'Mois suivant' : 'Next month'}>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
              <div className="hist-calendar-grid">
                {DAY_NAMES.map(d => (
                  <div key={d} className="hist-cal-header">{d}</div>
                ))}
                {calendarDays.map((cell, i) => (
                  <div
                    key={i}
                    className={`hist-cal-day ${cell?.isToday ? 'today' : ''} ${cell?.hasReading ? 'has-reading' : ''} ${!cell ? 'empty' : ''}`}
                  >
                    {cell?.day || ''}
                  </div>
                ))}
              </div>
              {dates.length === 0 && (
                <p className="wird-empty">
                  {t('readingHistory.empty', lang)}
                </p>
              )}
            </div>
          ) : (
            <div className="hist-sessions">
              {sessions.length === 0 ? (
                <p className="wird-empty">
                  {lang === 'fr' ? 'Aucune session enregistrée.' : 'No sessions recorded.'}
                </p>
              ) : (
                <>
                  {sessions.slice(0, 50).map((s, i) => {
                    const surah = getSurah(s.surah);
                    return (
                      <div key={i} className="hist-session">
                        <div className="hist-session-main">
                          <span className="hist-session-surah">
                            {surah?.ar || `S.${s.surah}`}
                          </span>
                          <span className="hist-session-range">
                            {s.ayahFrom === s.ayahTo ? `v.${s.ayahFrom}` : `v.${s.ayahFrom}-${s.ayahTo}`}
                          </span>
                        </div>
                        <div className="hist-session-meta">
                          <span>{new Date(s.timestamp).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}</span>
                          <span>{formatDuration(s.durationMs)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <button className="wird-reset-btn" onClick={handleClear} style={{ margin: '0.5rem auto', display: 'flex' }}>
                    <i className="fas fa-trash"></i>
                    {lang === 'fr' ? 'Effacer l\'historique' : 'Clear history'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-history { max-width: 540px; }
        .hist-stats {
          display: flex;
          justify-content: space-around;
          padding: 0.7rem 0.5rem;
          border-bottom: 1px solid var(--border);
          background: var(--primary-light);
        }
        .hist-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.1rem;
        }
        .hist-stat-value {
          font-family: 'Cairo', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--primary);
        }
        .hist-stat-label {
          font-family: 'Cairo', sans-serif;
          font-size: 0.65rem;
          color: var(--text-muted);
        }
        .hist-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          padding: 0 0.5rem;
        }
        .hist-body {
          padding: 1rem;
          overflow-y: auto;
          max-height: 50vh;
        }
        .hist-month-title {
          font-family: 'Cairo', sans-serif;
          font-size: 0.9rem;
          color: var(--text-secondary);
          text-align: center;
          margin: 0;
          text-transform: capitalize;
        }
        .hist-month-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          gap: 0.4rem;
        }
        .hist-month-btn {
          width: 28px;
          height: 28px;
          font-size: 0.7rem;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .hist-month-btn:hover:not(:disabled) { background: var(--primary-light); color: var(--primary); }
        .hist-month-btn:disabled { opacity: 0.3; cursor: default; }
        .hist-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
        }
        .hist-cal-header {
          font-family: 'Cairo', sans-serif;
          font-size: 0.65rem;
          color: var(--text-muted);
          text-align: center;
          padding: 0.2rem;
        }
        .hist-cal-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cairo', sans-serif;
          font-size: 0.75rem;
          color: var(--text-secondary);
          border-radius: 50%;
          transition: all 0.2s;
        }
        .hist-cal-day.empty { visibility: hidden; }
        .hist-cal-day.has-reading {
          background: var(--primary);
          color: white;
          font-weight: 600;
        }
        .hist-cal-day.today {
          border: 2px solid var(--accent);
        }
        .hist-cal-day.today.has-reading {
          border-color: var(--primary-dark);
        }
        .hist-sessions {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .hist-session {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          transition: all 0.15s;
        }
        .hist-session:hover {
          background: var(--primary-light);
          border-color: var(--primary);
        }
        .hist-session-main {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .hist-session-surah {
          font-family: 'Amiri', serif;
          font-size: 0.95rem;
          color: var(--primary);
        }
        .hist-session-range {
          font-family: 'Cairo', sans-serif;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .hist-session-meta {
          display: flex;
          gap: 0.5rem;
          font-family: 'Cairo', sans-serif;
          font-size: 0.72rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
