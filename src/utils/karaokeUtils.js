import { getReciter } from '../data/reciters';

const KARAOKE_DEFAULTS = {
    hafs: { lagTuning: 0.9, extraLagSec: 0.14, lagWordsBase: 1, lagWordsLong: 2, smoothing: 0.24 },
    warsh: { lagTuning: 0.86, extraLagSec: 0.3, lagWordsBase: 2, lagWordsLong: 3, smoothing: 0.22 },
};

const KARAOKE_STYLE_PRESETS = {
    hafs: {
        murattal: { lagTuning: 0.89, extraLagSec: 0.16, lagWordsBase: 2, lagWordsLong: 3, smoothing: 0.23 },
        tartil: { lagTuning: 0.87, extraLagSec: 0.22, lagWordsBase: 2, lagWordsLong: 3, smoothing: 0.21 },
        mujawwad: { lagTuning: 0.85, extraLagSec: 0.28, lagWordsBase: 2, lagWordsLong: 4, smoothing: 0.2 },
    },
    warsh: {
        murattal: { lagTuning: 0.85, extraLagSec: 0.32, lagWordsBase: 2, lagWordsLong: 4, smoothing: 0.21 },
        tartil: { lagTuning: 0.84, extraLagSec: 0.36, lagWordsBase: 3, lagWordsLong: 4, smoothing: 0.2 },
        mujawwad: { lagTuning: 0.83, extraLagSec: 0.4, lagWordsBase: 3, lagWordsLong: 5, smoothing: 0.19 },
    },
};

const KARAOKE_RECITER_OVERRIDES = {
    hafs: {
        'ar.alafasy': { lagTuning: 0.88, extraLagSec: 0.18, lagWordsBase: 2, lagWordsLong: 3, smoothing: 0.22 },
        'ar.husary': { lagTuning: 0.92, extraLagSec: 0.1, lagWordsBase: 1, lagWordsLong: 2, smoothing: 0.26 },
        'ar.minshawi': { lagTuning: 0.89, extraLagSec: 0.16, lagWordsBase: 2, lagWordsLong: 3, smoothing: 0.22 },
        'ar.abdulbasitmurattal': { lagTuning: 0.87, extraLagSec: 0.2, lagWordsBase: 2, lagWordsLong: 3, smoothing: 0.2 },
        'ar.abdulbasitmujawwad': { lagTuning: 0.84, extraLagSec: 0.32, lagWordsBase: 3, lagWordsLong: 5, smoothing: 0.19 },
    },
    warsh: {
        'warsh_abdulbasit': { lagTuning: 0.84, extraLagSec: 0.34, lagWordsBase: 2, lagWordsLong: 4, smoothing: 0.2 },
        'warsh_ibrahim_aldosari': { lagTuning: 0.86, extraLagSec: 0.3, lagWordsBase: 2, lagWordsLong: 3, smoothing: 0.22 },
        'warsh_yassin': { lagTuning: 0.88, extraLagSec: 0.24, lagWordsBase: 2, lagWordsLong: 3, smoothing: 0.24 },
    },
};

export function getKaraokeCalibration(reciterId, riwaya = 'hafs') {
    const family = riwaya === 'warsh' ? 'warsh' : 'hafs';
    const defaults = KARAOKE_DEFAULTS[family] || KARAOKE_DEFAULTS.hafs;
    const reciter = reciterId ? getReciter(reciterId, family) : null;
    const stylePreset = reciter?.style ? (KARAOKE_STYLE_PRESETS[family]?.[reciter.style] || {}) : {};
    const cdnPreset = reciter?.cdnType === 'everyayah'
        ? { lagTuning: -0.02, extraLagSec: 0.08, lagWordsBase: 1, lagWordsLong: 1, smoothing: -0.02 }
        : {};
    const override = reciterId ? (KARAOKE_RECITER_OVERRIDES[family]?.[reciterId] || {}) : {};

    return {
        ...defaults,
        ...stylePreset,
        ...override,
        lagTuning: (override.lagTuning ?? stylePreset.lagTuning ?? defaults.lagTuning) + (cdnPreset.lagTuning || 0),
        extraLagSec: (override.extraLagSec ?? stylePreset.extraLagSec ?? defaults.extraLagSec) + (cdnPreset.extraLagSec || 0),
        lagWordsBase: (override.lagWordsBase ?? stylePreset.lagWordsBase ?? defaults.lagWordsBase) + (cdnPreset.lagWordsBase || 0),
        lagWordsLong: (override.lagWordsLong ?? stylePreset.lagWordsLong ?? defaults.lagWordsLong) + (cdnPreset.lagWordsLong || 0),
        smoothing: (override.smoothing ?? stylePreset.smoothing ?? defaults.smoothing) + (cdnPreset.smoothing || 0),
    };
}
