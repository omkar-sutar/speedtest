import React from 'react';

export function SpeedGauge({ speed, progress, label }) {
    // SVG circle calculations
    const radius = 140;
    const circumference = 2 * Math.PI * radius;

    // Map progress (0-100) to stroke offset
    const strokeOffset = circumference - (progress / 100) * circumference;

    return (
        <div className="gauge-container">
            <div className="gauge-ring"></div>

            <svg className="gauge-svg" viewBox="0 0 320 320">
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00f5ff" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                </defs>

                {/* Background track */}
                <circle
                    className="gauge-track"
                    cx="160"
                    cy="160"
                    r={radius}
                />

                {/* Progress arc */}
                <circle
                    className="gauge-progress"
                    cx="160"
                    cy="160"
                    r={radius}
                    style={{ strokeDashoffset: strokeOffset }}
                />
            </svg>

            <div className="gauge-content">
                <div className="speed-value">
                    {speed.toFixed(1)}
                </div>
                <div className="speed-unit">Mbps</div>
                <div className="speed-label">{label || 'Download Speed'}</div>
            </div>
        </div>
    );
}
