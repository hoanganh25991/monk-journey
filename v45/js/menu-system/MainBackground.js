/**
 * MainBackground.js
 * Manages the main background image UI component
 */

import { UIComponent } from '../UIComponent.js';

export class MainBackground extends UIComponent {
    /**
     * Create a main background component
     * @param {Game} game - The game instance
     */
    constructor(game) {
        super('main-background', game);
        
        // Set background image path
        this.backgroundImagePath = 'assets/images/background.jpg';
        
        this.init();
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // The background element is already defined in index.html
        // Just apply the background image if needed
        this.applyBackgroundImage();
        
        return true;
    }
    
    /**
     * Apply the background image to the container
     * @private
     */
    applyBackgroundImage() {
        if (this.container) {
            // Only update the background image if it's different from the current one
            const currentBgImage = this.container.style.backgroundImage;
            const newBgImage = `url(${this.backgroundImagePath})`;
            
            if (currentBgImage !== newBgImage) {
                this.container.style.backgroundImage = newBgImage;
                this.container.style.backgroundSize = 'cover';
                this.container.style.backgroundPosition = 'center center';
                this.container.style.backgroundRepeat = 'no-repeat';
            }
        }
    }
    
    /**
     * Set a new background image
     * @param {string} imagePath - Path to the new background image
     */
    setBackgroundImage(imagePath) {
        this.backgroundImagePath = imagePath;
        this.applyBackgroundImage();
    }
}