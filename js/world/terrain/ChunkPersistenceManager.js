/**
 * Manages persistence of terrain chunks using IndexedDB
 * Optimized for performance with deferred writes and failure tolerance
 */
export class ChunkPersistenceManager {
    constructor() {
        this.db = null;
        this.dbName = 'MonkJourneyChunks';
        this.storeName = 'chunks';
        this.dbVersion = null; // Will be determined dynamically
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
        
        // Fallback mode when IndexedDB is completely unavailable
        this.fallbackMode = false;
        this.recreationAttempts = 0;
        this.maxRecreationAttempts = 3;
        
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
        
        return new Promise((resolve) => {
            try {
                // First, try to open without specifying version to get current version
                const versionRequest = indexedDB.open(this.dbName);
                
                versionRequest.onsuccess = (event) => {
                    const tempDb = event.target.result;
                    const currentVersion = tempDb.version;
                    tempDb.close();
                    
                    // Now open with the correct version (current + 1 if we need to upgrade)
                    const needsUpgrade = !tempDb.objectStoreNames.contains(this.storeName);
                    const targetVersion = needsUpgrade ? currentVersion + 1 : currentVersion;
                    
                    console.debug(`Current DB version: ${currentVersion}, target version: ${targetVersion}`);
                    this.openDatabaseWithVersion(targetVersion, needsUpgrade).then(resolve);
                };
                
                versionRequest.onerror = (event) => {
                    // Database doesn't exist, create with version 1
                    console.debug('Database does not exist, creating with version 1');
                    this.openDatabaseWithVersion(1, true).then(resolve);
                };
                
                versionRequest.onblocked = () => {
                    console.warn('Version check blocked, trying with version 1');
                    this.openDatabaseWithVersion(1, true).then(resolve);
                };
            } catch (error) {
                console.error('Error checking database version:', error);
                // Fallback to version 1
                this.openDatabaseWithVersion(1, true).then(resolve);
            }
        });
    }
    
