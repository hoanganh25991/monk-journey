import { LocalStorageAdapter } from './LocalStorageAdapter.js';
import { GoogleDriveAdapter } from './GoogleDriveAdapter.js';
import { STORAGE_KEYS } from '../config/storage-keys.js';
import googleAuthManager from './GoogleAuthManager.js';

/**
 * Centralized storage service for the entire application
 * All storage operations should go through this service
 * 
 * Simplified flow:
 * 1. Always store to localStorage first, async in background to sync to GoogleDrive
 * 2. On first load, when no state in localStorage, try to get from GoogleDrive if the user has signed in
 * 3. For conflict resolution, ask user to choose between localStorage or GoogleDrive version
 * 
 * Optimized for UI components:
 * - Use loadDataSync() for immediate UI rendering without async effects
 * - Use saveData() which saves to localStorage immediately and syncs to cloud in background
 */
export class StorageService {
    /**
     * Create a new StorageService
     * @param {string} googleClientId - Google API client ID
     */
    constructor(googleClientId) {
        this.localStorage = new LocalStorageAdapter();
        this.googleDrive = new GoogleDriveAdapter(googleClientId);
        this.pendingSaves = new Map(); // Track pending save operations
        this.initialized = false;
        this.isSigningIn = false;
        this.autoLoginAttempted = false;
        this.isSyncFromGoogleDrive = false;
        
        // Add event listeners for storage events
        window.addEventListener('storage', this.handleStorageEvent.bind(this));
        
        // Listen for sign-in/sign-out events
        window.addEventListener('google-signin-success', () => {
            this.handleGoogleSignIn();
        });
        
        window.addEventListener('google-signout', () => {
            console.debug('Google sign-out detected');
        });
    }
    
    /**
     * Check if login is required based on previous login history
     * @returns {boolean} Whether login is required
     */
    isLoginRequired() {
        // Check if there was a previous login
        const lastLogin = localStorage.getItem(STORAGE_KEYS.GOOGLE_LAST_LOGIN);
        return lastLogin !== null;
    }
    
    /**
     * Enforce login if previously logged in
     * @returns {Promise<boolean>} Whether the user chose to login or start fresh
     */
    async enforceLoginIfRequired() {
        if (this.isLoginRequired() && !this.isSignedInToGoogle()) {
            console.debug('Previous login detected, enforcing login');
            
            // Ask user to confirm login
            const shouldLogin = confirm(
                'You previously logged in with Google to save your progress.\n\n' +
                'Would you like to login again to load your saved data?\n' +
                'Click OK to login and load your saved data.\n' +
                'Click Cancel to start a new game.'
            );
            
            if (shouldLogin) {
                // User chose to login
                console.debug('User chose to login');
                const success = await this.signInToGoogle(false);
                return success;
            } else {
                // User chose to start fresh
                console.debug('User chose to start fresh');
                // Clear the last login record to prevent future prompts
                localStorage.removeItem(STORAGE_KEYS.GOOGLE_LAST_LOGIN);
                return false;
            }
        }
        
        return true; // No login required or already logged in
    }

    /**
     * Initialize the storage service
     * This is now a lightweight operation since fixExistingData is called in constructor
     * @returns {Promise<void>}
     */
    async init() {
        if (this.initialized) {
            return;
        }
        
        // First, try silent auto-login if not already signed in and auto-login is enabled
        if (!this.autoLoginAttempted && !this.isSignedInToGoogle() && googleAuthManager.shouldAttemptAutoLogin()) {
            this.autoLoginAttempted = true;
            console.debug('Attempting silent auto-login to Google Drive during initialization');
            
            try {
                // Set a flag to indicate we're in the sign-in process
                this.isSigningIn = true;
                
                // Attempt to sign in silently (true = silent mode)
                const success = await this.signInToGoogle(true);
                
                if (success) {
                    console.debug('Silent auto-login successful during initialization');
                    // Wait a moment for the sign-in to complete
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    console.debug('Silent auto-login failed during initialization');
                    // Note: We don't try interactive mode here during initialization
                    // to avoid showing popups during page load
                }
                
                // Clear the signing in flag
                this.isSigningIn = false;
            } catch (error) {
                console.error('Error during auto-login initialization:', error);
                this.isSigningIn = false;
            }
        }
        
        // Then, check if login is required based on previous login history
        // This will only prompt the user if silent login failed and login is required
        const loginResult = await this.enforceLoginIfRequired();
        
        this.initialized = true;
        
        // If user is signed in to Google, try to load data from Google Drive
        // This happens in background and doesn't block UI rendering
        if (this.isSignedInToGoogle()) {
            this.syncFromGoogleDrive().catch(error => {
                console.error('Error syncing from Google Drive during init:', error);
            });
        }
    }
    
