import React, { useMemo } from 'react';
import { useKaraoke } from '../../hooks/useKaraoke';
import WordByWordText from './WordByWordText';
import TajwidText from './TajwidText';

/**
 * KaraokeAyahText component – manages its own RAF for 60fps highlighting.
 */
export const KaraokeAyahText = React.memo(function KaraokeAyahText({ text, isFirstAyah, calibration }) {
    const wordCount = useMemo(() => (text ? text.split(/\s+/).filter(Boolean).length : 0), [text]);
    const progress = useKaraoke({ isFirstAyah, wordCount, calibration });

    const lagWords = wordCount >= 24
        ? (calibration?.lagWordsLong ?? 3)
        : wordCount >= 12
            ? Math.max(2, calibration?.lagWordsBase ?? 1)
            : (calibration?.lagWordsBase ?? 1);

    return <WordByWordText text={text} progress={progress} lagWords={lagWords} />;
});

/**
 * AyahTextRenderer – switches between karaoke and tajwid based on state.
 */
export function AyahTextRenderer({ text, showTajwid, isPlaying, isFirstAyah, calibration, riwaya }) {
    if (isPlaying) {
        return <KaraokeAyahText text={text} isFirstAyah={isFirstAyah} calibration={calibration} />;
    }
    return <TajwidText text={text} enabled={showTajwid} riwaya={riwaya} />;
}
