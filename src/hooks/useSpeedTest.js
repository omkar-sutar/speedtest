import { useState, useCallback, useRef } from 'react';

// Test files of various sizes from public CDNs
const TEST_FILES = [
    {
        url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg',
        size: 16777216, // ~16MB
    },
    {
        url: 'https://speed.cloudflare.com/__down?bytes=10000000',
        size: 10000000, // 10MB from Cloudflare
    },
    {
        url: 'https://speed.cloudflare.com/__down?bytes=25000000',
        size: 25000000, // 25MB from Cloudflare
    },
];

export function useSpeedTest() {
    const [status, setStatus] = useState('idle'); // idle, testing_ping, testing_download, completed
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [finalSpeed, setFinalSpeed] = useState(null);
    const [ping, setPing] = useState(null);
    const [progress, setProgress] = useState(0);
    const abortControllerRef = useRef(null);

    const testPing = async () => {
        setStatus('testing_ping');
        const pings = [];
        // Perform 5 pings
        for (let i = 0; i < 5; i++) {
            try {
                const startTime = performance.now();
                // Use GET with small byte count. HEAD is often blocked by CORS on these public endpoints.
                await fetch('https://speed.cloudflare.com/__down?bytes=1', {
                    method: 'GET',
                    cache: 'no-store',
                });
                const endTime = performance.now();
                pings.push(endTime - startTime);
            } catch (e) {
                console.error('Ping failed', e);
            }
        }

        if (pings.length > 0) {
            const minPing = Math.min(...pings);
            setPing(Math.round(minPing));
        }
    };

    const testDownloadSpeed = useCallback(async () => {
        setStatus('testing_download');
        setCurrentSpeed(0);
        setFinalSpeed(null);
        setProgress(0);

        const speeds = [];
        const totalTests = TEST_FILES.length;

        for (let i = 0; i < totalTests; i++) {
            const testFile = TEST_FILES[i];
            abortControllerRef.current = new AbortController();

            try {
                const startTime = performance.now();

                const response = await fetch(testFile.url + `?cache_bust=${Date.now()}`, {
                    method: 'GET',
                    cache: 'no-store',
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    console.warn(`Test file ${i} failed, skipping...`);
                    continue;
                }

                const reader = response.body.getReader();
                let receivedBytes = 0;
                const chunks = [];

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    chunks.push(value);
                    receivedBytes += value.length;

                    // Calculate real-time speed
                    const elapsedTime = (performance.now() - startTime) / 1000; // seconds
                    if (elapsedTime > 0) {
                        const speedMbps = (receivedBytes * 8) / (elapsedTime * 1000000); // Mbps
                        setCurrentSpeed(speedMbps);

                        // Update progress
                        const testProgress = (i / totalTests) + (receivedBytes / testFile.size) / totalTests;
                        setProgress(Math.min(testProgress * 100, 100));
                    }
                }

                const endTime = performance.now();
                const durationSeconds = (endTime - startTime) / 1000;
                const speedMbps = (receivedBytes * 8) / (durationSeconds * 1000000);
                speeds.push(speedMbps);

            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Test aborted');
                    setStatus('idle');
                    return;
                }
                console.error('Download test error:', error);
            }
        }

        // Calculate average speed (excluding outliers)
        if (speeds.length > 0) {
            speeds.sort((a, b) => a - b);
            // Use median for more accurate result
            const median = speeds[Math.floor(speeds.length / 2)];
            setFinalSpeed(median);
            setCurrentSpeed(median);
        }

        setProgress(100);
        setStatus('completed');
    }, []);

    const startTest = useCallback(async () => {
        setPing(null);
        await testPing();
        testDownloadSpeed();
    }, [testDownloadSpeed]);

    const resetTest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setStatus('idle');
        setCurrentSpeed(0);
        setFinalSpeed(null);
        setPing(null);
        setProgress(0);
    }, []);

    return {
        status,
        currentSpeed,
        finalSpeed,
        ping,
        progress,
        startTest,
        resetTest,
    };
}
