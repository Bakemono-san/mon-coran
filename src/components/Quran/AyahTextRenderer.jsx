import React, { useMemo } from "react";
import { useKaraoke, buildKaraokeCalibration } from "../../hooks/useKaraoke";
import WordByWordText from "./WordByWordText";
import TajwidText from "./TajwidText";

/**
 * KaraokeAyahText component – manages its own RAF for 60fps highlighting,
 * using the simplified calibration helper.
 */
export const KaraokeAyahText = React.memo(function KaraokeAyahText({
  text,
  isFirstAyah,
  riwaya,
  reciterId,
}) {
  const wordCount = useMemo(
    () => (text ? text.split(/\s+/).filter(Boolean).length : 0),
    [text],
  );

  const calibration = buildKaraokeCalibration({
    reciterId,
    riwaya,
    isFirstAyah,
    wordCount,
  });

  const progress = useKaraoke({ isFirstAyah, wordCount, calibration });

  const baseLagWords = wordCount >= 24 ? 2 : wordCount >= 12 ? 1 : 1;

  // LagWords kept simple and constant; no ramping logic to avoid jumps
  const effectiveLagWords = baseLagWords;

  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <WordByWordText
      text={text}
      progress={clampedProgress}
      lagWords={effectiveLagWords}
    />
  );
});

/**
 * AyahTextRenderer – switches between karaoke and tajwid based on state.
 */
export function AyahTextRenderer({
  text,
  showTajwid,
  isPlaying,
  isFirstAyah,
  calibration, // kept for backward compatibility but not used in karaoke path
  riwaya,
  reciterId,
}) {
  if (isPlaying) {
    return (
      <KaraokeAyahText
        text={text}
        isFirstAyah={isFirstAyah}
        riwaya={riwaya}
        reciterId={reciterId}
      />
    );
  }
  return <TajwidText text={text} enabled={showTajwid} riwaya={riwaya} />;
}
