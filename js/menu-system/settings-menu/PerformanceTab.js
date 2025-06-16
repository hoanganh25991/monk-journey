/**
 * PerformanceTab.js
 * Manages the performance settings tab UI component
 */

import { SettingsTab } from './SettingsTab.js';
import { STORAGE_KEYS } from '../../config/storage-keys.js';
import storageService from '../../save-manager/StorageService.js';

export class PerformanceTab extends SettingsTab {
    /**
     * Create a performance settings tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('performance', game, settingsMenu);
        
        // Performance settings elements
        this.adaptiveCheckbox = document.getElementById('adaptive-checkbox');
        this.fpsSlider = document.getElementById('fps-slider');
        this.fpsValue = document.getElementById('fps-value');
        this.showPerformanceInfoCheckbox = document.getElementById('show-performance-info-checkbox');
        this.debugModeCheckbox = document.getElementById('debug-mode-checkbox');
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
            console.error('Error initializing performance tab:', error);
            // Show error in UI if available
            if (this.game && this.game.ui && this.game.ui.notifications) {
                this.game.ui.notifications.show('Error loading performance settings', 'error');
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
        } else if (key === STORAGE_KEYS.TARGET_FPS && this.fpsSlider && this.fpsValue) {
            const parsedFPS = parseInt(newValue) || 60;
            this.fpsSlider.value = parsedFPS;
            this.fpsValue.textContent = parsedFPS;
        } else if (key === STORAGE_KEYS.SHOW_PERFORMANCE_INFO && this.showPerformanceInfoCheckbox) {
            this.showPerformanceInfoCheckbox.checked = newValue === true || newValue === 'true';
        } else if (key === STORAGE_KEYS.DEBUG_MODE && this.debugModeCheckbox) {
            this.debugModeCheckbox.checked = newValue === true || newValue === 'true';
        } else if (key === STORAGE_KEYS.LOG_ENABLED && this.logEnabledCheckbox) {
            this.logEnabledCheckbox.checked = newValue === true || newValue === 'true';
        }
    }
    
    /**
     * Initialize the performance settings
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
        
        if (this.fpsSlider && this.fpsValue) {
            // Set current target FPS synchronously
            const targetFPS = this.loadSettingSync(STORAGE_KEYS.TARGET_FPS, 60);
            const parsedFPS = parseInt(targetFPS) || 60;
            this.fpsSlider.value = parsedFPS;
            this.fpsValue.textContent = parsedFPS;
            
            // Add input event listener with debounce
            let fpsDebounceTimeout = null;
            this.fpsSlider.addEventListener('input', () => {
                const value = parseInt(this.fpsSlider.value);
                this.fpsValue.textContent = value;
                
                // Clear previous timeout
                if (fpsDebounceTimeout) {
                    clearTimeout(fpsDebounceTimeout);
                }
                
                // Set new timeout for saving
                fpsDebounceTimeout = setTimeout(() => {
                    // Save immediately to localStorage
                    this.saveSetting(STORAGE_KEYS.TARGET_FPS, value.toString());
                    
                    // Apply target FPS immediately if game is available
                    if (this.game) {
                        this.game.targetFPS = value;
                    }
                }, 300); // Reduced debounce time
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
        
        if (this.debugModeCheckbox) {
            // Set current debug mode state synchronously
            const debugMode = this.loadSettingSync(STORAGE_KEYS.DEBUG_MODE, false);
            
            // Handle both boolean and string values
            this.debugModeCheckbox.checked = debugMode === true || debugMode === 'true';
            
            // Add change event listener
            this.debugModeCheckbox.addEventListener('change', () => {
                // Save immediately to localStorage
                this.saveSetting(STORAGE_KEYS.DEBUG_MODE, this.debugModeCheckbox.checked.toString());
                
                // Apply debug mode settings immediately if game is available
                if (this.game) {
                    this.game.debugMode = this.debugModeCheckbox.checked;
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
     * Save the performance settings
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
        
        if (this.fpsSlider) {
            savePromises.push(this.saveSetting(STORAGE_KEYS.TARGET_FPS, this.fpsSlider.value));
        }
        
        if (this.showPerformanceInfoCheckbox) {
            savePromises.push(this.saveSetting(STORAGE_KEYS.SHOW_PERFORMANCE_INFO, this.showPerformanceInfoCheckbox.checked.toString()));
        }
        
        if (this.debugModeCheckbox) {
            savePromises.push(this.saveSetting(STORAGE_KEYS.DEBUG_MODE, this.debugModeCheckbox.checked.toString()));
        }
        
        if (this.logEnabledCheckbox) {
            savePromises.push(this.saveSetting(STORAGE_KEYS.LOG_ENABLED, this.logEnabledCheckbox.checked.toString()));
        }
        
        // Wait for all saves to complete
        await Promise.all(savePromises);
        return true;
    }
    
    /**
     * Reset the performance settings to defaults
     * @returns {Promise<boolean>}
     */
    async resetToDefaults() {
        return this.withProgress(
            async () => {
                if (this.adaptiveCheckbox) {
                    this.adaptiveCheckbox.checked = true;
                }
                
                if (this.fpsSlider && this.fpsValue) {
                    this.fpsSlider.value = 60;
                    this.fpsValue.textContent = 60;
                }
                
                if (this.showPerformanceInfoCheckbox) {
                    this.showPerformanceInfoCheckbox.checked = false;
                }
                
                if (this.debugModeCheckbox) {
                    this.debugModeCheckbox.checked = false;
                }
                
                if (this.logEnabledCheckbox) {
                    this.logEnabledCheckbox.checked = false;
                }
                
                // Save the default settings
                await this.saveSettings();
                
                return true;
            },
            'save',
            'Resetting performance settings...'
        );
    }
}