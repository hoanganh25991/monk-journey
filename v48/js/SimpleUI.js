/**
 * Simple UI class for handling loading screens and messages
 * Used by WorldManager for map generation progress
 */
export class SimpleUI {
    constructor() {
        this.currentMessage = null;
        this.currentTimeout = null;
        
        // Get references to loading elements
        this.initialLoadingIndicator = document.getElementById('initial-loading-indicator');
        this.initialLoadingBar = document.getElementById('initial-loading-bar');
        this.initialLoadingText = document.getElementById('initial-loading-text');
        this.initialLoadingInfo = document.getElementById('initial-loading-info');
    }
    
    /**
     * Show a message with optional timeout
     * @param {string} message - The message to display
     * @param {number} timeout - Timeout in milliseconds (0 = no timeout)
     */
    showMessage(message, timeout = 0) {
        if (!this.initialLoadingIndicator) {
            console.warn('Initial loading indicator not found');
            return;
        }
        
        // Clear any existing timeout
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        
        // Update the message
        if (this.initialLoadingText) {
            this.initialLoadingText.textContent = message;
        }
        
        // Show the loading indicator
        this.initialLoadingIndicator.style.display = 'flex';
        this.currentMessage = message;
        
        // Set timeout if specified
        if (timeout > 0) {
            this.currentTimeout = setTimeout(() => {
                this.hideMessage();
            }, timeout);
        }
    }
    
    /**
     * Update the progress of the loading bar
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} message - Optional message to update
     * @param {string} info - Optional info text to update
     */
    updateProgress(progress, message = null, info = null) {
        if (this.initialLoadingBar) {
            this.initialLoadingBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
        
        if (message && this.initialLoadingText) {
            this.initialLoadingText.textContent = message;
        }
        
        if (info && this.initialLoadingInfo) {
            this.initialLoadingInfo.textContent = info;
        }
    }
    
    /**
     * Hide the message/loading screen
     */
    hideMessage() {
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        
        if (this.initialLoadingIndicator) {
            this.initialLoadingIndicator.style.display = 'none';
        }
        
        this.currentMessage = null;
    }
    
    /**
     * Check if a message is currently being displayed
     * @returns {boolean}
     */
    isShowingMessage() {
        return this.currentMessage !== null;
    }
    
    /**
     * Get the current message
     * @returns {string|null}
     */
    getCurrentMessage() {
        return this.currentMessage;
    }
}