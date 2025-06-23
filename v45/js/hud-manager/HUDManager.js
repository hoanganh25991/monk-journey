import { PlayerUI } from './PlayerUI.js';
import { EnemyUI } from './EnemyUI.js';
import { SkillsUI } from './SkillsUI.js';
import { DialogUI } from './DialogUI.js';
import { InventoryUI } from './InventoryUI.js';
import { SkillTreeUI } from './SkillTreeUI.js';
import { SkillSelectionUI } from './SkillSelectionUI.js';
import { VirtualJoystickUI } from './VirtualJoystickUI.js';
import { CameraControlUI } from './CameraControlUI.js';
import { DeathScreenUI } from './DeathScreenUI.js';
import { NotificationsUI } from './NotificationsUI.js';
import { QuestLogUI } from './QuestLogUI.js';
import { MiniMapUI } from './MiniMapUI.js';
import { MainBackground } from '../menu-system/MainBackground.js';
import { HomeButton } from './HomeUI.js';
import { FullscreenButton } from './SkillSelectionButton.js';
import { SkillTreeButton } from './SkillTreeButton.js';
import { MiniMapButton } from './MiniMapButton.js';
import { InventoryButton } from './InventoryButton.js';

/**
 * HUD Manager
 * Manages all UI components and provides a central interface for UI interactions
 */
export class HUDManager {
    /**
     * Create a new HUD Manager
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        this.game = game;
        
        // Initialize UI components
        this.components = {};
        
        // Add event listener for game state changes
        this.game.addEventListener('gameStateChanged', (state) => this.handleGameStateChange(state));
    }
    
    /**
     * Initialize the HUD Manager and all UI components
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Validate UI container exists
        this.validateUIContainer();
        
        // Create main background
        this.createMainBackground();
        
        // Create UI components
        this.createUIComponents();
        
        // Initially hide UI if game is not running
        if (!this.game.isRunning) {
            this.hideAllUI();
        }
        
        return true;
    }
    
    /**
     * Validate that the UI container exists in the DOM
     * If not, create it
     */
    validateUIContainer() {
        this.uiContainer = document.getElementById('hud-container');
        if (!this.uiContainer) {
            console.error('UI container not found in DOM. Creating it dynamically.');
        }
    }
    
    /**
     * Create the main background
     */
    createMainBackground() {
        // Initialize the main background
        this.mainBackground = new MainBackground(this.game);
        
        // Show the background
        this.mainBackground.show();
    }
    
    /**
     * Create all UI components
     */
    createUIComponents() {
        // Create player UI
        this.components.playerUI = new PlayerUI(this.game);
        this.components.playerUI.init();
        
        // Create enemy UI
        this.components.enemyUI = new EnemyUI(this.game);
        this.components.enemyUI.init();
        
        // Create skills UI
        this.components.skillsUI = new SkillsUI(this.game);
        this.components.skillsUI.init();
        
        // Create dialog UI
        this.components.dialogUI = new DialogUI(this.game);
        this.components.dialogUI.init();
        
        // Create inventory UI
        this.components.inventoryUI = new InventoryUI(this.game);
        this.components.inventoryUI.init();
        
        // Create skill tree UI
        this.components.skillTreeUI = new SkillTreeUI(this.game);
        this.components.skillTreeUI.init();
        
        // Create skill selection UI
        this.components.skillSelectionUI = new SkillSelectionUI(this.game);
        this.components.skillSelectionUI.init();
        
        // Create virtual joystick UI
        this.components.joystickUI = new VirtualJoystickUI(this.game);
        this.components.joystickUI.init();
        
        // Create camera control UI
        this.components.cameraControlUI = new CameraControlUI(this.game);
        this.components.cameraControlUI.init();
        
        // Create death screen UI
        this.components.deathScreenUI = new DeathScreenUI(this.game);
        this.components.deathScreenUI.init();
        
        // Create notifications UI
        this.components.notificationsUI = new NotificationsUI(this.game);
        this.components.notificationsUI.init();
        
        // Create mini map UI
        this.components.miniMapUI = new MiniMapUI(this.game);
        this.components.miniMapUI.init();
        
        // Create quest log UI
        this.components.questLogUI = new QuestLogUI(this.game);
        this.components.questLogUI.init();
        
        // Create UI buttons
        this.components.homeButton = new HomeButton(this.game);
        this.components.fullscreenButton = new FullscreenButton(this.game);
        this.components.skillTreeButton = new SkillTreeButton(this.game);
        this.components.inventoryButton = new InventoryButton(this.game);
        this.components.miniMapButton = new MiniMapButton(this.game);
        // Note: These buttons initialize themselves in their constructors
    }
    
