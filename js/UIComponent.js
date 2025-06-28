/**
 * Base class for all UI components
 * Provides common functionality for UI components
 */
export class UIComponent {
    /** @type {String} */
    containerId;
    /** @type {HTMLElement} */
    container;
    /** @type {import('./game/Game.js').Game} */
    game;
    /** @type {HTMLElement} */
    element;
    /** @type {String} */
    originalDisplay;

    /**
     * Create a new UI component
     * @param {string} containerId - ID of the container element
     * @param {import('./game/Game.js').Game} game - Reference to the game instance
     */
    constructor(containerId, game) {
        this.containerId = containerId;
        this.game = game;
        this.element = document.getElementById(containerId);
        this.container = document.getElementById(containerId);
        this.originalDisplay = null; // Store original display property
        
        // Validate container exists
        if (!this.container) {
            console.error(`Container element with ID "${containerId}" not found. Creating it dynamically.`);
            this.container = document.createElement('div');
            this.container.id = containerId;
            // Add to UI container
            document.body.appendChild(this.container);
        }
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // To be implemented by child classes
        return true;
    }
    
    /**
     * Update the component
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // To be implemented by child classes
    }
    
    /**
     * Render the component using a template
     * @param {string} template - HTML template string
     * @param {boolean} append - Whether to append to container or replace content
     */
    render(template, append = false) {
        if (append) {
            this.container.innerHTML += template;
        } else {
            this.container.innerHTML = template;
        }
    }
    
    /**
     * Show the component
     */
    show() {
        if (this.originalDisplay) {
            // Restore the original display property if we have it stored
            this.container.style.display = this.originalDisplay;
            this.originalDisplay = null;
        } else {
            // Otherwise, just remove the display property to use CSS default
            this.container.style.removeProperty('display');
        }
    }
    
    /**
     * Hide the component
     */
    hide() {
        // Store the current display property before hiding
        if (this.container.style.display && this.container.style.display !== 'none') {
            this.originalDisplay = this.container.style.display;
        } else if (!this.originalDisplay) {
            // If no inline style, get computed style
            const computedStyle = window.getComputedStyle(this.container);
            this.originalDisplay = computedStyle.display !== 'none' ? computedStyle.display : null;
        }
        
        // Hide the component
        this.container.style.display = 'none';
    }
    
    /**
     * Toggle the component visibility
     * @returns {boolean} - New visibility state (true = visible)
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
        return this.visible;
    }

    /**
     * Set the display type explicitly
     * @param {string} displayType - CSS display property value (e.g., 'flex', 'block', 'grid')
     */
    setDisplayType(displayType) {
        this.container.style.display = displayType;
        // Update original display if component is visible
        if (this.visible) {
            this.originalDisplay = displayType;
        }
    }
    
    get visible() {
        return this.container.style.display !== 'none';
    }

    get mobile() {
        return window.innerHeight <= 500;
    }

    /**
     * Clean up the component and remove it from the DOM
     * @param {boolean} removeFromDOM - Whether to remove the container element from the DOM (default: true)
     */
    dispose(removeFromDOM = true) {
        // Remove all event listeners (to be implemented by child classes)
        this.removeEventListeners();
        
        // Clear any references to DOM elements
        if (removeFromDOM && this.container) {
            // Remove the container from the DOM
            if (this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        }
        
        // Clear references to prevent memory leaks
        this.container = null;
        this.element = null;
        this.originalDisplay = null;
        
        // Clear game reference if it exists
        if (this.game) {
            // Don't set game to null as it might be needed by child classes
            // Just note that we're no longer using it
            console.debug(`Component ${this.containerId} disposed`);
        }
    }
    
    /**
     * Remove event listeners - to be implemented by child classes
     * This is a placeholder method that child classes should override
     */
    removeEventListeners() {
        // To be implemented by child classes
        // Example implementation in child class:
        // this.container.removeEventListener('click', this.handleClick);
    }
}