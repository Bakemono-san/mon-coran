/* mon-coran/src/hooks/useKaraoke.js */

import { useState, useEffect, useRef } from "react";
import audioService from "../services/audioService";

/**
 * Very simple, predictable karaoke model:
 *
 * - Progress = (currentTime + offsetSec) / duration
 * - Clamped between 0 and 1
 * - No complex dynamic lag, no basmala magic, no adaptive smoothing
 *
 * The goal is to:
 *   1. Be easy to reason about
 *   2. Make it trivial to tune per-reciter / per-ayah offsets from the UI/state
 *   3. Avoid jumps backwards
 *
 * Recommended usage from the caller:
 *   useKaraoke({
 *     isFirstAyah,
 *     wordCount,
 *     calibration: {
 *       offsetSec: -0.4,        // start a bit earlier (negative = earlier)
 *       smoothing: 0.35,        // 0 = raw, >0 = smoothed
 *       minLagSec: 0.0,         // small positive if you want text slightly behind
 *       maxLagSec: 0.3,         // cap how far behind it can be
 *     }
 *   });
 */

export function useKaraoke({ isFirstAyah, wordCount, calibration }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const smoothedRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Extract simple parameters with strong defaults to make highlight very early
  const offsetSec = calibration?.offsetSec ?? -0.9; // large negative shift: texte très en avance
  const smoothing = calibration?.smoothing ?? 0.12; // peu de lissage -> réaction très rapide

  // Optional guard rails to avoid text getting too far behind (heavily reduced)
  const minLagSec = calibration?.minLagSec ?? 0.0;
  const maxLagSec = calibration?.maxLagSec ?? 0.05; // presque pas de lag autorisé

  useEffect(() => {
    let running = true;

    const tick = () => {
      if (!running) return;

      const dur = audioService.duration || 0;
      const t = audioService.currentTime || 0;

      if (dur > 0) {
        // Base linear progress with global offset
        let rawProgress = (t + offsetSec) / dur;

        // Clamp to [0, 1]
        if (rawProgress < 0) rawProgress = 0;
        else if (rawProgress > 1) rawProgress = 1;

        // Very light adjustment to keep text slightly behind if desired
        // Convert lag window to progress fraction
        const minLagP = minLagSec > 0 ? minLagSec / dur : 0;
        const maxLagP = maxLagSec > 0 ? maxLagSec / dur : 0;

        let target = rawProgress;

        // If we want some minimal lag, ensure target is not ahead too much
        if (maxLagP > 0 && lastTimeRef.current > 0) {
          const audioDelta = (t - lastTimeRef.current) / dur;
          // If audio jumped forward a lot, allow small catch-up but keep within window
          if (audioDelta > 0.02) {
            // keep within [rawProgress - maxLagP, rawProgress - minLagP]
            const upper = Math.max(0, rawProgress - minLagP);
            const lower = Math.max(0, rawProgress - maxLagP);
            const prev = smoothedRef.current || 0;
            if (prev > upper) target = upper;
            else if (prev < lower) target = lower;
          }
        }

        // Smoothing: simple exponential interpolation
        const prev = smoothedRef.current || 0;
        let next;
        if (smoothing <= 0) {
          next = target;
        } else {
          const alpha = Math.min(0.95, Math.max(0.05, smoothing));
          next = prev + (target - prev) * alpha;
        }

        // Do not go backwards: monotonically non-decreasing
        if (next < prev) next = prev;

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
    // NOTE: we deliberately do NOT depend on audioService here,
    // only on configuration inputs.
  }, [offsetSec, smoothing, minLagSec, maxLagSec, isFirstAyah, wordCount]);

  return progress;
}

/**
 * Helper to build a simple calibration profile.
 * You can adjust these per-reciter / per-riwaya in one place.
 */
export function buildKaraokeCalibration({
  reciterId,
  riwaya,
  isFirstAyah,
  wordCount,
}) {
  // Base defaults
  // Very strong negative offset: highlight is aggressively early in the ayah
  let offsetSec = -1.0;
  // Very light smoothing to keep movement responsive
  let smoothing = 0.12;
  let minLagSec = 0.0;
  // Minimal lag window: we almost never allow the text to trail behind
  let maxLagSec = 0.05;

  // Example: tweak by riwaya or reciter if needed
  if (riwaya === "warsh") {
    // For Warsh, push slightly further ahead as requested
    offsetSec = -1.1;
    smoothing = 0.14;
  }

  // First ayah (with basmala) often has a longer intro → slightly different offset
  if (isFirstAyah) {
    offsetSec -= 0.1;
  }

  // Long verses: allow a tiny bit more lag so text doesn’t rush ahead
  if (wordCount >= 24) {
    maxLagSec += 0.05;
  } else if (wordCount >= 16) {
    maxLagSec += 0.02;
  }

  return {
    offsetSec,
    smoothing,
    minLagSec,
    maxLagSec,
  };
}
