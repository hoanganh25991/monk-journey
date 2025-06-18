import { ISaveSystem } from './ISaveSystem.js';
import { PlayerSerializer } from './serializers/PlayerSerializer.js';
import { QuestSerializer } from './serializers/QuestSerializer.js';
import { SettingsSerializer } from './serializers/SettingsSerializer.js';
import { InventorySerializer } from './serializers/InventorySerializer.js';
import { SaveOperationProgress } from './utils/SaveOperationProgress.js';
import { STORAGE_KEYS } from '../config/storage-keys.js';
import storageService from './StorageService.js';

/**
 * SaveManager implementation using StorageService
 * Handles saving and loading game state with progress indicators
 */
export class SaveManager extends ISaveSystem {
    /**
     * Create a new SaveManager
     * @param {Object} game - The game object
     */
    constructor(game) {
        super();
        this.game = game;
        
        // Create progress indicators
        this.saveProgress = new SaveOperationProgress(game, 'save');
        this.loadProgress = new SaveOperationProgress(game, 'load');
        this.saveKey = STORAGE_KEYS.SAVE_DATA;
        this.chunkSaveKeyPrefix = STORAGE_KEYS.CHUNK_PREFIX;
        this.autoSaveInterval = 60_000; // Auto-save every minute (reduced frequency)
        this.autoSaveTimer = null;
        this.lastSaveLevel = 0; // Track player level at last save
        this.lastSaveTime = 0; // Track time of last save
        this.minTimeBetweenSaves = 60_000; // Minimum minute between saves
        
        // Use the centralized storage service directly
        this.storage = storageService;
        
        // Current save version
        this.currentVersion = '1.1.0';
    }
    
    /**
     * Initialize the save system
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        // Initialize the storage service
        await storageService.init();
        
        // Start auto-save timer
        this.startAutoSave();
        
        // No need to load chunk index anymore since we're only saving hero data
        
        return true;
    }
    
    /**
     * Start auto-save functionality
     */
    startAutoSave() {
        // Clear existing timer if any
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        // Set up new timer
        this.autoSaveTimer = setInterval(() => {
            // Use async saveGame method
            this.saveGame(false, true).catch(error => {
                console.error('Auto-save failed:', error);
            });
        }, this.autoSaveInterval);
    }
    
