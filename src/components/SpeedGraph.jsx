import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export function SpeedGraph({ data }) {
    const chartData = useMemo(() => {
        return {
            labels: data.map((d) => d.time),
            datasets: [
                {
                    label: 'Download Speed',
                    data: data.map((d) => d.speed),
                    borderColor: 'rgb(0, 245, 255)', // Cyan color matching the gauge start
                    backgroundColor: 'rgba(0, 245, 255, 0.2)',
                    tension: 0.4, // Smooth curve
                    pointRadius: 0, // Continuous look
                    borderWidth: 2,
                    fill: true,
                },
            ],
        };
    }, [data]);

    const options = {
        responsive: true,
        animation: {
            duration: 0, // Turn off general animation for performance
        },
        scales: {
            x: {
                type: 'linear',
                display: true,
                title: {
                    display: true,
                    text: 'Time (s)',
                    color: '#888',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: '#888',
                },
                min: 0,
                max: 10, // Fixed 10s window as per requirement
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Speed (Mbps)',
                    color: '#888',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: '#888',
                },
                beginAtZero: true,
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="speed-graph-container" style={{ height: '300px', width: '100%', marginTop: '2rem' }}>
            <Line data={chartData} options={options} />
        </div>
    );
}
