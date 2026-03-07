/* mon-coran/src/hooks/useKaraoke.js */

import { useState, useEffect, useRef } from "react";
import audioService from "../services/audioService";

/**
 * Karaoke model — word-by-word highlighting synchronized with audio.
 *
 * Key improvements:
 * - RAF loop parks automatically when audio is paused (no ghost highlights)
 * - Seeks snap instantly without waiting for the smoothing ramp
 * - Progress resets cleanly on ayah change
 * - isPlaying-aware: if audio stops, progress freezes
 */

export function useKaraoke({ isFirstAyah, wordCount, calibration }) {
  const [progress, setProgress] = useState(0);
  const [seekCount, setSeekCount] = useState(0);
  const rafRef = useRef(null);
  const smoothedRef = useRef(0);
  const lastTimeRef = useRef(-1);

  // offsetSec négatif = highlight légèrement APRÈS l'audio (sécurité)
  // offsetSec positif = highlight légèrement EN AVANCE
  const offsetSec = calibration?.offsetSec ?? -0.10;
  // smoothing élevé (0.7+) = très réactif / snappy
  const smoothing = calibration?.smoothing ?? 0.65;

  useEffect(() => {
    // Reset on every calibration / ayah change
    smoothedRef.current = 0;
    lastTimeRef.current = -1;
    setProgress(0);
    let running = true;

    const tick = () => {
      if (!running) return;

      // ── Park the loop when audio is paused / stopped ──
      if (!audioService.isPlaying) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dur = audioService.duration || 0;
      const t = audioService.currentTime || 0;

      if (dur > 0) {
        const prevT = lastTimeRef.current;

        // Detect seek (backward jump or large forward skip)
        if (prevT >= 0) {
          const delta = t - prevT;
          const bigJump = Math.abs(delta) > 1.5;
          const backwardSeek = delta < -0.25;

          if (bigJump || backwardSeek) {
            // Snap immediately — bypass smoothing
            const snapped = Math.max(0, Math.min(1, (t + offsetSec) / dur));
            smoothedRef.current = snapped;
            setSeekCount(c => c + 1);
            // Reset lastIdx in the consumer via seekCount
          }
        }

        // Smoothed progress — alpha clamped to [0.80, 0.96] for snappy yet stable tracking.
        // Higher clamp floor eliminates the steady-state lab of older [0.55, 0.92] range.
        const rawProgress = Math.max(0, Math.min(1, (t + offsetSec) / dur));
        const prev = smoothedRef.current;
        const alpha = Math.min(0.96, Math.max(0.80, smoothing));
        let next = prev + (rawProgress - prev) * alpha;

        // Monotone guard: no backward drift without an explicit seek
        if (next < prev - 0.003) next = prev;

        smoothedRef.current = next;
        setProgress(next);
      }

      lastTimeRef.current = t;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offsetSec, smoothing, isFirstAyah, wordCount]);

  return { progress, seekCount };
}

/**
 * Helper to build a calibration profile for a given reciter/riwaya.
 */
export function buildKaraokeCalibration({ reciterId, riwaya, isFirstAyah, wordCount }) {
  // Positive offsets → anticipatory highlighting (word lights up just before it is spoken).
  let offsetSec = riwaya === "warsh" ? 0.20 : 0.15;
  let smoothing = 0.88;
  // First ayah has a shorter basmala intro (already stripped) — standard offset is fine.
  // For Fatiha-style openings keep the same lead; no extra bias needed.
  return { offsetSec, smoothing, lagWordsBase: 0, lagWordsLong: 0 };
}
