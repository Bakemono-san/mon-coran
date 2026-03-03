import React from 'react';
import { getSurah } from '../../data/surahs';
import { t } from '../../i18n';

/**
 * SurahHeader component – renders the decorative header for each surah.
 */
const SurahHeader = React.memo(function SurahHeader({ surahNum, lang }) {
    const s = getSurah(surahNum);
    if (!s) return null;

    return (
        <div className="surah-header">
            <div className="surah-header-frame">
                <div className="surah-header-inner">
                    <span className="surah-header-name">{s.ar}</span>
                    <span className="surah-header-info">
                        {lang === 'fr' ? s.fr : lang === 'en' ? s.en : ''}{' '}
                        · {s.ayahs} {t('quran.ayah', lang)}
                        · {s.type === 'Meccan'
                            ? t('quran.meccan', lang)
                            : t('quran.medinan', lang)
                        }
                    </span>
                </div>
            </div>
        </div>
    );
});

export default SurahHeader;
