/**
 * TouchManager - Centralized touch event handling to prevent conflicts
 * Manages touch events for joystick, skills, and camera controls
 */
export class TouchManager {
    constructor() {
        // Track active touches by their purpose
        this.activeTouches = {
            joystick: null,
            camera: null,
            skills: new Set() // Multiple skills can be touched at once
        };
        
        // Registered handlers for different touch types
        this.handlers = {
            joystick: null,
            camera: null,
            skills: null
        };
        
        this.setupGlobalTouchHandlers();
    }
    
    /**
     * Register a handler for a specific touch type
     * @param {string} type - Type of touch handler (joystick, camera, skills)
     * @param {Object} handler - Handler object with methods
     */
    registerHandler(type, handler) {
        this.handlers[type] = handler;
    }
    
    /**
     * Check if a touch is available for a specific purpose
     * @param {Touch} touch - The touch object
     * @param {string} purpose - The purpose (joystick, camera, skills)
     * @returns {boolean} - True if touch is available
     */
    isTouchAvailable(touch, purpose) {
        const touchId = touch.identifier;
        
        // Check if this touch is already claimed by another purpose
        for (const [activePurpose, activeTouch] of Object.entries(this.activeTouches)) {
            if (activePurpose === purpose) continue;
            
            if (activePurpose === 'skills') {
                if (activeTouch.has(touchId)) return false;
            } else {
                if (activeTouch === touchId) return false;
            }
        }
        
        return true;
    }
    
    /**
     * Claim a touch for a specific purpose
     * @param {Touch} touch - The touch object
     * @param {string} purpose - The purpose (joystick, camera, skills)
     * @returns {boolean} - True if successfully claimed
     */
    claimTouch(touch, purpose) {
        const touchId = touch.identifier;
        
        if (!this.isTouchAvailable(touch, purpose)) {
            return false;
        }
        
        if (purpose === 'skills') {
            this.activeTouches.skills.add(touchId);
        } else {
            this.activeTouches[purpose] = touchId;
        }
        
        return true;
    }
    
    /**
     * Release a touch from a specific purpose
     * @param {Touch} touch - The touch object
     * @param {string} purpose - The purpose (joystick, camera, skills)
     */
    releaseTouch(touch, purpose) {
        const touchId = touch.identifier;
        
        if (purpose === 'skills') {
            this.activeTouches.skills.delete(touchId);
        } else {
            if (this.activeTouches[purpose] === touchId) {
                this.activeTouches[purpose] = null;
            }
        }
    }
    
    /**
     * Check if a touch belongs to a specific purpose
     * @param {Touch} touch - The touch object
     * @param {string} purpose - The purpose to check
     * @returns {boolean} - True if touch belongs to this purpose
     */
    touchBelongsTo(touch, purpose) {
        const touchId = touch.identifier;
        
        if (purpose === 'skills') {
            return this.activeTouches.skills.has(touchId);
        } else {
            return this.activeTouches[purpose] === touchId;
        }
    }
    
    /**
     * Setup global touch event handlers that route to appropriate handlers
     */
    setupGlobalTouchHandlers() {
        // Global touch move handler
        document.addEventListener('touchmove', (event) => {
            for (let i = 0; i < event.touches.length; i++) {
                const touch = event.touches[i];
                
                // Route to joystick handler
                if (this.touchBelongsTo(touch, 'joystick') && this.handlers.joystick) {
                    event.preventDefault();
                    this.handlers.joystick.handleMove(touch);
                }
                
                // Route to camera handler
                if (this.touchBelongsTo(touch, 'camera') && this.handlers.camera) {
                    event.preventDefault();
                    this.handlers.camera.handleMove(touch);
                }
            }
        }, { passive: false });
        
        // Global touch end handler
        document.addEventListener('touchend', (event) => {
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                
                // Route to joystick handler
                if (this.touchBelongsTo(touch, 'joystick') && this.handlers.joystick) {
                    event.preventDefault();
                    this.handlers.joystick.handleEnd(touch);
                    this.releaseTouch(touch, 'joystick');
                }
                
                // Route to camera handler
                if (this.touchBelongsTo(touch, 'camera') && this.handlers.camera) {
                    event.preventDefault();
                    this.handlers.camera.handleEnd(touch);
                    this.releaseTouch(touch, 'camera');
                }
                
                // Route to skills handler (handled individually by skill buttons)
                if (this.touchBelongsTo(touch, 'skills')) {
                    this.releaseTouch(touch, 'skills');
                }
            }
        });
        
        // Global touch cancel handler
        document.addEventListener('touchcancel', (event) => {
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                
                // Route to joystick handler
                if (this.touchBelongsTo(touch, 'joystick') && this.handlers.joystick) {
                    event.preventDefault();
                    this.handlers.joystick.handleEnd(touch);
                    this.releaseTouch(touch, 'joystick');
                }
                
                // Route to camera handler
                if (this.touchBelongsTo(touch, 'camera') && this.handlers.camera) {
                    event.preventDefault();
                    this.handlers.camera.handleEnd(touch);
                    this.releaseTouch(touch, 'camera');
                }
                
                // Route to skills handler
                if (this.touchBelongsTo(touch, 'skills')) {
                    this.releaseTouch(touch, 'skills');
                }
            }
        });
    }
    
    /**
     * Get debug information about active touches
     * @returns {Object} - Debug information
     */
    getDebugInfo() {
        return {
            joystick: this.activeTouches.joystick,
            camera: this.activeTouches.camera,
            skills: Array.from(this.activeTouches.skills)
        };
    }
}

// Export singleton instance
export const touchManager = new TouchManager();