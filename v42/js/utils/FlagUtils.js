/**
 * debug-utils.js
 * Utility functions for debug mode
 */

import { STORAGE_KEYS } from '../config/storage-keys.js';

/**
 * Check if debug mode is enabled
 * @returns {boolean} True if debug mode is enabled, false otherwise
 */
export function isDebugMode() {
    return localStorage.getItem(STORAGE_KEYS.DEBUG_MODE) === 'true';
}
