/**
 * DebugTab.js
 * Manages the debug settings tab UI component
 */

import { SettingsTab } from './SettingsTab.js';
import { STORAGE_KEYS } from '../../config/storage-keys.js';
import storageService from '../../save-manager/StorageService.js';

export class DebugTab extends SettingsTab {
    /**
     * Create a debug settings tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('debug', game, settingsMenu);
        
        // Debug settings elements
        this.adaptiveCheckbox = document.getElementById('adaptive-checkbox');
        this.showPerformanceInfoCheckbox = document.getElementById('show-debug-info-checkbox');
        this.disableFullScreenCheckbox = document.getElementById('disable-full-screen-checkbox');
        this.logEnabledCheckbox = document.getElementById('log-enabled-checkbox');
        
        // Initialize storage service and tab
        this.initializeTab();
    }
    
    /**
     * Initialize the tab with proper loading state
     */
    initializeTab() {
        try {
            // Initialize settings synchronously
            this.initSettings();
            
            // Initialize storage service in background (non-blocking)
            storageService.init().catch(error => {
                console.error('Error initializing storage service:', error);
            });
        } catch (error) {
            console.error('Error initializing debug tab:', error);
            // Show error in UI if available
            if (this.game && this.game.ui && this.game.ui.notifications) {
                this.game.ui.notifications.show('Error loading debug settings', 'error');
            }
        }
    }
    
    /**
     * Handle storage updates from Google Drive sync
     * @param {CustomEvent} event - Storage update event
     */
    handleStorageUpdate(event) {
        const { key, newValue } = event.detail;
        
        // Update UI based on the key that changed
        if (key === STORAGE_KEYS.ADAPTIVE_QUALITY && this.adaptiveCheckbox) {
            this.adaptiveCheckbox.checked = newValue === true || newValue === 'true';
        } else if (key === STORAGE_KEYS.SHOW_PERFORMANCE_INFO && this.showPerformanceInfoCheckbox) {
            this.showPerformanceInfoCheckbox.checked = newValue === true || newValue === 'true';
        } else if (key === STORAGE_KEYS.DISABLE_FULL_SCREEN && this.disableFullScreenCheckbox) {
            this.disableFullScreenCheckbox.checked = newValue === true || newValue === 'true';
        } else if (key === STORAGE_KEYS.LOG_ENABLED && this.logEnabledCheckbox) {
            this.logEnabledCheckbox.checked = newValue === true || newValue === 'true';
        }
    }
    
