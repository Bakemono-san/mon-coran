import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { search } from '../services/quranAPI';
import { getSurah, toAr } from '../data/surahs';
import { latinToArabic } from '../data/transliteration';

export default function SearchModal() {
  const { state, dispatch, set } = useApp();
  const { lang, riwaya } = state;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phoneticMode, setPhoneticMode] = useState(false);

  const handleSearch = useCallback(async () => {
    // Sanitisation: limite longueur, supprime caractères dangereux
    const sanitized = query.trim().slice(0, 200).replace(/[<>"'&]/g, '');
    if (!sanitized || sanitized.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      let searchQuery = sanitized;
      // Mode phonétique: convertir Latin → Arabe
      if (phoneticMode) {
        searchQuery = latinToArabic(sanitized);
        if (!searchQuery || searchQuery === sanitized) {
          // Fallback: try direct search
          searchQuery = sanitized;
        }
      }
      const data = await search(searchQuery, riwaya);
      setResults(data.matches || []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    }
    setLoading(false);
  }, [query, riwaya, phoneticMode]);

  const goToAyah = (surah, ayah) => {
    set({ displayMode: 'surah', showHome: false, showDuas: false });
    dispatch({ type: 'NAVIGATE_SURAH', payload: { surah, ayah } });
    dispatch({ type: 'TOGGLE_SEARCH' });
  };

  const close = () => dispatch({ type: 'TOGGLE_SEARCH' });
  const searchModeLabel = phoneticMode
    ? (lang === 'fr' ? 'Phonétique' : lang === 'ar' ? 'كتابة صوتية' : 'Phonetic')
    : (lang === 'fr' ? 'Arabe' : lang === 'ar' ? 'عربي' : 'Arabic');

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal modal-panel--wide modal-search-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-stack">
            <div className="modal-kicker">{lang === 'fr' ? 'Exploration' : lang === 'ar' ? 'استكشاف' : 'Explore'}</div>
            <h2 className="modal-title">{t('search.title', lang)}</h2>
            <div className="modal-subtitle">
              {lang === 'fr'
                ? 'Recherche par texte arabe ou saisie phonétique.'
                : lang === 'ar'
                  ? 'ابحث بالنص العربي أو بالكتابة الصوتية.'
                  : 'Search by Arabic text or phonetic typing.'}
            </div>
          </div>
          <button className="modal-close" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-toolbar">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={phoneticMode
              ? (lang === 'fr' ? 'Ex: bismillah, rahman, fatiha…' : 'Ex: bismillah, rahman, fatiha…')
              : t('search.placeholder', lang)}
            className="modal-search-input"
            autoFocus
          />
          <button className="modal-action-btn" onClick={handleSearch} disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
          </button>
        </div>

        <div className="modal-segmented" role="tablist" aria-label={lang === 'fr' ? 'Mode de recherche' : lang === 'ar' ? 'وضع البحث' : 'Search mode'}>
          <button
            className={`modal-segmented-btn ${!phoneticMode ? 'active' : ''}`}
            onClick={() => setPhoneticMode(false)}
          >
            <i className="fas fa-font"></i> {lang === 'fr' ? 'Arabe' : lang === 'ar' ? 'عربي' : 'Arabic'}
          </button>
          <button
            className={`modal-segmented-btn ${phoneticMode ? 'active' : ''}`}
            onClick={() => setPhoneticMode(true)}
          >
            <i className="fas fa-keyboard"></i> {lang === 'fr' ? 'Phonétique' : lang === 'ar' ? 'صوتي' : 'Phonetic'}
          </button>
        </div>

        <div className="search-summary-bar">
          <span className="search-summary-pill">
            <i className="fas fa-wave-square"></i>
            {searchModeLabel}
          </span>
          <span className="search-summary-pill">
            <i className="fas fa-layer-group"></i>
            {query
              ? (lang === 'fr'
                ? `${results.length} résultat${results.length > 1 ? 's' : ''}`
                : lang === 'ar'
                  ? `${results.length} نتيجة`
                  : `${results.length} result${results.length > 1 ? 's' : ''}`)
              : (lang === 'fr' ? 'Recherche contextuelle' : lang === 'ar' ? 'بحث سياقي' : 'Context search')}
          </span>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-results modal-search-results">
          {!query && !loading && (
            <div className="search-spotlight">
              <div className="search-spotlight-icon">
                <i className="fas fa-compass"></i>
              </div>
              <div className="search-spotlight-body">
                <h3>
                  {lang === 'fr' ? 'Rechercher dans le texte coranique' : lang === 'ar' ? 'ابحث داخل النص القرآني' : 'Search inside the Quran text'}
                </h3>
                <p>
                  {lang === 'fr'
                    ? 'Saisissez un mot arabe ou activez le mode phonétique pour retrouver rapidement un verset.'
                    : lang === 'ar'
                      ? 'اكتب كلمة عربية أو فعّل البحث الصوتي للوصول بسرعة إلى الآية.'
                      : 'Type an Arabic word or enable phonetic mode to reach a verse quickly.'}
                </p>
              </div>
            </div>
          )}

          {results.length === 0 && !loading && query && (
            <div className="modal-empty">
              <i className="fas fa-search"></i>
              <div>{t('search.noResults', lang)}</div>
            </div>
          )}
          {results.map((r, i) => {
            const s = getSurah(r.surah.number);
            const surahName = lang === 'ar' ? s?.ar : lang === 'fr' ? (s?.fr || s?.en) : s?.en;
            return (
              <button key={i} className="modal-item-card search-result-card" onClick={() => goToAyah(r.surah.number, r.numberInSurah)}>
                <div className="modal-item-main">
                  <div className="search-result-head">
                    <div className="modal-item-meta">
                      {s?.ar} · {lang === 'ar' ? toAr(r.numberInSurah) : r.numberInSurah}
                    </div>
                    <div className="search-result-surah">{surahName}</div>
                  </div>
                  <div className="modal-item-ar" dir="rtl">{r.text}</div>
                  <div className="search-result-action">
                    <i className="fas fa-arrow-up-right-from-square"></i>
                    <span>
                      {lang === 'fr' ? 'Ouvrir dans la lecture' : lang === 'ar' ? 'فتح في القراءة' : 'Open in reading'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
