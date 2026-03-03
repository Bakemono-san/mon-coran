/**
 * Quran Utilities
 */

const BASMALA_CACHE = new Map();
const CACHE_MAX = 800;

const BASMALA_PATTERNS = [
    // Exact match for quran-uthmani API (wasla ٱ, no tatweel before ٰ)
    /^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/,
    // With tatweel before superscript alef
    /^بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ\s*/,
    // Regular alef (no wasla) variants
    /^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\s*/,
    /^بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ\s*/,
    // Simple (no diacritics)
    /^بسم الله الرحمن الرحيم\s*/,
    // Generic letter-by-letter with optional diacritics
    /^[\u200F\u200E\s۝﴿﴾]*ب[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]*\s*س[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]*\s*م[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]*\s*[\u0627\u0671]?[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]*\s*ل[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]*\s*ل[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]*\s*ه[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]*[\s۝﴿﴾]*/,
];

/**
 * Strips the Basmala from the beginning of a verse text.
 */
export function stripBasmala(text, surahNum, ayahNumInSurah) {
    if (ayahNumInSurah !== 1 || surahNum === 1 || surahNum === 9) return text;
    const input = text || '';
    const key = `${surahNum}:${ayahNumInSurah}:${input}`;

    if (BASMALA_CACHE.has(key)) return BASMALA_CACHE.get(key);

    let cleaned = input.replace(/[\u200F\u200E]/g, '');
    for (const pat of BASMALA_PATTERNS) {
        const before = cleaned;
        cleaned = cleaned.replace(pat, '');
        if (cleaned !== before) break;
    }

    if (/^\s*ب/.test(cleaned) && /[\u0627\u0671]لرح/.test(cleaned)) {
        const fallback = cleaned.replace(/^[\s۝﴿﴾]*(?:ب[\s\S]{0,90}?[\u0627\u0671]لرح[^\s]{0,10}يم)[\s۝﴿﴾]*/u, '');
        if (fallback.length > 0 && fallback.length < cleaned.length) {
            cleaned = fallback;
        }
    }

    const result = cleaned.trim();
    if (BASMALA_CACHE.size > CACHE_MAX) BASMALA_CACHE.clear();
    BASMALA_CACHE.set(key, result);
    return result;
}
