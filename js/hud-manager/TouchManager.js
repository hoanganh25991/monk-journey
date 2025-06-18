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
            
            // Always allow simultaneous touches for joystick and skills
            // This enables using joystick with one finger and skills with another
            if ((purpose === 'skills' && activePurpose === 'joystick') || 
                (purpose === 'joystick' && activePurpose === 'skills')) {
                continue;
            }
            
            // Check if this touch ID is already being used
            if (activePurpose === 'skills') {
                if (activeTouch && activeTouch.has(touchId)) return false;
            } else {
                if (activeTouch === touchId) return false;
            }
        }
        
        // If we're trying to claim for skills, always allow it
        if (purpose === 'skills') {
            return true;
        }
        
        // If we're trying to claim for joystick and it's already active, don't allow
        if (purpose === 'joystick' && this.activeTouches.joystick !== null) {
            return false;
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
            console.debug(`Released touch ${touchId} from skills`);
        } else {
            if (this.activeTouches[purpose] === touchId) {
                this.activeTouches[purpose] = null;
                console.debug(`Released touch ${touchId} from ${purpose}`);
            }
        }
        
        // Notify handlers if they have a handleRelease method
        if (purpose === 'skills' && this.handlers.skills && this.handlers.skills.handleRelease) {
            this.handlers.skills.handleRelease(touch);
        }
    }
    
    /**
     * Force release all touches for a specific purpose
     * @param {string} purpose - The purpose (joystick, camera, skills)
     */
    releaseAllTouches(purpose) {
        if (purpose === 'skills') {
            this.activeTouches.skills.clear();
        } else {
            this.activeTouches[purpose] = null;
        }
        console.debug(`Released all touches for ${purpose}`);
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
            let handledByCamera = false;
            
            for (let i = 0; i < event.touches.length; i++) {
                const touch = event.touches[i];
                
                // Route to joystick handler
                if (this.touchBelongsTo(touch, 'joystick') && this.handlers.joystick) {
                    this.handlers.joystick.handleMove(touch);
                }
                
                // Route to camera handler
                if (this.touchBelongsTo(touch, 'camera') && this.handlers.camera) {
                    this.handlers.camera.handleMove(touch);
                    handledByCamera = true;
                }
                
                // Skills have their own event handlers in SkillsUI.js
            }
            
            // Only prevent default if camera is being used
            // This allows other touch interactions to work normally
            if (handledByCamera) {
                event.preventDefault();
            }
        }, { passive: false });
        
        // Global touch end handler
        document.addEventListener('touchend', (event) => {
            // First, check if we have any touches left
            const hasRemainingTouches = event.touches.length > 0;
            
            // Process each ended touch
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                
                // Route to joystick handler
                if (this.touchBelongsTo(touch, 'joystick') && this.handlers.joystick) {
                    this.handlers.joystick.handleEnd(touch);
                    this.releaseTouch(touch, 'joystick');
                }
                
                // Route to camera handler
                if (this.touchBelongsTo(touch, 'camera') && this.handlers.camera) {
                    this.handlers.camera.handleEnd(touch);
                    this.releaseTouch(touch, 'camera');
                }
                
                // Route to skills handler (handled individually by skill buttons)
                if (this.touchBelongsTo(touch, 'skills')) {
                    this.releaseTouch(touch, 'skills');
                }
            }
            
            // If no touches remain, ensure all touch tracking is reset
            if (!hasRemainingTouches) {
                console.debug('No touches remain, releasing all touch tracking');
                
                // If handlers have a handleAllReleased method, call it
                if (this.handlers.joystick && this.handlers.joystick.handleAllReleased) {
                    this.handlers.joystick.handleAllReleased();
                }
                
                if (this.handlers.skills && this.handlers.skills.handleAllReleased) {
                    this.handlers.skills.handleAllReleased();
                }
                
                // Reset all touch tracking
                this.activeTouches.joystick = null;
                this.activeTouches.camera = null;
                this.activeTouches.skills.clear();
            }
        }, { passive: true });
        
        // Global touch cancel handler
        document.addEventListener('touchcancel', (event) => {
            console.debug('Touch cancel event received');
            
            // Process each cancelled touch
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                
                // Route to joystick handler
                if (this.touchBelongsTo(touch, 'joystick') && this.handlers.joystick) {
                    this.handlers.joystick.handleEnd(touch);
                    this.releaseTouch(touch, 'joystick');
                }
                
                // Route to camera handler
                if (this.touchBelongsTo(touch, 'camera') && this.handlers.camera) {
                    this.handlers.camera.handleEnd(touch);
                    this.releaseTouch(touch, 'camera');
                }
                
                // Route to skills handler
                if (this.touchBelongsTo(touch, 'skills')) {
                    this.releaseTouch(touch, 'skills');
                }
            }
            
            // On touch cancel, we should reset all touch tracking to be safe
            console.debug('Touch cancel: releasing all touch tracking');
            
            // If handlers have a handleAllReleased method, call it
            if (this.handlers.joystick && this.handlers.joystick.handleAllReleased) {
                this.handlers.joystick.handleAllReleased();
            }
            
            if (this.handlers.skills && this.handlers.skills.handleAllReleased) {
                this.handlers.skills.handleAllReleased();
            }
            
            // Reset all touch tracking
            this.activeTouches.joystick = null;
            this.activeTouches.camera = null;
            this.activeTouches.skills.clear();
        }, { passive: true });
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