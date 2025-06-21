/**
 * TouchManager - Centralized touch event handling to prevent conflicts
 * Manages touch events for joystick, skills, and camera controls
 * Enhanced with iPhone Safari compatibility fixes
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
        
        // Track button protection zones
        this.buttonProtectionZones = new Set();
        
        // iPhone-specific touch state tracking
        this.touchStartTime = new Map();
        this.lastTouchEnd = 0;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        this.setupGlobalTouchHandlers();
        this.setupButtonProtection();
        this.startSafeCleanup();
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
            
            // Allow simultaneous touches for joystick and skills
            // This enables using joystick with one finger and skills with another
            if ((purpose === 'skills' && activePurpose === 'joystick') || 
                (purpose === 'joystick' && activePurpose === 'skills')) {
                continue;
            }
            
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
        
        // Track touch start time for iPhone compatibility
        this.touchStartTime.set(touchId, Date.now());
        
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
        
        // Clean up touch timing data
        this.touchStartTime.delete(touchId);
        this.lastTouchEnd = Date.now();
        
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
     * Check if a touch target is a UI button with iPhone-safe detection
     * @param {Touch} touch - The touch object
     * @returns {boolean} - True if touch is on a UI button
     */
    isTouchOnUIButton(touch) {
        try {
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!element) return false;
            
            // Check element and up to 3 parent levels (iPhone Safari sometimes has different element targeting)
            let current = element;
            let depth = 0;
            
            while (current && current !== document.body && depth < 3) {
                // Check for button elements
                if (current.tagName === 'BUTTON') {
                    console.debug('TouchManager: Touch on BUTTON element:', current.id || current.className);
                    return true;
                }
                
                // Check for button classes
                if (current.classList.contains('circle-btn') ||
                    current.classList.contains('btn') ||
                    current.classList.contains('button')) {
                    console.debug('TouchManager: Touch on button class:', current.id || current.className);
                    return true;
                }
                
                // Check for button IDs
                if (current.id && (
                    current.id.includes('button') || 
                    current.id.includes('btn') ||
                    current.id === 'inventory-teleport' ||
                    current.id === 'inventory-save'
                )) {
                    console.debug('TouchManager: Touch on button ID:', current.id);
                    return true;
                }
                
                // Check for specific UI containers
                if (current.id === 'top-right-container' ||
                    current.id === 'inventory-header' ||
                    current.classList.contains('ui-button-container')) {
                    console.debug('TouchManager: Touch on UI container:', current.id || current.className);
                    return true;
                }
                
                current = current.parentElement;
                depth++;
            }
            
            return false;
        } catch (error) {
            console.warn('TouchManager: Error detecting button touch:', error);
            return false;
        }
    }

    /**
     * Setup button protection with iPhone-specific handling
     */
    setupButtonProtection() {
        // Critical button selectors that must always work
        const criticalButtonSelectors = [
            '#inventory-button',
            '#inventory-teleport',
            '#inventory-save',
            '#home-button',
            '#skill-tree-button',
            '#skill-selection-button',
            '#map-selector-button',
            '.circle-btn'
        ];
        
        // Add protection for existing buttons
        criticalButtonSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => this.protectButton(element));
        });
        
        // Monitor for dynamically added buttons (with iPhone-safe observer)
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver((mutations) => {
                try {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                criticalButtonSelectors.forEach(selector => {
                                    try {
                                        if (node.matches && node.matches(selector)) {
                                            this.protectButton(node);
                                        }
                                        // Also check child elements
                                        const childButtons = node.querySelectorAll ? node.querySelectorAll(selector) : [];
                                        childButtons.forEach(button => this.protectButton(button));
                                    } catch (e) {
                                        // Ignore errors from invalid selectors on iPhone
                                    }
                                });
                            }
                        });
                    });
                } catch (error) {
                    console.warn('TouchManager: MutationObserver error:', error);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    
    /**
     * Protect a specific button element with iPhone-safe handlers
     * @param {Element} element - Button element to protect
     */
    protectButton(element) {
        if (this.buttonProtectionZones.has(element)) return; // Already protected
        
        this.buttonProtectionZones.add(element);
        
        // iPhone-safe touch handlers
        const touchStartHandler = (event) => {
            console.debug('TouchManager: Protected button touched:', element.id || element.className);
            
            // Clear any conflicting touches, but be gentle on iPhone
            if (this.hasActiveTouches()) {
                // Small delay to avoid interfering with natural touch flow on iPhone
                setTimeout(() => {
                    if (this.hasActiveTouches()) {
                        this.clearAllTouches();
                    }
                }, 50);
            }
        };
        
        const clickHandler = (event) => {
            console.debug('TouchManager: Protected button clicked:', element.id || element.className);
            // Clean up after click with iPhone-safe timing
            setTimeout(() => {
                if (this.hasActiveTouches()) {
                    this.clearAllTouches();
                }
            }, 100);
        };
        
        // Use passive listeners for better iPhone performance
        element.addEventListener('touchstart', touchStartHandler, { passive: true, capture: true });
        element.addEventListener('click', clickHandler, { passive: true });
    }

    /**
     * Setup global touch event handlers with iPhone compatibility
     */
    setupGlobalTouchHandlers() {
        // Global touch start handler with iPhone-safe button detection
        document.addEventListener('touchstart', (event) => {
            try {
                for (let i = 0; i < event.touches.length; i++) {
                    const touch = event.touches[i];
                    
                    // If touch is on a UI button, handle it carefully on iPhone
                    if (this.isTouchOnUIButton(touch)) {
                        console.debug('TouchManager: Touch detected on UI button');
                        
                        // On iPhone, be more conservative about clearing touches
                        if (this.hasActiveTouches() && this.isIOS) {
                            // Only clear if touches are old enough (avoid interfering with quick taps)
                            const now = Date.now();
                            if (now - this.lastTouchEnd > 100) {
                                console.debug('TouchManager: Clearing old touches for button interaction');
                                this.clearAllTouches();
                            }
                        } else if (this.hasActiveTouches() && !this.isIOS) {
                            // Non-iPhone: clear immediately as before
                            this.clearAllTouches();
                        }
                        continue;
                    }
                }
            } catch (error) {
                console.warn('TouchManager: Error in touchstart handler:', error);
            }
        }, { passive: true });
        
        // Global touch move handler
        document.addEventListener('touchmove', (event) => {
            try {
                for (let i = 0; i < event.touches.length; i++) {
                    const touch = event.touches[i];
                    
                    // Route to joystick handler
                    if (this.touchBelongsTo(touch, 'joystick') && this.handlers.joystick) {
                        // Don't prevent default for joystick to allow skill button touches
                        this.handlers.joystick.handleMove(touch);
                    }
                    
                    // Route to camera handler
                    if (this.touchBelongsTo(touch, 'camera') && this.handlers.camera) {
                        event.preventDefault();
                        this.handlers.camera.handleMove(touch);
                    }
                    
                    // Route to skills handler if implemented
                    if (this.touchBelongsTo(touch, 'skills') && this.handlers.skills) {
                        // Skills have their own event handlers, but we could route here if needed
                        // this.handlers.skills.handleMove(touch);
                    }
                }
            } catch (error) {
                console.warn('TouchManager: Error in touchmove handler:', error);
            }
        }, { passive: false });
        
        // Global touch end handler
        document.addEventListener('touchend', (event) => {
            try {
                for (let i = 0; i < event.changedTouches.length; i++) {
                    const touch = event.changedTouches[i];
                    
                    // Route to joystick handler
                    if (this.touchBelongsTo(touch, 'joystick') && this.handlers.joystick) {
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
            } catch (error) {
                console.warn('TouchManager: Error in touchend handler:', error);
            }
        });
        
        // Global touch cancel handler (important for iPhone)
        document.addEventListener('touchcancel', (event) => {
            try {
                console.debug('TouchManager: Touch cancel event (common on iPhone)');
                for (let i = 0; i < event.changedTouches.length; i++) {
                    const touch = event.changedTouches[i];
                    
                    // Route to joystick handler
                    if (this.touchBelongsTo(touch, 'joystick') && this.handlers.joystick) {
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
            } catch (error) {
                console.warn('TouchManager: Error in touchcancel handler:', error);
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
            skills: Array.from(this.activeTouches.skills),
            protectedButtons: this.buttonProtectionZones.size,
            hasActiveTouches: this.hasActiveTouches(),
            isIOS: this.isIOS,
            activeTouchCount: this.getActiveTouchCount()
        };
    }
    
    /**
     * Log comprehensive debug information
     */
    logDebugInfo() {
        const info = this.getDebugInfo();
        console.group('TouchManager Debug Info');
        console.log('Active Touches:', info);
        console.log('Protected Buttons:', info.protectedButtons);
        console.log('Has Active Touches:', info.hasActiveTouches);
        console.log('Is iOS Device:', info.isIOS);
        
        // List all protected button elements
        if (this.buttonProtectionZones.size > 0) {
            console.log('Protected Button Elements:');
            this.buttonProtectionZones.forEach(element => {
                console.log(`  - ${element.tagName}#${element.id || 'no-id'}.${element.className || 'no-class'}`);
            });
        }
        console.groupEnd();
    }
    
    /**
     * Clear all active touches - iPhone-safe version
     */
    clearAllTouches() {
        const hadActiveTouches = this.hasActiveTouches();
        
        console.debug('TouchManager: Clearing all active touches');
        this.activeTouches.joystick = null;
        this.activeTouches.camera = null;
        this.activeTouches.skills.clear();
        
        // Clear timing data
        this.touchStartTime.clear();
        this.lastTouchEnd = Date.now();
        
        // Notify handlers that their touches have been cleared
        try {
            if (this.handlers.joystick && this.handlers.joystick.handleClear) {
                this.handlers.joystick.handleClear();
            }
            if (this.handlers.camera && this.handlers.camera.handleClear) {
                this.handlers.camera.handleClear();
            }
            if (this.handlers.skills && this.handlers.skills.handleClear) {
                this.handlers.skills.handleClear();
            }
        } catch (error) {
            console.warn('TouchManager: Error notifying handlers of clear:', error);
        }
        
        // Show debug notification only in development
        if (hadActiveTouches && window.location.hostname === 'localhost') {
            this.showDebugNotification('Touches cleared for better button responsiveness');
        }
    }
    
    /**
     * Show a debug notification (only in development)
     * @param {string} message - Debug message to show
     */
    showDebugNotification(message) {
        if (window.location.hostname !== 'localhost') return;
        
        try {
            // Create a temporary debug notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 50px;
                right: 10px;
                background: rgba(255, 204, 0, 0.9);
                color: #000;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 9999;
                pointer-events: none;
                transition: opacity 0.3s ease;
            `;
            notification.textContent = `TouchManager: ${message}`;
            document.body.appendChild(notification);
            
            // Remove after 2 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 2000);
        } catch (error) {
            console.warn('TouchManager: Error showing debug notification:', error);
        }
    }
    
    /**
     * Force clear all touches and reset all handlers
     */
    forceReset() {
        console.debug('TouchManager: Force resetting all touch states');
        this.clearAllTouches();
        
        // Additional cleanup for edge cases
        setTimeout(() => {
            if (this.hasActiveTouches()) {
                console.debug('TouchManager: Secondary cleanup after force reset');
                this.activeTouches.joystick = null;
                this.activeTouches.camera = null;
                this.activeTouches.skills.clear();
                this.touchStartTime.clear();
            }
        }, 100);
    }
    
    /**
     * Manually refresh button protection (call after DOM changes)
     */
    refreshButtonProtection() {
        console.debug('TouchManager: Refreshing button protection');
        this.buttonProtectionZones.clear();
        
        const criticalButtonSelectors = [
            '#inventory-button',
            '#inventory-teleport',
            '#inventory-save',
            '#home-button',
            '#skill-tree-button',
            '#skill-selection-button',
            '#map-selector-button',
            '.circle-btn'
        ];
        
        criticalButtonSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => this.protectButton(element));
            } catch (error) {
                console.warn('TouchManager: Error refreshing protection for selector:', selector, error);
            }
        });
    }
    
    /**
     * Check if there are any active touches
     * @returns {boolean} - True if there are active touches
     */
    hasActiveTouches() {
        return this.activeTouches.joystick !== null || 
               this.activeTouches.camera !== null || 
               this.activeTouches.skills.size > 0;
    }
    
    /**
     * Get count of active touches
     * @returns {number} - Number of active touches
     */
    getActiveTouchCount() {
        let count = 0;
        if (this.activeTouches.joystick !== null) count++;
        if (this.activeTouches.camera !== null) count++;
        count += this.activeTouches.skills.size;
        return count;
    }
    
    /**
     * Safe cleanup with iPhone-specific considerations
     */
    startSafeCleanup() {
        // Conservative cleanup - only when really needed
        
        // Clear touches when page becomes visible (user returns to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.hasActiveTouches()) {
                console.debug('TouchManager: Page became visible, clearing stuck touches');
                // Small delay for iPhone compatibility
                setTimeout(() => this.clearAllTouches(), 100);
            }
        });
        
        // Clear touches when window loses focus (user switches apps)
        window.addEventListener('blur', () => {
            if (this.hasActiveTouches()) {
                console.debug('TouchManager: Window lost focus, clearing touches');
                this.clearAllTouches();
            }
        });
        
        // Clear touches when window regains focus
        window.addEventListener('focus', () => {
            if (this.hasActiveTouches()) {
                console.debug('TouchManager: Window regained focus, clearing touches');
                // Delay for iPhone Safari which can be quirky with focus events
                setTimeout(() => {
                    if (this.hasActiveTouches()) {
                        this.clearAllTouches();
                    }
                }, 200);
            }
        });
        
        // iPhone-specific: handle orientation change
        if (this.isIOS) {
            window.addEventListener('orientationchange', () => {
                console.debug('TouchManager: Orientation changed on iOS, clearing touches');
                setTimeout(() => {
                    if (this.hasActiveTouches()) {
                        this.clearAllTouches();
                    }
                }, 300); // iOS needs more time for orientation change
            });
        }
        
        // Periodic cleanup - but much more conservative than before
        setInterval(() => {
            // Only clean up if touches are really old (5+ seconds)
            const now = Date.now();
            let hasOldTouches = false;
            
            this.touchStartTime.forEach((startTime, touchId) => {
                if (now - startTime > 5000) { // 5 seconds
                    hasOldTouches = true;
                }
            });
            
            if (hasOldTouches && this.hasActiveTouches()) {
                console.debug('TouchManager: Cleaning up very old touches');
                this.clearAllTouches();
            }
        }, 10000); // Check every 10 seconds instead of 2
    }
}

// Export singleton instance
export const touchManager = new TouchManager();

// Make TouchManager available globally for debugging
if (typeof window !== 'undefined') {
    window.touchManager = touchManager;
    
    // Add global debug commands
    window.debugTouchManager = () => touchManager.logDebugInfo();
    window.clearTouches = () => touchManager.forceReset();
    window.refreshButtonProtection = () => touchManager.refreshButtonProtection();
    
    // Test button responsiveness
    window.testButtonResponsiveness = () => {
        console.log('Testing button responsiveness...');
        const buttons = document.querySelectorAll('.circle-btn');
        buttons.forEach((button, index) => {
            console.log(`Button ${index + 1}: ${button.id || button.className}`);
            console.log(`  - Pointer Events: ${getComputedStyle(button).pointerEvents}`);
            console.log(`  - Z-Index: ${getComputedStyle(button).zIndex}`);
            console.log(`  - Position: ${getComputedStyle(button).position}`);
            console.log(`  - Protected: ${touchManager.buttonProtectionZones.has(button)}`);
        });
    };
}