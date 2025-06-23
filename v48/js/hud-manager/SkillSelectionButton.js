/**
 * FullscreenButton.js
 * Manages the fullscreen button UI component
 */

import { UIComponent } from '../UIComponent.js';

export class FullscreenButton extends UIComponent {
    /**
     * Create a fullscreen button
     * @param {Game} game - The game instance
     */
    constructor(game) {
        super('skill-selection-button', game);
        this.isFullscreen = false;
        
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
        this.container.addEventListener("click", () => {
            if (this.game && this.game.hudManager) {
                this.game.hudManager.toggleSkillSelection()
            }
        })

    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        // Set a flag to prevent game from pausing during fullscreen change
        window.isFullscreenChange = true;
        
        // Clear the flag after a short delay
        setTimeout(() => {
            window.isFullscreenChange = false;
        }, 1000); // 1 second should be enough for the transition
        
        if (!document.fullscreenElement &&
            !document.mozFullScreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement) {
            // Enter fullscreen
            const docEl = document.documentElement;
            if (docEl.requestFullscreen) {
                docEl.requestFullscreen();
            } else if (docEl.mozRequestFullScreen) { // Firefox
                docEl.mozRequestFullScreen();
            } else if (docEl.webkitRequestFullscreen) { // Chrome, Safari and Opera
                docEl.webkitRequestFullscreen();
            } else if (docEl.msRequestFullscreen) { // IE/Edge
                docEl.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) { // Firefox
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE/Edge
                document.msExitFullscreen();
            }
        }
    }
    
    /**
     * Update the fullscreen button icon based on current fullscreen state
     */
    updateFullscreenButtonIcon() {
        const isInFullscreen = document.fullscreenElement ||
                              document.mozFullScreenElement ||
                              document.webkitFullscreenElement ||
                              document.msFullscreenElement;
        
        if (isInFullscreen) {
            // In fullscreen mode, show exit fullscreen icon (smaller square)
            this.container.innerHTML = '⤦'; // Unicode U+2926 (South East Arrow to Corner)
            this.container.title = 'Exit Fullscreen';
        } else {
            // Not in fullscreen mode, show enter fullscreen icon (larger square)
            this.container.innerHTML = '⛶'; // Unicode U+26F6 (Square Four Corners)
            this.container.title = 'Enter Fullscreen';
        }
    }

    /**
     * Show the fullscreen button
     * Overrides the parent class method
     */
    show() {
        // Call the parent class method
        super.show();
    }

    /**
     * Hide the fullscreen button
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