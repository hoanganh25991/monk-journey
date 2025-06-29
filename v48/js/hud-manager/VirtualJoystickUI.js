import { UIComponent } from '../UIComponent.js';
import { JOYSTICK } from '../config/input.js';

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
        
        const template = `
            <div id="virtual-joystick-base"></div>
            <div id="virtual-joystick-handle" style="width: ${handleSize * sizeMultiplier}px; height: ${handleSize * sizeMultiplier}px;"></div>
            <div id="joystick-overlay"></div>
        `;
        
        // Render the template
        this.render(template);
        
        // Store references to elements we need to update
        this.joystickBase = document.getElementById('virtual-joystick-base');
        this.joystickHandle = document.getElementById('virtual-joystick-handle');
        
        // Create a full-screen overlay for joystick input that only responds to the left half of the screen
        this.createJoystickOverlay();
        
        // Set up touch event listeners
        this.setupJoystickEvents();
        
        return true;
    }
    
    /**
     * Create a full-screen overlay for joystick input
     * This overlay will only respond to touch events on the left half of the screen
     */
    createJoystickOverlay() {
        // Create overlay element if it doesn't exist
        if (!document.getElementById('joystick-overlay')) {
            this.joystickOverlay = document.createElement('div');
            this.joystickOverlay.id = 'joystick-overlay';
            this.joystickOverlay.style.position = 'fixed';
            this.joystickOverlay.style.top = '0';
            this.joystickOverlay.style.left = '0';
            this.joystickOverlay.style.width = '50%'; // Only cover the left half of the screen
            this.joystickOverlay.style.height = '100%';
            this.joystickOverlay.style.zIndex = '150'; // Higher z-index to be above skill buttons but below modals
            this.joystickOverlay.style.pointerEvents = 'auto';
            this.joystickOverlay.style.touchAction = 'none';
            this.joystickOverlay.style.background = 'transparent'; // Make it invisible
            
            // Add to document body
            document.body.appendChild(this.joystickOverlay);
        } else {
            this.joystickOverlay = document.getElementById('joystick-overlay');
        }
    }
    
    /**
     * Set up joystick event listeners
     */
    setupJoystickEvents() {
        // Use the overlay for touch events instead of the joystick container
        // This allows the joystick to respond to touches anywhere on the left half of the screen
        
        // Touch start event on overlay
        this.joystickOverlay.addEventListener('touchstart', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            // Only respond if joystick is not already active
            if (!this.joystickState.active) {
                const touch = event.touches[0];
                // Only respond to touches on the left half of the screen
                if (this.isOnLeftHalfOfScreen(touch.clientX)) {
                    this.joystickState.touchId = touch.identifier;
                    this.handleJoystickStart(touch.clientX, touch.clientY);
                }
            }
        });
        
        // Mouse down event on overlay (for testing on desktop)
        this.joystickOverlay.addEventListener('mousedown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            // Only respond if joystick is not already active and click is on left half
            if (!this.joystickState.active && this.isOnLeftHalfOfScreen(event.clientX)) {
                this.handleJoystickStart(event.clientX, event.clientY);
                
                // Add global mouse move and up events
                document.addEventListener('mousemove', this.handleMouseMove);
                document.addEventListener('mouseup', this.handleMouseUp);
            }
        });
        
        // Touch move event on document (to ensure smooth movement even when finger moves outside overlay)
        document.addEventListener('touchmove', (event) => {
            if (this.joystickState.active && this.joystickState.touchId !== null) {
                // Find the touch that corresponds to our joystick
                for (let i = 0; i < event.touches.length; i++) {
                    if (event.touches[i].identifier === this.joystickState.touchId) {
                        event.preventDefault();
                        this.handleJoystickMove(event.touches[i].clientX, event.touches[i].clientY);
                        break;
                    }
                }
            }
        }, { passive: false });
        
        // Touch end event on document
        document.addEventListener('touchend', (event) => {
            if (this.joystickState.active && this.joystickState.touchId !== null) {
                // Check if our joystick touch ended
                for (let i = 0; i < event.changedTouches.length; i++) {
                    if (event.changedTouches[i].identifier === this.joystickState.touchId) {
                        event.preventDefault();
                        this.handleJoystickEnd();
                        break;
                    }
                }
            }
        });
        
        // Touch cancel event on document
        document.addEventListener('touchcancel', (event) => {
            if (this.joystickState.active && this.joystickState.touchId !== null) {
                // Check if our joystick touch was cancelled
                for (let i = 0; i < event.changedTouches.length; i++) {
                    if (event.changedTouches[i].identifier === this.joystickState.touchId) {
                        event.preventDefault();
                        this.handleJoystickEnd();
                        break;
                    }
                }
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
     * Check if a position is on the left half of the screen
     * @param {number} clientX - X position to check
     * @returns {boolean} - True if position is on left half of screen
     */
    isOnLeftHalfOfScreen(clientX) {
        return clientX < window.innerWidth / 2;
    }
    
    /**
     * Handle joystick start event
     * @param {number} clientX - X position of touch/mouse
     * @param {number} clientY - Y position of touch/mouse
     */
    handleJoystickStart(clientX, clientY) {
        // Get joystick container position
        const rect = this.container.getBoundingClientRect();
        
        // Set joystick state
        this.joystickState.active = true;
        this.joystickState.centerX = rect.left + rect.width / 2;
        this.joystickState.centerY = rect.top + rect.height / 2;
        
        // Update joystick position
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
        // Remove overlay event listeners
        if (this.joystickOverlay) {
            this.joystickOverlay.removeEventListener('touchstart', this.handleTouchStart);
            this.joystickOverlay.removeEventListener('mousedown', this.handleMouseDown);
            
            // Remove overlay from DOM
            if (this.joystickOverlay.parentNode) {
                this.joystickOverlay.parentNode.removeChild(this.joystickOverlay);
            }
        }
        
        // Remove document event listeners
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('touchcancel', this.handleTouchCancel);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }
}