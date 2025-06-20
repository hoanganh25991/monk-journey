import { UIComponent } from '../UIComponent.js';
import { JOYSTICK } from '../config/input.js';
import { touchManager } from './TouchManager.js';

/**
 * Virtual Joystick UI component
 * Provides touch controls for mobile devices
 */
export class VirtualJoystickUI extends UIComponent {
    /**
     * Create a new VirtualJoystickUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('virtual-joystick-container', game);
        this.joystickBase = null;
        this.joystickHandle = null;
        this.joystickOverlay = null;
        
        // Initialize joystick state
        this.joystickState = {
            active: false,
            centerX: 0,
            centerY: 0,
            currentX: 0,
            currentY: 0,
            direction: { x: 0, y: 0 },
            touchId: null // Track which touch is controlling the joystick
        };
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Get joystick configuration from INPUT_CONFIG
        const joystickConfig = JOYSTICK;
        const sizeMultiplier = joystickConfig.sizeMultiplier;
        const baseSize = joystickConfig.baseSize;
        const handleSize = joystickConfig.handleSize;
        
        // Apply size multiplier to joystick container
        const scaledBaseSize = baseSize * sizeMultiplier;
        this.container.style.width = `${scaledBaseSize}px`;
        this.container.style.height = `${scaledBaseSize}px`;
        
        // Check if the overlay already exists and preserve it
        const existingOverlay = this.container.querySelector('#joystick-interaction-overlay');
        let overlayHTML = '';
        if (existingOverlay) {
            overlayHTML = existingOverlay.outerHTML;
            console.debug('Preserving existing joystick overlay element');
        } else {
            // Create overlay HTML if it doesn't exist
            overlayHTML = '<div id="joystick-interaction-overlay"></div>';
            console.debug('Creating joystick overlay element in template');
        }
        
        const template = `
            <div id="virtual-joystick-base"></div>
            <div id="virtual-joystick-handle" style="width: ${handleSize * sizeMultiplier}px; height: ${handleSize * sizeMultiplier}px;"></div>
            ${overlayHTML}
        `;
        
        // Render the template
        this.render(template);
        
        // Store references to elements we need to update
        this.joystickBase = document.getElementById('virtual-joystick-base');
        this.joystickHandle = document.getElementById('virtual-joystick-handle');
        
        // Set up touch event listeners directly on the joystick
        this.setupJoystickEvents();
        
        // Register with the touch manager
        touchManager.registerHandler('joystick', {
            handleMove: (touch) => this.handleJoystickMove(touch.clientX, touch.clientY),
            handleEnd: (touch) => this.handleJoystickEnd()
        });
        
        return true;
    }
    

    
    /**
     * Set up joystick event listeners
     */
    setupJoystickEvents() {
        // Create a larger invisible overlay for easier touch interaction
        this.createJoystickOverlay();
        
        // Touch start event on the larger overlay area
        this.joystickOverlay.addEventListener('touchstart', (event) => {
            // Don't prevent default to allow skill button touches
            // event.preventDefault();
            // Don't stop propagation to allow skill button touches
            // event.stopPropagation();
            
            // Only respond if joystick is not already active
            if (!this.joystickState.active) {
                const touch = event.touches[0];
                
                // Try to claim the touch through the touch manager
                if (touchManager.claimTouch(touch, 'joystick')) {
                    this.joystickState.touchId = touch.identifier;
                    this.handleJoystickStart(touch.clientX, touch.clientY);
                }
            }
        });
        
        // Mouse down event on the larger overlay area (for testing on desktop)
        this.joystickOverlay.addEventListener('mousedown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            // Only respond if joystick is not already active
            if (!this.joystickState.active) {
                this.handleJoystickStart(event.clientX, event.clientY);
                
                // Add global mouse move and up events
                document.addEventListener('mousemove', this.handleMouseMove);
                document.addEventListener('mouseup', this.handleMouseUp);
            }
        });
        
        // Mouse move handler (defined as property to allow removal)
        this.handleMouseMove = (event) => {
            event.preventDefault();
            if (this.joystickState.active) {
                this.handleJoystickMove(event.clientX, event.clientY);
            }
        };
        
