#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { dirname, resolve, isAbsolute } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);

function getArg(name, defaultValue) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return defaultValue;
  return args[index + 1];
}

function printHelp() {
  console.log(`
Remotion Image Animator - Create video animations from images

Usage:
  npm run render -- --image <path> [options]

Options:
  --image <path>      Path to input image (required)
  --output <path>     Output video path (default: ./output.mp4)
  --preset <name>     Animation preset (default: ken-burns)
  --duration <sec>    Duration in seconds (default: 5)
  --fps <number>      Frames per second (default: 30)
  --help              Show this help message

Available presets:
  zoom-in      Slowly zoom into the image
  zoom-out     Slowly zoom out from the image
  pan-left     Pan from right to left
  pan-right    Pan from left to right
  pan-up       Pan from bottom to top
  pan-down     Pan from top to bottom
  ken-burns    Classic Ken Burns effect (zoom + pan)

Examples:
  npm run render -- --image ./photo.jpg
  npm run render -- --image ./photo.jpg --preset zoom-in --duration 10
  npm run render -- --image https://example.com/image.jpg --output ./video.mp4
`);
}

// Check for help flag
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

// Get arguments
const imageSrc = getArg('image', null);
const outputPath = getArg('output', './output.mp4');
const preset = getArg('preset', 'ken-burns');
const duration = parseFloat(getArg('duration', '5'));
const fps = parseInt(getArg('fps', '30'), 10);

// Validate required arguments
if (!imageSrc) {
  console.error('Error: --image argument is required');
  console.log('Run with --help for usage information');
  process.exit(1);
}

// Validate preset
const validPresets = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-up', 'pan-down', 'ken-burns'];
if (!validPresets.includes(preset)) {
  console.error(`Error: Invalid preset "${preset}"`);
  console.log(`Valid presets: ${validPresets.join(', ')}`);
  process.exit(1);
}

// Resolve image path (make absolute if local file and convert to file:// URL)
let resolvedImageSrc = imageSrc;
if (!imageSrc.startsWith('http://') && !imageSrc.startsWith('https://') && !imageSrc.startsWith('file://')) {
  const absolutePath = isAbsolute(imageSrc) ? imageSrc : resolve(process.cwd(), imageSrc);
  if (!existsSync(absolutePath)) {
    console.error(`Error: Image file not found: ${absolutePath}`);
    process.exit(1);
  }
  // Convert to file:// URL for Remotion (cross-platform)
  resolvedImageSrc = pathToFileURL(absolutePath).href;
}

// Calculate frames from duration
const durationInFrames = Math.round(duration * fps);

// Ensure output directory exists
const outputDir = dirname(resolve(process.cwd(), outputPath));
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Build the input props JSON
const inputProps = JSON.stringify({
  imageSrc: resolvedImageSrc,
  preset: preset,
});

console.log('\n🎬 Remotion Image Animator');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📷 Image: ${imageSrc}`);
console.log(`🎨 Preset: ${preset}`);
console.log(`⏱️  Duration: ${duration}s (${durationInFrames} frames @ ${fps}fps)`);
console.log(`📁 Output: ${outputPath}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Build remotion render command
const renderCmd = [
  'npx',
  'remotion',
  'render',
  'ImageAnimator',
  resolve(process.cwd(), outputPath),
  `--props='${inputProps}'`,
  `--duration-in-frames=${durationInFrames}`,
].join(' ');

try {
  execSync(renderCmd, { 
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
  console.log(`\n✅ Video saved to: ${outputPath}`);
} catch (error) {
  console.error('\n❌ Render failed');
  process.exit(1);
}
