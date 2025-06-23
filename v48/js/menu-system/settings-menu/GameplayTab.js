/**
 * GameplayTab.js
 * Manages the gameplay settings tab UI component
 */

import { SettingsTab } from './SettingsTab.js';
import { STORAGE_KEYS } from '../../config/storage-keys.js';
import { DIFFICULTY_SCALING } from '../../config/game-balance.js';
import storageService from '../../save-manager/StorageService.js';
import googleAuthManager from '../../save-manager/GoogleAuthManager.js';

export class GameplayTab extends SettingsTab {
    /**
     * Create a gameplay settings tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('game', game, settingsMenu);
        
        // Google login elements
        this.googleLoginContainer = null;
        this.loginButton = null;
        this.statusElement = null;
        this.autoLoginContainer = null;
        this.autoLoginCheckbox = null;
        this.isGoogleLoginVisible = false;
        this.googleIcon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMTcuNiA5LjJsLS4xLTEuOEg5djMuNGg0LjhDMTMuNiAxMiAxMyAxMyAxMiAxMy42djIuMmgzYTguOCA4LjggMCAwIDAgMi42LTYuNnoiIGZpbGw9IiM0Mjg1RjQiIGZpbGwtcnVsZT0ibm9uemVybyIvPjxwYXRoIGQ9Ik05IDE4YzIuNCAwIDQuNS0uOCA2LTIuMmwtMy0yLjJhNS40IDUuNCAwIDAgMS04LTIuOUgxVjEzYTkgOSAwIDAgMCA4IDV6IiBmaWxsPSIjMzRBODUzIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNNCAxMC43YTUuNCA1LjQgMCAwIDEgMC0zLjRWNUgxYTkgOSAwIDAgMCAwIDhsMy0yLjN6IiBmaWxsPSIjRkJCQzA1IiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNOSAzLjZjMS4zIDAgMi41LjQgMy40IDEuM0wxNSAyLjNBOSA5IDAgMCAwIDEgNWwzIDIuNGE1LjQgNS40IDAgMCAxIDUtMy43eiIgZmlsbD0iI0VBNDMzNSIgZmlsbC1ydWxlPSJub256ZXJvIi8+PHBhdGggZD0iTTAgMGgxOHYxOEgweiIvPjwvZz48L3N2Zz4=';
        
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
        
        // Initialize settings immediately
        this.init();
        
        // Initialize storage service in background (non-blocking)
        storageService.init().catch(error => {
            console.error('Error initializing storage service:', error);
        });
    }
    
    /**
     * Initialize the gameplay settings
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        this.initializeGoogleLogin();
        this.initializeDifficultySettings();
        this.initializeReleaseSettings();
        
        return true;
    }
    
    /**
     * Handle storage updates from Google Drive sync
     * @param {CustomEvent} event - Storage update event
     */
    handleStorageUpdate(event) {
        const { key, newValue } = event.detail;
        
        // Update UI based on the key that changed
        if (key === STORAGE_KEYS.DIFFICULTY && this.difficultySelect) {
            this.difficultySelect.value = newValue || 'basic';
        } else if (key === STORAGE_KEYS.CUSTOM_SKILLS && this.customSkillsCheckbox) {
            this.customSkillsCheckbox.checked = newValue === true || newValue === 'true';
        } else if (key === STORAGE_KEYS.CAMERA_ZOOM && this.cameraZoomSlider) {
            const zoomValue = parseInt(newValue) || 20;
            this.cameraZoomSlider.value = zoomValue;
            if (this.cameraZoomValue) {
                this.cameraZoomValue.textContent = zoomValue;
            }
        }
    }
    
