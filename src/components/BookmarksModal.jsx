import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { getAllBookmarks, removeBookmark } from '../services/storageService';
import { getSurah, toAr } from '../data/surahs';

export default function BookmarksModal() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;

  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    getAllBookmarks().then(bms => {
      setBookmarks(bms.sort((a, b) => b.createdAt - a.createdAt));
    });
  }, []);

  const goTo = (surah, ayah) => {
    set({ displayMode: 'surah', showHome: false, showDuas: false });
    dispatch({ type: 'NAVIGATE_SURAH', payload: { surah, ayah } });
    dispatch({ type: 'TOGGLE_BOOKMARKS' });
  };

  const handleRemove = async (surah, ayah) => {
    await removeBookmark(surah, ayah);
    setBookmarks(prev => prev.filter(b => b.id !== `${surah}:${ayah}`));
  };

  const close = () => dispatch({ type: 'TOGGLE_BOOKMARKS' });

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-stack">
            <div className="modal-kicker">{lang === 'fr' ? 'Bibliothèque' : lang === 'ar' ? 'المكتبة' : 'Library'}</div>
            <h2 className="modal-title">
              <i className="fas fa-bookmark"></i>
              {t('bookmarks.title', lang)}
            </h2>
            <div className="modal-subtitle">
              {lang === 'fr'
                ? 'Retrouvez rapidement vos versets enregistrés.'
                : lang === 'ar'
                  ? 'استرجع الآيات المحفوظة بسرعة.'
                  : 'Quick access to your saved verses.'}
            </div>
          </div>
          <button className="modal-close" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-list">
          {bookmarks.length === 0 ? (
            <div className="modal-empty">
              <i className="fas fa-bookmark"></i>
              <div>{t('bookmarks.empty', lang)}</div>
            </div>
          ) : (
            bookmarks.map(bm => {
              const s = getSurah(bm.surah);
              return (
                <div key={bm.id} className="modal-item-card">
                  <button className="modal-item-main" onClick={() => goTo(bm.surah, bm.ayah)}>
                    <span className="modal-item-ar">{s?.ar}</span>
                    <span className="modal-item-meta" style={{ display: 'block', marginTop: '0.24rem', marginBottom: 0 }}>
                      {t('quran.ayah', lang)} {lang === 'ar' ? toAr(bm.ayah) : bm.ayah}
                    </span>
                  </button>
                  <button
                    className="modal-action-btn modal-delete-btn"
                    onClick={() => handleRemove(bm.surah, bm.ayah)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