    /**
     * Initialize the debug settings
     * @returns {boolean} - True if initialization was successful
     */
    initSettings() {
        if (this.adaptiveCheckbox) {
            // Set current adaptive quality state synchronously
            const adaptiveQuality = this.loadSettingSync(STORAGE_KEYS.ADAPTIVE_QUALITY, true);
            
            // Handle both boolean and string values
            this.adaptiveCheckbox.checked = adaptiveQuality === true || adaptiveQuality === 'true';
            
            // Add change event listener
            this.adaptiveCheckbox.addEventListener('change', () => {
                // Save immediately to localStorage
                this.saveSetting(STORAGE_KEYS.ADAPTIVE_QUALITY, this.adaptiveCheckbox.checked.toString());
                
                // Apply adaptive quality settings immediately if game is available
                if (this.game && this.game.renderer) {
                    this.game.useAdaptiveQuality = this.adaptiveCheckbox.checked;
                }
            });
        }
        
        if (this.showPerformanceInfoCheckbox) {
            // Set current show performance info state synchronously
            const showPerformanceInfo = this.loadSettingSync(STORAGE_KEYS.SHOW_PERFORMANCE_INFO, false);
            
            // Handle both boolean and string values
            this.showPerformanceInfoCheckbox.checked = showPerformanceInfo === true || showPerformanceInfo === 'true';
            
            // Add change event listener
            this.showPerformanceInfoCheckbox.addEventListener('change', () => {
                // Save immediately to localStorage
                this.saveSetting(STORAGE_KEYS.SHOW_PERFORMANCE_INFO, this.showPerformanceInfoCheckbox.checked.toString());
                
                // Apply performance info display settings immediately if game is available
                if (this.game && this.game.ui) {
                    this.game.ui.showPerformanceInfo = this.showPerformanceInfoCheckbox.checked;
                }
            });
        }
        
        if (this.disableFullScreenCheckbox) {
            // Set current disable full screen state synchronously
            const disableFullScreen = this.loadSettingSync(STORAGE_KEYS.DISABLE_FULL_SCREEN, false);
            
            // Handle both boolean and string values
            this.disableFullScreenCheckbox.checked = disableFullScreen === true || disableFullScreen === 'true';
            
            // Add change event listener
            this.disableFullScreenCheckbox.addEventListener('change', () => {
                // Save immediately to localStorage
                this.saveSetting(STORAGE_KEYS.DISABLE_FULL_SCREEN, this.disableFullScreenCheckbox.checked.toString());
                
                // Apply disable full screen settings immediately if game is available
                if (this.game) {
                    this.game.disableFullScreen = this.disableFullScreenCheckbox.checked;
                }
            });
        }
        
        if (this.logEnabledCheckbox) {
            // Set current log enabled state synchronously, default to false for better performance
            const logEnabled = this.loadSettingSync(STORAGE_KEYS.LOG_ENABLED, false);
            
            // Handle both boolean and string values
            this.logEnabledCheckbox.checked = logEnabled === true || logEnabled === 'true';
            
            // Add change event listener
            this.logEnabledCheckbox.addEventListener('change', () => {
                // Save immediately to localStorage
                this.saveSetting(STORAGE_KEYS.LOG_ENABLED, this.logEnabledCheckbox.checked.toString());
                
                // Show a notification that changes will take effect after reload
                if (this.game && this.game.ui && this.game.ui.notifications) {
                    this.game.ui.notifications.show('Log settings will take effect after page reload', 'info');
                }
            });
        }
        
        return true;
    }
    
    /**
     * Called when the tab is activated
     */
    onActivate() {
        // If tab was not fully initialized yet, try again
        if (!this.initialized && !this.isLoading) {
            this.initializeTab();
        }
    }
    
    /**
     * Save the debug settings
     * @returns {Promise<boolean>}
     */
    async saveSettings() {
        // All settings are already saved to localStorage immediately when changed
        // This method just ensures they're synced to Google Drive if needed
        
        // Create a list of promises for all settings
        const savePromises = [];
        
        if (this.adaptiveCheckbox) {
            savePromises.push(this.saveSetting(STORAGE_KEYS.ADAPTIVE_QUALITY, this.adaptiveCheckbox.checked.toString()));
        }
        
        if (this.showPerformanceInfoCheckbox) {
            savePromises.push(this.saveSetting(STORAGE_KEYS.SHOW_PERFORMANCE_INFO, this.showPerformanceInfoCheckbox.checked.toString()));
        }
        
        if (this.disableFullScreenCheckbox) {
            savePromises.push(this.saveSetting(STORAGE_KEYS.DISABLE_FULL_SCREEN, this.disableFullScreenCheckbox.checked.toString()));
        }
        
        if (this.logEnabledCheckbox) {
            savePromises.push(this.saveSetting(STORAGE_KEYS.LOG_ENABLED, this.logEnabledCheckbox.checked.toString()));
        }
        
        // Wait for all saves to complete
        await Promise.all(savePromises);
        return true;
    }
    
    /**
     * Reset the debug settings to defaults
     * @returns {Promise<boolean>}
     */
    async resetToDefaults() {
        return this.withProgress(
            async () => {
                if (this.adaptiveCheckbox) {
                    this.adaptiveCheckbox.checked = true;
                }
                
                if (this.showPerformanceInfoCheckbox) {
                    this.showPerformanceInfoCheckbox.checked = false;
                }
                
                if (this.disableFullScreenCheckbox) {
                    this.disableFullScreenCheckbox.checked = false;
                }
                
                if (this.logEnabledCheckbox) {
                    this.logEnabledCheckbox.checked = false;
                }
                
                // Save the default settings
                await this.saveSettings();
                
                return true;
            },
            'save',
            'Resetting debug settings...'
        );
    }
}