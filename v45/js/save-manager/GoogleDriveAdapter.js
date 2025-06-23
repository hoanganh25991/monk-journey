import { IStorageAdapter } from './IStorageAdapter.js';
import { STORAGE_KEYS } from '../config/storage-keys.js';
import googleAuthManager from './GoogleAuthManager.js';

/**
 * Implementation of storage adapter using Google Drive API
 * Allows for cross-device synchronization of save data
 */
export class GoogleDriveAdapter extends IStorageAdapter {
    /**
     * Create a new GoogleDriveAdapter
     * @param {string} clientId - Google API client ID
     */
    constructor(clientId) {
        super();
        this.clientId = clientId;
        this.isSignedIn = false;
        this.tokenClient = null;
        this.accessToken = null;
        this.fileCache = new Map(); // Cache file IDs for faster access
        this.FOLDER_NAME = 'MonkJourneySaves'; // Use a consistent folder name
        this.folderId = null; // Will store the folder ID once found or created
        
        // Flag to prevent concurrent folder creation
        this.isFolderCheckInProgress = false;
        this.folderCheckPromise = null;
        
        // Scopes needed for Google Drive API
        this.SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file';
        
        // Define keys that should be treated as specific types (same as LocalStorageAdapter)
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
        
        // Initialize Google API
        this.init();
    }
    
