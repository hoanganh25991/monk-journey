import { IStorageAdapter } from './IStorageAdapter.js';
import { STORAGE_KEYS } from '../config/storage-keys.js';

/**
 * Implementation of storage adapter using browser's localStorage
 * Simplified to use consistent serialization/deserialization
 */
export class LocalStorageAdapter extends IStorageAdapter {
    constructor() {
        super();
        
        // Define keys that should be treated as specific types
        this.booleanKeys = [
            STORAGE_KEYS.DEBUG_MODE,
            STORAGE_KEYS.LOG_ENABLED,
            STORAGE_KEYS.ADAPTIVE_QUALITY,
            STORAGE_KEYS.SHOW_PERFORMANCE_INFO,
            STORAGE_KEYS.MUTED,
            STORAGE_KEYS.CUSTOM_SKILLS
        ];
        
        this.stringKeys = [
            STORAGE_KEYS.DIFFICULTY,
            STORAGE_KEYS.QUALITY_LEVEL,
            STORAGE_KEYS.CHARACTER_MODEL,
            STORAGE_KEYS.SELECTED_MODEL,
            STORAGE_KEYS.SELECTED_SIZE,
            STORAGE_KEYS.SELECTED_ANIMATION,
            STORAGE_KEYS.SELECTED_ENEMY_PREVIEW,
            STORAGE_KEYS.SELECTED_ENEMY_ANIMATION,
            STORAGE_KEYS.SELECTED_ITEM_TYPE,
            STORAGE_KEYS.SELECTED_ITEM_SUBTYPE,
            STORAGE_KEYS.SELECTED_ITEM_RARITY
        ];
        
        this.numberKeys = [
            STORAGE_KEYS.TARGET_FPS,
            STORAGE_KEYS.CAMERA_ZOOM,
            STORAGE_KEYS.MASTER_VOLUME,
            STORAGE_KEYS.MUSIC_VOLUME,
            STORAGE_KEYS.SFX_VOLUME
        ];
        
        // Add all skill variant keys
        for (let i = 1; i <= 8; i++) {
            this.stringKeys.push(`monk_journey_selected_skill_variant_${i}`);
        }
    }
    
    /**
     * Save data with the given key
     * @param {string} key - Storage key
     * @param {*} data - Data to store (will be serialized)
     * @returns {boolean} Success status
     */
    saveData(key, data) {
        try {
            let valueToStore;
            
            // Handle boolean keys - store as literal 'true' or 'false' strings without quotes
            if (this.booleanKeys.includes(key)) {
                valueToStore = data.toString(); // Convert to 'true' or 'false' string
                localStorage.setItem(key, valueToStore);
                return true;
            }
            
            // Handle string keys - store as literal strings without quotes
            if (this.stringKeys.includes(key)) {
                valueToStore = data.toString(); // Ensure it's a string
                localStorage.setItem(key, valueToStore);
                return true;
            }
            
            // Handle number keys - store as literal numbers without quotes
            if (this.numberKeys.includes(key)) {
                valueToStore = data.toString(); // Convert number to string
                localStorage.setItem(key, valueToStore);
                return true;
            }
            
            // For all other keys, use JSON serialization
            valueToStore = JSON.stringify(data);
            localStorage.setItem(key, valueToStore);
            return true;
        } catch (error) {
            console.error(`Error saving data for key ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Load data for the given key
     * @param {string} key - Storage key
     * @returns {*} The loaded data (or null if not found)
     */
    loadData(key) {
        try {
            const rawData = localStorage.getItem(key);
            if (rawData === null || rawData === undefined) {
                return null;
            }
            
            // Handle boolean keys - convert string to boolean
            if (this.booleanKeys.includes(key)) {
                return rawData === 'true';
            }
            
            // Handle string keys - return as is
            if (this.stringKeys.includes(key)) {
                return rawData;
            }
            
            // Handle number keys - convert string to number
            if (this.numberKeys.includes(key)) {
                return Number(rawData);
            }
            
            // For all other keys, try to parse as JSON
            try {
                const parsedData = JSON.parse(rawData);
                return this.processLoadedData(parsedData);
            } catch (parseError) {
                // If parsing fails, return the raw string
                console.debug(`Failed to parse JSON for key ${key}, returning raw value`);
                return rawData;
            }
        } catch (error) {
            console.error(`Error loading data for key ${key}:`, error);
            return null;
        }
    }
    
    /**
     * Process loaded data to convert string booleans to actual booleans
     * @param {*} data - The data to process
     * @returns {*} The processed data
     */
    processLoadedData(data) {
        if (data === null || data === undefined) {
            return data;
        }
        
        // Handle string boolean values
        if (data === "true") return true;
        if (data === "false") return false;
        
        // Handle arrays
        if (Array.isArray(data)) {
            return data.map(item => this.processLoadedData(item));
        }
        
        // Handle objects
        if (typeof data === 'object') {
            const result = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    result[key] = this.processLoadedData(data[key]);
                }
            }
            return result;
        }
        
        // Return other types as is
        return data;
    }
    
    /**
     * Delete data for the given key
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    deleteData(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error deleting data for key ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Check if data exists for the given key
     * @param {string} key - Storage key
     * @returns {boolean} Whether data exists
     */
    hasData(key) {
        return localStorage.getItem(key) !== null;
    }
}