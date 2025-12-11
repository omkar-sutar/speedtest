import React from 'react';
import { SpeedGauge } from './components/SpeedGauge';
import { GoButton } from './components/GoButton';
import { ResultCard } from './components/ResultCard';
import { SpeedGraph } from './components/SpeedGraph';
import { useSpeedTest } from './hooks/useSpeedTest';

function App() {
  const {
    status,
    currentSpeed,
    finalSpeed,
    ping,
    progress,
    speedHistory,
    startTest,
    resetTest,
  } = useSpeedTest();

  const getStatusText = () => {
    switch (status) {
      case 'testing_ping':
        return 'Measuring latency...';
      case 'testing_download':
        return 'Testing download speed...';
      case 'completed':
        return 'Test completed!';
      default:
        return 'Click GO to start';
    }
  };

  return (
    <div className="app-container">
      {/* Animated background orbs */}
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      <div className="bg-orb bg-orb-3"></div>

      <main className="main-content">
        <h1 className="app-title">Speed Test</h1>

        <SpeedGauge speed={currentSpeed} progress={progress} />

        <p className="status-text">{getStatusText()}</p>

        <GoButton
          status={status}
          onStart={startTest}
          onReset={resetTest}
        />

        <ResultCard
          finalSpeed={finalSpeed}
          ping={ping}
          visible={status === 'completed'}
        />

        {/* Show graph when testing or completed */}
        {(status === 'testing_download' || status === 'completed') && (
          <SpeedGraph data={speedHistory} />
        )}
      </main>
    </div>
  );
}

export default App;
