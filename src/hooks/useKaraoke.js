import { useState, useEffect, useRef, useMemo } from 'react';
import audioService from '../services/audioService';

/**
 * Custom hook to manage karaoke progress tracking.
 * Uses RequestAnimationFrame for smooth 60fps updates.
 */
export function useKaraoke({ isFirstAyah, wordCount, calibration }) {
    const [progress, setProgress] = useState(0);
    const rafRef = useRef(null);
    const smoothedRef = useRef(0);
    const lastAudioTimeRef = useRef(0);

    useEffect(() => {
        let running = true;
        const tick = () => {
            if (!running) return;

            const dur = audioService.duration;
            if (dur > 0) {
                const currentAudioTime = audioService.currentTime;

                // Detect manual seek backward and reset smoothing
                if (currentAudioTime + 0.35 < lastAudioTimeRef.current) {
                    smoothedRef.current = 0;
                }
                lastAudioTimeRef.current = currentAudioTime;

                const p = getCalibratedKaraokeProgress({
                    currentTime: currentAudioTime,
                    duration: dur,
                    isFirstAyah,
                    wordCount,
                    lagTuning: calibration?.lagTuning ?? 0.9,
                    extraLagSec: calibration?.extraLagSec ?? 0,
                });

                // Smooth progression
                const prev = smoothedRef.current || 0;
                const eased = prev + (p - prev) * (calibration?.smoothing ?? 0.24);
                const next = Math.max(prev, eased);
                smoothedRef.current = next;
                setProgress(next);
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            running = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isFirstAyah, wordCount, calibration]);

    return progress;
}

/**
 * Core calibration logic (moved from QuranDisplay)
 */
function getCalibratedKaraokeProgress({ currentTime, duration, isFirstAyah, wordCount = 0, lagTuning = 1, extraLagSec = 0 }) {
    if (!duration || duration <= 0) return 0;

    let effectiveTime = currentTime;

    // Base anti-lead lag in seconds
    let dynamicLagSec = 0.35 + (duration * 0.08) + (Math.max(0, wordCount - 10) * 0.015) + extraLagSec;
    if (wordCount >= 24) dynamicLagSec += 0.35;
    if (wordCount >= 34) dynamicLagSec += 0.25;

    effectiveTime = Math.max(0, effectiveTime - dynamicLagSec);
    let progress = effectiveTime / duration;

    // Ayah 1 (except surah 1,9): basmala offset
    if (isFirstAyah) {
        const basmalaPortion = 0.17;
        progress = Math.max(0, (progress - basmalaPortion) / (1 - basmalaPortion));
    }

    progress *= lagTuning;

    // Long verses slowdown
    if (wordCount >= 26) progress *= 0.87;
    else if (wordCount >= 18) progress *= 0.9;
    else if (wordCount >= 12) progress *= 0.94;

    return Math.max(0, Math.min(1, progress));
}
