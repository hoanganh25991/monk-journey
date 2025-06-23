/**
 * GameplayTab.js
 * Manages the gameplay settings tab UI component
 */

import { SettingsTab } from './SettingsTab.js';
import { STORAGE_KEYS } from '../../config/storage-keys.js';
import { DIFFICULTY_SCALING } from '../../config/game-balance.js';

export class GameplayTab extends SettingsTab {
    /**
     * Create a gameplay settings tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('game', game, settingsMenu);
        
        // Game settings elements
        this.difficultySelect = document.getElementById('difficulty-select');
        this.customSkillsCheckbox = document.getElementById('custom-skills-checkbox');
        
        // Camera settings
        this.cameraZoomSlider = document.getElementById('camera-zoom-slider');
        this.cameraZoomValue = document.getElementById('camera-zoom-value');
        
        // New Game button
        this.newGameButton = document.getElementById('new-game-button');
        
        // Release settings elements (moved from ReleaseTab)
        this.updateToLatestButton = document.getElementById('update-to-latest-button');
        this.currentVersionSpan = document.getElementById('current-version');
        
        this.init();
    }
    
    /**
     * Initialize the gameplay settings
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        this.initializeDifficultySettings();
        this.initializeReleaseSettings();
        
        return true;
    }
    
    /**
     * Initialize difficulty settings
     * @private
     */
    initializeDifficultySettings() {
        if (this.difficultySelect) {
            // Clear existing options
            while (this.difficultySelect.options.length > 0) {
                this.difficultySelect.remove(0);
            }
            
            // Add difficulty options from DIFFICULTY_SCALING.difficultyLevels
            for (const [key, settings] of Object.entries(DIFFICULTY_SCALING.difficultyLevels)) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = settings.name;
                this.difficultySelect.appendChild(option);
            }
            
            // Set current difficulty (default to 'basic')
            const currentDifficulty = localStorage.getItem(STORAGE_KEYS.DIFFICULTY) || 'basic';
            console.debug(`Loading difficulty setting: ${currentDifficulty}`);
            this.difficultySelect.value = currentDifficulty;
            
            // If the value wasn't set correctly (e.g., if the stored value is invalid),
            // explicitly set it to 'basic'
            if (!this.difficultySelect.value) {
                console.debug('Invalid difficulty setting detected, defaulting to basic');
                this.difficultySelect.value = 'basic';
                localStorage.setItem(STORAGE_KEYS.DIFFICULTY, 'basic');
            }
            
            // Add change event listener
            this.difficultySelect.addEventListener('change', () => {
                const selectedDifficulty = this.difficultySelect.value;
                localStorage.setItem(STORAGE_KEYS.DIFFICULTY, selectedDifficulty);
                
                // Apply difficulty settings immediately if game is available
                if (this.game && this.game.enemyManager) {
                    this.game.enemyManager.setDifficulty(selectedDifficulty);
                    
                    // Show notification if HUD manager is available
                    if (this.game.hudManager) {
                        const difficultyName = DIFFICULTY_SCALING.difficultyLevels[selectedDifficulty].name;
                        this.game.hudManager.showNotification(`Difficulty changed to ${difficultyName}`);
                    }
                }
            });
        }
        
        if (this.customSkillsCheckbox) {
            // Set current custom skills state (default is false)
            const customSkillsEnabled = localStorage.getItem(STORAGE_KEYS.CUSTOM_SKILLS) === 'true';
            this.customSkillsCheckbox.checked = customSkillsEnabled;
            
            // Add change event listener
            this.customSkillsCheckbox.addEventListener('change', () => {
                localStorage.setItem(STORAGE_KEYS.CUSTOM_SKILLS, this.customSkillsCheckbox.checked);
                
                // Apply custom skills settings immediately if game is available
                if (this.game && this.game.player && this.game.player.skills) {
                    this.game.player.skills.updateCustomSkillsVisibility();
                }
            });
        }
        
        // Initialize camera zoom slider if it exists
        if (this.cameraZoomSlider) {
            // Set min, max and default values
            this.cameraZoomSlider.min = 10;  // Closest zoom (10 units)
            this.cameraZoomSlider.max = 100;  // Furthest zoom (100 units)
            this.cameraZoomSlider.step = 1;  // 1 unit increments
            
            // Get stored zoom value or use default
            const storedZoom = localStorage.getItem(STORAGE_KEYS.CAMERA_ZOOM);
            const defaultZoom = 20; // Default camera distance
            const currentZoom = storedZoom ? parseInt(storedZoom) : defaultZoom;
            
            // Set the slider to the current zoom value
            this.cameraZoomSlider.value = currentZoom;
            
            // Update the display value
            if (this.cameraZoomValue) {
                this.cameraZoomValue.textContent = currentZoom;
            }
            
            // Add event listener for zoom changes
            this.cameraZoomSlider.addEventListener('input', () => {
                const zoomValue = parseInt(this.cameraZoomSlider.value);
                
                // Update the display value
                if (this.cameraZoomValue) {
                    this.cameraZoomValue.textContent = zoomValue;
                }
                
                // Store the zoom value
                localStorage.setItem(STORAGE_KEYS.CAMERA_ZOOM, zoomValue);
                
                // Apply zoom immediately if game is available
                if (this.game && this.game.hudManager && this.game.hudManager.components && this.game.hudManager.components.cameraControlUI) {
                    // Use the new setCameraDistance method
                    this.game.hudManager.components.cameraControlUI.setCameraDistance(zoomValue);
                }
            });
        }
        