    /**
     * Update all UI components
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Update player UI
        this.components.playerUI.update(delta);
        
        // Update enemy UI
        this.components.enemyUI.update(delta);
        
        // Update skills UI
        this.components.skillsUI.update(delta);
        
        // Update mini map UI
        this.components.miniMapUI.update(delta);
        
        // Update camera control UI
        this.components.cameraControlUI.update(delta);
        
        // Update notifications UI
        this.components.notificationsUI.update(delta);
        
        // Update UI buttons
        this.components.homeButton.update(delta);
        this.components.skillTreeButton.update(delta);
        this.components.inventoryButton.update(delta);
        this.components.miniMapButton.update(delta);
    }
    
    /**
     * Set a new background image
     * @param {string} imagePath - Path to the new background image
     */
    setBackgroundImage(imagePath) {
        if (this.mainBackground) {
            this.mainBackground.setBackgroundImage(imagePath);
        }
    }
    
    /**
     * Show a notification message
     * @param {string} message - Message to display
     */
    showNotification(message) {
        this.components.notificationsUI.showNotification(message);
    }
    
    /**
     * Show a dialog with title and text
     * @param {string} title - Dialog title
     * @param {string} text - Dialog text
     */
    showDialog(title, text) {
        this.components.dialogUI.showDialog(title, text);
    }
    
    /**
     * Hide the dialog
     */
    hideDialog() {
        this.components.dialogUI.hideDialog();
    }
    
    /**
     * Check if dialog is currently visible
     * @returns {boolean} - True if dialog is visible
     */
    isDialogVisible() {
        return this.components.dialogUI && this.components.dialogUI.isDialogOpen;
    }
    
    /**
     * Toggle inventory visibility
     */
    toggleInventory() {
        this.components.inventoryUI.toggleInventory();
    }
    
    /**
     * Toggle skill tree visibility
     */
    toggleSkillTree() {
        if (this.components.skillTreeUI.visible) {
            this.components.skillTreeUI.hide();
            this.game.resume(false);
        } else {
            this.game.pause(false);
            this.components.skillTreeUI.show();
        }
    }
    
    /**
     * Toggle skill selection UI visibility
     */
    toggleSkillSelection() {
        if (this.components.skillSelectionUI.visible) {
            this.components.skillSelectionUI.hide();
            this.game.resume(false);
        } else {
            this.game.pause(false);
            this.components.skillSelectionUI.show();
        }
    }
    
    /**
     * Show the death screen
     */
    showDeathScreen() {
        this.components.deathScreenUI.showDeathScreen();
    }
    
    /**
     * Hide the death screen
     */
    hideDeathScreen() {
        this.components.deathScreenUI.hideDeathScreen();
    }
    
    /**
     * Show level up animation
     * @param {number} level - New level
     */
    showLevelUp(level) {
        this.components.notificationsUI.showLevelUp(level);
    }
    
    /**
     * Update the quest log with active quests
     * @param {Array} activeQuests - Array of active quests
     */
    updateQuestLog(activeQuests) {
        this.components.questLogUI.updateQuestLog(activeQuests);
    }
    
    /**
     * Create a bleeding effect at the given position
     * @param {number} amount - Damage amount
     * @param {Object} position - 3D position {x, y, z}
     * @param {boolean} isPlayerDamage - Whether the damage was caused by the player
     * @returns {BleedingEffect|null} - The created bleeding effect or null if creation failed
     * @deprecated Use game.effectsManager.createBleedingEffect() instead
     */
    createBleedingEffect(amount, position, isPlayerDamage = false) {
        // Forward to the effects manager
        if (this.game && this.game.effectsManager) {
            return this.game.effectsManager.createBleedingEffect(amount, position, isPlayerDamage);
        }
        return null;
    }
    
