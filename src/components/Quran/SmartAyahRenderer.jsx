import React, { useMemo } from "react";
import { useKaraoke, buildKaraokeCalibration } from "../../hooks/useKaraoke";
import { getPerWordTajweedColors } from "../../data/tajwidRules";
import { stripBasmala } from "../../utils/quranUtils";
import WarshWordText from "./WarshWordText";
import { AyahTextRenderer } from "./AyahTextRenderer";

/**
 * KaraokeWarshText – tracks word-by-word progress for QCF4 words.
 */
export function KaraokeWarshText({
  words,
  hafsText,
  isFirstAyah,
  calibration,
  tajweedColors,
}) {
  const wordWeights = useMemo(() => {
    if (!words || words.length === 0) return [];
    const total = words.length;

    if (hafsText) {
      const hafsWords = hafsText.split(/\s+/).filter((w) => w.length > 0);
      const raw = [];
      for (let i = 0; i < total; i++) {
        const hw = hafsWords[Math.min(i, hafsWords.length - 1)] || "";
        const base = hw.replace(
          /[\u064B-\u065F\u0670\u06D6-\u06ED\u06E1]/g,
          "",
        );
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
      return raw.map((w) => {
        cum += w / totalWeight;
        return cum;
      });
    }
    return Array.from({ length: total }, (_, i) => (i + 1) / total);
  }, [words, hafsText]);

  const effectiveCalibration =
    calibration ||
    buildKaraokeCalibration({
      reciterId: undefined,
      riwaya: "warsh",
      isFirstAyah,
      wordCount: words.length,
    });

  const progress = useKaraoke({
    isFirstAyah,
    wordCount: words.length,
    calibration: effectiveCalibration,
  });

  const currentIdx = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < wordWeights.length; i++) {
      if (progress < wordWeights[i]) {
        idx = i;
        break;
      }
      idx = i;
    }

    const baseLag =
      words.length >= 24
        ? (calibration?.lagWordsLong ?? 2)
        : (calibration?.lagWordsBase ?? 1);

    // Ramp in lag: no lag at the very beginning, then partial, then full
    let effectiveLag = baseLag;
    if (progress < 0.15) {
      effectiveLag = 0;
    } else if (progress < 0.3) {
      effectiveLag = Math.max(0, baseLag - 1);
    }

    const targetIdx = Math.max(0, idx - effectiveLag);
    // Prevent highlight from going backwards to avoid jumpy behavior
    const last =
      typeof currentIdx === "number" && currentIdx >= 0 ? currentIdx : 0;
    return Math.max(last, targetIdx);
  }, [progress, wordWeights, words.length, calibration]);

  return (
    <WarshWordText
      words={words}
      highlightIdx={currentIdx >= 0 ? currentIdx : undefined}
      tajweedColors={tajweedColors}
    />
  );
}

/**
 * SmartAyahRenderer – orchestrates all ayah rendering paths.
 */
const SmartAyahRenderer = React.memo(function SmartAyahRenderer({
  ayah,
  showTajwid,
  isPlaying,
  surahNum,
  calibration,
  riwaya,
}) {
  const isFirstAyah =
    ayah.numberInSurah === 1 && surahNum !== 1 && surahNum !== 9;
  const effectiveRiwaya = ayah.warshWords ? "warsh" : riwaya || "hafs";

  const tajweedColors = useMemo(() => {
    if (!showTajwid) return null;
    const sourceText = ayah.hafsText || (ayah.warshWords ? null : ayah.text);
    if (!sourceText) return null;
    const cleanText = stripBasmala(sourceText, surahNum, ayah.numberInSurah);
    return getPerWordTajweedColors(cleanText, effectiveRiwaya);
  }, [
    showTajwid,
    ayah.hafsText,
    ayah.text,
    ayah.warshWords,
    surahNum,
    ayah.numberInSurah,
    effectiveRiwaya,
  ]);

  const cleanHafsText = useMemo(() => {
    if (!ayah.hafsText) return null;
    return stripBasmala(ayah.hafsText, surahNum, ayah.numberInSurah);
  }, [ayah.hafsText, surahNum, ayah.numberInSurah]);

  if (ayah.warshWords && ayah.warshWords.length > 0) {
    if (isPlaying) {
      return (
        <KaraokeWarshText
          words={ayah.warshWords}
          hafsText={cleanHafsText}
          isFirstAyah={isFirstAyah}
          calibration={calibration}
          tajweedColors={tajweedColors}
        />
      );
    }
    return (
      <WarshWordText words={ayah.warshWords} tajweedColors={tajweedColors} />
    );
  }

  if (ayah.requestedRiwaya === "warsh") {
    return (
      <span className="warsh-missing-text">
        ⚠︎ Warsh text unavailable for this ayah
      </span>
    );
  }

  const text = stripBasmala(ayah.text, surahNum, ayah.numberInSurah);
  const hafsCalibration =
    calibration ||
    buildKaraokeCalibration({
      reciterId: undefined,
      riwaya: effectiveRiwaya,
      isFirstAyah,
      wordCount: (text || "").split(/\s+/).filter(Boolean).length,
    });

  return (
    <AyahTextRenderer
      text={text}
      showTajwid={showTajwid}
      isPlaying={isPlaying}
      isFirstAyah={isFirstAyah}
      calibration={hafsCalibration}
      riwaya={effectiveRiwaya}
    />
  );
});

export default SmartAyahRenderer;
