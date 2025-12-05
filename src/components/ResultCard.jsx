import React from 'react';

export function ResultCard({ finalSpeed, ping, visible }) {
    return (
        <div className={`result-card ${visible ? 'visible' : ''}`}>
            <div className="result-group">
                <div className="result-label">Ping</div>
                <div className="result-value small">
                    {ping !== null ? ping : '—'}
                    <span className="result-unit">ms</span>
                </div>
            </div>
            <div className="result-divider"></div>
            <div className="result-group">
                <div className="result-label">Download</div>
                <div className="result-value">
                    {finalSpeed !== null ? finalSpeed.toFixed(2) : '—'}
                    <span className="result-unit">Mbps</span>
                </div>
            </div>
        </div>
    );
}
