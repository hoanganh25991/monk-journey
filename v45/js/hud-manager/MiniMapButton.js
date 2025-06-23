/**
 * MiniMapButton.js
 * Manages the mini map toggle button UI component
 */

import { UIComponent } from '../UIComponent.js';

export class MiniMapButton extends UIComponent {
    /**
     * Create a mini map toggle button
     * @param {Game} game - The game instance
     */
    constructor(game) {
        super('mini-map-button', game);
        this.init();
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // The button is now created in the HTML directly
        // We just need to set up event listeners
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
            // Add click event to toggle mini map
            this.container.addEventListener('click', () => {
                if (this.game && this.game.hudManager) {
                    this.game.hudManager.toggleMiniMap();
                }
                console.debug("Mini map button clicked - toggling mini map visibility");
            });
        }
    }

    /**
     * Show the mini map button
     * Overrides the parent class method
     */
    show() {
        // Call the parent class method
        super.show();
    }

    /**
     * Hide the mini map button
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
    }
}