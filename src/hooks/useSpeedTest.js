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
    const [finalUploadSpeed, setFinalUploadSpeed] = useState(null);
    const [ping, setPing] = useState(null);
    const [progress, setProgress] = useState(0);
    const [speedHistory, setSpeedHistory] = useState([]);
    const abortControllerRef = useRef(null);

    const testPing = async () => {
        setStatus('testing_ping');
        const pings = [];
        // Perform 5 pings
        for (let i = 0; i < 5; i++) {
            if (abortControllerRef.current?.signal.aborted) return;
            try {
                const startTime = performance.now();
                // Use GET with small byte count. HEAD is often blocked by CORS on these public endpoints.
                await fetch('https://speed.cloudflare.com/__down?bytes=1', {
                    method: 'GET',
                    cache: 'no-store',
                    signal: abortControllerRef.current?.signal, // Support abort during ping
                });
                const endTime = performance.now();
                pings.push(endTime - startTime);
            } catch (e) {
                if (e.name !== 'AbortError') {
                    console.error('Ping failed', e);
                }
            }
        }

        if (pings.length > 0) {
            const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length;
            console.log('Pings:', pings, 'Average:', avgPing);
            setPing(Math.round(avgPing));
        }
    };

    const testDownloadSpeed = useCallback(async () => {
        setStatus('testing_download');
        setCurrentSpeed(0);
        setFinalSpeed(null);
        setFinalUploadSpeed(null);
        setProgress(0);
        setSpeedHistory([]);

        const TEST_DURATION = 10000; // 10 seconds
        const startTime = performance.now();
        let receivedBytes = 0;
        let lastReportTime = startTime;
        let lastReportBytes = 0;

        // Circular buffer for smoothing speed (last 5 measurements)
        const recentSpeeds = [];
        const SMOOTHING_FACTOR = 5;

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            // We'll keep fetching huge files until time runs out
            while (performance.now() - startTime < TEST_DURATION) {
                if (signal.aborted) break;

                // Use a large file to ensure we can sustain download
                const response = await fetch('https://speed.cloudflare.com/__down?bytes=50000000', { // 50MB
                    method: 'GET',
                    cache: 'no-store',
                    signal: signal,
                });

                if (!response.ok) continue;

                const reader = response.body.getReader();

                while (true) {
                    if (signal.aborted) break;

                    const { done, value } = await reader.read();
                    if (done) break;

                    receivedBytes += value.length;

                    const currentTime = performance.now();
                    const elapsedTime = currentTime - startTime;
                    const timeSinceLastReport = currentTime - lastReportTime;

                    // Update every ~100ms for smooth graph
                    if (timeSinceLastReport >= 100) {
                        // Calculate instantaneous speed over the last interval
                        const bytesInInterval = receivedBytes - lastReportBytes;
                        const instantSpeedMbps = (bytesInInterval * 8) / (timeSinceLastReport * 1000); // Mbps

                        // Smooth the speed
                        recentSpeeds.push(instantSpeedMbps);
                        if (recentSpeeds.length > SMOOTHING_FACTOR) {
                            recentSpeeds.shift();
                        }
                        const smoothedSpeed = recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length;

                        setCurrentSpeed(smoothedSpeed);

                        // Add point to graph history
                        setSpeedHistory(prev => [
                            ...prev,
                            { time: parseFloat((elapsedTime / 1000).toFixed(1)), speed: smoothedSpeed }
                        ]);

                        // Update progress
                        setProgress(Math.min((elapsedTime / TEST_DURATION) * 100, 100));

                        lastReportTime = currentTime;
                        lastReportBytes = receivedBytes;
                    }

                    if (elapsedTime >= TEST_DURATION) break;
                }
                reader.cancel(); // Cancel current download if time is up or loop continues
            }

            if (!signal.aborted) {
                // Calculate final average speed for the entire session
                const totalDurationSeconds = (performance.now() - startTime) / 1000;
                const finalAvgSpeed = (receivedBytes * 8) / (totalDurationSeconds * 1000000); // Mbps

                setFinalSpeed(finalAvgSpeed);
                setCurrentSpeed(finalAvgSpeed);
                setProgress(100);
                // setStatus('completed'); // Moved to upload test
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Test aborted');
                setStatus('idle');
            } else {
                console.error('Download test error:', error);
                setStatus('idle');
            }
        }
    }, []);

    const testUploadSpeed = useCallback(async () => {
        setStatus('testing_upload');
        setCurrentSpeed(0);
        setProgress(0);
        setSpeedHistory([]);

        const TEST_DURATION = 10000; // 10 seconds
        const startTime = performance.now();
        let uploadedBytes = 0;
        let lastReportTime = startTime;
        let lastReportBytes = 0;

        // Circular buffer for smoothing speed (last 5 measurements)
        const recentSpeeds = [];
        const SMOOTHING_FACTOR = 5;

        // Use smaller chunk (approx 200KB) for better granularity in 'no-cors' mode
        // since we can't track progress within a single fetch.
        const chunkSize = 200 * 1024;
        const chunk = new Uint8Array(chunkSize);
        for (let i = 0; i < chunk.length; i++) chunk[i] = Math.random() * 255;
        // text/plain is safe for 'no-cors' simple requests
        const blob = new Blob([chunk], { type: 'text/plain' });

        const signal = abortControllerRef.current?.signal;

        try {
            while (performance.now() - startTime < TEST_DURATION) {
                if (signal?.aborted) break;

                // Use no-cors to bypass CORS restrictions
                await fetch('https://speed.cloudflare.com/__up', {
                    method: 'POST',
                    body: blob,
                    mode: 'no-cors',
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    signal: signal,
                });

                uploadedBytes += blob.size;

                const currentTime = performance.now();
                const elapsedTime = currentTime - startTime;
                const timeSinceLastReport = currentTime - lastReportTime;

                // Update every ~100ms
                if (timeSinceLastReport >= 100) {
                    const bytesInInterval = uploadedBytes - lastReportBytes;
                    const instantSpeedMbps = (bytesInInterval * 8) / (timeSinceLastReport * 1000); // Mbps

                    // Smooth the speed
                    recentSpeeds.push(instantSpeedMbps);
                    if (recentSpeeds.length > SMOOTHING_FACTOR) {
                        recentSpeeds.shift();
                    }
                    const smoothedSpeed = recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length;

                    setCurrentSpeed(smoothedSpeed);

                    setSpeedHistory(prev => [
                        ...prev,
                        { time: parseFloat((elapsedTime / 1000).toFixed(1)), speed: smoothedSpeed }
                    ]);

                    setProgress(Math.min((elapsedTime / TEST_DURATION) * 100, 100));

                    lastReportTime = currentTime;
                    lastReportBytes = uploadedBytes;
                }

                if (elapsedTime >= TEST_DURATION) break;
            }

            if (!signal?.aborted) {
                const totalDurationSeconds = (performance.now() - startTime) / 1000;
                const finalAvgSpeed = (uploadedBytes * 8) / (totalDurationSeconds * 1000000); // Mbps

                setFinalUploadSpeed(finalAvgSpeed);
                setCurrentSpeed(finalAvgSpeed);
                setProgress(100);
                setStatus('completed');
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Upload aborted');
                setStatus('idle');
            } else {
                console.error('Upload test error:', error);
                setStatus('idle');
            }
        }
    }, []);

    const startTest = useCallback(async () => {
        abortControllerRef.current = new AbortController(); // Ensure new controller
        setPing(null);
        await testPing();
        if (!abortControllerRef.current?.signal.aborted) {
            await testDownloadSpeed();
            if (!abortControllerRef.current?.signal.aborted) {
                testUploadSpeed();
            }
        }
    }, [testDownloadSpeed, testUploadSpeed]);

    const resetTest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setStatus('idle');
        setCurrentSpeed(0);
        setFinalSpeed(null);
        setPing(null);
        setProgress(0);
        setSpeedHistory([]);
        setFinalUploadSpeed(null);
    }, []);

    return {
        status,
        currentSpeed,
        finalSpeed,
        finalUploadSpeed,
        ping,
        progress,
        speedHistory,
        startTest,
        resetTest,
    };
}
