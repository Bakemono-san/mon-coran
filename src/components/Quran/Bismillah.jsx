import React from 'react';

/**
 * Bismillah component – renders the opening ornament.
 */
const Bismillah = React.memo(function Bismillah() {
    return (
        <div className="bismillah">
            <span className="bismillah-text">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</span>
        </div>
    );
});

export default Bismillah;