        // Initialize New Game button if it exists
        if (this.newGameButton) {
            this.newGameButton.addEventListener('click', () => {
                // Confirm before starting a new game
                if (confirm('Are you sure you want to start a new game? Your current progress will be lost.')) {
                    // Close the settings menu
                    if (this.settingsMenu) {
                        this.settingsMenu.hide();
                    }
                    
                    // Start a new game
                    if (this.game) {
                        console.debug('Starting a new game...');
                        
                        // First, delete all player state data from localStorage
                        if (this.game.saveManager) {
                            console.debug('Removing player state data from localStorage...');
                            const saveDeleted = this.game.saveManager.deleteSave();
                            if (saveDeleted) {
                                console.debug('Player state data successfully removed');
                            } else {
                                console.warn('Failed to remove player state data');
                            }
                        }
                        
                        window.location.reload();
                    }
                }
            });
        }
    }
    
    /**
     * Initialize release settings (moved from ReleaseTab)
     * @private
     */
    async initializeReleaseSettings() {
        // Display current version (simplified)
        if (this.currentVersionSpan) {
            try {
                const version = await this.fetchCacheVersion();
                this.currentVersionSpan.textContent = version;
            } catch (error) {
                console.error('Error setting version display:', error);
                this.currentVersionSpan.textContent = 'Current Version';
            }
        }
        
        // Set up update button with simplified functionality
        if (this.updateToLatestButton) {
            this.updateToLatestButton.addEventListener('click', async () => {
                // Show loading state
                this.updateToLatestButton.textContent = 'Updating...';
                this.updateToLatestButton.disabled = true;
                
                try {
                    // Unregister all service workers
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) {
                            await registration.unregister();
                            console.debug('Service worker unregistered');
                        }
                    }
                    
                    // Clear all caches
                    if ('caches' in window) {
                        const cacheNames = await caches.keys();
                        await Promise.all(
                            cacheNames.map(cacheName => {
                                console.debug(`Deleting cache: ${cacheName}`);
                                return caches.delete(cacheName);
                            })
                        );
                        console.debug('All caches cleared');
                    }
                    
                    // Force reload the page from server (bypass cache)
                    console.debug('Reloading page...');
                    window.location.reload(true);
                } catch (error) {
                    console.error('Error updating to latest version:', error);
                    
                    // Reset button state
                    this.updateToLatestButton.textContent = 'Update to Latest';
                    this.updateToLatestButton.disabled = false;
                    
                    // Show error message
                    alert('Failed to update to the latest version. Please try again later.');
                }
            });
        }
    }
    
    /**
     * Fetch the cache version from the service worker
     * @returns {Promise<string>} - The cache version
     * @private
     */
    async fetchCacheVersion() {
        try {
            // Try to get the cache version from the service worker
            const response = await fetch('service-worker.js');
            if (!response.ok) {
                return 'Current Version';
            }
            
            // Get the text content
            const text = await response.text();
            
            // Extract the cache version using regex
            const versionMatch = text.match(/const CACHE_VERSION = ['"](\d+)['"]/);
            if (versionMatch && versionMatch[1]) {
                return versionMatch[1];
            } else {
                // If we can't find the version, just return a generic message
                return 'Current Version';
            }
        } catch (error) {
            console.error('Error fetching cache version:', error);
            return 'Current Version';
        }
    }
    
    /**
     * Save the gameplay settings
     */
    saveSettings() {
        if (this.difficultySelect) {
            // Save difficulty, defaulting to 'basic' if no valid selection
            const difficulty = this.difficultySelect.value || 'basic';
            localStorage.setItem(STORAGE_KEYS.DIFFICULTY, difficulty);
            
            // Update game difficulty if game is available
            if (this.game) {
                this.game.difficulty = difficulty;
                
                // Apply to enemy manager if available
                if (this.game.enemyManager) {
                    this.game.enemyManager.setDifficulty(difficulty);
                }
            }
        }
        
        if (this.customSkillsCheckbox) {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_SKILLS, this.customSkillsCheckbox.checked);
        }
        
        if (this.cameraZoomSlider) {
            localStorage.setItem(STORAGE_KEYS.CAMERA_ZOOM, this.cameraZoomSlider.value);
        }
    }
    
    /**
     * Reset the gameplay settings to defaults
     */
    resetToDefaults() {
        if (this.difficultySelect) {
            this.difficultySelect.value = 'basic';
            console.debug('Reset difficulty to basic');
        }
        
        if (this.customSkillsCheckbox) {
            this.customSkillsCheckbox.checked = false;
        }
        
        if (this.cameraZoomSlider) {
            this.cameraZoomSlider.value = 20; // Default camera distance
            
            // Update the display value
            if (this.cameraZoomValue) {
                this.cameraZoomValue.textContent = 20;
            }
        }
        
        this.saveSettings();
    }
}