    /**
     * Open database with specific version
     * @param {number} version - Database version
     * @param {boolean} needsUpgrade - Whether upgrade is needed
     * @returns {Promise<boolean>} Success status
     */
    async openDatabaseWithVersion(version, needsUpgrade) {
        return new Promise((resolve) => {
            try {
                this.dbVersion = version;
                const request = indexedDB.open(this.dbName, version);
                
                request.onupgradeneeded = (event) => {
                    try {
                        const db = event.target.result;
                        console.debug(`Upgrading database to version ${version}`);
                        
                        // Create object store for chunks if it doesn't exist
                        if (!db.objectStoreNames.contains(this.storeName)) {
                            const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                            store.createIndex('timestamp', 'timestamp', { unique: false });
                            console.debug('Created chunks object store with timestamp index');
                        }
                    } catch (error) {
                        console.error('Error during database upgrade:', error);
                    }
                };
                
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    
                    // Verify that the object store exists
                    if (!this.db.objectStoreNames.contains(this.storeName)) {
                        console.error(`Object store '${this.storeName}' still missing after initialization`);
                        this.db.close();
                        this.db = null;
                        this.isInitialized = false;
                        this.isInitializing = false;
                        resolve(false);
                        return;
                    }
                    
                    this.isInitialized = true;
                    this.isInitializing = false;
                    console.debug(`ChunkPersistenceManager initialized with IndexedDB version ${version}`);
                    
                    // Start the write interval
                    this.startWriteInterval();
                    
                    // Load stored chunks list in background
                    this.loadStoredChunksFromIndexedDB().catch(error => {
                        console.warn('Failed to preload stored chunks list:', error);
                    });
                    
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error('Error opening IndexedDB:', event.target.error);
                    this.isInitialized = false;
                    this.isInitializing = false;
                    
                    // If this is a version error, try to delete and recreate
                    if (event.target.error.name === 'VersionError') {
                        console.warn('Version error detected, attempting to recreate database');
                        this.deleteAndRecreateDatabase().then(resolve);
                    } else {
                        resolve(false);
                    }
                };
                
                request.onblocked = () => {
                    console.warn('Database opening blocked - another tab may have the database open');
                    // Set a timeout to avoid waiting forever
                    setTimeout(() => {
                        console.warn('Database opening timed out, enabling fallback mode');
                        this.isInitialized = false;
                        this.isInitializing = false;
                        resolve(false);
                    }, 10000);
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
     * Delete and recreate database (simple approach)
     * @returns {Promise<boolean>} Success status
     */
    async deleteAndRecreateDatabase() {
        console.warn('Deleting and recreating database...');
        
        return new Promise((resolve) => {
            const deleteRequest = indexedDB.deleteDatabase(this.dbName);
            
            const timeout = setTimeout(() => {
                console.warn('Database deletion timed out, enabling fallback mode');
                resolve(false);
            }, 10000);
            
            deleteRequest.onsuccess = () => {
                clearTimeout(timeout);
                console.debug('Database deleted, creating fresh database');
                this.openDatabaseWithVersion(1, true).then(resolve);
            };
            
            deleteRequest.onerror = (event) => {
                clearTimeout(timeout);
                console.error('Failed to delete database:', event.target.error);
                resolve(false);
            };
            
            deleteRequest.onblocked = () => {
                console.warn('Database deletion blocked');
                // Don't resolve here, wait for timeout
            };
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
     * Check if the database is healthy and ready to use
     * @returns {boolean} Whether the database is healthy
     */
    isDatabaseHealthy() {
        return !this.fallbackMode &&
               this.isInitialized && 
               this.db && 
               !this.db.closed && 
               this.db.objectStoreNames.contains(this.storeName);
    }
    
    /**
     * Check if the system is running in fallback mode
     * @returns {boolean} Whether fallback mode is enabled
     */
    isFallbackMode() {
        return this.fallbackMode;
    }
    
    /**
     * Attempt to reset and re-enable IndexedDB from fallback mode
     * @returns {Promise<boolean>} Success status
     */
    async resetFromFallbackMode() {
        if (!this.fallbackMode) {
            console.debug('Not in fallback mode, no reset needed');
            return true;
        }
        
        console.log('Attempting to reset from fallback mode...');
        
        // Reset state
        this.fallbackMode = false;
        this.recreationAttempts = 0;
        this.isInitialized = false;
        this.isInitializing = false;
        
        // Try to initialize again
        const success = await this.init();
        if (success) {
            console.log('Successfully reset from fallback mode');
            return true;
        } else {
            console.warn('Failed to reset from fallback mode, re-enabling fallback');
            this.enableFallbackMode();
            return false;
        }
    }
    
    /**
     * Handle database corruption by attempting to recreate it
     * @param {string} operation - The operation that failed
     * @param {Error} error - The error that occurred
     * @returns {Promise<void>}
     */
    async handleDatabaseCorruption(operation, error) {
        console.error(`Database corruption detected during ${operation}:`, error);
        
        // Check if we've exceeded maximum recreation attempts
        if (this.recreationAttempts >= this.maxRecreationAttempts) {
            console.warn(`Maximum database recreation attempts (${this.maxRecreationAttempts}) exceeded, enabling fallback mode`);
            this.enableFallbackMode();
            return;
        }
        
        this.recreationAttempts++;
        console.log(`Database recreation attempt ${this.recreationAttempts}/${this.maxRecreationAttempts}`);
        
        // Mark database as unhealthy
        this.isInitialized = false;
        
        // Close existing connection
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        
        // Clear caches
        this.storedChunks.clear();
        this.writeQueue.clear();
        
        // Attempt to recreate the database
        try {
            const success = await this.recreateDatabase();
            if (success) {
                console.log(`Database successfully recreated after ${operation} failure`);
                // Reset recreation attempts on success
                this.recreationAttempts = 0;
            } else {
                console.error(`Failed to recreate database after ${operation} failure (attempt ${this.recreationAttempts})`);
                if (this.recreationAttempts >= this.maxRecreationAttempts) {
                    this.enableFallbackMode();
                }
            }
        } catch (recreateError) {
            console.error(`Error recreating database after ${operation} failure:`, recreateError);
            if (this.recreationAttempts >= this.maxRecreationAttempts) {
                this.enableFallbackMode();
            }
        }
    }
    
    /**
     * Enable fallback mode when IndexedDB is completely unavailable
     */
    enableFallbackMode() {
        console.warn('Enabling fallback mode - IndexedDB persistence disabled');
        this.fallbackMode = true;
        this.isInitialized = false;
        this.isInitializing = false;
        
        // Close database connection
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        
        // Clear all caches
        this.storedChunks.clear();
        this.writeQueue.clear();
        
        // Stop write interval
        this.stopWriteInterval();
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
        // Skip if in fallback mode
        if (this.fallbackMode) {
            return false;
        }
        
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
        
        // Check if database is healthy before creating transaction
        if (!this.isDatabaseHealthy()) {
            console.debug(`Database is not healthy, cannot save batch`);
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
                
                // If this is a NotFoundError, it means the object store doesn't exist
                if (error.name === 'NotFoundError') {
                    // Handle database corruption in background (don't wait for it)
                    this.handleDatabaseCorruption('saveBatch', error).catch(handleError => {
                        console.error('Failed to handle database corruption:', handleError);
                    });
                }
                
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
        // Return null immediately if in fallback mode
        if (this.fallbackMode) {
            return null;
        }
        
        // Wait for initialization
        const initialized = await this.waitForInit();
        if (!initialized) {
            return null;
        }
        
        // Check if this chunk is in the write queue
        if (this.writeQueue.has(chunkKey)) {
            return this.writeQueue.get(chunkKey).data;
        }
        
        // Check if database is healthy before creating transaction
        if (!this.isDatabaseHealthy()) {
            console.debug(`Database is not healthy, returning null for chunk ${chunkKey}`);
            return null;
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
                
                transaction.onerror = (event) => {
                    console.error(`Transaction error for loading chunk ${chunkKey}:`, event.target.error);
                    resolve(null);
                };
            } catch (error) {
                console.error(`Error in transaction for loading chunk ${chunkKey}:`, error);
                
                // If this is a NotFoundError, it means the object store doesn't exist
                if (error.name === 'NotFoundError') {
                    // Handle database corruption in background (don't wait for it)
                    this.handleDatabaseCorruption('loadChunk', error).catch(handleError => {
                        console.error('Failed to handle database corruption:', handleError);
                    });
                }
                
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
        // Return false immediately if in fallback mode
        if (this.fallbackMode) {
            return false;
        }
        
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
        
        // Check if database is healthy before creating transaction
        if (!this.isDatabaseHealthy()) {
            console.debug(`Database is not healthy, returning false for chunk ${chunkKey}`);
            return false;
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
                
                request.onerror = (event) => {
                    console.error(`Error checking for chunk ${chunkKey}:`, event.target.error);
                    resolve(false);
                };
                
                transaction.onerror = (event) => {
                    console.error(`Transaction error for checking chunk ${chunkKey}:`, event.target.error);
                    resolve(false);
                };
            } catch (error) {
                console.error(`Error checking for chunk ${chunkKey}:`, error);
                
                // If this is a NotFoundError, it means the object store doesn't exist
                if (error.name === 'NotFoundError') {
                    // Handle database corruption in background (don't wait for it)
                    this.handleDatabaseCorruption('hasChunk', error).catch(handleError => {
                        console.error('Failed to handle database corruption:', handleError);
                    });
                }
                
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
        
        // Check if object store exists before creating transaction
        if (!this.db || !this.db.objectStoreNames.contains(this.storeName)) {
            console.debug(`Object store '${this.storeName}' does not exist, considering chunk ${chunkKey} as deleted`);
            return true;
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
                
                transaction.onerror = (event) => {
                    console.error(`Transaction error for deleting chunk ${chunkKey}:`, event.target.error);
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
        
        // Check if object store exists before creating transaction
        if (!this.db || !this.db.objectStoreNames.contains(this.storeName)) {
            console.debug(`Object store '${this.storeName}' does not exist, considering all chunks as cleared`);
            return true;
        }
        
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
                
                transaction.onerror = (event) => {
                    console.error('Transaction error for clearing chunks:', event.target.error);
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
        
        // Check if object store exists before creating transaction
        if (!this.db || !this.db.objectStoreNames.contains(this.storeName)) {
            console.debug(`Object store '${this.storeName}' does not exist, no chunks to cleanup`);
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
                
                transaction.onerror = (event) => {
                    console.error('Transaction error for cleaning up old chunks:', event.target.error);
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
    
    /**
     * Recreate the database from scratch (simplified)
     * @returns {Promise<boolean>} Success status
     */
    async recreateDatabase() {
        console.warn('Recreating IndexedDB database...');
        return this.deleteAndRecreateDatabase();
    }
    

}

// Create a singleton instance
const chunkPersistenceManager = new ChunkPersistenceManager();
export default chunkPersistenceManager;