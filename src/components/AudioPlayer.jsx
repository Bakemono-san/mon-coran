import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useReducer,
} from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import audioService from "../services/audioService";
import { ensureReciterForRiwaya, getRecitersByRiwaya } from "../data/reciters";
import { getSurah, surahName } from "../data/surahs";
import { cn } from "../lib/utils";

/* ── Drag position helpers ── */
const CARD_STORAGE_KEY = "mushaf_playsurah_card_pos";

function loadCardPos() {
  try {
    const raw = localStorage.getItem(CARD_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveCardPos(pos) {
  try {
    localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(pos));
  } catch {}
}

/**
 * Clamp a card (w×h) inside the viewport with a given margin.
 */
function clamp(x, y, w, h, margin = 12) {
  return {
    x: Math.max(margin, Math.min(window.innerWidth - w - margin, x)),
    y: Math.max(margin, Math.min(window.innerHeight - h - margin, y)),
  };
}

export default function AudioPlayer() {
  const { state, set } = useApp();
  const {
    lang,
    reciter,
    isPlaying,
    currentPlayingAyah,
    riwaya,
    audioSpeed,
    memMode,
    memRepeatCount,
    memPause,
    warshStrictMode,
    volume: savedVolume,
  } = state;

  const [progress, setProgress] = useState(0);
  const [currentTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [volume, setVolume] = useState(savedVolume ?? 1);

  const progressRef = useRef(null);

  /* ── Wire callbacks ── */
  useEffect(() => {
    audioService.onPlay = (item) => {
      set({
        isPlaying: true,
        currentPlayingAyah: item
          ? {
              surah: item.surah,
              ayah: item.ayah,
              globalNumber: item.globalNumber,
            }
          : null,
      });
    };
    audioService.onPause = () => set({ isPlaying: false });
    audioService.onEnd = () =>
      set({ isPlaying: false, currentPlayingAyah: null });
    audioService.onAyahChange = (item) => {
      set({
        currentPlayingAyah: {
          surah: item.surah,
          ayah: item.ayah,
          globalNumber: item.globalNumber,
        },
      });
    };
    audioService.onTimeUpdate = (ct, dur) => {
      setCurTime(ct);
      setDuration(dur);
      setProgress(dur ? ct / dur : 0);
    };
    audioService.onError = () => set({ isPlaying: false });

    return () => {
      audioService.onPlay = null;
      audioService.onPause = null;
      audioService.onEnd = null;
      audioService.onAyahChange = null;
      audioService.onTimeUpdate = null;
      audioService.onError = null;
    };
  }, [set]);

  /* ── Speed ── */
  useEffect(() => {
    audioService.setSpeed(audioSpeed);
  }, [audioSpeed]);

  useEffect(() => {
    const safeReciter = ensureReciterForRiwaya(reciter, riwaya);
    if (safeReciter !== reciter) set({ reciter: safeReciter });
  }, [reciter, riwaya, set]);

  /* ── Memorization ── */
  useEffect(() => {
    if (memMode) {
      audioService.enableMemorization(memRepeatCount, memPause * 1000);
    } else {
      audioService.disableMemorization();
    }
  }, [memMode, memRepeatCount, memPause]);

  /* ── Controls ── */
  const toggle = useCallback(() => audioService.toggle(), []);
  const stop = useCallback(() => audioService.stop(), []);
  const next = useCallback(() => audioService.next(), []);
  const prev = useCallback(() => audioService.prev(), []);

  const handleSeek = (e) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioService.seekPercent(pct);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleVolumeChange = (v) => {
    setVolume(v);
    audioService.setVolume(v);
    set({ volume: v });
  };

  const currentReciters = getRecitersByRiwaya(riwaya);
  const isWarshMode = riwaya === "warsh";

  const warshStrictLabel =
    lang === "ar"
      ? "ورش الصارم"
      : lang === "fr"
        ? "Warsh strict"
        : "Warsh strict";
  const warshVerifiedLabel =
    lang === "ar"
      ? "صوت ورش مُتحقق"
      : lang === "fr"
        ? "Audio Warsh vérifié"
        : "Warsh audio verified";
  const warshNonStrictLabel =
    lang === "ar"
      ? "وضع ورش عادي"
      : lang === "fr"
        ? "Warsh standard"
        : "Warsh standard";

  const changeReciter = (id) => set({ reciter: id });

  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(audioSpeed);
    set({ audioSpeed: speeds[(idx + 1) % speeds.length] });
  };

  const expandLabel = expanded
    ? lang === "ar"
      ? "إغلاق التفاصيل"
      : lang === "fr"
        ? "Réduire le lecteur"
        : "Collapse player"
    : lang === "ar"
      ? "فتح التفاصيل"
      : lang === "fr"
        ? "Développer le lecteur"
        : "Expand player";

  /* ── Shared class strings ── */
  const playerBtnCls = cn(
    "w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer outline-none",
    "border border-white/10 bg-white/[0.06] text-[rgba(240,234,214,0.8)] text-[0.85rem]",
    "transition-[background,color,border-color,transform,box-shadow] duration-150",
    "hover:bg-[rgba(212,175,55,0.18)] hover:text-[#f5d785] hover:border-[rgba(212,175,55,0.35)] hover:-translate-y-px hover:shadow-[0_3px_10px_rgba(0,0,0,0.2)]",
    "active:translate-y-0 active:scale-[0.96] active:shadow-none",
    "focus-visible:shadow-[0_0_0_2px_rgba(212,175,55,0.45)] focus-visible:outline-none",
  );

  const playerBtnSmCls = (active = false) =>
    cn(
      "px-[0.55rem] py-[0.24rem] min-h-[28px] flex items-center justify-center",
      "rounded-md border text-[0.71rem] font-semibold font-[var(--font-ui)] cursor-pointer outline-none whitespace-nowrap",
      "transition-[background,color,border-color,transform] duration-150",
      active
        ? "bg-[rgba(212,175,55,0.28)] text-[#f5d785] border-[rgba(212,175,55,0.5)] shadow-[0_1px_6px_rgba(212,175,55,0.18)]"
        : "bg-white/[0.05] text-[rgba(240,234,214,0.7)] border-white/10 hover:bg-[rgba(212,175,55,0.15)] hover:text-[#f5d785] hover:border-[rgba(212,175,55,0.28)] hover:-translate-y-px",
      "focus-visible:shadow-[0_0_0_2px_rgba(212,175,55,0.45)] focus-visible:outline-none",
    );

  const { displayMode, currentSurah } = state;
  const surahMeta = getSurah(currentSurah);
  const currentSurahName = surahMeta ? surahName(currentSurah, lang) : "";
  const currentArabicName = surahMeta?.ar || "";

  const triggerPlaySurah = () => {
    window.dispatchEvent(new CustomEvent("mushaf:play-surah"));
  };

  /* ── Drag state ── */
  const cardRef = useRef(null);
  const dragState = useRef(null); // { startX, startY, originX, originY }
  const [isDragging, setIsDragging] = useState(false);
  const [cardPos, setCardPos] = useState(() => {
    const saved = loadCardPos();
    if (saved) return saved;
    // Default: bottom-right corner, just above player
    const playerH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--player-h",
      ) || "80",
    );
    return {
      x: window.innerWidth - 220 - 16,
      y: window.innerHeight - playerH - 16 - 56,
    };
  });

  /* Re-clamp on resize */
  useEffect(() => {
    const onResize = () => {
      if (!cardRef.current) return;
      const { offsetWidth: w, offsetHeight: h } = cardRef.current;
      setCardPos((prev) => {
        const next = clamp(prev.x, prev.y, w, h);
        saveCardPos(next);
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      // Only drag on the handle area (not the play button)
      if (e.target.closest("button")) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: cardPos.x,
        originY: cardPos.y,
      };
      setIsDragging(true);
    },
    [cardPos],
  );

  const onPointerMove = useCallback((e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const card = cardRef.current;
    const w = card ? card.offsetWidth : 220;
    const h = card ? card.offsetHeight : 56;
    const next = clamp(
      dragState.current.originX + dx,
      dragState.current.originY + dy,
      w,
      h,
    );
    setCardPos(next);
  }, []);

  const onPointerUp = useCallback(
    (e) => {
      if (!dragState.current) return;
      const card = cardRef.current;
      const w = card ? card.offsetWidth : 220;
      const h = card ? card.offsetHeight : 56;

      /* Snap to nearest horizontal edge */
      const midX = window.innerWidth / 2;
      const snapX = cardPos.x + w / 2 < midX ? 16 : window.innerWidth - w - 16;

      const snapped = clamp(snapX, cardPos.y, w, h);
      setCardPos(snapped);
      saveCardPos(snapped);
      dragState.current = null;
      setIsDragging(false);
    },
    [cardPos],
  );

  return (
    <>
      {/* ── Play Surah Card — draggable ── */}
      {displayMode === "surah" && (
        <div
          ref={cardRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(
            "fixed z-[290] flex items-stretch",
            "rounded-2xl overflow-hidden",
            "border border-white/[0.13]",
            "shadow-[0_8px_32px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2)]",
            isDragging
              ? "cursor-grabbing scale-[1.03] shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
              : "cursor-grab",
            "select-none touch-none",
            isDragging
              ? "transition-shadow transition-transform duration-150"
              : "transition-[box-shadow,transform] duration-200",
          )}
          style={{
            left: cardPos.x,
            top: cardPos.y,
            background:
              "linear-gradient(135deg, rgba(14,61,38,0.97) 0%, rgba(8,28,16,0.98) 100%)",
            backdropFilter: "blur(12px)",
          }}
          aria-label={t("audio.playSurah", lang)}
          role="region"
        >
          {/* Decorative left accent bar */}
          <div
            className="w-1 shrink-0 rounded-s-2xl"
            style={{
              background:
                "linear-gradient(180deg, var(--gold) 0%, rgba(212,168,32,0.4) 100%)",
            }}
          />

          <div className="flex items-center gap-3 px-3.5 py-2.5">
            {/* Drag handle hint */}
            <div
              className={cn(
                "w-9 h-9 shrink-0 rounded-xl flex items-center justify-center",
                "bg-white/[0.07] border border-white/[0.1]",
                "transition-colors duration-150",
                isDragging && "bg-white/[0.14]",
              )}
            >
              <i
                className={cn(
                  "text-[0.8rem] transition-all duration-150",
                  isDragging ? "fas fa-up-down-left-right" : "fas fa-quran",
                )}
                style={{ color: "var(--gold)" }}
                aria-hidden="true"
              />
            </div>

            {/* Text info */}
            <div className="flex flex-col min-w-0">
              <span className="text-[0.7rem] font-medium text-white/50 font-[var(--font-ui)] leading-tight">
                {lang === "fr"
                  ? "Lire la sourate"
                  : lang === "ar"
                    ? "تشغيل السورة"
                    : "Play surah"}
              </span>
              <span className="text-[0.84rem] font-bold text-white/90 font-[var(--font-ui)] leading-tight truncate max-w-[130px]">
                {lang === "ar" ? currentArabicName : currentSurahName}
              </span>
            </div>

            {/* Play button */}
            <button
              onClick={triggerPlaySurah}
              className={cn(
                "w-9 h-9 shrink-0 flex items-center justify-center rounded-xl",
                "text-[0.82rem] cursor-pointer outline-none",
                "border border-[rgba(212,168,32,0.4)] bg-[rgba(212,168,32,0.15)]",
                "text-[#f5d785]",
                "transition-all duration-150",
                "hover:bg-[rgba(212,168,32,0.28)] hover:border-[rgba(212,168,32,0.6)] hover:-translate-y-px",
                "hover:shadow-[0_4px_16px_rgba(212,168,32,0.25)]",
                "active:scale-95 active:shadow-none",
                "focus-visible:shadow-[0_0_0_2px_rgba(212,168,32,0.5)]",
              )}
              title={t("audio.playSurah", lang)}
              aria-label={t("audio.playSurah", lang)}
            >
              <i className="fas fa-play text-[0.7rem]" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[300]",
          "text-[#f0ead6] rounded-t-2xl",
          "transition-shadow duration-[220ms]",
          expanded
            ? "shadow-[0_-8px_48px_rgba(0,0,0,0.38),0_-1px_0_rgba(255,255,255,0.07)]"
            : "shadow-[0_-4px_32px_rgba(0,0,0,0.28),0_-1px_0_rgba(255,255,255,0.06)]",
        )}
        style={{
          background: "var(--player-glass)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
        role="region"
        aria-label={
          lang === "ar"
            ? "مشغل الصوت"
            : lang === "fr"
              ? "Lecteur Audio"
              : "Audio Player"
        }
      >
        {/* ── Mini bar ── */}
        <div className="flex flex-col">
          {/* Progress bar */}
          <div
            className={cn(
              "relative cursor-pointer overflow-visible rounded-t-2xl",
              "bg-white/10 transition-[height] duration-150",
              "h-[3px] hover:h-[5px]",
            )}
            ref={progressRef}
            onClick={handleSeek}
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={
              lang === "ar"
                ? "تقدم الصوت"
                : lang === "fr"
                  ? "Progression audio"
                  : "Audio progress"
            }
          >
            <div
              className={cn(
                "h-full rounded-[inherit] relative",
                "bg-gradient-to-r from-[var(--gold)] to-[var(--gold-bright)]",
                "shadow-[0_0_8px_rgba(184,134,11,0.45)]",
                "transition-[width] duration-100 ease-linear",
                /* thumb dot */
                "after:content-[''] after:absolute after:right-[-5px] after:top-1/2",
                "after:-translate-y-1/2 after:scale-0",
                "after:w-3 after:h-3 after:rounded-full after:bg-white",
                "after:shadow-[0_1px_6px_rgba(0,0,0,0.3)]",
                "after:transition-transform after:duration-150 after:pointer-events-none",
                "group-hover:after:scale-100",
              )}
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between px-5 sm:px-8 gap-3 min-h-[64px] max-sm:gap-1.5 max-sm:min-h-[56px]">
            {/* Left: info */}
            <div
              className="flex-1 min-w-0 flex flex-col gap-[0.1rem] max-sm:max-w-[72px]"
              aria-live="polite"
              aria-atomic="true"
            >
              {currentPlayingAyah ? (
                <span className="block font-[var(--font-ui)] text-[0.84rem] text-white/[0.92] whitespace-nowrap overflow-hidden text-ellipsis font-semibold tracking-[0.02em] max-sm:text-[0.72rem]">
                  {t("quran.surah", lang)} {currentPlayingAyah.surah}:
                  {currentPlayingAyah.ayah}
                </span>
              ) : (
                <span className="block font-[var(--font-ui)] text-[0.84rem] text-white/[0.92] whitespace-nowrap overflow-hidden text-ellipsis font-semibold tracking-[0.02em] max-sm:text-[0.72rem]">
                  {t("audio.play", lang)}
                </span>
              )}

              {isWarshMode && (
                <div className="flex items-center gap-[0.3rem] mt-[0.1rem] flex-wrap max-sm:hidden">
                  <span
                    className={cn(
                      "inline-flex items-center px-[0.45rem] py-[0.1rem]",
                      "rounded-full text-[0.6rem] font-[var(--font-ui)] font-bold tracking-[0.02em] leading-[1.3]",
                      "border whitespace-nowrap",
                      warshStrictMode
                        ? "bg-[rgba(212,168,32,0.14)] text-[#f5d785] border-[rgba(212,168,32,0.3)]"
                        : "bg-white/[0.07] text-white/55 border-white/[0.12]",
                    )}
                  >
                    {warshStrictMode ? warshStrictLabel : warshNonStrictLabel}
                  </span>
                  {warshStrictMode && (
                    <span className="inline-flex items-center px-[0.45rem] py-[0.1rem] rounded-full text-[0.6rem] font-[var(--font-ui)] font-bold tracking-[0.02em] leading-[1.3] border whitespace-nowrap bg-[rgba(212,168,32,0.14)] text-[#f5d785] border-[rgba(212,168,32,0.3)]">
                      {warshVerifiedLabel}
                    </span>
                  )}
                </div>
              )}

              <span className="text-[0.7rem] text-white/50 font-mono tracking-[0.05em] max-sm:text-[0.62rem]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Center: main buttons */}
            <div className="flex items-center gap-1 shrink-0 max-sm:gap-[0.15rem]">
              <button
                className={cn(
                  playerBtnCls,
                  "max-sm:w-[30px] max-sm:h-[30px] max-sm:text-[0.75rem] max-sm:rounded-md",
                )}
                onClick={prev}
                title={t("audio.prev", lang)}
                aria-label={t("audio.prev", lang)}
              >
                <i className="fas fa-backward-step" aria-hidden="true"></i>
              </button>

              {/* Play / Pause — prominent circle */}
              <button
                className={cn(
                  "w-11 h-11 flex items-center justify-center rounded-full",
                  "bg-white text-[#0e3d26] text-base border-none cursor-pointer",
                  "shadow-[0_2px_12px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.15)]",
                  "transition-[transform,box-shadow,background] duration-150",
                  "hover:scale-[1.07] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(0,0,0,0.28),0_2px_6px_rgba(0,0,0,0.18)] hover:bg-[#f8f8f8]",
                  "active:scale-[0.97] active:shadow-[0_1px_6px_rgba(0,0,0,0.18)]",
                  "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(212,175,55,0.5)]",
                  "max-sm:w-9 max-sm:h-9 max-sm:text-[0.85rem]",
                )}
                onClick={toggle}
                title={
                  isPlaying ? t("audio.pause", lang) : t("audio.play", lang)
                }
                aria-label={
                  isPlaying ? t("audio.pause", lang) : t("audio.play", lang)
                }
                aria-pressed={isPlaying}
              >
                <i
                  className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`}
                  aria-hidden="true"
                ></i>
              </button>

              <button
                className={cn(
                  playerBtnCls,
                  "max-sm:w-[30px] max-sm:h-[30px] max-sm:text-[0.75rem] max-sm:rounded-md",
                )}
                onClick={next}
                title={t("audio.next", lang)}
                aria-label={t("audio.next", lang)}
              >
                <i className="fas fa-forward-step" aria-hidden="true"></i>
              </button>

              <button
                className={cn(
                  playerBtnCls,
                  "max-sm:w-[30px] max-sm:h-[30px] max-sm:text-[0.75rem] max-sm:rounded-md",
                )}
                onClick={stop}
                title={t("audio.stop", lang)}
                aria-label={t("audio.stop", lang)}
              >
                <i className="fas fa-stop" aria-hidden="true"></i>
              </button>
            </div>

            {/* Right: extra controls */}
            <div className="flex items-center gap-1 shrink-0 max-sm:gap-[0.15rem]">
              {/* Volume group */}
              <div className="flex items-center gap-1 max-sm:hidden">
                <button
                  className={playerBtnSmCls()}
                  onClick={() => {
                    const v = volume > 0 ? 0 : 1;
                    handleVolumeChange(v);
                  }}
                  title={t("audio.volume", lang)}
                  aria-label={t("audio.volume", lang)}
                >
                  <i
                    className={`fas ${
                      volume === 0
                        ? "fa-volume-xmark"
                        : volume < 0.5
                          ? "fa-volume-low"
                          : "fa-volume-high"
                    }`}
                    aria-hidden="true"
                  ></i>
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) =>
                    handleVolumeChange(parseFloat(e.target.value))
                  }
                  className="w-16 h-[3px] rounded-full cursor-pointer opacity-75 hover:opacity-100 transition-opacity duration-150"
                  style={{ accentColor: "var(--gold-bright, #d4a820)" }}
                  aria-label={`${
                    lang === "ar"
                      ? "الحجم"
                      : lang === "fr"
                        ? "Volume"
                        : "Volume"
                  }: ${Math.round(volume * 100)}%`}
                  title={`${Math.round(volume * 100)}%`}
                />
              </div>

              <button
                className={cn(
                  playerBtnSmCls(),
                  "max-sm:px-[0.38rem] max-sm:py-[0.18rem] max-sm:text-[0.63rem] max-sm:min-h-[24px]",
                )}
                onClick={cycleSpeed}
                title={
                  lang === "ar"
                    ? "سرعة التشغيل"
                    : lang === "fr"
                      ? "Vitesse de lecture"
                      : "Playback speed"
                }
                aria-label={`${
                  lang === "ar" ? "السرعة" : lang === "fr" ? "Vitesse" : "Speed"
                }: ${audioSpeed}x`}
              >
                {audioSpeed}x
              </button>

              <button
                className={cn(
                  playerBtnSmCls(memMode),
                  "max-sm:px-[0.38rem] max-sm:py-[0.18rem] max-sm:text-[0.63rem] max-sm:min-h-[24px]",
                )}
                onClick={() => set({ memMode: !memMode })}
                title={t("audio.memorization", lang)}
                aria-label={t("audio.memorization", lang)}
                aria-pressed={memMode}
              >
                <i className="fas fa-repeat" aria-hidden="true"></i>
              </button>

              <button
                className={cn(
                  playerBtnSmCls(),
                  "max-sm:px-[0.38rem] max-sm:py-[0.18rem] max-sm:text-[0.63rem] max-sm:min-h-[24px]",
                )}
                onClick={() => setExpanded(!expanded)}
                title={expandLabel}
                aria-label={expandLabel}
                aria-expanded={expanded}
              >
                <i
                  className={`fas fa-chevron-${expanded ? "down" : "up"}`}
                  aria-hidden="true"
                ></i>
              </button>
            </div>
          </div>
        </div>

        {/* ── Expanded panel ── */}
        {expanded && (
          <div
            className="px-5 sm:px-8 pt-[0.85rem] pb-4 border-t border-white/[0.07] bg-black/[0.18] max-sm:pt-[0.6rem] max-sm:pb-3"
            style={{ animation: "fadeInUp 0.2s var(--ease)" }}
          >
            {/* Reciter selection */}
            <div className="mb-[0.85rem] last:mb-0">
              <label className="block font-[var(--font-ui)] text-[0.68rem] text-[rgba(240,234,214,0.5)] mb-[0.45rem] font-bold tracking-[0.06em] uppercase">
                {t("audio.reciter", lang)}
              </label>
              <div
                className="grid gap-1.5 max-sm:gap-1"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
                }}
              >
                {currentReciters.map((r) => (
                  <button
                    key={r.id}
                    className={cn(
                      "relative text-start rounded-xl px-3 py-2.5 cursor-pointer outline-none",
                      "border transition-[background,border-color,box-shadow,transform] duration-150",
                      reciter === r.id
                        ? "bg-[rgba(212,175,55,0.16)] border-[rgba(212,175,55,0.55)] shadow-[0_2px_10px_rgba(212,175,55,0.15)]"
                        : "bg-white/[0.04] border-white/10 text-[rgba(240,234,214,0.88)] hover:bg-white/[0.09] hover:border-[rgba(212,175,55,0.4)] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(0,0,0,0.2)]",
                      "focus-visible:shadow-[0_0_0_2px_rgba(212,175,55,0.45)]",
                      "max-sm:px-2.5 max-sm:py-2",
                    )}
                    onClick={() => changeReciter(r.id)}
                    aria-pressed={reciter === r.id}
                  >
                    <div
                      className={cn(
                        "text-[0.78rem] font-bold leading-[1.25] max-sm:text-[0.72rem]",
                        reciter === r.id ? "text-[#f5d785]" : "text-white/90",
                      )}
                    >
                      {lang === "ar"
                        ? r.name
                        : lang === "fr"
                          ? r.nameFr
                          : r.nameEn}
                    </div>
                    <div className="mt-[0.12rem] text-[0.65rem] opacity-65 font-[var(--font-quran,serif)]">
                      {r.style === "murattal"
                        ? "مرتل"
                        : r.style === "tartil"
                          ? "مجود"
                          : r.style}
                    </div>
                    {reciter === r.id && (
                      <div className="absolute top-[0.38rem] end-[0.45rem] text-[#f5d785] text-[0.68rem]">
                        <i className="fas fa-check"></i>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Memorization settings */}
            {memMode && (
              <div className="mb-0">
                <label className="block font-[var(--font-ui)] text-[0.68rem] text-[rgba(240,234,214,0.5)] mb-[0.45rem] font-bold tracking-[0.06em] uppercase">
                  {t("audio.memorization", lang)}
                </label>
                <div className="flex gap-5 flex-wrap max-sm:flex-col max-sm:gap-2">
                  <div className="flex items-center gap-2 text-[0.76rem] text-[rgba(240,234,214,0.8)] font-[var(--font-ui)]">
                    <span>{t("audio.repeat", lang)}</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={memRepeatCount}
                      onChange={(e) =>
                        set({ memRepeatCount: parseInt(e.target.value) || 3 })
                      }
                      className={cn(
                        "w-[58px] px-[0.4rem] py-[0.28rem] text-center text-[0.82rem]",
                        "rounded-md border border-white/15 bg-white/[0.08]",
                        "text-[rgba(240,234,214,0.95)] font-[var(--font-ui)] outline-none",
                        "focus:border-[rgba(212,175,55,0.5)] focus:shadow-[0_0_0_2px_rgba(212,175,55,0.18)]",
                        "transition-[border-color,box-shadow] duration-150",
                      )}
                      aria-label={t("audio.repeat", lang)}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[0.76rem] text-[rgba(240,234,214,0.8)] font-[var(--font-ui)]">
                    <span>{t("audio.pause", lang)} (s)</span>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={memPause}
                      onChange={(e) =>
                        set({ memPause: parseInt(e.target.value) || 2 })
                      }
                      className={cn(
                        "w-[58px] px-[0.4rem] py-[0.28rem] text-center text-[0.82rem]",
                        "rounded-md border border-white/15 bg-white/[0.08]",
                        "text-[rgba(240,234,214,0.95)] font-[var(--font-ui)] outline-none",
                        "focus:border-[rgba(212,175,55,0.5)] focus:shadow-[0_0_0_2px_rgba(212,175,55,0.18)]",
                        "transition-[border-color,box-shadow] duration-150",
                      )}
                      aria-label={`${t("audio.pause", lang)} en secondes`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
