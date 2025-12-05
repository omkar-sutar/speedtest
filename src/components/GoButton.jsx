import React from 'react';

export function GoButton({ status, onStart, onReset }) {
    const isTesting = status === 'testing';
    const isCompleted = status === 'completed';

    const handleClick = () => {
        if (isCompleted) {
            onReset();
            // Small delay before starting new test
            setTimeout(onStart, 100);
        } else if (!isTesting) {
            onStart();
        }
    };

    const getButtonText = () => {
        if (isTesting) return '•••';
        if (isCompleted) return 'GO';
        return 'GO';
    };

    return (
        <button
            className={`go-button ${isTesting ? 'testing' : ''}`}
            onClick={handleClick}
            disabled={isTesting}
        >
            {getButtonText()}
        </button>
    );
}
