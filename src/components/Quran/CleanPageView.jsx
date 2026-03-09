import React, { useMemo } from "react";
import { toAr } from "../../data/surahs";

/**
 * Circular verse marker badge (like quran.com)
 */
function VerseMarker({ num, lang }) {
  const display = lang === "ar" ? toAr(num) : num;
  return (
    <span className="clean-verse-marker" aria-label={`Verse ${num}`}>
      <svg
        className="clean-verse-marker-svg"
        viewBox="0 0 36 36"
        width="1em"
        height="1em"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <circle
          cx="18"
          cy="18"
          r="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>
      <span className="clean-verse-num">{display}</span>
    </span>
  );
}

/**
 * CleanPageView - Quran.com-style centered flowing text layout
 * Pure, minimal design with inline verse markers
 */
export default function CleanPageView({
  ayahs,
  lang,
  fontSize,
  isQCF4,
  showTajwid,
  currentPlayingAyah,
  surahNum,
}) {
  // Check if we should show basmala
  const showBasmala = useMemo(() => {
    return (
      surahNum !== 1 &&
      surahNum !== 9 &&
      ayahs.length > 0 &&
      ayahs[0].numberInSurah === 1
    );
  }, [surahNum, ayahs]);

  const basmalaText = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

  // Group words by their text representation for rendering
  const renderContent = useMemo(() => {
    const elements = [];

    // Add basmala if needed
    if (showBasmala) {
      elements.push(
        <div key="basmala" className="clean-basmala">
          {basmalaText}
        </div>
      );
    }

    // For each ayah, render its text with verse marker at the end
    ayahs.forEach((ayah, idx) => {
      const isPlaying =
        currentPlayingAyah?.ayah === ayah.numberInSurah &&
        currentPlayingAyah?.surah === surahNum;

      // Handle Warsh QCF4 words
      if (ayah.warshWords && ayah.warshWords.length > 0) {
        ayah.warshWords.forEach((wordObj, wordIdx) => {
          const isLastWord = wordIdx === ayah.warshWords.length - 1;
          elements.push(
            <span
              key={`${ayah.number}-word-${wordIdx}`}
              className={`clean-word warsh-qcf4-word${isPlaying ? " playing" : ""}`}
              style={{ fontFamily: "QCF_HAFS" }}
            >
              {wordObj.code ? String.fromCodePoint(wordObj.code) : wordObj.text}
              {!isLastWord && " "}
            </span>
          );
        });
      } else {
        // Regular Hafs text - split by spaces
        const words = ayah.text.split(/\s+/);
        words.forEach((word, wordIdx) => {
          const isLastWord = wordIdx === words.length - 1;
          elements.push(
            <span
              key={`${ayah.number}-word-${wordIdx}`}
              className={`clean-word${isPlaying ? " playing" : ""}`}
            >
              {word}
              {!isLastWord && " "}
            </span>
          );
        });
      }

      // Add verse marker after the ayah text
      elements.push(
        <VerseMarker
          key={`marker-${ayah.number}`}
          num={ayah.numberInSurah}
          lang={lang}
        />
      );

      // Add space between verses (except last one)
      if (idx < ayahs.length - 1) {
        elements.push(
          <span key={`space-${ayah.number}`} className="clean-verse-space">
            {" "}
          </span>
        );
      }
    });

    return elements;
  }, [ayahs, showBasmala, lang, currentPlayingAyah, surahNum]);

  return (
    <div className="clean-page-container">
      <div
        className={`clean-page-text${isQCF4 ? " qcf4-container" : ""}`}
        style={{ fontSize: `${fontSize}px` }}
        dir="rtl"
      >
        {renderContent}
      </div>
    </div>
  );
}
