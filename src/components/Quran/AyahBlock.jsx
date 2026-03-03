import React from 'react';
import { toAr } from '../../data/surahs';
import { t } from '../../i18n';
import AyahActions from '../AyahActions';
import SmartAyahRenderer from './SmartAyahRenderer';

/**
 * AyahBlock component – renders a single verse with metadata and actions.
 */
const AyahBlock = React.memo(function AyahBlock({
    ayah, isPlaying, isActive, trans, showTajwid, showTranslation,
    surahNum, calibration, riwaya, lang, onToggleActive, ayahId,
}) {
    return (
        <div
            id={ayahId}
            role="listitem"
            aria-label={`${t('quran.ayah', lang)} ${ayah.numberInSurah}`}
            aria-current={isPlaying ? 'true' : undefined}
            className={`ayah-block${isPlaying ? ' playing' : ''}${isActive ? ' active' : ''}`}
            onClick={onToggleActive}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleActive();
                }
            }}
        >
            <div className="ayah-text-ar">
                <SmartAyahRenderer
                    ayah={ayah}
                    showTajwid={showTajwid}
                    isPlaying={isPlaying}
                    surahNum={surahNum}
                    calibration={calibration}
                    riwaya={riwaya}
                />
                <span className="ayah-number">
                    ﴿{lang === 'ar' ? toAr(ayah.numberInSurah) : ayah.numberInSurah}﴾
                </span>
            </div>
            {showTranslation && trans && (
                <div className="ayah-translation">{trans.text}</div>
            )}
            {ayah.juz && (
                <span className="ayah-juz-badge">{t('sidebar.juz', lang)} {ayah.juz}</span>
            )}
            {isActive && (
                <AyahActions surah={surahNum} ayah={ayah.numberInSurah} ayahData={ayah} />
            )}
        </div>
    );
});

export default AyahBlock;
