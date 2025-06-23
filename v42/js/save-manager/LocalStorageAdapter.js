import { IStorageAdapter } from './IStorageAdapter.js';

/**
 * Implementation of storage adapter using browser's localStorage
 */
export class LocalStorageAdapter extends IStorageAdapter {
    /**
     * Save data with the given key
     * @param {string} key - Storage key
     * @param {*} data - Data to store (will be serialized)
     * @returns {boolean} Success status
     */
    saveData(key, data) {
        try {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
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
            const serializedData = localStorage.getItem(key);
            if (!serializedData) {
                return null;
            }
            return JSON.parse(serializedData);
        } catch (error) {
            console.error(`Error loading data for key ${key}:`, error);
            return null;
        }
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