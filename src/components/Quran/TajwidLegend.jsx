import React from 'react';
import TAJWID_RULES from '../../data/tajwidRules';

/**
 * TajwidLegend — displays a guide for Tajweed color-coding.
 * This is crucial for users to understand the phonetics of recitation.
 */
const TajwidLegend = React.memo(function TajwidLegend({ riwaya = 'hafs' }) {
    // Filter out rules that are less common or duplicate for the legend summary
    const displayRules = TAJWID_RULES.filter(r =>
        ['ghunna', 'qalqala', 'idgham', 'iqlab', 'madd', 'tafkhim', 'lam-shamsiyya'].includes(r.id)
    );

    return (
        <div className="tajwid-legend" aria-label="Tajweed Color Legend">
            <div className="tajwid-legend-grid">
                {displayRules.map(rule => (
                    <div key={rule.id} className="tajwid-legend-item">
                        <span
                            className="tajwid-dot"
                            style={{ backgroundColor: `var(--tajwid-${rule.id})` }}
                        />
                        <span className="tajwid-rule-name">
                            {rule.nameFr}
                            <small className="tajwid-rule-en">({rule.nameEn})</small>
                        </span>
                    </div>
                ))}
            </div>
            <style jsx>{`
                .tajwid-legend {
                    margin-top: 1rem;
                    padding: 0.75rem 1rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: var(--r-md);
                    font-family: var(--font-ui);
                }
                .tajwid-legend-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 0.5rem 1rem;
                }
                .tajwid-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .tajwid-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    box-shadow: 0 0 5px rgba(0,0,0,0.2);
                }
                .tajwid-rule-name {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    white-space: nowrap;
                }
                .tajwid-rule-en {
                    opacity: 0.6;
                    margin-left: 0.25rem;
                    font-weight: 400;
                }
                [data-theme="dark"] .tajwid-legend {
                    background: rgba(0, 0, 0, 0.2);
                }
            `}</style>
        </div>
    );
});

export default TajwidLegend;
