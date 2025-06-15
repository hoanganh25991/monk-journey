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
            
            // Use the pre-defined login modal in the HTML
            return new Promise((resolve) => {
                const modal = document.getElementById('login-modal');
                const messageEl = document.getElementById('login-modal-message');
                const statusEl = document.getElementById('login-modal-status');
                const buttonsContainer = document.getElementById('login-modal-buttons');
                const loginBtn = document.getElementById('login-modal-login-btn');
                const cancelBtn = document.getElementById('login-modal-cancel-btn');
                const loader = modal.querySelector('.login-modal-loader');
                
                // Set the message for enforced login
                messageEl.textContent = 'You previously logged in with Google to save your progress. Would you like to login again to load your saved data?';
                
                // Reset the modal state
                statusEl.textContent = '';
                statusEl.style.display = 'none';
                statusEl.className = 'login-modal-status';
                loader.style.display = 'none';
                
                // Reset buttons
                buttonsContainer.innerHTML = '';
                buttonsContainer.appendChild(loginBtn);
                buttonsContainer.appendChild(cancelBtn);
                loginBtn.disabled = false;
                cancelBtn.disabled = false;
                
                // Update button text
                loginBtn.textContent = 'Login';
                cancelBtn.textContent = 'Start New Game';
                
                // Show the modal
                modal.style.display = 'flex';
                
                // Add event listeners
                const loginHandler = async () => {
                    // Show loading state
                    loginBtn.disabled = true;
                    cancelBtn.disabled = true;
                    loader.style.display = 'block';
                    statusEl.textContent = 'Connecting to Google...';
                    statusEl.style.display = 'block';
                    
                    // Set a timeout to detect if login is taking too long
                    const loginTimeout = setTimeout(() => {
                        statusEl.textContent = 'Login is taking longer than expected. You may need to check your browser popup settings.';
                        statusEl.className = 'login-modal-status error';
                        
                        // Create retry and abort buttons
                        const retryBtn = document.createElement('button');
                        retryBtn.textContent = 'Retry';
                        retryBtn.className = 'retry-btn';
                        
                        const abortBtn = document.createElement('button');
                        abortBtn.textContent = 'Cancel';
                        abortBtn.className = 'abort-btn';
                        
                        // Clear existing buttons
                        buttonsContainer.innerHTML = '';
                        buttonsContainer.appendChild(retryBtn);
                        buttonsContainer.appendChild(abortBtn);
                        
                        // Add event listeners for new buttons
                        const retryHandler = async () => {
                            // Remove the timeout message and buttons
                            statusEl.textContent = 'Retrying connection to Google...';
                            statusEl.className = 'login-modal-status';
                            buttonsContainer.innerHTML = '';
                            
                            // Try login again
                            const success = await this.signInToGoogle(false);
                            
                            if (success) {
                                statusEl.textContent = 'Login successful!';
                                statusEl.className = 'login-modal-status success';
                                setTimeout(() => {
                                    modal.style.display = 'none';
                                    resolve(true);
                                }, 1000);
                            } else {
                                statusEl.textContent = 'Login failed. Please try again later.';
                                statusEl.className = 'login-modal-status error';
                                buttonsContainer.appendChild(retryBtn);
                                buttonsContainer.appendChild(abortBtn);
                            }
                        };
                        
                        const abortHandler = () => {
                            modal.style.display = 'none';
                            // Clear the last login record to prevent future prompts
                            localStorage.removeItem(STORAGE_KEYS.GOOGLE_LAST_LOGIN);
                            resolve(false);
                        };
                        
                        retryBtn.addEventListener('click', retryHandler, { once: true });
                        abortBtn.addEventListener('click', abortHandler, { once: true });
                    }, 15000); // 15 seconds timeout
                    
                    // Attempt to sign in
                    const success = await this.signInToGoogle(false);
                    
                    // Clear the timeout
                    clearTimeout(loginTimeout);
                    
                    if (success) {
                        statusEl.textContent = 'Login successful!';
                        statusEl.className = 'login-modal-status success';
                        setTimeout(() => {
                            modal.style.display = 'none';
                            resolve(true);
                        }, 1000);
                    } else {
                        statusEl.textContent = 'Login failed. Please try again.';
                        statusEl.className = 'login-modal-status error';
                        loginBtn.disabled = false;
                        cancelBtn.disabled = false;
                        loader.style.display = 'none';
                    }
                };
                
                const cancelHandler = () => {
                    modal.style.display = 'none';
                    // Clear the last login record to prevent future prompts
                    localStorage.removeItem(STORAGE_KEYS.GOOGLE_LAST_LOGIN);
                    resolve(false);
                };
                
                // Use once: true to ensure the event listeners are removed after they're used
                loginBtn.addEventListener('click', loginHandler, { once: true });
                cancelBtn.addEventListener('click', cancelHandler, { once: true });
            });
        }
        
        return true; // No login required or already logged in
    }
    
    /**
     * Ensures the user is logged in before proceeding with an operation
     * Shows the login flow if the user is not logged in
     * 
     * @param {boolean} silentMode - Whether to attempt silent login first
     * @param {string} message - Custom message to show in the confirmation dialog
     * @returns {Promise<boolean>} Whether the user is now logged in
     */
    async ensureLogin(silentMode = false, message = null) {
        // Check if already logged in
        if (this.isSignedInToGoogle()) {
            console.debug('User already logged in, proceeding');
            return true;
        }
        
        console.debug('Login required, showing login flow');
        
        // Try silent login first if requested
        if (silentMode && googleAuthManager.shouldAttemptAutoLogin()) {
            console.debug('Attempting silent login first');
            const silentSuccess = await this.signInToGoogle(true);
            
            if (silentSuccess) {
                console.debug('Silent login successful');
                return true;
            }
            
            console.debug('Silent login failed, proceeding to interactive login');
        }
        
        // Use the pre-defined login modal in the HTML
        return new Promise((resolve) => {
            const modal = document.getElementById('login-modal');
            const messageEl = document.getElementById('login-modal-message');
            const statusEl = document.getElementById('login-modal-status');
            const buttonsContainer = document.getElementById('login-modal-buttons');
            const loginBtn = document.getElementById('login-modal-login-btn');
            const cancelBtn = document.getElementById('login-modal-cancel-btn');
            const loader = modal.querySelector('.login-modal-loader');
            
            // Set the custom message if provided
            const defaultMessage = 'This operation requires you to be logged in with Google. Would you like to login now?';
            messageEl.textContent = message || defaultMessage;
            
            // Reset the modal state
            statusEl.textContent = '';
            statusEl.style.display = 'none';
            statusEl.className = 'login-modal-status';
            loader.style.display = 'none';
            
            // Reset buttons
            buttonsContainer.innerHTML = '';
            buttonsContainer.appendChild(loginBtn);
            buttonsContainer.appendChild(cancelBtn);
            loginBtn.disabled = false;
            cancelBtn.disabled = false;
            
            // Update button text
            loginBtn.textContent = 'Login';
            cancelBtn.textContent = 'Cancel';
            
            // Show the modal
            modal.style.display = 'flex';
            
            // Add event listeners
            const loginHandler = async () => {
                // Show loading state
                loginBtn.disabled = true;
                cancelBtn.disabled = true;
                loader.style.display = 'block';
                statusEl.textContent = 'Connecting to Google...';
                statusEl.style.display = 'block';
                
                // Set a timeout to detect if login is taking too long
                const loginTimeout = setTimeout(() => {
                    statusEl.textContent = 'Login is taking longer than expected. You may need to check your browser popup settings.';
                    statusEl.className = 'login-modal-status error';
                    
                    // Create retry and abort buttons
                    const retryBtn = document.createElement('button');
                    retryBtn.textContent = 'Retry';
                    retryBtn.className = 'retry-btn';
                    
                    const abortBtn = document.createElement('button');
                    abortBtn.textContent = 'Cancel';
                    abortBtn.className = 'abort-btn';
                    
                    // Clear existing buttons
                    buttonsContainer.innerHTML = '';
                    buttonsContainer.appendChild(retryBtn);
                    buttonsContainer.appendChild(abortBtn);
                    
                    // Add event listeners for new buttons
                    const retryHandler = async () => {
                        // Remove the timeout message and buttons
                        statusEl.textContent = 'Retrying connection to Google...';
                        statusEl.className = 'login-modal-status';
                        buttonsContainer.innerHTML = '';
                        
                        // Try login again
                        const success = await this.signInToGoogle(false);
                        
                        if (success) {
                            statusEl.textContent = 'Login successful!';
                            statusEl.className = 'login-modal-status success';
                            setTimeout(() => {
                                modal.style.display = 'none';
                                resolve(true);
                            }, 1000);
                        } else {
                            statusEl.textContent = 'Login failed. Please try again later.';
                            statusEl.className = 'login-modal-status error';
                            buttonsContainer.appendChild(retryBtn);
                            buttonsContainer.appendChild(abortBtn);
                        }
                    };
                    
                    const abortHandler = () => {
                        modal.style.display = 'none';
                        resolve(false);
                    };
                    
                    retryBtn.addEventListener('click', retryHandler, { once: true });
                    abortBtn.addEventListener('click', abortHandler, { once: true });
                }, 15000); // 15 seconds timeout
                
                // Attempt to sign in
                const success = await this.signInToGoogle(false);
                
                // Clear the timeout
                clearTimeout(loginTimeout);
                
                if (success) {
                    statusEl.textContent = 'Login successful!';
                    statusEl.className = 'login-modal-status success';
                    setTimeout(() => {
                        modal.style.display = 'none';
                        resolve(true);
                    }, 1000);
                } else {
                    statusEl.textContent = 'Login failed. Please try again.';
                    statusEl.className = 'login-modal-status error';
                    loginBtn.disabled = false;
                    cancelBtn.disabled = false;
                    loader.style.display = 'none';
                }
            };
            
            const cancelHandler = () => {
                modal.style.display = 'none';
                resolve(false);
            };
            
            // Use once: true to ensure the event listeners are removed after they're used
            loginBtn.addEventListener('click', loginHandler, { once: true });
            cancelBtn.addEventListener('click', cancelHandler, { once: true });
        });
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
                
                // Attempt to sign in silently with timeout (true = silent mode)
                const success = await this.signInToGoogleWithTimeout(true, 5000); // 5 second timeout for silent login
                
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
                // Disable auto-login on timeout/error to prevent future hangs
                googleAuthManager.setAutoLoginState(false);
            }
        }
        
        // Then, check if login is required based on previous login history
        // This will only prompt the user if silent login failed and login is required
        // Skip this during initialization to prevent hanging - user can login later via settings
        try {
            const loginResult = await this.enforceLoginIfRequiredWithTimeout(3000); // 3 second timeout
        } catch (error) {
            console.warn('Login enforcement timed out or failed during initialization, skipping:', error);
            // Clear the last login record to prevent future prompts during initialization
            localStorage.removeItem(STORAGE_KEYS.GOOGLE_LAST_LOGIN);
        }
        
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
        console.debug("handleGoogleSignIn")
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
        console.debug("syncFromGoogleDrive")
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
        console.debug("syncToGoogleDrive")
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
            
            // Use the pre-defined conflict modal in the HTML
            return new Promise((resolve) => {
                const modal = document.getElementById('conflict-modal');
                const localDataEl = document.getElementById('conflict-local-data');
                const cloudDataEl = document.getElementById('conflict-cloud-data');
                const useCloudBtn = document.getElementById('conflict-use-cloud-btn');
                const useLocalBtn = document.getElementById('conflict-use-local-btn');
                
                // Set the data previews
                localDataEl.textContent = JSON.stringify(localData).substring(0, 100) + '...';
                cloudDataEl.textContent = JSON.stringify(cloudData).substring(0, 100) + '...';
                
                // Show the modal
                modal.style.display = 'flex';
                
                // Add event listeners
                const useCloudHandler = async () => {
                    this.localStorage.saveData(key, cloudData);
                    console.debug(`Resolved save data conflict by using cloud version`);
                    modal.style.display = 'none';
                    resolve();
                };
                
                const useLocalHandler = async () => {
                    await this.googleDrive.saveData(key, localData);
                    console.debug(`Resolved save data conflict by using local version`);
                    modal.style.display = 'none';
                    resolve();
                };
                
                // Use once: true to ensure the event listeners are removed after they're used
                useCloudBtn.addEventListener('click', useCloudHandler, { once: true });
                useLocalBtn.addEventListener('click', useLocalHandler, { once: true });
            });
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
     * Sign in to Google with timeout to prevent hanging
     * @param {boolean} silentMode - Whether to attempt silent sign-in
     * @param {number} timeoutMs - Timeout in milliseconds
     * @returns {Promise<boolean>} Whether sign-in was successful
     */
    async signInToGoogleWithTimeout(silentMode = false, timeoutMs = 8000) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                console.warn(`Google sign-in timed out after ${timeoutMs}ms`);
                reject(new Error(`Google sign-in timeout after ${timeoutMs}ms`));
            }, timeoutMs);
            
            try {
                const success = await this.signInToGoogle(silentMode);
                clearTimeout(timeoutId);
                resolve(success);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }
    
    /**
     * Enforce login if required with timeout
     * @param {number} timeoutMs - Timeout in milliseconds
     * @returns {Promise<boolean>} Whether login was successful or not required
     */
    async enforceLoginIfRequiredWithTimeout(timeoutMs = 5000) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                console.warn(`Login enforcement timed out after ${timeoutMs}ms`);
                reject(new Error(`Login enforcement timeout after ${timeoutMs}ms`));
            }, timeoutMs);
            
            try {
                const result = await this.enforceLoginIfRequired();
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
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