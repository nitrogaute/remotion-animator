# Remotion Image Animator

Create video animations from still images using the Ken Burns effect and other animation presets.

## Features

- 🎬 Ken Burns effect (zoom + pan)
- 🔍 Zoom in/out animations
- ↔️ Pan animations (left, right, up, down)
- 📺 1080p HD output
- ⚡ CLI interface for easy rendering
- 🖥️ Cross-platform (Windows, macOS, Linux)

## Prerequisites

### All Platforms

- **Node.js 18+** - [Download](https://nodejs.org/)
- **FFmpeg** - Required for video encoding

### Windows Installation

1. **Install Node.js:**
   - Download from [nodejs.org](https://nodejs.org/) (LTS recommended)
   - Run the installer and follow prompts
   - Verify: `node --version` in Command Prompt

2. **Install FFmpeg:**
   - **Option A (Recommended): Using winget**
     ```powershell
     winget install ffmpeg
     ```
   - **Option B: Using Chocolatey**
     ```powershell
     choco install ffmpeg
     ```
   - **Option C: Manual installation**
     - Download from [ffmpeg.org](https://ffmpeg.org/download.html)
     - Extract to a folder (e.g., `C:\ffmpeg`)
     - Add `C:\ffmpeg\bin` to your PATH environment variable
   - Verify: `ffmpeg -version`

### macOS Installation

```bash
# Install Node.js (using Homebrew)
brew install node

# Install FFmpeg
brew install ffmpeg
```

### Linux Installation (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install FFmpeg
sudo apt-get install ffmpeg
```

## Installation

```bash
# Clone the repository
git clone https://github.com/gauteab/remotion-animator.git
cd remotion-animator

# Install dependencies
npm install
```

## Quick Start

```bash
# Render with default Ken Burns effect (5 seconds)
npm run render -- --image ./photo.jpg

# Custom output path
npm run render -- --image ./photo.jpg --output ./video.mp4

# Use a different preset
npm run render -- --image ./photo.jpg --preset zoom-in

# Custom duration
npm run render -- --image ./photo.jpg --duration 10

# URL input
npm run render -- --image https://example.com/image.jpg
```

### Windows Users

Use forward slashes or escape backslashes in paths:

```cmd
# Forward slashes work on Windows
npm run render -- --image ./photos/image.jpg

# Or use escaped backslashes
npm run render -- --image .\photos\image.jpg
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--image <path>` | Path to input image (required) | - |
| `--output <path>` | Output video path | `./output.mp4` |
| `--preset <name>` | Animation preset | `ken-burns` |
| `--duration <sec>` | Duration in seconds | `5` |
| `--fps <number>` | Frames per second | `30` |

## Animation Presets

| Preset | Description |
|--------|-------------|
| `ken-burns` | Classic Ken Burns effect - subtle zoom with pan |
| `zoom-in` | Slowly zoom into the image |
| `zoom-out` | Slowly zoom out from the image |
| `pan-left` | Pan from right to left |
| `pan-right` | Pan from left to right |
| `pan-up` | Pan from bottom to top |
| `pan-down` | Pan from top to bottom |

## Examples

### Create a dramatic zoom-in

```bash
npm run render -- --image ./landscape.jpg --preset zoom-in --duration 8 --output ./dramatic.mp4
```

### Create a slow pan across a wide image

```bash
npm run render -- --image ./panorama.jpg --preset pan-right --duration 15
```

### Ken Burns with custom duration

```bash
npm run render -- --image ./portrait.jpg --preset ken-burns --duration 6
```

## Development

Start the Remotion Studio for preview:

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## Output Specifications

- Resolution: 1920x1080 (Full HD)
- Format: MP4 (H.264)
- Default FPS: 30

## Troubleshooting

### FFmpeg not found

If you get an error about FFmpeg not being found:

- **Windows:** Ensure FFmpeg is in your PATH. Restart your terminal after installation.
- **macOS/Linux:** Run `which ffmpeg` to verify installation.

### Permission denied (Linux/macOS)

If you get permission errors, try:
```bash
chmod +x node_modules/.bin/*
```

### Slow rendering

Video rendering is CPU-intensive. Rendering time depends on:
- Duration of the video
- Your CPU speed
- Resolution (1080p by default)

Typical render time: ~10-30 seconds for a 5-second video.

## Tech Stack

- [Remotion](https://www.remotion.dev/) - Video creation in React
- TypeScript
- React 19
- TailwindCSS 4

## License

MIT