        // Mouse up handler (defined as property to allow removal)
        this.handleMouseUp = (event) => {
            event.preventDefault();
            this.handleJoystickEnd();
            
            // Remove global mouse move and up events
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        };
    }
    
    /**
     * Create a larger invisible overlay for easier joystick interaction
     */
    createJoystickOverlay() {
        // The overlay should now always exist since we include it in the template
        this.joystickOverlay = this.container.querySelector('#joystick-interaction-overlay');
        
        if (!this.joystickOverlay) {
            // This should not happen now, but keep as a safety fallback
            console.warn('Joystick interaction overlay not found after template rendering, creating dynamically');
            this.joystickOverlay = document.createElement('div');
            this.joystickOverlay.id = 'joystick-interaction-overlay';
            // Apply the necessary CSS styles for the dynamically created overlay
            this.joystickOverlay.style.position = 'absolute';
            this.joystickOverlay.style.width = '240px';
            this.joystickOverlay.style.height = '240px';
            this.joystickOverlay.style.left = '50%';
            this.joystickOverlay.style.top = '50%';
            this.joystickOverlay.style.transform = 'translate(-50%, -50%)';
            this.joystickOverlay.style.backgroundColor = 'transparent';
            this.joystickOverlay.style.pointerEvents = 'auto';
            this.joystickOverlay.style.zIndex = '50';
            this.container.appendChild(this.joystickOverlay);
        } else {
            console.debug('Successfully found joystick interaction overlay element');
        }
    }
    

    
    /**
     * Handle joystick start event
     * @param {number} clientX - X position of touch/mouse
     * @param {number} clientY - Y position of touch/mouse
     */
    handleJoystickStart(clientX, clientY) {
        // Get joystick container position for center reference
        const rect = this.container.getBoundingClientRect();
        
        // Set joystick state - center is always the joystick's actual center
        this.joystickState.active = true;
        this.joystickState.centerX = rect.left + rect.width / 2;
        this.joystickState.centerY = rect.top + rect.height / 2;
        
        // Immediately position the joystick based on touch/click direction
        this.handleJoystickMove(clientX, clientY);
    }
    
    /**
     * Handle joystick move event
     * @param {number} clientX - X position of touch/mouse
     * @param {number} clientY - Y position of touch/mouse
     */
    handleJoystickMove(clientX, clientY) {
        if (!this.joystickState.active) return;
        
        // Calculate distance from center
        const deltaX = clientX - this.joystickState.centerX;
        const deltaY = clientY - this.joystickState.centerY;
        
        // Calculate distance
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Get joystick container radius
        const rect = this.container.getBoundingClientRect();
        const radius = rect.width / 2;
        
        // Limit distance to radius
        const limitedDistance = Math.min(distance, radius);
        
        // Calculate normalized direction
        const normalizedX = deltaX / distance;
        const normalizedY = deltaY / distance;
        
        // Calculate new position
        const newX = normalizedX * limitedDistance;
        const newY = normalizedY * limitedDistance;
        
        // Update joystick handle position
        this.joystickHandle.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px))`;
        
        // Update joystick state
        this.joystickState.currentX = newX;
        this.joystickState.currentY = newY;
        
        // Update direction (normalized)
        this.joystickState.direction = {
            x: newX / radius,
            y: newY / radius
        };
    }
    
    /**
     * Handle joystick end event
     */
    handleJoystickEnd() {
        // Reset joystick state
        this.joystickState.active = false;
        this.joystickState.direction = { x: 0, y: 0 };
        this.joystickState.touchId = null;
        
        // Reset joystick handle position
        this.joystickHandle.style.transform = 'translate(-50%, -50%)';
    }
    
    /**
     * Get the current joystick direction
     * @returns {Object} - Direction vector {x, y}
     */
    getJoystickDirection() {
        return this.joystickState.direction;
    }
    
    /**
     * Remove event listeners when component is disposed
     * Override from UIComponent
     */
    removeEventListeners() {
        // Remove mouse event listeners if they exist
        if (this.handleMouseMove && this.handleMouseUp) {
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        }
        
        // Only remove the joystick overlay if it was dynamically created
        // (not part of the original HTML structure)
        if (this.joystickOverlay && this.joystickOverlay.parentNode && 
            this.joystickOverlay.parentNode === this.container) {
            this.joystickOverlay.parentNode.removeChild(this.joystickOverlay);
        }
        
        // Note: Touch events are now handled by TouchManager globally
        // Individual component cleanup is not needed for touch events
    }
}