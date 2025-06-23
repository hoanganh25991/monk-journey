/**
 * Handles progress indication for save/load operations
 */
export class SaveOperationProgress {
    /**
     * Create a new progress indicator
     * @param {Object} game - The game object
     * @param {string} operationType - Type of operation ('save' or 'load')
     */
    constructor(game, operationType) {
        this.game = game;
        this.operationType = operationType;
        this.progressElement = null;
        this.progressBarElement = null;
        this.progressTextElement = null;
        this.titleElement = null;
        this.isActive = false;
    }
    
    /**
     * Start the progress indicator
     * @param {string} initialMessage - Initial message to display
     */
    start(initialMessage) {
        // Get progress container if it doesn't exist
        if (!this.progressElement) {
            this.getProgressElements();
        }
        
        // Set initial message and progress
        this.update(initialMessage, 0);
        
        // Show the progress indicator
        this.show();
        
        // Mark as active
        this.isActive = true;
    }
    
    /**
     * Update the progress indicator
     * @param {string} message - Message to display
     * @param {number} percent - Progress percentage (0-100)
     */
    update(message, percent) {
        if (!this.isActive) return;
        
        // Update progress bar
        if (this.progressBarElement) {
            this.progressBarElement.style.width = `${percent}%`;
        }
        
        // Update text
        if (this.progressTextElement) {
            this.progressTextElement.textContent = message;
        }
    }
    
    /**
     * Mark the operation as complete
     */
    complete() {
        if (!this.isActive) return;
        
        // Show 100% completion
        this.update('Operation complete', 100);
        
        // Hide after a short delay
        setTimeout(() => {
            this.hide();
            this.resetStyles();
        }, 1000);
        
        // Mark as inactive
        this.isActive = false;
    }
    
    /**
     * Show an error message
     * @param {string} errorMessage - Error message to display
     */
    error(errorMessage) {
        if (!this.isActive) {
            this.start(errorMessage);
        }
        
        // Update progress elements with error styling
        if (this.progressElement) {
            this.progressElement.classList.add('error');
        }
        
        if (this.progressBarElement) {
            this.progressBarElement.classList.add('error');
        }
        
        if (this.progressTextElement) {
            this.progressTextElement.textContent = errorMessage;
        }
        
        // Hide after a delay
        setTimeout(() => {
            this.hide();
            this.resetStyles();
        }, 3000);
        
        // Mark as inactive
        this.isActive = false;
    }
    
    /**
     * Reset styles after hiding
     */
    resetStyles() {
        if (this.progressElement) {
            this.progressElement.classList.remove('error');
        }
        
        if (this.progressBarElement) {
            this.progressBarElement.classList.remove('error');
        }
    }
    
    /**
     * Show the progress indicator
     */
    show() {
        if (this.progressElement) {
            this.progressElement.style.display = 'flex';
        }
    }
    
    /**
     * Hide the progress indicator
     */
    hide() {
        if (this.progressElement) {
            this.progressElement.style.display = 'none';
        }
    }
    
    /**
     * Get the progress indicator elements from the DOM
     */
    getProgressElements() {
        // Get container
        this.progressElement = document.getElementById('save-operation-progress');
        
        // Add operation type class
        if (this.progressElement) {
            this.progressElement.classList.add(this.operationType === 'save' ? 'save-type' : 'load-type');
        }
        
        // Get title element
        this.titleElement = document.getElementById('save-operation-title');
        if (this.titleElement) {
            this.titleElement.textContent = this.operationType === 'save' ? 'Saving Game' : 'Loading Game';
        }
        
        // Get progress text element
        this.progressTextElement = document.getElementById('save-operation-text');
        
        // Get progress bar element
        this.progressBarElement = document.getElementById('save-operation-bar');
    }
}