    /**
     * Stop auto-save functionality
     */
    stopAutoSave() {
        // Clear timer
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    
    /**
     * Save the current game state with progress indicator
     * Only saves hero information (player data, quests, settings)
     * @param {boolean} forceSave - Whether to force save regardless of conditions
     * @param {boolean} autoSave - Whether this is an automatic save
     * @param {boolean} requireCloudSave - Whether to ensure cloud save by requiring login
     * @returns {Promise<boolean>} Promise resolving to success status
     */
    async saveGame(forceSave = false, autoSave = false, requireCloudSave = false) {
        try {
            const currentTime = Date.now();
            const playerLevel = this.game.player.stats.level;
            
            // Check if we should save based on time passed
            const timeSinceLastSave = currentTime - this.lastSaveTime;
            const enoughTimePassed = timeSinceLastSave > this.minTimeBetweenSaves;
            
            if (!forceSave && !enoughTimePassed) {
                console.debug('Skipping save - not enough time passed since last save');
                return true; // Skip saving but return success
            }
            
            // If cloud save is required, ensure the user is logged in
            if (requireCloudSave && !autoSave) {
                const isLoggedIn = await this.ensureLogin(true, 
                    'To save your progress to the cloud, you need to be logged in with Google.\n\n' +
                    'Would you like to login now?\n' +
                    'Click OK to login and save to the cloud.\n' +
                    'Click Cancel to save locally only.'
                );
                
                if (!isLoggedIn) {
                    console.debug('User chose not to login for cloud save, continuing with local save only');
                    // We'll still save locally, so we continue with the save process
                }
            }

            // Initialize progress indicator
            !autoSave && this.saveProgress.start('Preparing to save hero data...');
            
            // Create save data object (only hero-related data)
            !autoSave && this.saveProgress.update('Collecting player data...', 15);
            !autoSave && await this.delay(50); // Small delay for UI update
            
            const playerData = PlayerSerializer.serialize(this.game.player);
            
            !autoSave && this.saveProgress.update('Collecting inventory data...', 30);
            !autoSave && await this.delay(50); // Small delay for UI update
            
            const inventoryData = InventorySerializer.serialize(this.game.player);
            
            !autoSave && this.saveProgress.update('Collecting quest data...', 45);
            !autoSave && await this.delay(50); // Small delay for UI update
            
            const questData = QuestSerializer.serialize(this.game.questManager);
            
            !autoSave && this.saveProgress.update('Collecting settings...', 60);
            !autoSave && await this.delay(50); // Small delay for UI update
            
            const settingsData = SettingsSerializer.serialize(this.game);
            
            const saveData = {
                player: playerData,
                inventory: inventoryData,
                quests: questData,
                settings: settingsData,
                timestamp: currentTime,
                version: this.currentVersion
            };
            
            !autoSave && this.saveProgress.update('Writing hero data to storage...', 80);
            !autoSave && await this.delay(10); // Small delay for UI update
        
            // Save to storage (now async)
            const success = await this.storage.saveData(this.saveKey, saveData);
            
            if (!success) {
                throw new Error('Failed to save hero data');
            }
            
            this.lastSaveTime = currentTime;
            this.lastSaveLevel = playerLevel;
            
            // Show appropriate message based on login status
            if (!autoSave) {
                if (this.isSignedInToGoogle()) {
                    this.saveProgress.update('Save complete! Your progress is saved to the cloud.', 100);
                } else {
                    this.saveProgress.update('Save complete! (Local save only)', 100);
                }
                await this.delay(10); // Show completion for a moment
            }
            
            console.debug('Hero data saved successfully');
            
            // Complete the progress indicator
            this.saveProgress.complete();
            
            return true;
        } catch (error) {
            console.debug('Error saving hero data: ' + error.message, 'error');
            
            // Show error in progress indicator
            this.saveProgress.error('Failed to save hero data: ' + error.message);
            
            return false;
        }
    }
    
    /**
     * Helper method to introduce a small delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after the delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Load a saved game with progress indicator
     * Only loads hero-related data (player, quests, settings)
     * @returns {Promise<boolean>} Promise resolving to success status
     */
    async loadGame() {
        try {
            // Initialize progress indicator
            this.loadProgress.start('Preparing to load hero data...');
            
            // Get save data from storage
            this.loadProgress.update('Reading save data...', 20);
            await this.delay(10); // Small delay for UI update
            
            const saveData = await this.storage.loadData(this.saveKey);
            
            // Check if save data exists
            if (!saveData) {
                console.debug('No save data found');
                this.loadProgress.update('No save data found, continuing with new game', 100);
                await this.delay(10);
                this.loadProgress.complete();
                return false;
            }
            
            this.loadProgress.update('Validating save data...', 30);
            await this.delay(10); // Small delay for UI update
            
            console.debug('Save data parsed successfully: ' + Object.keys(saveData).join(', '));
            
            // Check version compatibility
            if (saveData.version !== this.currentVersion) {
                console.debug('Save data version mismatch, some data may not load correctly', 'warn');
                this.loadProgress.update('Warning: Save data version mismatch', 35);
            }
            
            // Clear existing enemies
            this.loadProgress.update('Clearing enemies...', 40);
            await this.delay(10); // Small delay for UI update
            
            if (this.game.enemyManager) {
                this.game.enemyManager.removeAllEnemies();
            } else {
                console.debug('Enemy manager not found, skipping enemy removal', 'warn');
            }
            
            // Load player data
            this.loadProgress.update('Loading player data...', 45);
            await this.delay(150); // Small delay for UI update
            
            if (saveData.player) {
                console.debug('Loading player data...');
                PlayerSerializer.deserialize(this.game.player, saveData.player);
            } else {
                console.debug('No player data found in save', 'warn');
                this.loadProgress.update('Warning: No player data found', 50);
            }
            
            // Load inventory data
            this.loadProgress.update('Loading inventory data...', 55);
            await this.delay(150); // Small delay for UI update
            
            if (saveData.inventory) {
                console.debug('Loading inventory data...');
                InventorySerializer.deserialize(this.game.player, saveData.inventory);
            } else {
                console.debug('No inventory data found in save', 'warn');
                this.loadProgress.update('Warning: No inventory data found', 60);
            }
            
            // Load quest data
            this.loadProgress.update('Loading quest data...', 65);
            await this.delay(150); // Small delay for UI update
            
            if (saveData.quests) {
                console.debug('Loading quest data...');
                QuestSerializer.deserialize(this.game.questManager, saveData.quests);
            } else {
                console.debug('No quest data found in save', 'warn');
                this.loadProgress.update('Warning: No quest data found', 75);
            }
            
            // Continue Game settings - handle errors separately to prevent blocking game load
            this.loadProgress.update('Loading game settings...', 85);
            await this.delay(10); // Small delay for UI update
            
            if (saveData.settings) {
                console.debug('Loading game settings...');
                try {
                    SettingsSerializer.deserialize(this.game, saveData.settings);
                } catch (settingsError) {
                    console.debug('Error loading game settings: ' + settingsError.message, 'error');
                    this.loadProgress.update('Warning: Error loading settings', 90);
                    // Continue loading the game with default settings
                    console.debug('Continuing with default settings');
                }
            } else {
                console.debug('No settings data found in save', 'warn');
                this.loadProgress.update('Warning: No settings data found', 90);
            }
            
            // Update last save level to prevent immediate re-saving
            if (saveData.player && saveData.player.level) {
                this.lastSaveLevel = saveData.player.level;
            }
            
            // Update last save time
            this.lastSaveTime = Date.now();
            
            this.loadProgress.update('Load complete!', 100);
            await this.delay(10); // Show completion for a moment
            
            console.debug('Hero data loaded successfully');
            
            // Update UI elements
            if (this.game.isRunning && this.game.hudManager) {
                // Update player UI by accessing the PlayerUI component directly
                if (this.game.hudManager.components && this.game.hudManager.components.playerUI) {
                    this.game.hudManager.components.playerUI.update();
                }
                this.game.hudManager.updateQuestLog(this.game.questManager.activeQuests);
            }
            
            // Complete the progress indicator
            this.loadProgress.complete();
            
            return true;
        } catch (error) {
            console.debug('Error loading hero data: ' + error.message, 'error');
            
            // Show error in progress indicator
            this.loadProgress.error('Failed to load hero data: ' + error.message);
            
            return false;
        }
    }
    
    /**
     * Sign in to Google Drive
     * @returns {Promise<boolean>} Whether sign-in was successful
     */
    async signInToGoogle() {
        try {
            // Use the centralized storageService instead of the adapter directly
            const success = await storageService.signInToGoogle();
            
            if (success) {
                console.debug('Successfully signed in to Google Drive');
                
                // Check if save data exists before trying to load
                const hasSaveData = await this.hasSaveData();
                
                if (hasSaveData) {
                    // Try to load save data from Google Drive
                    await this.loadGame();
                } else {
                    console.debug('No save data found in Google Drive, continuing with new game');
                    // Complete the progress indicator if it was started
                    if (this.loadProgress.isActive) {
                        this.loadProgress.complete();
                    }
                }
            } else {
                console.debug('Failed to sign in to Google Drive');
            }
            
            return success;
        } catch (error) {
            console.error('Error signing in to Google Drive:', error);
            return false;
        }
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
        return await storageService.ensureLogin(silentMode, message);
    }
    
    /**
     * Sign out from Google Drive
     */
    signOutFromGoogle() {
        // Use the centralized storageService instead of the adapter directly
        storageService.signOutFromGoogle();
        console.debug('Signed out from Google Drive');
    }
    
    /**
     * Check if signed in to Google Drive
     * @returns {boolean} Whether signed in to Google Drive
     */
    isSignedInToGoogle() {
        // Use the centralized storageService instead of the adapter directly
        return storageService.isSignedInToGoogle();
    }
    
    /**
     * Load world data with progress updates
     * @param {Object} worldData - World data to load
     * @param {Function} chunkLoader - Function to load individual chunks
     * @returns {Promise<void>}
     */
    async loadWorldDataWithProgress(worldData, chunkLoader) {
        const world = this.game.mapManager;
        
        // Mark discovered zones
        this.loadProgress.update('Loading discovered zones...', 65);
        await this.delay(10);
        
        if (worldData.discoveredZones && Array.isArray(worldData.discoveredZones)) {
            console.debug(`Loading ${worldData.discoveredZones.length} discovered zones`);
            
            if (world.zoneManager && world.zoneManager.zones) {
                for (const zoneName of worldData.discoveredZones) {
                    const zone = world.zoneManager.zones.find(z => z.name === zoneName);
                    if (zone) {
                        zone.discovered = true;
                    }
                }
            }
        }
        
        // Restore interactive objects state
        this.loadProgress.update('Loading interactive objects...', 70);
        await this.delay(10);
        
        if (worldData.interactiveObjects && Array.isArray(worldData.interactiveObjects)) {
            console.debug(`Loading ${worldData.interactiveObjects.length} interactive objects`);
            
            if (world.interactiveManager && world.interactiveManager.objects) {
                for (const savedObj of worldData.interactiveObjects) {
                    try {
                        const obj = world.interactiveManager.objects.find(o => 
                            o.type === savedObj.type && 
                            Math.abs(o.position.x - savedObj.position.x) < 1 &&
                            Math.abs(o.position.z - savedObj.position.z) < 1
                        );
                        
                        if (obj) {
                            obj.isOpen = savedObj.isOpen || false;
                            obj.isCompleted = savedObj.isCompleted || false;
                        }
                    } catch (objError) {
                        console.debug(`Error processing interactive object: ${objError.message}`, 'warn');
                    }
                }
            }
        }
        
        // Restore current chunk
        this.loadProgress.update('Setting current chunk...', 75);
        await this.delay(10);
        
        if (worldData.currentChunk) {
            console.debug(`Setting current chunk to: ${worldData.currentChunk}`);
            if (world.terrainManager) {
                world.terrainManager.currentChunk = worldData.currentChunk;
            } else {
                world.currentChunk = worldData.currentChunk;
            }
        }
        
        // Clear existing terrain and environment objects
        this.loadProgress.update('Clearing existing world objects...', 80);
        await this.delay(10);
        
        if (world.clearWorldObjects) {
            world.clearWorldObjects();
        }
        
        // Chunk loading has been removed
        this.loadProgress.update('Skipping chunk loading (feature removed)...', 82);
        await this.delay(10);
        
        // No chunk loading anymore
        console.debug('Chunk loading has been removed from the game');
        
        // Process legacy world data
        this.loadProgress.update('Processing world data...', 85);
        await this.delay(10);
        
        // Environment objects are no longer saved or loaded
        // This code has been removed as it's no longer needed
        
        if (worldData.terrainChunks) {
            if (world.terrainManager) {
                world.terrainManager.savedChunks = worldData.terrainChunks;
            } else {
                world.savedTerrainChunks = worldData.terrainChunks;
            }
        }
        
        // Restore visible chunks
        this.loadProgress.update('Restoring visible chunks...', 95);
        await this.delay(10);
        
        if (worldData.visibleChunks && Array.isArray(worldData.visibleChunks)) {
            if (world.terrainManager) {
                world.terrainManager.visibleChunks = {};
                worldData.visibleChunks.forEach(chunkKey => {
                    world.terrainManager.visibleChunks[chunkKey] = [];
                });
            } else {
                world.visibleChunks = {};
                worldData.visibleChunks.forEach(chunkKey => {
                    world.visibleChunks[chunkKey] = [];
                });
            }
        }
        
        // Restore visible terrain chunks
        if (worldData.visibleTerrainChunks && Array.isArray(worldData.visibleTerrainChunks)) {
            if (world.terrainManager) {
                world.terrainManager.visibleTerrainChunks = {};
                worldData.visibleTerrainChunks.forEach(chunkKey => {
                    world.terrainManager.visibleTerrainChunks[chunkKey] = [];
                });
            } else {
                world.visibleTerrainChunks = {};
                worldData.visibleTerrainChunks.forEach(chunkKey => {
                    world.visibleTerrainChunks[chunkKey] = [];
                });
            }
        }
    }
    
    // saveWorldChunks method has been removed
    
    // saveWorldChunksWithProgress method has been removed
    
    // loadChunkIndex method has been removed
    
    // loadChunk method has been removed
    
    /**
     * Delete all save data
     * @returns {boolean} Success status
     */
    deleteSave() {
        try {
            // Remove main save data from storage
            this.storage.deleteData(this.saveKey);
            
            console.debug('Hero save data deleted successfully');
            return true;
        } catch (error) {
            console.debug('Error deleting save data: ' + error.message, 'error');
            return false;
        }
    }
    
    /**
     * Check if save data exists
     * @returns {boolean} Whether save data exists
     */
    hasSaveData() {
        try {
            return this.storage.hasData(this.saveKey);
        } catch (error) {
            console.error('Error checking if save data exists:', error);
            return false;
        }
    }
}