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

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function printHelp() {
  console.log(`
Remotion Animator - Create video animations

Usage:
  npm run render -- --composition <name> [options]
  npm run render -- --image <path> [options]      (shorthand for ImageAnimator)

Compositions:
  ImageAnimator   Animate an image with various effects
  FuiClock        Futuristic UI clock interface

Options:
  --composition <name>  Composition to render (default: auto-detect)
  --image <path>        Path to input image (ImageAnimator only)
  --output <path>       Output video path (default: ./output.mp4)
  --preset <name>       Animation preset for ImageAnimator (default: ken-burns)
  --duration <sec>      Duration in seconds (default: 5)
  --fps <number>        Frames per second (default: 30)
  --base-time <num>     Base time value for FuiClock (default: 1100)
  --help                Show this help message

ImageAnimator Presets:
  zoom-in      Slowly zoom into the image
  zoom-out     Slowly zoom out from the image
  pan-left     Pan from right to left
  pan-right    Pan from left to right
  pan-up       Pan from bottom to top
  pan-down     Pan from top to bottom
  ken-burns    Classic Ken Burns effect (zoom + pan)

Examples:
  # Render FuiClock
  npm run render -- --composition FuiClock --duration 5

  # Render ImageAnimator
  npm run render -- --image ./photo.jpg
  npm run render -- --image ./photo.jpg --preset zoom-in --duration 10
`);
}

// Check for help flag
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

// Get arguments
const composition = getArg('composition', null);
const imageSrc = getArg('image', null);
const outputPath = getArg('output', './output.mp4');
const preset = getArg('preset', 'ken-burns');
const duration = parseFloat(getArg('duration', '5'));
const fps = parseInt(getArg('fps', '30'), 10);
const baseTime = parseInt(getArg('base-time', '1100'), 10);

// Determine which composition to use
let selectedComposition = composition;
let inputProps = {};

if (imageSrc) {
  // If --image is provided, use ImageAnimator
  selectedComposition = 'ImageAnimator';
  
  // Validate preset
  const validPresets = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-up', 'pan-down', 'ken-burns'];
  if (!validPresets.includes(preset)) {
    console.error(`Error: Invalid preset "${preset}"`);
    console.log(`Valid presets: ${validPresets.join(', ')}`);
    process.exit(1);
  }

  // Resolve image path
  let resolvedImageSrc = imageSrc;
  if (!imageSrc.startsWith('http://') && !imageSrc.startsWith('https://') && !imageSrc.startsWith('file://')) {
    const absolutePath = isAbsolute(imageSrc) ? imageSrc : resolve(process.cwd(), imageSrc);
    if (!existsSync(absolutePath)) {
      console.error(`Error: Image file not found: ${absolutePath}`);
      process.exit(1);
    }
    resolvedImageSrc = pathToFileURL(absolutePath).href;
  }

  inputProps = {
    imageSrc: resolvedImageSrc,
    preset: preset,
  };
} else if (selectedComposition === 'FuiClock' || (!selectedComposition && !imageSrc)) {
  // Default to FuiClock if no image and no composition specified, or if explicitly FuiClock
  selectedComposition = selectedComposition || 'FuiClock';
  inputProps = {
    baseTime: baseTime,
  };
} else if (!selectedComposition) {
  console.error('Error: Either --composition or --image must be specified');
  console.log('Run with --help for usage information');
  process.exit(1);
}

// Validate composition
const validCompositions = ['ImageAnimator', 'FuiClock'];
if (!validCompositions.includes(selectedComposition)) {
  console.error(`Error: Invalid composition "${selectedComposition}"`);
  console.log(`Valid compositions: ${validCompositions.join(', ')}`);
  process.exit(1);
}

// Calculate frames from duration
const durationInFrames = Math.round(duration * fps);

// Ensure output directory exists
const outputDir = dirname(resolve(process.cwd(), outputPath));
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Build the input props JSON
const inputPropsJson = JSON.stringify(inputProps);

console.log('\n🎬 Remotion Animator');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🎯 Composition: ${selectedComposition}`);
if (selectedComposition === 'ImageAnimator') {
  console.log(`📷 Image: ${imageSrc}`);
  console.log(`🎨 Preset: ${preset}`);
} else if (selectedComposition === 'FuiClock') {
  console.log(`⏰ Base Time: ${baseTime}`);
}
console.log(`⏱️  Duration: ${duration}s (${durationInFrames} frames @ ${fps}fps)`);
console.log(`📁 Output: ${outputPath}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Build remotion render command
const renderCmd = [
  'npx',
  'remotion',
  'render',
  selectedComposition,
  resolve(process.cwd(), outputPath),
  `--props='${inputPropsJson}'`,
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
