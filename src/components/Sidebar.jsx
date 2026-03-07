import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA, JUZ_PAGE_RANGES } from "../data/juz";
import { cn } from "../lib/utils";
import { getReadStats } from "../services/readingProgressService";
import "../styles/sidebar.css";

/* ── Recent surahs helpers ── */
const RECENT_KEY = 'mushafplus_recent_surahs';
function saveRecent(n) {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const updated = [n, ...list.filter(x => x !== n)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    return updated;
  } catch { return []; }
}
function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}

export default function Sidebar() {
  const { state, dispatch, set } = useApp();
  const {
    sidebarOpen,
    lang,
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    riwaya,
  } = state;

  const availableTabs = riwaya === "warsh" ? ["surah", "juz"] : ["surah", "juz", "page"];
  const [tab, setTab] = useState("surah");

  useEffect(() => {
    if (riwaya === "warsh" && tab === "page") setTab("surah");
  }, [riwaya, tab]);

  const [filter, setFilter] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [selectedJuzForPages, setSelectedJuzForPages] = useState(1);
  const activeItemRef = useRef(null);
  const [recentSurahs, setRecentSurahs] = useState(loadRecent);
  const [readStats, setReadStats] = useState(() => getReadStats());
  const currentSurahMeta = SURAHS[currentSurah - 1];
  const activeSummary =
    displayMode === "surah"
      ? currentSurahMeta
        ? `${currentSurahMeta.en} · ${currentSurahMeta.ar}`
        : null
      : displayMode === "juz"
        ? `Juz ${currentJuz}`
        : `${lang === "fr" ? "Page" : lang === "ar" ? "الصفحة" : "Page"} ${currentPage}`;

  // Refresh stats when sidebar opens
  useEffect(() => {
    if (sidebarOpen) {
      setReadStats(getReadStats());
      setRecentSurahs(loadRecent());
    }
  }, [sidebarOpen]);

  // Scroll active item into view when sidebar opens
  useEffect(() => {
    if (sidebarOpen && activeItemRef.current) {
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 350);
    }
  }, [sidebarOpen]);

  const filteredSurahs = useMemo(() => {
    if (!filter) return SURAHS;
    const q = filter.toLowerCase();
    return SURAHS.filter(s =>
      s.ar.includes(filter) ||
      s.en.toLowerCase().includes(q) ||
      s.fr.toLowerCase().includes(q) ||
      String(s.n) === q
    );
  }, [filter]);

  const goSurah = (n) => {
    setRecentSurahs(saveRecent(n));
    set({ displayMode: "surah", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
  };

  const goPage = (p) => {
    set({ displayMode: "page", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_PAGE", payload: { page: p } });
  };

  const goJuz = (juz) => {
    set({ showHome: false, showDuas: false, displayMode: "juz" });
    dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
  };

  const isRtl = lang === "ar";

  return (
    <>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => set({ sidebarOpen: false })} />
      )}

      <aside className={cn("sidebar", sidebarOpen && "open")} role="navigation">
        {/* ── Tabs ── */}
        <div className="sidebar-tabs-container">
          <div className="sidebar-shell-header">
            <div>
              <div className="sidebar-shell-kicker">
                {lang === "fr"
                  ? "Navigation"
                  : lang === "ar"
                    ? "التنقل"
                    : "Navigation"}
              </div>
              <div className="sidebar-shell-title">
                {lang === "fr"
                  ? "Accès rapide au Coran"
                  : lang === "ar"
                    ? "وصول سريع إلى القرآن"
                    : "Quick Quran access"}
              </div>
            </div>
            <div className="sidebar-shell-chip">
              {riwaya === "warsh" ? "Warsh" : "Hafs"}
            </div>
          </div>
          {activeSummary && (
            <div className="sidebar-active-summary">
              <span className="sidebar-active-summary__label">
                {lang === "fr"
                  ? "Lecture en cours"
                  : lang === "ar"
                    ? "القراءة الحالية"
                    : "Current reading"}
              </span>
              <span className="sidebar-active-summary__value">{activeSummary}</span>
            </div>
          )}
          <div className="sidebar-tabs-list">
            {availableTabs.map((t2) => (
              <button
                key={t2}
                className={cn("sidebar-tab-trigger", tab === t2 && "active")}
                onClick={() => setTab(t2)}
              >
                {t2 === "surah" && <><i className="fas fa-align-justify" />{t("sidebar.surahs", lang)}</>}
                {t2 === "juz" && <><i className="fas fa-book-open" />{t("sidebar.juz", lang)}</>}
                {t2 === "page" && <><i className="fas fa-file-lines" />{t("quran.page", lang)}</>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Search (Surah Tab) ── */}
        {tab === "surah" && (
          <div className="sidebar-search-container">
            <div className="sidebar-search-box">
              <i className="fas fa-search sidebar-search-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder={t("search.placeholder", lang)}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="sidebar-search-input"
              />
            </div>
          </div>
        )}

        {/* ── List Area ── */}
        <div className="sidebar-content">
          {/* Recent surahs — shown at top of surah tab when no filter active */}
          {tab === "surah" && !filter && recentSurahs.length > 0 && (
            <div className="sidebar-recent-section">
              <div className="sidebar-recent-title">
                <i className="fas fa-clock-rotate-left" />
                {lang === 'fr' ? 'Récemment lus' : lang === 'ar' ? 'تمت قراءتها مؤخراً' : 'Recently read'}
              </div>
              {recentSurahs.map(n => {
                const s = SURAHS[n - 1];
                if (!s) return null;
                const isActive = s.n === currentSurah && displayMode === "surah";
                return (
                  <div
                    key={`r-${s.n}`}
                    className={cn("sidebar-item-row sidebar-item-row--recent", isActive && "active")}
                    onClick={() => goSurah(s.n)}
                  >
                    <div className="qc-sidebar-num">{s.n}</div>
                    <div className="qc-sidebar-label">
                      <div className="qc-sidebar-main">
                        <span className="qc-sidebar-en">{s.en}</span>
                        <span className="qc-sidebar-ar">{s.ar}</span>
                      </div>
                    </div>
                    <i className="fas fa-clock-rotate-left" style={{ fontSize: '0.6rem', opacity: 0.4, flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          )}

          {tab === "surah" && filteredSurahs.length === 0 && (
            <div className="sidebar-empty-state">
              <i className="fas fa-search" aria-hidden="true" />
              <div className="sidebar-empty-state__title">
                {lang === "fr"
                  ? "Aucune sourate trouvée"
                  : lang === "ar"
                    ? "لم يتم العثور على سورة"
                    : "No surah found"}
              </div>
              <div className="sidebar-empty-state__text">
                {lang === "fr"
                  ? "Essayez un autre nom, un numéro ou une translittération."
                  : lang === "ar"
                    ? "جرّب اسماً آخر أو رقماً أو كتابة مختلفة."
                    : "Try another name, number, or transliteration."}
              </div>
            </div>
          )}

          {tab === "surah" && filteredSurahs.map((s) => {
            const isActive = s.n === currentSurah && displayMode === "surah";
            return (
              <div
                key={s.n}
                ref={isActive ? activeItemRef : null}
                className={cn("sidebar-item-row", isActive && "active")}
                onClick={() => goSurah(s.n)}
              >
                <div className="qc-sidebar-num">{s.n}</div>
                <div className="qc-sidebar-label">
                  <div className="qc-sidebar-main">
                    <span className="qc-sidebar-en">{s.en}</span>
                    <span className="qc-sidebar-ar">{s.ar}</span>
                  </div>
                  <div className="qc-sidebar-details">
                    {s.ayahs} {t("quran.ayah", lang)}
                  </div>
                </div>
              </div>
            );
          })}

          {tab === "juz" && JUZ_DATA.map((j) => {
            const isActive = j.juz === currentJuz && displayMode === "juz";
            return (
              <div
                key={j.juz}
                ref={isActive ? activeItemRef : null}
                className={cn("sidebar-item-row", isActive && "active")}
                onClick={() => goJuz(j.juz)}
              >
                <div className="qc-sidebar-num">{j.juz}</div>
                <div className="qc-sidebar-label">
                  <div className="qc-sidebar-main">
                    <span className="qc-sidebar-en">Juz {j.juz}</span>
                    <span className="qc-sidebar-ar">{j.name}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {tab === "page" && (
            <div className="page-nav-section">
              {/* Direct input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  min={1} max={604}
                  className="sidebar-search-input text-center h-10 px-2"
                  placeholder={isRtl ? "الصفحة" : "Page"}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && goPage(parseInt(pageInput))}
                />
                <button
                  className="sidebar-tab-trigger active w-12 h-10 shrink-0"
                  onClick={() => goPage(parseInt(pageInput))}
                >
                  <i className="fas fa-arrow-right" />
                </button>
              </div>

              {/* Juz selector */}
              <div className="grid grid-cols-6 gap-1 mb-4">
                {JUZ_PAGE_RANGES.map(range => (
                  <button
                    key={range.juz}
                    className={cn("page-v4-cell", selectedJuzForPages === range.juz && "active")}
                    style={{ aspectRatio: "auto", padding: "6px" }}
                    onClick={() => setSelectedJuzForPages(range.juz)}
                  >
                    {isRtl ? toAr(range.juz) : range.juz}
                  </button>
                ))}
              </div>

              {/* Pages grid */}
              <div className="page-grid-v4">
                {(() => {
                  const range = JUZ_PAGE_RANGES.find(r => r.juz === selectedJuzForPages) || JUZ_PAGE_RANGES[0];
                  const pages = [];
                  for (let p = range.startPage; p <= range.endPage; p++) pages.push(p);
                  return pages.map(p => (
                    <button
                      key={p}
                      className={cn("page-v4-cell", p === currentPage && "active")}
                      onClick={() => goPage(p)}
                    >
                      {isRtl ? toAr(p) : p}
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>

        {/* ── Reading progress ── */}
        {readStats.totalRead > 0 && (
          <div className="sidebar-progress">
            <div className="sidebar-progress-header">
              <span className="sidebar-progress-label">
                {lang === 'fr' ? 'Progression' : lang === 'ar' ? 'التقدم' : 'Progress'}
              </span>
              <span className="sidebar-progress-pct">{readStats.percentage}%</span>
            </div>
            <div className="sidebar-progress-bar-bg">
              <div
                className="sidebar-progress-bar-fill"
                style={{ width: `${readStats.percentage}%` }}
              />
            </div>
            <div className="sidebar-progress-detail">
              {lang === 'fr'
                ? `${readStats.totalRead.toLocaleString()} / ${readStats.total.toLocaleString()} versets • ${readStats.completedSurahs} sourates complètes`
                : `${readStats.totalRead.toLocaleString()} / ${readStats.total.toLocaleString()} ayahs • ${readStats.completedSurahs} surahs done`
              }
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="shrink-0 px-4 py-3 border-t border-[rgba(var(--primary-rgb),0.1)] bg-[rgba(var(--primary-rgb),0.02)]">
          <div className="flex items-center justify-between text-[0.65rem] text-[var(--text-muted)] font-bold uppercase tracking-wider">
            <span>{tab === "surah" ? `${filteredSurahs.length} Surahs` : tab === "juz" ? "30 Juz" : "604 Pages"}</span>
            <span style={{ color: "var(--primary)", opacity: 0.8 }}>{riwaya === "warsh" ? "Riwaya Warsh" : "Riwaya Hafs"}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
