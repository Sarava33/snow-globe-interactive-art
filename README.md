# Snow Globe Interactive Art Installation

An immersive interactive art experience where visitors can shake their phones to control snow in a projected 3D snow globe. Perfect for galleries, exhibitions, and interactive installations.

## Features

- **No App Required** - Visitors use their phone browsers directly
- **Real-time Snow Control** - Phone accelerometer data creates snow effects
- **3D Visualization** - Beautiful Three.js snow globe with realistic physics
- **Multi-user Support** - Multiple phones can connect simultaneously
- **Auto-reset Counters** - Active shake counters reset automatically for clean display
- **Admin Controls** - Adjust settings with keyboard shortcuts
- **Live Analytics** - See connected users and shake statistics in real-time
- **Secure Connection** - HTTPS support for motion sensor access

## How It Works

1. Visitors enter the room and see a projected snow globe
2. QR code or URL displayed for easy connection
3. Phone connects instantly - no downloads needed
4. Shake detection activates automatically
5. Snow falls in real-time as visitors shake their phones
6. Multiple users can participate simultaneously

## Requirements

- Node.js 14+
- Modern web browser (Chrome recommended)
- WiFi network for device connections
- Projector/large display for main visualization
- Smartphone with motion sensors

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/Sarava33/snow-globe-interactive-art.git
cd snow-globe-interactive-art
npm install
```

### 2. Start the Server

```bash
npm start
# or
node server.js
```

### 3. Set Up HTTPS (Required for Motion Sensors)

**Using ngrok (Recommended)**

```bash
# Install ngrok
npm install -g ngrok
# or download from https://ngrok.com/download

# In a new terminal (while server is running)
ngrok http 3000
```

You'll get URLs like:
```
https://abc123.ngrok-free.app -> http://localhost:3000
```

**Alternative: Local Network Access**

For local IP addresses, enable Chrome flags on Android:
1. Go to `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Add your server IP (e.g., `http://192.168.1.100:3000`)
3. Restart Chrome

### 4. Access the Application

- **Main Display (Projector):** `https://your-ngrok-url.app/display.html`
- **Phone Controller:** `https://your-ngrok-url.app/controller.html`
- **Server Status:** `https://your-ngrok-url.app`

## Project Structure

```
snow-globe-interactive-art/
├── server.js                 # WebSocket server
├── package.json             # Dependencies
├── public/
│   ├── display.html         # Main 3D snow globe display
│   └── controller.html      # Phone controller interface
├── README.md               # Documentation
└── .gitignore
```

## Usage Instructions

### Installation Setup

1. Connect projector/large display to computer
2. Open display page in fullscreen browser
3. Connect to same WiFi as server
4. Share QR code/URL with visitors

### For Visitors

1. Scan QR code or visit displayed URL
2. Tap "Connect to Snow Globe"
3. Allow motion permissions if prompted
4. Shake phone to make it snow

### Admin Controls

- **+/-** keys: Adjust shake reset time (1-10 seconds)

## Configuration

### Shake Detection Settings

Edit `controller.html` to adjust sensitivity:

```javascript
const shakeThreshold = 12;        // Lower = more sensitive
const minTimeBetweenShakes = 800; // Milliseconds between shakes
```

### Reset Timer

Default: 3 seconds. Adjust with +/- keys or modify:

```javascript
let resetTimeSeconds = 3; // Auto-reset time for active shakes
```

## Deployment Options

### Local Installation (Recommended)

Best for galleries and controlled environments:

```bash
npm start
ngrok http 3000
```

### Cloud Deployment

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Railway:**
```bash
npm install -g @railway/cli
railway login
railway deploy
```

## Mobile Compatibility

### Supported Devices
- iOS Safari 13+ (requires permission prompt)
- Android Chrome 70+ (requires HTTPS)
- Android Firefox 80+

### Motion Sensor Requirements
- HTTPS required for motion sensors on most browsers
- User gesture may be needed to activate sensors
- Permission prompts handled automatically

## Troubleshooting

### Motion Sensors Not Working

**Problem:** "No motion detected" message

**Solutions:**
1. Ensure HTTPS - Use ngrok or enable Chrome flags
2. Check permissions - Allow motion sensors in browser
3. Try different browser - Chrome usually works best
4. Restart browser after permission changes

### Connection Issues

**Problem:** Phone can't connect to display

**Solutions:**
1. Check same network - Both devices need same WiFi
2. Verify URLs - Ensure using correct ngrok or IP address
3. Restart server - `Ctrl+C` then `node server.js`
4. Check firewall - Allow Node.js through firewall

### Display Issues

**Problem:** 3D scene not loading

**Solutions:**
1. Modern browser - Ensure WebGL support
2. Graphics drivers - Update if using older hardware
3. Check console - Look for JavaScript errors

## Customization

### Visual Enhancements
- Different particles - Replace snow with leaves, stars, etc.
- Color themes - Seasonal or branded color schemes
- Scene objects - Add buildings, trees, or custom 3D models
- Lighting effects - Dynamic lighting based on shake intensity

### Interaction Improvements
- Sound effects - Audio feedback for shakes
- Haptic feedback - Phone vibration on successful shakes
- Gesture variety - Tilt, rotation, or multi-touch controls
- User identification - Different colors for different users

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open Pull Request

## Development Setup

```bash
npm install
npm run dev  # Start with auto-restart
```

## Known Issues

- iOS Safari sometimes requires double-tap to activate motion
- Android Chrome strict HTTPS requirement
- Older devices may have reduced performance with many particles


## Acknowledgments

- Three.js for 3D graphics
- Socket.io for real-time communication
- ngrok for HTTPS tunneling
- Express.js for server framework

## Support

- **Issues:** [GitHub Issues](https://github.com/Sarava33/snow-globe-interactive-art/issues)
- **Documentation:** [GitHub Repository](https://github.com/Sarava33/snow-globe-interactive-art)

---

Built for interactive art installations. Transform any space into a magical, interactive snow globe experience.