    /**
     * Handle Google sign-in success
     * @private
     */
    async handleGoogleSignIn() {
        console.log("handleGoogleSignIn")
        console.debug('Google sign-in detected, syncing data');
        this.isSigningIn = true;
        
        try {
            // First, check if we need to load data from Google Drive
            await this.syncFromGoogleDrive();
            
            // Then, sync local data to Google Drive
            await this.syncToGoogleDrive();
        } catch (error) {
            console.error('Error during Google sign-in sync:', error);
        } finally {
            this.isSigningIn = false;
        }
    }
    
    /**
     * Sync data from Google Drive to localStorage
     * @private
     * @returns {Promise<void>}
     */
    async syncFromGoogleDrive() {
        if (!this.isSignedInToGoogle()) {
            return;
        }
        if (this.isSyncFromGoogleDrive) {
            return
        }
        console.log("syncFromGoogleDrive")
        console.debug('Syncing data from Google Drive to localStorage');
        this.isSyncFromGoogleDrive = true;
        // Define keys that should not be synced from Google Drive
        const localOnlyKeys = [
            STORAGE_KEYS.GOOGLE_LAST_LOGIN,
            STORAGE_KEYS.GOOGLE_AUTO_LOGIN
        ];
        
        // Get all keys from localStorage that start with 'monk_journey_'
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('monk_journey_')) {
                keys.push(key);
            }
        }
        
        // For each key, check if it exists in Google Drive
        const promises = [];
        for (const key of keys) {
            promises.push(new Promise(async (resolve, reject) => {
                try {
                    // Skip keys that should only be stored locally
                    if (localOnlyKeys.includes(key)) {
                        console.debug(`Skipping sync for local-only key: ${key}`);
                    }
                    
                    // Check if the key exists in Google Drive
                    const hasCloudData = await this.googleDrive.hasData(key);
                    
                    if (hasCloudData) {
                        // Check if the key exists in localStorage
                        const hasLocalData = this.localStorage.hasData(key);
                        
                        if (!hasLocalData) {
                            // If the key doesn't exist in localStorage, load it from Google Drive
                            const cloudData = await this.googleDrive.loadData(key);
                            if (cloudData !== null) {
                                this.localStorage.saveData(key, cloudData);
                                console.debug(`Loaded ${key} from Google Drive to localStorage`);
                            }
                        } else {
                            // Both exist - check for conflicts
                            const localData = this.localStorage.loadData(key);
                            const cloudData = await this.googleDrive.loadData(key);
                            
                            // Simple string comparison to detect conflicts
                            const localStr = JSON.stringify(localData);
                            const cloudStr = JSON.stringify(cloudData);
                            
                            if (localStr !== cloudStr) {
                                // Conflict detected - ask user to resolve
                                await this.resolveConflict(key, localData, cloudData);
                            }
                        }
                    }
                    resolve();
                } catch (error) {
                    resolve();
                    console.error(`Error syncing ${key} from Google Drive:`, error);
                }
            }))
        }
        await Promise.all(promises);
        
        // Also check for keys that exist in Google Drive but not in localStorage
        try {
            // This would require listing all files in the Google Drive folder
            // For simplicity, we'll skip this for now
            // In a real implementation, you would list all files in the Google Drive folder
            // and check if they exist in localStorage
        } catch (error) {
            console.error('Error checking for new keys in Google Drive:', error);
        }
    }
    
    /**
     * Sync data from localStorage to Google Drive
     * @private
     * @returns {Promise<void>}
     */
    async syncToGoogleDrive() {
        if (!this.isSignedInToGoogle()) {
            return;
        }
        console.log("syncToGoogleDrive")
        console.debug('Syncing data from localStorage to Google Drive');
        
        // Get all keys from localStorage that start with 'monk_journey_'
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('monk_journey_')) {
                keys.push(key);
            }
        }
        
        // Define keys that should not be synced to Google Drive
        const localOnlyKeys = [
            STORAGE_KEYS.GOOGLE_LAST_LOGIN,
            STORAGE_KEYS.GOOGLE_AUTO_LOGIN
        ];
        
        // Sync each key to Google Drive (except local-only keys)
        const promises = []
        for (const key of keys) {
            promises.push(new Promise(async (resolve, reject) => {
                try {
                    // Skip keys that should only be stored locally
                    if (localOnlyKeys.includes(key)) {
                        console.debug(`Skipping sync for local-only key: ${key}`);
                    }
                    
                    const data = this.localStorage.loadData(key);
                    if (data !== null) {
                        await this.googleDrive.saveData(key, data);
                        console.debug(`Synced ${key} to Google Drive`);
                    }
                    resolve();
                } catch (error) {
                    console.error(`Error syncing ${key} to Google Drive:`, error);
                    resolve();
                }}
            ))
        }
        await Promise.all(promises);
    }
    
    /**
     * Resolve a conflict between localStorage and Google Drive
     * @private
     * @param {string} key - The key with the conflict
     * @param {*} localData - The data from localStorage
     * @param {*} cloudData - The data from Google Drive
     * @returns {Promise<void>}
     */
    async resolveConflict(key, localData, cloudData) {
        console.warn(`Conflict detected for ${key}`);
        
        // Define keys that should only be stored locally
        const localOnlyKeys = [
            STORAGE_KEYS.GOOGLE_LAST_LOGIN,
            STORAGE_KEYS.GOOGLE_AUTO_LOGIN
        ];
        
        // For local-only keys, always use the local version without asking
        if (localOnlyKeys.includes(key)) {
            console.debug(`Using local version for local-only key: ${key}`);
            await this.googleDrive.saveData(key, localData);
            return;
        }
        
        // Special handling for monk_journey_save key
        if (key === STORAGE_KEYS.SAVE_DATA) {
            console.debug(`Special conflict handling for save data: ${key}`);
            
            // If timestamps are equal or not present, show detailed comparison for save data
            const useCloudVersion = confirm(
                `Save data conflict detected!\n\n` +
                `Local save: ${JSON.stringify(localData).substring(0, 32)}...\n` +
                `Cloud save: ${JSON.stringify(cloudData).substring(0, 32)}...\n` +
                `Click OK to use the cloud version, or\n` + 
                `Click Cancel to keep your local version.`
            );
            
            if (useCloudVersion) {
                this.localStorage.saveData(key, cloudData);
                console.debug(`Resolved save data conflict by using cloud version`);
            } else {
                await this.googleDrive.saveData(key, localData);
                console.debug(`Resolved save data conflict by using local version`);
            }
            return;
        } else {
            // Use the local version - sync to cloud
            await this.googleDrive.saveData(key, localData);
            console.debug(`Resolved conflict for ${key} by using local version`);
        }
    }
    
    /**
     * Handle storage events from other tabs/windows
     * @param {StorageEvent} event - Storage event
     */
    handleStorageEvent(event) {
        // Only handle monk_journey keys
        if (event.key && event.key.startsWith('monk_journey_')) {
            // Notify any listeners about the change
            window.dispatchEvent(new CustomEvent('storage-service-update', {
                detail: {
                    key: event.key,
                    newValue: event.newValue,
                    oldValue: event.oldValue
                }
            }));
        }
    }
    
    /**
     * Save data with the given key
     * @param {string} key - Storage key
     * @param {*} data - Data to store
     * @returns {Promise<boolean>} Success status
     */
    async saveData(key, data) {
        // Cancel any pending save for this key
        if (this.pendingSaves.has(key)) {
            clearTimeout(this.pendingSaves.get(key));
            this.pendingSaves.delete(key);
        }
        
        // Define keys that should not be synced to Google Drive
        const localOnlyKeys = [
            STORAGE_KEYS.GOOGLE_LAST_LOGIN,
            STORAGE_KEYS.GOOGLE_AUTO_LOGIN
        ];
        
        try {
            // Always save to localStorage first
            const localSuccess = this.localStorage.saveData(key, data);
            
            // Dispatch event for successful save
            if (localSuccess) {
                window.dispatchEvent(new CustomEvent('storage-service-save', {
                    detail: { key, data }
                }));
            }
            
            // If signed in to Google Drive, sync in background (except for local-only keys)
            if (this.isSignedInToGoogle() && !localOnlyKeys.includes(key)) {
                // Don't await this - let it run in the background
                this.googleDrive.saveData(key, data).catch(error => {
                    console.error(`Error syncing ${key} to Google Drive:`, error);
                });
            } else if (localOnlyKeys.includes(key)) {
                console.debug(`Skipping Google Drive sync for local-only key: ${key}`);
            }
            
            return localSuccess;
        } catch (error) {
            console.error(`Error saving data for key ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Save data with debounce to prevent excessive saves
     * @param {string} key - Storage key
     * @param {*} data - Data to store
     * @param {number} debounceMs - Debounce time in milliseconds
     * @returns {Promise<boolean>} Success status (resolves when save is scheduled)
     */
    debounceSave(key, data, debounceMs = 300) {
        // Define keys that should not be synced to Google Drive
        const localOnlyKeys = [
            STORAGE_KEYS.GOOGLE_LAST_LOGIN,
            STORAGE_KEYS.GOOGLE_AUTO_LOGIN
        ];
        
        // For local-only keys, save immediately without debounce
        if (localOnlyKeys.includes(key)) {
            console.debug(`Immediate save for local-only key: ${key}`);
            return this.saveData(key, data);
        }
        
        return new Promise(resolve => {
            // Cancel any pending save for this key
            if (this.pendingSaves.has(key)) {
                clearTimeout(this.pendingSaves.get(key));
            }
            
            // Schedule a new save
            const timeoutId = setTimeout(async () => {
                this.pendingSaves.delete(key);
                await this.saveData(key, data);
                // No need to resolve here as we already resolved below
            }, debounceMs);
            
            this.pendingSaves.set(key, timeoutId);
            
            // Resolve immediately with true to indicate the save was scheduled
            resolve(true);
        });
    }
    
    /**
     * Load data for the given key
     * @param {string} key - Storage key
     * @returns {Promise<*>} The loaded data (or null if not found)
     */
    async loadData(key) {
        try {
            // Always try localStorage first
            const localData = this.localStorage.loadData(key);
            
            // If data exists in localStorage, return it
            if (localData !== null) {
                return localData;
            }
            
            // If not found in localStorage and signed in to Google Drive, try Google Drive
            if (this.isSignedInToGoogle() && !this.isSigningIn) {
                try {
                    const cloudData = await this.googleDrive.loadData(key);
                    
                    // If found in Google Drive, save to localStorage for future use
                    if (cloudData !== null) {
                        this.localStorage.saveData(key, cloudData);
                        return cloudData;
                    }
                } catch (driveError) {
                    console.error(`Error loading data from Google Drive for key ${key}:`, driveError);
                }
            }
            
            // Not found in either storage
            return null;
        } catch (error) {
            console.error(`Error loading data for key ${key}:`, error);
            return null;
        }
    }

    loadDataSync(key) {
        return this.localStorage.loadData(key);
    }
    
    /**
     * Delete data for the given key
     * @param {string} key - Storage key
     * @returns {Promise<boolean>} Success status
     */
    async deleteData(key) {
        try {
            // Always delete from localStorage
            const localSuccess = this.localStorage.deleteData(key);
            
            // If signed in to Google Drive, also delete there
            if (this.isSignedInToGoogle()) {
                // Don't await this - let it run in the background
                this.googleDrive.deleteData(key).catch(error => {
                    console.error(`Error deleting ${key} from Google Drive:`, error);
                });
            }
            
            // Dispatch event for successful delete
            if (localSuccess) {
                window.dispatchEvent(new CustomEvent('storage-service-delete', {
                    detail: { key }
                }));
            }
            
            return localSuccess;
        } catch (error) {
            console.error(`Error deleting data for key ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Check if data exists for the given key synchronously (localStorage only)
     * @param {string} key - Storage key
     * @returns {boolean} Whether data exists in localStorage
     */
    hasDataSync(key) {
        try {
            return this.localStorage.hasData(key);
        } catch (error) {
            console.error(`Error checking if data exists synchronously for key ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Check if data exists for the given key
     * @param {string} key - Storage key
     * @returns {Promise<boolean>} Whether data exists
     */
    async hasData(key) {
        try {
            // Check localStorage first
            const hasLocalData = this.localStorage.hasData(key);
            
            // If found in localStorage, return true
            if (hasLocalData) {
                return true;
            }
            
            // If not found in localStorage and signed in to Google Drive, check Google Drive
            if (this.isSignedInToGoogle() && !this.isSigningIn) {
                try {
                    return await this.googleDrive.hasData(key);
                } catch (driveError) {
                    console.error(`Error checking if data exists in Google Drive for key ${key}:`, driveError);
                }
            }
            
            // Not found in either storage
            return false;
        } catch (error) {
            console.error(`Error checking if data exists for key ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Sign in to Google Drive
     * @param {boolean} silentMode - Whether to attempt silent sign-in without user interaction
     * @returns {Promise<boolean>} Whether sign-in was successful
     */
    async signInToGoogle(silentMode = false) {
        try {
            // Set flag to indicate we're in the sign-in process
            this.isSigningIn = true;
            
            // Attempt to sign in with the specified mode
            const success = await this.googleDrive.signIn(silentMode);
            
            // If successful, wait a moment for the sign-in to complete
            if (success) {
                // Wait for the sign-in process to complete
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Record successful login for auto-login
                googleAuthManager.recordSuccessfulLogin();
            } else if (silentMode) {
                // If silent mode failed but auto-login is enabled, try interactive mode
                if (googleAuthManager.getAutoLoginState()) {
                    console.debug('Silent sign-in failed, trying interactive sign-in');
                    const interactiveSuccess = await this.googleDrive.signIn(false);
                    
                    if (interactiveSuccess) {
                        // Wait for the sign-in process to complete
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Record successful login for auto-login
                        googleAuthManager.recordSuccessfulLogin();
                        
                        // Clear the signing in flag
                        this.isSigningIn = false;
                        
                        return true;
                    } else {
                        // If interactive sign-in also failed, disable auto-login
                        googleAuthManager.setAutoLoginState(false);
                    }
                }
            } else {
                // If regular sign-in failed, disable auto-login to prevent repeated failures
                googleAuthManager.setAutoLoginState(false);
            }
            
            // Clear the signing in flag
            this.isSigningIn = false;
            
            return success;
        } catch (error) {
            console.error('Error signing in to Google Drive:', error);
            this.isSigningIn = false;
            
            // Disable auto-login on error
            googleAuthManager.setAutoLoginState(false);
            
            return false;
        }
    }
    
    /**
     * Sign out from Google Drive
     */
    signOutFromGoogle() {
        try {
            this.googleDrive.signOut();
        } catch (error) {
            console.error('Error signing out from Google Drive:', error);
        }
    }
    
    /**
     * Check if signed in to Google Drive
     * @returns {boolean} Whether signed in to Google Drive
     */
    isSignedInToGoogle() {
        try {
            return this.googleDrive.isUserSignedIn();
        } catch (error) {
            console.error('Error checking if signed in to Google Drive:', error);
            return false;
        }
    }
}

// Create a singleton instance
const storageService = new StorageService(
    '1070303484277-ssbjoks5dqt7pdh5n887t3fkofm2cssf.apps.googleusercontent.com'
);

export default storageService;