import React, { useMemo } from 'react';
import { useKaraoke } from '../../hooks/useKaraoke';
import { getPerWordTajweedColors } from '../../data/tajwidRules';
import { stripBasmala } from '../../utils/quranUtils';
import WarshWordText from './WarshWordText';
import { AyahTextRenderer } from './AyahTextRenderer';

/**
 * KaraokeWarshText – tracks word-by-word progress for QCF4 words.
 */
export function KaraokeWarshText({ words, hafsText, isFirstAyah, calibration, tajweedColors }) {
    const wordWeights = useMemo(() => {
        if (!words || words.length === 0) return [];
        const total = words.length;

        if (hafsText) {
            const hafsWords = hafsText.split(/\s+/).filter(w => w.length > 0);
            const raw = [];
            for (let i = 0; i < total; i++) {
                const hw = hafsWords[Math.min(i, hafsWords.length - 1)] || '';
                const base = hw.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06E1]/g, '');
                let weight = Math.max(1, base.length);
                const maddCount = (hw.match(/[اوي\u0670\u0649]/g) || []).length;
                weight += maddCount * 0.8;
                if (/[اوي][\u0621\u0623\u0625\u0624\u0626]/.test(hw)) weight += 1.0;
                const shaddaCount = (hw.match(/\u0651/g) || []).length;
                weight += shaddaCount * 0.5;
                if (/[\u064B\u064C\u064D]/.test(hw)) weight += 0.4;
                if (/الله/.test(hw)) weight += 0.8;
                if (i === 0) weight += 0.3;
                if (i === total - 1) weight += 0.5;
                raw.push(weight);
            }
            const totalWeight = raw.reduce((s, v) => s + v, 0);
            let cum = 0;
            return raw.map(w => { cum += w / totalWeight; return cum; });
        }
        return Array.from({ length: total }, (_, i) => (i + 1) / total);
    }, [words, hafsText]);

    const progress = useKaraoke({ isFirstAyah, wordCount: words.length, calibration });

    const currentIdx = useMemo(() => {
        let idx = 0;
        for (let i = 0; i < wordWeights.length; i++) {
            if (progress < wordWeights[i]) { idx = i; break; }
            idx = i;
        }
        const fixedLag = words.length >= 24
            ? (calibration?.lagWordsLong ?? 3)
            : (calibration?.lagWordsBase ?? 2);
        return Math.max(0, idx - fixedLag);
    }, [progress, wordWeights, words.length, calibration]);

    return <WarshWordText words={words} highlightIdx={currentIdx >= 0 ? currentIdx : undefined} tajweedColors={tajweedColors} />;
}

/**
 * SmartAyahRenderer – orchestrates all ayah rendering paths.
 */
const SmartAyahRenderer = React.memo(function SmartAyahRenderer({ ayah, showTajwid, isPlaying, surahNum, calibration, riwaya }) {
    const isFirstAyah = ayah.numberInSurah === 1 && surahNum !== 1 && surahNum !== 9;
    const effectiveRiwaya = ayah.warshWords ? 'warsh' : (riwaya || 'hafs');

    const tajweedColors = useMemo(() => {
        if (!showTajwid) return null;
        const sourceText = ayah.hafsText || (ayah.warshWords ? null : ayah.text);
        if (!sourceText) return null;
        const cleanText = stripBasmala(sourceText, surahNum, ayah.numberInSurah);
        return getPerWordTajweedColors(cleanText, effectiveRiwaya);
    }, [showTajwid, ayah.hafsText, ayah.text, ayah.warshWords, surahNum, ayah.numberInSurah, effectiveRiwaya]);

    const cleanHafsText = useMemo(() => {
        if (!ayah.hafsText) return null;
        return stripBasmala(ayah.hafsText, surahNum, ayah.numberInSurah);
    }, [ayah.hafsText, surahNum, ayah.numberInSurah]);

    if (ayah.warshWords && ayah.warshWords.length > 0) {
        if (isPlaying) {
            return <KaraokeWarshText words={ayah.warshWords} hafsText={cleanHafsText} isFirstAyah={isFirstAyah} calibration={calibration} tajweedColors={tajweedColors} />;
        }
        return <WarshWordText words={ayah.warshWords} tajweedColors={tajweedColors} />;
    }

    if (ayah.requestedRiwaya === 'warsh') {
        return <span className="warsh-missing-text">⚠︎ Warsh text unavailable for this ayah</span>;
    }

    const text = stripBasmala(ayah.text, surahNum, ayah.numberInSurah);
    return <AyahTextRenderer text={text} showTajwid={showTajwid} isPlaying={isPlaying} isFirstAyah={isFirstAyah} calibration={calibration} riwaya={effectiveRiwaya} />;
});

export default SmartAyahRenderer;