    /**
     * Initialize Google login UI
     * @private
     */
    initializeGoogleLogin() {
        console.debug('GameplayTab: Initializing Google Login UI');
        
        // Use the existing Google login section in the HTML
        const googleLoginSection = document.getElementById('google-login-section');
        
        if (googleLoginSection) {
            // Get the existing container for Google login elements
            this.googleLoginContainer = googleLoginSection.querySelector('.settings-google-login');
            
            if (this.googleLoginContainer) {
                // Get the existing login button
                this.loginButton = document.getElementById('google-login-button');
                
                if (this.loginButton) {
                    // Add click event listener to the existing button
                    this.loginButton.addEventListener('click', () => this.handleLoginClick());
                }
                
                // Get the existing status element
                this.statusElement = this.googleLoginContainer.querySelector('.google-login-status');
                
                // Get the auto-login container and checkbox
                this.autoLoginContainer = document.getElementById('auto-login-container');
                this.autoLoginCheckbox = document.getElementById('auto-login-checkbox');
                
                if (this.autoLoginCheckbox) {
                    // Set initial state from localStorage
                    this.autoLoginCheckbox.checked = googleAuthManager.getAutoLoginState();
                    
                    // Add change event listener
                    this.autoLoginCheckbox.addEventListener('change', () => {
                        googleAuthManager.setAutoLoginState(this.autoLoginCheckbox.checked);
                    });
                }
                
                // Listen for sign-in/sign-out events
                window.addEventListener('google-signin-success', () => this.updateUI(true));
                window.addEventListener('google-signout', () => this.updateUI(false));
                
                console.debug('GameplayTab: Google Login UI elements initialized');
            } else {
                console.error('GameplayTab: Could not find Google login container');
            }
        } else {
            console.error('GameplayTab: Could not find Google login section');
        }
        
        // Check if already signed in - do this synchronously
        if (this.game.saveManager && this.game.saveManager.isSignedInToGoogle) {
            const isSignedIn = this.game.saveManager.isSignedInToGoogle();
            this.updateUI(isSignedIn);
        }
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
            
            // Set current difficulty synchronously (default to 'basic')
            const currentDifficulty = this.loadSettingSync(STORAGE_KEYS.DIFFICULTY, 'basic');
            
            console.debug(`Loading difficulty setting: ${currentDifficulty}`);
            this.difficultySelect.value = currentDifficulty;
            
            // If the value wasn't set correctly (e.g., if the stored value is invalid),
            // explicitly set it to 'basic'
            if (!this.difficultySelect.value) {
                console.debug('Invalid difficulty setting detected, defaulting to basic');
                this.difficultySelect.value = 'basic';
                this.saveSetting(STORAGE_KEYS.DIFFICULTY, 'basic');
            }
            
            // Add change event listener
            this.difficultySelect.addEventListener('change', () => {
                const selectedDifficulty = this.difficultySelect.value;
                // Store the value using storage service
                this.saveSetting(STORAGE_KEYS.DIFFICULTY, selectedDifficulty);
                
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
            // Set current custom skills state synchronously (default is false)
            const customSkillsEnabled = this.loadSettingSync(STORAGE_KEYS.CUSTOM_SKILLS, false);
            this.customSkillsCheckbox.checked = customSkillsEnabled === true || customSkillsEnabled === 'true';
            
            // Add change event listener
            this.customSkillsCheckbox.addEventListener('change', () => {
                this.saveSetting(STORAGE_KEYS.CUSTOM_SKILLS, this.customSkillsCheckbox.checked.toString());
                
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
            
            // Get stored zoom value synchronously or use default
            const defaultZoom = 20; // Default camera distance
            const storedZoom = this.loadSettingSync(STORAGE_KEYS.CAMERA_ZOOM, defaultZoom);
            const currentZoom = parseInt(storedZoom) || defaultZoom;
            
            // Set the slider to the current zoom value
            this.cameraZoomSlider.value = currentZoom;
            
            // Update the display value
            if (this.cameraZoomValue) {
                this.cameraZoomValue.textContent = currentZoom;
            }
            
            // Add event listener for zoom changes with debounce
            let zoomDebounceTimeout = null;
            this.cameraZoomSlider.addEventListener('input', () => {
                const zoomValue = parseInt(this.cameraZoomSlider.value);
                
                // Update the display value immediately
                if (this.cameraZoomValue) {
                    this.cameraZoomValue.textContent = zoomValue;
                }
                
                // Apply zoom immediately if game is available
                if (this.game && this.game.hudManager && this.game.hudManager.components && this.game.hudManager.components.cameraControlUI) {
                    // Use the new setCameraDistance method
                    this.game.hudManager.components.cameraControlUI.setCameraDistance(zoomValue);
                }
                
                // Clear previous timeout
                if (zoomDebounceTimeout) {
                    clearTimeout(zoomDebounceTimeout);
                }
                
                // Set new timeout for saving
                zoomDebounceTimeout = setTimeout(() => {
                    // Store the zoom value
                    this.saveSetting(STORAGE_KEYS.CAMERA_ZOOM, zoomValue.toString());
                }, 300); // Debounce for 300ms
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
    initializeReleaseSettings() {
        // Display current version (simplified)
        if (this.currentVersionSpan) {
            // Set a default version immediately
            this.currentVersionSpan.textContent = 'Fetching...';
            
            // Fetch the actual version in the background
            this.fetchCacheVersion()
                .then(version => {
                    this.currentVersionSpan.textContent = version;
                })
                .catch(error => {
                    this.currentVersionSpan.textContent = 'Failed to fetch';
                    console.error('Error setting version display:', error);
                });
        }
        
        // Set up update button with simplified functionality
        if (this.updateToLatestButton) {
            this.updateToLatestButton.addEventListener('click', () => {
                // Show loading state
                this.updateToLatestButton.textContent = 'Updating...';
                this.updateToLatestButton.disabled = true;
                
                // Use Promise chain for better error handling
                Promise.resolve()
                    .then(async () => {
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
                    })
                    .catch(error => {
                        console.error('Error updating to latest version:', error);
                        
                        // Reset button state
                        this.updateToLatestButton.textContent = 'Update to Latest';
                        this.updateToLatestButton.disabled = false;
                        
                        // Show error message
                        alert('Failed to update to the latest version. Please try again later.');
                    });
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
     * @returns {Promise<boolean>} - True if save was successful
     */
    async saveSettings() {
        // Create a list of promises for all settings
        const savePromises = [];
        
        if (this.difficultySelect) {
            // Save difficulty, defaulting to 'basic' if no valid selection
            const difficulty = this.difficultySelect.value || 'basic';
            // Store using storage service
            savePromises.push(this.saveSetting(STORAGE_KEYS.DIFFICULTY, difficulty));
            
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
            savePromises.push(this.saveSetting(STORAGE_KEYS.CUSTOM_SKILLS, this.customSkillsCheckbox.checked.toString()));
        }
        
        if (this.cameraZoomSlider) {
            savePromises.push(this.saveSetting(STORAGE_KEYS.CAMERA_ZOOM, parseInt(this.cameraZoomSlider.value).toString()));
        }
        
        // Wait for all saves to complete
        await Promise.all(savePromises);
        return true;
    }
    
    /**
     * Reset the gameplay settings to defaults
     * @returns {Promise<boolean>} - True if reset was successful
     */
    async resetToDefaults() {
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
        
        // Save all the reset values
        return this.saveSettings();
    }
    
    /**
     * Handle login button click
     * @private
     */
    handleLoginClick() {
        // Make sure the UI elements are initialized
        if (!this.googleLoginContainer) {
            this.initializeGoogleLogin();
        }
        
        // Check if button exists before updating it
        if (!this.loginButton) {
            console.debug('GameplayTab: Login button not initialized yet');
            return;
        }
        
        if (this.game.saveManager.isSignedInToGoogle()) {
            // Sign out
            this.game.saveManager.signOutFromGoogle();
        } else {
            // Sign in (interactive mode - false means not silent)
            this.loginButton.disabled = true;
            this.loginButton.textContent = 'Signing in...';
            
            // Use Promise chain for better error handling
            // Use false for silentMode to ensure the user sees the UI
            this.game.saveManager.signInToGoogle(false)
                .then(success => {
                    if (!success && this.loginButton) {
                        this.loginButton.disabled = false;
                        this.loginButton.innerHTML = `
                            <img src="${this.googleIcon}" alt="Google">
                            <span>Sign in with Google</span>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Error signing in to Google:', error);
                    if (this.loginButton) {
                        this.loginButton.disabled = false;
                        this.loginButton.innerHTML = `
                            <img src="${this.googleIcon}" alt="Google">
                            <span>Sign in with Google</span>
                        `;
                    }
                });
        }
    }
    
    /**
     * Update UI based on sign-in status
     * @param {boolean} isSignedIn - Whether user is signed in
     * @private
     */
    updateUI(isSignedIn) {
        // Make sure the UI elements are initialized
        if (!this.googleLoginContainer) {
            this.initializeGoogleLogin();
            return;
        }
        
        // Check if elements exist before updating them
        if (!this.loginButton || !this.statusElement) {
            console.debug('GameplayTab: UI elements not initialized yet');
            return;
        }
        
        if (isSignedIn) {
            // Update login button to show sign out
            this.loginButton.disabled = false;
            this.loginButton.innerHTML = `<span>Sign out</span>`;
            
            // Update status element
            this.statusElement.className = 'google-login-status signed-in';
            this.statusElement.innerHTML = `
                <div class="google-login-name">Syncing data<div class="google-login-sync-indicator"></div></div>
            `;
            this.statusElement.style.display = 'flex';
            
            // Show auto-login container
            if (this.autoLoginContainer) {
                this.autoLoginContainer.style.display = 'flex';
            }
            
            // Update auto-login checkbox
            if (this.autoLoginCheckbox) {
                this.autoLoginCheckbox.checked = googleAuthManager.getAutoLoginState();
            }
        } else {
            // Update login button to show sign in
            this.loginButton.disabled = false;
            this.loginButton.innerHTML = `
                <img src="${this.googleIcon}" alt="Google">
                <span>Sign in with Google</span>
            `;
            
            // Hide status element
            this.statusElement.style.display = 'none';
            
            // Hide auto-login container
            if (this.autoLoginContainer) {
                this.autoLoginContainer.style.display = 'none';
            }
        }
    }
}