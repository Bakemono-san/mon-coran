import React, { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { toAr, getSurah, surahName } from "../data/surahs";
import { JUZ_DATA } from "../data/juz";
import { getDefaultReciterId } from "../data/reciters";
import audioService from "../services/audioService";
import { clearCache } from "../services/quranAPI";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";

export default function Header() {
  const { state, dispatch, set } = useApp();
  const {
    lang,
    theme,
    currentSurah,
    displayMode,
    currentPage,
    currentJuz,
    riwaya,
    translationLang,
    wordTranslationLang,
    loadedAyahCount,
    showHome,
    showDuas,
    showTranslation,
    showWordByWord,
    showWordTranslation,
  } = state;

  const [goToValue, setGoToValue] = useState("");
  const [goToOpen, setGoToOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const inputRef = useRef(null);

  // Track fullscreen state
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Auto-focus go-to input
  useEffect(() => {
    if (goToOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [goToOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  const themeLabel =
    theme === "dark"
      ? t("settings.dark", lang)
      : theme === "sepia"
        ? t("settings.sepia", lang)
        : theme === "ocean"
          ? t("settings.ocean", lang)
          : theme === "forest"
            ? t("settings.forest", lang)
            : theme === "night-blue"
              ? t("settings.nightBlue", lang)
              : t("settings.light", lang);

  const cycleTheme = () => {
    const themes = ["light", "dark", "sepia", "ocean", "forest", "night-blue"];
    const idx = themes.indexOf(theme);
    dispatch({
      type: "SET_THEME",
      payload: themes[(idx + 1) % themes.length],
    });
  };

  const applyRiwaya = (nextRiwaya) => {
    if (nextRiwaya === riwaya) return;
    audioService.stop();
    clearCache();
    const fallbackReciter = getDefaultReciterId(nextRiwaya);
    const patch = {
      riwaya: nextRiwaya,
      reciter: fallbackReciter,
      isPlaying: false,
      currentPlayingAyah: null,
      currentAyah: 1,
    };
    set(patch);
  };

  const handleGoTo = (e) => {
    e.preventDefault();
    const num = parseInt(goToValue);
    if (isNaN(num)) return;
    if (displayMode === "page") {
      if (num >= 1 && num <= 604) {
        set({ currentPage: num, showHome: false, showDuas: false });
        setGoToOpen(false);
        setGoToValue("");
      }
    } else if (displayMode === "juz") {
      if (num >= 1 && num <= 30) {
        set({ showHome: false, showDuas: false });
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: num } });
        setGoToOpen(false);
        setGoToValue("");
      }
    } else {
      if (num >= 1 && num <= 114) {
        set({ showHome: false, showDuas: false });
        dispatch({ type: "NAVIGATE_SURAH", payload: { surah: num } });
        setGoToOpen(false);
        setGoToValue("");
      }
    }
  };

  const goToLabel =
    displayMode === "page"
      ? lang === "fr"
        ? "Page (1-604)"
        : lang === "en"
          ? "Page (1-604)"
          : "صفحة (١-٦٠٤)"
      : displayMode === "juz"
        ? lang === "fr"
          ? "Juz (1-30)"
          : lang === "en"
            ? "Juz (1-30)"
            : "جزء (١-٣٠)"
        : lang === "fr"
          ? "Sourate (1-114)"
          : lang === "en"
            ? "Surah (1-114)"
            : "سورة (١-١١٤)";

  const goToMax =
    displayMode === "page" ? 604 : displayMode === "juz" ? 30 : 114;

  /* ── Display modes — all modes available for both Hafs and Warsh ── */
  const allDisplayModes = [
    { id: "surah", icon: "fa-align-justify", labelKey: "settings.surahMode" },
    { id: "page", icon: "fa-file-lines", labelKey: "settings.pageMode" },
    { id: "juz", icon: "fa-book-open", labelKey: "settings.juzMode" },
  ];

  const currentLocationLabel =
    displayMode === "page"
      ? `${t("quran.page", lang)} ${lang === "ar" ? toAr(currentPage) : currentPage}`
      : displayMode === "juz"
        ? `${t("sidebar.juz", lang)} ${lang === "ar" ? toAr(currentJuz) : currentJuz}`
        : `${t("quran.surah", lang)} ${lang === "ar" ? toAr(currentSurah) : currentSurah}`;

  const currentLocationTotal =
    displayMode === "page" ? "604" : displayMode === "juz" ? "30" : "114";

  const displayModeMeta =
    displayMode === "page"
      ? { icon: "fa-file-lines", label: t("settings.pageMode", lang) }
      : displayMode === "juz"
        ? { icon: "fa-book-open", label: t("settings.juzMode", lang) }
        : { icon: "fa-align-justify", label: t("settings.surahMode", lang) };

  const languageMeta = {
    fr: { label: lang === "ar" ? "الفرنسية" : lang === "fr" ? "Français" : "French", short: "FR" },
    en: { label: lang === "ar" ? "الإنجليزية" : lang === "fr" ? "Anglais" : "English", short: "EN" },
    es: { label: lang === "ar" ? "الإسبانية" : lang === "fr" ? "Espagnol" : "Spanish", short: "ES" },
    de: { label: lang === "ar" ? "الألمانية" : lang === "fr" ? "Allemand" : "German", short: "DE" },
    tr: { label: lang === "ar" ? "التركية" : lang === "fr" ? "Turc" : "Turkish", short: "TR" },
    ur: { label: lang === "ar" ? "الأردية" : lang === "fr" ? "Ourdou" : "Urdu", short: "UR" },
  };
  const verseTranslationMeta = languageMeta[translationLang] || languageMeta.fr;
  const wordTranslationMeta = languageMeta[wordTranslationLang] || languageMeta.fr;
  const hasHeaderTranslation = showTranslation || (showWordByWord && showWordTranslation);
  const headerTranslationTitle = showTranslation
    ? showWordByWord && showWordTranslation && wordTranslationLang !== translationLang
      ? (lang === "fr"
          ? `Versets ${verseTranslationMeta.label} · Mot-à-mot ${wordTranslationMeta.label}`
          : lang === "ar"
            ? `الآيات ${verseTranslationMeta.label} · كلمة بكلمة ${wordTranslationMeta.label}`
            : `Verses ${verseTranslationMeta.label} · Word by word ${wordTranslationMeta.label}`)
      : (lang === "fr"
          ? `Traduction ${verseTranslationMeta.label}`
          : lang === "ar"
            ? `الترجمة ${verseTranslationMeta.label}`
            : `Translation ${verseTranslationMeta.label}`)
    : (lang === "fr"
        ? `Mot-à-mot ${wordTranslationMeta.label}`
        : lang === "ar"
          ? `كلمة بكلمة ${wordTranslationMeta.label}`
          : `Word by word ${wordTranslationMeta.label}`);
  const headerTranslationCompact = showTranslation
    ? showWordByWord && showWordTranslation && wordTranslationLang !== translationLang
      ? `${verseTranslationMeta.short} · W ${wordTranslationMeta.short}`
      : verseTranslationMeta.short
    : `W ${wordTranslationMeta.short}`;

  /* ── Nav helpers ── */
  const isRtl = lang === "ar";
  const currentValue =
    displayMode === "page"
      ? currentPage
      : displayMode === "juz"
        ? currentJuz
        : currentSurah;
  const currentTotal =
    displayMode === "page" ? 604 : displayMode === "juz" ? 30 : 114;

  const canGoPrev =
    displayMode === "page"
      ? currentPage > 1
      : displayMode === "juz"
        ? currentJuz > 1
        : currentSurah > 1;
  const canGoNext =
    displayMode === "page"
      ? currentPage < 604
      : displayMode === "juz"
        ? currentJuz < 30
        : currentSurah < 114;

  const handlePrev = () => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "page") {
      if (currentPage > 1) set({ currentPage: currentPage - 1, showHome: false, showDuas: false });
    } else if (displayMode === "juz") {
      if (currentJuz > 1)
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz - 1 } });
    } else {
      if (currentSurah > 1)
        dispatch({
          type: "NAVIGATE_SURAH",
          payload: { surah: currentSurah - 1 },
        });
    }
  };
  const handleNext = () => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "page") {
      if (currentPage < 604) set({ currentPage: currentPage + 1, showHome: false, showDuas: false });
    } else if (displayMode === "juz") {
      if (currentJuz < 30)
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz + 1 } });
    } else {
      if (currentSurah < 114)
        dispatch({
          type: "NAVIGATE_SURAH",
          payload: { surah: currentSurah + 1 },
        });
    }
  };

  /* ── Surah info for center display ── */
  const surahMeta = getSurah(currentSurah);
  const arabicName = surahMeta?.ar || "";
  const translatedName = surahName(currentSurah, lang);

  /* ── Juz info — overrides surah display when in juz mode ── */
  const juzMeta = JUZ_DATA?.[currentJuz - 1];
  // Title shown in center pill
  const centerTitle =
    displayMode === "juz"
      ? lang === "ar"
        ? `جزء ${toAr(currentJuz)}`
        : `Juz ${currentJuz}`
      : lang === "ar"
        ? arabicName
        : translatedName;
  // Arabic sub‑name below the title
  const centerArabicSub =
    displayMode === "juz" ? (juzMeta?.name || "") : arabicName;

  const ayahWord = lang === "fr" ? "versets" : lang === "ar" ? "آية" : "ayahs";
  /* Loaded ayah count — same reference across all three modes */
  const ayahCount = loadedAyahCount
    ? `${lang === "ar" ? toAr(loadedAyahCount) : loadedAyahCount} ${ayahWord}`
    : surahMeta
      ? `${surahMeta.ayahs} ${ayahWord}`
      : "";

  return (
    <header
      className={cn(
        "flex items-center shrink-0 z-[100] relative select-none",
        "h-[var(--header-h)]",
        "bg-[var(--bg-primary)] border-b border-[var(--border)]",
      )}
      role="banner"
    >
      {/* ═══════════════════════════════════════
          LEFT: Menu + Brand + Riwaya
         ═══════════════════════════════════════ */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 ps-2 sm:ps-4 shrink-0">
        {/* Sidebar toggle */}
        <button
          className={cn(
            "flex items-center justify-center",
            "w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl",
            "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]",
            "active:scale-95 active:bg-[var(--bg-tertiary)]",
            "transition-all duration-150 cursor-pointer outline-none",
            "focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
            state.sidebarOpen && "bg-[var(--bg-tertiary)] text-[var(--primary)]",
          )}
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          title={t("nav.surahList", lang)}
          aria-label={t("nav.surahList", lang)}
          aria-expanded={state.sidebarOpen}
        >
          <i
            className={cn(
              "text-[0.9rem] transition-transform duration-200",
              state.sidebarOpen ? "fas fa-times" : "fas fa-bars",
            )}
            aria-hidden="true"
          />
        </button>

        {/* Brand/Logo */}
        <button
          className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          onClick={() => set({ showHome: true, showDuas: false })}
        >
          <i className="fas fa-book-quran text-[var(--primary)] text-[0.95rem] sm:text-lg" />
          <span className="font-bold text-[var(--text)] tracking-tight hidden md:block">
            MushafPlus
          </span>
        </button>

        {/* Separator */}
        <div className="hidden lg:block w-px h-5 bg-white/10 mx-0.5" />

        <button
          className={cn(
            "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
            "text-[0.75rem] font-semibold",
            "transition-all duration-200 cursor-pointer outline-none",
            showDuas
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]",
          )}
          onClick={() => set({ showDuas: true, showHome: false })}
          title={lang === "ar" ? "صفحة الأدعية" : lang === "fr" ? "Page Douas" : "Duas page"}
          aria-label={lang === "ar" ? "صفحة الأدعية" : lang === "fr" ? "Ouvrir la page Douas" : "Open Duas page"}
          aria-pressed={showDuas}
        >
          <i className="fas fa-hands-praying" aria-hidden="true" />
          <span>{lang === "ar" ? "أدعية" : lang === "fr" ? "Douas" : "Duas"}</span>
        </button>

        {/* Riwayat selector — desktop */}
        <div className="hidden lg:flex items-center">
          <div className="flex items-center rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] p-1 gap-1">
            {["hafs", "warsh"].map((r) => (
              <button
                key={r}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[0.75rem] font-semibold transition-all duration-200 cursor-pointer",
                  riwaya === r
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)]",
                )}
                onClick={() => applyRiwaya(r)}
              >
                {r === "hafs" ? t("settings.hafs", lang) : t("settings.warsh", lang)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          CENTER: Tabs + Nav arrows + Surah name
         ═══════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-2 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "hidden sm:flex items-center gap-2 rounded-xl px-3 h-9 shrink-0",
                "bg-[var(--bg-secondary)] border border-[var(--border)]",
                "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)]",
                "transition-all duration-150 cursor-pointer outline-none",
              )}
              title={lang === "fr" ? "Mode de navigation" : lang === "ar" ? "نمط التنقل" : "Navigation mode"}
            >
              <i className={`fas ${displayModeMeta.icon} text-[0.72rem] text-[var(--primary)]`} />
              <span className="text-[0.76rem] font-semibold font-[var(--font-ui)]">{displayModeMeta.label}</span>
              <i className="fas fa-chevron-down text-[0.6rem] opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" sideOffset={8} className="min-w-[210px]">
            <DropdownMenuLabel>
              <i className="fas fa-compass text-[0.65rem]" style={{ color: "var(--primary)", opacity: 0.75 }} />
              <span>{lang === "fr" ? "Mode de navigation" : lang === "ar" ? "نمط التنقل" : "Navigation mode"}</span>
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={displayMode} onValueChange={(value) => set({ displayMode: value })}>
              {allDisplayModes.map((mode) => (
                <DropdownMenuRadioItem key={mode.id} value={mode.id}>
                  <i className={`fas ${mode.icon}`} aria-hidden="true" />
                  <span>{t(mode.labelKey, lang)}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Prev arrow — hidden on mobile */}
        <button
          onClick={isRtl ? handleNext : handlePrev}
          disabled={isRtl ? !canGoNext : !canGoPrev}
          className={cn(
            "hidden sm:flex items-center justify-center w-8 h-8 rounded-xl shrink-0",
            "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)]",
            "transition-all duration-150 cursor-pointer outline-none",
            "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text)] hover:border-[var(--border-strong)]",
            "active:scale-90",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--bg-secondary)] disabled:active:scale-100",
            "focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
          )}
          aria-label={
            isRtl ? t("quran.nextSurah", lang) : t("quran.prevSurah", lang)
          }
        >
          <i
            className="fas fa-chevron-left text-[0.55rem]"
            aria-hidden="true"
          />
        </button>

        {/* Surah name (center) — clicking opens go-to popover */}
        <Popover open={goToOpen} onOpenChange={setGoToOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center min-w-0 px-2.5 sm:px-4 py-1.5 rounded-lg",
                "bg-[var(--bg-secondary)] border border-[var(--border)]",
                "hover:bg-[var(--bg-tertiary)]",
                "cursor-pointer outline-none transition-all duration-150",
                goToOpen && "border-[var(--primary)]",
              )}
              title={
                lang === "fr"
                  ? "Aller à…"
                  : lang === "ar"
                    ? "اذهب إلى…"
                    : "Go to…"
              }
            >
              {/* Surah / location name */}
              <span
                className="text-[0.78rem] sm:text-[0.92rem] font-bold text-[var(--text)] leading-tight truncate max-w-[96px] sm:max-w-[200px]"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {centerTitle}
              </span>

              {hasHeaderTranslation && (
                <span
                  className="inline-flex items-center gap-1 mt-[4px] px-1.5 sm:px-2 py-[2px] rounded-full border text-[0.55rem] sm:text-[0.6rem] font-semibold text-[var(--text-secondary)] bg-[var(--bg-primary)]/85 border-[var(--border)] max-w-full"
                  title={headerTranslationTitle}
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  <i className="fas fa-language text-[0.52rem] text-[var(--primary)]" aria-hidden="true" />
                  <span className="truncate">{headerTranslationCompact}</span>
                </span>
              )}

              {/* Subtitle — simplified on mobile */}
              <span
                className="text-[0.55rem] sm:text-[0.62rem] text-[var(--text-muted)] font-medium leading-tight mt-[3px] flex items-center gap-1"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {displayMode === "surah" ? (
                  <>
                    <span className="opacity-70">
                      {lang === "ar" ? toAr(currentSurah) : `#${currentSurah}`}
                    </span>
                    {/* Arabic name only on sm+ to avoid overflow on mobile */}
                    {centerArabicSub !== centerTitle && (
                      <>
                        <span className="hidden sm:inline opacity-30">·</span>
                        <span className="hidden sm:inline text-[var(--text-muted)]">{centerArabicSub}</span>
                      </>
                    )}
                    <span className="opacity-30">·</span>
                    <span>{ayahCount}</span>
                  </>
                ) : displayMode === "page" ? (
                  <>
                    <span className="opacity-70">
                      {lang === "fr" ? "Page" : lang === "ar" ? "صفحة" : "Pg"}
                    </span>
                    <span className="font-semibold text-[var(--text-secondary)]">
                      {lang === "ar" ? toAr(currentPage) : currentPage}
                    </span>
                    <span className="opacity-30">/</span>
                    <span>{lang === "ar" ? toAr(604) : 604}</span>
                    {ayahCount && (
                      <>
                        <span className="hidden sm:inline opacity-30">·</span>
                        <span className="hidden sm:inline">{ayahCount}</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {centerArabicSub && (
                      <>
                        <span className="font-semibold text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-quran)", fontSize: "0.72rem" }}>{centerArabicSub}</span>
                        <span className="opacity-30">·</span>
                      </>
                    )}
                    <span className="opacity-70">
                      {lang === "ar" ? toAr(currentJuz) : currentJuz}
                    </span>
                    <span className="opacity-30">/</span>
                    <span>{lang === "ar" ? toAr(30) : 30}</span>
                    {ayahCount && (
                      <>
                        <span className="hidden sm:inline opacity-30">·</span>
                        <span className="hidden sm:inline">{ayahCount}</span>
                      </>
                    )}
                  </>
                )}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[240px] p-0 border-[var(--border-strong)] shadow-2xl rounded-2xl overflow-hidden"
            align="center"
            sideOffset={8}
          >
            <form onSubmit={handleGoTo} className="flex flex-col gap-3 p-3.5">
              <label className="text-[0.65rem] font-bold uppercase tracking-[0.1em] font-[var(--font-ui)] text-[var(--text-muted)]">
                {goToLabel}
              </label>
              <div className="flex gap-1.5">
                <Input
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={goToMax}
                  value={goToValue}
                  onChange={(e) => setGoToValue(e.target.value)}
                  placeholder="#"
                  className="flex-1 min-w-0 text-center h-9 text-sm"
                />
                <Button
                  type="submit"
                  size="default"
                  className="px-4 h-9 shrink-0"
                >
                  <i className="fas fa-arrow-right text-[0.75rem]" />
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>

        {/* Next arrow — hidden on mobile */}
        <button
          onClick={isRtl ? handlePrev : handleNext}
          disabled={isRtl ? !canGoPrev : !canGoNext}
          className={cn(
            "hidden sm:flex items-center justify-center w-8 h-8 rounded-xl shrink-0",
            "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)]",
            "transition-all duration-150 cursor-pointer outline-none",
            "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text)] hover:border-[var(--border-strong)]",
            "active:scale-90",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--bg-secondary)] disabled:active:scale-100",
            "focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
          )}
          aria-label={
            isRtl ? t("quran.prevSurah", lang) : t("quran.nextSurah", lang)
          }
        >
          <i
            className="fas fa-chevron-right text-[0.55rem]"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT: Actions
         ═══════════════════════════════════════ */}
      <div className="flex items-center gap-0 pe-1.5 sm:pe-4 shrink-0">
        {/* Word-by-word toggle — quick access */}
        <HeaderIconButton
          icon="fa-w"
          onClick={() => set({ showWordByWord: !showWordByWord })}
          title={lang === "fr" ? "Mot-à-mot" : lang === "ar" ? "كلمة بكلمة" : "Word by word"}
          aria-label={lang === "fr" ? "Mot-à-mot" : "Word by word"}
          active={showWordByWord}
          className="hidden sm:flex"
        />
        {/* Search — always visible */}
        <HeaderIconButton
          icon="fa-search"
          onClick={() => dispatch({ type: "TOGGLE_SEARCH" })}
          title={`${t("nav.search", lang)} (Ctrl+K)`}
          aria-label={t("nav.search", lang)}
        />
        {/* Settings */}
        <HeaderIconButton
          icon="fa-sliders"
          onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
          title={t("nav.settings", lang)}
          aria-label={t("nav.settings", lang)}
        />

        {/* ── Menu "Plus" — visible sur tous les écrans ── */}
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center justify-center",
                  "w-8 h-8 sm:w-9 sm:h-9 rounded-md sm:rounded-lg",
                  "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]",
                  "active:scale-95",
                  "transition-all duration-150 cursor-pointer outline-none",
                )}
                title={
                  lang === "fr"
                    ? "Plus d'actions"
                    : lang === "ar"
                      ? "المزيد"
                      : "More"
                }
              >
                <i className="fas fa-ellipsis-vertical text-[0.82rem]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={lang === "ar" ? "start" : "end"}
              className="min-w-[270px]"
              sideOffset={8}
            >
              {/* Settings & Bookmarks shortcuts on mobile */}
              <DropdownMenuItem
                onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
              >
                <i className="fas fa-sliders" aria-hidden="true" />
                <span>{t("nav.settings", lang)}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => dispatch({ type: "TOGGLE_BOOKMARKS" })}
              >
                <i className="fas fa-bookmark" aria-hidden="true" />
                <span>{t("nav.bookmarks", lang)}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => set({ showDuas: true, showHome: false })}
              >
                <i className="fas fa-hands-praying" aria-hidden="true" />
                <span>{lang === "ar" ? "أدعية" : lang === "fr" ? "Douas" : "Duas"}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Display mode (mobile) */}
              <DropdownMenuLabel>
                <i
                  className="fas fa-eye text-[0.65rem]"
                  style={{ color: "var(--primary)", opacity: 0.7 }}
                />
                <span>
                  {lang === "fr"
                    ? "Mode d'affichage"
                    : lang === "ar"
                      ? "طريقة العرض"
                      : "Display mode"}
                </span>
              </DropdownMenuLabel>
              <div className="flex gap-1.5 px-3 pb-2.5">
                {allDisplayModes.map((mode) => (
                  <button
                    key={mode.id}
                    className={cn(
                      "flex-1 py-2 px-2 rounded-lg text-[0.75rem] font-semibold",
                      "font-[var(--font-ui)] cursor-pointer border transition-all duration-150 text-center",
                      displayMode === mode.id
                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)]",
                    )}
                    onClick={() => set({ displayMode: mode.id })}
                    disabled={false}
                  >
                    {t(mode.labelKey, lang)}
                  </button>
                ))}
              </div>
              {/* Word-by-word toggle (mobile) */}
              <div className="flex gap-1.5 px-3 pb-2.5">
                <button
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[0.75rem] font-semibold",
                    "font-[var(--font-ui)] cursor-pointer border transition-all duration-150",
                    showWordByWord
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)]",
                  )}
                  onClick={() => set({ showWordByWord: !showWordByWord })}
                >
                  <i className="fas fa-w text-[0.7rem]" />
                  <span>{lang === "ar" ? "كلمة بكلمة" : lang === "fr" ? "Mot-à-mot" : "Word by word"}</span>
                </button>
              </div>

              {/* Riwaya (mobile) */}
              <DropdownMenuLabel>
                <i
                  className="fas fa-book-quran text-[0.65rem]"
                  style={{ color: "var(--primary)", opacity: 0.7 }}
                />
                <span>{t("settings.riwaya", lang)}</span>
              </DropdownMenuLabel>
              <div className="flex gap-1.5 px-3 pb-2.5">
                {["hafs", "warsh"].map((r) => (
                  <button
                    key={r}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-[0.75rem] font-semibold",
                      "font-[var(--font-ui)] cursor-pointer border transition-all duration-150",
                      riwaya === r
                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)]",
                    )}
                    onClick={() => applyRiwaya(r)}
                  >
                    <span>
                      {r === "hafs"
                        ? t("settings.hafs", lang)
                        : t("settings.warsh", lang)}
                    </span>
                    <span className="text-[0.6rem] opacity-55">
                      {r === "hafs" ? "عاصم" : "ورش"}
                    </span>
                  </button>
                ))}
              </div>

              <DropdownMenuSeparator />

              {/* Navigation — prev/next on mobile */}
              <div className="flex items-center gap-1.5 px-3 pb-2.5 pt-1">
                <button
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[0.75rem] font-semibold",
                    "font-[var(--font-ui)] cursor-pointer border transition-all duration-150",
                    !(isRtl ? canGoNext : canGoPrev)
                      ? "opacity-30 pointer-events-none bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]"
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)]",
                  )}
                  onClick={() => {
                    isRtl ? handleNext() : handlePrev();
                  }}
                  disabled={isRtl ? !canGoNext : !canGoPrev}
                >
                  <i
                    className={`fas fa-arrow-${lang === "ar" ? "right" : "left"} text-[0.65rem]`}
                  />
                  {lang === "fr"
                    ? "Précédent"
                    : lang === "ar"
                      ? "السابق"
                      : "Previous"}
                </button>
                <button
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[0.75rem] font-semibold",
                    "font-[var(--font-ui)] cursor-pointer border transition-all duration-150",
                    !(isRtl ? canGoPrev : canGoNext)
                      ? "opacity-30 pointer-events-none bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]"
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)]",
                  )}
                  onClick={() => {
                    isRtl ? handlePrev() : handleNext();
                  }}
                  disabled={isRtl ? !canGoPrev : !canGoNext}
                >
                  {lang === "fr"
                    ? "Suivant"
                    : lang === "ar"
                      ? "التالي"
                      : "Next"}
                  <i
                    className={`fas fa-arrow-${lang === "ar" ? "left" : "right"} text-[0.65rem]`}
                  />
                </button>
              </div>

              <DropdownMenuSeparator />

              {/* Action items */}
              <DropdownMenuItem
                onClick={() => dispatch({ type: "TOGGLE_WIRD" })}
              >
                <i className="fas fa-bullseye" aria-hidden="true" />
                <span>{t("wird.title", lang)}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => dispatch({ type: "TOGGLE_HISTORY" })}
              >
                <i className="fas fa-clock-rotate-left" aria-hidden="true" />
                <span>{t("readingHistory.title", lang)}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => dispatch({ type: "TOGGLE_PLAYLIST" })}
              >
                <i className="fas fa-list" aria-hidden="true" />
                <span>{t("playlist.title", lang)}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={cycleTheme}>
                <i
                  className={`fas ${theme === "dark" || theme === "night-blue" ? "fa-sun" : "fa-moon"}`}
                  aria-hidden="true"
                />
                <span>
                  {lang === "ar" ? "المظهر" : lang === "fr" ? "Thème" : "Theme"}
                  : <span className="opacity-55">{themeLabel}</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleFullscreen}>
                <i
                  className={`fas ${isFullscreen ? "fa-compress" : "fa-expand"}`}
                  aria-hidden="true"
                />
                <span>
                  {isFullscreen
                    ? lang === "fr"
                      ? "Quitter plein écran"
                      : lang === "ar"
                        ? "إنهاء ملء الشاشة"
                        : "Exit fullscreen"
                    : lang === "fr"
                      ? "Plein écran"
                      : lang === "ar"
                        ? "ملء الشاشة"
                        : "Fullscreen"}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  );
}

/* ── Reusable icon button for the header ── */
function HeaderIconButton({ icon, className, active = false, ...props }) {
  return (
    <button
      className={cn(
        "flex items-center justify-center",
        "w-8 h-8 sm:w-9 sm:h-9 rounded-md sm:rounded-lg",
        "transition-all duration-150 cursor-pointer outline-none",
        "active:scale-90",
        active
          ? "text-white bg-[var(--primary)] shadow-sm"
          : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]",
        className,
      )}
      {...props}
    >
      <i className={`fas ${icon} text-[0.78rem] sm:text-[0.85rem]`} aria-hidden="true" />
    </button>
  );
}
