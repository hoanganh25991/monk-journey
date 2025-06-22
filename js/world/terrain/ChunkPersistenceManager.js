/**
 * Manages persistence of terrain chunks using IndexedDB
 * Optimized for performance with deferred writes and failure tolerance
 */
export class ChunkPersistenceManager {
    constructor() {
        this.db = null;
        this.dbName = 'MonkJourneyChunks';
        this.storeName = 'chunks';
        this.dbVersion = 1;
        this.isInitialized = false;
        this.isInitializing = false;
        
        // Performance optimization settings
        this.writeQueue = new Map(); // Map of chunkKey -> {data, timestamp}
        this.processingQueue = false;
        this.writeDelay = 2000; // Wait 2 seconds before persisting chunks
        this.batchSize = 5; // Process 5 chunks at a time maximum
        this.maxQueueSize = 50; // Maximum queue size before dropping writes
        this.writeInterval = null;
        this.writeIntervalTime = 5000; // Process queue every 5 seconds
        
        // Track which chunks are stored to avoid redundant operations
        this.storedChunks = new Set();
        
        // Initialize the database
        this.init();
    }
    
    /**
     * Initialize the database
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        if (this.isInitialized || this.isInitializing) {
            return this.isInitialized;
        }
        
        this.isInitializing = true;
        console.debug('ChunkPersistenceManager: Initializing IndexedDB...');
        
        // Load stored chunks from memory first
        try {
            await this.loadStoredChunksFromIndexedDB();
        } catch (error) {
            console.warn('Failed to preload stored chunks list:', error);
        }
        
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Create object store for chunks if it doesn't exist
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                        // Add index for timestamp to help with cleanup
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                        console.debug('Created chunks object store with timestamp index');
                    }
                };
                
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    this.isInitialized = true;
                    this.isInitializing = false;
                    console.debug('ChunkPersistenceManager initialized with IndexedDB');
                    
                    // Log the number of stored chunks
                    console.debug(`IndexedDB initialized with ${this.storedChunks.size} stored chunks`);
                    
                    // Start the write interval
                    this.startWriteInterval();
                    
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error('Error initializing IndexedDB:', event.target.error);
                    this.isInitialized = false;
                    this.isInitializing = false;
                    resolve(false);
                };
            } catch (error) {
                console.error('Error setting up IndexedDB:', error);
                this.isInitialized = false;
                this.isInitializing = false;
                resolve(false);
            }
        });
    }
    
    /**
     * Load the list of stored chunks from IndexedDB to memory
     * This helps avoid redundant database checks
     * @returns {Promise<void>}
     */
    async loadStoredChunksFromIndexedDB() {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    
                    // Check if the store exists
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        console.debug('No chunks store found in IndexedDB');
                        resolve();
                        return;
                    }
                    
                    const transaction = db.transaction([this.storeName], 'readonly');
                    const store = transaction.objectStore(this.storeName);
                    const request = store.getAllKeys();
                    
                    request.onsuccess = (event) => {
                        const keys = event.target.result;
                        
                        // Add all keys to the stored chunks set
                        keys.forEach(key => {
                            if (typeof key === 'string') {
                                this.storedChunks.add(key);
                            }
                        });
                        
                        console.debug(`Preloaded ${this.storedChunks.size} chunk keys from IndexedDB`);
                        resolve();
                    };
                    
