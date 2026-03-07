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
    ? (lang === 'fr' ? 'pages' : lang === 'ar' ? 'صفحات' : 'pages')
    : wirdGoalType === 'hizb'
      ? (lang === 'fr' ? 'hizb' : lang === 'ar' ? 'حزب' : 'hizb')
      : (lang === 'fr' ? 'juz' : lang === 'ar' ? 'جزء' : 'juz');

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
    { id: 'pages', label: lang === 'fr' ? 'Pages' : lang === 'ar' ? 'صفحات' : 'Pages' },
    { id: 'hizb', label: lang === 'ar' ? 'حزب' : 'Hizb' },
    { id: 'juz', label: lang === 'ar' ? 'جزء' : 'Juz' },
  ];

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal modal-panel--wide modal-wird" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-stack">
            <div className="modal-kicker">{lang === 'fr' ? 'Discipline' : lang === 'ar' ? 'الورد' : 'Routine'}</div>
            <h2 className="modal-title">
              <i className="fas fa-bullseye"></i>
              {t('wird.title', lang)}
            </h2>
            <div className="modal-subtitle">
              {lang === 'fr'
                ? 'Suivi du wird quotidien, historique et réglage d’objectif.'
                : lang === 'ar'
                  ? 'متابعة الورد اليومي وسجلّه وضبط هدفه.'
                  : 'Daily wird tracking, history and goal settings.'}
            </div>
          </div>
          <button className="modal-close" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-segmented" role="tablist" aria-label={t('wird.title', lang)}>
          <button className={`modal-segmented-btn ${tab === 'today' ? 'active' : ''}`} onClick={() => setTab('today')}>
            <i className="fas fa-calendar-day"></i> {t('wird.today', lang)}
          </button>
          <button className={`modal-segmented-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            <i className="fas fa-chart-line"></i> {t('wird.history', lang)}
          </button>
          <button className={`modal-segmented-btn ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <i className="fas fa-sliders-h"></i> {t('wird.goal', lang)}
          </button>
        </div>

        <div className="wird-summary-bar">
          <span className="wird-summary-pill">
            <i className="fas fa-bullseye"></i>
            {goalTarget} {goalLabel}
          </span>
          <span className="wird-summary-pill">
            <i className="fas fa-chart-simple"></i>
            {progressValue} / {goalTarget}
          </span>
          <span className={`wird-summary-pill ${isComplete ? 'is-complete' : ''}`}>
            <i className={`fas ${isComplete ? 'fa-check-circle' : 'fa-hourglass-half'}`}></i>
            {progressPct}%
          </span>
        </div>

        <div className="panel-scroll wird-body">
          {loading ? (
            <div className="wird-loading">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          ) : tab === 'today' ? (
            <div className="wird-today">
              <div className="wird-progress-card">
                <div className="wird-progress-wrapper">
                  <svg viewBox="0 0 120 120" className="wird-progress-svg">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={isComplete ? 'var(--primary)' : 'var(--gold)'}
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

                <div className="wird-progress-copy">
                  <span className="wird-progress-kicker">
                    {lang === 'fr' ? 'Lecture du jour' : lang === 'ar' ? 'ورد اليوم' : 'Today'}
                  </span>
                  <h3 className="wird-progress-title">
                    {isComplete
                      ? (lang === 'fr' ? 'Objectif atteint' : lang === 'ar' ? 'تم بلوغ الهدف' : 'Goal reached')
                      : (lang === 'fr' ? 'Continuez votre wird' : lang === 'ar' ? 'واصل وردك' : 'Keep your wird moving')}
                  </h3>
                  <p className="wird-progress-copytext">
                    {lang === 'fr'
                      ? 'Le suivi reste visible dans un format plus clair pour voir immédiatement votre cadence quotidienne.'
                      : lang === 'ar'
                        ? 'تم تبسيط العرض حتى ترى تقدّمك اليومي بسرعة ووضوح.'
                        : 'The layout highlights your daily pace more clearly so progress is readable at a glance.'}
                  </p>
                </div>
              </div>

              {isComplete && (
                <div className="wird-complete-badge">
                  <i className="fas fa-check-circle"></i>
                  {lang === 'fr' ? 'Objectif atteint ! Barak Allahu fik' : lang === 'ar' ? 'تم بلوغ الهدف، بارك الله فيك' : 'Goal achieved! Barak Allahu feek'}
                </div>
              )}

              {todayWird && todayWird.entries.length > 0 && (
                <div className="wird-entries panel-stack-list">
                  <h4 className="wird-entries-title">
                    {lang === 'fr' ? "Sessions d'aujourd'hui" : lang === 'ar' ? 'جلسات اليوم' : "Today's Sessions"} ({todayWird.entries.length})
                  </h4>
                  {todayWird.entries.slice(-5).reverse().map((e, i) => (
                    <div key={i} className="wird-entry modal-item-card">
                      <span className="wird-entry-surah">
                        {lang === 'ar' ? 'س.' : 'S.'}{e.surah} : {e.fromAyah}-{e.toAyah}
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
                  <i className="fas fa-redo"></i> {lang === 'fr' ? 'Réinitialiser' : lang === 'ar' ? 'إعادة الضبط' : 'Reset'}
                </button>
              )}

              {(!todayWird || todayWird.entries.length === 0) && (
                <div className="modal-empty wird-empty">
                  {lang === 'fr'
                    ? 'Aucune lecture enregistrée aujourd\'hui. Commencez à lire le Coran pour suivre votre progression !'
                    : lang === 'ar'
                      ? 'لا توجد قراءة مسجلة اليوم. ابدأ القراءة لتتبّع تقدّمك.'
                      : 'No reading logged today. Start reading the Quran to track your progress!'}
                </div>
              )}
            </div>
          ) : tab === 'history' ? (
            <div className="wird-history">
              {history.length === 0 ? (
                <div className="modal-empty wird-empty">
                  {lang === 'fr' ? 'Aucun historique de wird.' : lang === 'ar' ? 'لا يوجد سجل للورد.' : 'No wird history.'}
                </div>
              ) : (
                <div className="wird-calendar">
                  {history.map(day => {
                    const dayProgress = wirdGoalType === 'pages' ? day.pagesRead : day.ayahsRead;
                    const dayPct = Math.min(100, Math.round((dayProgress / goalTarget) * 100));
                    return (
                      <div key={day.date} className={`wird-day modal-item-card ${dayPct >= 100 ? 'complete' : dayPct > 0 ? 'partial' : ''}`}>
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
              <div className="wird-setting-group settings-card">
                <label className="wird-setting-label">
                  {lang === 'fr' ? 'Type d\'objectif' : lang === 'ar' ? 'نوع الهدف' : 'Goal type'}
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

              <div className="wird-setting-group settings-card">
                <label className="wird-setting-label">
                  {lang === 'fr' ? 'Quantité par jour' : lang === 'ar' ? 'الكمية اليومية' : 'Amount per day'}: {wirdGoalAmount} {goalLabel}
                </label>
                <input
                  type="range"
                  min={1}
                  max={wirdGoalType === 'juz' ? 10 : wirdGoalType === 'hizb' ? 20 : 30}
                  value={wirdGoalAmount}
                  onChange={e => set({ wirdGoalAmount: parseInt(e.target.value) || 1 })}
                  className="wird-range"
                />
              </div>

              <div className="wird-info settings-info-note">
                <i className="fas fa-info-circle"></i>
                <p>
                  {lang === 'fr'
                    ? 'La progression se met à jour automatiquement quand vous lisez le Coran dans l\'application.'
                    : lang === 'ar'
                      ? 'يتم تحديث التقدّم تلقائيًا أثناء القراءة داخل التطبيق.'
                      : 'Progress updates automatically as you read the Quran in the app.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
