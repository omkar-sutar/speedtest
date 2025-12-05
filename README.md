# Internet Speed Test

A premium, modern web application to measure your internet connection speed. Built with React and Vite, featuring a beautiful glassmorphism UI with smooth animations.

## Features

- **🚀 Real Download Speed**: Measures actual download speed using Cloudflare's edge network.
- **📶 Latency/Ping Test**: Checks network latency with precision.
- **🎨 Modern UI**: Dark theme, glassmorphism effects, and animated background orbs.
- **📱 Responsive**: Works seamlessly on desktop and mobile devices.
- **⚡ Fast**: Built on Vite for instant start and HMR.

## Tech Stack

- **Framework**: React
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (CSS Variables, Flexbox/Grid, Animations)
- **Icons**: SVG / CSS Shapes

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## How It Works

- **Ping**: Sends small `GET` requests to a public CDN endpoint to measure round-trip time.
- **Download**: Streams file chunks from a high-speed CDN, calculating speed in real-time based on bytes received over time.

## License

MIT
