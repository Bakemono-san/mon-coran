import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { getAllNotes, deleteNote } from '../services/storageService';
import { getSurah, toAr } from '../data/surahs';

export default function NotesPanel() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;

  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);

  const loadNotes = useCallback(async () => {
    const all = await getAllNotes();
    setNotes(all.sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (open) loadNotes();
  }, [open, loadNotes]);

  const goTo = (surah, ayah) => {
    set({ displayMode: 'surah' });
    dispatch({ type: 'NAVIGATE_SURAH', payload: { surah, ayah } });
  };

  const handleDelete = async (surah, ayah) => {
    if (!window.confirm(lang === 'fr' ? 'Supprimer cette note ?' : 'Delete this note?')) return;
    await deleteNote(surah, ayah);
    loadNotes();
  };

  return (
    <>
      {/* Toggle button (floating) */}
      <button
        className="notes-fab"
        onClick={() => setOpen(!open)}
        title={t('notes.title', lang)}
      >
        <i className="fas fa-sticky-note"></i>
        {notes.length > 0 && <span className="notes-count">{notes.length}</span>}
      </button>

      {/* Notes panel */}
      {open && (
        <aside className="notes-panel">
          <div className="notes-panel-header">
            <h3 className="notes-panel-title">{t('notes.title', lang)}</h3>
            <button className="icon-btn" onClick={() => setOpen(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="notes-list">
            {notes.length === 0 ? (
              <p className="notes-empty">{t('notes.empty', lang)}</p>
            ) : (
              notes.map(note => {
                const s = getSurah(note.surah);
                return (
                  <div key={note.id} className="note-card">
                    <button className="note-card-header" onClick={() => goTo(note.surah, note.ayah)}>
                      <span className="note-card-ref">
                        {s?.ar} — {t('quran.ayah', lang)} {lang === 'ar' ? toAr(note.ayah) : note.ayah}
                      </span>
                      <i className="fas fa-arrow-left note-card-go"></i>
                    </button>
                    <p className="note-card-text">{note.text}</p>
                    <div className="note-card-footer">
                      <span className="note-card-date">
                        {new Date(note.updatedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US')}
                      </span>
                      <button className="icon-btn note-card-del" onClick={() => handleDelete(note.surah, note.ayah)}>
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}

      <style>{`
        .notes-fab {
          position: fixed;
          bottom: calc(var(--player-h) + 3.5rem);
          z-index: 250;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gold), #C9A72C);
          color: white;
          border: 2px solid rgba(255,255,255,0.15);
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(212,175,55,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          transition: all var(--tr-fast);
        }
        [dir="rtl"] .notes-fab { left: 1rem; }
        [dir="ltr"] .notes-fab { right: 1rem; }
        .notes-fab:hover {
          transform: scale(1.12) translateY(-2px);
          box-shadow: 0 6px 24px rgba(212,175,55,0.45);
        }
        .notes-count {
          position: absolute;
          top: -5px;
          right: -5px;
          background: var(--primary);
          color: white;
          font-size: 0.6rem;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--surface);
        }

        .notes-panel {
          position: fixed;
          top: var(--header-h);
          bottom: var(--player-h);
          width: 320px;
          background: var(--surface);
          border-inline-start: 1px solid var(--border);
          z-index: 200;
          display: flex;
          flex-direction: column;
          animation: fadeInUp 0.25s ease;
          box-shadow: var(--shadow-lg);
        }
        [dir="rtl"] .notes-panel { left: 0; }
        [dir="ltr"] .notes-panel { right: 0; }
        .notes-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 0.9rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
        }
        .notes-panel-title {
          font-family: 'Amiri', serif;
          font-size: 1.05rem;
          color: var(--primary);
          margin: 0;
        }
        .notes-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.6rem;
        }
        .notes-empty {
          text-align: center;
          color: var(--text-muted);
          padding: 2rem;
          font-family: 'Cairo', sans-serif;
          font-size: 0.85rem;
        }
        .note-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 0.74rem;
          margin-bottom: 0.5rem;
          transition: all 0.15s;
        }
        .note-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .note-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0;
          margin-bottom: 0.3rem;
        }
        .note-card-ref {
          font-family: 'Amiri', serif;
          font-size: 0.85rem;
          color: var(--primary);
        }
        .note-card-go {
          color: var(--text-muted);
          font-size: 0.7rem;
        }
        .note-card-text {
          font-family: 'Cairo', sans-serif;
          font-size: 0.8rem;
          color: var(--text);
          margin: 0;
          line-height: 1.6;
        }
        .note-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.4rem;
        }
        .note-card-date {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-family: 'Cairo', sans-serif;
        }
        .note-card-del {
          width: 26px;
          height: 26px;
          font-size: 0.65rem;
          color: var(--text-muted);
        }
        .note-card-del:hover { color: var(--primary); }

        @media (max-width: 768px) {
          .notes-panel {
            width: 100%;
            left: 0;
            right: 0;
          }
        }
      `}</style>
    </>
  );
}
