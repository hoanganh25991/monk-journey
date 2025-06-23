/**
 * Interface for storage adapters
 * Abstracts the storage mechanism (localStorage, IndexedDB, server, etc.)
 */
export class IStorageAdapter {
    /**
     * Save data with the given key
     * @param {string} key - Storage key
     * @param {*} data - Data to store (will be serialized)
     * @returns {boolean} Success status
     */
    saveData(key, data) { throw new Error('Method not implemented'); }
    
    /**
     * Load data for the given key
     * @param {string} key - Storage key
     * @returns {*} The loaded data (or null if not found)
     */
    loadData(key) { throw new Error('Method not implemented'); }
    
    /**
     * Delete data for the given key
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    deleteData(key) { throw new Error('Method not implemented'); }
    
    /**
     * Check if data exists for the given key
     * @param {string} key - Storage key
     * @returns {boolean} Whether data exists
     */
    hasData(key) { throw new Error('Method not implemented'); }
}