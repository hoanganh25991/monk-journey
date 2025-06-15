/**
 * HomeButton.js
 * Manages the home button UI component
 */

import { GameMenu } from '../menu-system/GameMenu.js';
import { UIComponent } from '../UIComponent.js';

export class HomeButton extends UIComponent {
    /**
     * Create a home button
     * @param {Game} game - The game instance
     */
    constructor(game) {
        super('home-button', game);
        this.gameMenu = null;
        
        this.init();
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Setup event listeners
        this.setupEventListeners();
        
        // Show the button initially if game is running
        if (this.game.isRunning) {
            this.show();
        } else {
            this.hide();
        }
        
        return true;
    }
    
    /**
     * Update the component
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // No update logic needed for this component
    }

    /**
     * Set up event listeners
     * @private
     */
    setupEventListeners() {
        if (this.container) {
            // Add click event to show game menu
            this.container.addEventListener('click', () => {
                if (this.game.saveManager) {
                    // Force save the game
                    if (this.game.saveManager.saveGame(true, true)) {
                        console.debug("Game data saved successfully");
                        
                        // Show notification
                        if (this.game.hudManager) {
                            this.game.hudManager.showNotification('Game saved successfully', 2000, 'success');
                        }
                    } else {
                        console.error("Failed to save game data");
                        
                        // Show error notification
                        if (this.game.hudManager) {
                            this.game.hudManager.showNotification('Failed to save game', 3000, 'error');
                        }
                    }
                } else {
                    console.error("Save manager not available");
                    alert('Save functionality is not available.');
                }
                // Pause the game
                this.game.pause();
                
                // Show game menu using menu manager if available
                if (this.game.menuManager) {
                    this.game.menuManager.showMenu('gameMenu');
                } else {
                    // Fallback to direct creation if menu manager is not available
                    if (!this.gameMenu) {
                        this.gameMenu = new GameMenu(this.game);
                    }
                    this.gameMenu.show();
                }
                
                console.debug("Home button clicked - game paused and game menu opened");
            });
            
            // Add event listener to show/hide settings button based on game state
            this.game.addEventListener('gameStateChanged', (state) => {
                console.debug('Game state changed:', state);
                if (state === 'running') {
                    // Show settings button when game is running
                    this.show();
                    
                    // Hide the main background when game is running

                } else if (state === 'paused') {
                    // When paused, only hide if it's not because of the options menu
                    if (!document.getElementById('main-options-menu') || 
                        document.getElementById('main-options-menu').style.display === 'none') {
                        this.hide();
                    } else {
                        // Keep button visible when options menu is open
                        this.show();
                    }
                } else if (state === 'menu') {
                    this.hide();
                }
            });
        }
    }

    /**
     * Show the settings button
     * Overrides the parent class method
     */
    show() {
        // Call the parent class method
        super.show();
    }

    /**
     * Hide the settings button
     * Overrides the parent class method
     */
    hide() {
        // Call the parent class method
        super.hide();
    }

    /**
     * Clean up resources
     * Overrides the parent class method
     */
    dispose() {
        // Call the parent class dispose method
        super.dispose();
        
        if (this.gameMenu) {
            this.gameMenu.dispose();
        }
        
        this.gameMenu = null;
    }
}