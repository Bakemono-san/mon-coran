import { getReciter } from '../data/reciters';

/**
 * Unified karaoke calibration format:
 *   offsetSec     – time to add to currentTime before computing progress
 *                   negative = text appears slightly AFTER audio (lag)
 *                   positive = text appears slightly BEFORE audio (lead)
 *   smoothing     – 0‑1 exponential smoothing (lower = snappier, higher = smoother)
 *   lagWordsBase  – word-index lag for short ayahs (< 24 words)
 *   lagWordsLong  – word-index lag for long ayahs  (≥ 24 words)
 *
 * Typical values:
 *   – Murattal (normal speed): offsetSec -0.30 to -0.40
 *   – Tartil   (slower)      : offsetSec -0.40 to -0.55
 *   – Mujawwad (very slow)   : offsetSec -0.55 to -0.70
 */
/**
 * lagWordsBase / lagWordsLong = 0 means we rely purely on offsetSec for timing.
 * Set to 1 only if you observe the highlight still running 1 word ahead of speech.
 */
// Calibration v4 — anticipatory offsets for zero-perceived-lag word highlighting.
// offsetSec: positive = highlight appears BEFORE the word is spoken (anticipatory).
//            negative = highlight appears AFTER the word starts (lag feeling).
// smoothing: close to 1.0 = very snappy & responsive (recommended 0.82–0.94).
//
// Rationale: HTML5 Audio currentTime reports the decoded position, which can trail
// the actual speaker output by 50–150 ms depending on the browser and CDN.
// A positive offsetSec compensates for both that pipeline delay and the inherent
// proportional-weight approximation in the timing model.
const KARAOKE_DEFAULTS = {
    hafs:  { offsetSec: 0.15, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.88 },
    warsh: { offsetSec: 0.18, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.90 },
};

const KARAOKE_STYLE_PRESETS = {
    hafs: {
        // Murattal: brisk pace — moderate lead to anticipate word transitions.
        murattal: { offsetSec: 0.15, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.88 },
        // Tartil: slower — slightly more lead because words last longer.
        tartil:   { offsetSec: 0.22, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.85 },
        // Mujawwad: very slow, drawn-out — biggest lead needed.
        mujawwad: { offsetSec: 0.30, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.82 },
    },
    warsh: {
        murattal: { offsetSec: 0.18, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.90 },
        tartil:   { offsetSec: 0.25, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.87 },
        mujawwad: { offsetSec: 0.32, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.84 },
    },
};

// Per-reciter fine-tuning.  Overrides win over style presets + auto-calibration.
// islamic.network CDN is generally faster to buffer → slightly lower offset.
// everyayah.com CDN can have higher first-packet delay → +0.03 s extra.
const KARAOKE_RECITER_OVERRIDES = {
    hafs: {
        // ── islamic.network CDN ────────────────────────────────────────────────
        'ar.alafasy':            { offsetSec: 0.14, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.90 },
        'ar.husary':             { offsetSec: 0.12, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.88 },
        'ar.minshawi':           { offsetSec: 0.14, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.86 },
        'ar.minshawimujawwad':   { offsetSec: 0.30, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.82 },
        'ar.abdulbasitmurattal': { offsetSec: 0.14, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.86 },
        'ar.abdulbasitmujawwad': { offsetSec: 0.32, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.80 },
        'ar.abdurrahmaansudais': { offsetSec: 0.14, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.89 },
        'ar.saoodshuraym':       { offsetSec: 0.14, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.88 },
        // ── everyayah.com CDN (+0.03 s for CDN first-packet) ──────────────────
        'abdullaah_matrood':     { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.88 },
        'abdullaah_basfar':      { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.88 },
        'abdulsamad':            { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.86 },
        'ar.maaboralmeem':       { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.87 },
        'ahmed_ajmy':            { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.88 },
        'maher_almuaiqly':       { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.90 },
        'abdulbari_thubayti':    { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.87 },
        'ali_jabir':             { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.87 },
        'hudhaify':              { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.87 },
        'muhammad_ayyoub':       { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.88 },
        // Tablawi is notably slower (almost tartil) → more anticipation
        'muhammad_tablawi':      { offsetSec: 0.24, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.84 },
        'hani_rifai':            { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.88 },
        'fares_abbad':           { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.87 },
        'yasser_dossari_hafs':   { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.90 },
        'nasser_alqatami':       { offsetSec: 0.17, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.90 },
    },
    warsh: {
        'warsh_abdulbasit':        { offsetSec: 0.20, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.88 },
        'warsh_ibrahim_aldosari':  { offsetSec: 0.20, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.88 },
        'warsh_yassin':            { offsetSec: 0.22, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.90 },
    },
};

function getAutoReciterCalibration(reciter, family, baseline) {
    if (!reciter) return {};

    const reciterId = String(reciter.id || '').toLowerCase();
    const cdnType = String(reciter.cdnType || '').toLowerCase();

    // everyayah.com CDN commonly has a slightly higher first-packet delay.
    const cdnBias = cdnType === 'everyayah' ? 0.03 : 0.0;

    let offsetSec = (baseline.offsetSec ?? 0.15) + cdnBias;
    let smoothing = baseline.smoothing ?? 0.88;

    // Tablawi recites in a very slow tartil style — needs extra lead
    if (/tablawi/.test(reciterId)) {
        offsetSec += 0.08;
        smoothing = Math.max(0.80, smoothing - 0.04);
    }

    return {
        offsetSec: Number(offsetSec.toFixed(3)),
        smoothing: Number(Math.max(0.78, Math.min(0.96, smoothing)).toFixed(2)),
        lagWordsBase: 0,
        lagWordsLong: 0,
    };
}

export function getKaraokeCalibration(reciterId, riwaya = 'hafs') {
    const family = riwaya === 'warsh' ? 'warsh' : 'hafs';
    const defaults = KARAOKE_DEFAULTS[family] || KARAOKE_DEFAULTS.hafs;
    const reciter = reciterId ? getReciter(reciterId, family) : null;
    const stylePreset = reciter?.style
        ? (KARAOKE_STYLE_PRESETS[family]?.[reciter.style] || {})
        : {};
    const baseline = {
        offsetSec: stylePreset.offsetSec ?? defaults.offsetSec,
        smoothing: stylePreset.smoothing ?? defaults.smoothing,
        lagWordsBase: stylePreset.lagWordsBase ?? defaults.lagWordsBase,
        lagWordsLong: stylePreset.lagWordsLong ?? defaults.lagWordsLong,
    };
    const autoCalibration = getAutoReciterCalibration(reciter, family, baseline);
    const override = reciterId
        ? (KARAOKE_RECITER_OVERRIDES[family]?.[reciterId] || {})
        : {};

    return {
        offsetSec: override.offsetSec ?? autoCalibration.offsetSec ?? baseline.offsetSec,
        smoothing: override.smoothing ?? autoCalibration.smoothing ?? baseline.smoothing,
        lagWordsBase: override.lagWordsBase ?? autoCalibration.lagWordsBase ?? baseline.lagWordsBase,
        lagWordsLong: override.lagWordsLong ?? autoCalibration.lagWordsLong ?? baseline.lagWordsLong,
    };
}
