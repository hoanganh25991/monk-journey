import { UIComponent } from '../UIComponent.js';

/**
 * Map Selection UI component
 * Handles the map selector button and displays a coming soon modal
 */
export class MapSelectionUI extends UIComponent {
    /**
     * Create a new MapSelectionUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('map-selection-modal', game);
        this.mapSelectorButton = null;
        this.modal = null;
        this.okButton = null;
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        try {
            // Get references to DOM elements
            this.mapSelectorButton = document.getElementById('map-selector-button');
            this.modal = document.getElementById('map-selection-modal');
            this.okButton = document.getElementById('map-selection-ok-btn');
            
            if (!this.mapSelectorButton) {
                console.error('Map selector button not found');
                return false;
            }
            
            if (!this.modal) {
                console.error('Map selection modal not found');
                return false;
            }
            
            if (!this.okButton) {
                console.error('Map selection OK button not found');
                return false;
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initially hide the modal and ensure it doesn't block interactions
            this.forceHide();
            
            console.log('MapSelectionUI initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing MapSelectionUI:', error);
            return false;
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Map selector button click handler
        this.mapSelectorButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.showMapSelectionModal();
        });
        
        // OK button click handler
        this.okButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.hide();
        });
        
        // Modal overlay click handler (close modal when clicking outside)
        this.modal.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.hide();
            }
        });
        
        // Escape key handler
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }
    
    /**
     * Show the map selection modal
     */
    showMapSelectionModal() {
        console.log('Showing map selection modal');
        
        // Clear any stuck touches before showing modal
        // if (touchManager.hasActiveTouches()) {
        //     console.debug('MapSelectionUI: Clearing stuck touches before showing modal');
        //     touchManager.clearAllTouches(); // Removed TouchManager dependency
        // }
        
        this.show();
        
        // Focus the OK button for keyboard navigation
        setTimeout(() => {
            if (this.okButton) {
                this.okButton.focus();
            }
        }, 100);
    }
    
    /**
     * Show the modal
     */
    show() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.modal.style.visibility = 'visible';
            this.modal.style.pointerEvents = 'auto';
            // Add a slight delay to trigger CSS animations
            setTimeout(() => {
                this.modal.classList.add('show');
            }, 10);
        }
    }
    
    /**
     * Hide the modal
     */
    hide() {
        if (this.modal) {
            this.modal.classList.remove('show');
            // Immediately disable pointer events to prevent blocking
            this.modal.style.pointerEvents = 'none';
            
            // Clear any stuck touches when hiding modal
            // if (touchManager.hasActiveTouches()) {
            //     console.debug('MapSelectionUI: Clearing stuck touches after hiding modal');
            //     touchManager.clearAllTouches(); // Removed TouchManager dependency
            // }
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                this.modal.style.display = 'none';
                this.modal.style.visibility = 'hidden';
            }, 300);
        }
    }
    
    /**
     * Force hide the modal immediately without animation
     * Used during initialization to ensure modal doesn't block interactions
     */
    forceHide() {
        if (this.modal) {
            this.modal.classList.remove('show');
            this.modal.style.display = 'none';
            this.modal.style.visibility = 'hidden';
            this.modal.style.pointerEvents = 'none';
        }
    }
    
    /**
     * Check if the modal is visible
     * @returns {boolean} - True if modal is visible
     */
    isVisible() {
        if (!this.modal) return false;
        const computedStyle = window.getComputedStyle(this.modal);
        return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
    }
    
    /**
     * Update the component
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // No continuous updates needed for this component
    }
    
    /**
     * Cleanup the component
     */
    cleanup() {
        // Remove event listeners if needed
        if (this.mapSelectorButton) {
            this.mapSelectorButton.removeEventListener('click', this.showMapSelectionModal);
        }
        
        if (this.okButton) {
            this.okButton.removeEventListener('click', this.hide);
        }
        
        if (this.modal) {
            this.modal.removeEventListener('click', this.hide);
        }
        
        console.log('MapSelectionUI cleaned up');
    }
}