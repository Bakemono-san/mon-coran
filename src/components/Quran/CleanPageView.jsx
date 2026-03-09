import React, { useMemo } from "react";
import { toAr } from "../../data/surahs";
import SmartAyahRenderer from "./SmartAyahRenderer";

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
 * Page separator for long surahs
 */
function PageSeparator() {
  return <div className="clean-page-separator" />;
}

/**
 * CleanPageView - Quran.com-style centered flowing text layout
 * Displays all ayahs with tajweed coloring and page separators
 */
export default function CleanPageView({
  ayahs,
  lang,
  fontSize,
  isQCF4,
  showTajwid,
  currentPlayingAyah,
  surahNum,
  calibration,
  riwaya,
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

  // Group ayahs by page (estimate based on typical page structure)
  // Pages typically have 15-16 ayahs, but we'll use a dynamic approach
  const ayahsByPage = useMemo(() => {
    if (!ayahs || ayahs.length === 0) return [];

    const pages = [];
    let currentPage = [];
    let lineCount = 0;
    const targetLinesPerPage = 15; // Typical page has ~15 lines

    ayahs.forEach((ayah) => {
      // Estimate lines based on text length (rough approximation)
      const estimatedLines = Math.ceil(ayah.text.split(/\s+/).length / 8);

      if (
        lineCount + estimatedLines > targetLinesPerPage &&
        currentPage.length > 0
      ) {
        pages.push([...currentPage]);
        currentPage = [];
        lineCount = 0;
      }

      currentPage.push(ayah);
      lineCount += estimatedLines;
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages;
  }, [ayahs]);

  return (
    <div className="clean-page-container">
      {/* Basmala at the start if needed */}
      {showBasmala && (
        <div className="clean-basmala" style={{ fontSize: `${fontSize}px` }}>
          {basmalaText}
        </div>
      )}

      {/* Render pages with separators */}
      {ayahsByPage.map((pageAyahs, pageIdx) => (
        <div key={`page-${pageIdx}`}>
          <div
            className={`clean-page-text${isQCF4 ? " qcf4-container" : ""}`}
            style={{ fontSize: `${fontSize}px` }}
            dir="rtl"
          >
            {pageAyahs.map((ayah, ayahIdx) => {
              const isPlaying =
                currentPlayingAyah?.ayah === ayah.numberInSurah &&
                currentPlayingAyah?.surah === surahNum;

              return (
                <span
                  key={`ayah-${ayah.number}`}
                  className={`clean-ayah${isPlaying ? " clean-ayah-playing" : ""}`}
                >
                  {/* Render the ayah text with tajweed coloring */}
                  <SmartAyahRenderer
                    ayah={ayah}
                    showTajwid={showTajwid}
                    isPlaying={isPlaying}
                    surahNum={surahNum}
                    calibration={calibration}
                    riwaya={riwaya}
                  />

                  {/* Verse marker after the text */}
                  <VerseMarker num={ayah.numberInSurah} lang={lang} />

                  {/* Space after verse (except last one) */}
                  {ayahIdx < pageAyahs.length - 1 && (
                    <span className="clean-verse-space"> </span>
                  )}
                </span>
              );
            })}
          </div>

          {/* Page separator (except after last page) */}
          {pageIdx < ayahsByPage.length - 1 && <PageSeparator />}
        </div>
      ))}
    </div>
  );
}
