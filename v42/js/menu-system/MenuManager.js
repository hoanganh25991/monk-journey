/**
 * MenuManager.js
 * Manages the menu system for the game
 */

import { GameMenu } from './GameMenu.js';
import { SettingsMenu } from './SettingsMenu.js';

export class MenuManager {
    /**
     * Create a menu manager
     * @param {import('../game/Game.js').Game} game - The game instance
     */
    constructor(game) {
        this.game = game;
        this.menus = new Map();
        this.activeMenu = null;
        
        // Register for game state changes
        this.game.addEventListener('gameStateChanged', (state) => this.handleGameStateChange(state));
        
        // Initialize default menus
        this.initializeMenus();
        
        console.debug("MenuManager initialized - managing game menus");
    }
    
    /**
     * Initialize default menus
     * @private
     */
    initializeMenus() {
        // Create game menu
        this.createMenu('gameMenu');
        
        // Settings menu will be created on demand when needed
        console.debug("Default menus initialized");
    }
    
    /**
     * Factory method to create menus
     * @param {string} menuType - The type of menu to create
     * @returns {import('./IMenu.js').IMenu} The created menu instance
     */
    createMenu(menuType) {
        let menu = null;
        
        // Create the appropriate menu type
        switch (menuType) {
            case 'gameMenu':
                menu = new GameMenu(this.game);
                break;
            case 'settingsMenu':
                menu = new SettingsMenu(this.game);
                break;
            default:
                console.error(`Unknown menu type: ${menuType}`);
                return null;
        }
        
        // Register the menu
        this.registerMenu(menuType, menu);
        console.debug(`Created menu: ${menuType}`);
        
        return menu;
    }
    
    /**
     * Register a menu with the manager
     * @param {string} menuType - The menu type/name
     * @param {import('./IMenu.js').IMenu} menu - The menu instance
     */
    registerMenu(menuType, menu) {
        this.menus.set(menuType, menu);
    }
    
    /**
     * Get a menu by type
     * @param {string} menuType - The menu type/name
     * @returns {import('./IMenu.js').IMenu|null} The menu instance or null if not found
     */
    getMenu(menuType) {
        return this.menus.get(menuType) || null;
    }
    
    /**
     * Show a menu by type
     * @param {string} menuType - The menu type/name
     * @returns {boolean} True if the menu was shown
     */
    showMenu(menuType) {
        // Get the menu or create it if it doesn't exist
        let menu = this.getMenu(menuType);
        if (!menu) {
            menu = this.createMenu(menuType);
            if (!menu) {
                console.error(`Failed to create menu: ${menuType}`);
                return false;
            }
        }
        
        // If the requested menu is already active and visible, do nothing
        if (this.activeMenu === menu && menu.visible) {
            console.debug(`Menu ${menuType} is already active and visible`);
            return true;
        }
        
        // Hide the current active menu if it's different
        if (this.activeMenu && this.activeMenu !== menu) {
            console.debug(`Hiding current active menu: ${this.activeMenu}`);
            this.activeMenu.hide();
        }
        
        // Show the requested menu
        console.debug(`Showing menu: ${menuType}`);
        menu.show();
        this.activeMenu = menu;
        return true;
    }
    
    /**
     * Hide the active menu
     */
    hideActiveMenu() {
        if (this.activeMenu) {
            this.activeMenu.hide();
            this.activeMenu = null;
        }
    }
    
    /**
     * Get the active menu
     * @returns {import('./IMenu.js').IMenu|null} The active menu or null if none
     */
    getActiveMenu() {
        return this.activeMenu;
    }
    
    /**
     * Handle game state changes
     * @param {string} state - Current game state ('running' or 'paused')
     */
    handleGameStateChange(state) {
        console.debug(`Game state changed to: ${state}`);
        
        if (state === 'paused') {
            // Check if any menu is currently visible
            let anyMenuVisible = false;
            
            for (const [type, menu] of this.menus.entries()) {
                if (menu.visible) {
                    console.debug(`Menu ${type} is already visible, keeping it active`);
                    anyMenuVisible = true;
                    this.activeMenu = menu; // Ensure active menu is set correctly
                    break;
                }
            }
            
            // If no menu is visible, show the game menu
            if (!anyMenuVisible) {
                console.debug('No menu is visible, showing game menu');
                this.showMenu('gameMenu');
            }
        } else if (state === 'running') {
            // If game is running, hide all menus
            console.debug('Game is running, hiding all menus');
            this.hideActiveMenu();
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Clean up all menus
        for (const menu of this.menus.values()) {
            menu.dispose();
        }
        
        // Clear the menus map
        this.menus.clear();
        this.activeMenu = null;
    }
}