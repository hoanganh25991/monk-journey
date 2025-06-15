/**
 * Shared Configuration for File Scanning Scripts
 * 
 * This module provides common configuration settings used by various
 * file generation and scanning scripts in the project.
 */

// Directories to scan for files
const directoriesToScan = [
  './css',
  './js',
  './images',
  './assets',
  './pwa',
];

// File extensions to include
const fileExtensions = [
  '.html', '.css', '.js', '.json', 
  '.png', '.jpg', '.jpeg', '.svg', '.ico',
  '.mp3', '.wav', '.ogg', '.glb'
];

// Files to always include
const alwaysInclude = [
  '',
  'manifest.json'
];

// Files to exclude
const excludeFiles = [
  'index.html',
  'initial-loading-progress.js',
  'orientation-lock.js',
  'registration.js',
  'main.js',
  'service-worker.js',
  'node_modules',
  '.git',
  '.vscode',
  'progress',
  'scripts',
  'config',
  'fuctional-requirement',
  'README.md',
  'LICENSE',
  '.gitignore',
  "assets/maps",
];

// Helper function to categorize files by extension
function categorizeFileByExtension(ext) {
  let category = 'other';
  if (ext === '.glb') category = 'models';
  else if (['.jpg', '.png', '.jpeg', '.svg', '.ico'].includes(ext)) category = 'images';
  else if (['.mp3', '.wav', '.ogg'].includes(ext)) category = 'audio';
  else if (ext === '.js') category = 'js';
  else if (ext === '.css') category = 'css';
  return category;
}

module.exports = {
  directoriesToScan,
  fileExtensions,
  alwaysInclude,
  excludeFiles,
  categorizeFileByExtension
};