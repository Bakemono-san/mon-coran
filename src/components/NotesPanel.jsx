import React, { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { getAllNotes, deleteNote, saveNote } from "../services/storageService";
import { getSurah, toAr } from "../data/surahs";
import { cn } from "../lib/utils";

export default function NotesPanel() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;

  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const editRef = useRef(null);
  const searchRef = useRef(null);

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

  // Auto-focus textarea when editing
  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.setSelectionRange(
        editRef.current.value.length,
        editRef.current.value.length,
      );
    }
  }, [editingId]);

  // Auto-focus search when panel opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 80);
  }, [open]);

  const goTo = (surah, ayah) => {
    set({ displayMode: "surah" });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
    setOpen(false);
  };

  const handleDelete = async (id, surah, ayah) => {
    if (deletingId === id) {
      await deleteNote(surah, ayah);
      setDeletingId(null);
      loadNotes();
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 2500);
    }
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSave = async (surah, ayah) => {
    if (!editText.trim()) return;
    setSaving(true);
    await saveNote(surah, ayah, editText.trim());
    setSaving(false);
    setEditingId(null);
    setEditText("");
    loadNotes();
  };

  const filteredNotes = notes.filter((note) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const s = getSurah(note.surah);
    return (
      note.text.toLowerCase().includes(q) ||
      s?.ar?.includes(q) ||
      s?.fr?.toLowerCase().includes(q) ||
      s?.en?.toLowerCase().includes(q) ||
      String(note.surah).includes(q) ||
      String(note.ayah).includes(q)
    );
  });

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString(
      lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US",
      { day: "numeric", month: "short", year: "numeric" },
    );
  };

  return (
    <>
      {/* ── FAB ── */}
      <button
        onClick={() => setOpen(!open)}
        title={t("notes.title", lang)}
        aria-label={t("notes.title", lang)}
        aria-expanded={open}
        className={cn(
          "fixed z-[250] flex items-center justify-center",
          "w-11 h-11 rounded-full cursor-pointer outline-none",
          "transition-all duration-200",
          "shadow-[0_4px_20px_rgba(212,168,32,0.35)]",
          open
            ? "bg-[var(--primary)] text-white scale-110"
            : "bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark,#b8860b)] text-white hover:scale-110 hover:-translate-y-0.5",
          "focus-visible:ring-2 focus-visible:ring-[var(--gold)]/50 focus-visible:ring-offset-2",
        )}
        style={{
          bottom: "calc(var(--player-h) + 5rem)",
          [lang === "ar" ? "left" : "right"]: "1rem",
        }}
      >
        <i
          className={cn(
            "text-[1rem] transition-transform duration-200",
            open ? "fas fa-times" : "fas fa-sticky-note",
          )}
        />
        {!open && notes.length > 0 && (
          <span
            className={cn(
              "absolute -top-1 min-w-[18px] h-[18px] px-1",
              "flex items-center justify-center rounded-full",
              "bg-[var(--primary)] text-white text-[0.58rem] font-bold",
              "border-2 border-white font-[var(--font-ui)]",
              lang === "ar" ? "-left-1" : "-right-1",
            )}
          >
            {notes.length > 99 ? "99+" : notes.length}
          </span>
        )}
      </button>

      {/* ── Panel ── */}
      {open && (
        <>
          {/* Backdrop — visible below sm (when panel is full-width) */}
          <div
            className="fixed inset-0 z-[195] bg-black/40 backdrop-blur-[2px] sm:hidden"
            onClick={() => setOpen(false)}
          />

          <aside
            className={cn(
              "notes-panel-aside",
              "fixed z-[200] flex flex-col",
              "bg-[var(--bg-card)]",
              "shadow-[0_-4px_32px_rgba(0,0,0,0.18),var(--shadow-xl)]",
              /* mobile: bottom sheet, full width */
              "left-0 right-0 w-full rounded-t-2xl border-t border-[var(--border)]",
              "max-h-[78dvh]",
              /* sm+: side panel pinned to edge, full height between header & player */
              "sm:rounded-none sm:max-h-none sm:w-[340px] sm:border-t-0 sm:border-s",
              lang === "ar"
                ? "sm:left-0 sm:right-auto"
                : "sm:right-0 sm:left-auto",
            )}
            style={{
              bottom: "var(--player-h)",
              animation: "slideInPanel 0.25s cubic-bezier(0.16,1,0.3,1)",
            }}
            role="complementary"
            aria-label={t("notes.title", lang)}
          >
            {/* ── Header ── */}
            <div
              className={cn(
                "flex items-center justify-between shrink-0",
                "px-4 py-3 border-b border-[var(--border-light)]",
                "bg-[var(--bg-secondary)]",
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    "bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/10",
                  )}
                >
                  <i
                    className="fas fa-sticky-note text-[0.8rem]"
                    style={{ color: "var(--gold)" }}
                  />
                </div>
                <div>
                  <h3 className="text-[0.88rem] font-bold text-[var(--text-primary)] font-[var(--font-ui)] leading-tight">
                    {t("notes.title", lang)}
                  </h3>
                  {notes.length > 0 && (
                    <p className="text-[0.63rem] text-[var(--text-muted)] font-[var(--font-ui)] leading-tight">
                      {lang === "fr"
                        ? `${notes.length} note${notes.length > 1 ? "s" : ""}`
                        : lang === "ar"
                          ? `${toAr(notes.length)} ملاحظات`
                          : `${notes.length} note${notes.length > 1 ? "s" : ""}`}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg",
                  "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                  "hover:bg-[var(--bg-tertiary)] transition-all duration-150",
                  "cursor-pointer outline-none",
                  "focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30",
                )}
                aria-label={
                  lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"
                }
              >
                <i className="fas fa-times text-[0.75rem]" />
              </button>
            </div>

            {/* ── Search bar ── */}
            {notes.length > 0 && (
              <div className="shrink-0 px-3 py-2.5 border-b border-[var(--border-light)]">
                <div className="relative">
                  <i className="fas fa-search absolute start-3 top-1/2 -translate-y-1/2 text-[0.65rem] text-[var(--text-muted)] pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={
                      lang === "fr"
                        ? "Rechercher dans les notes…"
                        : lang === "ar"
                          ? "البحث في الملاحظات…"
                          : "Search notes…"
                    }
                    className={cn(
                      "w-full ps-8 pe-8 py-2 rounded-lg text-[0.78rem]",
                      "bg-[var(--bg-secondary)] border border-[var(--border-light)]",
                      "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                      "font-[var(--font-ui)] outline-none",
                      "transition-[border-color,box-shadow] duration-150",
                      "focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(var(--primary-rgb),0.12)]",
                    )}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <i className="fas fa-times text-[0.6rem]" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Notes list ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {notes.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4 py-12">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center",
                      "bg-[var(--bg-secondary)] border border-[var(--border-light)]",
                    )}
                  >
                    <i className="fas fa-sticky-note text-[1.6rem] text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <p className="text-[0.88rem] font-semibold text-[var(--text-primary)] font-[var(--font-ui)] mb-1">
                      {lang === "fr"
                        ? "Aucune note pour l'instant"
                        : lang === "ar"
                          ? "لا توجد ملاحظات بعد"
                          : "No notes yet"}
                    </p>
                    <p className="text-[0.75rem] text-[var(--text-muted)] font-[var(--font-ui)] leading-relaxed">
                      {lang === "fr"
                        ? "Appuyez sur un verset, puis sur l'icône 📝 pour ajouter une note."
                        : lang === "ar"
                          ? "انقر على أي آية ثم اضغط على أيقونة الملاحظة."
                          : "Tap any verse, then press the note icon to add a note."}
                    </p>
                  </div>
                </div>
              ) : filteredNotes.length === 0 ? (
                /* No search results */
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center gap-3">
                  <i className="fas fa-search text-[1.4rem] text-[var(--text-muted)]" />
                  <p className="text-[0.82rem] text-[var(--text-muted)] font-[var(--font-ui)]">
                    {lang === "fr"
                      ? `Aucun résultat pour « ${search} »`
                      : lang === "ar"
                        ? `لا نتائج لـ « ${search} »`
                        : `No results for "${search}"`}
                  </p>
                  <button
                    onClick={() => setSearch("")}
                    className="text-[0.75rem] text-[var(--primary)] underline font-[var(--font-ui)] cursor-pointer"
                  >
                    {lang === "fr"
                      ? "Effacer la recherche"
                      : lang === "ar"
                        ? "مسح البحث"
                        : "Clear search"}
                  </button>
                </div>
              ) : (
                <div className="p-3 flex flex-col gap-2">
                  {filteredNotes.map((note) => {
                    const s = getSurah(note.surah);
                    const isEditing = editingId === note.id;
                    const isDeleting = deletingId === note.id;
                    return (
                      <article
                        key={note.id}
                        className={cn(
                          "rounded-xl border transition-all duration-200",
                          "bg-[var(--bg-card)]",
                          isEditing
                            ? "border-[var(--primary)] shadow-[0_0_0_3px_rgba(var(--primary-rgb),0.10)]"
                            : "border-[var(--border-light)] hover:border-[var(--border)] hover:shadow-[var(--shadow-sm)]",
                        )}
                      >
                        {/* Card header — surah ref */}
                        <div
                          className={cn(
                            "flex items-center justify-between px-3 pt-2.5 pb-2",
                            "border-b",
                            isEditing
                              ? "border-[var(--primary)]/20"
                              : "border-[var(--border-light)]",
                          )}
                        >
                          <button
                            onClick={() => goTo(note.surah, note.ayah)}
                            className={cn(
                              "flex items-center gap-2 min-w-0 cursor-pointer outline-none group",
                              "focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30 rounded-md",
                            )}
                            title={
                              lang === "fr"
                                ? "Aller à ce verset"
                                : lang === "ar"
                                  ? "الانتقال للآية"
                                  : "Go to verse"
                            }
                          >
                            <span
                              className={cn(
                                "text-[0.7rem] font-bold px-2 py-0.5 rounded-md shrink-0",
                                "bg-[var(--primary)]/10 text-[var(--primary)] font-[var(--font-ui)]",
                              )}
                            >
                              {lang === "ar"
                                ? `${toAr(note.surah)}:${toAr(note.ayah)}`
                                : `${note.surah}:${note.ayah}`}
                            </span>
                            <span className="text-[0.78rem] font-semibold text-[var(--text-primary)] font-[var(--font-ui)] truncate group-hover:text-[var(--primary)] transition-colors">
                              {s?.ar || ""}
                            </span>
                            {s && (
                              <span className="text-[0.68rem] text-[var(--text-muted)] font-[var(--font-ui)] truncate hidden sm:inline">
                                {lang === "fr" ? s.fr : s.en}
                              </span>
                            )}
                          </button>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 shrink-0 ms-2">
                            {!isEditing && (
                              <button
                                onClick={() => startEdit(note)}
                                className={cn(
                                  "w-7 h-7 flex items-center justify-center rounded-lg",
                                  "text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10",
                                  "transition-all duration-150 cursor-pointer outline-none",
                                  "focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30",
                                )}
                                title={
                                  lang === "fr"
                                    ? "Modifier"
                                    : lang === "ar"
                                      ? "تعديل"
                                      : "Edit"
                                }
                              >
                                <i className="fas fa-pen text-[0.62rem]" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleDelete(note.id, note.surah, note.ayah)
                              }
                              className={cn(
                                "w-7 h-7 flex items-center justify-center rounded-lg",
                                "transition-all duration-150 cursor-pointer outline-none",
                                isDeleting
                                  ? "bg-red-500/15 text-red-500 ring-1 ring-red-500/30"
                                  : "text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10",
                                "focus-visible:ring-2 focus-visible:ring-red-400/40",
                              )}
                              title={
                                isDeleting
                                  ? lang === "fr"
                                    ? "Confirmer la suppression"
                                    : lang === "ar"
                                      ? "تأكيد الحذف"
                                      : "Confirm delete"
                                  : lang === "fr"
                                    ? "Supprimer"
                                    : lang === "ar"
                                      ? "حذف"
                                      : "Delete"
                              }
                            >
                              <i
                                className={cn(
                                  "text-[0.62rem]",
                                  isDeleting
                                    ? "fas fa-trash-can"
                                    : "fas fa-trash-alt",
                                )}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Card body */}
                        <div className="px-3 py-2.5">
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <textarea
                                ref={editRef}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={4}
                                className={cn(
                                  "w-full px-3 py-2 rounded-lg text-[0.82rem] resize-none",
                                  "bg-[var(--bg-secondary)] border border-[var(--primary)]/40",
                                  "text-[var(--text-primary)] font-[var(--font-ui)] leading-relaxed",
                                  "outline-none transition-[border-color,box-shadow] duration-150",
                                  "focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(var(--primary-rgb),0.12)]",
                                  "placeholder:text-[var(--text-muted)]",
                                )}
                                placeholder={t("notes.placeholder", lang)}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") cancelEdit();
                                  if (
                                    e.key === "Enter" &&
                                    (e.ctrlKey || e.metaKey)
                                  )
                                    handleSave(note.surah, note.ayah);
                                }}
                              />
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[0.6rem] text-[var(--text-muted)] font-[var(--font-ui)]">
                                  {lang === "fr"
                                    ? "Ctrl+Entrée pour sauvegarder"
                                    : lang === "ar"
                                      ? "Ctrl+Enter للحفظ"
                                      : "Ctrl+Enter to save"}
                                </span>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={cancelEdit}
                                    className={cn(
                                      "px-3 py-1.5 rounded-lg text-[0.72rem] font-semibold font-[var(--font-ui)]",
                                      "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
                                      "border border-[var(--border)] hover:border-[var(--border-strong)]",
                                      "cursor-pointer outline-none transition-all duration-150",
                                    )}
                                  >
                                    {lang === "fr"
                                      ? "Annuler"
                                      : lang === "ar"
                                        ? "إلغاء"
                                        : "Cancel"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleSave(note.surah, note.ayah)
                                    }
                                    disabled={!editText.trim() || saving}
                                    className={cn(
                                      "px-3 py-1.5 rounded-lg text-[0.72rem] font-semibold font-[var(--font-ui)]",
                                      "bg-[var(--primary)] text-white",
                                      "cursor-pointer outline-none transition-all duration-150",
                                      "hover:brightness-110 active:scale-95",
                                      "disabled:opacity-50 disabled:cursor-not-allowed",
                                    )}
                                  >
                                    {saving ? (
                                      <i className="fas fa-spinner fa-spin text-[0.65rem]" />
                                    ) : lang === "fr" ? (
                                      "Sauvegarder"
                                    ) : lang === "ar" ? (
                                      "حفظ"
                                    ) : (
                                      "Save"
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p
                              className="text-[0.82rem] text-[var(--text-primary)] font-[var(--font-ui)] leading-relaxed whitespace-pre-wrap cursor-text"
                              onDoubleClick={() => startEdit(note)}
                              title={
                                lang === "fr"
                                  ? "Double-cliquez pour modifier"
                                  : lang === "ar"
                                    ? "انقر مرتين للتعديل"
                                    : "Double-click to edit"
                              }
                            >
                              {note.text}
                            </p>
                          )}
                        </div>

                        {/* Card footer */}
                        {!isEditing && (
                          <div className="flex items-center justify-between px-3 pb-2.5">
                            <span className="text-[0.62rem] text-[var(--text-muted)] font-[var(--font-ui)] flex items-center gap-1">
                              <i className="fas fa-clock text-[0.55rem]" />
                              {formatDate(note.updatedAt)}
                            </span>
                            <button
                              onClick={() => goTo(note.surah, note.ayah)}
                              className={cn(
                                "flex items-center gap-1 text-[0.65rem] font-semibold font-[var(--font-ui)]",
                                "text-[var(--primary)] hover:underline cursor-pointer outline-none",
                                "focus-visible:ring-1 focus-visible:ring-[var(--primary)]/30 rounded",
                              )}
                            >
                              {lang === "fr"
                                ? "Aller au verset"
                                : lang === "ar"
                                  ? "الانتقال للآية"
                                  : "Go to verse"}
                              <i
                                className={cn(
                                  "fas text-[0.55rem]",
                                  lang === "ar"
                                    ? "fa-arrow-right"
                                    : "fa-arrow-right",
                                )}
                              />
                            </button>
                          </div>
                        )}

                        {/* Delete confirmation hint */}
                        {isDeleting && (
                          <div className="px-3 pb-2.5 flex items-center gap-1.5">
                            <i className="fas fa-triangle-exclamation text-red-500 text-[0.65rem]" />
                            <span className="text-[0.7rem] text-red-500 font-[var(--font-ui)]">
                              {lang === "fr"
                                ? "Cliquez à nouveau pour confirmer la suppression"
                                : lang === "ar"
                                  ? "اضغط مرة أخرى للتأكيد"
                                  : "Click again to confirm deletion"}
                            </span>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            {notes.length > 0 && (
              <div className="shrink-0 px-3 py-2 border-t border-[var(--border-light)] bg-[var(--bg-secondary)]">
                <p className="text-[0.62rem] text-[var(--text-muted)] text-center font-[var(--font-ui)]">
                  {lang === "fr"
                    ? "Double-cliquez sur une note pour la modifier"
                    : lang === "ar"
                      ? "انقر مرتين على أي ملاحظة للتعديل"
                      : "Double-click any note to edit it"}
                </p>
              </div>
            )}
          </aside>
        </>
      )}

      <style>{`
        @keyframes slideInPanel {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 640px) {
          .notes-panel-aside {
            top: var(--header-h);
          }
          @keyframes slideInPanel {
            from { opacity: 0; transform: translateX(${lang === "ar" ? "-20px" : "20px"}); }
            to   { opacity: 1; transform: translateX(0); }
          }
        }
      `}</style>
    </>
  );
}
