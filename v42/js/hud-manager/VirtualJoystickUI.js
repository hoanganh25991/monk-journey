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
        
        // Initialize joystick state
        this.joystickState = {
            active: false,
            centerX: 0,
            centerY: 0,
            currentX: 0,
            currentY: 0,
            direction: { x: 0, y: 0 }
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
        `;
        
        // Render the template
        this.render(template);
        
        // Store references to elements we need to update
        this.joystickBase = document.getElementById('virtual-joystick-base');
        this.joystickHandle = document.getElementById('virtual-joystick-handle');
        
        // Set up touch event listeners
        this.setupJoystickEvents();
        
        return true;
    }
    
    /**
     * Set up joystick event listeners
     */
    setupJoystickEvents() {
        // Touch start event
        this.container.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.handleJoystickStart(event.touches[0].clientX, event.touches[0].clientY);
        });
        
        // Mouse down event (for testing on desktop)
        this.container.addEventListener('mousedown', (event) => {
            event.preventDefault();
            this.handleJoystickStart(event.clientX, event.clientY);
            
            // Add global mouse move and up events
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        });
        
        // Touch move event
        this.container.addEventListener('touchmove', (event) => {
            event.preventDefault();
            if (this.joystickState.active) {
                this.handleJoystickMove(event.touches[0].clientX, event.touches[0].clientY);
            }
        });
        
        // Touch end event
        this.container.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.handleJoystickEnd();
        });
        
        // Touch cancel event
        this.container.addEventListener('touchcancel', (event) => {
            event.preventDefault();
            this.handleJoystickEnd();
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
}