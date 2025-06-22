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
        
        // UI settings
        this.showMinimapCheckbox = document.getElementById('show-minimap-checkbox');
        
        // FPS settings (moved from PerformanceTab)
        this.fpsSlider = document.getElementById('fps-slider');
        this.fpsValue = document.getElementById('fps-value');
        
        // Material quality settings
        this.materialQualitySelect = document.getElementById('material-quality-select');
        
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
        
        // Material quality is now applied only during game initialization
        // No need to apply it here as it's handled during game startup
        
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
        } else if (key === STORAGE_KEYS.TARGET_FPS && this.fpsSlider && this.fpsValue) {
            const parsedFPS = parseInt(newValue) || 120;
            this.fpsSlider.value = parsedFPS;
            this.fpsValue.textContent = parsedFPS;
        } else if (key === STORAGE_KEYS.QUALITY_LEVEL && this.materialQualitySelect) {
            this.materialQualitySelect.value = newValue || 'medium';
        } else if (key === STORAGE_KEYS.SHOW_MINIMAP && this.showMinimapCheckbox) {
            this.showMinimapCheckbox.checked = newValue === true || newValue === 'true';
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
            // Set current custom skills state synchronously (default is true)
            const customSkillsEnabled = this.loadSettingSync(STORAGE_KEYS.CUSTOM_SKILLS, true);
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
        
        // Initialize FPS slider if it exists (moved from PerformanceTab)
        if (this.fpsSlider && this.fpsValue) {
            // Set current target FPS synchronously
            const targetFPS = this.loadSettingSync(STORAGE_KEYS.TARGET_FPS, 120);
            const parsedFPS = parseInt(targetFPS) || 120;
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
                    if (this.game && this.game.setTargetFPS) {
                        this.game.setTargetFPS(value);
                    }
                }, 300); // Reduced debounce time
            });
        }
        
        // Initialize minimap visibility checkbox if it exists
        if (this.showMinimapCheckbox) {
            // Set current minimap visibility state synchronously (default is true)
            const showMinimap = this.loadSettingSync(STORAGE_KEYS.SHOW_MINIMAP, true);
            this.showMinimapCheckbox.checked = showMinimap === true || showMinimap === 'true';
            
            // Add change event listener
            this.showMinimapCheckbox.addEventListener('change', () => {
                const isVisible = this.showMinimapCheckbox.checked;
                this.saveSetting(STORAGE_KEYS.SHOW_MINIMAP, isVisible.toString());
                
                // Apply minimap visibility immediately if game is available
                if (this.game && this.game.hudManager && this.game.hudManager.components && this.game.hudManager.components.miniMapUI) {
                    if (isVisible) {
                        this.game.hudManager.components.miniMapUI.show();
                    } else {
                        this.game.hudManager.components.miniMapUI.hide();
                    }
                    
                    // Show notification
                    if (this.game.hudManager) {
                        this.game.hudManager.showNotification(`Mini map ${isVisible ? 'enabled' : 'disabled'}`);
                    }
                }
            });
        }
        
        // Initialize material quality select if it exists
        if (this.materialQualitySelect) {
            // Clear existing options
            while (this.materialQualitySelect.options.length > 0) {
                this.materialQualitySelect.remove(0);
            }
            
            // Define material quality options (4 levels)
            const materialQualityOptions = [
                { value: 'high', name: 'High Quality (PBR Materials)' },
                { value: 'medium', name: 'Medium Quality (Phong Materials)' },
                { value: 'low', name: 'Low Quality (Optimized for Low-End Devices)' },
                { value: 'minimal', name: '8-Bit Retro Mode (Pixelated Graphics)' }
            ];
            
            // Add material quality options
            for (const option of materialQualityOptions) {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.name;
                this.materialQualitySelect.appendChild(optionElement);
            }
            
            // Set current material quality (default to 'high')
            const currentMaterialQuality = this.loadSettingSync(STORAGE_KEYS.QUALITY_LEVEL, 'high');
            
            console.debug(`Loading material quality setting: ${currentMaterialQuality}`);
            this.materialQualitySelect.value = currentMaterialQuality;
            
            // If the value wasn't set correctly, explicitly set it to 'high'
            if (!this.materialQualitySelect.value) {
                console.debug('Invalid material quality setting detected, defaulting to high');
                this.materialQualitySelect.value = 'high';
                this.saveSetting(STORAGE_KEYS.QUALITY_LEVEL, 'high');
            }
            
            // Add change event listener
            this.materialQualitySelect.addEventListener('change', () => {
                const selectedQuality = this.materialQualitySelect.value;
                // Store the value using storage service
                this.saveSetting(STORAGE_KEYS.QUALITY_LEVEL, selectedQuality);
                // Close the settings menu if it exists
                if (this.settingsMenu) {
                    this.settingsMenu.hide();
                }
                
                // Set a short timeout to allow the notification to be seen
                setTimeout(() => {
                    // Reload the page to apply the new material quality
                    window.location.reload();
                }, 1500);
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
        
        if (this.fpsSlider) {
            savePromises.push(this.saveSetting(STORAGE_KEYS.TARGET_FPS, parseInt(this.fpsSlider.value).toString()));
        }
        
        if (this.materialQualitySelect) {
            const materialQuality = this.materialQualitySelect.value || 'high';
            savePromises.push(this.saveSetting(STORAGE_KEYS.MATERIAL_QUALITY, materialQuality));
            
            // Material quality will be applied on next game start
            // No need to apply it dynamically here
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
        
        if (this.fpsSlider && this.fpsValue) {
            this.fpsSlider.value = 120; // Default FPS
            this.fpsValue.textContent = 120;
        }
        
        if (this.materialQualitySelect) {
            this.materialQualitySelect.value = 'medium'; // Default to high quality
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
     * Apply material quality settings to all objects in the scene
     * @param {string} quality - The quality level ('high', 'medium', or 'low')
     * @private
     */
    applyMaterialQuality(quality) {
        if (!this.game || !this.game.scene) {
            console.warn('Cannot apply material quality: game or scene not available');
            return;
        }
        
        console.debug(`Applying material quality: ${quality}`);
        
        // Traverse all objects in the scene
        this.game.scene.traverse(object => {
            // Skip objects without materials
            if (!object.material) return;
            
            // Handle arrays of materials
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            
            materials.forEach(material => {
                // Skip materials that don't need modification
                if (!material || material.userData.isUI) return;
                
                // Store original material type if not already stored
                if (!material.userData.originalType) {
                    material.userData.originalType = material.type;
                    
                    // Store original material properties
                    if (material.map) material.userData.map = material.map;
                    if (material.normalMap) material.userData.normalMap = material.normalMap;
                    if (material.roughnessMap) material.userData.roughnessMap = material.roughnessMap;
                    if (material.metalnessMap) material.userData.metalnessMap = material.metalnessMap;
                    if (material.emissiveMap) material.userData.emissiveMap = material.emissiveMap;
                    if (material.aoMap) material.userData.aoMap = material.aoMap;
                    
                    // Store original colors
                    if (material.color) material.userData.color = material.color.clone();
                    if (material.emissive) material.userData.emissive = material.emissive.clone();
                }
                
                // Apply quality settings
                switch (quality) {
                    case 'high':
                        // Restore original material type and properties
                        this.restoreOriginalMaterial(material);
                        break;
                        
                    case 'medium':
                        // Convert to MeshPhongMaterial (simpler than PBR but still has specular highlights)
                        this.convertToPhongMaterial(material);
                        break;
                        
                    case 'low':
                        // Convert to MeshBasicMaterial (no lighting calculations)
                        this.convertToBasicMaterial(material);
                        break;
                        
                    default:
                        console.warn(`Unknown material quality: ${quality}`);
                }
                
                // Mark material for update
                material.needsUpdate = true;
            });
        });
        
        // Force renderer to update
        if (this.game.renderer) {
            this.game.renderer.renderLists.dispose();
        }
    }
    
    /**
     * Restore original material properties
     * @param {THREE.Material} material - The material to restore
     * @private
     */
    restoreOriginalMaterial(material) {
        if (!material.userData.originalType) return;
        
        // No need to change if already the correct type
        if (material.type === material.userData.originalType) return;
        
        // Create new material of original type
        const originalType = material.userData.originalType;
        let newMaterial;
        
        // Import THREE dynamically
        import('three').then(THREE => {
            // Create appropriate material based on original type
            switch (originalType) {
                case 'MeshStandardMaterial':
                    newMaterial = new THREE.MeshStandardMaterial();
                    break;
                case 'MeshPhysicalMaterial':
                    newMaterial = new THREE.MeshPhysicalMaterial();
                    break;
                case 'MeshPhongMaterial':
                    newMaterial = new THREE.MeshPhongMaterial();
                    break;
                case 'MeshLambertMaterial':
                    newMaterial = new THREE.MeshLambertMaterial();
                    break;
                default:
                    console.warn(`Unknown original material type: ${originalType}`);
                    return;
            }
            
            // Copy basic properties
            newMaterial.name = material.name;
            newMaterial.transparent = material.transparent;
            newMaterial.opacity = material.opacity;
            newMaterial.side = material.side;
            
            // Restore maps
            if (material.userData.map) newMaterial.map = material.userData.map;
            if (material.userData.normalMap) newMaterial.normalMap = material.userData.normalMap;
            if (material.userData.roughnessMap) newMaterial.roughnessMap = material.userData.roughnessMap;
            if (material.userData.metalnessMap) newMaterial.metalnessMap = material.userData.metalnessMap;
            if (material.userData.emissiveMap) newMaterial.emissiveMap = material.userData.emissiveMap;
            if (material.userData.aoMap) newMaterial.aoMap = material.userData.aoMap;
            
            // Restore colors
            if (material.userData.color) newMaterial.color.copy(material.userData.color);
            if (material.userData.emissive) newMaterial.emissive.copy(material.userData.emissive);
            
            // Copy userData
            newMaterial.userData = material.userData;
            
            // Replace material
            Object.assign(material, newMaterial);
        });
    }
    
    /**
     * Convert material to MeshPhongMaterial (medium quality)
     * @param {THREE.Material} material - The material to convert
     * @private
     */
    convertToPhongMaterial(material) {
        // No need to change if already a phong material
        if (material.type === 'MeshPhongMaterial') return;
        
        // Import THREE dynamically
        import('three').then(THREE => {
            // Create new phong material
            const phongMaterial = new THREE.MeshPhongMaterial();
            
            // Copy basic properties
            phongMaterial.name = material.name;
            phongMaterial.transparent = material.transparent;
            phongMaterial.opacity = material.opacity;
            phongMaterial.side = material.side;
            
            // Copy maps (only those supported by MeshPhongMaterial)
            if (material.map) phongMaterial.map = material.map;
            if (material.normalMap) phongMaterial.normalMap = material.normalMap;
            if (material.emissiveMap) phongMaterial.emissiveMap = material.emissiveMap;
            
            // Copy colors
            if (material.color) phongMaterial.color.copy(material.color);
            if (material.emissive) phongMaterial.emissive.copy(material.emissive);
            
            // Set reasonable shininess
            phongMaterial.shininess = 30;
            
            // Copy userData
            phongMaterial.userData = material.userData;
            
            // Replace material
            Object.assign(material, phongMaterial);
        });
    }
    
    /**
     * Convert material to MeshBasicMaterial (low quality)
     * @param {THREE.Material} material - The material to convert
     * @private
     */
    convertToBasicMaterial(material) {
        // No need to change if already a basic material
        if (material.type === 'MeshBasicMaterial') return;
        
        // Import THREE dynamically
        import('three').then(THREE => {
            // Create new basic material
            const basicMaterial = new THREE.MeshBasicMaterial();
            
            // Copy basic properties
            basicMaterial.name = material.name;
            basicMaterial.transparent = material.transparent;
            basicMaterial.opacity = material.opacity;
            basicMaterial.side = material.side;
            
            // Only use color map
            if (material.map) basicMaterial.map = material.map;
            
            // Copy color
            if (material.color) basicMaterial.color.copy(material.color);
            
            // Copy userData
            basicMaterial.userData = material.userData;
            
            // Replace material
            Object.assign(material, basicMaterial);
        });
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