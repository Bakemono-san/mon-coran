import React, { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { toAr, getSurah, surahName } from "../data/surahs";
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
    loadedAyahCount,
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
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
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
    if (nextRiwaya === "warsh" && displayMode === "page") {
      patch.displayMode = "surah";
    }
    set(patch);
  };

  const handleGoTo = (e) => {
    e.preventDefault();
    const num = parseInt(goToValue);
    if (isNaN(num)) return;
    if (displayMode === "page") {
      if (num >= 1 && num <= 604) {
        set({ currentPage: num });
        setGoToOpen(false);
        setGoToValue("");
      }
    } else if (displayMode === "juz") {
      if (num >= 1 && num <= 30) {
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: num } });
        setGoToOpen(false);
        setGoToValue("");
      }
    } else {
      if (num >= 1 && num <= 114) {
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

  /* ── Display modes ── */
  const allDisplayModes =
    riwaya === "warsh"
      ? [
          {
            id: "surah",
            icon: "fa-align-justify",
            labelKey: "settings.surahMode",
          },
          { id: "juz", icon: "fa-book-open", labelKey: "settings.juzMode" },
        ]
      : [
          {
            id: "surah",
            icon: "fa-align-justify",
            labelKey: "settings.surahMode",
          },
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
    if (displayMode === "page") {
      if (currentPage > 1) set({ currentPage: currentPage - 1 });
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
    if (displayMode === "page") {
      if (currentPage < 604) set({ currentPage: currentPage + 1 });
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
        "border-b border-[var(--header-border)]",
      )}
      style={{
        background: "var(--header-glass)",
      }}
      role="banner"
    >
      {/* ═══════════════════════════════════════
          LEFT: Menu + Brand + Riwaya
         ═══════════════════════════════════════ */}
      <div className="flex items-center gap-2 sm:gap-3 ps-3 sm:ps-5 shrink-0">
        {/* Sidebar toggle */}
        <button
          className={cn(
            "flex items-center justify-center",
            "w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl",
            "text-white/70 hover:text-white hover:bg-white/10",
            "active:scale-95",
            "transition-all duration-150 cursor-pointer outline-none",
            "focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
          )}
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          title={t("nav.surahList", lang)}
          aria-label={t("nav.surahList", lang)}
          aria-expanded={state.sidebarOpen}
        >
          <i
            className="fas fa-bars text-[0.85rem] sm:text-[0.95rem]"
            aria-hidden="true"
          />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background:
                "linear-gradient(135deg, rgba(212,168,32,0.2) 0%, rgba(184,134,11,0.1) 100%)",
            }}
          >
            <i
              className="fas fa-book-quran text-[0.9rem]"
              style={{ color: "var(--gold)" }}
              aria-hidden="true"
            />
          </div>
          <span className="hidden sm:inline text-white font-semibold text-[0.9rem] tracking-wide font-[var(--font-ui)] leading-none">
            MushafPlus
          </span>
        </div>

        {/* Riwayat selector — desktop */}
        <div className="hidden lg:flex items-center ms-1">
          <div className="flex items-center rounded-lg bg-white/[0.07] p-1">
            {["hafs", "warsh"].map((r) => (
              <button
                key={r}
                className={cn(
                  "relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-md",
                  "text-[0.75rem] font-semibold font-[var(--font-ui)]",
                  "cursor-pointer outline-none transition-all duration-150",
                  riwaya === r
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/50 hover:text-white/75 hover:bg-white/[0.05]",
                )}
                onClick={() => applyRiwaya(r)}
                title={
                  r === "hafs"
                    ? t("settings.hafs", lang)
                    : t("settings.warsh", lang)
                }
                aria-pressed={riwaya === r}
              >
                <span>
                  {r === "hafs"
                    ? t("settings.hafs", lang)
                    : t("settings.warsh", lang)}
                </span>
                {riwaya === r && (
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{ background: "var(--gold)" }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          CENTER: Tabs + Nav arrows + Surah name
         ═══════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-3 min-w-0">
        {/* ── Display mode tabs ── */}
        <div className="hidden sm:flex items-center rounded-lg bg-white/[0.07] p-1 shrink-0">
          {allDisplayModes.map((mode) => {
            const isActive = displayMode === mode.id;
            const isDisabled = mode.id === "page" && riwaya === "warsh";
            return (
              <button
                key={mode.id}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
                  "text-[0.72rem] font-semibold font-[var(--font-ui)]",
                  "cursor-pointer outline-none whitespace-nowrap",
                  "transition-all duration-150",
                  isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/50 hover:text-white/75 hover:bg-white/[0.05]",
                  isDisabled && "opacity-30 pointer-events-none",
                )}
                onClick={() => set({ displayMode: mode.id })}
                disabled={isDisabled}
                title={t(mode.labelKey, lang)}
                aria-pressed={isActive}
              >
                <i
                  className={cn(
                    `fas ${mode.icon} text-[0.6rem]`,
                    isActive ? "opacity-100" : "opacity-50",
                  )}
                  aria-hidden="true"
                />
                <span className="hidden md:inline">
                  {t(mode.labelKey, lang)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-white/10 shrink-0" />

        {/* Prev arrow */}
        <button
          onClick={isRtl ? handleNext : handlePrev}
          disabled={isRtl ? !canGoNext : !canGoPrev}
          className={cn(
            "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg shrink-0",
            "bg-white/[0.07] text-white/60",
            "transition-all duration-150 cursor-pointer outline-none",
            "hover:bg-white/[0.13] hover:text-white",
            "active:scale-95",
            "disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-white/[0.07] disabled:active:scale-100",
            "focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40",
          )}
          aria-label={
            isRtl ? t("quran.nextSurah", lang) : t("quran.prevSurah", lang)
          }
        >
          <i className="fas fa-chevron-left text-[0.6rem]" aria-hidden="true" />
        </button>

        {/* Surah name (center) — clicking opens go-to popover */}
        <Popover open={goToOpen} onOpenChange={setGoToOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center min-w-0 px-3 sm:px-4 py-1.5 rounded-xl",
                "bg-white/[0.06] hover:bg-white/[0.11]",
                "cursor-pointer outline-none transition-all duration-150",
                "focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40",
                goToOpen && "bg-white/[0.13]",
              )}
              title={
                lang === "fr"
                  ? "Aller à…"
                  : lang === "ar"
                    ? "اذهب إلى…"
                    : "Go to…"
              }
            >
              <span
                className="text-[0.88rem] sm:text-[0.95rem] font-bold text-white leading-tight truncate max-w-[140px] sm:max-w-[220px]"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {lang === "ar" ? arabicName : translatedName}
              </span>
              <span
                className="text-[0.6rem] sm:text-[0.65rem] text-white/45 font-medium leading-tight mt-0.5 flex items-center gap-1.5"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {displayMode === "surah" ? (
                  <>
                    <span>
                      {lang === "ar" ? toAr(currentSurah) : currentSurah}
                    </span>
                    <span className="opacity-50">·</span>
                    {arabicName !== translatedName && (
                      <>
                        <span>{arabicName}</span>
                        <span className="opacity-50">·</span>
                      </>
                    )}
                    <span>{ayahCount}</span>
                  </>
                ) : displayMode === "page" ? (
                  <>
                    <span>
                      {lang === "ar" ? toAr(currentPage) : currentPage}
                    </span>
                    <span className="opacity-50">/</span>
                    <span>{lang === "ar" ? toAr(604) : 604}</span>
                    {ayahCount && (
                      <>
                        <span className="opacity-50">·</span>
                        <span>{ayahCount}</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span>{lang === "ar" ? toAr(currentJuz) : currentJuz}</span>
                    <span className="opacity-50">/</span>
                    <span>{lang === "ar" ? toAr(30) : 30}</span>
                    {ayahCount && (
                      <>
                        <span className="opacity-50">·</span>
                        <span>{ayahCount}</span>
                      </>
                    )}
                  </>
                )}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[260px] p-0 border-[var(--border-strong)] shadow-xl"
            align="center"
            sideOffset={10}
          >
            <form onSubmit={handleGoTo} className="flex flex-col gap-3 p-4">
              <label className="text-[0.68rem] font-bold uppercase tracking-[0.08em] font-[var(--font-ui)] text-[var(--text-muted)]">
                {goToLabel}
              </label>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={goToMax}
                  value={goToValue}
                  onChange={(e) => setGoToValue(e.target.value)}
                  placeholder="#"
                  className="flex-1 min-w-0 text-center h-10"
                />
                <Button type="submit" size="default" className="px-5 h-10">
                  <i className="fas fa-arrow-right" />
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>

        {/* Next arrow */}
        <button
          onClick={isRtl ? handlePrev : handleNext}
          disabled={isRtl ? !canGoPrev : !canGoNext}
          className={cn(
            "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg shrink-0",
            "bg-white/[0.07] text-white/60",
            "transition-all duration-150 cursor-pointer outline-none",
            "hover:bg-white/[0.13] hover:text-white",
            "active:scale-95",
            "disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-white/[0.07] disabled:active:scale-100",
            "focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40",
          )}
          aria-label={
            isRtl ? t("quran.prevSurah", lang) : t("quran.nextSurah", lang)
          }
        >
          <i
            className="fas fa-chevron-right text-[0.6rem]"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT: Actions
         ═══════════════════════════════════════ */}
      <div className="flex items-center gap-0.5 sm:gap-1 pe-3 sm:pe-5 shrink-0">
        {/* Always visible: Search, Bookmarks, Settings */}
        <HeaderIconButton
          icon="fa-search"
          onClick={() => dispatch({ type: "TOGGLE_SEARCH" })}
          title={`${t("nav.search", lang)} (Ctrl+K)`}
          aria-label={t("nav.search", lang)}
        />
        <HeaderIconButton
          icon="fa-bookmark"
          onClick={() => dispatch({ type: "TOGGLE_BOOKMARKS" })}
          title={t("nav.bookmarks", lang)}
          aria-label={t("nav.bookmarks", lang)}
        />
        <HeaderIconButton
          icon="fa-sliders"
          onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
          title={t("nav.settings", lang)}
          aria-label={t("nav.settings", lang)}
        />

        {/* ── Mobile "More" dropdown ── */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center justify-center",
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl",
                  "text-white/70 hover:text-white hover:bg-white/10",
                  "active:scale-95",
                  "transition-all duration-150 cursor-pointer outline-none",
                  "focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40",
                )}
                title={
                  lang === "fr"
                    ? "Plus d'actions"
                    : lang === "ar"
                      ? "المزيد"
                      : "More"
                }
              >
                <i className="fas fa-ellipsis-vertical text-[0.8rem] sm:text-[0.9rem]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={lang === "ar" ? "start" : "end"}
              className="min-w-[260px]"
              sideOffset={8}
            >
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
                    disabled={mode.id === "page" && riwaya === "warsh"}
                  >
                    {t(mode.labelKey, lang)}
                  </button>
                ))}
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

        {/* ── Desktop-only action buttons ── */}
        <div className="hidden lg:flex items-center gap-1 ms-1">
          <HeaderIconButton
            icon="fa-bullseye"
            onClick={() => dispatch({ type: "TOGGLE_WIRD" })}
            title={t("wird.title", lang)}
          />
          <HeaderIconButton
            icon="fa-clock-rotate-left"
            onClick={() => dispatch({ type: "TOGGLE_HISTORY" })}
            title={t("readingHistory.title", lang)}
          />
          <HeaderIconButton
            icon="fa-list"
            onClick={() => dispatch({ type: "TOGGLE_PLAYLIST" })}
            title={t("playlist.title", lang)}
          />

          {/* Divider */}
          <div className="w-px h-5 bg-white/10 mx-1.5" />

          <HeaderIconButton
            icon={
              theme === "dark" || theme === "night-blue" ? "fa-sun" : "fa-moon"
            }
            onClick={cycleTheme}
            title={`${t("settings.darkMode", lang)}: ${themeLabel}`}
          />
          <HeaderIconButton
            icon={isFullscreen ? "fa-compress" : "fa-expand"}
            onClick={toggleFullscreen}
            title={
              isFullscreen
                ? lang === "fr"
                  ? "Quitter plein écran"
                  : lang === "ar"
                    ? "إنهاء ملء الشاشة"
                    : "Exit fullscreen"
                : lang === "fr"
                  ? "Plein écran"
                  : lang === "ar"
                    ? "ملء الشاشة"
                    : "Fullscreen"
            }
          />
        </div>
      </div>
    </header>
  );
}

/* ── Reusable icon button for the header ── */
function HeaderIconButton({ icon, className, ...props }) {
  return (
    <button
      className={cn(
        "flex items-center justify-center",
        "w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl",
        "text-white/70 hover:text-white hover:bg-white/10",
        "active:scale-95",
        "transition-all duration-150 cursor-pointer outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
        className,
      )}
      {...props}
    >
      <i
        className={`fas ${icon} text-[0.8rem] sm:text-[0.9rem]`}
        aria-hidden="true"
      />
    </button>
  );
}
