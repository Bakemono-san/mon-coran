import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import SURAHS, { toAr } from '../data/surahs';
import { JUZ_DATA, JUZ_PAGE_RANGES } from '../data/juz';
import '../styles/sidebar.css';

export default function Sidebar() {
  const { state, dispatch, set } = useApp();
  const { sidebarOpen, lang, displayMode, currentSurah, currentPage, currentJuz, riwaya } = state;
  
  // Mode page non disponible pour Warsh
  const availableTabs = riwaya === 'warsh' ? ['surah', 'juz'] : ['surah', 'juz', 'page'];

  const [tab, setTab] = useState('surah'); // 'surah' | 'juz' | 'page'
  
  // Réinitialiser l'onglet si on passe à Warsh et qu'on était sur "page"
  useEffect(() => {
    if (riwaya === 'warsh' && tab === 'page') {
      setTab('surah');
    }
  }, [riwaya, tab]);
  const [filter, setFilter] = useState('');
  const [pageInput, setPageInput] = useState('');
  const [selectedJuzForPages, setSelectedJuzForPages] = useState(1);

  const filteredSurahs = useMemo(() => {
    if (!filter) return SURAHS;
    const q = filter.toLowerCase();
    return SURAHS.filter(s =>
      s.ar.includes(filter) ||
      s.en.toLowerCase().includes(q) ||
      s.fr.toLowerCase().includes(q) ||
      String(s.n) === filter
    );
  }, [filter]);

  const goSurah = (n) => {
    set({ displayMode: 'surah' });
    dispatch({ type: 'NAVIGATE_SURAH', payload: { surah: n, ayah: 1 } });
  };

  const goPage = (p) => {
    set({ displayMode: 'page' });
    dispatch({ type: 'NAVIGATE_PAGE', payload: { page: p } });
  };

  const goJuz = (juz) => {
    dispatch({ type: 'NAVIGATE_JUZ', payload: { juz } });
  };

  return (
    <aside
      className={`sidebar ${sidebarOpen ? 'open' : ''}`}
      role="navigation"
      aria-label={t('nav.surahList', lang)}
    >
      {/* Tabs */}
      <div className="sidebar-tabs">
        {availableTabs.map(t2 => (
          <button
            key={t2}
            className={`sidebar-tab ${tab === t2 ? 'active' : ''}`}
            onClick={() => setTab(t2)}
            aria-pressed={tab === t2}
          >
            {t2 === 'surah' && t('sidebar.surahs', lang)}
            {t2 === 'juz' && t('sidebar.juz', lang)}
            {t2 === 'page' && t('quran.page', lang)}
          </button>
        ))}
      </div>

      {/* Search (only for surah tab) */}
      {tab === 'surah' && (
        <div className="sidebar-search">
          <i className="fas fa-search sidebar-search-icon" aria-hidden="true"></i>
          <input
            type="text"
            placeholder={t('search.placeholder', lang)}
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="sidebar-search-input"
            aria-label={t('search.placeholder', lang)}
          />
        </div>
      )}

      {/* Content */}
      <div className="sidebar-list">
        {/* Surah list */}
        {tab === 'surah' && filteredSurahs.map(s => (
          <button
            key={s.n}
            className={`sidebar-item ${s.n === currentSurah ? 'active' : ''}`}
            onClick={() => goSurah(s.n)}
            aria-current={s.n === currentSurah ? 'page' : undefined}
          >
            <span className="sidebar-item-num">{lang === 'ar' ? toAr(s.n) : s.n}</span>
            <div className="sidebar-item-info">
              <span className="sidebar-item-name">{s.ar}</span>
              <span className="sidebar-item-sub">
                {lang === 'fr' ? s.fr : lang === 'en' ? s.en : ''}{' '}
                · {s.ayahs} {t('quran.ayah', lang)}
              </span>
            </div>
            <span className={`sidebar-item-type ${s.type === 'Meccan' ? 'meccan' : 'medinan'}`}>
              {s.type === 'Meccan'
                ? (lang === 'ar' ? 'مكية' : lang === 'fr' ? 'Mecquoise' : 'Meccan')
                : (lang === 'ar' ? 'مدنية' : lang === 'fr' ? 'Médinoise' : 'Medinan')
              }
            </span>
          </button>
        ))}

        {/* Juz list */}
        {tab === 'juz' && JUZ_DATA.map(j => {
          const startSurah = SURAHS.find(s => s.n === j.start.s);
          return (
            <button
              key={j.juz}
              className={`sidebar-item ${j.juz === currentJuz && displayMode === 'juz' ? 'active' : ''}`}
              onClick={() => goJuz(j.juz)}
              aria-current={j.juz === currentJuz && displayMode === 'juz' ? 'page' : undefined}
            >
              <span className="sidebar-item-num">
                {lang === 'ar' ? toAr(j.juz) : j.juz}
              </span>
              <div className="sidebar-item-info">
                <span className="sidebar-item-name">{j.name}</span>
                <span className="sidebar-item-sub">
                  {t('sidebar.juz', lang)} {j.juz} · {startSurah?.ar || ''} {t('quran.ayah', lang)} {j.start.a}
                </span>
              </div>
            </button>
          );
        })}

        {/* Page navigation - with juz selector and direct input */}
        {tab === 'page' && (
          <>
            {/* Direct page input */}
            <div className="page-direct-input">
              <input
                type="number"
                min={1}
                max={604}
                placeholder={lang === 'ar' ? 'رقم الصفحة' : lang === 'fr' ? 'N° page' : 'Page #'}
                value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const p = parseInt(pageInput, 10);
                    if (p >= 1 && p <= 604) {
                      goPage(p);
                      setPageInput('');
                    }
                  }
                }}
                className="page-input"
                aria-label={lang === 'ar' ? 'رقم الصفحة' : lang === 'fr' ? 'N° page' : 'Page #'}
              />
              <button
                className="page-go-btn"
                aria-label={lang === 'ar' ? 'اذهب' : lang === 'fr' ? 'Aller' : 'Go'}
                onClick={() => {
                  const p = parseInt(pageInput, 10);
                  if (p >= 1 && p <= 604) {
                    goPage(p);
                    setPageInput('');
                  }
                }}
              >
                <i className="fas fa-arrow-right" aria-hidden="true"></i>
              </button>
            </div>

            {/* Juz selector for pages */}
            <div className="page-juz-selector">
              {JUZ_PAGE_RANGES.map(range => (
                <button
                  key={range.juz}
                  className={`page-juz-btn ${selectedJuzForPages === range.juz ? 'active' : ''}`}
                  onClick={() => setSelectedJuzForPages(range.juz)}
                  aria-pressed={selectedJuzForPages === range.juz}
                >
                  {lang === 'ar' ? toAr(range.juz) : range.juz}
                </button>
              ))}
            </div>

            {/* Pages grid for selected juz */}
            <div className="page-grid">
              {(() => {
                const range = JUZ_PAGE_RANGES.find(r => r.juz === selectedJuzForPages) || JUZ_PAGE_RANGES[0];
                const pages = [];
                for (let p = range.startPage; p <= range.endPage; p++) {
                  pages.push(p);
                }
                return pages.map(p => (
                  <button
                    key={p}
                    className={`page-cell ${p === currentPage ? 'active' : ''}`}
                    onClick={() => goPage(p)}
                    aria-current={p === currentPage ? 'page' : undefined}
                  >
                    {lang === 'ar' ? toAr(p) : p}
                  </button>
                ));
              })()}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
