import React from "react";
import { toAr } from "../../data/surahs";
import { t } from "../../i18n";
import { arabicToLatin } from "../../data/transliteration";
import AyahActions from "../AyahActions";
import SmartAyahRenderer from "./SmartAyahRenderer";
import WordByWordDisplay from "./WordByWordDisplay";
import TajwidLegend from "./TajwidLegend";
import MemorizationText from "./MemorizationText";

/**
 * AyahBlock component – renders a single verse with metadata and actions.
 * New layout: Side-by-side Arabic/Translation view
 */
const AyahBlock = React.memo(function AyahBlock({
  ayah,
  isPlaying,
  isActive,
  trans,
  showTajwid,
  showTranslation,
  showWordByWord,
  showTransliteration,
  showWordTranslation,
  surahNum,
  calibration,
  riwaya,
  lang,
  onToggleActive,
  ayahId,
  progress,
  fontSize,
  memMode,
}) {
  // Transliteration logic:
  // 1. If riwaya is Warsh, we must use ayah.hafsText (standard Arabic) instead of ayah.text (PUA codepoints).
  // 2. We decouple it from showTranslation so users can see just phonetic + Arabic.
  const transliterationSource =
    riwaya === "warsh" && ayah.hafsText ? ayah.hafsText : ayah.text;
  const ayahTransliteration =
    showTransliteration && !showWordByWord
      ? arabicToLatin(transliterationSource, riwaya)
      : "";

  return (
    <div
      id={ayahId}
      role="listitem"
      aria-label={`${t("quran.ayah", lang)} ${ayah.numberInSurah}`}
      aria-current={isPlaying ? "true" : undefined}
      className={`qc-ayah-block${isPlaying ? " is-playing" : ""}${isActive ? " is-active" : ""}`}
      onClick={onToggleActive}
      tabIndex={0}
    >
      <div className="qc-ayah-container">
        {/* Verse Number Badge */}
        <div className="qc-ayah-sidebar">
          <span className="qc-ayah-num">{ayah.numberInSurah}</span>
        </div>

        {/* Main Content - Side by Side Layout */}
        <div className="qc-ayah-content-grid">
          {/* Left: Arabic Text */}
          <div className="qc-ayah-arabic-side">
            <div className="qc-ayah-text-ar">
              {memMode ? (
                <MemorizationText
                  text={ayah.hafsText || ayah.text}
                  lang={lang}
                />
              ) : showWordByWord && !(ayah.warshWords?.length > 0) ? (
                <WordByWordDisplay
                  surah={surahNum}
                  ayah={ayah.numberInSurah}
                  text={ayah.text}
                  isPlaying={isPlaying}
                  progress={progress}
                  showTransliteration={showTransliteration}
                  showWordTranslation={showWordTranslation}
                  fontSize={fontSize}
                />
              ) : (
                <SmartAyahRenderer
                  ayah={ayah}
                  showTajwid={showTajwid}
                  isPlaying={isPlaying}
                  surahNum={surahNum}
                  calibration={calibration}
                  riwaya={riwaya}
                />
              )}
            </div>
          </div>

          {/* Right: Translation & Transliteration */}
          {(showTranslation || showTransliteration) && !showWordByWord && (
            <div className="qc-ayah-translation-side">
              {ayahTransliteration && (
                <div className="qc-ayah-transliteration">
                  {ayahTransliteration}
                </div>
              )}
              {showTranslation && trans && (
                <div className="qc-ayah-translation">{trans.text}</div>
              )}
            </div>
          )}
        </div>

        {isActive && (
          <div className="qc-ayah-actions-panel">
            <AyahActions
              surah={surahNum}
              ayah={ayah.numberInSurah}
              ayahData={ayah}
            />
            {showTajwid && riwaya === "hafs" && (
              <TajwidLegend riwaya={riwaya} />
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default AyahBlock;
