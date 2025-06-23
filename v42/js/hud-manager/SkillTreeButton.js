/**
 * SkillTreeButton.js
 * Manages the skill tree button UI component
 */

import { UIComponent } from '../UIComponent.js';

export class SkillTreeButton extends UIComponent {
    /**
     * Create a skill tree button
     * @param {Game} game - The game instance
     */
    constructor(game) {
        super('skill-tree-button', game);
        this.init();
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // No need to set styles here as they are defined in CSS
        
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
        this.container.addEventListener("click", () => {
            if (this.game && this.game.hudManager) {
                this.game.hudManager.toggleSkillTree();
            }
        });
    }
    
    /**
     * Show the skill tree button
     * Overrides the parent class method
     */
    show() {
        // Call the parent class method
        super.show();
    }

    /**
     * Hide the skill tree button
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