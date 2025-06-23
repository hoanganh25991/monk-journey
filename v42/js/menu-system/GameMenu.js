/**
 * GameMenu.js
 * Manages the main game menu UI component
 */

import { IMenu } from './IMenu.js';

export class GameMenu extends IMenu {
    /**
     * Create a game menu
     * @param {Game} game - The game instance
     */
    constructor(game) {
        super('game-menu', game);
        this.loadGameButton = document.getElementById('load-game-button');
        this.settingsMenuButton = document.getElementById('settings-menu-button');
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for menu buttons
     * @private
     */
    setupEventListeners() {
        // Play Game button - show only if save data exists
        if (this.loadGameButton) {
            this.loadGameButton.addEventListener('click', async () => {
                console.debug("Continue Game button clicked - attempting to load saved game...");
                if (this.game.hasStarted) {
                    // Game has been started but is currently paused
                    console.debug("Resume Game button clicked - resuming game...");
                    this.hide();
                    
                    // Hide the main background when resuming the game
                    if (this.game.hudManager && this.game.hudManager.mainBackground) {
                        this.game.hudManager.mainBackground.hide();
                    }

                    // Resume the game
                    this.game.resume(false);
                    
                    // Show all HUD elements
                    if (this.game.hudManager) {
                        this.game.hudManager.showAllUI();
                    }
                    
                    console.debug("Game resumed - enemies and player are now active");
                } else  if (this.game.saveManager && this.game.saveManager.hasSaveData()) {
                    if (await this.game.saveManager.loadGame()) {
                        console.debug("Game data loaded successfully");
                        this.hide();
                        
                        // Hide the main background when loading a game
                        if (this.game.hudManager && this.game.hudManager.mainBackground) {
                            this.game.hudManager.mainBackground.hide();
                        }
                        
                        // Start the game with loaded data - this will set isPaused to false and start the game loop
                        // Pass true to indicate this is a loaded game, so player position isn't reset
                        this.game.start(true);
                        
                        // Make sure settings button is visible
                        const homeButton = document.getElementById('home-button');
                        if (homeButton) {
                            homeButton.style.display = 'block';
                        }
                        
                        // Show all HUD elements
                        if (this.game.hudManager) {
                            this.game.hudManager.showAllUI();
                        }
                        
                        console.debug("Game started with loaded data - enemies and player are now active");
                    } else {
                        console.error("Failed to Continue Game data");
                        alert('Failed to Continue Game data.');
                    };
                } else {
                    // Game has never been started - start a new game
                    console.debug("New Game button clicked - starting new game...");
                    this.hide();
                    
                    // Hide the main background when starting the game
                    if (this.game.hudManager && this.game.hudManager.mainBackground) {
                        this.game.hudManager.mainBackground.hide();
                    }
                    
                    // Start the game - this will set isPaused to false and start the game loop
                    // Pass false to indicate this is a new game, so player position should be reset
                    this.game.start(false);
                    
                    // Make sure settings button is visible
                    const homeButton = document.getElementById('home-button');
                    if (homeButton) {
                        homeButton.style.display = 'block';
                    }
                    
                    // Show all HUD elements
                    if (this.game.hudManager) {
                        this.game.hudManager.showAllUI();
                    }
                    
                    console.debug("New game started - enemies and player are now active");
                }
            })
        }

        // Settings button
        if (this.settingsMenuButton) {
            this.settingsMenuButton.addEventListener('click', () => {
                // Use the menu manager to show the settings menu
                if (this.game.menuManager) {
                    this.game.menuManager.showMenu('settingsMenu');
                }
            });
        }
    }

    /**
     * Get the menu type/name
     * @returns {string} The menu type/name
     */
    getType() {
        return 'gameMenu';
    }

    /**
     * Show the game menu
     */
    show() {
        if (this.element) {
            // Hide all HUD UI elements using the HUDManager
            if (this.game.hudManager) {
                this.game.hudManager.hideAllUI();
            }
            
            // Show the main background when showing the game menu
            if (this.game.hudManager && this.game.hudManager.mainBackground) {
                this.game.hudManager.mainBackground.show();
            }
            
            // Make sure the menu is visible
            this.element.style.display = 'flex';
        }
    }

    /**
     * Hide the game menu
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    /**
     * Clean up resources
     */
    dispose() {
        // We don't remove the element since it's defined in the HTML
        // Just hide it
        if (this.element) {
            this.element.style.display = 'none';
        }
        
        if (this.settingsMenu) {
            this.settingsMenu.dispose();
        }
        
        this.settingsMenu = null;
    }
}