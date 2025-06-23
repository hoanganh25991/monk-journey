/**
 * PerformanceTab.js
 * Manages the performance settings tab UI component
 */

import { SettingsTab } from './SettingsTab.js';
import { STORAGE_KEYS } from '../../config/storage-keys.js';

export class PerformanceTab extends SettingsTab {
    /**
     * Create a performance settings tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('performance', game, settingsMenu);
        
        // Performance settings elements
        this.qualitySelect = document.getElementById('quality-select');
        this.adaptiveCheckbox = document.getElementById('adaptive-checkbox');
        this.fpsSlider = document.getElementById('fps-slider');
        this.fpsValue = document.getElementById('fps-value');
        this.showPerformanceInfoCheckbox = document.getElementById('show-performance-info-checkbox');
        this.debugModeCheckbox = document.getElementById('debug-mode-checkbox');
        this.logEnabledCheckbox = document.getElementById('log-enabled-checkbox');
        
        this.init();
    }
    
    /**
     * Initialize the performance settings
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        if (this.qualitySelect) {
            // Clear existing options
            while (this.qualitySelect.options.length > 0) {
                this.qualitySelect.remove(0);
            }
            
            // Add quality options
            const qualityLevels = ['ultra'];
            qualityLevels.forEach(level => {
                const option = document.createElement('option');
                option.value = level;
                option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
                this.qualitySelect.appendChild(option);
            });
            
            // Set current quality
            const currentQuality = localStorage.getItem(STORAGE_KEYS.QUALITY_LEVEL) || 'ultra';
            this.qualitySelect.value = currentQuality;
            
            // Add change event listener
            this.qualitySelect.addEventListener('change', () => {
                localStorage.setItem(STORAGE_KEYS.QUALITY_LEVEL, this.qualitySelect.value);
                
                // Apply quality settings immediately if game is available
                if (this.game && this.game.renderer) {
                    this.game.applyQualitySettings(this.qualitySelect.value);
                }
            });
        }
        
        if (this.adaptiveCheckbox) {
            // Set current adaptive quality state
            const adaptiveQuality = localStorage.getItem(STORAGE_KEYS.ADAPTIVE_QUALITY) === 'true';
            this.adaptiveCheckbox.checked = adaptiveQuality;
            
            // Add change event listener
            this.adaptiveCheckbox.addEventListener('change', () => {
                localStorage.setItem(STORAGE_KEYS.ADAPTIVE_QUALITY, this.adaptiveCheckbox.checked);
                
                // Apply adaptive quality settings immediately if game is available
                if (this.game && this.game.renderer) {
                    this.game.useAdaptiveQuality = this.adaptiveCheckbox.checked;
                }
            });
        }
        
        if (this.fpsSlider && this.fpsValue) {
            // Set current target FPS
            const targetFPS = parseInt(localStorage.getItem(STORAGE_KEYS.TARGET_FPS)) || 60;
            this.fpsSlider.value = targetFPS;
            this.fpsValue.textContent = targetFPS;
            
            // Add input event listener
            this.fpsSlider.addEventListener('input', () => {
                const value = parseInt(this.fpsSlider.value);
                this.fpsValue.textContent = value;
                localStorage.setItem(STORAGE_KEYS.TARGET_FPS, value);
                
                // Apply target FPS immediately if game is available
                if (this.game) {
                    this.game.targetFPS = value;
                }
            });
        }
        
        if (this.showPerformanceInfoCheckbox) {
            // Set current show performance info state
            const showPerformanceInfo = localStorage.getItem(STORAGE_KEYS.SHOW_PERFORMANCE_INFO) === 'true';
            this.showPerformanceInfoCheckbox.checked = showPerformanceInfo;
            
            // Add change event listener
            this.showPerformanceInfoCheckbox.addEventListener('change', () => {
                localStorage.setItem(STORAGE_KEYS.SHOW_PERFORMANCE_INFO, this.showPerformanceInfoCheckbox.checked);
                
                // Apply performance info display settings immediately if game is available
                if (this.game && this.game.ui) {
                    this.game.ui.showPerformanceInfo = this.showPerformanceInfoCheckbox.checked;
                }
            });
        }
        
        if (this.debugModeCheckbox) {
            // Set current debug mode state
            const debugMode = localStorage.getItem(STORAGE_KEYS.DEBUG_MODE) === 'true';
            this.debugModeCheckbox.checked = debugMode;
            
            // Add change event listener
            this.debugModeCheckbox.addEventListener('change', () => {
                localStorage.setItem(STORAGE_KEYS.DEBUG_MODE, this.debugModeCheckbox.checked);
                
                // Apply debug mode settings immediately if game is available
                if (this.game) {
                    this.game.debugMode = this.debugModeCheckbox.checked;
                }
            });
        }
        
        if (this.logEnabledCheckbox) {
            // Set current log enabled state, default to false for better performance
            const logEnabled = localStorage.getItem(STORAGE_KEYS.LOG_ENABLED) === 'true';
            this.logEnabledCheckbox.checked = logEnabled;
            
            // Add change event listener
            this.logEnabledCheckbox.addEventListener('change', () => {
                localStorage.setItem(STORAGE_KEYS.LOG_ENABLED, this.logEnabledCheckbox.checked);
                
                // Show a notification that changes will take effect after reload
                if (this.game && this.game.ui && this.game.ui.notifications) {
                    this.game.ui.notifications.show('Log settings will take effect after page reload', 'info');
                }
            });
        }
        
        return true;
    }
    
    /**
     * Save the performance settings
     */
    saveSettings() {
        if (this.qualitySelect) {
            localStorage.setItem(STORAGE_KEYS.QUALITY_LEVEL, this.qualitySelect.value);
        }
        
        if (this.adaptiveCheckbox) {
            localStorage.setItem(STORAGE_KEYS.ADAPTIVE_QUALITY, this.adaptiveCheckbox.checked);
        }
        
        if (this.fpsSlider) {
            localStorage.setItem(STORAGE_KEYS.TARGET_FPS, this.fpsSlider.value);
        }
        
        if (this.showPerformanceInfoCheckbox) {
            localStorage.setItem(STORAGE_KEYS.SHOW_PERFORMANCE_INFO, this.showPerformanceInfoCheckbox.checked);
        }
        
        if (this.debugModeCheckbox) {
            localStorage.setItem(STORAGE_KEYS.DEBUG_MODE, this.debugModeCheckbox.checked);
        }
        
        if (this.logEnabledCheckbox) {
            localStorage.setItem(STORAGE_KEYS.LOG_ENABLED, this.logEnabledCheckbox.checked);
        }
    }
    
    /**
     * Reset the performance settings to defaults
     */
    resetToDefaults() {
        if (this.qualitySelect) {
            this.qualitySelect.value = 'ultra';
        }
        
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
        
        this.saveSettings();
    }
}