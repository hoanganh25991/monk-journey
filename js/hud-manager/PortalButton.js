import { UIComponent } from '../UIComponent.js';

/**
 * Portal Button UI component
 * Shows a portal interaction button when player is near a portal
 */
export class PortalButton extends UIComponent {
    /**
     * Create a new PortalButton component
     * @param {import("../game/Game.js").Game} game - Reference to the game instance
     */
    constructor(game) {
        super('portal-button-container', game);
        
        this.portalButton = null;
        this.isVisible = false;
        this.nearbyPortal = null;
        
        // Check interval for portal proximity
        this.checkInterval = null;
        this.checkIntervalMs = 100; // Check every 100ms
        
        console.debug("PortalButton initialized");
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    async init() {
        // Get reference to the portal button element
        this.portalButton = document.getElementById('portal-button');
        
        if (!this.portalButton) {
            console.error('Portal button element not found in HTML');
            return false;
        }
        
        // Set up event listeners
        this.setupPortalButtonEvents();
        
        // Hide button initially
        this.hideButton();
        
        // Start checking for nearby portals
        this.startProximityCheck();
        
        return true;
    }
    
    /**
     * Set up portal button event listeners
     */
    setupPortalButtonEvents() {
        if (!this.portalButton) return;
        
        // Touch event for portal button
        this.portalButton.addEventListener('touchend', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.handlePortalInteraction();
        });
        
        // Mouse event for portal button (for desktop testing)
        this.portalButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.handlePortalInteraction();
        });
        
        console.debug('Portal button event listeners set up');
    }
    
    /**
     * Handle portal interaction when button is clicked
     */
    handlePortalInteraction() {
        if (!this.nearbyPortal) {
            console.warn('No nearby portal available for interaction');
            return;
        }
        
        // Skip if no active portal or on cooldown
        const teleportManager = this.game?.world?.teleportManager;
        if (!teleportManager) {
            console.warn('TeleportManager not available');
            return;
        }
        
        console.debug('Portal button clicked - triggering portal interaction');
        
        // Check cooldown
        if (Date.now() - teleportManager.lastTeleportTime < teleportManager.teleportCooldown) {
            console.debug('Portal interaction on cooldown');
            return;
        }
        
        // Validate portal has required properties before teleporting
        // Get sourcePosition from either sourcePosition or position property
        const sourcePosition = this.nearbyPortal.sourcePosition || this.nearbyPortal.position;
        if (!sourcePosition || !this.nearbyPortal.targetPosition) {
            console.warn('Cannot teleport: portal is missing source or target position');
            return;
        }
        
        // Ensure the portal has a sourcePosition property (required by teleportPlayer)
        if (!this.nearbyPortal.sourcePosition) {
            this.nearbyPortal.sourcePosition = sourcePosition;
        }
        
        // Ensure the portal has a sourceName property (required by teleportPlayer)
        if (!this.nearbyPortal.sourceName && this.nearbyPortal.name) {
            this.nearbyPortal.sourceName = this.nearbyPortal.name;
        }
        
        // Set the active portal for the teleport manager (needed for its teleport logic)
        teleportManager.activePortal = this.nearbyPortal;
        
        // Log the active portal details for debugging
        console.debug('PortalButton: Setting active portal:', {
            name: this.nearbyPortal.sourceName || this.nearbyPortal.name,
            multiplier: this.nearbyPortal.multiplier,
            difficulty: this.nearbyPortal.difficulty
        });
        
        // Use the teleport manager's existing teleport logic
        if (this.game.player) {
            teleportManager.teleportPlayer(this.nearbyPortal, this.game.player);
        } else {
            console.warn('Cannot teleport: no valid player found');
        }
    }
    
    /**
     * Start checking for nearby portals
     */
    startProximityCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        this.checkInterval = setInterval(() => {
            this.checkPortalProximity();
        }, this.checkIntervalMs);
        
        console.debug('Started portal proximity checking');
    }
    
    /**
     * Stop checking for nearby portals
     */
    stopProximityCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
        console.debug('Stopped portal proximity checking');
    }
    
    /**
     * Check if player is near any portal
     */
    checkPortalProximity() {
        // Skip if game is not ready
        if (!this.game?.player?.getPosition || !this.game?.world?.teleportManager) {
            return;
        }
        
        try {
            const playerPosition = this.game.player.getPosition();
            const teleportManager = this.game.world.teleportManager;
            const portals = teleportManager.getPortals();
            
            // Debug: Log the number of portals
            console.debug(`Found ${portals.length} portals in total`);
            
            // Check if any portal is within interaction range
            let closestPortal = null;
            let closestDistance = teleportManager.interactionRadius || 4;
            let validPortalCount = 0;
            
            for (const portal of portals) {
                // Check portal properties
                if (!portal.position) {
                    console.debug(`Portal ${portal.id || 'unknown'} missing position property`);
                    continue;
                }
                
                // For now, we'll only check for position property to show the button
                // We'll validate sourcePosition and targetPosition when the button is clicked
                const portalPos = portal.position;
                const distance = Math.sqrt(
                    Math.pow(playerPosition.x - portalPos.x, 2) + 
                    Math.pow(playerPosition.z - portalPos.z, 2)
                );
                
                validPortalCount++;
                
                if (distance < closestDistance) {
                    closestPortal = portal;
                    closestDistance = distance;
                    console.debug(`Found nearby portal: ${portal.sourceName || portal.name || 'unknown'} at distance ${distance.toFixed(2)}`);
                }
            }
            
            // Debug: Log the number of valid portals
            console.debug(`Found ${validPortalCount} valid portals with position property`);
            
            
            // Update button visibility and nearby portal
            if (closestPortal && closestPortal !== this.nearbyPortal) {
                this.nearbyPortal = closestPortal;
                this.showButton();
                console.debug(`Near portal: ${closestPortal.name || 'Unknown'} (distance: ${closestDistance.toFixed(1)})`);
            } else if (!closestPortal && this.nearbyPortal) {
                this.nearbyPortal = null;
                this.hideButton();
                console.debug('No longer near any portal');
            }
            
        } catch (error) {
            console.warn('Error checking portal proximity:', error);
        }
    }
    
    /**
     * Show the portal button
     */
    showButton() {
        if (!this.portalButton || this.isVisible) return;
        
        this.portalButton.style.display = 'block';
        this.isVisible = true;
        
        // Update button text/icon based on nearby portal
        if (this.nearbyPortal) {
            const iconElement = this.portalButton.querySelector('.portal-icon');
            if (iconElement) {
                // Use the spiral emoji with proper centering
                iconElement.textContent = '𖣐';
                
                // Remove CSS-spiral class if it was previously added
                iconElement.classList.remove('css-spiral');
            }
            
            this.portalButton.title = `Enter portal: ${this.nearbyPortal.name || 'Unknown destination'}`;
        }
        
        console.debug('Portal button shown');
    }
    
    /**
     * Hide the portal button
     */
    hideButton() {
        if (!this.portalButton || !this.isVisible) return;
        
        this.portalButton.style.display = 'none';
        this.isVisible = false;
        
        console.debug('Portal button hidden');
    }
    
    /**
     * Clean up when component is destroyed
     */
    cleanup() {
        this.stopProximityCheck();
        
        if (this.portalButton) {
            this.portalButton.removeEventListener('touchend', this.handlePortalInteraction);
            this.portalButton.removeEventListener('click', this.handlePortalInteraction);
        }
        
        console.debug('PortalButton cleaned up');
    }
}