    /**
     * Initialize the Google API client
     */
    async init() {
        try {
            // Initialize the tokenClient
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: this.SCOPES,
                callback: async (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        this.accessToken = tokenResponse.access_token;
                        this.isSignedIn = true;
                        
                        // Record successful login for auto-login
                        googleAuthManager.recordSuccessfulLogin();
                        
                        // Ensure save folder exists - await to prevent race conditions
                        try {
                            await this.ensureSaveFolder();
                        } catch (folderError) {
                            console.error('Error ensuring save folder during sign-in:', folderError);
                        }
                        
                        // Dispatch event for successful sign-in
                        window.dispatchEvent(new CustomEvent('google-signin-success'));
                    }
                },
                error_callback: (error) => {
                    console.error('Google Sign-In error:', error);
                    this.isSignedIn = false;
                    this.accessToken = null;
                    
                    // Disable auto-login on error to prevent repeated failures
                    googleAuthManager.setAutoLoginState(false);
                    
                    // Dispatch event for sign-in error
                    window.dispatchEvent(new CustomEvent('google-signin-error', { 
                        detail: { error } 
                    }));
                }
            });
        } catch (error) {
            console.error('Error initializing Google API:', error);
        }
    }
    
    /**
     * Request sign-in with Google
     * @param {boolean} silentMode - Whether to attempt silent sign-in without user interaction
     * @returns {Promise<boolean>} Whether sign-in was successful
     */
    signIn(silentMode = false) {
        return new Promise((resolve) => {
            if (this.isSignedIn) {
                resolve(true);
                return;
            }
            
            // Set up event listeners for sign-in result
            const successListener = () => {
                window.removeEventListener('google-signin-success', successListener);
                window.removeEventListener('google-signin-error', errorListener);
                resolve(true);
            };
            
            const errorListener = () => {
                window.removeEventListener('google-signin-success', successListener);
                window.removeEventListener('google-signin-error', errorListener);
                resolve(false);
            };
            
            window.addEventListener('google-signin-success', successListener);
            window.addEventListener('google-signin-error', errorListener);
            
            // Request access token with appropriate prompt
            if (silentMode) {
                // Use 'none' prompt for silent sign-in (no UI)
                this.tokenClient.requestAccessToken({ prompt: 'none' });
            } else {
                // Default behavior with UI prompt
                this.tokenClient.requestAccessToken();
            }
        });
    }
    
    /**
     * Sign out from Google
     */
    signOut() {
        google.accounts.oauth2.revoke(this.accessToken, () => {
            this.isSignedIn = false;
            this.accessToken = null;
            this.fileCache.clear();
            this.folderId = null;
            this.isFolderCheckInProgress = false;
            this.folderCheckPromise = null;
            
            // Record logout in auth manager
            googleAuthManager.recordLogout();
            
            // Dispatch event for sign-out
            window.dispatchEvent(new CustomEvent('google-signout'));
        });
    }
    
    /**
     * Check if user is signed in
     * @returns {boolean} Whether user is signed in
     */
    isUserSignedIn() {
        return this.isSignedIn && this.accessToken !== null;
    }
    
    /**
     * Ensure the save folder exists in Google Drive
     * @returns {Promise<string>} Folder ID
     */
    async ensureSaveFolder() {
        // If we already have the folder ID, return it immediately
        if (this.folderId) {
            return this.folderId;
        }
        
        // If a folder check is already in progress, wait for it to complete
        if (this.isFolderCheckInProgress) {
            console.debug('Folder check already in progress, waiting for it to complete');
            return this.folderCheckPromise;
        }
        
        // Set the flag to prevent concurrent calls
        this.isFolderCheckInProgress = true;
        
        // Create a promise that will be resolved when the folder check is complete
        this.folderCheckPromise = (async () => {
            try {
                // Double-check if folder ID was set while we were waiting
                if (this.folderId) {
                    return this.folderId;
                }
                
                // Check if folder already exists
                console.debug('Checking for existing MonkJourneySaves folder');
                const response = await fetch(
                    `https://www.googleapis.com/drive/v3/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`
                        }
                    }
                );
                
                const data = await response.json();
                
                if (data.files && data.files.length > 0) {
                    // Use the first folder found
                    this.folderId = data.files[0].id;
                    console.debug(`Found existing folder with ID: ${this.folderId}`);
                    
                    // If multiple folders with the same name exist, delete the extras
                    if (data.files.length > 1) {
                        console.warn(`Found ${data.files.length} '${this.FOLDER_NAME}' folders, keeping only the first one and deleting others`);
                        
                        // Delete extra folders (starting from the second one)
                        for (let i = 1; i < data.files.length; i++) {
                            try {
                                await fetch(
                                    `https://www.googleapis.com/drive/v3/files/${data.files[i].id}`,
                                    {
                                        method: 'DELETE',
                                        headers: {
                                            'Authorization': `Bearer ${this.accessToken}`
                                        }
                                    }
                                );
                                console.debug(`Deleted duplicate folder with ID: ${data.files[i].id}`);
                            } catch (deleteError) {
                                console.error(`Error deleting duplicate folder: ${deleteError}`);
                            }
                        }
                    }
                    
                    return this.folderId;
                }
                
                // Create folder if it doesn't exist
                console.debug(`Creating new '${this.FOLDER_NAME}' folder in Google Drive`);
                const createResponse = await fetch(
                    'https://www.googleapis.com/drive/v3/files',
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: this.FOLDER_NAME,
                            mimeType: 'application/vnd.google-apps.folder'
                        })
                    }
                );
                
                const folder = await createResponse.json();
                this.folderId = folder.id;
                console.debug(`Created new folder with ID: ${this.folderId}`);
                return this.folderId;
            } catch (error) {
                console.error('Error ensuring save folder:', error);
                return null;
            } finally {
                // Reset the flag when done
                this.isFolderCheckInProgress = false;
            }
        })();
        
        return this.folderCheckPromise;
    }
    
    /**
     * Get file ID for the given key
     * @param {string} key - Storage key
     * @returns {Promise<string|null>} File ID or null if not found
     */
    async getFileId(key) {
        // Check cache first
        if (this.fileCache.has(key)) {
            return this.fileCache.get(key);
        }
        
        try {
            const folderId = await this.ensureSaveFolder();
            if (!folderId) {
                return null;
            }
            
            // Get all files with this name, including their creation time
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${key}' and '${folderId}' in parents and trashed=false&fields=files(id,name,createdTime,modifiedTime)`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );
            
            const data = await response.json();
            
            if (data.files && data.files.length > 0) {
                // If multiple files with the same name exist, handle them
                if (data.files.length > 1) {
                    console.debug(`Found ${data.files.length} files with name '${key}', cleaning up duplicates`);
                    
                    // Sort files by modified time (newest first)
                    data.files.sort((a, b) => {
                        return new Date(b.modifiedTime) - new Date(a.modifiedTime);
                    });
                    
                    // Keep the most recently modified file
                    const mostRecentFile = data.files[0];
                    this.fileCache.set(key, mostRecentFile.id);
                    
                    // Delete all other files with the same name
                    for (let i = 1; i < data.files.length; i++) {
                        try {
                            await fetch(
                                `https://www.googleapis.com/drive/v3/files/${data.files[i].id}`,
                                {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${this.accessToken}`
                                    }
                                }
                            );
                            console.debug(`Deleted duplicate file '${key}' with ID: ${data.files[i].id}`);
                        } catch (deleteError) {
                            console.error(`Error deleting duplicate file '${key}': ${deleteError}`);
                        }
                    }
                    
                    return mostRecentFile.id;
                } else {
                    // Just one file found, use it
                    const fileId = data.files[0].id;
                    this.fileCache.set(key, fileId);
                    return fileId;
                }
            }
            
            return null;
        } catch (error) {
            console.error(`Error getting file ID for key ${key}:`, error);
            return null;
        }
    }
    
    /**
     * Save data with the given key
     * @param {string} key - Storage key
     * @param {*} data - Data to store (will be serialized)
     * @returns {Promise<boolean>} Success status
     */
    async saveData(key, data) {
        if (!this.isSignedIn) {
            console.warn('Not signed in to Google Drive');
            return false;
        }
        
        try {
            // Process data based on key type
            let processedData = data;
            
            // For boolean keys, ensure we're storing a boolean
            if (this.booleanKeys.includes(key)) {
                if (typeof data === 'string') {
                    processedData = data === 'true';
                }
            }
            
            // For string keys, ensure we're storing a string
            if (this.stringKeys.includes(key)) {
                processedData = String(data);
            }
            
            // For number keys, ensure we're storing a number
            if (this.numberKeys.includes(key)) {
                if (typeof data === 'string') {
                    processedData = Number(data);
                }
            }
            
            // Serialize the data - use JSON.stringify for all types to ensure proper serialization
            const serializedData = JSON.stringify(processedData);
            const folderId = await this.ensureSaveFolder();
            
            if (!folderId) {
                throw new Error('Could not create or find save folder');
            }
            
            // This will also clean up any duplicate files with the same name
            const fileId = await this.getFileId(key);
            const method = fileId ? 'PATCH' : 'POST';
            const url = fileId 
                ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media` 
                : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
            
            const headers = {
                'Authorization': `Bearer ${this.accessToken}`
            };
            
            let body;
            
            if (fileId) {
                // Update existing file
                headers['Content-Type'] = 'application/json';
                body = serializedData;
            } else {
                // Create new file
                const boundary = '-------314159265358979323846';
                headers['Content-Type'] = `multipart/related; boundary=${boundary}`;
                
                body = 
                    `--${boundary}\r\n` +
                    'Content-Type: application/json\r\n\r\n' +
                    JSON.stringify({
                        name: key,
                        parents: [folderId]
                    }) +
                    `\r\n--${boundary}\r\n` +
                    'Content-Type: application/json\r\n\r\n' +
                    serializedData +
                    `\r\n--${boundary}--`;
            }
            
            const response = await fetch(url, {
                method,
                headers,
                body
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            const responseData = await response.json();
            
            // Update cache with new file ID
            if (!fileId) {
                this.fileCache.set(key, responseData.id);
            }
            
            return true;
        } catch (error) {
            console.error(`Error saving data for key ${key} to Google Drive:`, error);
            return false;
        }
    }
    
    /**
     * Load data for the given key
     * @param {string} key - Storage key
     * @returns {Promise<*>} The loaded data (or null if not found)
     */
    async loadData(key) {
        // If not signed in, return null
        if (!this.isSignedIn) {
            return null;
        }
        
        try {
            const fileId = await this.getFileId(key);
            
            if (!fileId) {
                return null;
            }
            
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            // Get the response text first
            const responseText = await response.text();
            
            // Try to parse the response as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.warn(`Error parsing response as JSON for key ${key}:`, parseError);
                // If parsing fails, use the raw text
                data = responseText;
            }
            
            // Process data based on key type
            if (this.booleanKeys.includes(key)) {
                if (typeof data === 'string') {
                    return data === 'true';
                }
                return Boolean(data);
            }
            
            if (this.stringKeys.includes(key)) {
                return String(data);
            }
            
            if (this.numberKeys.includes(key)) {
                if (typeof data === 'string') {
                    return Number(data);
                }
                return data;
            }
            
            return this.processLoadedData(data);
        } catch (error) {
            console.error(`Error loading data for key ${key} from Google Drive:`, error);
            return null;
        }
    }
    
    /**
     * Delete data for the given key
     * @param {string} key - Storage key
     * @returns {Promise<boolean>} Success status
     */
    async deleteData(key) {
        // If not signed in, we're done
        if (!this.isSignedIn) {
            return false;
        }
        
        try {
            const fileId = await this.getFileId(key);
            
            if (!fileId) {
                return true; // Nothing to delete
            }
            
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            // Remove from cache
            this.fileCache.delete(key);
            
            return true;
        } catch (error) {
            console.error(`Error deleting data for key ${key} from Google Drive:`, error);
            return false;
        }
    }
    
    /**
     * Check if data exists for the given key
     * @param {string} key - Storage key
     * @returns {Promise<boolean>} Whether data exists
     */
    async hasData(key) {
        // If not signed in, return false
        if (!this.isSignedIn) {
            return false;
        }
        
        // Check Google Drive
        try {
            const fileId = await this.getFileId(key);
            return fileId !== null;
        } catch (error) {
            console.error(`Error checking if data exists for key ${key}:`, error);
            return false;
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
}