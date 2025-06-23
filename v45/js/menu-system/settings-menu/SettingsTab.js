/**
 * SettingsTab.js
 * Base class for all settings tab UI components
 */

import { UIComponent } from '../../UIComponent.js';
import { SaveOperationProgress } from '../../save-manager/utils/SaveOperationProgress.js';
import storageService from '../../save-manager/StorageService.js';

export class SettingsTab extends UIComponent {
    /**
     * Create a new settings tab
     * @param {string} tabId - ID of the tab
     * @param {import('../../game/Game.js').Game} game - Reference to the game instance
     * @param {SettingsMenu} settingsMenu - Reference to the parent settings menu
     */
    constructor(tabId, game, settingsMenu) {
        super(`${tabId}-tab`, game);
        this.tabId = tabId;
        this.settingsMenu = settingsMenu;
        this.isLoading = false;
        this.tabElement = document.getElementById(`${tabId}-tab`);
        
        // Listen for storage updates from Google Drive sync
        window.addEventListener('storage-service-update', this.handleStorageUpdate.bind(this));
    }
    
    /**
     * Handle storage updates from Google Drive sync
     * @param {CustomEvent} event - Storage update event
     */
    handleStorageUpdate(event) {
        // To be implemented by child classes if needed
    }
    
    /**
     * Initialize the tab
     * @returns {Promise<boolean>} - Promise resolving to true if initialization was successful
     */
    async init() {
        return true;
    }
    
    /**
     * Called when the tab is activated
     */
    onActivate() {
        // To be implemented by child classes
    }
    
    /**
     * Called when the tab is deactivated
     */
    onDeactivate() {
        // To be implemented by child classes
    }
    
    /**
     * Save the tab settings
     * @returns {Promise<boolean>} - Promise resolving to true if save was successful
     */
    async saveSettings() {
        // To be implemented by child classes
        return true;
    }
    
    /**
     * Reset the tab settings to defaults
     * @returns {Promise<boolean>} - Promise resolving to true if reset was successful
     */
    async resetToDefaults() {
        // To be implemented by child classes
        return true;
    }
    
    /**
     * Resize the tab content
     */
    resize() {
        // To be implemented by child classes
    }
    
    /**
     * Set the loading state of the tab
     * @param {boolean} isLoading - Whether the tab is loading
     */
    setLoading(isLoading) {
        this.isLoading = isLoading;
        
        if (this.tabElement) {
            if (isLoading) {
                this.tabElement.classList.add('loading');
            } else {
                this.tabElement.classList.remove('loading');
            }
        }
    }
    
    /**
     * Load data synchronously from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key not found
     * @returns {*} The loaded data or default value
     */
    loadSettingSync(key, defaultValue = null) {
        return storageService.loadDataSync(key, defaultValue);
    }
    
    /**
     * Save data to localStorage and sync to cloud in background
     * @param {string} key - Storage key
     * @param {*} value - Value to save
     * @returns {Promise<boolean>} Success status
     */
    async saveSetting(key, value) {
        return storageService.saveData(key, value);
    }
    
    /**
     * Show a loading indicator during an async operation
     * @param {Function} asyncOperation - The async operation to perform
     * @param {string} operationType - Type of operation ('save' or 'load')
     * @param {string} message - Message to display during the operation
     * @returns {Promise<any>} - The result of the async operation
     */
    async withProgress(asyncOperation, operationType = 'load', message = 'Loading settings...') {
        // Create progress indicator
        const progress = new SaveOperationProgress(this.game, operationType);
        
        try {
            // Set loading state
            this.setLoading(true);
            
            // Start progress indicator
            progress.start(message);
            progress.update(message, 30);
            
            // Perform the async operation
            const result = await asyncOperation();
            
            // Update progress
            progress.update(operationType === 'save' ? 'Settings saved!' : 'Settings loaded!', 100);
            
            // Complete the operation
            setTimeout(() => {
                progress.complete();
                this.setLoading(false);
            }, 300);
            
            return result;
        } catch (error) {
            // Show error
            progress.error(`Error ${operationType === 'save' ? 'saving' : 'loading'} settings: ${error.message}`);
            this.setLoading(false);
            throw error;
        }
    }
    
    /**
     * Clean up event listeners
     */
    dispose() {
        window.removeEventListener('storage-service-update', this.handleStorageUpdate.bind(this));
        super.dispose();
    }
}