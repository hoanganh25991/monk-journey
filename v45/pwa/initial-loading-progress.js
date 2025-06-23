/**
 * initial-loading-progress.js
 * Simulated loading progress that increases by 1% every 100ms
 * Provides a visual loading indicator for the initial application load
 */

// Immediately create an instance when the script is loaded
/**
 * SimulatedLoadingScreen.js
 * Provides a simulated loading screen that increases by 1% every 100ms
 * Replaces the actual file tracking with a simple time-based approach
 */

class SimulatedLoadingScreen {
    constructor(timelapse = 100, increasedPercent = 1) {
        // DOM elements for displaying progress
        this.loadingScreenElement = document.getElementById('loading-screen');
        this.loadingBarElement = document.getElementById('loading-bar');
        this.loadingTextElement = document.getElementById('loading-text');
        this.loadingInfoElement = document.getElementById('loading-info');

        // Options
        this.timelapse = timelapse;
        this.increasedPercent = increasedPercent;
        
        // Progress tracking
        this.progress = 0;
        this.intervalId = null;
        this.startTime = 0;
        
        // Initialize if elements exist
        if (this.loadingScreenElement && this.loadingBarElement) {
            console.debug('SimulatedLoadingScreen initialized');
        } else {
            console.error('Loading screen elements not found');
        }
    }
    
    /**
     * Start the simulated loading progress
     */
    start() {
        console.debug('Starting simulated loading progress');
        
        // Make sure the loading screen is visible
        if (this.loadingScreenElement) {
            this.loadingScreenElement.style.display = 'flex';
        }
        
        // Reset progress
        this.progress = 0;
        this.startTime = Date.now();
        
        // Update the UI initially
        this.updateUI();
        
        // Clear any existing interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        // Set up the interval to increase progress by 1% every 100ms
        this.intervalId = setInterval(() => {
            this.progress += this.increasedPercent;
            
            // Update the UI
            this.updateUI();
            
            // Check if we've reached 100%
            if (this.progress >= 100) {
                this.complete();
            }
        }, this.timelapse);
    }
    
    /**
     * Update the UI with current progress
     */
    updateUI() {
        // Update loading bar
        if (this.loadingBarElement) {
            this.loadingBarElement.style.width = `${this.progress}%`;
        }
        
        // Update loading text
        if (this.loadingTextElement) {
            this.loadingTextElement.textContent = `Loading game... ${this.progress}%`;
        }
        
        // Update loading info with elapsed time
        if (this.loadingInfoElement) {
            const elapsedTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.loadingInfoElement.textContent = `Elapsed time: ${elapsedTime}s`;
        }
    }
    
    /**
     * Complete the loading process and hide the loading screen
     */
    complete() {
        console.debug('Simulated loading complete');
        
        // Clear the interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Ensure progress is at 100%
        this.progress = 100;
        this.updateUI();
        
        // Calculate total loading time
        const loadTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
        
        // Update text to show completion
        if (this.loadingTextElement) {
            this.loadingTextElement.textContent = `Loading complete in ${loadTime}s`;
        }
        
        // Hide the loading screen after a short delay
        setTimeout(() => {
            // this.hide();
        }, 50);
    }
    
    /**
     * Hide the loading screen
     */
    hide() {
        console.debug('Hiding loading screen');
        
        if (this.loadingScreenElement) {
            // Hide the loading screen
            this.loadingScreenElement.style.display = 'none';
            
            // Dispatch an event to notify that loading is complete
            const loadingCompleteEvent = new CustomEvent('loadingComplete', {
                detail: {
                    loadTime: ((Date.now() - this.startTime) / 1000).toFixed(1)
                }
            });
            window.dispatchEvent(loadingCompleteEvent);
        }
    }

    show() {
        if (this.loadingScreenElement) {
            this.loadingScreenElement.style.display = 'flex';
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}


(function () {
  if (window.game){
    return;
  }
  window.simulatedLoadingScreen = new SimulatedLoadingScreen(100, 1);
  window.simulatedLoadingScreen.start();
})();