                    request.onerror = (event) => {
                        console.error('Error loading stored chunks:', event.target.error);
                        reject(event.target.error);
                    };
                };
                
                request.onerror = (event) => {
                    console.error('Error opening database:', event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('Error in loadStoredChunksFromIndexedDB:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Start the interval to process the write queue
     */
    startWriteInterval() {
        if (this.writeInterval) {
            clearInterval(this.writeInterval);
        }
        
        this.writeInterval = setInterval(() => {
            this.processWriteQueue();
        }, this.writeIntervalTime);
    }
    
    /**
     * Stop the write interval
     */
    stopWriteInterval() {
        if (this.writeInterval) {
            clearInterval(this.writeInterval);
            this.writeInterval = null;
        }
    }
    
    /**
     * Wait for initialization to complete
     * @returns {Promise<boolean>} Promise that resolves when initialization is complete
     */
    async waitForInit() {
        if (this.isInitialized) {
            return true;
        }
        
        if (!this.isInitializing) {
            return await this.init();
        }
        
        return new Promise((resolve) => {
            const checkInit = () => {
                if (this.isInitialized) {
                    resolve(true);
                } else if (!this.isInitializing) {
                    resolve(false);
                } else {
                    setTimeout(checkInit, 50);
                }
            };
            
            checkInit();
        });
    }
    
    /**
     * Queue a chunk for saving to IndexedDB
     * This method is non-blocking and returns immediately
     * 
     * @param {string} chunkKey - The chunk key (e.g. "0,0")
     * @param {Object} chunkData - The chunk data to save
     * @returns {boolean} Whether the chunk was queued (false if queue is full)
     */
    queueChunkForSave(chunkKey, chunkData) {
        // Skip if already in stored chunks set
        if (this.storedChunks.has(chunkKey)) {
            return true;
        }
        
        // If queue is too large, drop this write to prevent performance issues
        if (this.writeQueue.size >= this.maxQueueSize) {
            console.debug(`Write queue full (${this.writeQueue.size}), dropping chunk ${chunkKey}`);
            return false;
        }
        
        // Add to write queue with current timestamp
        this.writeQueue.set(chunkKey, {
            data: chunkData,
            timestamp: Date.now()
        });
        
        return true;
    }
    
    /**
     * Process the write queue in batches
     * This is called on an interval and processes a limited number of chunks per call
     */
    async processWriteQueue() {
        // Skip if not initialized or already processing
        if (!this.isInitialized || this.processingQueue || this.writeQueue.size === 0) {
            return;
        }
        
        this.processingQueue = true;
        
        try {
            const currentTime = Date.now();
            const chunksToProcess = [];
            
            // Find chunks that have been in the queue long enough
            for (const [chunkKey, { data, timestamp }] of this.writeQueue.entries()) {
                if (currentTime - timestamp >= this.writeDelay) {
                    chunksToProcess.push({ chunkKey, data });
                    
                    // Remove from queue
                    this.writeQueue.delete(chunkKey);
                    
                    // Limit batch size
                    if (chunksToProcess.length >= this.batchSize) {
                        break;
                    }
                }
            }
            
            // Process the batch
            if (chunksToProcess.length > 0) {
                await this.saveBatch(chunksToProcess);
            }
        } catch (error) {
            console.error('Error processing write queue:', error);
        } finally {
            this.processingQueue = false;
        }
    }
    
    /**
     * Save a batch of chunks to IndexedDB
     * @param {Array} chunks - Array of {chunkKey, data} objects
     * @returns {Promise<void>}
     */
    async saveBatch(chunks) {
        if (!this.isInitialized || chunks.length === 0) {
            return;
        }
        
        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                
                let completed = 0;
                const total = chunks.length;
                
                // Handle transaction completion
                transaction.oncomplete = () => {
                    resolve();
                };
                
                transaction.onerror = (event) => {
                    console.error('Error in batch save transaction:', event.target.error);
                    resolve();
                };
                
                // Process each chunk in the batch
                chunks.forEach(({ chunkKey, data }) => {
                    try {
                        const record = {
                            id: chunkKey,
                            data: data,
                            timestamp: Date.now()
                        };
                        
                        const request = store.put(record);
                        
                        request.onsuccess = () => {
                            this.storedChunks.add(chunkKey);
                            completed++;
                        };
                        
                        request.onerror = (event) => {
                            console.error(`Error saving chunk ${chunkKey}:`, event.target.error);
                            completed++;
                        };
                    } catch (error) {
                        console.error(`Error processing chunk ${chunkKey}:`, error);
                        completed++;
                    }
                });
            } catch (error) {
                console.error('Error creating transaction for batch save:', error);
                resolve();
            }
        });
    }
    
    /**
     * Load chunk data from IndexedDB
     * @param {string} chunkKey - The chunk key (e.g. "0,0")
     * @returns {Promise<Object|null>} The chunk data or null if not found
     */
    async loadChunk(chunkKey) {
        // Wait for initialization
        const initialized = await this.waitForInit();
        if (!initialized) {
            return null;
        }
        
        // Check if this chunk is in the write queue
        if (this.writeQueue.has(chunkKey)) {
            return this.writeQueue.get(chunkKey).data;
        }
        
        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(chunkKey);
                
                request.onsuccess = (event) => {
                    const record = event.target.result;
                    if (record) {
                        // Add to stored chunks set
                        this.storedChunks.add(chunkKey);
                        resolve(record.data);
                    } else {
                        resolve(null);
                    }
                };
                
                request.onerror = (event) => {
                    console.error(`Error loading chunk ${chunkKey}:`, event.target.error);
                    resolve(null);
                };
            } catch (error) {
                console.error(`Error in transaction for loading chunk ${chunkKey}:`, error);
                resolve(null);
            }
        });
    }
    
    /**
     * Check if a chunk exists in storage
     * @param {string} chunkKey - The chunk key
     * @returns {Promise<boolean>} Whether the chunk exists
     */
    async hasChunk(chunkKey) {
        // Wait for initialization
        const initialized = await this.waitForInit();
        if (!initialized) {
            return false;
        }
        
        // Check in-memory cache first
        if (this.storedChunks.has(chunkKey)) {
            return true;
        }
        
        // Check if this chunk is in the write queue
        if (this.writeQueue.has(chunkKey)) {
            return true;
        }
        
        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.count(chunkKey);
                
                request.onsuccess = (event) => {
                    const count = event.target.result;
                    if (count > 0) {
                        this.storedChunks.add(chunkKey);
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                };
                
                request.onerror = () => {
                    resolve(false);
                };
            } catch (error) {
                console.error(`Error checking for chunk ${chunkKey}:`, error);
                resolve(false);
            }
        });
    }
    
    /**
     * Delete a chunk from storage
     * @param {string} chunkKey - The chunk key
     * @returns {Promise<boolean>} Success status
     */
    async deleteChunk(chunkKey) {
        // Wait for initialization
        const initialized = await this.waitForInit();
        if (!initialized) {
            return false;
        }
        
        // Remove from in-memory cache
        this.storedChunks.delete(chunkKey);
        
        // Remove from write queue if present
        if (this.writeQueue.has(chunkKey)) {
            this.writeQueue.delete(chunkKey);
        }
        
        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(chunkKey);
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error(`Error deleting chunk ${chunkKey}:`, event.target.error);
                    resolve(false);
                };
            } catch (error) {
                console.error(`Error in transaction for deleting chunk ${chunkKey}:`, error);
                resolve(false);
            }
        });
    }
    
    /**
     * Clear all stored chunks
     * @returns {Promise<boolean>} Success status
     */
    async clearAllChunks() {
        // Wait for initialization
        const initialized = await this.waitForInit();
        if (!initialized) {
            return false;
        }
        
        // Clear in-memory cache
        this.storedChunks.clear();
        
        // Clear write queue
        this.writeQueue.clear();
        
        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.clear();
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error('Error clearing chunks:', event.target.error);
                    resolve(false);
                };
            } catch (error) {
                console.error('Error in transaction for clearing chunks:', error);
                resolve(false);
            }
        });
    }
    
    /**
     * Clean up old chunks to prevent database from growing too large
     * @param {number} maxAge - Maximum age in milliseconds (default: 7 days)
     * @returns {Promise<number>} Number of chunks removed
     */
    async cleanupOldChunks(maxAge = 7 * 24 * 60 * 60 * 1000) {
        // Wait for initialization
        const initialized = await this.waitForInit();
        if (!initialized) {
            return 0;
        }
        
        const cutoffTime = Date.now() - maxAge;
        
        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const index = store.index('timestamp');
                
                // Get all chunks older than the cutoff time
                const range = IDBKeyRange.upperBound(cutoffTime);
                const request = index.openCursor(range);
                
                let count = 0;
                
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        // Delete this chunk
                        const deleteRequest = store.delete(cursor.primaryKey);
                        deleteRequest.onsuccess = () => {
                            count++;
                            // Remove from in-memory cache
                            this.storedChunks.delete(cursor.value.id);
                        };
                        
                        // Move to next chunk
                        cursor.continue();
                    } else {
                        // No more chunks to process
                        console.debug(`Cleaned up ${count} old chunks`);
                        resolve(count);
                    }
                };
                
                request.onerror = (event) => {
                    console.error('Error cleaning up old chunks:', event.target.error);
                    resolve(0);
                };
            } catch (error) {
                console.error('Error in transaction for cleaning up old chunks:', error);
                resolve(0);
            }
        });
    }
    
    /**
     * Force processing of the write queue
     * Useful when the game is about to unload
     * @returns {Promise<void>}
     */
    async flushWriteQueue() {
        if (this.writeQueue.size === 0 || !this.isInitialized) {
            return;
        }
        
        // Convert the queue to an array of chunks
        const chunks = [];
        for (const [chunkKey, { data }] of this.writeQueue.entries()) {
            chunks.push({ chunkKey, data });
        }
        
        // Clear the queue
        this.writeQueue.clear();
        
        // Process all chunks in batches
        const batchSize = this.batchSize;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            await this.saveBatch(batch);
        }
    }
    
    /**
     * Clean up resources when the manager is no longer needed
     */
    dispose() {
        // Stop the write interval
        this.stopWriteInterval();
        
        // Flush the write queue
        this.flushWriteQueue().catch(error => {
            console.error('Error flushing write queue during disposal:', error);
        });
        
        // Close the database connection
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        
        this.isInitialized = false;
        this.storedChunks.clear();
        this.writeQueue.clear();
    }
}

// Create a singleton instance
const chunkPersistenceManager = new ChunkPersistenceManager();
export default chunkPersistenceManager;