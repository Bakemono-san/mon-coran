import React from 'react';
import { parseTajwid } from '../../data/tajwidRules';

/**
 * TajwidText component – renders Arabic text with colored tajwid rules.
 */
const TajwidText = React.memo(function TajwidText({ text, enabled, riwaya }) {
    if (!enabled || !text) return <span>{text}</span>;

    let segments = [];
    try {
        segments = parseTajwid(text, riwaya || 'hafs');
    } catch (err) {
        console.warn('Tajwid parsing failed:', err);
        return <span>{text}</span>;
    }

    if (!Array.isArray(segments) || segments.length === 0) {
        return <span>{text}</span>;
    }

    return (
        <>
            {segments.map((seg, i) =>
                seg.ruleId ? (
                    <span key={i} className={`tajwid tajwid-${seg.ruleId}`}>{seg.text}</span>
                ) : (
                    <span key={i}>{seg.text}</span>
                )
            )}
        </>
    );
});

export default TajwidText;
