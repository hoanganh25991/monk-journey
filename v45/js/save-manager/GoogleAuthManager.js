/**
 * GoogleAuthManager.js
 * Manages Google authentication state and auto-login functionality
 */

import { STORAGE_KEYS } from '../config/storage-keys.js';
import storageService from './StorageService.js';

/**
 * Class to manage Google authentication state and auto-login
 */
export class GoogleAuthManager {
    /**
     * Create a new GoogleAuthManager
     */
    constructor() {
        this.AUTO_LOGIN_KEY = STORAGE_KEYS.GOOGLE_AUTO_LOGIN || 'monk_journey_google_auto_login';
        this.LAST_LOGIN_KEY = STORAGE_KEYS.GOOGLE_LAST_LOGIN || 'monk_journey_google_last_login';
        this.isAutoLoginEnabled = this.getAutoLoginState();
    }

    /**
     * Check if auto-login is enabled
     * @returns {boolean} Whether auto-login is enabled
     */
    getAutoLoginState() {
        const autoLogin = localStorage.getItem(this.AUTO_LOGIN_KEY);
        return autoLogin === 'true';
    }

    /**
     * Set auto-login state
     * @param {boolean} enabled - Whether auto-login should be enabled
     */
    setAutoLoginState(enabled) {
        localStorage.setItem(this.AUTO_LOGIN_KEY, enabled.toString());
        this.isAutoLoginEnabled = enabled;
    }

    /**
     * Record successful login
     */
    recordSuccessfulLogin() {
        localStorage.setItem(this.LAST_LOGIN_KEY, Date.now().toString());
        this.setAutoLoginState(true);
    }

    /**
     * Record logout
     */
    recordLogout() {
        this.setAutoLoginState(false);
        localStorage.removeItem(this.LAST_LOGIN_KEY);
    }

    /**
     * Check if auto-login should be attempted
     * @returns {boolean} Whether auto-login should be attempted
     */
    shouldAttemptAutoLogin() {
        return this.getAutoLoginState();
    }

    /**
     * Attempt auto-login
     * @returns {Promise<boolean>} Whether auto-login was successful
     */
    async attemptAutoLogin() {
        if (!this.shouldAttemptAutoLogin()) {
            console.debug('Auto-login is disabled, skipping');
            return false;
        }

        try {
            console.debug('Attempting silent auto-login to Google Drive');
            // Use silent mode (true) to avoid showing the popup
            const success = await storageService.signInToGoogle(true);
            
            if (success) {
                console.debug('Silent auto-login successful');
                return true;
            } else {
                console.debug('Silent auto-login failed');
                // Note: We don't disable auto-login here because the StorageService
                // will try interactive mode if silent mode fails
                return false;
            }
        } catch (error) {
            console.error('Error during auto-login:', error);
            return false;
        }
    }
}

// Create a singleton instance
const googleAuthManager = new GoogleAuthManager();

export default googleAuthManager;