    /**
     * Get the current joystick direction
     * @returns {Object} - Direction vector {x, y}
     */
    getJoystickDirection() {
        return this.components.joystickUI.getJoystickDirection();
    }
    
    /**
     * Toggle mini map visibility
     * @returns {boolean} - New visibility state
     */
    toggleMiniMap() {
        return this.components.miniMapUI.toggleMiniMap();
    }
    
    /**
     * Set mini map scale
     * @param {number} scale - New scale factor
     */
    setMiniMapScale(scale) {
        if (this.components.miniMapUI) {
            this.components.miniMapUI.setScale(scale);
        }
    }
    
    /**
     * Increase mini map scale (zoom out)
     */
    increaseMiniMapScale() {
        if (this.components.miniMapUI) {
            this.components.miniMapUI.increaseScale();
        }
    }
    
    /**
     * Decrease mini map scale (zoom in)
     */
    decreaseMiniMapScale() {
        if (this.components.miniMapUI) {
            this.components.miniMapUI.decreaseScale();
        }
    }
    
    /**
     * Resize the mini map
     * @param {number} size - New size in pixels
     */
    resizeMiniMap(size) {
        if (this.components.miniMapUI) {
            this.components.miniMapUI.resize(size);
        }
    }
    
    /**
     * Hide all UI elements
     */
    hideAllUI() {
        if (this.uiContainer) {
            this.uiContainer.style.display = 'none';
        }
        
        // Don't hide the buttons when paused if the settings menu is open
        const settingsMenu = document.getElementById('main-options-menu');
        const homeButton = document.getElementById('home-button');
        const fullscreenButton = document.getElementById('skill-selection-button');
        const skillTreeButton = document.getElementById('skill-tree-button');
        const inventoryButton = document.getElementById('inventory-button');
        const miniMapButton = document.getElementById('mini-map-button');
        
        if (homeButton && (!settingsMenu || settingsMenu.style.display === 'none')) {
            homeButton.style.display = 'none';
        }
        
        if (fullscreenButton && (!settingsMenu || settingsMenu.style.display === 'none')) {
            fullscreenButton.style.display = 'none';
        }
        
        if (skillTreeButton && (!settingsMenu || settingsMenu.style.display === 'none')) {
            skillTreeButton.style.display = 'none';
        }
        
        if (inventoryButton && (!settingsMenu || settingsMenu.style.display === 'none')) {
            inventoryButton.style.display = 'none';
        }
        
        if (miniMapButton && (!settingsMenu || settingsMenu.style.display === 'none')) {
            miniMapButton.style.display = 'none';
        }
    }
    
    /**
     * Show all UI elements
     */
    showAllUI() {
        if (this.uiContainer) {
            this.uiContainer.style.display = 'block';
        }
        
        // Explicitly show the buttons since they're outside the UI container
        const homeButton = document.getElementById('home-button');
        if (homeButton) {
            homeButton.style.display = 'block';
        }
        
        const fullscreenButton = document.getElementById('skill-selection-button');
        if (fullscreenButton) {
            fullscreenButton.style.display = 'block';
        }
        
        const skillTreeButton = document.getElementById('skill-tree-button');
        if (skillTreeButton) {
            skillTreeButton.style.display = 'block';
        }
        
        const inventoryButton = document.getElementById('inventory-button');
        if (inventoryButton) {
            inventoryButton.style.display = 'block';
        }
        
        const miniMapButton = document.getElementById('mini-map-button');
        if (miniMapButton) {
            miniMapButton.style.display = 'block';
        }
    }
    
    /**
     * Toggle the visibility of all UI elements
     * @returns {boolean} - The new visibility state (true if visible, false if hidden)
     */
    toggleHUD() {
        if (this.uiContainer) {
            const isCurrentlyVisible = this.uiContainer.style.display !== 'none';
            if (isCurrentlyVisible) {
                this.hideAllUI();
                return false;
            } else {
                this.showAllUI();
                return true;
            }
        }
        return false;
    }
    
    /**
     * Handle game state changes
     * @param {string} state - Current game state ('running' or 'paused')
     */
    handleGameStateChange(state) {
        if (state === 'running') {
            this.showAllUI();
        } else {
            this.hideAllUI();
        }
    }
}